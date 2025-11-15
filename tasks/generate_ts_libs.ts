// tasks/generate_ts_libs.ts
import { generateBasePackage, TypeResolutionContext } from "./ts_generator.ts";

// Get output directory from command line args, default to ./generated/
const outputDir = Deno.args[0] || "./generated";

const bmmVersions = JSON.parse(
  await Deno.readTextFile("./tasks/bmm_versions.json"),
);
const bmmDependencies = JSON.parse(
  await Deno.readTextFile("./tasks/bmm_dependencies.json"),
);

// Ensure output directory exists
try {
  await Deno.mkdir(outputDir, { recursive: true });
} catch {
  // Directory might already exist, that's fine
}

// Topological sort to determine correct processing order
function topologicalSort(
  packages: string[],
  dependencies: { [key: string]: string[] },
): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(pkg: string) {
    if (visited.has(pkg)) return;
    if (visiting.has(pkg)) {
      throw new Error(`Circular dependency detected involving ${pkg}`);
    }

    visiting.add(pkg);
    const deps = dependencies[pkg] || [];

    // Visit dependencies first (but map from full name to package short name)
    for (const dep of deps) {
      // dep is like "openehr_base_1.3.0", we need to find matching package
      const depPackage = packages.find((p) => {
        const url = bmmVersions[p];
        return url.includes(dep);
      });
      if (depPackage) {
        visit(depPackage);
      }
    }

    visiting.delete(pkg);
    visited.add(pkg);
    sorted.push(pkg);
  }

  for (const pkg of packages) {
    visit(pkg);
  }

  return sorted;
}

// Get all package names and sort them by dependencies
const packageNames = Object.keys(bmmVersions);
const sortedPackages = topologicalSort(packageNames, bmmDependencies);

console.log("Output directory:", outputDir);
console.log(
  "Processing packages in dependency order:",
  sortedPackages.join(" -> "),
);

// Map to store schema info and types for each package
const schemaInfo: { [key: string]: { schemaName: string; rmRelease: string } } =
  {};
const packageTypes: { [key: string]: Set<string> } = {};

// Function to extract all type names from a BMM model
// deno-lint-ignore no-explicit-any
function extractTypes(bmmModel: any): Set<string> {
  const types = new Set<string>();

  if (bmmModel.primitive_types) {
    for (const typeName in bmmModel.primitive_types) {
      types.add(bmmModel.primitive_types[typeName].name);
    }
  }

  if (bmmModel.class_definitions) {
    for (const className in bmmModel.class_definitions) {
      types.add(bmmModel.class_definitions[className].name);
    }
  }

  return types;
}

for (const packageName of sortedPackages) {
  const url = bmmVersions[packageName];
  console.log(`\nGenerating ${packageName}...`);

  const response = await fetch(url);
  const bmmJson = await response.text();
  const bmmModel = JSON.parse(bmmJson);

  // Store schema info for this package
  schemaInfo[packageName] = {
    schemaName: bmmModel.schema_name,
    rmRelease: bmmModel.rm_release,
  };

  // Extract and store types from this package
  const types = extractTypes(bmmModel);
  packageTypes[packageName] = types;

  // Build TypeResolutionContext
  const localTypes = types;
  const importedPackages: { [alias: string]: Set<string> } = {};

  // Generate import statements based on dependencies
  let imports = "";
  const deps = bmmDependencies[packageName] || [];

  // Always import openehr_base for non-base packages to access primitive wrappers
  // (String, Integer, Boolean, etc.) even if not explicitly listed in BMM includes
  if (packageName !== "openehr_base") {
    imports += `import * as openehr_base from "./openehr_base.ts";\n`;
    importedPackages["openehr_base"] = packageTypes["openehr_base"] ||
      new Set();
  }

  for (const dep of deps) {
    // Find which package this dependency refers to
    const depPackage = packageNames.find((p) => {
      const info = schemaInfo[p];
      if (info) {
        return `openehr_${info.schemaName}_${info.rmRelease}` === dep;
      }
      return false;
    });

    // Skip if already added (e.g., openehr_base was added above)
    if (depPackage && depPackage !== "openehr_base") {
      imports += `import * as ${depPackage} from "./${depPackage}.ts";\n`;
      // Add imported types to context
      importedPackages[depPackage] = packageTypes[depPackage] || new Set();
    }
  }

  if (imports) {
    imports += "\n";
  }

  const context: TypeResolutionContext = {
    localTypes,
    importedPackages,
  };

  // Generate header comment with source information
  const header =
    `// Generated from BMM schema: ${bmmModel.schema_name} v${bmmModel.rm_release}
// BMM Version: ${bmmModel.bmm_version || "unknown"}
// Schema Revision: ${bmmModel.schema_revision || "unknown"}
// Description: ${bmmModel.schema_description || "No description"}
// Source: ${url}
// Generated: ${new Date().toISOString()}
// 
// ⚠️ WARNING: This file was automatically generated from openEHR BMM (Basic Meta-Model) specifications.
// 
// DO NOT EDIT THIS FILE DIRECTLY!
// - This file will be overwritten when the generator is run again
// - All enhancements should be made in the /enhanced directory
// - See /enhanced/README.md for the proper workflow
//
// This generated code serves as a baseline for comparison when updating BMM versions.
// To update the library to a new BMM version, see the "Updating to a New BMM Version" 
// section in the main README.md for the complete workflow.
//
// For more information about openEHR specifications, visit: https://specifications.openehr.org/

`;

  const tsPackage = generateBasePackage(bmmModel, context);
  const fullContent = header + imports + tsPackage;
  const fileName = `${packageName}.ts`;
  const outputPath = `${outputDir}/${fileName}`;
  await Deno.writeTextFile(outputPath, fullContent);
  console.log(`Generated ${outputPath}`);
}

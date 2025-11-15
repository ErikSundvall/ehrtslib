// tasks/extract_dependencies.ts
// Script to extract inter-package dependencies from BMM JSON files

export {};

const bmmVersions = JSON.parse(
  await Deno.readTextFile("./tasks/bmm_versions.json"),
);

interface DependencyMap {
  [packageName: string]: string[];
}

const dependencies: DependencyMap = {};

console.log("Extracting dependencies from BMM files...\n");

for (const packageName in bmmVersions) {
  const url = bmmVersions[packageName];
  console.log(`Fetching ${packageName} from ${url}...`);

  const response = await fetch(url);
  const bmmJson = await response.text();
  const bmmModel = JSON.parse(bmmJson);

  // Extract schema name and version for the full package identifier
  const schemaName = bmmModel.schema_name;
  const rmRelease = bmmModel.rm_release;
  const fullPackageName = `openehr_${schemaName}_${rmRelease}`;

  // Extract includes field if it exists
  const includes = bmmModel.includes || {};
  const packageDeps: string[] = [];

  for (const depKey in includes) {
    // depKey is typically in format like "openehr_base_1.3.0"
    packageDeps.push(depKey);
  }

  dependencies[packageName] = packageDeps;
  console.log(
    `  ${packageName} depends on: ${
      packageDeps.length > 0 ? packageDeps.join(", ") : "none"
    }`,
  );
}

// Write to bmm_dependencies.json
const outputPath = "./tasks/bmm_dependencies.json";
await Deno.writeTextFile(outputPath, JSON.stringify(dependencies, null, 2));

console.log(`\nDependency map written to ${outputPath}`);
console.log("\nDependency summary:");
console.log(JSON.stringify(dependencies, null, 2));

// tasks/compare_bmm_versions.ts
//
// Utility to compare two versions of a BMM file and report changes.
// This helps identify what needs to be updated in enhanced implementations
// when a new BMM version is released.
//
// Usage:
//   deno run --allow-read --allow-net tasks/compare_bmm_versions.ts <package_name> [old_url] [new_url]
//
// Examples:
//   # Compare current vs newly generated (uses bmm_versions.json)
//   deno run --allow-read --allow-net tasks/compare_bmm_versions.ts openehr_base
//
//   # Compare specific versions
//   deno run --allow-read --allow-net tasks/compare_bmm_versions.ts openehr_base \
//     https://.../openehr_base_1.2.0.bmm.json \
//     https://.../openehr_base_1.3.0.bmm.json

interface BmmClass {
  name: string;
  ancestors?: string[];
  is_abstract?: boolean;
  properties?: { [key: string]: any };
  functions?: { [key: string]: any };
}

interface BmmModel {
  schema_name: string;
  rm_release: string;
  class_definitions?: { [key: string]: BmmClass };
  primitive_types?: { [key: string]: any };
}

interface ClassComparison {
  added: string[];
  removed: string[];
  unchanged: string[];
  modified: Array<{
    className: string;
    addedProperties: string[];
    removedProperties: string[];
    modifiedProperties: string[];
    addedMethods: string[];
    removedMethods: string[];
    modifiedMethods: string[];
  }>;
}

async function fetchBmmModel(url: string): Promise<BmmModel> {
  const response = await fetch(url);
  const json = await response.text();
  return JSON.parse(json);
}

function extractClassInfo(model: BmmModel): Map<string, BmmClass> {
  const classes = new Map<string, BmmClass>();

  if (model.class_definitions) {
    for (const [name, classDef] of Object.entries(model.class_definitions)) {
      classes.set(name, classDef);
    }
  }

  return classes;
}

function compareClasses(
  oldModel: BmmModel,
  newModel: BmmModel,
): ClassComparison {
  const oldClasses = extractClassInfo(oldModel);
  const newClasses = extractClassInfo(newModel);

  const oldNames = new Set(oldClasses.keys());
  const newNames = new Set(newClasses.keys());

  const added: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];
  const modified: ClassComparison["modified"] = [];

  // Find added classes
  for (const name of newNames) {
    if (!oldNames.has(name)) {
      added.push(name);
    }
  }

  // Find removed classes
  for (const name of oldNames) {
    if (!newNames.has(name)) {
      removed.push(name);
    }
  }

  // Find unchanged and modified classes
  for (const name of oldNames) {
    if (newNames.has(name)) {
      const oldClass = oldClasses.get(name)!;
      const newClass = newClasses.get(name)!;

      const changes = compareClassDetails(name, oldClass, newClass);
      if (changes) {
        modified.push(changes);
      } else {
        unchanged.push(name);
      }
    }
  }

  return { added, removed, unchanged, modified };
}

function compareClassDetails(
  className: string,
  oldClass: BmmClass,
  newClass: BmmClass,
): ClassComparison["modified"][0] | null {
  const oldProps = new Set(Object.keys(oldClass.properties || {}));
  const newProps = new Set(Object.keys(newClass.properties || {}));

  const oldMethods = new Set(Object.keys(oldClass.functions || {}));
  const newMethods = new Set(Object.keys(newClass.functions || {}));

  const addedProperties: string[] = [];
  const removedProperties: string[] = [];
  const modifiedProperties: string[] = [];

  const addedMethods: string[] = [];
  const removedMethods: string[] = [];
  const modifiedMethods: string[] = [];

  // Compare properties
  for (const prop of newProps) {
    if (!oldProps.has(prop)) {
      addedProperties.push(prop);
    } else {
      // Check if property type changed
      const oldProp = oldClass.properties?.[prop];
      const newProp = newClass.properties?.[prop];
      if (JSON.stringify(oldProp) !== JSON.stringify(newProp)) {
        modifiedProperties.push(prop);
      }
    }
  }

  for (const prop of oldProps) {
    if (!newProps.has(prop)) {
      removedProperties.push(prop);
    }
  }

  // Compare methods
  for (const method of newMethods) {
    if (!oldMethods.has(method)) {
      addedMethods.push(method);
    } else {
      // Check if method signature changed
      const oldMethod = oldClass.functions?.[method];
      const newMethod = newClass.functions?.[method];
      if (JSON.stringify(oldMethod) !== JSON.stringify(newMethod)) {
        modifiedMethods.push(method);
      }
    }
  }

  for (const method of oldMethods) {
    if (!newMethods.has(method)) {
      removedMethods.push(method);
    }
  }

  // Return null if no changes
  if (
    addedProperties.length === 0 &&
    removedProperties.length === 0 &&
    modifiedProperties.length === 0 &&
    addedMethods.length === 0 &&
    removedMethods.length === 0 &&
    modifiedMethods.length === 0
  ) {
    return null;
  }

  return {
    className,
    addedProperties,
    removedProperties,
    modifiedProperties,
    addedMethods,
    removedMethods,
    modifiedMethods,
  };
}

function generateReport(
  packageName: string,
  oldVersion: string,
  newVersion: string,
  comparison: ClassComparison,
): string {
  let report = `# BMM Version Comparison Report\n\n`;
  report += `**Package:** ${packageName}\n`;
  report += `**Old Version:** ${oldVersion}\n`;
  report += `**New Version:** ${newVersion}\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;

  report += `## Summary\n\n`;
  report += `- **Classes Added:** ${comparison.added.length}\n`;
  report += `- **Classes Removed:** ${comparison.removed.length}\n`;
  report += `- **Classes Modified:** ${comparison.modified.length}\n`;
  report += `- **Classes Unchanged:** ${comparison.unchanged.length}\n\n`;

  if (comparison.added.length > 0) {
    report += `## Added Classes\n\n`;
    for (const className of comparison.added.sort()) {
      report +=
        `- \`${className}\` - **NEW CLASS** - Copy stub from /generated and implement\n`;
    }
    report += `\n`;
  }

  if (comparison.removed.length > 0) {
    report += `## Removed Classes\n\n`;
    for (const className of comparison.removed.sort()) {
      report +=
        `- \`${className}\` - **REMOVED** - Consider deprecating or removing from /enhanced\n`;
    }
    report += `\n`;
  }

  if (comparison.modified.length > 0) {
    report += `## Modified Classes\n\n`;
    for (
      const mod of comparison.modified.sort((a, b) =>
        a.className.localeCompare(b.className)
      )
    ) {
      report += `### ${mod.className}\n\n`;

      if (mod.addedProperties.length > 0) {
        report += `**Added Properties:**\n`;
        for (const prop of mod.addedProperties.sort()) {
          report += `- \`${prop}\` - Add to enhanced implementation\n`;
        }
        report += `\n`;
      }

      if (mod.removedProperties.length > 0) {
        report += `**Removed Properties:**\n`;
        for (const prop of mod.removedProperties.sort()) {
          report += `- \`${prop}\` - Consider deprecating or removing\n`;
        }
        report += `\n`;
      }

      if (mod.modifiedProperties.length > 0) {
        report += `**Modified Properties:**\n`;
        for (const prop of mod.modifiedProperties.sort()) {
          report +=
            `- \`${prop}\` - Type or constraints changed, review and update\n`;
        }
        report += `\n`;
      }

      if (mod.addedMethods.length > 0) {
        report += `**Added Methods:**\n`;
        for (const method of mod.addedMethods.sort()) {
          report += `- \`${method}()\` - Add to enhanced implementation\n`;
        }
        report += `\n`;
      }

      if (mod.removedMethods.length > 0) {
        report += `**Removed Methods:**\n`;
        for (const method of mod.removedMethods.sort()) {
          report += `- \`${method}()\` - Consider deprecating or removing\n`;
        }
        report += `\n`;
      }

      if (mod.modifiedMethods.length > 0) {
        report += `**Modified Methods:**\n`;
        for (const method of mod.modifiedMethods.sort()) {
          report +=
            `- \`${method}()\` - Signature changed, review and update\n`;
        }
        report += `\n`;
      }
    }
  }

  report += `## Action Items\n\n`;
  report += `1. Review all changes listed above\n`;
  report +=
    `2. Update \`/enhanced/${packageName}.ts\` to incorporate changes\n`;
  report += `3. Update header comment in enhanced file with new BMM version\n`;
  report += `4. Run tests: \`deno test\`\n`;
  report += `5. Verify backward compatibility\n\n`;

  report += `## Notes\n\n`;
  report +=
    `- Do NOT simply copy /generated to /enhanced - you'll lose all enhancements!\n`;
  report += `- Add new classes/methods incrementally\n`;
  report +=
    `- For modified signatures, check if existing implementations are still valid\n`;
  report += `- Consider backward compatibility for removed items\n`;

  return report;
}

// Main execution
if (import.meta.main) {
  const args = Deno.args;

  if (args.length < 1) {
    console.error(
      "Usage: deno run --allow-read --allow-net tasks/compare_bmm_versions.ts <package_name> [old_url] [new_url]",
    );
    console.error("\nExample:");
    console.error(
      "  deno run --allow-read --allow-net tasks/compare_bmm_versions.ts openehr_base",
    );
    Deno.exit(1);
  }

  const packageName = args[0];
  let oldUrl: string;
  let newUrl: string;

  if (args.length >= 3) {
    oldUrl = args[1];
    newUrl = args[2];
  } else {
    // Load from bmm_versions.json
    const bmmVersions = JSON.parse(
      await Deno.readTextFile("./tasks/bmm_versions.json"),
    );
    newUrl = bmmVersions[packageName];

    if (!newUrl) {
      console.error(`Package "${packageName}" not found in bmm_versions.json`);
      Deno.exit(1);
    }

    // For now, assume old URL is the same (user needs to provide old version)
    console.log(
      "Note: Using same URL for both versions. Provide old_url explicitly to compare different versions.",
    );
    oldUrl = newUrl;
  }

  console.log(`Fetching old version from: ${oldUrl}`);
  const oldModel = await fetchBmmModel(oldUrl);

  console.log(`Fetching new version from: ${newUrl}`);
  const newModel = await fetchBmmModel(newUrl);

  const comparison = compareClasses(oldModel, newModel);

  const report = generateReport(
    packageName,
    oldModel.rm_release,
    newModel.rm_release,
    comparison,
  );

  console.log("\n" + report);

  // Optionally save to file
  const outputFile =
    `bmm_comparison_${packageName}_${oldModel.rm_release}_to_${newModel.rm_release}.md`;
  await Deno.writeTextFile(outputFile, report);
  console.log(`\nReport saved to: ${outputFile}`);
}

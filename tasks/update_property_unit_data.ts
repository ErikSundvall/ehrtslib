#!/usr/bin/env deno
// Run with: deno run --allow-net --allow-write --allow-read tasks/update_property_unit_data.ts
/**
 * Update PropertyUnitData.xml from openEHR specifications-TERM repository
 *
 * This script downloads the latest PropertyUnitData.xml file from the official
 * openEHR GitHub repository.
 *
 * Usage:
 *   deno run --allow-net --allow-write --allow-read tasks/update_property_unit_data.ts
 *
 * References:
 * - https://github.com/openEHR/specifications-TERM/blob/master/computable/XML/PropertyUnitData.xml
 */

const PROPERTY_UNIT_DATA_URL =
  "https://raw.githubusercontent.com/openEHR/specifications-TERM/master/computable/XML/PropertyUnitData.xml";
const TARGET_PATH = "terminology_data/PropertyUnitData.xml";

async function main() {
  console.log("Downloading PropertyUnitData.xml from openEHR specifications-TERM...");
  console.log(`URL: ${PROPERTY_UNIT_DATA_URL}`);

  const response = await fetch(PROPERTY_UNIT_DATA_URL);
  if (!response.ok) {
    console.error(`Failed to download: ${response.status} ${response.statusText}`);
    Deno.exit(1);
  }

  const content = await response.text();

  // Basic validation
  if (!content.includes("<PropertyUnits") || !content.includes("<Property")) {
    console.error("Downloaded content does not appear to be valid PropertyUnitData.xml");
    Deno.exit(1);
  }

  // Count properties and units for summary
  const propertyCount = (content.match(/<Property /g) || []).length;
  const unitCount = (content.match(/<Unit /g) || []).length;

  // Ensure target directory exists
  try {
    await Deno.mkdir("terminology_data", { recursive: true });
  } catch {
    // Directory may already exist
  }

  // Check if file exists and compare
  let existingContent = "";
  try {
    existingContent = await Deno.readTextFile(TARGET_PATH);
  } catch {
    // File doesn't exist
  }

  if (existingContent === content) {
    console.log("\n✓ PropertyUnitData.xml is already up to date.");
    console.log(`  Properties: ${propertyCount}`);
    console.log(`  Units: ${unitCount}`);
    return;
  }

  // Write the file
  await Deno.writeTextFile(TARGET_PATH, content);

  console.log(`\n✓ Downloaded PropertyUnitData.xml to ${TARGET_PATH}`);
  console.log(`  Properties: ${propertyCount}`);
  console.log(`  Units: ${unitCount}`);

  if (existingContent) {
    const oldPropertyCount = (existingContent.match(/<Property /g) || []).length;
    const oldUnitCount = (existingContent.match(/<Unit /g) || []).length;
    console.log(`\nChanges from previous version:`);
    console.log(`  Properties: ${oldPropertyCount} → ${propertyCount}`);
    console.log(`  Units: ${oldUnitCount} → ${unitCount}`);
  }

  console.log("\nIMPORTANT: Remember that we only use PropertyUnitData.xml for:");
  console.log("  - Property names and openEHR IDs");
  console.log("  - Unit groupings by property");
  console.log("  - UCUM codes");
  console.log("\nWe do NOT use conversion factors from this file - use ucum-lhc instead.");
}

main().catch(console.error);

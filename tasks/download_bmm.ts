// Download one BMM JSON file from tasks/bmm_versions.json (default: openehr_base).
const packageName = Deno.args[0] ?? "openehr_base";
const outputPath = Deno.args[1] ?? "tasks/test_bmm.json";

const bmmVersions = JSON.parse(
  await Deno.readTextFile("./tasks/bmm_versions.json"),
) as Record<string, string>;
const bmmUrl = bmmVersions[packageName];
if (!bmmUrl) {
  throw new Error(`No BMM URL for ${packageName} in tasks/bmm_versions.json`);
}

try {
  const response = await fetch(bmmUrl);
  if (!response.ok) {
    throw new Error(`Failed to download BMM file: ${response.statusText}`);
  }
  const bmmContent = await response.text();
  await Deno.writeTextFile(outputPath, bmmContent);
  console.log(`Successfully downloaded ${bmmUrl} to ${outputPath}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error downloading BMM file: ${message}`);
  Deno.exit(1);
}

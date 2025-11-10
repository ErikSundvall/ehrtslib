// tasks/download_bmm.ts
const bmmUrl = "https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_base_1.3.0.bmm.json";
const outputPath = "tasks/test_bmm.json";

try {
    const response = await fetch(bmmUrl);
    if (!response.ok) {
        throw new Error(`Failed to download BMM file: ${response.statusText}`);
    }
    const bmmContent = await response.text();
    await Deno.writeTextFile(outputPath, bmmContent);
    console.log(`Successfully downloaded ${bmmUrl} to ${outputPath}`);
} catch (error) {
    console.error(`Error downloading BMM file: ${error.message}`);
}

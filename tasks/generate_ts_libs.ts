// tasks/generate_ts_libs.ts
import { readAndParseBmmJson } from "./bmm_parser.ts";
import { generateBasePackage } from "./ts_generator.ts";

const bmmVersions = JSON.parse(await Deno.readTextFile("./tasks/bmm_versions.json"));

for (const packageName in bmmVersions) {
    const url = bmmVersions[packageName];
    const response = await fetch(url);
    const bmmJson = await response.text();
    const bmmModel = JSON.parse(bmmJson);

    const tsPackage = generateBasePackage(bmmModel);
    const fileName = `${packageName}.ts`;
    await Deno.writeTextFile(`./${fileName}`, tsPackage);
    console.log(`Generated ${fileName}`);
}

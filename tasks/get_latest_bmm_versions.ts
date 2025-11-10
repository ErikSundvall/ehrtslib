// tasks/get_latest_bmm_versions.ts
import * as semver from "https://deno.land/std@0.224.0/semver/mod.ts";

const files = [
    "openehr_am_2.2.0.bmm.json",
    "openehr_am_2.3.0.bmm.json",
    "openehr_am_2.4.0.bmm.json",
    "openehr_base_1.0.4.bmm.json",
    "openehr_base_1.1.0.bmm.json",
    "openehr_base_1.2.0.bmm.json",
    "openehr_base_1.3.0.bmm.json",
    "openehr_lang_1.0.0.bmm.json",
    "openehr_lang_1.1.0.bmm.json",
    "openehr_rm_1.0.4.bmm.json",
    "openehr_rm_1.1.0.bmm.json",
    "openehr_rm_1.2.0.bmm.json",
    "openehr_term_3.0.0.bmm.json",
    "openehr_term_3.1.0.bmm.json",
];

const packages: { [key: string]: string[] } = {};

for (const file of files) {
    const match = file.match(/^(openehr_\w+)_(\d+\.\d+\.\d+)\.bmm\.json$/);
    if (match) {
        const packageName = match[1];
        const version = match[2];
        if (!packages[packageName]) {
            packages[packageName] = [];
        }
        packages[packageName].push(version);
    }
}

const latestVersions: { [key: string]: string } = {};

for (const packageName in packages) {
    const versions = packages[packageName];
    const sortedVersions = versions.sort((a, b) => semver.compare(semver.parse(b), semver.parse(a)));
    latestVersions[packageName] = sortedVersions[0];
}

const bmmVersions: { [key: string]: string } = {};
for (const packageName in latestVersions) {
    const version = latestVersions[packageName];
    bmmVersions[packageName] = `https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/${packageName}_${version}.bmm.json`;
}

Deno.writeTextFile("./tasks/bmm_versions.json", JSON.stringify(bmmVersions, null, 2));

console.log("bmm_versions.json created successfully.");
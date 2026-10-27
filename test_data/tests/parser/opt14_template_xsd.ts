/**
 * Validate exported OPT 1.4 XML against openEHR ITS-XML Template.xsd (issue #196).
 *
 * Schemas are **not** committed; fetch with `deno task refresh:openehr-its-xml`.
 * Relative `xs:include` paths match upstream under `test_data/xsd/openehr-its-xml/`.
 *
 * The exporter uses the v1 namespace; AM Release-1.4 Template.xsd targets v2 —
 * tests rewrite the root namespace before xmllint validation.
 */

import { join } from "@std/path";

export const ITS_XML_FIXTURE_DIR = join(
  Deno.cwd(),
  "test_data/xsd/openehr-its-xml",
);
export const REFRESH_ITS_XML_CMD = "deno task refresh:openehr-its-xml";

export function vendoredTemplateXsdPath(): string {
  return join(ITS_XML_FIXTURE_DIR, "components/AM/Release-1.4/Template.xsd");
}

/** Map exporter v1 namespace to the XSD targetNamespace (v2). */
export function optXmlForTemplateXsdValidation(xml: string): string {
  return xml.replaceAll(
    'xmlns="http://schemas.openehr.org/v1"',
    'xmlns="http://schemas.openehr.org/v2"',
  );
}

export async function readPinnedItsXmlCommit(): Promise<string> {
  const raw = await Deno.readTextFile(join(ITS_XML_FIXTURE_DIR, "PIN"));
  const line = raw.split("\n").find((l) => l.trim() && !l.trim().startsWith("#"));
  if (!line?.trim()) throw new Error("Missing PIN commit");
  return line.trim();
}

export async function itsXmlFixturesInstalled(): Promise<boolean> {
  try {
    const pin = await readPinnedItsXmlCommit();
    const stamp = (await Deno.readTextFile(join(ITS_XML_FIXTURE_DIR, ".stamp")))
      .trim();
    if (stamp !== pin) return false;
    await Deno.stat(vendoredTemplateXsdPath());
    return true;
  } catch {
    return false;
  }
}

export async function xmllintAvailable(): Promise<boolean> {
  try {
    const out = await new Deno.Command("xmllint", { args: ["--version"] })
      .output();
    return out.success;
  } catch {
    return false;
  }
}

/** Fail fast before Template.xsd validation (xmllint + fetched ITS-XML fixtures). */
export async function assertTemplateXsdTestPrerequisites(): Promise<void> {
  if (!(await xmllintAvailable())) {
    throw new Error(
      "xmllint is required for Template.xsd validation (install libxml2-utils, e.g. apt install libxml2-utils)",
    );
  }
  if (!(await itsXmlFixturesInstalled())) {
    throw new Error(
      `openEHR ITS-XML XSD fixtures are missing; run: ${REFRESH_ITS_XML_CMD}`,
    );
  }
}

export async function assertOptValidatesAgainstTemplateXsd(
  xml: string,
): Promise<void> {
  const schema = vendoredTemplateXsdPath();
  const f = await Deno.makeTempFile({ suffix: ".opt" });
  await Deno.writeTextFile(f, optXmlForTemplateXsdValidation(xml));
  const out = await new Deno.Command("xmllint", {
    args: ["--noout", "--schema", schema, f],
  }).output();
  if (!out.success) {
    throw new Error(new TextDecoder().decode(out.stderr));
  }
}

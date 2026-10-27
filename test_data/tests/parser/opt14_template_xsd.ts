/**
 * Validate exported OPT 1.4 XML against vendored Template.xsd (issue #196).
 *
 * Schemas live under `test_data/xsd/openehr-its-xml/` (unmodified
 * openEHR/specifications-ITS-XML). Relative `xs:include` paths match upstream.
 *
 * The exporter uses the v1 namespace; AM Release-1.4 Template.xsd targets v2 —
 * tests rewrite the root namespace before xmllint validation.
 */

import { join } from "@std/path";

const XSD_ROOT = join(Deno.cwd(), "test_data/xsd/openehr-its-xml");

export function vendoredTemplateXsdPath(): string {
  return join(XSD_ROOT, "components/AM/Release-1.4/Template.xsd");
}

/** Map exporter v1 namespace to the XSD targetNamespace (v2). */
export function optXmlForTemplateXsdValidation(xml: string): string {
  return xml.replaceAll(
    'xmlns="http://schemas.openehr.org/v1"',
    'xmlns="http://schemas.openehr.org/v2"',
  );
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

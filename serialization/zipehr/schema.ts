/**
 * ZipEHR format schema declaration (JSON `$schema` / YAML language-server directive).
 */

export const ZIPEHR_SCHEMA_URL = "http://purl.org/ehrtslib/zipehr/v1";

export const ZIPEHR_YAML_SCHEMA_DIRECTIVE =
  `# yaml-language-server: $schema=${ZIPEHR_SCHEMA_URL}`;

const YAML_SCHEMA_DIRECTIVE_RE =
  /^#\s*yaml-language-server:\s*\$schema=(\S+)\s*(?:\r?\n)?/;

export type ZipehrSchemaStripResult = {
  text: string;
  hadDeclaration: boolean;
  declarationMismatch: boolean;
};

/** Remove YAML language-server schema directive from the top of ZipEHR text. */
export function stripZipehrYamlSchemaDirective(
  text: string,
): ZipehrSchemaStripResult {
  const match = text.match(YAML_SCHEMA_DIRECTIVE_RE);
  if (!match) {
    return { text, hadDeclaration: false, declarationMismatch: false };
  }
  const url = match[1];
  return {
    text: text.slice(match[0].length),
    hadDeclaration: true,
    declarationMismatch: url !== ZIPEHR_SCHEMA_URL,
  };
}

export type ZipehrSchemaObjectStripResult = {
  obj: unknown;
  hadDeclaration: boolean;
  declarationMismatch: boolean;
};

/** Remove root `$schema` from a parsed ZipEHR JSON object. */
export function stripZipehrJsonSchemaProperty(
  obj: unknown,
): ZipehrSchemaObjectStripResult {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { obj, hadDeclaration: false, declarationMismatch: false };
  }
  const record = obj as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(record, "$schema")) {
    return { obj, hadDeclaration: false, declarationMismatch: false };
  }
  const { $schema, ...rest } = record;
  return {
    obj: rest,
    hadDeclaration: true,
    declarationMismatch: $schema !== ZIPEHR_SCHEMA_URL,
  };
}

export function warnMissingZipehrSchema(hadDeclaration: boolean): void {
  if (!hadDeclaration) {
    console.warn(
      `ZipEHR: input lacks schema declaration (expected JSON "$schema" or YAML ` +
        `"${ZIPEHR_YAML_SCHEMA_DIRECTIVE}" for ${ZIPEHR_SCHEMA_URL})`,
    );
  }
}

export function warnMismatchedZipehrSchema(
  declarationMismatch: boolean,
  hadDeclaration: boolean,
): void {
  if (hadDeclaration && declarationMismatch) {
    console.warn(
      `ZipEHR: schema declaration does not match expected ${ZIPEHR_SCHEMA_URL}`,
    );
  }
}

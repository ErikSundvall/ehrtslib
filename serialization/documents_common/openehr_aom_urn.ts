/**
 * openEHR archetype/template URN helpers for document codecs (Markdown, AsciiDoc).
 *
 * Project convention (#284): archetype and template cross-references use the
 * **AOM** namespace (`urn:openehr:aom:`), not `urn:openehr:am:` (the RM package
 * tree is still `am/`). The suffix preserves CKM-style archetype identifiers.
 */

export const OPENEHR_AOM_URN_PREFIX = "urn:openehr:aom:org.openehr::";

/**
 * Build an openEHR archetype/template URN for document cross-references.
 */
export function toOpenehrAomArchetypeUrn(archetypeId: string): string {
  return `${OPENEHR_AOM_URN_PREFIX}${archetypeId}`;
}

/**
 * Extract archetype id from an openEHR AOM archetype URN.
 * Legacy `urn:openehr:am:` spellings are not accepted (pre-1.0 no-compat policy).
 */
export function archetypeIdFromOpenehrUrn(urn: string): string | null {
  if (urn.startsWith(OPENEHR_AOM_URN_PREFIX)) {
    return urn.slice(OPENEHR_AOM_URN_PREFIX.length);
  }
  return null;
}

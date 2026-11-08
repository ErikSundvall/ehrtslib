/**
 * openEHR archetype/template URN helpers for document codecs (Markdown, AsciiDoc).
 *
 * Project convention (#284): archetype and template cross-references use the
 * **AOM** namespace (`urn:openehr:aom:`), not `urn:openehr:am:` (the RM package
 * tree is still `am/`). The suffix preserves CKM-style archetype identifiers.
 */

export const OPENEHR_AOM_URN_PREFIX = "urn:openehr:aom:org.openehr::";

/** Legacy spelling retained only for parsing historical fixtures during transition. */
export const OPENEHR_AM_URN_PREFIX = "urn:openehr:am:org.openehr::";

/**
 * Build an openEHR archetype/template URN for document cross-references.
 */
export function toOpenehrAomArchetypeUrn(archetypeId: string): string {
  return `${OPENEHR_AOM_URN_PREFIX}${archetypeId}`;
}

/**
 * Extract archetype id from an openEHR AOM (or legacy AM) archetype URN.
 */
export function archetypeIdFromOpenehrUrn(urn: string): string | null {
  if (urn.startsWith(OPENEHR_AOM_URN_PREFIX)) {
    return urn.slice(OPENEHR_AOM_URN_PREFIX.length);
  }
  if (urn.startsWith(OPENEHR_AM_URN_PREFIX)) {
    return urn.slice(OPENEHR_AM_URN_PREFIX.length);
  }
  return null;
}

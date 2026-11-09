/**
 * Structural preset: extract full composition from sparse tail RM annotations.
 */

import { isOeRmAnnotationInner, parseOeRmAnnotationPayload } from "./oe_rm_annotation.ts";

export function extractStructuralCompositionFromText(text: string): Record<string, unknown> | null {
  const patterns = [
    /<!--\s*(oe:rm:v1:b64:[A-Za-z0-9_-]+)\s*-->/g,
    /\/\/\s*(oe:rm:v1:b64:[A-Za-z0-9_-]+)\s*$/gm,
  ];
  let last: Record<string, unknown> | null = null;
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const inner = m[1]?.trim();
      if (!inner || !isOeRmAnnotationInner(inner)) continue;
      try {
        const obj = parseOeRmAnnotationPayload(inner);
        if (obj._type === "COMPOSITION") last = obj;
      } catch {
        /* try next */
      }
    }
  }
  return last;
}

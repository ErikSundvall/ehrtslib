/**
 * Extract external clinical-model references from Better `.t.json` (AOM TEMPLATE JSON).
 */

import { jsonType } from "./legacy/json_aom_util.ts";
import { asArray, textValue } from "./legacy/xml_aom_mapper.ts";

function archetypeIdValue(node: unknown): string | undefined {
  if (!node) return undefined;
  if (typeof node === "string") return node.trim() || undefined;
  if (typeof node === "object") {
    return textValue((node as Record<string, unknown>).value) ??
      textValue(node as Record<string, unknown>);
  }
  return undefined;
}

function overlayRecords(root: Record<string, unknown>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const raw of asArray(root.templateOverlays ?? root.template_overlays)) {
    if (!raw || typeof raw !== "object") continue;
    const ov = raw as Record<string, unknown>;
    if (jsonType(ov) !== "TEMPLATE_OVERLAY") continue;
    out.push(ov);
  }
  return out;
}

/** Collect overlay archetype ids declared in this template file. */
export function collectTemplateJsonOverlayIds(
  root: Record<string, unknown>,
): Set<string> {
  const overlayIds = new Set<string>();
  for (const ov of overlayRecords(root)) {
    const id = archetypeIdValue(ov.archetypeId ?? ov.archetype_id);
    if (id) overlayIds.add(id);
  }
  return overlayIds;
}

/**
 * References that must be satisfied by other files in a file set
 * (parent archetype, overlay parents, nested templates, archetype roots
 * not covered by inlined overlays).
 */
export function collectTemplateJsonExternalRefs(
  root: Record<string, unknown>,
): string[] {
  const overlayIds = collectTemplateJsonOverlayIds(root);
  const external = new Set<string>();

  function considerRef(ref: string | undefined) {
    if (!ref) return;
    const trimmed = ref.trim();
    if (!trimmed || overlayIds.has(trimmed)) return;
    external.add(trimmed);
  }

  function walk(node: unknown): void {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const rec = node as Record<string, unknown>;
    const type = jsonType(rec);
    if (type === "C_ARCHETYPE_ROOT") {
      considerRef(
        textValue(rec.archetypeRef) ??
          textValue(rec.archetype_ref) ??
          (typeof rec.archetypeRef === "string" ? rec.archetypeRef : undefined),
      );
    }
    for (const v of Object.values(rec)) walk(v);
  }

  considerRef(
    archetypeIdValue(root.parentArchetypeId ?? root.parent_archetype_id),
  );

  const overlays = overlayRecords(root);
  for (const ov of overlays) {
    // Overlay objects live in this .t.json; their *parents* do not.
    considerRef(
      archetypeIdValue(ov.parentArchetypeId ?? ov.parent_archetype_id),
    );
    walk(ov.definition);
  }

  walk(root.definition);
  return [...external];
}

/** Parse `.t.json` text and return external refs (empty if not a template JSON). */
export function collectTemplateJsonExternalRefsFromText(
  source: string,
): string[] {
  const trimmed = source.trim();
  if (!trimmed.startsWith("{")) return [];
  try {
    const root = JSON.parse(trimmed) as Record<string, unknown>;
    const type = jsonType(root);
    if (type !== "TEMPLATE" && type !== "OPERATIONAL_TEMPLATE") return [];
    return collectTemplateJsonExternalRefs(root);
  } catch {
    return [];
  }
}

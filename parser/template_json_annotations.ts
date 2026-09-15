/**
 * Patch Better Archetype Designer `.t.json` annotations without rewriting the
 * whole AOM tree (preserves AD metadata and overlay structure).
 */

import type { AnnotationDocumentation } from "./clinical_model_annotations.ts";

function archetypeIdFromJsonField(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const v = (value as { value?: unknown }).value;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** Build the Better/AD `annotations` object from in-memory documentation. */
export function documentationToBetterAnnotations(
  documentation: AnnotationDocumentation | undefined,
): Record<string, unknown> | undefined {
  if (!documentation) return undefined;
  const languages = Object.keys(documentation);
  if (!languages.length) return undefined;
  let keyCount = 0;
  for (const lang of languages) {
    const paths = documentation[lang] ?? {};
    for (const path of Object.keys(paths)) {
      keyCount += Object.keys(paths[path] ?? {}).length;
    }
  }
  if (keyCount === 0) return undefined;
  return {
    "@type": "RESOURCE_ANNOTATIONS",
    documentation: structuredClone(documentation),
  };
}

function applyAnnotationsToNode(
  node: Record<string, unknown>,
  documentation: AnnotationDocumentation | undefined,
): void {
  const next = documentationToBetterAnnotations(documentation);
  if (next) node.annotations = next;
  else delete node.annotations;
}

/**
 * Rewrite `annotations` on the root TEMPLATE and each TEMPLATE_OVERLAY using
 * documentation keyed by archetype id (`archetypeId.value`).
 */
export function patchTemplateJsonAnnotations(
  originalText: string,
  documentationByArchetypeId: ReadonlyMap<
    string,
    AnnotationDocumentation | undefined
  >,
): string {
  const root = JSON.parse(originalText) as Record<string, unknown>;
  const rootId = archetypeIdFromJsonField(
    root.archetypeId ?? root.archetype_id,
  );
  if (rootId && documentationByArchetypeId.has(rootId)) {
    applyAnnotationsToNode(root, documentationByArchetypeId.get(rootId));
  }

  const overlays = root.templateOverlays ?? root.template_overlays;
  if (Array.isArray(overlays)) {
    for (const raw of overlays) {
      if (!raw || typeof raw !== "object") continue;
      const overlay = raw as Record<string, unknown>;
      const id = archetypeIdFromJsonField(
        overlay.archetypeId ?? overlay.archetype_id,
      );
      if (!id || !documentationByArchetypeId.has(id)) continue;
      applyAnnotationsToNode(overlay, documentationByArchetypeId.get(id));
    }
  }

  return `${JSON.stringify(root, null, 2)}\n`;
}

/** Collect archetype ids referenced by a `.t.json` document (root + overlays). */
export function listTemplateJsonArchetypeIds(text: string): string[] {
  const root = JSON.parse(text) as Record<string, unknown>;
  const ids: string[] = [];
  const rootId = archetypeIdFromJsonField(
    root.archetypeId ?? root.archetype_id,
  );
  if (rootId) ids.push(rootId);
  const overlays = root.templateOverlays ?? root.template_overlays;
  if (Array.isArray(overlays)) {
    for (const raw of overlays) {
      if (!raw || typeof raw !== "object") continue;
      const id = archetypeIdFromJsonField(
        (raw as Record<string, unknown>).archetypeId ??
          (raw as Record<string, unknown>).archetype_id,
      );
      if (id) ids.push(id);
    }
  }
  return ids;
}

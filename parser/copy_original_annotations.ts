/**
 * Copy path annotations from a resource's original-language bag into another
 * language bag (Better/AD treats annotations as language-specific, so logic/UI
 * keys such as `a.*` must be duplicated when export uses a non-original primary
 * language).
 */

import {
  type AnnotatedResource,
  type AnnotationDocumentation,
  setPathAnnotation,
} from "./clinical_model_annotations.ts";
import {
  annotationFamily,
  isLanguageIndependentFamily,
  listFamilies,
} from "./annotation_families.ts";

export interface AnnotationCopyItem {
  path: string;
  key: string;
  family: string;
  value: string;
  ownerId?: string;
  existingTargetValue?: string;
}

export function copyItemId(item: AnnotationCopyItem): string {
  return `${item.ownerId ?? ""}\n${item.path}\n${item.key}`;
}

export function listCopyItemsFromDocumentation(
  doc: AnnotationDocumentation | undefined,
  sourceLanguage: string,
  targetLanguage: string,
  ownerId?: string,
): AnnotationCopyItem[] {
  if (!doc || !sourceLanguage || !targetLanguage) return [];
  if (sourceLanguage === targetLanguage) return [];
  const src = doc[sourceLanguage];
  if (!src) return [];
  const items: AnnotationCopyItem[] = [];
  for (const path of Object.keys(src).sort((a, b) => a.localeCompare(b))) {
    const keys = src[path] ?? {};
    for (const key of Object.keys(keys).sort((a, b) => a.localeCompare(b))) {
      const value = keys[key] ?? "";
      if (!value.trim()) continue;
      const existing = doc[targetLanguage]?.[path]?.[key];
      items.push({
        path,
        key,
        family: annotationFamily(key),
        value,
        ownerId,
        existingTargetValue: existing,
      });
    }
  }
  return items;
}

export function groupCopyItemsByFamily(
  items: AnnotationCopyItem[],
): { family: string; items: AnnotationCopyItem[] }[] {
  const byFamily = new Map<string, AnnotationCopyItem[]>();
  for (const item of items) {
    const list = byFamily.get(item.family) ?? [];
    list.push(item);
    byFamily.set(item.family, list);
  }
  const known = listFamilies(undefined);
  const families = [
    ...known.filter((f) => byFamily.has(f)),
    ...[...byFamily.keys()].filter((f) => !known.includes(f)).sort(),
  ];
  return families.map((family) => ({
    family,
    items: byFamily.get(family) ?? [],
  }));
}

/** Default: language-independent families (`a.`) checked, others unchecked. */
export function defaultCopySelection(
  items: AnnotationCopyItem[],
): Set<string> {
  return new Set(
    items
      .filter((item) => isLanguageIndependentFamily(item.family))
      .map(copyItemId),
  );
}

export function applyCopyItemsToDocumentation(
  doc: AnnotationDocumentation,
  items: Array<{ path: string; key: string; value: string }>,
  targetLanguage: string,
): number {
  if (!targetLanguage) return 0;
  let n = 0;
  for (const item of items) {
    doc[targetLanguage] ??= {};
    doc[targetLanguage][item.path] ??= {};
    doc[targetLanguage][item.path][item.key] = item.value;
    n++;
  }
  return n;
}

export function applyCopyItems(
  resource: AnnotatedResource,
  items: Array<{ path: string; key: string; value: string }>,
  targetLanguage: string,
): number {
  if (!targetLanguage) return 0;
  for (const item of items) {
    setPathAnnotation(
      resource,
      item.path,
      item.key,
      item.value,
      targetLanguage,
    );
  }
  return items.length;
}

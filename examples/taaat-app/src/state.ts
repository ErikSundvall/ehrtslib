export interface PaletteItem {
  id: string;
  label: string;
  key: string;
  value?: string;
}

export interface JsonAnnotationPatch {
  language: string;
  path: string;
  key: string;
  value?: string;
  remove?: boolean;
}

export const DEFAULT_PALETTE: PaletteItem[] = [
  { id: "ui-help", label: "UI help", key: "ui" },
  { id: "fhir", label: "FHIR mapping", key: "FHIR" },
  { id: "localisation-en", label: "English label", key: "L10n.en" },
  {
    id: "implementation-note",
    label: "Implementation note",
    key: "implementation note",
  },
];

function cleanId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(
    /^-|-$/g,
    "",
  ) || crypto.randomUUID();
}

export function normalizePalette(input: unknown): PaletteItem[] {
  if (!Array.isArray(input)) return [...DEFAULT_PALETTE];
  const items: PaletteItem[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    const key = String(rec.key ?? "").trim();
    if (!key) continue;
    const label = String(rec.label ?? key).trim() || key;
    const id = cleanId(String(rec.id ?? `${label}-${key}`));
    if (seen.has(id)) continue;
    seen.add(id);
    const value = rec.value === undefined ? undefined : String(rec.value);
    items.push({ id, label, key, ...(value !== undefined ? { value } : {}) });
  }
  return items.length ? items : [...DEFAULT_PALETTE];
}

export function parsePaletteJson(source: string): PaletteItem[] {
  const parsed = JSON.parse(source) as unknown;
  return normalizePalette(parsed);
}

export function serializePalette(items: PaletteItem[]): string {
  return `${JSON.stringify(normalizePalette(items), null, 2)}\n`;
}

export function upsertPaletteItem(
  items: PaletteItem[],
  item: Omit<PaletteItem, "id"> & { id?: string },
): PaletteItem[] {
  const normalized = normalizePalette([
    ...items,
    { ...item, id: item.id ?? `${item.label}-${item.key}` },
  ]);
  const id = cleanId(item.id ?? `${item.label}-${item.key}`);
  const next = normalized.filter((candidate) => candidate.id !== id);
  next.push({
    id,
    label: item.label.trim() || item.key,
    key: item.key.trim(),
    ...(item.value !== undefined ? { value: item.value } : {}),
  });
  return next;
}

export function updateTemplateJsonAnnotationSource(
  source: string,
  patch: JsonAnnotationPatch,
): string {
  const root = JSON.parse(source) as Record<string, unknown>;
  if (!patch.language.trim()) throw new Error("Language is required");
  if (!patch.path.trim()) throw new Error("Path is required");
  if (!patch.key.trim()) throw new Error("Annotation key is required");

  const annotations = root.annotations && typeof root.annotations === "object"
    ? root.annotations as Record<string, unknown>
    : { "@type": "RESOURCE_ANNOTATIONS" };
  const documentation = annotations.documentation &&
      typeof annotations.documentation === "object"
    ? annotations.documentation as Record<string, unknown>
    : {};
  const langDoc = documentation[patch.language] &&
      typeof documentation[patch.language] === "object"
    ? documentation[patch.language] as Record<string, unknown>
    : {};
  const pathDoc = langDoc[patch.path] && typeof langDoc[patch.path] === "object"
    ? langDoc[patch.path] as Record<string, unknown>
    : {};

  if (patch.remove) {
    delete pathDoc[patch.key];
  } else {
    pathDoc[patch.key] = patch.value ?? "";
  }

  if (Object.keys(pathDoc).length) {
    langDoc[patch.path] = pathDoc;
  } else {
    delete langDoc[patch.path];
  }

  if (Object.keys(langDoc).length) {
    documentation[patch.language] = langDoc;
  } else {
    delete documentation[patch.language];
  }

  if (Object.keys(documentation).length) {
    annotations.documentation = documentation;
    root.annotations = annotations;
  } else {
    delete annotations.documentation;
    if (Object.keys(annotations).length > 1) {
      root.annotations = annotations;
    } else {
      delete root.annotations;
    }
  }

  return `${JSON.stringify(root, null, 2)}\n`;
}

export function downloadableFilename(path: string, fallback: string): string {
  return path.split("/").pop()?.trim() || fallback;
}

/**
 * Path / extension conventions for clinical model file sets (CKM mirrors, zips, Git trees).
 */

/** File extensions loaded into a clinical model workspace. */
export const CLINICAL_MODEL_EXTENSIONS =
  /\.(adl|adls|opt|oet|t\.json|xml)$/i;

export function isClinicalModelPath(path: string): boolean {
  const lower = path.toLowerCase();
  if (lower.includes("__macosx")) return false;
  return CLINICAL_MODEL_EXTENSIONS.test(lower);
}

export function normalizeClinicalModelPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

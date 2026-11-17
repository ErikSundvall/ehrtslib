/**
 * ZipEHR preview CSS: `zipehr-html5-quiet-structure.css` is overrides only;
 * it must be layered on the dialect default (inline `<style>` cannot resolve `@import`).
 */

export {
  ZIP_QUIET_STRUCTURE_CSS,
  buildZipehrPreviewDocument,
  type ZipehrPreviewDocumentOptions,
} from "./quiet_structure_preview.ts";
export {
  ZIP_QUIET_PREVIEW_SCRIPT,
  ZIP_QUIET_STRUCTURE_TAGS,
  ZIP_QUIET_TECH_TAGS,
} from "./quiet_structure_preview.ts";

export function stripCssImports(css: string): string {
  return css.replace(/@import\s+[^;]+;/g, "").trim();
}

export function composeQuietStructureCss(
  baseCss: string,
  quietOverridesCss: string,
): string {
  return `${baseCss.trim()}\n\n/* quiet-structure overrides */\n${
    stripCssImports(quietOverridesCss).trim()
  }`;
}
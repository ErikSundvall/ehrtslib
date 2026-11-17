/**
 * ZipEHR preview CSS: `zipehr-html5-quiet-structure.css` is overrides only;
 * it must be layered on the dialect default (inline `<style>` cannot resolve `@import`).
 */

export const ZIP_QUIET_STRUCTURE_CSS = "zipehr-html5-quiet-structure.css";

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
/**
 * Reorder demo UI: config above editor; status bar directly above editor content.
 * Rationale: users rarely scroll to the bottom of long instance payloads.
 */
const path = new URL("../public/index.html", import.meta.url);
let html = await Deno.readTextFile(path);

function extractBalancedDiv(html: string, id: string): string {
  const idIdx = html.indexOf(`id="${id}"`);
  if (idIdx < 0) throw new Error(`id ${id} not found`);
  const start = html.lastIndexOf("<div", idIdx);
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    if (html.startsWith("<div", i)) depth++;
    if (html.startsWith("</div>", i)) {
      depth--;
      if (depth === 0) return html.slice(start, i + 6);
    }
  }
  throw new Error(`unbalanced div for ${id}`);
}

function extractEditorBlock(inner: string): string {
  const start = inner.indexOf('<div class="editor-block">');
  if (start < 0) throw new Error("editor-block not found");
  let depth = 0;
  for (let i = start; i < inner.length; i++) {
    if (inner.startsWith("<div", i)) depth++;
    if (inner.startsWith("</div>", i)) {
      depth--;
      if (depth === 0) return inner.slice(start, i + 6);
    }
  }
  throw new Error("unbalanced editor-block");
}

function reorderEditorBlock(block: string): string {
  if (block.includes("input-info")) {
    return block.replace(
      /(<div class="editor-block">)\s*(<textarea[\s\S]*?<\/textarea>)\s*(<div class="input-info">[\s\S]*?<\/div>)/,
      "$1$3$2",
    );
  }
  return block.replace(
    /(<div class="editor-block">)\s*(<pre class="output-content"[\s\S]*?<\/pre>)\s*(<div class="output-info">[\s\S]*?<\/div>)/,
    "$1$3$2",
  );
}

function rebuildTabPane(inner: string, id: string, active: boolean): string {
  const optId = id === "tab-json" ? "json-options"
    : id === "tab-yaml" ? "yaml-options"
    : id === "tab-typescript" ? "typescript-options"
    : "xml-options";
  const configSection = extractBalancedDiv(inner, optId);
  const editorBlock = reorderEditorBlock(extractEditorBlock(inner));
  const success = inner.match(/<div class="success-message[\s\S]*?<\/div>/)?.[0] ?? "";
  return `<div class="tab-pane${active ? " active" : ""}" id="${id}">
                        ${configSection.trim()}
                        ${editorBlock.trim()}
                        ${success.trim()}
                    </div>`;
}

const tabContentStart = html.indexOf('<div class="tab-content">');
const tabContentEnd = html.indexOf("</div>\n            </div>\n        </section>", tabContentStart);
let tabContent = html.slice(tabContentStart, tabContentEnd);

for (const [id, active] of [
  ["tab-yaml", true],
  ["tab-json", false],
  ["tab-typescript", false],
  ["tab-xml", false],
] as const) {
  const paneIdx = tabContent.indexOf(`id="${id}"`);
  const paneDivStart = tabContent.lastIndexOf('<div class="tab-pane', paneIdx);
  let depth = 0;
  let paneEnd = paneDivStart;
  for (let i = paneDivStart; i < tabContent.length; i++) {
    if (tabContent.startsWith("<div", i)) depth++;
    if (tabContent.startsWith("</div>", i)) {
      depth--;
      if (depth === 0) {
        paneEnd = i + 6;
        break;
      }
    }
  }
  const inner = tabContent.slice(
    tabContent.indexOf(">", paneDivStart) + 1,
    paneEnd - 6,
  );
  tabContent = tabContent.slice(0, paneDivStart) +
    rebuildTabPane(inner, id, active) +
    tabContent.slice(paneEnd);
}

html = html.slice(0, tabContentStart) + tabContent + html.slice(tabContentEnd);

// Input panel: toolbar, config, editor (remove old config after editor)
const ip = html.indexOf('<section class="panel input-panel">');
const pb = html.indexOf('<div class="panel-body">', ip);
const pbOpen = html.indexOf(">", pb) + 1;
const ipEnd = html.indexOf("</section>", ip);
let body = html.slice(pbOpen, html.lastIndexOf("</div>", ipEnd));

const ebStart = body.indexOf('<div class="editor-block">');
const toolbar = body.slice(0, ebStart).trimEnd();
const inputConfig = extractBalancedDiv(body, "input-deserializer-section");
const editorBlock = reorderEditorBlock(extractEditorBlock(body));

html =
  html.slice(0, pbOpen) +
  toolbar +
  "\n\n                <!-- Config and status above editor: users rarely scroll past long instance payloads. -->\n                " +
  inputConfig +
  "\n                " +
  editorBlock +
  "\n            " +
  html.slice(html.lastIndexOf("</div>", ipEnd));

await Deno.writeTextFile(path, html);
console.log("OK");

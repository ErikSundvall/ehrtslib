/**
 * Per-family accordion inspector, including the L10n generate panel.
 */

import type {
  AnnotatedResource,
  AnnotationDocumentation,
  DefinitionTreeNode,
} from "../../../parser/clinical_model_annotations.ts";
import {
  annotationPathOf,
  getPathAnnotations,
  removePathAnnotation,
  setPathAnnotation,
} from "../../../parser/clinical_model_annotations.ts";
import {
  annotationFamily,
  documentationViewForTree,
  familyFillColor,
  familyLegendLabel,
  flattenDefinitionTree,
  l10nSourcesFromTree,
  languageOutlineColor,
  listFamilies,
  listLanguageBags,
  pillsAtPath,
  UNPREFIXED_FAMILY,
} from "../../../parser/annotation_families.ts";
import {
  type L10nWrite,
  proposeL10nWrites,
} from "../../../parser/l10n_annotation_generate.ts";

export interface InspectorState {
  overwriteL10n: boolean;
  repeatedOnly: boolean;
  copyToAllBags: boolean;
  lastWrites: L10nWrite[];
  openFamilies: Set<string>;
}

export function createInspectorState(): InspectorState {
  return {
    overwriteL10n: false,
    repeatedOnly: true,
    copyToAllBags: true,
    lastWrites: [],
    openFamilies: new Set(["L10n.", "a.", UNPREFIXED_FAMILY]),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface InspectorOptions {
  host: HTMLElement;
  resource: AnnotatedResource;
  tree: DefinitionTreeNode;
  node: DefinitionTreeNode;
  doc: AnnotationDocumentation;
  languages: string[];
  enabledLanguages: Set<string>;
  state: InspectorState;
  onChange: () => void;
  resourceForNode?: (node: DefinitionTreeNode) => AnnotatedResource;
  documentationForNode?: (
    node: DefinitionTreeNode,
  ) => AnnotationDocumentation | undefined;
}

function familyHelp(family: string): string {
  if (family === "L10n.") {
    return `Better/AD workaround for repeated renamed nodes in ADL 1.4 OPT: key <code>L10n.{lang}</code> = translated occurrence name. Generation copies those keys into every language bag and never touches the definition tree. <a href="https://discourse.openehr.org/t/limitation-preventing-multilingual-repeated-parts-in-the-opt-operational-template-export-format/2760" target="_blank" rel="noopener">discourse #2760</a>`;
  }
  if (family === "a.") {
    return `Automation / UI-hint namespace (letter “a” from “automation”). Examples: <code>a.id</code>, <code>a.rule</code>, <code>a.rule.adl</code>. Prefix avoids clashes in Ocean Template Designer. <a href="https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406/19" target="_blank" rel="noopener">discourse #2406/19</a>`;
  }
  return `Keys without a dotted prefix (<code>comment</code>, <code>design note</code>, <code>ui</code>, …).`;
}

function setOnEnabledBags(
  resource: AnnotatedResource,
  path: string,
  key: string,
  value: string,
  bags: string[],
): void {
  for (const lang of bags) {
    setPathAnnotation(resource, path, key, value, lang);
  }
}

function renderRowsForFamily(
  opts: InspectorOptions,
  family: string,
  body: HTMLElement,
): void {
  const { resource, node, doc, languages, enabledLanguages, onChange } = opts;
  const path = annotationPathOf(node);
  const bags = languages.filter((l) => enabledLanguages.has(l));
  const writeBags = bags.length ? bags : languages;
  const pills = pillsAtPath(doc, path).filter((p) => p.family === family);
  const keys = [...new Set(pills.map((p) => p.key))];

  const table = document.createElement("table");
  table.className = "family-table";
  table.innerHTML = `<thead><tr><th>Key</th>${
    writeBags.map((l) =>
      `<th><span class="lang-swatch" style="border-color:${
        languageOutlineColor(l)
      }"></span>${escapeHtml(l)}</th>`
    ).join("")
  }<th></th></tr></thead><tbody></tbody>`;
  const tbody = table.querySelector("tbody")!;

  const addRow = (key: string) => {
    const tr = document.createElement("tr");
    const keyTd = document.createElement("td");
    const keyInp = document.createElement("input");
    keyInp.value = key;
    keyInp.className = "ann-key";
    keyTd.appendChild(keyInp);
    tr.appendChild(keyTd);
    const values: Record<string, HTMLInputElement> = {};
    for (const lang of writeBags) {
      const td = document.createElement("td");
      const inp = document.createElement("input");
      inp.value = getPathAnnotations(doc, path, lang)[key] ?? "";
      inp.style.borderLeft = `3px solid ${languageOutlineColor(lang)}`;
      values[lang] = inp;
      td.appendChild(inp);
      tr.appendChild(td);
    }
    const delTd = document.createElement("td");
    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn-sm btn-danger";
    del.textContent = "×";
    del.title = "Remove this key from enabled language bags";
    del.addEventListener("click", () => {
      const k = keyInp.value.trim() || key;
      for (const lang of writeBags) {
        removePathAnnotation(resource, path, k, lang);
      }
      onChange();
    });
    delTd.appendChild(del);
    tr.appendChild(delTd);

    const commit = () => {
      const nextKey = keyInp.value.trim();
      if (!nextKey) return;
      if (annotationFamily(nextKey) !== family && key) {
        // allow retargeting; caller refreshes
      }
      if (nextKey !== key) {
        for (const lang of writeBags) {
          removePathAnnotation(resource, path, key, lang);
        }
      }
      for (const lang of writeBags) {
        setPathAnnotation(
          resource,
          path,
          nextKey,
          values[lang].value,
          lang,
        );
      }
      onChange();
    };
    keyInp.addEventListener("change", commit);
    for (const inp of Object.values(values)) {
      inp.addEventListener("change", commit);
    }
    tbody.appendChild(tr);
  };

  for (const key of keys) addRow(key);
  if (!keys.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No keys in this family on the selected node.";
    body.appendChild(empty);
  } else {
    body.appendChild(table);
  }

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn btn-secondary btn-sm";
  addBtn.textContent = "Add key";
  addBtn.addEventListener("click", () => {
    const defaultKey = family === UNPREFIXED_FAMILY
      ? "comment"
      : family === "L10n."
      ? "L10n.sv"
      : family === "a."
      ? "a.id"
      : `${family}key`;
    let key = defaultKey;
    let n = 2;
    while (
      writeBags.some((l) => getPathAnnotations(doc, path, l)[key] !== undefined)
    ) {
      key = `${defaultKey}-${n++}`;
    }
    setOnEnabledBags(resource, path, key, "", writeBags);
    onChange();
  });
  body.appendChild(addBtn);
}

function renderL10nGenerate(opts: InspectorOptions, body: HTMLElement): void {
  const box = document.createElement("div");
  box.className = "l10n-generate";
  box.innerHTML = `
    <h4>Generate L10n annotations</h4>
    <p class="muted">Writes only <code>L10n.*</code> keys from names already present as <code>L10n.&#123;lang&#125;</code> on repeated archetype occurrences. Other families and the constraint tree are left alone.</p>
    <label><input type="checkbox" data-f="repeatedOnly"${
    opts.state.repeatedOnly ? " checked" : ""
  }> Repeated archetype occurrences only</label>
    <label><input type="checkbox" data-f="copyToAllBags"${
    opts.state.copyToAllBags ? " checked" : ""
  }> Copy into every language bag</label>
    <label><input type="checkbox" data-f="overwriteL10n"${
    opts.state.overwriteL10n ? " checked" : ""
  }> Overwrite existing L10n.* values that differ</label>
    <div class="gen-actions">
      <button type="button" class="btn" data-act="preview">Preview writes</button>
      <button type="button" class="btn btn-primary" data-act="apply">Apply L10n</button>
    </div>
    <div class="gen-preview"></div>
  `;
  box.querySelectorAll<HTMLInputElement>("input[data-f]").forEach((inp) => {
    inp.addEventListener("change", () => {
      const f = inp.dataset.f as
        | "repeatedOnly"
        | "copyToAllBags"
        | "overwriteL10n";
      opts.state[f] = inp.checked;
    });
  });
  const run = (apply: boolean) => {
    const getDoc = opts.documentationForNode ?? (() => opts.doc);
    const viewDoc = documentationViewForTree(opts.tree, getDoc);
    const sources = l10nSourcesFromTree(opts.tree, viewDoc);
    const writes = proposeL10nWrites(viewDoc, sources, {
      languageBags: opts.languages,
      overwrite: opts.state.overwriteL10n,
      repeatedOccurrencesOnly: opts.state.repeatedOnly,
      copyToAllLanguageBags: opts.state.copyToAllBags,
    });
    opts.state.lastWrites = writes;
    if (apply) {
      for (const w of writes) {
        if (w.kind === "unchanged") continue;
        if (w.kind === "conflict" && !opts.state.overwriteL10n) continue;
        if (!/^L10n\./i.test(w.key)) continue;
        const targetNode = flattenDefinitionTree(opts.tree).find((n) =>
          n.path === w.path
        );
        const owner = targetNode && opts.resourceForNode
          ? opts.resourceForNode(targetNode)
          : opts.resource;
        const writePath = targetNode ? annotationPathOf(targetNode) : w.path;
        setPathAnnotation(owner, writePath, w.key, w.value, w.languageBag);
      }
      opts.onChange();
      return;
    }
    paintPreview(box.querySelector(".gen-preview") as HTMLElement, writes);
  };
  box.querySelector("[data-act=preview]")?.addEventListener(
    "click",
    () => run(false),
  );
  box.querySelector("[data-act=apply]")?.addEventListener(
    "click",
    () => run(true),
  );
  if (opts.state.lastWrites.length) {
    paintPreview(
      box.querySelector(".gen-preview") as HTMLElement,
      opts.state.lastWrites,
    );
  }
  body.appendChild(box);
}

function paintPreview(el: HTMLElement, writes: L10nWrite[]): void {
  const add = writes.filter((w) => w.kind === "add").length;
  const same = writes.filter((w) => w.kind === "unchanged").length;
  const conflict = writes.filter((w) => w.kind === "conflict").length;
  const rows = writes.filter((w) => w.kind !== "unchanged").slice(0, 40);
  el.innerHTML = `
    <p class="gen-counts">add ${add} · unchanged ${same} · conflict ${conflict}</p>
    <table class="gen-table">
      <thead><tr><th>kind</th><th>bag</th><th>key</th><th>value</th></tr></thead>
      <tbody>
        ${
    rows.map((w) =>
      `<tr class="kind-${w.kind}"><td>${w.kind}</td><td>${
        escapeHtml(w.languageBag)
      }</td><td>${escapeHtml(w.key)}</td><td>${escapeHtml(w.value)}</td></tr>`
    ).join("")
  }
      </tbody>
    </table>
  `;
}

export function renderInspector(opts: InspectorOptions): void {
  const { host, doc, node, state } = opts;
  const families = listFamilies(doc);
  host.innerHTML = "";
  for (const family of families) {
    const details = document.createElement("details");
    details.className = "family-acc";
    details.open = state.openFamilies.has(family);
    details.addEventListener("toggle", () => {
      if (details.open) state.openFamilies.add(family);
      else state.openFamilies.delete(family);
    });
    const summary = document.createElement("summary");
    const count = pillsAtPath(doc, annotationPathOf(node)).filter((p) =>
      p.family === family
    )
      .length;
    summary.innerHTML = `
      <span class="family-swatch" style="background:${
      familyFillColor(family)
    }"></span>
      <span>${escapeHtml(familyLegendLabel(family))}</span>
      <span class="family-count">${count}</span>
    `;
    const body = document.createElement("div");
    body.className = "family-acc-body";
    const help = document.createElement("p");
    help.className = "family-help";
    help.innerHTML = familyHelp(family);
    body.appendChild(help);
    renderRowsForFamily(opts, family, body);
    if (family === "L10n.") {
      renderL10nGenerate(opts, body);
    }
    details.append(summary, body);
    host.appendChild(details);
  }
}

export function currentLanguageBags(
  doc: AnnotationDocumentation | undefined,
): string[] {
  const bags = listLanguageBags(doc, ["en"]);
  return bags.length ? bags : ["en"];
}

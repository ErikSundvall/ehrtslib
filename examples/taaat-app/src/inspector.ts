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
  documentationViewForTree,
  familyFillColor,
  familyLegendLabel,
  flattenDefinitionTree,
  isLanguageIndependentFamily,
  l10nSourcesFromTree,
  languageOutlineColor,
  listFamilies,
  listLanguageBags,
  orderLanguagesWithOriginal,
  pillsAtPath,
  UNPREFIXED_FAMILY,
} from "../../../parser/annotation_families.ts";
import {
  type L10nWrite,
  proposeL10nWrites,
} from "../../../parser/l10n_annotation_generate.ts";
import {
  type SlButton,
  type SlCheckbox,
  type SlDetails,
  slEl,
  type SlInput,
} from "./sl.ts";

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
  /** Authored original language of the active template/archetype. */
  originalLanguage?: string;
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
    return `Automation / UI-hint namespace (letter “a” from “automation”). Examples: <code>a.id</code>, <code>a.rule</code>, <code>a.rule.adl</code>. These keys are language-independent: maintain them in the original language, then use <strong>Copy original to…</strong> when an export needs another language bag. Prefix avoids clashes in Ocean Template Designer. <a href="https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406/19" target="_blank" rel="noopener">discourse #2406/19</a>`;
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

function defaultKeyForFamily(family: string, languages: string[]): string {
  if (family === UNPREFIXED_FAMILY) return "comment";
  if (family === "L10n.") {
    const lang = languages[0] ?? "en";
    return `L10n.${lang}`;
  }
  if (family === "a.") return "a.id";
  return `${family}key`;
}

function displayBagsForFamily(
  family: string,
  languages: string[],
  enabledLanguages: Set<string>,
  originalLanguage?: string,
): string[] {
  let bags = languages.filter((l) => enabledLanguages.has(l));
  const logic = isLanguageIndependentFamily(family);
  if (logic && originalLanguage) {
    if (!bags.includes(originalLanguage)) bags = [originalLanguage, ...bags];
  }
  bags = orderLanguagesWithOriginal(bags, originalLanguage);
  if (!bags.length) {
    bags = orderLanguagesWithOriginal(languages, originalLanguage);
  }
  return bags;
}

function renderRowsForFamily(
  opts: InspectorOptions,
  family: string,
  body: HTMLElement,
): void {
  const {
    resource,
    node,
    doc,
    languages,
    enabledLanguages,
    originalLanguage,
    onChange,
  } = opts;
  const path = annotationPathOf(node);
  const displayBags = displayBagsForFamily(
    family,
    languages,
    enabledLanguages,
    originalLanguage,
  );
  const logicFamily = isLanguageIndependentFamily(family);
  const addBags = logicFamily && originalLanguage
    ? [originalLanguage]
    : displayBags;
  const pills = pillsAtPath(doc, path).filter((p) => p.family === family);
  const keys = [...new Set(pills.map((p) => p.key))];

  const table = document.createElement("table");
  table.className = "family-table";
  table.innerHTML = `<thead><tr><th>Key</th>${
    displayBags.map((l) => {
      const isOrig = Boolean(originalLanguage && l === originalLanguage);
      const origClass = isOrig ? " is-original" : "";
      const title = isOrig ? ' title="Original language"' : "";
      return `<th${title}><span class="lang-swatch${origClass}" style="border-color:${
        languageOutlineColor(l)
      }"></span>${escapeHtml(l)}</th>`;
    }).join("")
  }<th></th></tr></thead><tbody></tbody>`;
  const tbody = table.querySelector("tbody")!;

  const addRow = (key: string) => {
    const tr = document.createElement("tr");
    const keyTd = document.createElement("td");
    const keyInp = slEl<SlInput>("sl-input", {
      className: "ann-key",
      size: "small",
      value: key,
    });
    keyTd.appendChild(keyInp);
    tr.appendChild(keyTd);
    const values: Record<string, SlInput> = {};
    for (const lang of displayBags) {
      const td = document.createElement("td");
      const copyOnly = Boolean(
        logicFamily && originalLanguage && lang !== originalLanguage,
      );
      const inp = slEl<SlInput>("sl-input", {
        size: "small",
        value: getPathAnnotations(doc, path, lang)[key] ?? "",
        style: `border-left: 3px solid ${languageOutlineColor(lang)}`,
      });
      if (copyOnly) {
        (inp as HTMLElement & { disabled: boolean }).disabled = true;
        inp.title =
          "Language-independent key — edit in the original language, then copy";
      }
      values[lang] = inp;
      td.appendChild(inp);
      tr.appendChild(td);
    }
    const delTd = document.createElement("td");
    const del = slEl<SlButton>("sl-button", {
      variant: "text",
      size: "small",
      text: "×",
    });
    del.title = logicFamily
      ? "Remove this key from the original language and any copied bags"
      : "Remove this key from enabled language bags";
    del.addEventListener("click", () => {
      const k = keyInp.value.trim() || key;
      for (const lang of displayBags) {
        removePathAnnotation(resource, path, k, lang);
      }
      onChange();
    });
    delTd.appendChild(del);
    tr.appendChild(delTd);

    const writableBags = (bags: string[]) =>
      bags.filter((lang) =>
        !(logicFamily && originalLanguage && lang !== originalLanguage)
      );

    const commit = () => {
      const nextKey = keyInp.value.trim();
      if (!nextKey) return;
      const mutate = writableBags(displayBags);
      if (nextKey !== key) {
        for (const lang of displayBags) {
          removePathAnnotation(resource, path, key, lang);
        }
      }
      for (const lang of mutate) {
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
    keyInp.addEventListener("sl-change", commit);
    for (const [lang, inp] of Object.entries(values)) {
      if (logicFamily && originalLanguage && lang !== originalLanguage) {
        continue;
      }
      inp.addEventListener("sl-change", commit);
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

  const addBtn = slEl<SlButton>("sl-button", {
    variant: "default",
    size: "small",
    text: "Add key",
  });
  addBtn.addEventListener("click", () => {
    if (!addBags.length) return;
    const defaultKey = defaultKeyForFamily(family, languages);
    let next = defaultKey;
    let n = 2;
    while (
      addBags.some((l) => getPathAnnotations(doc, path, l)[next] !== undefined)
    ) {
      next = `${defaultKey}-${n++}`;
    }
    setOnEnabledBags(resource, path, next, "", addBags);
    onChange();
  });
  body.appendChild(addBtn);
}

function renderL10nGenerate(opts: InspectorOptions, body: HTMLElement): void {
  const box = document.createElement("div");
  box.className = "l10n-generate";
  const heading = document.createElement("h4");
  heading.textContent = "Generate L10n annotations";
  const help = document.createElement("p");
  help.className = "muted";
  help.innerHTML =
    "Writes only <code>L10n.*</code> keys from names already present as <code>L10n.{lang}</code> on repeated archetype occurrences. Other families and the constraint tree are left alone.";
  box.append(heading, help);

  const flags: Array<{
    field: "repeatedOnly" | "copyToAllBags" | "overwriteL10n";
    label: string;
  }> = [
    {
      field: "repeatedOnly",
      label: "Repeated archetype occurrences only",
    },
    {
      field: "copyToAllBags",
      label: "Copy into every language bag",
    },
    {
      field: "overwriteL10n",
      label: "Overwrite existing L10n.* values that differ",
    },
  ];
  for (const flag of flags) {
    const cb = slEl<SlCheckbox>("sl-checkbox", {
      checked: opts.state[flag.field],
      text: flag.label,
    });
    cb.addEventListener("sl-change", () => {
      opts.state[flag.field] = cb.checked;
    });
    box.appendChild(cb);
  }

  const actions = document.createElement("div");
  actions.className = "gen-actions";
  const previewBtn = slEl<SlButton>("sl-button", {
    variant: "default",
    size: "small",
    text: "Preview writes",
  });
  const applyBtn = slEl<SlButton>("sl-button", {
    variant: "primary",
    size: "small",
    text: "Apply L10n",
  });
  actions.append(previewBtn, applyBtn);
  box.appendChild(actions);

  const preview = document.createElement("div");
  preview.className = "gen-preview";
  box.appendChild(preview);

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
    paintPreview(preview, writes);
  };
  previewBtn.addEventListener("click", () => run(false));
  applyBtn.addEventListener("click", () => run(true));
  if (opts.state.lastWrites.length) {
    paintPreview(preview, opts.state.lastWrites);
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
    const details = slEl<SlDetails>("sl-details", {
      className: "family-acc",
      open: state.openFamilies.has(family),
    });
    details.addEventListener("sl-show", () => {
      state.openFamilies.add(family);
    });
    details.addEventListener("sl-hide", () => {
      state.openFamilies.delete(family);
    });
    const summary = document.createElement("span");
    summary.slot = "summary";
    summary.className = "family-summary";
    const count = pillsAtPath(doc, annotationPathOf(node)).filter((p) =>
      p.family === family
    ).length;
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
  modelLanguages: string[] = [],
): string[] {
  return listLanguageBags(doc, modelLanguages);
}

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
  KNOWN_FAMILIES,
  L10N_FAMILY,
  l10nSourcesFromTree,
  languageOutlineColor,
  listFamilies,
  listLanguageBags,
  pillsAtPath,
  qualifyKeyForFamily,
  UNPREFIXED_FAMILY,
} from "../../../parser/annotation_families.ts";
import {
  type L10nWrite,
  proposeL10nWrites,
} from "../../../parser/l10n_annotation_generate.ts";
import {
  type FamilyStore,
  favouritesForFamily,
  removeExtraFamily,
  removeFavourite,
  upsertFavourite,
} from "./family_store.ts";
import {
  type SlButton,
  type SlCheckbox,
  type SlDetails,
  slEl,
  type SlInput,
  type SlSelect,
  slValue,
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
    openFamilies: new Set([L10N_FAMILY, "a.", UNPREFIXED_FAMILY]),
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
  resource?: AnnotatedResource;
  tree?: DefinitionTreeNode;
  node?: DefinitionTreeNode;
  doc: AnnotationDocumentation;
  languages: string[];
  enabledLanguages: Set<string>;
  state: InspectorState;
  familyStore: FamilyStore;
  onChange: () => void;
  onFamilyStoreChange: (store: FamilyStore) => void;
  resourceForNode?: (node: DefinitionTreeNode) => AnnotatedResource;
  documentationForNode?: (
    node: DefinitionTreeNode,
  ) => AnnotationDocumentation | undefined;
}

function familyHelp(family: string): string {
  if (family === L10N_FAMILY) {
    return `Better/AD workaround for repeated renamed nodes in ADL 1.4 OPT: key <code>L10n.{lang}</code> = translated occurrence name. Generation copies those keys into every language bag and never touches the definition tree. <a href="https://discourse.openehr.org/t/limitation-preventing-multilingual-repeated-parts-in-the-opt-operational-template-export-format/2760" target="_blank" rel="noopener">discourse #2760</a>`;
  }
  if (family === "a.") {
    return `Automation / UI-hint namespace (letter “a” from “automation”). Favourites below follow the tobacco-use examples on <a href="https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406/19" target="_blank" rel="noopener">discourse #2406/19</a>: <code>a.id</code>, <code>a.rule</code>, <code>a.rule.adl</code>, <code>a.rule.adl2</code>, Cambio- and Better-style rules.`;
  }
  if (family === UNPREFIXED_FAMILY) {
    return `Keys without a dotted prefix (<code>comment</code>, <code>design note</code>, <code>ui</code>, …). Favourites for this family are stored in this browser.`;
  }
  return `Keys prefixed with <code>${
    escapeHtml(family)
  }</code>. Favourites for this family are stored in this browser.`;
}

function writeBagsFor(opts: InspectorOptions): string[] {
  const bags = opts.languages.filter((l) => opts.enabledLanguages.has(l));
  return bags.length ? bags : opts.languages;
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
  if (family === L10N_FAMILY) {
    const lang = languages[0] ?? "en";
    return `L10n.${lang}`;
  }
  if (family === "a.") return "a.id";
  return `${family}key`;
}

function renderRowsForFamily(
  opts: InspectorOptions,
  family: string,
  body: HTMLElement,
): void {
  const { resource, node, doc, languages, onChange } = opts;
  if (!resource || !node) {
    const hint = document.createElement("p");
    hint.className = "muted";
    hint.textContent = "Select a node to edit keys on this family.";
    body.appendChild(hint);
    return;
  }
  const path = annotationPathOf(node);
  const writeBags = writeBagsFor(opts);
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
    const keyInp = slEl<SlInput>("sl-input", {
      className: "ann-key",
      size: "small",
      value: key,
    });
    keyTd.appendChild(keyInp);
    tr.appendChild(keyTd);
    const values: Record<string, SlInput> = {};
    for (const lang of writeBags) {
      const td = document.createElement("td");
      const inp = slEl<SlInput>("sl-input", {
        size: "small",
        value: getPathAnnotations(doc, path, lang)[key] ?? "",
        style: `border-left: 3px solid ${languageOutlineColor(lang)}`,
      });
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
    keyInp.addEventListener("sl-change", commit);
    for (const inp of Object.values(values)) {
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
    if (!writeBags.length) return;
    const defaultKey = defaultKeyForFamily(family, languages);
    let next = defaultKey;
    let n = 2;
    while (
      writeBags.some((l) =>
        getPathAnnotations(doc, path, l)[next] !== undefined
      )
    ) {
      next = `${defaultKey}-${n++}`;
    }
    setOnEnabledBags(resource, path, next, "", writeBags);
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
  const applyBtn = slEl<SlButton>("sl-button", {
    variant: "primary",
    size: "small",
    text: "Apply L10n",
    disabled: !opts.tree || !opts.resource,
  });
  const previewBtn = slEl<SlButton>("sl-button", {
    variant: "default",
    size: "small",
    text: "Preview writes",
    disabled: !opts.tree,
  });
  actions.append(previewBtn, applyBtn);
  box.appendChild(actions);

  const preview = document.createElement("div");
  preview.className = "gen-preview";
  box.appendChild(preview);

  const run = (apply: boolean) => {
    if (!opts.tree || !opts.resource) return;
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
        if (!owner) continue;
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

function renderFamilyFavourites(
  opts: InspectorOptions,
  family: string,
  body: HTMLElement,
): void {
  if (family === L10N_FAMILY) return;
  const box = document.createElement("div");
  box.className = "family-favourites";
  const heading = document.createElement("h4");
  heading.textContent = "Favourites";
  const hint = document.createElement("p");
  hint.className = "muted";
  hint.textContent =
    "Saved in this browser. Apply writes the key (and the selected value, if any) onto the selected node in every enabled language bag.";
  box.append(heading, hint);

  const entries = favouritesForFamily(opts.familyStore, family);
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No favourites in this family yet.";
    box.appendChild(empty);
  }

  const canApply = Boolean(opts.resource && opts.node);
  const writeBags = writeBagsFor(opts);

  for (const entry of entries) {
    const row = document.createElement("div");
    row.className = "fav-row";
    const keyEl = document.createElement("code");
    keyEl.className = "fav-key";
    keyEl.textContent = entry.key;
    row.appendChild(keyEl);

    let valueSelect: SlSelect | undefined;
    if (entry.values.length) {
      valueSelect = slEl<SlSelect>("sl-select", {
        size: "small",
        hoist: true,
        className: "fav-values",
        value: entry.values[0],
      });
      valueSelect.setAttribute("aria-label", `Values for ${entry.key}`);
      for (const value of entry.values) {
        const opt = document.createElement("sl-option") as HTMLElement & {
          value: string;
        };
        opt.value = value;
        opt.textContent = value;
        valueSelect.appendChild(opt);
      }
      row.appendChild(valueSelect);
    }

    const apply = slEl<SlButton>("sl-button", {
      size: "small",
      variant: "default",
      text: "Apply",
      disabled: !canApply || !writeBags.length,
    });
    apply.title = canApply
      ? "Apply to selected node"
      : "Select a tree node first";
    apply.addEventListener("click", () => {
      if (!opts.resource || !opts.node || !writeBags.length) return;
      const value = valueSelect ? slValue(valueSelect) : "";
      setOnEnabledBags(
        opts.resource,
        annotationPathOf(opts.node),
        entry.key,
        value,
        writeBags,
      );
      opts.onChange();
    });
    const remove = slEl<SlButton>("sl-button", {
      size: "small",
      variant: "text",
      text: "×",
    });
    remove.title = "Remove favourite key";
    remove.addEventListener("click", () => {
      opts.onFamilyStoreChange(
        removeFavourite(opts.familyStore, family, entry.key),
      );
    });
    row.append(apply, remove);
    box.appendChild(row);
  }

  const add = document.createElement("div");
  add.className = "fav-add";
  const keyInp = slEl<SlInput>("sl-input", {
    size: "small",
    placeholder: family === UNPREFIXED_FAMILY ? "Key" : "Key (id or a.id)",
    className: "fav-add-key",
  });
  const valInp = slEl<SlInput>("sl-input", {
    size: "small",
    placeholder: "Value (optional; adds to this key’s list)",
    className: "fav-add-value",
  });
  const addBtn = slEl<SlButton>("sl-button", {
    size: "small",
    variant: "default",
    text: "Add favourite",
  });
  addBtn.addEventListener("click", () => {
    const qualified = qualifyKeyForFamily(slValue(keyInp), family);
    if (!qualified) {
      keyInp.setAttribute(
        "help-text",
        family === UNPREFIXED_FAMILY
          ? "Use an unprefixed key, or pick another family."
          : `Key must belong to ${family}`,
      );
      return;
    }
    opts.onFamilyStoreChange(
      upsertFavourite(opts.familyStore, family, qualified, slValue(valInp)),
    );
  });
  add.append(keyInp, valInp, addBtn);
  box.appendChild(add);

  const isKnown = (KNOWN_FAMILIES as readonly string[]).includes(family);
  const isExtra = opts.familyStore.extraFamilies.includes(family);
  if (!isKnown && isExtra) {
    const removeFam = slEl<SlButton>("sl-button", {
      size: "small",
      variant: "text",
      text: "Remove family",
      className: "fav-remove-family",
    });
    removeFam.addEventListener("click", () => {
      opts.onFamilyStoreChange(removeExtraFamily(opts.familyStore, family));
    });
    box.appendChild(removeFam);
  }

  body.appendChild(box);
}

export function renderInspector(opts: InspectorOptions): void {
  const { host, doc, node, state, familyStore } = opts;
  const families = listFamilies(doc, familyStore.extraFamilies);
  host.innerHTML = "";
  for (const family of families) {
    const details = slEl<SlDetails>("sl-details", {
      className: "family-acc",
      open: state.openFamilies.has(family),
    });
    details.dataset.family = family;
    details.addEventListener("sl-show", () => {
      state.openFamilies.add(family);
    });
    details.addEventListener("sl-hide", () => {
      state.openFamilies.delete(family);
    });
    const summary = document.createElement("span");
    summary.slot = "summary";
    summary.className = "family-summary";
    const count = node
      ? pillsAtPath(doc, annotationPathOf(node)).filter((p) =>
        p.family === family
      ).length
      : 0;
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
    if (family === L10N_FAMILY) {
      renderL10nGenerate(opts, body);
    } else {
      renderFamilyFavourites(opts, family, body);
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

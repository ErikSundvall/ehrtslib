import type { ProtoSession } from "./session.ts";
import { applyL10n, previewL10n, escapeHtml } from "./session.ts";
import { countArchetypeRefs, isRepeated } from "./sample-model.ts";

export function renderGeneratePanel(
  session: ProtoSession,
  rerender: () => void,
  options?: { compact?: boolean },
): HTMLElement {
  const wrap = document.createElement("section");
  wrap.className = "gen-panel";
  wrap.innerHTML = `
    <h3>Generate L10n annotations</h3>
    <p class="gen-help">
      Writes only <code>L10n.{lang}</code> keys into
      <code>annotations.documentation</code>. Definition, terminology, and
      other keys (e.g. <code>design note</code>) are left alone.
      See <a href="https://discourse.openehr.org/t/2760" target="_blank" rel="noopener">discourse #2760</a>.
    </p>
    <label><input type="checkbox" data-flag="repeatedOnly"${session.repeatedOnly ? " checked" : ""}>
      Repeated archetype occurrences only (OPT 1.4 gap)</label>
    <label><input type="checkbox" data-flag="copyToAllBags"${session.copyToAllBags ? " checked" : ""}>
      Copy into every language bag (needed for any primary-language OPT export)</label>
    <label><input type="checkbox" data-flag="overwrite"${session.overwrite ? " checked" : ""}>
      Overwrite existing L10n.* values that differ</label>
    <div class="gen-actions">
      <button type="button" class="btn" data-act="preview">Preview writes</button>
      <button type="button" class="btn btn-primary" data-act="apply">Apply L10n</button>
    </div>
    <div class="gen-preview"></div>
  `;

  wrap.querySelectorAll<HTMLInputElement>("input[data-flag]").forEach((inp) => {
    inp.addEventListener("change", () => {
      const flag = inp.dataset.flag as "repeatedOnly" | "copyToAllBags" | "overwrite";
      session[flag] = inp.checked;
      rerender();
    });
  });
  wrap.querySelector("[data-act=preview]")?.addEventListener("click", () => {
    previewL10n(session);
    rerender();
  });
  wrap.querySelector("[data-act=apply]")?.addEventListener("click", () => {
    applyL10n(session);
    rerender();
  });

  const preview = wrap.querySelector(".gen-preview") as HTMLElement;
  if (session.lastWrites.length) {
    const adds = session.lastWrites.filter((w) => w.kind === "add").length;
    const same = session.lastWrites.filter((w) => w.kind === "unchanged").length;
    const conflicts = session.lastWrites.filter((w) => w.kind === "conflict").length;
    const rows = (options?.compact
      ? session.lastWrites.filter((w) => w.kind !== "unchanged")
      : session.lastWrites).slice(0, 40);
    preview.innerHTML = `
      <p class="gen-counts">
        add ${adds} · unchanged ${same} · conflict ${conflicts}
        ${session.lastResult
        ? ` · applied ${session.lastResult.applied}`
        : ""}
      </p>
      <table class="gen-table">
        <thead><tr><th>kind</th><th>bag</th><th>key</th><th>value</th></tr></thead>
        <tbody>
          ${
      rows.map((w) =>
        `<tr class="kind-${w.kind}">
              <td>${w.kind}</td>
              <td>${escapeHtml(w.languageBag)}</td>
              <td>${escapeHtml(w.key)}</td>
              <td>${escapeHtml(w.value)}${
          w.existingValue && w.kind === "conflict"
            ? ` <s>${escapeHtml(w.existingValue)}</s>`
            : ""
        }</td>
            </tr>`
      ).join("")
    }
        </tbody>
      </table>
    `;
  } else {
    preview.innerHTML =
      `<p class="muted">Preview lists the exact L10n.* writes before they land.</p>`;
  }
  return wrap;
}

export function renderAnnotationEditor(
  session: ProtoSession,
  rerender: () => void,
): HTMLElement {
  const wrap = document.createElement("section");
  wrap.className = "ann-editor";
  const path = session.selectedPath;
  const rows = Object.entries(
    session.documentation[session.editorLanguage]?.[path] ?? {},
  );
  wrap.innerHTML = `
    <h3>Annotations</h3>
    <p class="path-display" title="${escapeHtml(path)}">${escapeHtml(path)}</p>
    <div class="ann-toolbar">
      <label>Language bag
        <select data-lang>
          ${
    session.languages.map((l) =>
      `<option value="${l}"${
        l === session.editorLanguage ? " selected" : ""
      }>${l}</option>`
    ).join("")
  }
        </select>
      </label>
      <button type="button" class="btn" data-act="add">Add row</button>
    </div>
    <table class="ann-table">
      <thead><tr><th>Key</th><th>Value</th><th></th></tr></thead>
      <tbody>
        ${
    rows.map(([k, v], i) =>
      `<tr>
          <td><input data-i="${i}" data-f="key" value="${escapeHtml(k)}"></td>
          <td><input data-i="${i}" data-f="value" value="${escapeHtml(v)}"></td>
          <td><button type="button" data-del="${escapeHtml(k)}">×</button></td>
        </tr>`
    ).join("") ||
      `<tr><td colspan="3" class="muted">No annotations in this language bag.</td></tr>`
  }
      </tbody>
    </table>
  `;
  wrap.querySelector<HTMLSelectElement>("[data-lang]")?.addEventListener(
    "change",
    (e) => {
      session.editorLanguage = (e.target as HTMLSelectElement).value;
      rerender();
    },
  );
  wrap.querySelector("[data-act=add]")?.addEventListener("click", () => {
    session.documentation[session.editorLanguage] ??= {};
    session.documentation[session.editorLanguage][path] ??= {};
    const bag = session.documentation[session.editorLanguage][path];
    let key = "comment";
    let n = 2;
    while (bag[key] !== undefined) {
      key = `comment-${n++}`;
    }
    bag[key] = "";
    rerender();
  });
  wrap.querySelectorAll<HTMLInputElement>("input[data-i]").forEach((inp) => {
    inp.addEventListener("change", () => {
      const i = Number(inp.dataset.i);
      const prevKey = rows[i]?.[0];
      if (!prevKey) return;
      const keyInp = wrap.querySelector<HTMLInputElement>(
        `input[data-i="${i}"][data-f="key"]`,
      );
      const valInp = wrap.querySelector<HTMLInputElement>(
        `input[data-i="${i}"][data-f="value"]`,
      );
      const nextKey = keyInp?.value.trim() ?? prevKey;
      const nextVal = valInp?.value ?? "";
      const bag = session.documentation[session.editorLanguage]?.[path];
      if (!bag) return;
      if (nextKey !== prevKey) delete bag[prevKey];
      if (nextKey) bag[nextKey] = nextVal;
      rerender();
    });
  });
  wrap.querySelectorAll<HTMLButtonElement>("button[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.del ?? "";
      const bag = session.documentation[session.editorLanguage]?.[path];
      if (bag) delete bag[key];
      rerender();
    });
  });
  return wrap;
}

export function rmClass(rmType: string): string {
  return "rm-" + rmType.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function nodeBadgesHtml(
  session: ProtoSession,
  path: string,
  archetypeRef?: string,
): string {
  const counts = countArchetypeRefs(session.tree);
  const repeated = archetypeRef
    ? isRepeated({
      id: "",
      path,
      name: "",
      rmType: "",
      occurrences: "",
      localizedNames: {},
      children: [],
      archetypeRef,
    }, counts)
    : false;
  const bags = session.languages;
  const missing = bags.filter((lang) => {
    const key = `L10n.${lang}`;
    return !bags.some((b) => session.documentation[b]?.[path]?.[key]);
  });
  const extra = Object.keys(
    session.documentation[session.editorLanguage]?.[path] ?? {},
  ).filter((k) => !/^L10n\./i.test(k)).length;
  const bits: string[] = [];
  if (repeated) bits.push(`<span class="badge badge-repeat">repeated</span>`);
  if (missing.length && repeated) {
    bits.push(
      `<span class="badge badge-gap">L10n missing ${
        escapeHtml(missing.join(","))
      }</span>`,
    );
  }
  if (extra) bits.push(`<span class="badge badge-ann">${extra} other</span>`);
  return bits.join(" ");
}

/**
 * Variant B — annotation matrix.
 * No tree widget: every node is a table row. L10n cells are inline-editable.
 */

import {
  countArchetypeRefs,
  flattenNodes,
  isRepeated,
} from "./sample-model.ts";
import type { ProtoSession } from "./session.ts";
import { escapeHtml, setAnnotation } from "./session.ts";
import { renderGeneratePanel, rmClass } from "./widgets.ts";

export const VARIANT_B = { key: "B", name: "Annotation matrix" };

export function renderVariantB(
  host: HTMLElement,
  session: ProtoSession,
  rerender: () => void,
): void {
  host.className = "variant variant-b";
  host.innerHTML = "";

  const toolbar = document.createElement("div");
  toolbar.className = "matrix-toolbar";
  const search = document.createElement("input");
  search.placeholder = "Filter rows…";
  search.className = "matrix-search";
  const hint = document.createElement("p");
  hint.className = "matrix-hint";
  hint.textContent =
    "Every template node is a row — nothing is collapsed. Edit L10n cells in place. Other annotation keys stay in the last columns.";
  toolbar.append(search, hint, renderGeneratePanel(session, rerender, { compact: true }));

  const scroller = document.createElement("div");
  scroller.className = "matrix-scroll";
  const table = document.createElement("table");
  table.className = "matrix";
  const langs = session.languages;
  table.innerHTML = `
    <thead>
      <tr>
        <th class="sticky">Node</th>
        <th>RM</th>
        <th>Occ</th>
        ${langs.map((l) => `<th>L10n.${l}</th>`).join("")}
        <th>Other keys (${session.editorLanguage})</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody")!;
  const counts = countArchetypeRefs(session.tree);

  const paint = (q = "") => {
    tbody.innerHTML = "";
    const query = q.trim().toLowerCase();
    for (const node of flattenNodes(session.tree)) {
      const hay = `${node.name} ${node.rmType} ${node.path}`.toLowerCase();
      if (query && !hay.includes(query)) continue;
      const depth = Math.max(0, node.path.split("/").filter(Boolean).length);
      const tr = document.createElement("tr");
      tr.className = rmClass(node.rmType);
      if (node.path === session.selectedPath) tr.classList.add("is-selected");
      if (isRepeated(node, counts)) tr.classList.add("is-repeated");
      const other = Object.entries(
        session.documentation[session.editorLanguage]?.[node.path] ?? {},
      ).filter(([k]) => !/^L10n\./i.test(k));

      const nameTd = document.createElement("td");
      nameTd.className = "sticky";
      nameTd.style.paddingLeft = `${8 + depth * 12}px`;
      nameTd.innerHTML = `<button type="button" class="matrix-name">${
        escapeHtml(node.name)
      }</button>
        ${
        isRepeated(node, counts)
          ? `<span class="badge badge-repeat">repeated</span>`
          : ""
      }
        <div class="matrix-path">${escapeHtml(node.path)}</div>`;
      nameTd.querySelector("button")?.addEventListener("click", () => {
        session.selectedPath = node.path;
        rerender();
      });

      tr.appendChild(nameTd);
      const rm = document.createElement("td");
      rm.textContent = node.rmType;
      const occ = document.createElement("td");
      occ.textContent = node.occurrences;
      tr.append(rm, occ);

      for (const lang of langs) {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.className = "matrix-l10n";
        const existing = session.languages
          .map((bag) => session.documentation[bag]?.[node.path]?.[`L10n.${lang}`])
          .find((v) => v != null);
        const suggested = node.localizedNames[lang] ?? "";
        input.value = existing ?? "";
        input.placeholder = suggested && !existing ? suggested : "";
        if (!existing && suggested && isRepeated(node, counts)) {
          input.classList.add("is-missing");
        }
        input.addEventListener("change", () => {
          if (!input.value.trim()) {
            for (const bag of session.languages) {
              const slot = session.documentation[bag]?.[node.path];
              if (slot) delete slot[`L10n.${lang}`];
            }
          } else {
            const bags = session.copyToAllBags
              ? session.languages
              : [session.editorLanguage];
            for (const bag of bags) {
              setAnnotation(session, node.path, `L10n.${lang}`, input.value, bag);
            }
          }
          session.selectedPath = node.path;
          rerender();
        });
        td.appendChild(input);
        tr.appendChild(td);
      }

      const otherTd = document.createElement("td");
      otherTd.className = "matrix-other";
      otherTd.innerHTML = other.length
        ? other.map(([k, v]) =>
          `<code>${escapeHtml(k)}</code>=${escapeHtml(v)}`
        ).join("<br>")
        : `<button type="button" class="btn-link" data-add>add key…</button>`;
      otherTd.querySelector("[data-add]")?.addEventListener("click", () => {
        const key = "comment";
        setAnnotation(session, node.path, key, "", session.editorLanguage);
        session.selectedPath = node.path;
        rerender();
      });
      tr.appendChild(otherTd);
      tbody.appendChild(tr);
    }
  };
  paint();
  search.addEventListener("input", () => paint(search.value));
  scroller.appendChild(table);
  host.append(toolbar, scroller);
}

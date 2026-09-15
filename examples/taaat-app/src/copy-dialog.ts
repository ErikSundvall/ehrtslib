/**
 * Confirmation dialog: copy original-language annotations into one other bag.
 */

import {
  type AnnotationCopyItem,
  copyItemId,
  defaultCopySelection,
  groupCopyItemsByFamily,
} from "../../../parser/copy_original_annotations.ts";
import { familyLegendLabel } from "../../../parser/annotation_families.ts";
import {
  type SlButton,
  type SlCheckbox,
  type SlDialog,
  slEl,
  type SlSelect,
  slValue,
} from "./sl.ts";

export interface CopyOriginalDialogHost {
  sourceLanguage: () => string | undefined;
  targetLanguages: () => string[];
  collectItems: (targetLanguage: string) => AnnotationCopyItem[];
  applyItems: (targetLanguage: string, items: AnnotationCopyItem[]) => void;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemLabel(item: AnnotationCopyItem, target: string): string {
  const path = item.path || "(definition root)";
  const owner = item.ownerId ? `${item.ownerId} · ` : "";
  let extra = "";
  if (item.existingTargetValue != null) {
    extra = item.existingTargetValue === item.value
      ? ` — ${target} already matches`
      : ` — ${target} currently “${item.existingTargetValue}”`;
  }
  return `${owner}${item.key} @ ${path} = ${item.value}${extra}`;
}

export function mountCopyOriginalDialog(
  host: CopyOriginalDialogHost,
): { open: () => void; dialog: SlDialog } {
  const dialog = slEl<SlDialog>("sl-dialog", {
    className: "copy-original-dialog",
  });
  dialog.id = "copy-original-dialog";
  dialog.label = "Copy original-language annotations";

  const body = document.createElement("div");
  body.className = "copy-dialog-body";
  dialog.appendChild(body);

  const cancel = slEl<SlButton>("sl-button", {
    variant: "default",
    size: "small",
    text: "Cancel",
  });
  cancel.slot = "footer";
  const apply = slEl<SlButton>("sl-button", {
    variant: "primary",
    size: "small",
    text: "Copy selected",
  });
  apply.slot = "footer";
  apply.id = "copy-original-apply";
  dialog.append(cancel, apply);

  let items: AnnotationCopyItem[] = [];
  let selected = new Set<string>();
  let target = "";

  const setAll = (ids: string[], on: boolean) => {
    for (const id of ids) {
      if (on) selected.add(id);
      else selected.delete(id);
    }
  };

  const paint = () => {
    const source = host.sourceLanguage() ?? "";
    const targets = host.targetLanguages();
    if (!target || !targets.includes(target)) target = targets[0] ?? "";
    items = target ? host.collectItems(target) : [];
    const knownIds = new Set(items.map(copyItemId));
    selected = new Set([...selected].filter((id) => knownIds.has(id)));

    body.innerHTML = "";
    const lead = document.createElement("p");
    lead.className = "copy-dialog-lead";
    lead.innerHTML = `Copy from original language <strong>${
      escapeHtml(source || "?")
    }</strong> into another bag. Language-independent families such as <code>a.</code> are selected by default; natural-language keys stay unchecked.`;
    body.appendChild(lead);

    const targetRow = document.createElement("div");
    targetRow.className = "copy-target-row";
    const targetLabel = document.createElement("label");
    targetLabel.textContent = "Target language";
    const select = slEl<SlSelect>("sl-select", {
      size: "small",
      hoist: true,
      className: "copy-target-select",
    });
    select.id = "copy-original-target";
    select.value = target;
    for (const lang of targets) {
      const opt = document.createElement("sl-option") as HTMLElement & {
        value: string;
      };
      opt.value = lang;
      opt.textContent = lang;
      select.appendChild(opt);
    }
    select.addEventListener("sl-change", () => {
      target = slValue(select);
      selected = defaultCopySelection(host.collectItems(target));
      paint();
    });
    targetRow.append(targetLabel, select);
    body.appendChild(targetRow);

    const globalBtns = document.createElement("div");
    globalBtns.className = "copy-select-bar";
    const allBtn = slEl<SlButton>("sl-button", {
      size: "small",
      variant: "default",
      text: "Select all",
    });
    allBtn.id = "copy-select-all";
    allBtn.addEventListener("click", () => {
      setAll(items.map(copyItemId), true);
      paint();
    });
    const noneBtn = slEl<SlButton>("sl-button", {
      size: "small",
      variant: "default",
      text: "Select none",
    });
    noneBtn.id = "copy-select-none";
    noneBtn.addEventListener("click", () => {
      selected.clear();
      paint();
    });
    const count = document.createElement("span");
    count.className = "muted";
    count.textContent = `${selected.size} of ${items.length} selected`;
    globalBtns.append(allBtn, noneBtn, count);
    body.appendChild(globalBtns);

    if (!targets.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No other language bags on this model.";
      body.appendChild(empty);
      apply.disabled = true;
      return;
    }
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent =
        "The original language bag has no annotation values to copy.";
      body.appendChild(empty);
      apply.disabled = true;
      return;
    }

    apply.disabled = selected.size === 0;
    const groups = groupCopyItemsByFamily(items);
    for (const group of groups) {
      const details = document.createElement("sl-details") as HTMLElement & {
        open: boolean;
      };
      details.className = "copy-family";
      details.open = true;
      const ids = group.items.map(copyItemId);
      const nOn = ids.filter((id) => selected.has(id)).length;
      const summary = document.createElement("span");
      summary.slot = "summary";
      summary.className = "copy-family-summary";
      summary.innerHTML = `<span>${
        escapeHtml(familyLegendLabel(group.family))
      }</span><span class="copy-family-count">${nOn}/${ids.length}</span>`;
      details.appendChild(summary);

      const famBar = document.createElement("div");
      famBar.className = "copy-select-bar copy-family-bar";
      const famAll = slEl<SlButton>("sl-button", {
        size: "small",
        variant: "text",
        text: "All in family",
      });
      famAll.dataset.family = group.family;
      famAll.addEventListener("click", () => {
        setAll(ids, true);
        paint();
      });
      const famNone = slEl<SlButton>("sl-button", {
        size: "small",
        variant: "text",
        text: "None in family",
      });
      famNone.dataset.family = group.family;
      famNone.addEventListener("click", () => {
        setAll(ids, false);
        paint();
      });
      famBar.append(famAll, famNone);
      details.appendChild(famBar);

      const list = document.createElement("div");
      list.className = "copy-item-list";
      for (const item of group.items) {
        const id = copyItemId(item);
        const cb = slEl<SlCheckbox>("sl-checkbox", {
          checked: selected.has(id),
          text: itemLabel(item, target),
        });
        cb.dataset.copyId = id;
        cb.addEventListener("sl-change", () => {
          if (cb.checked) selected.add(id);
          else selected.delete(id);
          apply.disabled = selected.size === 0;
          count.textContent = `${selected.size} of ${items.length} selected`;
          const on = ids.filter((fid) => selected.has(fid)).length;
          summary.querySelector(".copy-family-count")!.textContent =
            `${on}/${ids.length}`;
        });
        list.appendChild(cb);
      }
      details.appendChild(list);
      body.appendChild(details);
    }
  };

  cancel.addEventListener("click", () => dialog.hide());
  apply.addEventListener("click", () => {
    const chosen = items.filter((item) => selected.has(copyItemId(item)));
    if (!target || !chosen.length) return;
    host.applyItems(target, chosen);
    dialog.hide();
  });

  document.body.appendChild(dialog);

  return {
    dialog,
    open: () => {
      target = host.targetLanguages()[0] ?? "";
      items = target ? host.collectItems(target) : [];
      selected = defaultCopySelection(items);
      paint();
      dialog.label = `Copy original (${
        host.sourceLanguage() ?? "?"
      }) annotations`;
      dialog.show();
    },
  };
}

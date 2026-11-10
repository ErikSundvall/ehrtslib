/// <reference lib="dom" />
import type { FieldValidation } from "./cb-field-validation.ts";
import type { Field } from "./contribution-demo.ts";

export type FieldValidationHost = {
  control: HTMLElement;
  input: HTMLInputElement | HTMLTextAreaElement;
  mark: HTMLButtonElement;
};

const hostsByPanel = new WeakMap<
  HTMLElement,
  Map<Field, FieldValidationHost>
>();

function wrapControl(
  input: HTMLInputElement | HTMLTextAreaElement,
): HTMLElement {
  const parent = input.parentElement;
  if (parent?.classList.contains("field-control")) return parent;
  const shell = input.closest(".narrative-shell");
  const wrapTarget = shell ?? input;
  const control = document.createElement("div");
  control.className = "field-control";
  wrapTarget.parentElement?.insertBefore(control, wrapTarget);
  control.append(wrapTarget);
  return control;
}

export function ensureFieldValidationHosts(
  panel: HTMLElement,
): Map<Field, FieldValidationHost> {
  const existing = hostsByPanel.get(panel);
  if (existing) return existing;
  const hosts = new Map<Field, FieldValidationHost>();
  for (
    const input of panel.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >("[data-field]")
  ) {
    const field = input.dataset.field as Field;
    const control = wrapControl(input);
    let mark = control.querySelector<HTMLButtonElement>(
      ".field-validation-mark",
    );
    if (!mark) {
      mark = document.createElement("button");
      mark.type = "button";
      mark.className = "field-validation-mark";
      mark.hidden = true;
      mark.setAttribute("aria-live", "polite");
      const tip = document.createElement("span");
      tip.className = "field-validation-tooltip";
      tip.setAttribute("role", "tooltip");
      mark.append("⚠", tip);
      control.append(mark);
    }
    hosts.set(field, { control, input, mark });
  }
  hostsByPanel.set(panel, hosts);
  return hosts;
}

export function paintFieldValidation(
  hosts: Map<Field, FieldValidationHost>,
  views: FieldValidation[],
): void {
  const active = new Set(views.map((v) => v.field));
  for (const [field, host] of hosts) {
    const view = views.find((v) => v.field === field);
    const invalid = !!view;
    host.input.classList.toggle("field-input--invalid", invalid);
    host.control.classList.toggle("field-control--invalid", invalid);
    host.input.setAttribute("aria-invalid", invalid ? "true" : "false");
    if (!invalid) {
      host.mark.hidden = true;
      host.mark.removeAttribute("aria-label");
      host.mark.querySelector(".field-validation-tooltip")!.textContent = "";
      continue;
    }
    host.mark.hidden = false;
    host.mark.setAttribute("aria-label", view!.message);
    host.mark.querySelector(".field-validation-tooltip")!.textContent =
      view!.message;
    if (!active.has(field)) continue;
  }
}

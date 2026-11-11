/// <reference lib="dom" />
import type { Field } from "./contribution-demo.ts";
import { isLongText } from "./contribution-demo.ts";

/** Tab order of clinical fields inside each clone form (matches the template markup). */
export const CLONE_FIELD_TAB_ORDER: readonly Field[] = [
  "systolic",
  "diastolic",
  "pulse",
  "respirationRate",
  "temperature",
  "spo2",
  "temperatureComment",
  "diagnosisName",
  "clinicalDescription",
  "comment",
];

export function isSingleLineField(input: HTMLElement): boolean {
  if (!(input instanceof HTMLInputElement)) return false;
  return !["button", "submit", "reset", "checkbox", "radio", "file"].includes(
    input.type,
  );
}

export function nextFieldInput(
  panel: ParentNode,
  current: HTMLElement,
): HTMLInputElement | HTMLTextAreaElement | undefined {
  const fields = CLONE_FIELD_TAB_ORDER.map((field) =>
    panel.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[data-field="${field}"]`,
    )
  ).filter((el): el is HTMLInputElement | HTMLTextAreaElement => !!el);
  const idx = fields.indexOf(
    current as HTMLInputElement | HTMLTextAreaElement,
  );
  if (idx < 0 || idx >= fields.length - 1) return undefined;
  const next = fields[idx + 1];
  if (next.disabled) return nextFieldInput(panel, next);
  return next;
}

/**
 * Confirm a single-line field (like blur/change) and move focus forward. Returns
 * false when Enter should keep its default behaviour (e.g. textarea newline).
 */
export function handleFieldEnterKey(
  event: KeyboardEvent,
  panel: ParentNode,
  confirm: (input: HTMLInputElement) => void,
): boolean {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
    return false;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  const field = target.dataset.field as Field | undefined;
  if (!field || isLongText(field)) return false;
  if (!isSingleLineField(target)) return false;
  event.preventDefault();
  event.stopPropagation();
  confirm(target as HTMLInputElement);
  const next = nextFieldInput(panel, target);
  next?.focus();
  return true;
}

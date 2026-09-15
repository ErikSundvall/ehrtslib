/** Tiny helpers for Shoelace custom elements created from TypeScript. */

export type SlInput = HTMLElement & { value: string };
export type SlButton = HTMLElement & {
  loading: boolean;
  disabled: boolean;
  variant: string;
};
export type SlSelect = HTMLElement & { value: string };
export type SlCheckbox = HTMLElement & { checked: boolean };
export type SlDetails = HTMLElement & { open: boolean };
export type SlDialog = HTMLElement & {
  open: boolean;
  label: string;
  show: () => void;
  hide: () => void;
};
export type SlAlert = HTMLElement & {
  open: boolean;
  variant: string;
};

export function slEl<T extends HTMLElement>(
  tag: string,
  props: Record<string, unknown> = {},
): T {
  const el = document.createElement(tag) as T;
  applySl(el, props);
  return el;
}

export function applySl(el: HTMLElement, props: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined) continue;
    if (k === "className" || k === "class") el.className = String(v);
    else if (k === "text") el.textContent = String(v);
    else if (k === "html") el.innerHTML = String(v);
    else if (k === "style" && typeof v === "string") {
      el.setAttribute("style", v);
    } else {
      (el as unknown as Record<string, unknown>)[k] = v;
    }
  }
}

export function slValue(el: Element | null | undefined): string {
  if (!el) return "";
  return String((el as SlInput).value ?? "");
}

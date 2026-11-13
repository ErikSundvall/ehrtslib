/** Whether an in-progress field edit may be applied (soft validation while editing). */

export function mayApplyFieldEdit(
  input: HTMLInputElement | HTMLTextAreaElement,
): boolean {
  if (input.tagName === "INPUT" && input.type === "number") {
    if (input.value === "") return true;
    const n = input.valueAsNumber;
    if (!Number.isFinite(n)) return false;
    if (input.min !== "" && n < Number(input.min)) return false;
    if (input.max !== "" && n > Number(input.max)) return false;
  }
  return true;
}

export function dataFieldInputsLackNativeRequired(html: string): boolean {
  const tags = html.match(/<(?:input|textarea)[^>]*\bdata-field\b[^>]*>/gi) ??
    [];
  return tags.every((tag) => !/\brequired\b/i.test(tag));
}

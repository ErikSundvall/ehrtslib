/** Custom flow-style text serializer for j-zipehr output (ported from ehrtslib-compact.js). */

export function flowFormat(value: unknown, indentLevel = 0): string {
  const indent = "  ".repeat(indentLevel);
  const nextIndent = "  ".repeat(indentLevel + 1);

  function inlineFormat(v: unknown): string {
    if (v === null) return "null";
    if (typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) {
      return "[" + v.map((e) => inlineFormat(e)).join(", ") + "]";
    }
    if (typeof v === "object") {
      const ks = Object.keys(v as object);
      if (ks.length === 0) return "{}";
      return "{ " +
        ks.map((k) => `${k}: ${inlineFormat((v as Record<string, unknown>)[k])}`)
          .join(", ") + " }";
    }
    return JSON.stringify(String(v));
  }

  if (
    indentLevel === 0 && typeof value === "object" && value !== null &&
    !Array.isArray(value)
  ) {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    const lines = keys.map((k) => {
      const v = (value as Record<string, unknown>)[k];
      if (Array.isArray(v) && v.some((e) => typeof e === "object")) {
        const elemIndent = "  ".repeat(indentLevel + 2);
        const elems = v.map((e) => elemIndent + inlineFormat(e));
        return `${nextIndent}${k}: [\n${elems.join(",\n")}\n${nextIndent}]`;
      }
      return `${nextIndent}${k}: ${inlineFormat(v)}`;
    });
    return "{\n" + lines.join(",\n") + "\n" + indent + "}";
  }

  return inlineFormat(value);
}

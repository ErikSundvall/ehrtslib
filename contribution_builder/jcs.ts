/**
 * RFC 8785 JSON Canonicalization Scheme (JCS).
 *
 * https://www.rfc-editor.org/rfc/rfc8785
 *
 * - Object members sorted by their names as UTF-16 code unit sequences.
 * - Numbers in ECMAScript `Number.prototype.toString` form (what
 *   `JSON.stringify` emits for finite numbers).
 * - Strings escaped as by ECMAScript `JSON.stringify`.
 * - No whitespace. Array order is kept (JCS does not sort arrays).
 *
 * `undefined` members are dropped as in `JSON.stringify`. Non-finite numbers,
 * lone surrogates (not I-JSON) and non-plain values (functions, bigint,
 * symbols) are rejected.
 */

export class JcsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JcsError";
  }
}

const LONE_SURROGATE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

function serializeString(s: string): string {
  if (LONE_SURROGATE.test(s)) {
    throw new JcsError(
      "RFC 8785: string contains a lone surrogate (not I-JSON)",
    );
  }
  return JSON.stringify(s);
}

function compareUtf16(a: string, b: string): number {
  // JS string comparison is by UTF-16 code units, which is what RFC 8785 requires.
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Canonicalize a JSON-compatible value to its RFC 8785 string form. */
export function canonicalizeJson(value: unknown): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        throw new JcsError(`RFC 8785: non-finite number ${value}`);
      }
      return JSON.stringify(value);
    case "string":
      return serializeString(value);
    case "object": {
      const v = value as { toJSON?: () => unknown };
      if (typeof v.toJSON === "function") return canonicalizeJson(v.toJSON());
      if (Array.isArray(value)) {
        return "[" + value.map((item) =>
          item === undefined ? "null" : canonicalizeJson(item)
        ).join(",") + "]";
      }
      const rec = value as Record<string, unknown>;
      const keys = Object.keys(rec).filter((k) => rec[k] !== undefined).sort(
        compareUtf16,
      );
      return "{" +
        keys.map((k) => serializeString(k) + ":" + canonicalizeJson(rec[k]))
          .join(",") +
        "}";
    }
    default:
      throw new JcsError(`RFC 8785: cannot canonicalize a ${typeof value}`);
  }
}

/** Lower-case hex sha256 of the UTF-8 bytes of `text` (WebCrypto; Deno and browsers). */
export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(
    new Uint8Array(digest),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}

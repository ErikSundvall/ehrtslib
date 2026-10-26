/**
 * RFC 8785 JSON Canonicalization Scheme (JCS).
 *
 * https://www.rfc-editor.org/rfc/rfc8785
 *
 * The canonical form (member order, number and string serialisation) comes
 * from the pinned `canonicalize` package. This wrapper keeps ehrtslib's
 * stricter input rules (I-JSON, RFC 7493) in front of it:
 *
 * - Non-finite numbers, lone surrogates in strings or member names, cycles
 *   and non-JSON values (functions, bigint, symbols, a top-level
 *   `undefined`, a `toJSON()` that returns `undefined`) throw `JcsError`.
 * - `undefined` object members are dropped and `undefined` array items
 *   become `null`, as in `JSON.stringify`.
 * - `toJSON()` is honoured (once per value) as in `JSON.stringify`.
 */

import canonicalize from "canonicalize";

export class JcsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JcsError";
  }
}

const LONE_SURROGATE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

function checkString(s: string, what: string): string {
  if (LONE_SURROGATE.test(s)) {
    throw new JcsError(
      `RFC 8785: ${what} contains a lone surrogate (not I-JSON)`,
    );
  }
  return s;
}

/**
 * Checks `value` against the I-JSON rules and returns a plain JSON copy:
 * `toJSON()` applied, `undefined` members dropped, `undefined` array items
 * turned into `null`.
 */
function toIJson(value: unknown, stack: Set<object>): unknown {
  if (value === null) return null;
  switch (typeof value) {
    case "boolean":
      return value;
    case "number":
      if (!Number.isFinite(value)) {
        throw new JcsError(`RFC 8785: non-finite number ${value}`);
      }
      return value;
    case "string":
      return checkString(value, "string");
    case "object": {
      if (stack.has(value)) {
        throw new JcsError("RFC 8785: circular reference");
      }
      stack.add(value);
      try {
        const v = value as { toJSON?: () => unknown };
        if (typeof v.toJSON === "function") {
          const resolved = v.toJSON();
          if (resolved === undefined) {
            throw new JcsError("RFC 8785: toJSON() returned undefined");
          }
          return toIJson(resolved, stack);
        }
        if (Array.isArray(value)) {
          return value.map((item) =>
            item === undefined ? null : toIJson(item, stack)
          );
        }
        const out: Record<string, unknown> = {};
        for (const [k, item] of Object.entries(value)) {
          if (item === undefined) continue;
          out[checkString(k, "member name")] = toIJson(item, stack);
        }
        return out;
      } finally {
        stack.delete(value);
      }
    }
    default:
      throw new JcsError(`RFC 8785: cannot canonicalize a ${typeof value}`);
  }
}

/** Canonicalize a JSON-compatible value to its RFC 8785 string form. */
export function canonicalizeJson(value: unknown): string {
  const plain = toIJson(value, new Set());
  let out: string | undefined;
  try {
    out = canonicalize(plain);
  } catch (e) {
    throw new JcsError(`RFC 8785: ${(e as Error).message}`);
  }
  if (out === undefined) {
    throw new JcsError("RFC 8785: value has no JSON form");
  }
  return out;
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

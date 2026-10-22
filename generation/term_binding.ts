/**
 * Map an ADL2 term-binding target to the terminology id + code string that
 * ADL 1.4 and OPT 1.4 can store.
 *
 * Accepted targets:
 * - `[terminology::code]`
 * - `http(s)://<host>[/ver/<version>]/id/<code>` (openEHR, SNOMED CT, LOINC,
 *   or the binding key). A version is kept as `name(version)` (`LOINC(2.65)`),
 *   which is the ADL 1.4 `TERMINOLOGY_ID` form.
 * - FHIR code-system URIs `…#<code>` (terminology id is the binding key)
 * - OBO PURLs `http://purl.obolibrary.org/obo/<PREFIX>_<id>` (code is the
 *   numeric id; terminology id is the binding key)
 *
 * Anything else is not exported. Callers warn with {@link TermBindingParse.warning}.
 */

export interface ParsedTermBinding {
  terminology: string;
  code: string;
}

export interface TermBindingParse {
  binding?: ParsedTermBinding;
  /** Why the target cannot be mapped. Set only when `binding` is absent. */
  warning?: string;
}

export type BindingKeyKind = "code" | "path" | "constraint" | "other";

/** `at`/`id` codes are term bindings; `ac` codes are constraint bindings; paths stay paths. */
export function bindingKeyKind(code: string): BindingKeyKind {
  if (code.startsWith("/")) return "path";
  if (/^ac\d/i.test(code)) return "constraint";
  if (/^(id|at)\d/i.test(code)) return "code";
  return "other";
}

export function parseTermBinding(
  terminologyKey: string,
  raw: string,
): TermBindingParse {
  let t = raw.trim();
  if (t.startsWith("<") && t.endsWith(">")) t = t.slice(1, -1).trim();
  if (t.startsWith("[") && t.endsWith("]")) t = t.slice(1, -1).trim();
  if (!t) {
    return { warning: "empty target" };
  }

  if (!/^https?:\/\//i.test(t)) {
    const phrase = /^([\w.\-]+(?:\([\w.\-]+\))?)::(.+)$/.exec(t);
    if (phrase && phrase[2]) {
      return { binding: { terminology: phrase[1], code: phrase[2] } };
    }
  }

  const obo =
    /^https?:\/\/purl\.obolibrary\.org\/obo\/[A-Za-z][A-Za-z0-9]*?_(\d+)$/i
      .exec(t);
  if (obo) {
    return { binding: { terminology: terminologyKey, code: obo[1] } };
  }

  const idUrl =
    /^https?:\/\/([^/\s]+)(?:\/ver\/([^/\s]+))?\/id\/(.+)$/.exec(t);
  if (idUrl) {
    const host = idUrl[1];
    const version = idUrl[2];
    const base = /openehr\.org/i.test(host)
      ? "openehr"
      : /snomed/i.test(host)
      ? "SNOMED-CT"
      : /loinc/i.test(host)
      ? "LOINC"
      : terminologyKey;
    const terminology = version && /^[\w.\-]+$/.test(version)
      ? `${base}(${version})`
      : base;
    return { binding: { terminology, code: idUrl[3] } };
  }

  const hash = /^https?:\/\/\S+#([^#/\s]+)$/.exec(t);
  if (hash) {
    return { binding: { terminology: terminologyKey, code: hash[1] } };
  }

  return { warning: `unrecognized target '${raw.trim()}'` };
}

/** `[terminology::code]` when both parts are safe to emit in ADL 1.4. */
export function formatCodePhrase(
  terminology: string,
  code: string,
): string | undefined {
  // TERMINOLOGY_ID: name, or name(version) such as LOINC(2.65).
  if (!/^[\w.\-]+(?:\([\w.\-]+\))?$/.test(terminology)) return undefined;
  if (!code || /[\]<>\s]/.test(code)) return undefined;
  return `[${terminology}::${code}]`;
}

export function isBindingUri(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

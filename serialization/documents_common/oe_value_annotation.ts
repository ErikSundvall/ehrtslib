/**
 * Sparse machine-readable value annotations for structural Markdown / lossless AsciiDoc.
 *
 * Grammar (v1): `oe:v1:b64:<base64url(UTF-8 JSON)>` inside
 * - Markdown: `<!-- oe:v1:b64:... -->` (HTML comment; hidden in CommonMark/GFM renderers)
 * - AsciiDoc: line or end-of-line `// oe:v1:b64:...`
 *
 * JSON payload is a minimal plain RM data-value object (`_type` required).
 */

import { InvalidFormatError } from "../common/errors.ts";
import { parseDataValueDisplay } from "./value_parse.ts";

export const OE_VALUE_ANNOTATION_PREFIX = "oe:v1:b64:" as const;

const B64URL = /^(?:[A-Za-z0-9_-]+\.?)*$/;

function termIdValue(cp: unknown): string | undefined {
  if (!cp || typeof cp !== "object") return undefined;
  const t = (cp as Record<string, unknown>).terminology_id;
  if (!t || typeof t !== "object") return undefined;
  return (t as Record<string, unknown>).value as string | undefined;
}

function codeString(cp: unknown): string | undefined {
  if (!cp || typeof cp !== "object") return undefined;
  return (cp as Record<string, unknown>).code_string as string | undefined;
}

/** True when {@link parseDataValueDisplay} on `display` recovers the same RM value shape as `dv`. */
export function displayTextRecoversDataValue(
  dv: Record<string, unknown>,
  display: string,
): boolean {
  const inferred = parseDataValueDisplay(display);
  return dataValuesEqualForRoundTrip(dv, inferred);
}

/**
 * Emit a hidden annotation only when visible text cannot recover type/codes/precision unambiguously.
 */
export function needsOeValueAnnotation(
  dv: Record<string, unknown> | null | undefined,
  display: string,
): boolean {
  if (!dv || typeof dv !== "object") return false;
  const type = dv._type;
  if (typeof type !== "string") return false;

  const inferred = parseDataValueDisplay(display);
  if (inferred._type !== type) return true;
  if (!dataValuesEqualForRoundTrip(dv, inferred)) return true;
  return hasExtraRoundTripFields(dv, inferred);
}

function hasExtraRoundTripFields(
  actual: Record<string, unknown>,
  inferred: Record<string, unknown>,
): boolean {
  const t = actual._type;
  if (t === "DV_QUANTITY") {
    if (actual.precision !== undefined && inferred.precision === undefined) return true;
  }
  if (t === "DV_CODED_TEXT" && actual.defining_code && !inferred.defining_code) return true;
  if (t === "DV_ORDINAL") return true;
  if (t === "DV_COUNT" && inferred._type !== "DV_COUNT") return true;
  return false;
}

export function dataValuesEqualForRoundTrip(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  if (a._type !== b._type) return false;
  switch (a._type) {
    case "DV_TEXT":
      return a.value === b.value;
    case "DV_BOOLEAN":
      return a.value === b.value;
    case "DV_QUANTITY":
      return a.magnitude === b.magnitude && a.units === b.units &&
        (a.precision === undefined || a.precision === b.precision);
    case "DV_COUNT":
      return a.magnitude === b.magnitude;
    case "DV_CODED_TEXT":
      return a.value === b.value &&
        termIdValue(a.defining_code) === termIdValue(b.defining_code) &&
        codeString(a.defining_code) === codeString(b.defining_code);
    case "CODE_PHRASE":
      return termIdValue(a) === termIdValue(b) && codeString(a) === codeString(b);
    case "DV_DATE_TIME":
    case "DV_DATE":
    case "DV_TIME":
    case "DV_DURATION":
      return a.value === b.value;
    default:
      return JSON.stringify(compactDataValue(a)) === JSON.stringify(compactDataValue(b));
  }
}

/** Strip non-essential keys for stable annotation payloads. */
export function compactDataValue(dv: Record<string, unknown>): Record<string, unknown> {
  const t = dv._type;
  if (typeof t !== "string") return { ...dv };

  const out: Record<string, unknown> = { _type: t };
  const copy = (keys: string[]) => {
    for (const k of keys) {
      if (dv[k] !== undefined) out[k] = cloneAnnotationPart(dv[k]);
    }
  };

  switch (t) {
    case "DV_TEXT":
      copy(["value"]);
      break;
    case "DV_BOOLEAN":
      copy(["value"]);
      break;
    case "DV_QUANTITY":
      copy(["magnitude", "units", "precision"]);
      break;
    case "DV_COUNT":
      copy(["magnitude"]);
      break;
    case "DV_CODED_TEXT":
      copy(["value", "defining_code", "mapping", "normal_status"]);
      break;
    case "CODE_PHRASE":
      copy(["terminology_id", "code_string", "preferred_term"]);
      break;
    case "DV_ORDINAL":
      copy(["value", "symbol"]);
      break;
    case "DV_DATE_TIME":
    case "DV_DATE":
    case "DV_TIME":
    case "DV_DURATION":
      copy(["value"]);
      break;
    case "DV_PROPORTION":
      copy(["numerator", "denominator", "type", "precision"]);
      break;
    default:
      for (const [k, v] of Object.entries(dv)) {
        if (k !== "_type") out[k] = cloneAnnotationPart(v);
      }
  }
  return out;
}

function cloneAnnotationPart(v: unknown): unknown {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(cloneAnnotationPart);
  const r = v as Record<string, unknown>;
  if (typeof r._type === "string") return compactDataValue(r);
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(r)) out[k] = cloneAnnotationPart(val);
  return out;
}

function base64UrlEncode(bytes: Uint8Array): string {
  const bin = String.fromCharCode(...bytes);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(s: string): Uint8Array {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeOeValueAnnotationPayload(dv: Record<string, unknown>): string {
  const json = JSON.stringify(compactDataValue(dv));
  const bytes = new TextEncoder().encode(json);
  return `${OE_VALUE_ANNOTATION_PREFIX}${base64UrlEncode(bytes)}`;
}

export function formatOeValueAnnotationMarkdown(dv: Record<string, unknown>): string {
  return ` <!-- ${encodeOeValueAnnotationPayload(dv)} -->`;
}

export function formatOeValueAnnotationAsciidoc(dv: Record<string, unknown>): string {
  return ` // ${encodeOeValueAnnotationPayload(dv)}`;
}

export function parseOeValueAnnotationPayload(
  payload: string,
  source?: string,
): Record<string, unknown> {
  if (!payload.startsWith(OE_VALUE_ANNOTATION_PREFIX)) {
    throw new InvalidFormatError(
      `Malformed openEHR value annotation (expected ${OE_VALUE_ANNOTATION_PREFIX}…)`,
      source,
    );
  }
  const b64 = payload.slice(OE_VALUE_ANNOTATION_PREFIX.length);
  if (!B64URL.test(b64) || b64.length < 4) {
    throw new InvalidFormatError("Malformed openEHR value annotation: invalid base64url payload", source);
  }
  let parsed: unknown;
  try {
    const text = new TextDecoder().decode(base64UrlDecode(b64));
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidFormatError("Malformed openEHR value annotation: payload is not valid JSON", source);
  }
  if (!parsed || typeof parsed !== "object" || typeof (parsed as Record<string, unknown>)._type !== "string") {
    throw new InvalidFormatError("Malformed openEHR value annotation: missing _type", source);
  }
  return parsed as Record<string, unknown>;
}

export function resolveDataValueFromDisplayAndAnnotation(
  display: string,
  oePayload: string | undefined,
  source?: string,
): Record<string, unknown> {
  if (!oePayload) return parseDataValueDisplay(display);
  const fromAnn = parseOeValueAnnotationPayload(oePayload, source);
  const fromDisplay = parseDataValueDisplay(display);
  if (!dataValuesEqualForRoundTrip(fromAnn, fromDisplay) &&
    fromAnn._type !== fromDisplay._type) {
    // Annotation is authoritative; still reject if display contradicts a critical identity field.
    if (fromAnn._type === "DV_CODED_TEXT" && fromDisplay._type === "DV_CODED_TEXT" &&
      fromAnn.value !== fromDisplay.value) {
      throw new InvalidFormatError(
        "Value annotation contradicts visible coded text value",
        source,
      );
    }
  }
  return fromAnn;
}

export function isOeValueAnnotationInner(text: string): boolean {
  return text.startsWith(OE_VALUE_ANNOTATION_PREFIX);
}

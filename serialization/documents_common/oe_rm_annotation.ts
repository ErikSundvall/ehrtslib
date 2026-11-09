/**
 * Sparse hidden RM object annotations (structural presets only).
 * Grammar: `oe:rm:v1:b64:<base64url(JSON)>` — JSON is a plain RM object with `_type`.
 */

import { InvalidFormatError } from "../common/errors.ts";
import { compactDataValue } from "./oe_value_annotation.ts";

export const OE_RM_ANNOTATION_PREFIX = "oe:rm:v1:b64:" as const;

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

/** Compact any RM object tree for stable annotation payloads. */
export function compactRmObject(obj: Record<string, unknown>): Record<string, unknown> {
  if (typeof obj._type === "string") return compactDataValue(obj);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] = compactRmValue(v);
  }
  return out;
}

function compactRmValue(v: unknown): unknown {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(compactRmValue);
  const o = v as Record<string, unknown>;
  if (typeof o._type === "string") return compactDataValue(o);
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(o)) {
    if (val === undefined) continue;
    out[k] = compactRmValue(val);
  }
  return out;
}

export function encodeOeRmAnnotationPayload(obj: Record<string, unknown>): string {
  const json = JSON.stringify(compactRmObject(obj));
  const bytes = new TextEncoder().encode(json);
  return `${OE_RM_ANNOTATION_PREFIX}${base64UrlEncode(bytes)}`;
}

export function formatOeRmAnnotationMarkdown(obj: Record<string, unknown>): string {
  return ` <!-- ${encodeOeRmAnnotationPayload(obj)} -->`;
}

export function formatOeRmAnnotationAsciidoc(obj: Record<string, unknown>): string {
  return ` // ${encodeOeRmAnnotationPayload(obj)}`;
}

export function isOeRmAnnotationInner(text: string): boolean {
  return text.startsWith(OE_RM_ANNOTATION_PREFIX);
}

export function parseOeRmAnnotationPayload(
  payload: string,
  source?: string,
  options?: { requireType?: boolean },
): Record<string, unknown> {
  const requireType = options?.requireType !== false;
  if (!payload.startsWith(OE_RM_ANNOTATION_PREFIX)) {
    throw new InvalidFormatError(
      `Malformed RM annotation (expected ${OE_RM_ANNOTATION_PREFIX}…)`,
      source,
    );
  }
  const b64 = payload.slice(OE_RM_ANNOTATION_PREFIX.length);
  try {
    const text = new TextDecoder().decode(base64UrlDecode(b64));
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      throw new InvalidFormatError("RM annotation is not a JSON object", source);
    }
    if (requireType && typeof parsed._type !== "string") {
      throw new InvalidFormatError("RM annotation missing _type", source);
    }
    return parsed;
  } catch (e) {
    if (e instanceof InvalidFormatError) throw e;
    throw new InvalidFormatError("RM annotation is not valid JSON", source);
  }
}

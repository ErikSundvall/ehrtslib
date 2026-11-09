/**
 * RM-aware display rendering for Markdown / AsciiDoc document serializers.
 * Avoids `(complex value)`, `[object Object]`, and `undefined` in output.
 */

import { TypeRegistry } from "../common/type_registry.ts";
import { toTerseCodePhrase } from "../terse_format.ts";

export const FORBIDDEN_DOCUMENT_OUTPUT_MARKERS = [
  "(complex value)",
  "[object Object]",
  "undefined",
] as const;

export type DocumentRmCodeRendering =
  | "hidden"
  | "inline_bracket"
  | "wikilink"
  | "wikilink_urn"
  | "footnote"
  | "macro";

export interface DocumentRmRenderOptions {
  /** Lossy presets use shorter party/id text. */
  lossy: boolean;
  useTerseFormat: boolean;
  codeRendering: DocumentRmCodeRendering;
  includeTypeAnnotations: boolean;
  maxDepth?: number;
}

const DEFAULT_MAX_DEPTH = 6;

export function scalarFieldString(field: unknown): string {
  if (field === null || field === undefined) return "";
  if (typeof field === "string") return field;
  if (typeof field === "number" || typeof field === "boolean") return String(field);
  if (typeof field === "object") {
    const o = field as Record<string, unknown>;
    if (typeof o.value === "string") return o.value;
    if (typeof o.value === "number") return String(o.value);
    if (o.code_string !== undefined) {
      return String(o.code_string);
    }
  }
  return "";
}

export function typeNameOf(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  if (typeof o._type === "string") return o._type;
  return TypeRegistry.getTypeNameFromInstance(obj);
}

export function renderRmValue(
  value: unknown,
  opts: DocumentRmRenderOptions,
  depth = 0,
): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value !== "object") return String(value);

  const maxDepth = opts.maxDepth ?? DEFAULT_MAX_DEPTH;
  if (depth > maxDepth) return "…";

  const type = typeNameOf(value);
  const dv = value as Record<string, unknown>;

  if (type?.startsWith("DV_") || type === "CODE_PHRASE") {
    return renderDataValue(dv, type, opts, depth);
  }

  switch (type) {
    case "PARTY_IDENTIFIED":
    case "PARTY_RELATED":
    case "PARTY_PROXY":
      return renderParty(dv, opts, depth);
    case "PARTICIPATION":
      return renderParticipation(dv, opts, depth);
    case "PARTY_REF":
    case "OBJECT_REF":
    case "LOCATABLE_REF":
    case "ACCESS_GROUP_REF":
      return renderObjectRef(dv, opts);
    case "GENERIC_ID":
    case "HIER_OBJECT_ID":
    case "OBJECT_VERSION_ID":
      return renderGenericId(dv);
    case "DV_PARSABLE":
      return renderDvParsable(dv, opts);
    default:
      return renderGenericRmObject(dv, type, opts, depth);
  }
}

export function renderDataValue(
  dv: Record<string, unknown>,
  typeName: string | undefined,
  opts: DocumentRmRenderOptions,
  depth: number,
): string {
  const t = typeName ?? typeNameOf(dv) ?? "";

  switch (t) {
    case "DV_TEXT":
      return scalarFieldString(dv.value);
    case "DV_CODED_TEXT":
      return renderDvCodedText(dv, opts);
    case "DV_QUANTITY":
      return renderDvQuantity(dv);
    case "DV_COUNT":
      return String(dv.magnitude ?? "");
    case "DV_DATE_TIME":
    case "DV_DATE":
    case "DV_TIME":
    case "DV_DURATION":
      return scalarFieldString(dv.value);
    case "DV_BOOLEAN":
      if (dv.value === true) return "true";
      if (dv.value === false) return "false";
      return "";
    case "DV_PROPORTION":
      return renderDvProportion(dv);
    case "DV_ORDINAL":
      return renderDvOrdinal(dv, opts);
    case "DV_SCALE":
      return renderDvScale(dv, opts);
    case "DV_IDENTIFIER":
      return renderDvIdentifier(dv, opts);
    case "DV_URI":
    case "DV_EHR_URI":
      return scalarFieldString(dv.value);
    case "DV_PARSABLE":
      return renderDvParsable(dv, opts);
    case "DV_MULTIMEDIA":
      return renderDvMultimedia(dv);
    case "DV_STATE":
      return renderDvState(dv, opts);
    case "DV_PARAGRAPH":
      return renderDvParagraph(dv, opts);
    case "DV_INTERVAL":
      return renderDvInterval(dv, opts, depth);
    case "DV_PERIODIC_TIME_SPECIFICATION":
    case "DV_GENERAL_TIME_SPECIFICATION":
      return dv.value ? renderDvParsable(dv.value as Record<string, unknown>, opts) : "";
    case "CODE_PHRASE":
      return renderCodePhrase(dv, opts);
    default:
      if (dv.value !== undefined && typeof dv.value !== "object") {
        return String(dv.value);
      }
      if (dv.magnitude !== undefined) {
        const units = scalarFieldString(dv.units) ||
          (typeof dv.units === "string" ? dv.units : "");
        return `${dv.magnitude}${units ? ` ${units}` : ""}`;
      }
      if (t && opts.includeTypeAnnotations && !opts.lossy) {
        return `[${t}]`;
      }
      return renderGenericRmObject(dv, t, opts, depth);
  }
}

function renderParty(
  party: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
  depth: number,
): string {
  const name = scalarFieldString(party.name);
  const idParts: string[] = [];
  if (Array.isArray(party.identifiers)) {
    for (const id of party.identifiers) {
      const s = renderRmValue(id, opts, depth + 1);
      if (s && s !== "—") idParts.push(s);
    }
  }
  const ext = party.external_ref
    ? renderRmValue(party.external_ref, opts, depth + 1)
    : "";
  const bits = [name, idParts.length ? idParts.join("; ") : "", ext]
    .filter((x) => x);
  return bits.join(" · ") || name || "—";
}

function renderParticipation(
  p: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
  depth: number,
): string {
  const who = p.performer ? renderRmValue(p.performer, opts, depth + 1) : "";
  const role = p.function ? renderDvCodedText(p.function as Record<string, unknown>, opts) : "";
  const mode = p.mode ? renderDvCodedText(p.mode as Record<string, unknown>, opts) : "";
  const time = p.time ? scalarFieldString((p.time as Record<string, unknown>).value ?? p.time) : "";
  return [who, role && `role=${role}`, mode && `mode=${mode}`, time && `time=${time}`]
    .filter(Boolean)
    .join(", ");
}

function renderObjectRef(ref: Record<string, unknown>, opts: DocumentRmRenderOptions): string {
  const id = ref.id ? renderGenericId(ref.id as Record<string, unknown>) : "";
  const ns = scalarFieldString(ref.namespace);
  const type = scalarFieldString(ref.type);
  return [type, ns, id].filter(Boolean).join(":") || id || "—";
}

function renderGenericId(gid: Record<string, unknown>): string {
  const value = scalarFieldString(gid.value);
  const scheme = scalarFieldString(gid.scheme);
  if (value && scheme) return `${scheme}::${value}`;
  return value || scheme || "—";
}

function renderDvIdentifier(
  dv: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
): string {
  const id = scalarFieldString(dv.id);
  const issuer = scalarFieldString(dv.issuer);
  const assigner = scalarFieldString(dv.assigner);
  const type = scalarFieldString(dv.type);
  const parts = [id];
  if (issuer) parts.push(`issuer ${issuer}`);
  if (assigner) parts.push(`assigner ${assigner}`);
  if (type && !opts.lossy) parts.push(`type ${type}`);
  return parts.filter(Boolean).join(", ") || "—";
}

function renderDvParsable(
  dv: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
): string {
  const value = scalarFieldString(dv.value);
  const formalism = scalarFieldString(dv.formalism);
  if (opts.lossy) return value;
  return formalism ? `${value} (${formalism})` : value;
}

function renderDvMultimedia(dv: Record<string, unknown>): string {
  const mediaType = (dv.media_type as Record<string, unknown> | undefined)?.code_string ??
    "unknown";
  const size = dv.size !== undefined ? `${dv.size} bytes` : "";
  const altText = scalarFieldString(dv.alternate_text);
  const uri = dv.uri ? scalarFieldString((dv.uri as Record<string, unknown>).value) : "";
  const parts = [`multimedia/${mediaType}`, size, altText, uri].filter(Boolean);
  return parts.join(", ");
}

function renderDvState(
  dv: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
): string {
  const stateValue = dv.value
    ? renderDvCodedText(dv.value as Record<string, unknown>, opts)
    : "";
  const terminal = dv.is_terminal === true ? " (terminal)" : "";
  return `${stateValue}${terminal}`;
}

function renderDvParagraph(
  dv: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
): string {
  if (!Array.isArray(dv.items)) return "";
  return dv.items
    .map((item) => renderRmValue(item, opts, 0))
    .filter(Boolean)
    .join(" / ");
}

function renderDvInterval(
  dv: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
  depth: number,
): string {
  const lower = dv.lower ? renderRmValue(dv.lower, opts, depth + 1) : "*";
  const upper = dv.upper ? renderRmValue(dv.upper, opts, depth + 1) : "*";
  const lowerInc = dv.lower_included !== false ? "[" : "(";
  const upperInc = dv.upper_included !== false ? "]" : ")";
  return `${lowerInc}${lower}..${upper}${upperInc}`;
}

function renderDvProportion(dv: Record<string, unknown>): string {
  const num = dv.numerator ?? "";
  const den = dv.denominator ?? "";
  switch (dv.type) {
    case 0:
      return `${num}:${den}`;
    case 1:
      return String(num);
    case 2:
      return `${num}%`;
    case 3:
    case 4:
      return den ? `${num}/${den}` : String(num);
    default:
      return den ? `${num}/${den}` : String(num);
  }
}

function renderDvOrdinal(
  dv: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
): string {
  const ordinalValue = dv.value ?? "";
  const symbol = dv.symbol
    ? renderDvCodedText(dv.symbol as Record<string, unknown>, opts)
    : "";
  if (symbol) return `${ordinalValue} - ${symbol}`;
  return String(ordinalValue);
}

function renderDvScale(
  dv: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
): string {
  const scaleValue = dv.value ?? "";
  const symbol = dv.symbol
    ? renderDvCodedText(dv.symbol as Record<string, unknown>, opts)
    : "";
  if (symbol) return `${scaleValue} - ${symbol}`;
  return String(scaleValue);
}

function renderDvQuantity(dv: Record<string, unknown>): string {
  const mag = dv.magnitude ?? "";
  const units = typeof dv.units === "string" ? dv.units : "";
  return `${mag}${units ? ` ${units}` : ""}`.trim();
}

function renderDvCodedText(
  dv: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
): string {
  const rubric = scalarFieldString(dv.value);
  if (opts.codeRendering === "hidden") return rubric;
  const code = dv.defining_code
    ? renderCodeReference(dv.defining_code as Record<string, unknown>, opts)
    : "";
  if (!code) return rubric;
  if (opts.codeRendering === "wikilink" && code) {
    return rubric ? `${rubric} ${code}` : code;
  }
  return rubric ? `${rubric} ${code}` : code;
}

function renderCodePhrase(
  cp: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
): string {
  if (opts.useTerseFormat) return toTerseCodePhrase(cp);
  const termId = (cp.terminology_id as Record<string, unknown> | undefined)?.value ?? "";
  const code = cp.code_string ?? "";
  return `${termId}::${code}`;
}

function renderCodeReference(
  cp: Record<string, unknown>,
  opts: DocumentRmRenderOptions,
): string {
  const termId = (cp.terminology_id as Record<string, unknown> | undefined)?.value ?? "";
  const code = cp.code_string ?? "";
  switch (opts.codeRendering) {
    case "wikilink":
      return `[${termId}:${code}]`;
    case "inline_bracket":
    case "macro":
      return `[${termId}::${code}]`;
    case "footnote":
      return `${termId}::${code}`;
    default:
      return "";
  }
}

function renderGenericRmObject(
  obj: Record<string, unknown>,
  type: string | undefined,
  opts: DocumentRmRenderOptions,
  depth: number,
): string {
  const skip = new Set([
    "_type",
    "archetype_node_id",
    "archetype_details",
    "feeder_audit",
    "links",
  ]);
  const parts: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (skip.has(key) || val === undefined || val === null) continue;
    if (typeof val === "object" && !Array.isArray(val)) {
      const inner = renderRmValue(val, opts, depth + 1);
      if (inner && inner !== "—") parts.push(`${key}: ${inner}`);
    } else if (Array.isArray(val)) {
      const rendered = val
        .map((item) => renderRmValue(item, opts, depth + 1))
        .filter((s) => s && s !== "—");
      if (rendered.length) parts.push(`${key}: ${rendered.join("; ")}`);
    } else {
      parts.push(`${key}: ${String(val)}`);
    }
  }
  if (!parts.length) {
    if (type && opts.includeTypeAnnotations && !opts.lossy) return `[${type}]`;
    return "—";
  }
  return parts.join("; ");
}

export function assertNoForbiddenDocumentMarkers(text: string): void {
  for (const bad of FORBIDDEN_DOCUMENT_OUTPUT_MARKERS) {
    if (text.includes(bad)) {
      throw new Error(`Forbidden document output marker: ${bad}`);
    }
  }
}

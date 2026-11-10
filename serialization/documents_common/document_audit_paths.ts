/**
 * Path flattening and structural diff for document codec audit tests.
 */

import { JsonCanonicalSerializer } from "../json/json_canonical_serializer.ts";
import { normalizeCompositionEntryDefaultsInPlace } from "./document_entry_defaults.ts";

function canonicalTree(value: unknown): unknown {
  const prepared = value && typeof value === "object" &&
      (value as Record<string, unknown>)._type === "COMPOSITION"
    ? structuredClone(value)
    : value;
  if (prepared && typeof prepared === "object" &&
    (prepared as Record<string, unknown>)._type === "COMPOSITION") {
    normalizeCompositionEntryDefaultsInPlace(prepared);
  }
  const serializer = new JsonCanonicalSerializer({ onNonRmValue: "pass" });
  return JSON.parse(serializer.serialize(prepared));
}

export type ScalarPathMap = Map<string, string>;

export function flattenScalarPaths(
  value: unknown,
  prefix = "",
  out: ScalarPathMap = new Map(),
  depth = 0,
  maxDepth = 24,
): ScalarPathMap {
  if (depth > maxDepth) return out;
  if (value === null || value === undefined) {
    out.set(prefix || "$", String(value));
    return out;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") {
    out.set(prefix || "$", JSON.stringify(value));
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) =>
      flattenScalarPaths(v, `${prefix}[${i}]`, out, depth + 1, maxDepth)
    );
    return out;
  }
  if (t === "object") {
    for (const k of Object.keys(value as object).sort()) {
      const next = prefix ? `${prefix}.${k}` : k;
      flattenScalarPaths(
        (value as Record<string, unknown>)[k],
        next,
        out,
        depth + 1,
        maxDepth,
      );
    }
  }
  return out;
}

export interface StructuralPathDiff {
  dropped: string[];
  altered: { path: string; before: string; after: string }[];
}

export function structuralPathDiff(
  original: unknown,
  roundTripped: unknown,
): StructuralPathDiff {
  const before = flattenScalarPaths(canonicalTree(original));
  const after = flattenScalarPaths(canonicalTree(roundTripped));
  const dropped: string[] = [];
  const altered: StructuralPathDiff["altered"] = [];
  for (const [path, b] of before) {
    if (!after.has(path)) {
      dropped.push(path);
      continue;
    }
    const a = after.get(path)!;
    if (a !== b) altered.push({ path, before: b, after: a });
  }
  return { dropped, altered };
}

export interface LossySensitiveSpot {
  path: string;
  attribute: string;
  samples: string[];
}

const SENSITIVE_KEYS = new Set([
  "participations",
  "other_participations",
  "health_care_facility",
  "feeder_audit",
  "links",
  "provider",
  "ism_transition",
  "instruction_details",
  "timing",
  "null_flavour",
  "work_flow_id",
  "guideline_id",
]);

const DV_TYPES_WITH_DATA = new Set([
  "DV_INTERVAL",
  "DV_PROPORTION",
  "DV_MULTIMEDIA",
  "DV_PARSABLE",
  "DV_EHR_URI",
  "DV_STATE",
  "DV_ORDINAL",
  "DV_SCALE",
]);

export const LOSSY_INTENTIONAL_ROOT_OMISSIONS = new Set([
  "feeder_audit",
  "links",
  "work_flow_id",
  "guideline_id",
  "version_uid",
  "version_tree",
  "uid",
]);

function scalarSamples(v: unknown): string[] {
  const out: string[] = [];
  if (v === null || v === undefined) return out;
  if (typeof v === "string" && v.length > 0) out.push(v);
  if (typeof v === "number" || typeof v === "boolean") out.push(String(v));
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.value === "string" && o.value) out.push(o.value);
    if (typeof o.name === "string" && o.name) out.push(o.name);
    if (typeof o.code_string === "string" && o.code_string) out.push(o.code_string);
    if (typeof o.magnitude === "number") out.push(String(o.magnitude));
    if (Array.isArray(o.identifiers)) {
      for (const id of o.identifiers) {
        out.push(...scalarSamples(id));
      }
    }
  }
  return [...new Set(out)].filter((s) => s.length >= 2);
}

function hasMeaningfulData(v: unknown): boolean {
  return scalarSamples(v).length > 0;
}

export function collectLossySensitiveSpots(
  root: unknown,
  path = "",
  acc: LossySensitiveSpot[] = [],
  depth = 0,
): LossySensitiveSpot[] {
  if (!root || typeof root !== "object" || depth > 30) return acc;
  const o = root as Record<string, unknown>;
  const type = typeof o._type === "string" ? o._type : undefined;

  for (const key of SENSITIVE_KEYS) {
    if (o[key] !== undefined && o[key] !== null && hasMeaningfulData(o[key])) {
      const spotPath = path ? `${path}.${key}` : key;
      const rootAttr = spotPath.split(".")[0] ?? key;
      if (LOSSY_INTENTIONAL_ROOT_OMISSIONS.has(rootAttr) && !path) continue;
      acc.push({
        path: spotPath,
        attribute: key,
        samples: scalarSamples(o[key]).slice(0, 4),
      });
    }
  }

  if (type && DV_TYPES_WITH_DATA.has(type) && hasMeaningfulData(o)) {
    acc.push({
      path: path || type,
      attribute: type,
      samples: scalarSamples(o).slice(0, 4),
    });
  }

  if (Array.isArray(root)) {
    root.forEach((item, i) =>
      collectLossySensitiveSpots(item, `${path}[${i}]`, acc, depth + 1)
    );
    return acc;
  }

  for (const [k, v] of Object.entries(o)) {
    if (v !== null && typeof v === "object") {
      collectLossySensitiveSpots(v, path ? `${path}.${k}` : k, acc, depth + 1);
    }
  }
  return acc;
}

export function lossyOutputCoversSpot(
  text: string,
  spot: LossySensitiveSpot,
): boolean {
  const hay = text.toLowerCase();
  return spot.samples.some((s) => hay.includes(s.toLowerCase()));
}

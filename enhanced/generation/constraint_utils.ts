/**
 * Occurrence / cardinality helpers for RM instance generation from AOM constraints.
 */

import * as openehr_am from "../openehr_am.ts";
import * as openehr_base from "../openehr_base.ts";

export interface OccurrenceBounds {
  lower: number;
  upper: number | null;
}

export function parseOccurrenceBounds(
  interval?:
    | openehr_base.Multiplicity_interval
    | string
    | { interval?: openehr_base.Multiplicity_interval | string }
    | null,
): OccurrenceBounds {
  if (!interval) {
    return { lower: 0, upper: null };
  }

  if (typeof interval === "object" && "interval" in interval) {
    const nested = (interval as {
      interval?: openehr_base.Multiplicity_interval | string;
    }).interval;
    if (nested) return parseOccurrenceBounds(nested);
  }

  if (typeof interval === "string") {
    const s = interval.trim();
    const m = s.match(/^(\d+|\*)\.\.(\d+|\*)$/);
    if (m) {
      const lower = m[1] === "*" ? 0 : Number(m[1]);
      const upper = m[2] === "*" ? null : Number(m[2]);
      return { lower, upper };
    }
    return { lower: 0, upper: null };
  }

  const lower = interval.lower_unbounded
    ? 0
    : (typeof interval.lower === "number" ? interval.lower : 0);
  const upper = interval.upper_unbounded
    ? null
    : (typeof interval.upper === "number" ? interval.upper : null);
  return { lower, upper };
}

export function isProhibited(
  interval?: openehr_base.Multiplicity_interval | string | null,
): boolean {
  const { upper } = parseOccurrenceBounds(interval);
  return upper === 0;
}

export function isMandatory(
  interval?: openehr_base.Multiplicity_interval | string | null,
): boolean {
  const { lower } = parseOccurrenceBounds(interval);
  return lower >= 1;
}

export function isAttributeMandatory(
  attr: openehr_am.C_ATTRIBUTE,
  child?: openehr_am.C_OBJECT,
): boolean {
  if (isMandatory((attr as { existence?: openehr_base.Multiplicity_interval })
    .existence)) {
    return true;
  }
  if (attr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE && attr.cardinality) {
    if (isMandatory(attr.cardinality)) return true;
  }
  if (child && isMandatory(child.occurrences)) return true;
  return false;
}

export function arrayItemCount(
  mode: "minimal" | "example" | "maximal",
  isRequired: boolean,
  attributeCardinality?: openehr_base.Multiplicity_interval,
  childOccurrences?: openehr_base.Multiplicity_interval | string,
): number {
  const attrBounds = parseOccurrenceBounds(attributeCardinality);
  const childBounds = parseOccurrenceBounds(childOccurrences);
  const lower = Math.max(attrBounds.lower, childBounds.lower, isRequired ? 1 : 0);

  if (mode === "minimal" || mode === "example") {
    if (lower > 0) return lower;
    return isRequired ? 1 : 1;
  }

  const upperCandidates = [attrBounds.upper, childBounds.upper].filter(
    (u): u is number => typeof u === "number",
  );
  const upper = upperCandidates.length
    ? Math.max(...upperCandidates)
    : null;
  if (upper !== null) {
    return Math.max(lower, Math.min(upper, 10));
  }
  return Math.max(lower, 2);
}

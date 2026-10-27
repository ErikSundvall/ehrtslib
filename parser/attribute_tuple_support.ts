/**
 * ADL2 attribute tuple (C_ATTRIBUTE_TUPLE / C_PRIMITIVE_TUPLE) helpers.
 */

import * as openehr_am from "../am/openehr_am.ts";
import * as openehr_base from "../base/openehr_base.ts";
import type { QuantityItemInterval } from "./legacy/xml_aom_mapper.ts";
import { inOrderedRange } from "../validation/temporal_pattern.ts";

export type TupleValidationIssue = {
  path: string;
  message: string;
  constraintType: string;
};

export type AttributeTupleHost = {
  attribute_tuples?: openehr_am.C_ATTRIBUTE_TUPLE[];
};

const QUANTITY_COLUMNS = new Set(["units", "magnitude", "precision"]);

export function isQuantityTupleColumns(columns: string[]): boolean {
  return columns.length > 0 && columns.every((c) => QUANTITY_COLUMNS.has(c));
}

export function tupleColumnNames(tuple: openehr_am.C_ATTRIBUTE_TUPLE): string[] {
  return (tuple.members ?? []).map((m) => m.rm_attribute_name);
}

export function quantityItemsFromTuple(
  tuple: openehr_am.C_ATTRIBUTE_TUPLE,
): openehr_am.C_QUANTITY_ITEM[] {
  const columns = tupleColumnNames(tuple);
  if (!isQuantityTupleColumns(columns)) return [];
  const items: openehr_am.C_QUANTITY_ITEM[] = [];
  for (const row of tuple.tuples ?? []) {
    const item = quantityItemFromPrimitiveTuple(row, columns);
    if (item) items.push(item);
  }
  return items;
}

function quantityItemFromPrimitiveTuple(
  row: openehr_am.C_PRIMITIVE_TUPLE,
  columns: string[],
): openehr_am.C_QUANTITY_ITEM | undefined {
  const members = row.members ?? [];
  const item = new openehr_am.C_QUANTITY_ITEM();
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const cell = members[i];
    if (!cell) continue;
    if (col === "units") {
      const u = unitsFromConstraint(cell);
      if (u) item.units = u;
    } else if (col === "magnitude") {
      item.magnitude = intervalFromConstraint(cell);
    } else if (col === "precision") {
      item.precision = intervalFromConstraint(cell);
    }
  }
  return item.units || item.magnitude || item.precision ? item : undefined;
}

export function scaleListFromTuple(
  tuple: openehr_am.C_ATTRIBUTE_TUPLE,
): openehr_am.ORDINAL[] {
  const columns = tupleColumnNames(tuple);
  const valueIdx = columns.indexOf("value");
  const symbolIdx = columns.indexOf("symbol");
  if (valueIdx < 0 && symbolIdx < 0) return [];
  const items: openehr_am.ORDINAL[] = [];
  for (const row of tuple.tuples ?? []) {
    const members = row.members ?? [];
    const entry: { value?: number; symbol?: openehr_base.CODE_PHRASE } = {};
    if (valueIdx >= 0) {
      const v = numericPointFromConstraint(members[valueIdx]);
      if (v !== undefined) entry.value = v;
    }
    if (symbolIdx >= 0) {
      const sym = terminologyFromConstraint(members[symbolIdx]);
      if (sym) entry.symbol = sym;
    }
    if (entry.value !== undefined || entry.symbol) {
      items.push(entry as openehr_am.ORDINAL);
    }
  }
  return items;
}

export function ordinalListFromTuple(
  tuple: openehr_am.C_ATTRIBUTE_TUPLE,
): openehr_am.ORDINAL[] {
  const columns = tupleColumnNames(tuple);
  const valueIdx = columns.indexOf("value");
  const symbolIdx = columns.indexOf("symbol");
  if (valueIdx < 0 && symbolIdx < 0) return [];
  const items: openehr_am.ORDINAL[] = [];
  for (const row of tuple.tuples ?? []) {
    const ord = new openehr_am.ORDINAL();
    const members = row.members ?? [];
    if (valueIdx >= 0) {
      const v = integerPointFromConstraint(members[valueIdx]) ??
        numericPointFromConstraint(members[valueIdx]);
      if (v !== undefined) ord.value = v;
    }
    if (symbolIdx >= 0) {
      const sym = terminologyFromConstraint(members[symbolIdx]);
      if (sym) ord.symbol = sym;
    }
    if (ord.value !== undefined || ord.symbol) items.push(ord);
  }
  return items;
}

export function syncDomainListsFromAttributeTuples(
  host: AttributeTupleHost & { rm_type_name?: string },
): void {
  const tuples = host.attribute_tuples ?? [];
  if (!tuples.length) return;
  if (host instanceof openehr_am.C_QUANTITY || host.rm_type_name === "DV_QUANTITY") {
    const q = host as openehr_am.C_QUANTITY;
    for (const tuple of tuples) {
      if (!isQuantityTupleColumns(tupleColumnNames(tuple))) continue;
      const items = quantityItemsFromTuple(tuple);
      if (items.length) (q as { list?: openehr_am.C_QUANTITY_ITEM[] }).list = items;
    }
  }
  if (host instanceof openehr_am.C_ORDINAL || host.rm_type_name === "DV_ORDINAL") {
    const o = host as openehr_am.C_ORDINAL & { list?: openehr_am.ORDINAL[] };
    for (const tuple of tuples) {
      const cols = tupleColumnNames(tuple);
      if (!cols.includes("value") && !cols.includes("symbol")) continue;
      const items = ordinalListFromTuple(tuple);
      if (items.length) o.list = items;
    }
  }
  if (host instanceof openehr_am.C_SCALE || host.rm_type_name === "DV_SCALE") {
    const s = host as openehr_am.C_SCALE & { list?: openehr_am.ORDINAL[] };
    for (const tuple of tuples) {
      const cols = tupleColumnNames(tuple);
      if (!cols.includes("value") && !cols.includes("symbol")) continue;
      const items = scaleListFromTuple(tuple);
      if (items.length) s.list = items;
    }
  }
}

export function copyAttributeTuples(
  from: AttributeTupleHost,
  to: AttributeTupleHost,
): void {
  if (from.attribute_tuples?.length) {
    to.attribute_tuples = from.attribute_tuples;
  }
}

function unitsFromConstraint(cell: openehr_am.C_OBJECT): string | undefined {
  if (cell instanceof openehr_am.C_TERMINOLOGY_CODE) {
    return cell.constraint ?? cell.code_list?.[0];
  }
  if (!(cell instanceof openehr_am.C_PRIMITIVE_OBJECT)) return undefined;
  const body = cell.item;
  if (body instanceof openehr_am.C_STRING) {
    const list = (body as { list?: string[] }).list;
    if (list?.[0]) return list[0];
    return body.pattern && body.pattern !== "*" ? body.pattern : undefined;
  }
  return undefined;
}

function intervalFromConstraint(
  cell: openehr_am.C_OBJECT,
): QuantityItemInterval | undefined {
  if (!(cell instanceof openehr_am.C_PRIMITIVE_OBJECT)) return undefined;
  const body = cell.item;
  if (body instanceof openehr_am.C_STRING && body.pattern) {
    return parseIntervalPattern(body.pattern);
  }
  if (body instanceof openehr_am.C_INTEGER || body instanceof openehr_am.C_REAL) {
    const range = (body as { range?: QuantityItemInterval }).range;
    if (range) return range;
    const list = (body as { list?: number[] }).list;
    if (list?.length === 1) {
      return {
        lower: list[0],
        upper: list[0],
        lower_included: true,
        upper_included: true,
      };
    }
  }
  return undefined;
}

function numericPointFromConstraint(cell?: openehr_am.C_OBJECT): number | undefined {
  if (!cell) return undefined;
  if (!(cell instanceof openehr_am.C_PRIMITIVE_OBJECT)) {
    if (cell instanceof openehr_am.C_COMPLEX_OBJECT) {
      const valueAttr = (cell as { attributes?: openehr_am.C_ATTRIBUTE[] })
        .attributes?.find((a) => a.rm_attribute_name === "value");
      const child = (valueAttr as { children?: openehr_am.C_OBJECT[] })
        ?.children?.[0];
      return numericPointFromConstraint(child);
    }
    return undefined;
  }
  const body = cell.item;
  if (body instanceof openehr_am.C_REAL) {
    const list = (body as { list?: number[] }).list;
    if (list?.length) return list[0];
    const range = (body as { range?: QuantityItemInterval }).range;
    if (range?.lower !== undefined && range.lower === range.upper) {
      return range.lower;
    }
  }
  if (body instanceof openehr_am.C_STRING && body.pattern) {
    const interval = parseIntervalPattern(body.pattern);
    if (
      interval?.lower !== undefined && interval.lower === interval.upper
    ) {
      return interval.lower;
    }
    const n = Number(body.pattern);
    return Number.isFinite(n) ? n : undefined;
  }
  return integerPointFromConstraint(cell);
}

function integerPointFromConstraint(cell?: openehr_am.C_OBJECT): number | undefined {
  if (!cell) return undefined;
  if (!(cell instanceof openehr_am.C_PRIMITIVE_OBJECT)) return undefined;
  const body = cell.item;
  if (body instanceof openehr_am.C_INTEGER || body instanceof openehr_am.C_REAL) {
    const list = (body as { list?: number[] }).list;
    if (list?.length) return list[0];
    const range = (body as { range?: QuantityItemInterval }).range;
    if (range?.lower !== undefined && range.lower === range.upper) {
      return range.lower;
    }
  }
  if (body instanceof openehr_am.C_STRING && body.pattern) {
    const interval = parseIntervalPattern(body.pattern);
    if (
      interval?.lower !== undefined && interval.lower === interval.upper
    ) {
      return interval.lower;
    }
    const n = Number(body.pattern);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function terminologyFromConstraint(
  cell?: openehr_am.C_OBJECT,
): openehr_base.CODE_PHRASE | undefined {
  if (!cell) return undefined;
  if (cell instanceof openehr_am.C_TERMINOLOGY_CODE) {
    const code = cell.constraint ?? cell.code_list?.[0];
    if (!code) return undefined;
    const tid = (cell as { terminology_id?: string }).terminology_id ?? "local";
    return openehr_base.CODE_PHRASE.from(tid, code);
  }
  if (cell instanceof openehr_am.C_COMPLEX_OBJECT) {
    const defAttr = (cell as { attributes?: openehr_am.C_ATTRIBUTE[] })
      .attributes?.find((a) => a.rm_attribute_name === "defining_code");
    const child = (defAttr as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
    if (child) return terminologyFromConstraint(child);
  }
  if (cell instanceof openehr_am.C_PRIMITIVE_OBJECT) {
    const nested = (cell as { children?: openehr_am.C_OBJECT[] }).children?.[0];
    if (nested) return terminologyFromConstraint(nested);
  }
  return undefined;
}

function parseIntervalPattern(expr: string): QuantityItemInterval | undefined {
  const t = expr.trim();
  if (!t) return undefined;
  const interval: QuantityItemInterval = {};
  const range = /^(.+)\.\.(<)?(.+)$/.exec(t);
  if (range) {
    const lowerPart = range[1];
    const exclusiveUpper = range[2] === "<";
    const upperPart = range[3];
    if (lowerPart.startsWith(">")) {
      interval.lower_included = false;
      interval.lower = parseFloat(lowerPart.slice(1));
    } else {
      interval.lower_included = true;
      interval.lower = parseFloat(lowerPart);
    }
    if (exclusiveUpper || upperPart.startsWith("<")) {
      interval.upper_included = false;
      interval.upper = parseFloat(
        exclusiveUpper ? upperPart : upperPart.slice(1),
      );
    } else {
      interval.upper_included = true;
      interval.upper = parseFloat(upperPart);
    }
    return interval;
  }
  const exact = /^-?\d+(?:\.\d+)?$/.exec(t);
  if (exact) {
    const n = parseFloat(exact[0]);
    interval.lower = n;
    interval.upper = n;
    interval.lower_included = true;
    interval.upper_included = true;
    return interval;
  }
  return undefined;
}

export function validateAttributeTuples(
  rmValue: Record<string, unknown>,
  tuples: openehr_am.C_ATTRIBUTE_TUPLE[],
  path: string,
): TupleValidationIssue[] {
  const messages: TupleValidationIssue[] = [];
  for (const tuple of tuples) {
    const columns = tupleColumnNames(tuple);
    const rows = tuple.tuples ?? [];
    if (!columns.length || !rows.length) continue;
    const matched = rows.some((row) =>
      primitiveTupleMatchesInstance(row, columns, rmValue)
    );
    if (!matched) {
      messages.push({
        path,
        message:
          `instance does not match any [${columns.join(", ")}] tuple row`,
        constraintType: "attribute_tuple",
      });
    }
  }
  return messages;
}

function primitiveTupleMatchesInstance(
  row: openehr_am.C_PRIMITIVE_TUPLE,
  columns: string[],
  rmValue: Record<string, unknown>,
): boolean {
  const members = row.members ?? [];
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const cell = members[i];
    if (!cell) continue;
    const actual = rmValue[col];
    if (!cellMatchesConstraint(cell, col, actual)) return false;
  }
  return true;
}

function cellMatchesConstraint(
  cell: openehr_am.C_OBJECT,
  column: string,
  actual: unknown,
): boolean {
  if (actual === undefined || actual === null) return false;
  if (column === "units" && typeof actual === "string") {
    const allowed = unitsFromConstraint(cell);
    return allowed === undefined || allowed === "*" || allowed === actual;
  }
  if (column === "value" && typeof actual === "number") {
    const interval = intervalFromConstraint(cell);
    if (interval) return inOrderedRange(actual, interval);
    const point = numericPointFromConstraint(cell) ??
      integerPointFromConstraint(cell);
    return point === undefined || point === actual;
  }
  if (column === "symbol" && typeof actual === "object") {
    const code = codeStringOf(actual);
    const term = terminologyFromConstraint(cell);
    if (!term?.code_string) return true;
    return code === term.code_string;
  }
  if (column === "magnitude" || column === "precision") {
    if (typeof actual !== "number") return false;
    const interval = intervalFromConstraint(cell);
    return !interval || inOrderedRange(actual, interval);
  }
  return true;
}

function codeStringOf(code: unknown): string | undefined {
  if (!code || typeof code !== "object") return undefined;
  const rec = code as {
    code_string?: string;
    defining_code?: { code_string?: string };
  };
  return rec.code_string ?? rec.defining_code?.code_string;
}

export function buildQuantityAttributeTuple(
  items: Array<{
    units?: string;
    magnitude?: QuantityItemInterval;
    precision?: QuantityItemInterval;
  }>,
): openehr_am.C_ATTRIBUTE_TUPLE | undefined {
  if (!items.length) return undefined;
  const columns: string[] = [];
  if (items.some((i) => i.units)) columns.push("units");
  if (items.some((i) => i.magnitude)) columns.push("magnitude");
  if (items.some((i) => i.precision)) columns.push("precision");
  if (!columns.length) return undefined;
  const tuple = new openehr_am.C_ATTRIBUTE_TUPLE();
  tuple.members = columns.map((name) => {
    const a = new openehr_am.C_SINGLE_ATTRIBUTE();
    a.rm_attribute_name = name;
    return a;
  });
  tuple.tuples = items.map((item) => {
    const row = new openehr_am.C_PRIMITIVE_TUPLE();
    row.members = columns.map((col) => {
      if (col === "units" && item.units) {
        return unitsConstraintObject(item.units);
      }
      if (col === "magnitude" && item.magnitude) {
        return intervalConstraintObject(item.magnitude);
      }
      if (col === "precision" && item.precision) {
        return intervalConstraintObject(item.precision);
      }
      return new openehr_am.C_PRIMITIVE_OBJECT();
    });
    return row;
  });
  return tuple;
}

export function buildOrdinalAttributeTuple(
  items: Array<{ value?: number; symbol?: openehr_base.CODE_PHRASE }>,
): openehr_am.C_ATTRIBUTE_TUPLE | undefined {
  if (!items.length) return undefined;
  const tuple = new openehr_am.C_ATTRIBUTE_TUPLE();
  tuple.members = ["value", "symbol"].map((name) => {
    const a = new openehr_am.C_SINGLE_ATTRIBUTE();
    a.rm_attribute_name = name;
    return a;
  });
  tuple.tuples = items.map((item) => {
    const row = new openehr_am.C_PRIMITIVE_TUPLE();
    row.members = [
      item.value !== undefined
        ? integerConstraintObject(item.value)
        : new openehr_am.C_PRIMITIVE_OBJECT(),
      item.symbol
        ? terminologyConstraintObject(item.symbol)
        : new openehr_am.C_PRIMITIVE_OBJECT(),
    ];
    return row;
  });
  return tuple;
}

function unitsConstraintObject(units: string): openehr_am.C_PRIMITIVE_OBJECT {
  const prim = new openehr_am.C_PRIMITIVE_OBJECT();
  prim.rm_type_name = "STRING";
  const str = new openehr_am.C_STRING();
  str.pattern = units;
  prim.item = str;
  return prim;
}

function intervalConstraintObject(
  interval: QuantityItemInterval,
): openehr_am.C_PRIMITIVE_OBJECT {
  const prim = new openehr_am.C_PRIMITIVE_OBJECT();
  prim.rm_type_name = /\./.test(String(interval.lower ?? interval.upper ?? ""))
    ? "Real"
    : "Integer";
  const str = new openehr_am.C_STRING();
  str.pattern = formatIntervalPattern(interval) ?? "";
  prim.item = str;
  return prim;
}

function integerConstraintObject(value: number): openehr_am.C_PRIMITIVE_OBJECT {
  const prim = new openehr_am.C_PRIMITIVE_OBJECT();
  prim.rm_type_name = "Integer";
  const item = new openehr_am.C_INTEGER();
  (item as { list?: number[] }).list = [value];
  prim.item = item;
  return prim;
}

function terminologyConstraintObject(
  code: openehr_base.CODE_PHRASE,
): openehr_am.C_TERMINOLOGY_CODE {
  const term = new openehr_am.C_TERMINOLOGY_CODE();
  term.rm_type_name = "CODE_PHRASE";
  term.constraint = code.code_string;
  (term as { terminology_id?: string }).terminology_id =
    code.terminology_id?.value ?? "local";
  return term;
}

function formatIntervalPattern(interval: QuantityItemInterval): string | undefined {
  const lower = interval.lower;
  const upper = interval.upper;
  if (lower === undefined && upper === undefined) return undefined;
  const li = interval.lower_included !== false;
  const ui = interval.upper_included !== false;
  if (lower !== undefined && upper !== undefined) {
    if (lower === upper && li && ui) return String(lower);
    if (li && ui) return `${lower}..${upper}`;
    if (li && !ui) return `${lower}..<${upper}`;
    if (!li && ui) return `>${lower}..${upper}`;
    return `>${lower}..<${upper}`;
  }
  if (lower !== undefined) return li ? `>=${lower}` : `>${lower}`;
  return ui ? `<=${upper}` : `<${upper}`;
}

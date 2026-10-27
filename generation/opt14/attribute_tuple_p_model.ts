/**
 * Plain-model attribute tuples for ADL2 flatten / OPT 1.4 export (#183).
 */

import * as openehr_am from "../../am/openehr_am.ts";
import {
  buildOrdinalAttributeTuple,
  buildQuantityAttributeTuple,
  isQuantityTupleColumns,
  tupleColumnNames,
} from "../../parser/attribute_tuple_support.ts";
import type { PAttribute, PObject, PPrimitive } from "./p_model.ts";
import { pClone } from "./p_model.ts";

export interface PTupleCell {
  kind: "term" | "prim" | "complex";
  rmType?: string;
  termConstraint?: string;
  prim?: PPrimitive;
  attrs?: PAttribute[];
}

export interface PTupleRow {
  cells: PTupleCell[];
}

export interface PAttributeTuple {
  columns: string[];
  rows: PTupleRow[];
}

export function attributeTuplesFromAom(
  obj: openehr_am.C_OBJECT,
): PAttributeTuple[] | undefined {
  const host = obj as { attribute_tuples?: openehr_am.C_ATTRIBUTE_TUPLE[] };
  let tuples = host.attribute_tuples ?? [];
  if (!tuples.length) {
    if (obj instanceof openehr_am.C_QUANTITY) {
      const list = (obj as { list?: unknown[] }).list ?? [];
      if (list.length) {
        const built = buildQuantityAttributeTuple(
          list as Array<{
            units?: string;
            magnitude?: unknown;
            precision?: unknown;
          }>,
        );
        if (built) tuples = [built];
      }
    } else if (
      obj instanceof openehr_am.C_ORDINAL ||
      obj instanceof openehr_am.C_SCALE ||
      obj.rm_type_name === "DV_SCALE" ||
      obj.rm_type_name === "DV_ORDINAL"
    ) {
      const list = (obj as { list?: openehr_am.ORDINAL[] }).list ?? [];
      if (list.length) {
        const built = buildOrdinalAttributeTuple(list);
        if (built) tuples = [built];
      }
    }
  }
  if (!tuples.length) return undefined;
  return tuples.map(aomTupleToP);
}

function aomTupleToP(tuple: openehr_am.C_ATTRIBUTE_TUPLE): PAttributeTuple {
  const columns = tupleColumnNames(tuple);
  return {
    columns,
    rows: (tuple.tuples ?? []).map((row) => ({
      cells: (row.members ?? []).map((member) => aomCellToP(member)),
    })),
  };
}

function aomCellToP(cell: openehr_am.C_OBJECT): PTupleCell {
  if (cell instanceof openehr_am.C_TERMINOLOGY_CODE) {
    const code = cell.constraint ?? (cell as { code_list?: string[] }).code_list?.[0] ??
      "";
    const tid = (cell as { terminology_id?: string }).terminology_id;
    const termConstraint = tid && !/^(at|ac|id)\d/i.test(code)
      ? `[${tid}::${code}]`
      : code ? `[${code}]` : "";
    return { kind: "term", rmType: "CODE_PHRASE", termConstraint };
  }
  if (cell instanceof openehr_am.C_COMPLEX_OBJECT) {
    const attrs = ((cell as { attributes?: openehr_am.C_ATTRIBUTE[] }).attributes ??
      []).map((a) => ({
      name: a.rm_attribute_name ?? "",
      multiple: a instanceof openehr_am.C_MULTIPLE_ATTRIBUTE,
      children: ((a as { children?: openehr_am.C_OBJECT[] }).children ?? []).map(
        (c) => {
          if (c instanceof openehr_am.C_TERMINOLOGY_CODE) {
            return {
              kind: "term" as const,
              rmType: "CODE_PHRASE",
              termConstraint: c.constraint ? `[${c.constraint}]` : "",
            };
          }
          return { kind: "complex" as const, rmType: c.rm_type_name ?? "" };
        },
      ),
    }));
    return { kind: "complex", rmType: cell.rm_type_name, attrs };
  }
  if (cell instanceof openehr_am.C_PRIMITIVE_OBJECT) {
    const item = cell.item;
    if (item instanceof openehr_am.C_STRING) {
      const pattern = item.pattern ?? "";
      if (cell.rm_type_name === "Integer" || cell.rm_type_name === "Real") {
        return {
          kind: "prim",
          rmType: cell.rm_type_name,
          prim: { type: "interval", expr: pattern },
        };
      }
      if (pattern.includes("|")) {
        return {
          kind: "prim",
          prim: { type: "string", list: pattern.split("|").filter(Boolean) },
        };
      }
      return { kind: "prim", prim: { type: "string", pattern } };
    }
    if (item instanceof openehr_am.C_INTEGER || item instanceof openehr_am.C_REAL) {
      const list = (item as { list?: number[] }).list;
      if (list?.length === 1) {
        return {
          kind: "prim",
          rmType: item instanceof openehr_am.C_REAL ? "Real" : "Integer",
          prim: { type: "interval", expr: String(list[0]) },
        };
      }
    }
  }
  return { kind: "prim" };
}

/** Child tuple definitions replace parent tuples on specialisation (AOM2). */
export function mergeAttributeTupleSets(
  parent?: PAttributeTuple[],
  child?: PAttributeTuple[],
): PAttributeTuple[] | undefined {
  if (child?.length) return pClone(child);
  if (parent?.length) return pClone(parent);
  return undefined;
}

export function childTupleRowsNarrowParent(
  parent: PAttributeTuple,
  child: PAttributeTuple,
): boolean {
  if (parent.columns.join() !== child.columns.join()) return false;
  return child.rows.every((crow) =>
    parent.rows.some((prow) => rowNarrows(prow, crow))
  );
}

function rowNarrows(parent: PTupleRow, child: PTupleRow): boolean {
  for (let i = 0; i < parent.cells.length; i++) {
    if (!cellNarrows(parent.cells[i], child.cells[i])) return false;
  }
  return true;
}

function intervalNarrows(parentExpr: string, childExpr: string): boolean {
  if (parentExpr === childExpr) return true;
  const p = parseRangeForNarrow(parentExpr);
  const c = parseRangeForNarrow(childExpr);
  if (!p || !c) return false;
  const pLo = p.lower ?? -Infinity;
  const pHi = p.upper ?? Infinity;
  const cLo = c.lower ?? -Infinity;
  const cHi = c.upper ?? Infinity;
  return cLo >= pLo && cHi <= pHi;
}

function parseRangeForNarrow(expr: string): {
  lower?: number;
  upper?: number;
} | undefined {
  const t = expr.trim();
  const range = /^(.+)\.\.(<)?(.+)$/.exec(t);
  if (range) {
    return { lower: parseFloat(range[1]), upper: parseFloat(range[3]) };
  }
  const exact = /^-?[\d.]+$/.exec(t);
  if (exact) {
    const n = parseFloat(exact[0]);
    return { lower: n, upper: n };
  }
  return undefined;
}

function cellNarrows(parent: PTupleCell, child: PTupleCell): boolean {
  if (child.kind === "prim" && parent.kind === "prim") {
    if (child.prim?.type === "interval" && parent.prim?.type === "interval") {
      return intervalNarrows(parent.prim.expr, child.prim.expr);
    }
    if (child.prim?.type === "string" && parent.prim?.type === "string") {
      const c = child.prim.list ?? (child.prim.pattern ? [child.prim.pattern] : []);
      const p = parent.prim.list ?? (parent.prim.pattern ? [parent.prim.pattern] : []);
      return c.every((v) => p.includes(v));
    }
  }
  if (child.kind === "term" && parent.kind === "term") {
    return child.termConstraint === parent.termConstraint;
  }
  return JSON.stringify(child) === JSON.stringify(parent);
}

export interface PQuantityListRow {
  units: string;
  magnitudeExpr?: string;
  precisionExpr?: string;
}

/** OPT 1.4 list XML only represents standard quantity / ordinal / scale tuples. */
export function isOpt14ExportableTuple(t: PAttributeTuple): boolean {
  if (isQuantityTupleColumns(t.columns)) return true;
  return t.columns.length === 2 && t.columns.includes("value") &&
    t.columns.includes("symbol");
}

export function opt14UnexportableTuples(
  tuples: PAttributeTuple[] | undefined,
): PAttributeTuple[] {
  return (tuples ?? []).filter((t) => !isOpt14ExportableTuple(t));
}

export function quantityListRowsFromP(
  tuples: PAttributeTuple[] | undefined,
): PQuantityListRow[] {
  const tuple = tuples?.find((t) => isQuantityTupleColumns(t.columns));
  if (!tuple) return [];
  const u = tuple.columns.indexOf("units");
  const m = tuple.columns.indexOf("magnitude");
  const p = tuple.columns.indexOf("precision");
  return tuple.rows.map((row) => ({
    units: cellString(row.cells[u]) ?? "",
    magnitudeExpr: m >= 0 ? cellIntervalExpr(row.cells[m]) : undefined,
    precisionExpr: p >= 0 ? cellIntervalExpr(row.cells[p]) : undefined,
  })).filter((r) => r.units);
}

export interface POrdinalListRow {
  value?: number;
  symbolCode?: string;
  symbolTerminology?: string;
}

export function ordinalListRowsFromP(
  tuples: PAttributeTuple[] | undefined,
): POrdinalListRow[] {
  const tuple = tuples?.find((t) =>
    t.columns.includes("value") || t.columns.includes("symbol")
  );
  if (!tuple) return [];
  const vi = tuple.columns.indexOf("value");
  const si = tuple.columns.indexOf("symbol");
  return tuple.rows.map((row) => {
    const out: POrdinalListRow = {};
    if (vi >= 0) out.value = cellNumber(row.cells[vi]);
    if (si >= 0) {
      const term = row.cells[si].termConstraint ?? "";
      const ext = /^\[([^:\]]+)::([^\]]+)\]$/.exec(term);
      if (ext) {
        out.symbolTerminology = ext[1];
        out.symbolCode = ext[2];
      } else {
        out.symbolCode = term.replace(/^\[|\]$/g, "");
      }
    }
    return out;
  });
}

function cellString(cell?: PTupleCell): string | undefined {
  if (!cell?.prim) return undefined;
  if (cell.prim.type === "string") {
    return cell.prim.list?.[0] ?? cell.prim.pattern;
  }
  return undefined;
}

function cellIntervalExpr(cell?: PTupleCell): string | undefined {
  if (cell?.prim?.type === "interval") return cell.prim.expr;
  return undefined;
}

function cellNumber(cell?: PTupleCell): number | undefined {
  const expr = cellIntervalExpr(cell);
  if (expr === undefined) return undefined;
  const n = Number(expr);
  return Number.isFinite(n) ? n : undefined;
}

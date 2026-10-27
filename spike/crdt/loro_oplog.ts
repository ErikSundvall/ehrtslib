/**
 * Loro prototype: operation log as LoroMap + MovableList (#170).
 */
import { LoroDoc, LoroList, LoroMap } from "npm:loro-crdt@1.5.3";
import type { CbOperation } from "../../contribution_builder/operation_log.ts";
import { dedupeOps, opId } from "./shared.ts";

const MAP = "cb_ops_by_id";
const ORDER = "cb_ops_order";

export function newLoroLog(): LoroDoc {
  const doc = new LoroDoc();
  doc.getMap(MAP);
  doc.getList(ORDER);
  return doc;
}

export function appendOpLoro(doc: LoroDoc, op: CbOperation): void {
  const id = opId(op);
  const map = doc.getMap(MAP);
  map.set(id, op);
  const order = doc.getList(ORDER);
  let found = false;
  for (let i = 0; i < order.length; i++) {
    if (order.get(i) === id) {
      found = true;
      break;
    }
  }
  if (!found) order.push(id);
  doc.commit();
}

export function mergeLoro(a: LoroDoc, b: LoroDoc): LoroDoc {
  const merged = new LoroDoc();
  merged.import(b.export({ mode: "snapshot" }));
  merged.import(a.export({ mode: "snapshot" }));
  return merged;
}

export function opsFromLoro(doc: LoroDoc): CbOperation[] {
  const map = doc.getMap(MAP) as LoroMap;
  const order = doc.getList(ORDER) as LoroList;
  const out: CbOperation[] = [];
  for (let i = 0; i < order.length; i++) {
    const id = order.get(i) as string;
    const op = map.get(id) as CbOperation | undefined;
    if (op) out.push(op);
  }
  return dedupeOps(out);
}

export function saveBytesLoro(doc: LoroDoc): Uint8Array {
  return doc.export({ mode: "snapshot" });
}

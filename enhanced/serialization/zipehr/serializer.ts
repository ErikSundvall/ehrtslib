/**
 * High-level zipehr serialization API for j-zipehr (JSON) and y-zipehr (YAML).
 */

import { Document, isMap, isSeq } from "yaml";
import { HybridStyleFormatter } from "../common/hybrid_formatter.ts";
import { JsonCanonicalSerializer } from "../json/json_canonical_serializer.ts";
import {
  convertObjectDirect,
  convertObjectEhrtslib,
} from "./convert.ts";
import { expandZipehrToCanonical } from "./deserialize.ts";
import { detectInputFormat, parseZipehrText } from "./detect.ts";
import { flowFormat } from "./flow_format.ts";
import { loadDefaultSymbolMap } from "./symbol_map.ts";

export type ZipehrOutputVariant = "j-zipehr" | "y-zipehr";

/** Convert an RM instance to canonical plain JSON (with _type). */
export function rmToCanonicalPlain(obj: unknown): Record<string, unknown> {
  const serializer = new JsonCanonicalSerializer();
  const json = serializer.serialize(obj, { prettyPrint: false });
  return JSON.parse(json) as Record<string, unknown>;
}

/** Serialize RM object to j-zipehr JSON text (emoji keys, direct canonical path). */
export async function serializeToJZipehr(obj: unknown): Promise<string> {
  const symbolMap = await loadDefaultSymbolMap();
  const canonical = rmToCanonicalPlain(obj);
  const converted = convertObjectDirect(canonical, symbolMap);
  return JSON.stringify(converted, null, 2);
}

/** Serialize RM object to y-zipehr YAML (terse + type inference + emoji + hybrid layout). */
export async function serializeToYZipehr(obj: unknown): Promise<string> {
  const symbolMap = await loadDefaultSymbolMap();
  const canonical = rmToCanonicalPlain(obj);
  const converted = convertObjectEhrtslib(canonical, symbolMap);
  return serializeZipehrPlainToYaml(converted);
}

function serializeZipehrPlainToYaml(obj: unknown): string {
  const doc = new Document(obj);
  applyHybridFormatting(doc.contents, 0);
  return doc.toString({
    indent: 2,
    lineWidth: 120,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  });
}

function applyHybridFormatting(node: unknown, depth: number): void {
  if (!node || typeof node !== "object") return;

  if (isMap(node)) {
    const obj: Record<string, unknown> = {};
    for (const item of node.items) {
      const keyNode = item.key;
      if (
        keyNode && typeof keyNode === "object" && "value" in keyNode &&
        item.value !== undefined
      ) {
        obj[String((keyNode as { value: unknown }).value)] = item.value;
      }
    }
    const inline = HybridStyleFormatter.shouldFormatInline(obj, {
      maxInlineDepth: 1,
      maxInlineProperties: 4,
      maxInlineLength: 120,
    });
    if (!inline) {
      node.flow = false;
    } else {
      node.flow = true;
    }
    for (const item of node.items) {
      if (item.value) applyHybridFormatting(item.value, depth + 1);
    }
    return;
  }

  if (isSeq(node)) {
    const arr: unknown[] = [];
    for (const item of node.items) {
      arr.push(item);
    }
    const inline = HybridStyleFormatter.shouldFormatInline(arr, {
      maxInlineDepth: 1,
      maxInlineProperties: 4,
    });
    node.flow = inline;
    for (const item of node.items) {
      applyHybridFormatting(item, depth + 1);
    }
  }
}

/** Deserialize zipehr text (j or y variant) to canonical plain JSON. */
export async function zipehrTextToCanonical(text: string): Promise<unknown> {
  const symbolMap = await loadDefaultSymbolMap();
  const parsed = parseZipehrText(text);
  return expandZipehrToCanonical(parsed, symbolMap);
}

export { detectInputFormat, parseZipehrText };

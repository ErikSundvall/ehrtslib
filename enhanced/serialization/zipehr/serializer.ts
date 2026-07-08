/**
 * High-level zipehr serialization API for `zipehr.json` (JSON) and
 * `zipehr.yaml` (YAML).
 */

import { Document, isMap, isSeq } from "yaml";
import { HybridStyleFormatter } from "../common/hybrid_formatter.ts";
import { JsonCanonicalSerializer } from "../json/json_canonical_serializer.ts";
import { convertObjectDirect, convertObjectEhrtslib } from "./convert.ts";
import { expandZipehrToCanonical } from "./deserialize.ts";
import { detectInputFormat, parseZipehrText } from "./detect.ts";
import { loadSymbolMap, type ZipehrSymbolVariant } from "./symbol_map.ts";

export type ZipehrOutputVariant = "zipehr.json" | "zipehr.yaml";

/** Convert an RM instance to canonical plain JSON (with _type). */
export function rmToCanonicalPlain(obj: unknown): Record<string, unknown> {
  const serializer = new JsonCanonicalSerializer();
  const json = serializer.serialize(obj, { prettyPrint: false });
  return JSON.parse(json) as Record<string, unknown>;
}

/** Serialize RM object to `zipehr.json` JSON text (emoji keys, direct canonical path). */
export async function serializeToJZipehr(
  obj: unknown,
  symbolVariant: ZipehrSymbolVariant = "emoji",
): Promise<string> {
  const symbolMap = await loadSymbolMap(symbolVariant);
  const canonical = rmToCanonicalPlain(obj);
  const converted = convertObjectDirect(canonical, symbolMap);
  return serializeZipehrPlainToJson(converted);
}

/** Serialize RM object to `zipehr.yaml` YAML (terse + type inference + emoji + hybrid layout). */
export async function serializeToYZipehr(
  obj: unknown,
  symbolVariant: ZipehrSymbolVariant = "emoji",
): Promise<string> {
  const symbolMap = await loadSymbolMap(symbolVariant);
  const canonical = rmToCanonicalPlain(obj);
  const converted = convertObjectEhrtslib(canonical, symbolMap);
  return serializeZipehrPlainToYaml(converted);
}

export function serializeZipehrPlainToJson(obj: unknown): string {
  return formatHybridJson(obj, 0);
}

export function serializeZipehrPlainToYaml(obj: unknown): string {
  const doc = new Document(obj);
  applyHybridFormatting(doc.contents, obj, 0);
  return doc.toString({
    indent: 2,
    lineWidth: 120,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  });
}

function formatHybridJson(value: unknown, depth: number): string {
  if (canFormatInline(value)) return formatInlineJson(value);

  const indent = "  ".repeat(depth);
  const childIndent = "  ".repeat(depth + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const lines = value.map((item, index) => {
      const suffix = index === value.length - 1 ? "" : ",";
      return `${childIndent}${formatHybridJson(item, depth + 1)}${suffix}`;
    });
    return `[\n${lines.join("\n")}\n${indent}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const lines = entries.map(([key, entryValue], index) => {
      const suffix = index === entries.length - 1 ? "" : ",";
      return `${childIndent}${JSON.stringify(key)}: ${
        formatHybridJson(entryValue, depth + 1)
      }${suffix}`;
    });
    return `{\n${lines.join("\n")}\n${indent}}`;
  }

  return JSON.stringify(value);
}

function formatInlineJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(formatInlineJson).join(", ")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return `{ ${
      entries.map(([key, entryValue]) =>
        `${JSON.stringify(key)}: ${formatInlineJson(entryValue)}`
      ).join(", ")
    } }`;
  }
  return JSON.stringify(value);
}

function canFormatInline(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  return canFormatInlineInner(value, 0) &&
    formatInlineJson(value).length <= 160;
}

function canFormatInlineInner(value: unknown, depth: number): boolean {
  if (!value || typeof value !== "object") return true;

  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    if (value.length > 4) return false;
    return value.every((item) =>
      !item || typeof item !== "object" || canFormatInlineInner(item, depth + 1)
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 4) return false;
  if (depth > 2) return false;
  return entries.every(([, entryValue]) => {
    if (Array.isArray(entryValue)) return entryValue.length === 0;
    if (entryValue && typeof entryValue === "object") {
      return canFormatInlineInner(entryValue, depth + 1);
    }
    return true;
  });
}

function applyHybridFormatting(
  node: unknown,
  source: unknown,
  depth: number,
): void {
  if (!node || typeof node !== "object") return;

  if (isMap(node)) {
    const inline = HybridStyleFormatter.shouldFormatInline(source, {
      maxInlineDepth: 2,
      maxInlineProperties: 4,
      maxInlineLength: 120,
    }) || canFormatYamlInline(source);
    if (!inline) {
      node.flow = false;
    } else {
      node.flow = true;
    }
    for (const item of node.items) {
      const keyNode = item.key;
      const key = keyNode && typeof keyNode === "object" && "value" in keyNode
        ? String((keyNode as { value: unknown }).value)
        : undefined;
      const childSource =
        source && typeof source === "object" && !Array.isArray(source) &&
          key !== undefined
          ? (source as Record<string, unknown>)[key]
          : undefined;
      if (item.value) applyHybridFormatting(item.value, childSource, depth + 1);
    }
    return;
  }

  if (isSeq(node)) {
    const sourceArray = Array.isArray(source) ? source : [];
    const inline = HybridStyleFormatter.shouldFormatInline(sourceArray, {
      maxInlineDepth: 1,
      maxInlineProperties: 4,
    });
    node.flow = inline;
    for (let i = 0; i < node.items.length; i++) {
      applyHybridFormatting(node.items[i], sourceArray[i], depth + 1);
    }
  }
}

function canFormatYamlInline(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  return canFormatInlineInner(value, 0) &&
    formatInlineJson(value).length <= 120;
}

/** Deserialize zipehr text (j or y variant) to canonical plain JSON. */
export async function zipehrTextToCanonical(
  text: string,
  symbolVariant: "auto" | ZipehrSymbolVariant = "auto",
): Promise<unknown> {
  const parsed = parseZipehrText(text);
  // Auto-detect symbol variant by attempting both decoders.
  return expandZipehrToCanonical(parsed, symbolVariant);
}

export { detectInputFormat, parseZipehrText };

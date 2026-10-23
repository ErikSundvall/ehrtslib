/**
 * ADL2 Serializer
 *
 * Serializes AOM (Archetype Object Model) back to ADL2 format.
 * Supports round-trip: ADL2 → AOM → ADL2 (see docs/ADL2_ROUNDTRIP.md).
 */

import * as openehr_am from "../am/openehr_am.ts";
import {
  serializeAnnotationsSection,
  serializeDescriptionSection,
  serializeLanguageSection,
  serializeRmOverlaySection,
  serializeTerminologySection,
} from "../parser/odin_serializer.ts";
import type { OdinValue } from "../parser/odin_parser.ts";
import {
  getAnnotationsDocumentation,
  getRmOverlayVisibility,
} from "../parser/aom_odin_sections.ts";
import { serializeRulesSection } from "../parser/rules_serializer.ts";

/**
 * Serializer configuration
 */
export interface ADL2SerializerConfig {
  indent?: string;
  includeComments?: boolean;
}

/**
 * ADL2 Serializer
 */
type IntervalLike = {
  lower?: unknown;
  upper?: unknown;
  lower_included?: boolean;
  upper_included?: boolean;
  lower_unbounded?: boolean;
  upper_unbounded?: boolean;
};

type QuantityItemView = {
  units?: string;
  magnitude?: IntervalLike;
  precision?: IntervalLike;
};

function asTerminologyId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "value" in value) {
    const inner = (value as { value?: unknown }).value;
    return typeof inner === "string" ? inner : undefined;
  }
  return undefined;
}

function scalarText(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (
    typeof value === "number" || typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (typeof value === "object" && "value" in value) {
    return scalarText((value as { value?: unknown }).value);
  }
  return undefined;
}

/** ADL2 interval body inside `|…|` (`0..1000`, `>=0`, `PT0S..PT1H`). */
function formatInterval(interval: IntervalLike | undefined): string | undefined {
  if (!interval) return undefined;
  const lower = interval.lower_unbounded ? undefined : scalarText(interval.lower);
  const upper = interval.upper_unbounded ? undefined : scalarText(interval.upper);
  if (lower === undefined && upper === undefined) return undefined;
  const lowerIncluded = interval.lower_included !== false;
  const upperIncluded = interval.upper_included !== false;
  if (lower !== undefined && upper !== undefined) {
    if (lowerIncluded && upperIncluded) return `${lower}..${upper}`;
    if (lowerIncluded && !upperIncluded) return `${lower}..<${upper}`;
    if (!lowerIncluded && upperIncluded) return `>${lower}..${upper}`;
    return `>${lower}..<${upper}`;
  }
  if (lower !== undefined) return lowerIncluded ? `>=${lower}` : `>${lower}`;
  return upperIncluded ? `<=${upper}` : `<${upper}`;
}

function temporalPattern(value: object): string | undefined {
  const rec = value as { pattern?: string; pattern_constraint?: string };
  const pattern = rec.pattern ?? rec.pattern_constraint;
  return pattern?.trim() || undefined;
}

export class ADL2Serializer {
  protected config: ADL2SerializerConfig;

  constructor(config?: ADL2SerializerConfig) {
    this.config = {
      indent: "    ",
      includeComments: false,
      ...config,
    };
  }

  serialize(archetype: openehr_am.ARCHETYPE): string {
    const indent = this.config.indent || "    ";
    let adl = "archetype";

    if (archetype.adl_version || archetype.rm_release) {
      adl += " (";
      const meta: string[] = [];
      if (archetype.adl_version) meta.push(`adl_version=${archetype.adl_version}`);
      if (archetype.rm_release) meta.push(`rm_release=${archetype.rm_release}`);
      adl += meta.join("; ") + ")";
    }
    adl += "\n";

    if (archetype.archetype_id?.value) {
      adl += `    ${archetype.archetype_id.value}\n\n`;
    }

    const parentId = archetype.parent_archetype_id?.value;
    if (parentId) {
      adl += `specialize\n    ${parentId}\n\n`;
    }

    const translations = (archetype as { translations?: unknown }).translations;
    adl += serializeLanguageSection(
      archetype.original_language,
      indent,
      translations as OdinValue | undefined,
    );
    adl += serializeDescriptionSection(archetype.description, indent);

    adl += "definition\n";
    if (archetype.definition) {
      adl += this.serializeCObject(archetype.definition, 1);
    }
    adl += "\n";

    adl += serializeRulesSection(archetype.invariants, indent);

    const ontologyBag = archetype.ontology as Record<string, unknown> | undefined;
    adl += serializeTerminologySection(ontologyBag, indent);

    adl += serializeAnnotationsSection(
      getAnnotationsDocumentation(archetype),
      indent,
    );
    adl += serializeRmOverlaySection(
      getRmOverlayVisibility(archetype),
      indent,
    );

    return adl;
  }

  /**
   * Node id as written in cADL brackets. OPT2 overrides this to map ADL 1.4
   * at-codes onto ADL2 id-codes. Value-set at-/ac-codes are not passed here.
   */
  protected formatNodeId(nodeId?: string): string {
    if (nodeId === undefined || nodeId === null) return "";
    return String(nodeId);
  }

  protected formatNodeBracket(nodeId?: string): string {
    const id = this.formatNodeId(nodeId);
    if (!id) return "";
    return `[${id}]`;
  }

  protected occurrencesClause(occurrences?: {
    lower?: unknown;
    upper?: unknown;
  }): string {
    if (!occurrences) return "";
    const lower = scalarText(occurrences.lower) ?? "0";
    const upper = occurrences.upper === undefined
      ? "*"
      : (scalarText(occurrences.upper) ?? "*");
    return ` occurrences matches {${lower}..${upper}}`;
  }

  /** `TYPE[id]` plus optional occurrences, with the inline-label hook applied. */
  protected cObjectHead(
    rmType: string,
    node: openehr_am.C_OBJECT,
    level: number,
    keyword?: string,
  ): string {
    const indent = this.getIndent(level);
    const prefix = keyword ? `${keyword} ` : "";
    let line = `${indent}${prefix}${rmType}${this.formatNodeBracket(node.node_id)}`;
    line = this.decorateObjectLine(node, line);
    return line + this.occurrencesClause(node.occurrences);
  }

  protected serializeCObject(
    cObject: openehr_am.C_OBJECT,
    level: number,
  ): string {
    if (cObject instanceof openehr_am.C_ARCHETYPE_ROOT) {
      return this.serializeArchetypeRoot(cObject, level);
    }
    if (cObject instanceof openehr_am.C_COMPLEX_OBJECT) {
      return this.serializeComplexObject(cObject, level);
    }
    if (cObject instanceof openehr_am.ARCHETYPE_SLOT) {
      return this.serializeSlot(cObject, level);
    }
    if (cObject instanceof openehr_am.C_QUANTITY) {
      return this.serializeQuantity(cObject, level);
    }
    if (cObject instanceof openehr_am.C_ORDINAL) {
      return this.serializeOrdinal(cObject, level);
    }
    if (cObject instanceof openehr_am.C_CODED_TEXT) {
      return this.serializeCodedText(cObject, level);
    }
    if (cObject instanceof openehr_am.C_TERMINOLOGY_CODE) {
      return this.serializeTerminologyCode(cObject, level);
    }
    if (cObject instanceof openehr_am.C_PRIMITIVE_OBJECT) {
      return this.serializePrimitiveObject(cObject, level);
    }
    if (cObject instanceof openehr_am.C_PRIMITIVE) {
      return this.serializeBarePrimitive(cObject, level);
    }
    const rm = cObject.rm_type_name;
    if (rm) return this.cObjectHead(rm, cObject, level) + "\n";
    return "";
  }

  protected serializeComplexObject(
    cObject: openehr_am.C_COMPLEX_OBJECT,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    const line = this.cObjectHead(
      cObject.rm_type_name ?? "OBJECT",
      cObject,
      level,
    );

    const attrs = cObject.attributes;
    if (attrs && attrs.length > 0) {
      let adl = line + " matches {\n";
      for (const attr of attrs) {
        adl += this.serializeAttribute(attr, level + 1);
      }
      adl += `${indent}}\n`;
      return adl;
    }
    return line + "\n";
  }

  protected serializeArchetypeRoot(
    root: openehr_am.C_ARCHETYPE_ROOT,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    // Both the node id and the archetype id sit inside one bracket pair:
    // `use_archetype COMPOSITION[id1, openEHR-EHR-COMPOSITION.encounter.v1]`.
    const id = this.formatNodeId(root.node_id);
    const ref = root.archetype_ref;
    const inside = id && ref ? `${id}, ${ref}` : id || ref || "";
    const bracket = inside ? `[${inside}]` : "";
    let line = `${indent}use_archetype ${root.rm_type_name}${bracket}`;
    line = this.decorateObjectLine(root, line);
    line += this.occurrencesClause(root.occurrences);

    const attrs = root.attributes;
    if (attrs && attrs.length > 0) {
      let adl = line + " matches {\n";
      for (const attr of attrs) {
        adl += this.serializeAttribute(attr, level + 1);
      }
      adl += `${indent}}\n`;
      return adl;
    }
    return line + "\n";
  }

  /** Hook for OPT2 inline term labels (`-- …`). */
  protected decorateObjectLine(
    _node: openehr_am.C_OBJECT,
    line: string,
  ): string {
    return line;
  }

  protected serializeAttribute(
    cAttribute: openehr_am.C_ATTRIBUTE,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    let adl = `${indent}${cAttribute.rm_attribute_name}`;

    const existence = (cAttribute as { existence?: { lower?: number; upper?: number } })
      .existence;
    if (existence) {
      const u = existence.upper ?? existence.lower;
      adl += ` existence matches {${existence.lower}..${u}}`;
    }

    if (cAttribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE && cAttribute.cardinality) {
      const card = cAttribute.cardinality;
      const interval = (card as {
        interval?: { lower?: number; upper?: number };
      }).interval;
      if (interval) {
        const upperStr = interval.upper === undefined ? "*" : String(interval.upper);
        let cardBody = `${interval.lower}..${upperStr}`;
        if (card.is_ordered === false) cardBody += "; unordered";
        else if (card.is_ordered === true) cardBody += "; ordered";
        adl += ` cardinality matches {${cardBody}}`;
      }
    }

    const children = (cAttribute as { children?: openehr_am.C_OBJECT[] }).children;
    if (children && children.length > 0) {
      const inline = children.length === 1
        ? this.inlinePrimitiveMatch(children[0])
        : undefined;
      if (inline) {
        adl += ` matches {${inline}}\n`;
      } else {
        adl += " matches {\n";
        for (const child of children) {
          adl += this.serializeCObject(child, level + 1);
        }
        adl += `${indent}}\n`;
      }
    } else {
      adl += "\n";
    }

    return adl;
  }

  protected serializeSlot(
    slot: openehr_am.ARCHETYPE_SLOT,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    let adl = this.cObjectHead(
      slot.rm_type_name ?? "CLUSTER",
      slot,
      level,
      "allow_archetype",
    );
    const includes = (slot as { includes?: openehr_am.ARCHETYPE_ID_CONSTRAINT[] })
      .includes;
    const excludes = (slot as { excludes?: openehr_am.ARCHETYPE_ID_CONSTRAINT[] })
      .excludes;
    const includeLines = this.slotAssertionLines(includes, "include", level);
    const excludeLines = this.slotAssertionLines(excludes, "exclude", level);
    if (includeLines || excludeLines) {
      adl += " matches {\n";
      adl += includeLines;
      adl += excludeLines;
      adl += `${indent}}\n`;
    } else {
      adl += "\n";
    }
    return adl;
  }

  private slotAssertionLines(
    list: openehr_am.ARCHETYPE_ID_CONSTRAINT[] | undefined,
    keyword: "include" | "exclude",
    level: number,
  ): string {
    if (!list?.length) return "";
    const patterns = list
      .map((c) => c.constraint?.pattern?.trim())
      .filter((p): p is string => !!p);
    if (!patterns.length) return "";
    let adl = `${this.getIndent(level + 1)}${keyword}\n`;
    for (const pattern of patterns) {
      adl +=
        `${this.getIndent(level + 2)}archetype_id/value matches {/${pattern}/}\n`;
    }
    return adl;
  }

  protected serializeQuantity(
    quantity: openehr_am.C_QUANTITY,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    const items = ((quantity as { list?: QuantityItemView[] }).list ?? [])
      .filter((item) => item);
    const head = this.cObjectHead(
      quantity.rm_type_name || "DV_QUANTITY",
      quantity,
      level,
    );
    const lines: string[] = [];
    const inner = this.getIndent(level + 1);
    if (quantity.property) {
      const tid = (quantity as { property_terminology_id?: string })
        .property_terminology_id;
      const code = quantity.property;
      const coded = tid || /^(?:at|ac|id)\d/i.test(code);
      const body = coded
        ? this.formatTermCode(tid, code)
        : JSON.stringify(code);
      lines.push(`${inner}property matches {${body}}`);
    }
    if (items.length && this.quantityItemsShareRanges(items)) {
      const units = items.map((item) => item.units).filter((u): u is string =>
        !!u
      );
      if (units.length) {
        lines.push(
          `${inner}units matches {${units.map((u) => JSON.stringify(u)).join(", ")}}`,
        );
      }
      const magnitude = formatInterval(items[0].magnitude);
      if (magnitude) lines.push(`${inner}magnitude matches {|${magnitude}|}`);
      const precision = formatInterval(items[0].precision);
      if (precision) lines.push(`${inner}precision matches {|${precision}|}`);
    } else if (items.length) {
      lines.push(this.quantityTuple(items, level));
    }
    if (!lines.length) return head + "\n";
    return `${head} matches {\n${lines.join("\n")}\n${indent}}\n`;
  }

  private quantityItemsShareRanges(items: QuantityItemView[]): boolean {
    const magnitudes = new Set(items.map((item) =>
      formatInterval(item.magnitude) ?? ""
    ));
    const precisions = new Set(items.map((item) =>
      formatInterval(item.precision) ?? ""
    ));
    return magnitudes.size <= 1 && precisions.size <= 1;
  }

  /** Co-varying units / magnitude / precision. The cADL parser skips tuples. */
  private quantityTuple(items: QuantityItemView[], level: number): string {
    const columns: Array<"units" | "magnitude" | "precision"> = [];
    if (items.some((item) => item.units)) columns.push("units");
    if (items.some((item) => formatInterval(item.magnitude))) {
      columns.push("magnitude");
    }
    if (items.some((item) => formatInterval(item.precision))) {
      columns.push("precision");
    }
    if (!columns.length) columns.push("units");
    const inner = this.getIndent(level + 1);
    const rowIndent = this.getIndent(level + 2);
    const rows = items.map((item) => {
      const cells = columns.map((column) => this.quantityTupleCell(column, item));
      return `${rowIndent}[${cells.join(", ")}]`;
    });
    return `${inner}[${columns.join(", ")}] matches {\n${rows.join(",\n")}\n${inner}}`;
  }

  private quantityTupleCell(
    column: "units" | "magnitude" | "precision",
    item: QuantityItemView,
  ): string {
    if (column === "units") {
      return item.units ? `{${JSON.stringify(item.units)}}` : `{*}`;
    }
    const text = formatInterval(
      column === "magnitude" ? item.magnitude : item.precision,
    );
    return text ? `{|${text}|}` : `{*}`;
  }

  protected serializeOrdinal(
    ordinal: openehr_am.C_ORDINAL,
    level: number,
  ): string {
    const items = (ordinal as {
      list?: Array<{
        value?: number;
        symbol?: { code_string?: string; terminology_id?: unknown };
      }>;
    }).list ?? [];
    if (!items.length) {
      return this.cObjectHead(
        ordinal.rm_type_name || "DV_ORDINAL",
        ordinal,
        level,
      ) + "\n";
    }
    // One alternative per rung so value and symbol stay paired and cADL can
    // re-read the block. Occurrences stay on the parent attribute.
    let adl = "";
    items.forEach((item, index) => {
      const shell = new openehr_am.C_ORDINAL();
      shell.rm_type_name = ordinal.rm_type_name || "DV_ORDINAL";
      if (index === 0) shell.node_id = ordinal.node_id;
      const head = this.cObjectHead(shell.rm_type_name || "DV_ORDINAL", shell, level);
      const inner = this.getIndent(level + 1);
      const lines: string[] = [];
      if (item.value !== undefined) {
        lines.push(`${inner}value matches {|${item.value}|}`);
      }
      const code = item.symbol?.code_string;
      if (code) {
        const term = this.formatTermCode(
          asTerminologyId(item.symbol?.terminology_id),
          code,
        );
        const deep = this.getIndent(level + 2);
        const deeper = this.getIndent(level + 3);
        lines.push(
          `${inner}symbol matches {\n${deep}DV_CODED_TEXT matches {\n${deeper}defining_code matches {${term}}\n${deep}}\n${inner}}`,
        );
      }
      if (!lines.length) {
        adl += head + "\n";
        return;
      }
      adl += `${head} matches {\n${lines.join("\n")}\n${this.getIndent(level)}}\n`;
    });
    return adl;
  }

  protected serializeCodedText(
    coded: openehr_am.C_CODED_TEXT,
    level: number,
  ): string {
    const codes = (coded as { code_list?: string[] }).code_list ?? [];
    const head = this.cObjectHead(
      coded.rm_type_name || "DV_CODED_TEXT",
      coded,
      level,
    );
    if (!codes.length) return head + "\n";
    const body = codes.map((code) => this.formatTermCode(coded.terminology, code))
      .join(", ");
    const indent = this.getIndent(level);
    const inner = this.getIndent(level + 1);
    return `${head} matches {\n${inner}defining_code matches {${body}}\n${indent}}\n`;
  }

  /** Local value codes stay `[at…]` / `[ac…]`; external codes are `[term::code]`. */
  protected formatTermCode(
    terminologyId: string | undefined,
    code: string,
  ): string {
    const tid = terminologyId?.trim();
    if (tid && tid.toLowerCase() !== "local") return `[${tid}::${code}]`;
    return `[${code}]`;
  }

  protected serializeTerminologyCode(
    term: openehr_am.C_TERMINOLOGY_CODE,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    const runtime = term as openehr_am.C_TERMINOLOGY_CODE & {
      code_list?: string[];
      terminology_id?: string;
    };
    const codes = runtime.code_list?.length
      ? runtime.code_list
      : term.constraint
      ? [term.constraint]
      : [];
    if (!codes.length) {
      return `${indent}${term.rm_type_name || "CODE_PHRASE"}\n`;
    }
    const body = codes.map((code) => this.formatTermCode(runtime.terminology_id, code))
      .join(", ");
    return `${indent}${body}\n`;
  }

  protected serializePrimitiveObject(
    prim: openehr_am.C_PRIMITIVE_OBJECT,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    if (prim instanceof openehr_am.C_TERMINOLOGY_CODE) {
      return this.serializeTerminologyCode(prim, level);
    }
    if (prim.item instanceof openehr_am.C_PRIMITIVE) {
      const body = this.primitiveBody(prim.item, prim.rm_type_name);
      if (body && !prim.node_id) return `${indent}${body}\n`;
      if (body) {
        const head = this.cObjectHead(prim.rm_type_name || "STRING", prim, level);
        return `${head} matches {${body}}\n`;
      }
    }
    return this.cObjectHead(prim.rm_type_name || "STRING", prim, level) + "\n";
  }

  protected serializeBarePrimitive(
    prim: openehr_am.C_PRIMITIVE,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    const rm = (prim as { rm_type_name?: string }).rm_type_name;
    const body = this.primitiveBody(prim, rm);
    if (body) return `${indent}${body}\n`;
    if (rm) return `${indent}${rm}\n`;
    return "";
  }

  /**
   * Single-line `matches {…}` body. Regex constraints must sit immediately
   * after `{`; an indented `/pattern/` is lexed as a path slash.
   */
  private inlinePrimitiveMatch(child: openehr_am.C_OBJECT): string | undefined {
    if (
      child instanceof openehr_am.C_PRIMITIVE_OBJECT &&
      !(child instanceof openehr_am.C_TERMINOLOGY_CODE) &&
      !child.node_id &&
      child.item instanceof openehr_am.C_STRING &&
      child.item.pattern &&
      !(child.item as { list?: string[] }).list?.length
    ) {
      return this.primitiveBody(child.item, child.rm_type_name);
    }
    let body: string | undefined;
    if (child instanceof openehr_am.C_PRIMITIVE) {
      body = this.primitiveBody(
        child,
        (child as { rm_type_name?: string }).rm_type_name,
      );
    } else if (
      child instanceof openehr_am.C_PRIMITIVE_OBJECT &&
      !(child instanceof openehr_am.C_TERMINOLOGY_CODE) &&
      !child.node_id &&
      child.item instanceof openehr_am.C_PRIMITIVE
    ) {
      body = this.primitiveBody(child.item, child.rm_type_name);
    }
    if (body?.includes("/")) return body;
    return undefined;
  }

  private primitiveBody(
    prim: openehr_am.C_PRIMITIVE,
    rmType: string | undefined,
  ): string | undefined {
    if (prim instanceof openehr_am.C_STRING) {
      const list = (prim as { list?: string[] }).list;
      if (list?.length) return list.map((item) => JSON.stringify(item)).join(", ");
      const pattern = prim.pattern;
      if (!pattern) return undefined;
      const rm = (rmType ?? "").toUpperCase();
      if (
        rm === "INTEGER" || rm === "REAL" || rm === "DATE" || rm === "TIME" ||
        rm === "DATE_TIME" || rm === "DURATION"
      ) {
        return `|${pattern}|`;
      }
      const regexLike = /\\|\.\*|\^|\$/.test(pattern);
      if (rm === "STRING" || rm === "DV_URI" || regexLike) {
        return `/${pattern}/`;
      }
      return JSON.stringify(pattern);
    }
    if (prim instanceof openehr_am.C_INTEGER || prim instanceof openehr_am.C_REAL) {
      const list = (prim as { list?: number[] }).list;
      const range = formatInterval(
        (prim as { range?: IntervalLike }).range,
      );
      const parts: string[] = [];
      if (range) parts.push(`|${range}|`);
      if (list?.length) parts.push(...list.map((n) => `|${n}|`));
      return parts.length ? parts.join(", ") : undefined;
    }
    if (prim instanceof openehr_am.C_BOOLEAN) {
      const allowTrue = prim.true_valid;
      const allowFalse = prim.false_valid;
      if (allowTrue === undefined && allowFalse === undefined) return undefined;
      if (allowTrue !== false && allowFalse !== false) return "True, False";
      if (allowTrue !== false) return "True";
      if (allowFalse !== false) return "False";
      return undefined;
    }
    if (
      prim instanceof openehr_am.C_DATE ||
      prim instanceof openehr_am.C_TIME ||
      prim instanceof openehr_am.C_DATE_TIME ||
      prim instanceof openehr_am.C_DURATION
    ) {
      const parts: string[] = [];
      const pattern = temporalPattern(prim);
      if (pattern) parts.push(`/${pattern}/`);
      const range = formatInterval((prim as { range?: IntervalLike }).range);
      if (range) parts.push(`|${range}|`);
      return parts.length ? parts.join(", ") : undefined;
    }
    return undefined;
  }

  protected getIndent(level: number): string {
    return (this.config.indent || "    ").repeat(level);
  }
}

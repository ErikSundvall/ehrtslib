/**
 * Build plain RM object trees from a normalized document block stream.
 */

import type { openehr_am } from "../../am/openehr_am.ts";
import {
  parseCodePhraseDisplay,
  parseDataValueDisplay,
  parseDvCodedTextDisplay,
} from "./value_parse.ts";
import { archetypeIdFromOpenehrUrn } from "./openehr_aom_urn.ts";
import { parseOeRmAnnotationPayload } from "./oe_rm_annotation.ts";
import { mergeRmPatchPayload } from "./oe_rm_sparse.ts";
import { resolveDataValueFromDisplayAndAnnotation } from "./oe_value_annotation.ts";
import type {
  DocumentBlock,
  DocumentBoldBlock,
  DocumentHeadingBlock,
  DocumentListItemBlock,
  DocumentStructureMetaBlock,
} from "./document_blocks.ts";
import { ENTRY_TYPES } from "./document_blocks.ts";
import {
  applyCompositionEntryDefaults,
  parseSubjectFromList,
  parseSubjectMeta,
} from "./document_entry_defaults.ts";

export interface DocumentMetadata {
  frontmatter: Record<string, string>;
}

type StackFrame =
  | { kind: "composition"; obj: Record<string, unknown> }
  | { kind: "section"; obj: Record<string, unknown> }
  | { kind: "entry"; obj: Record<string, unknown>; entryType: string }
  | { kind: "history"; obj: Record<string, unknown> }
  | { kind: "event"; obj: Record<string, unknown>; data: Record<string, unknown> }
  | { kind: "items"; parent: Record<string, unknown>; itemsKey: string; listIndent: number };

function dvText(value: string): Record<string, unknown> {
  return { _type: "DV_TEXT", value };
}

function partyIdentified(name: string): Record<string, unknown> {
  return { _type: "PARTY_IDENTIFIED", name };
}

function parseFrontmatterValue(key: string, raw: string): unknown {
  const unquoted = raw.replace(/^"(.*)"$/, "$1").trim();
  if (key === "composer") {
    return partyIdentified(unquoted);
  }
  if (key === "category") {
    const ct = parseDvCodedTextDisplay(unquoted);
    return ct ?? dvText(unquoted);
  }
  if (key === "language" || key === "territory") {
    const cp = parseCodePhraseDisplay(unquoted);
    return cp ?? dvText(unquoted);
  }
  if (key === "uid") {
    const idType = unquoted.includes("::") ? "OBJECT_VERSION_ID" : "HIER_OBJECT_ID";
    return { _type: idType, value: unquoted };
  }
  if (key === "template_id") {
    return { _type: "TEMPLATE_ID", value: unquoted };
  }
  if (key === "archetype_id") {
    return { _type: "ARCHETYPE_ID", value: unquoted };
  }
  if (key === "rm_version" || key === "rm-version") {
    return unquoted;
  }
  return unquoted;
}

function applyCompositionFrontmatter(
  comp: Record<string, unknown>,
  meta: DocumentMetadata,
): void {
  const ad: Record<string, unknown> = { _type: "ARCHETYPED" };
  let hasAd = false;
  for (const [key, raw] of Object.entries(meta.frontmatter)) {
    const val = parseFrontmatterValue(key, raw);
    if (key === "template_id" || key === "archetype_id" || key === "rm_version" || key === "rm-version") {
      const k = key === "rm-version" ? "rm_version" : key;
      ad[k] = val;
      hasAd = true;
      continue;
    }
    if (key in comp || ["uid", "composer", "language", "territory", "category"].includes(key)) {
      comp[key] = val;
    }
  }
  if (hasAd) {
    comp.archetype_details = ad;
  }
}

function ensureArray(parent: Record<string, unknown>, key: string): unknown[] {
  if (!Array.isArray(parent[key])) parent[key] = [];
  return parent[key] as unknown[];
}

function itemTree(): Record<string, unknown> {
  return { _type: "ITEM_TREE", items: [] as unknown[] };
}

function listItemStructureTarget(
  stack: StackFrame[],
  entryForMeta?: Extract<StackFrame, { kind: "entry" }>,
): Record<string, unknown> | null {
  const top = stack[stack.length - 1];
  if (top?.kind === "event") return top.data;
  if (top?.kind === "items") return top.parent;
  if (top?.kind === "history") return top.obj;
  if (entryForMeta) {
    const withData = new Set(["OBSERVATION", "EVALUATION", "ADMIN_ENTRY", "INSTRUCTION"]);
    if (withData.has(entryForMeta.entryType)) {
      if (!entryForMeta.obj.data) {
        entryForMeta.obj.data = entryForMeta.entryType === "OBSERVATION"
          ? { _type: "HISTORY", events: [] }
          : itemTree();
      }
      return entryForMeta.obj.data as Record<string, unknown>;
    }
  }
  return null;
}

function parseListMeta(
  block: DocumentListItemBlock,
): { field?: string; name?: string; valueText?: string } {
  const raw = block.raw.replace(/<!--\s*[^>]+\s*-->/, "").trim();
  const meta = raw.replace(/^-\s*/, "");
  const metaMatch = meta.match(/^_(.+?):_\s*(.*)$/s);
  if (metaMatch) {
    return { field: metaMatch[1].toLowerCase(), valueText: metaMatch[2].trim() };
  }
  const label = block.label?.replace(/\*\*/g, "").trim();
  return { name: label, valueText: block.value?.trim() };
}

function addElement(
  items: unknown[],
  name: string,
  valueText: string,
  nodeId?: string,
  oeValuePayload?: string,
  oeRmPayload?: string,
): void {
  const base: Record<string, unknown> = {
    _type: "ELEMENT",
    name: dvText(name),
    value: resolveDataValueFromDisplayAndAnnotation(valueText, oeValuePayload),
  };
  if (nodeId) base.archetype_node_id = nodeId;
  items.push(mergeRmPatchPayload(base, oeRmPayload));
}

function popItemsForIndent(stack: StackFrame[], indent: number): void {
  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    if (top.kind === "items" && top.listIndent >= indent) {
      stack.pop();
      continue;
    }
    break;
  }
}

function compositionFromStack(stack: StackFrame[]): Record<string, unknown> | null {
  const f = stack.find((s) => s.kind === "composition");
  return f?.kind === "composition" ? f.obj : null;
}

function entryFromStack(stack: StackFrame[]): StackFrame & { kind: "entry" } | null {
  const f = [...stack].reverse().find((s) => s.kind === "entry");
  return f?.kind === "entry" ? f : null;
}

function ensureEventContext(comp: Record<string, unknown>): Record<string, unknown> {
  if (!comp.context) {
    comp.context = { _type: "EVENT_CONTEXT" };
  }
  return comp.context as Record<string, unknown>;
}

function parseContextScalarField(
  field: string,
  text: string,
  oeRm?: string,
): unknown {
  if (oeRm) {
    const fromText = parseContextScalarField(field, text, undefined);
    const base = (fromText && typeof fromText === "object")
      ? { ...(fromText as Record<string, unknown>) }
      : { _type: "DV_TEXT", value: text };
    return mergeRmPatchPayload(base, oeRm);
  }
  const t = text.trim();
  if (field === "start_time" || field === "end_time") {
    return { _type: "DV_DATE_TIME", value: t };
  }
  if (field === "setting") {
    return parseDvCodedTextDisplay(t) ?? { _type: "DV_CODED_TEXT", value: t };
  }
  if (field === "location") {
    return parseDataValueDisplay(t) ?? { _type: "DV_TEXT", value: t };
  }
  return parseDataValueDisplay(t);
}

export function blocksToRmObject(
  blocks: DocumentBlock[],
  meta: DocumentMetadata,
  options?: {
    rootType?: string;
    validateAgainstTemplate?: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE;
  },
): Record<string, unknown> {
  const stack: StackFrame[] = [];
  let root: Record<string, unknown> | null = null;
  const headingStack: { level: number; frame: StackFrame }[] = [];

  const currentItems = (): unknown[] | null => {
    const top = stack[stack.length - 1];
    if (!top) return null;
    if (top.kind === "items") {
      return ensureArray(top.parent, top.itemsKey);
    }
    if (top.kind === "event") {
      return ensureArray(top.data, "items");
    }
    if (top.kind === "entry") {
      const withItemTree = new Set(["EVALUATION", "ADMIN_ENTRY", "INSTRUCTION"]);
      if (withItemTree.has(top.entryType)) {
        if (!top.obj.data) top.obj.data = itemTree();
        const data = top.obj.data as Record<string, unknown>;
        return ensureArray(data, "items");
      }
    }
    return null;
  };

  let pendingStructureMeta: {
    item_node_id?: string;
    item_name?: string;
    structure?: string;
  } = {};

  const applyPendingStructureMeta = (target: Record<string, unknown>) => {
    if (pendingStructureMeta.item_node_id) {
      target.archetype_node_id = pendingStructureMeta.item_node_id;
    }
    if (pendingStructureMeta.item_name) {
      target.name = dvText(pendingStructureMeta.item_name);
    }
    if (pendingStructureMeta.structure) {
      target._type = pendingStructureMeta.structure;
    }
    pendingStructureMeta = {};
  };

  const flushPendingStructureMeta = () => {
    if (
      !pendingStructureMeta.item_node_id &&
      !pendingStructureMeta.item_name &&
      !pendingStructureMeta.structure
    ) {
      return;
    }
    const top = stack[stack.length - 1];
    if (top?.kind === "entry") {
      const withTree = new Set(["EVALUATION", "ADMIN_ENTRY", "INSTRUCTION", "GENERIC_ENTRY"]);
      if (withTree.has(top.entryType)) {
        if (!top.obj.data) top.obj.data = itemTree();
        applyPendingStructureMeta(top.obj.data as Record<string, unknown>);
        return;
      }
      if (top.entryType === "OBSERVATION") {
        if (!top.obj.data) {
          top.obj.data = { _type: "HISTORY", events: [] };
        }
        applyPendingStructureMeta(top.obj.data as Record<string, unknown>);
        return;
      }
    }
    if (top?.kind === "history") {
      applyPendingStructureMeta(top.obj);
      return;
    }
    if (top?.kind === "event") {
      applyPendingStructureMeta(top.data);
      return;
    }
    if (top?.kind === "items") {
      applyPendingStructureMeta(top.parent);
    }
  };

  const attachContent = (child: Record<string, unknown>) => {
    if (stack.length === 0) return;
    const top = stack[0];
    if (top.kind === "composition") {
      ensureArray(top.obj, "content").push(child);
    }
  };

  const popToHeadingLevel = (level: number) => {
    while (headingStack.length && headingStack[headingStack.length - 1].level >= level) {
      headingStack.pop();
      if (stack.length > 1) stack.pop();
    }
  };

  for (const block of blocks) {
    if (block.kind === "structure_meta") {
      const sm = block as DocumentStructureMetaBlock;
      if (sm.field === "item_node_id") pendingStructureMeta.item_node_id = sm.value;
      else if (sm.field === "item_name") pendingStructureMeta.item_name = sm.value;
      else if (sm.field === "structure") pendingStructureMeta.structure = sm.value;
      flushPendingStructureMeta();
      continue;
    }

    if (block.kind === "heading") {
      const h = block as DocumentHeadingBlock;
      popToHeadingLevel(h.level);

      if (h.level === 1) {
        if (h.rmType && ENTRY_TYPES.has(h.rmType)) {
          const entry: Record<string, unknown> = {
            _type: h.rmType,
            name: dvText(h.title),
          };
          if (h.archetypeNodeId) entry.archetype_node_id = h.archetypeNodeId;
          root = entry;
          stack.length = 0;
          headingStack.length = 0;
          const frame: StackFrame = { kind: "entry", obj: entry, entryType: h.rmType };
          stack.push(frame);
          headingStack.push({ level: 1, frame });
          continue;
        }
        if (h.rmType === "SECTION") {
          const section: Record<string, unknown> = {
            _type: "SECTION",
            name: dvText(h.title),
            items: [],
          };
          if (h.archetypeNodeId) section.archetype_node_id = h.archetypeNodeId;
          root = section;
          stack.length = 0;
          headingStack.length = 0;
          const frame: StackFrame = { kind: "section", obj: section };
          stack.push(frame);
          headingStack.push({ level: 1, frame });
          continue;
        }
        const comp: Record<string, unknown> = {
          _type: "COMPOSITION",
          name: dvText(h.title),
          content: [],
        };
        if (h.archetypeNodeId) comp.archetype_node_id = h.archetypeNodeId;
        applyCompositionFrontmatter(comp, meta);
        root = comp;
        stack.length = 0;
        headingStack.length = 0;
        stack.push({ kind: "composition", obj: comp });
        headingStack.push({ level: 1, frame: stack[0] });
        continue;
      }

      const parentFrame = headingStack[headingStack.length - 1]?.frame;
      const rmType = h.rmType;
      if (rmType === "SECTION") {
        const section: Record<string, unknown> = {
          _type: "SECTION",
          name: dvText(h.title),
          items: [],
        };
        if (h.archetypeNodeId) section.archetype_node_id = h.archetypeNodeId;
        if (parentFrame?.kind === "composition") {
          ensureArray(parentFrame.obj, "content").push(section);
        } else if (parentFrame?.kind === "section") {
          ensureArray(parentFrame.obj, "items").push(section);
        }
        const frame: StackFrame = { kind: "section", obj: section };
        stack.push(frame);
        headingStack.push({ level: h.level, frame });
        continue;
      }

      if (rmType && ENTRY_TYPES.has(rmType)) {
        const entry: Record<string, unknown> = {
          _type: rmType,
          name: dvText(h.title),
        };
        if (h.archetypeNodeId) entry.archetype_node_id = h.archetypeNodeId;
        if (parentFrame?.kind === "composition") {
          ensureArray(parentFrame.obj, "content").push(entry);
        } else if (parentFrame?.kind === "section") {
          ensureArray(parentFrame.obj, "items").push(entry);
        } else if (!parentFrame) {
          root = entry;
        }
        const frame: StackFrame = { kind: "entry", obj: entry, entryType: rmType };
        stack.push(frame);
        headingStack.push({ level: h.level, frame });
        continue;
      }

      // Heading without explicit type under section — treat as nested section-like group
      const generic: Record<string, unknown> = {
        _type: "SECTION",
        name: dvText(h.title),
        items: [],
      };
      if (h.archetypeNodeId) generic.archetype_node_id = h.archetypeNodeId;
      if (parentFrame?.kind === "composition") {
        ensureArray(parentFrame.obj, "content").push(generic);
      } else if (parentFrame?.kind === "section") {
        ensureArray(parentFrame.obj, "items").push(generic);
      }
      const frame: StackFrame = { kind: "section", obj: generic };
      stack.push(frame);
      headingStack.push({ level: h.level, frame });
      continue;
    }

    if (block.kind === "bold") {
      const b = block as DocumentBoldBlock;
      const entryFrame = [...stack].reverse().find(
        (f): f is Extract<StackFrame, { kind: "entry" }> => f.kind === "entry",
      );
      if (entryFrame?.entryType === "OBSERVATION") {
        const top = entryFrame;
        const history = (top.obj.data ?? {
          _type: "HISTORY",
          events: [],
        }) as Record<string, unknown>;
        if (!top.obj.data) top.obj.data = history;
        const event: Record<string, unknown> = {
          _type: b.isInterval ? "INTERVAL_EVENT" : "POINT_EVENT",
          name: dvText(b.text),
          data: itemTree(),
        };
        if (b.archetypeNodeId) event.archetype_node_id = b.archetypeNodeId;
        ensureArray(history, "events").push(event);
        stack.push({ kind: "history", obj: history });
        stack.push({
          kind: "event",
          obj: event,
          data: event.data as Record<string, unknown>,
        });
      }
      continue;
    }

    if (block.kind === "list_item") {
      const li = block as DocumentListItemBlock;
      popItemsForIndent(stack, li.indent);
      const top = stack[stack.length - 1];
      if (top?.kind === "event") applyPendingStructureMeta(top.data);
      if (top?.kind === "history") applyPendingStructureMeta(top.obj);
      if (top?.kind === "entry" && top.obj.data && typeof top.obj.data === "object") {
        applyPendingStructureMeta(top.obj.data as Record<string, unknown>);
      }
      const parsed = parseListMeta(li);
      const comp = compositionFromStack(stack);
      const entryOnStack = entryFromStack(stack);
      const entryScopedMeta = new Set([
        "link",
        "feeder_audit",
        "archetype_details",
        "language",
        "encoding",
        "subject",
        "other_participation",
      ]);
      const handleAtComposition = comp && parsed.field &&
        !(entryOnStack && top?.kind === "entry" && entryScopedMeta.has(parsed.field));

      const entryForMeta = top?.kind === "entry"
        ? top
        : [...stack].reverse().find(
          (f): f is Extract<StackFrame, { kind: "entry" }> => f.kind === "entry",
        );

      if (entryForMeta && parsed.field === "language") {
        const cp = parseCodePhraseDisplay(parsed.valueText ?? "");
        if (cp) entryForMeta.obj.language = cp;
        continue;
      }
      if (entryForMeta && parsed.field === "encoding") {
        const cp = parseCodePhraseDisplay(parsed.valueText ?? "");
        if (cp) entryForMeta.obj.encoding = cp;
        continue;
      }
      if (entryForMeta && parsed.field === "subject") {
        entryForMeta.obj.subject = parseSubjectFromList(
          parsed.valueText ?? "",
          li.oeRmPayload,
        );
        continue;
      }
      if (entryForMeta && parsed.field === "feeder_audit") {
        entryForMeta.obj.feeder_audit = mergeRmPatchPayload(
          { _type: "FEEDER_AUDIT" },
          li.oeRmPayload,
        );
        continue;
      }
      if (entryForMeta && parsed.field === "link") {
        ensureArray(entryForMeta.obj, "links").push(
          mergeRmPatchPayload({ _type: "LINK" }, li.oeRmPayload),
        );
        continue;
      }
      if (entryForMeta && parsed.field === "other_participation") {
        ensureArray(entryForMeta.obj, "other_participations").push(
          mergeRmPatchPayload({ _type: "PARTICIPATION" }, li.oeRmPayload),
        );
        continue;
      }
      if (entryForMeta && parsed.field === "archetype_details" && li.oeRmPayload) {
        entryForMeta.obj.archetype_details = mergeRmPatchPayload(
          { _type: "ARCHETYPED" },
          li.oeRmPayload,
        );
        continue;
      }

      if (handleAtComposition) {
        if (parsed.field === "context") continue;
        if (parsed.field === "composer") {
          const vis = (parsed.valueText ?? li.value ?? "").trim();
          const base: Record<string, unknown> = vis && vis !== "—"
            ? { _type: "PARTY_IDENTIFIED", name: vis.split(" · ")[0].trim() }
            : { _type: "PARTY_SELF" };
          comp.composer = mergeRmPatchPayload(base, li.oeRmPayload);
          continue;
        }
        if (parsed.field === "feeder_audit") {
          comp.feeder_audit = mergeRmPatchPayload(
            { _type: "FEEDER_AUDIT" },
            li.oeRmPayload,
          );
          continue;
        }
        if (parsed.field === "links") {
          comp.links = [];
          continue;
        }
        if (parsed.field === "link") {
          ensureArray(comp, "links").push(
            mergeRmPatchPayload({ _type: "LINK" }, li.oeRmPayload),
          );
          continue;
        }
        if (parsed.field === "archetype_details" && li.oeRmPayload) {
          comp.archetype_details = mergeRmPatchPayload(
            { _type: "ARCHETYPED" },
            li.oeRmPayload,
          );
          continue;
        }
        const ctxFields = new Set([
          "start_time",
          "end_time",
          "location",
          "setting",
          "health_care_facility",
          "participation",
          "other_context",
        ]);
        if (ctxFields.has(parsed.field)) {
          const ctx = ensureEventContext(comp);
          if (parsed.field === "participation") {
            ensureArray(ctx, "participations").push(
              mergeRmPatchPayload({ _type: "PARTICIPATION" }, li.oeRmPayload),
            );
            continue;
          }
          if (parsed.field === "health_care_facility") {
            ctx.health_care_facility = mergeRmPatchPayload(
              { _type: "PARTY_IDENTIFIED" },
              li.oeRmPayload,
            );
            continue;
          }
          if (parsed.field === "other_context") {
            const tree = itemTree();
            ctx.other_context = tree;
            stack.push({
              kind: "items",
              parent: tree,
              itemsKey: "items",
              listIndent: Math.max(-1, li.indent - 1),
            });
            continue;
          }
          if (parsed.field !== "other_context" && parsed.field !== "participation") {
            ctx[parsed.field] = parseContextScalarField(
              parsed.field,
              parsed.valueText ?? "",
              li.oeRmPayload,
            );
          }
          continue;
        }
      }
      if (parsed.field === "item_node_id") {
        const target = listItemStructureTarget(stack, entryForMeta);
        if (target) {
          const raw = parsed.valueText ?? "";
          target.archetype_node_id = archetypeIdFromOpenehrUrn(raw) ?? raw;
          continue;
        }
      }
      if (parsed.field === "item_name") {
        const target = listItemStructureTarget(stack, entryForMeta);
        if (target) {
          target.name = dvText(parsed.valueText ?? "");
          continue;
        }
      }
      if (parsed.field === "protocol") {
        const entry = entryForMeta;
        if (entry?.entryType === "OBSERVATION" || entry?.entryType === "EVALUATION" ||
          entry?.entryType === "INSTRUCTION" || entry?.entryType === "ACTION") {
          if (!entry.obj.protocol) entry.obj.protocol = itemTree();
          while (stack.length > 0 && stack[stack.length - 1].kind !== "entry") stack.pop();
          stack.push({
            kind: "items",
            parent: entry.obj.protocol as Record<string, unknown>,
            itemsKey: "items",
            listIndent: li.indent,
          });
          continue;
        }
      }
      if (parsed.field === "state") {
        const eventFrame = [...stack].reverse().find(
          (f): f is Extract<StackFrame, { kind: "event" }> => f.kind === "event",
        );
        if (eventFrame) {
          if (!eventFrame.obj.state) eventFrame.obj.state = itemTree();
          while (stack.length > 0 && stack[stack.length - 1].kind !== "event") stack.pop();
          stack.push({
            kind: "items",
            parent: eventFrame.obj.state as Record<string, unknown>,
            itemsKey: "items",
            listIndent: li.indent,
          });
          continue;
        }
      }
      if (parsed.field === "summary") {
        const entry = entryForMeta;
        if (entry?.entryType === "OBSERVATION" && entry.obj.data) {
          const hist = entry.obj.data as Record<string, unknown>;
          if (!hist.summary) hist.summary = itemTree();
          while (stack.length > 0 && stack[stack.length - 1].kind !== "entry") stack.pop();
          stack.push({
            kind: "items",
            parent: hist.summary as Record<string, unknown>,
            itemsKey: "items",
            listIndent: li.indent,
          });
          continue;
        }
      }
      if (parsed.field === "structure") {
        const rmType = parsed.valueText?.trim();
        if (rmType && /^[A-Z][A-Z0-9_]*$/.test(rmType)) {
          if (top?.kind === "event") {
            top.data._type = rmType;
          } else if (top?.kind === "entry" && top.obj.data) {
            (top.obj.data as Record<string, unknown>)._type = rmType;
          }
        }
        continue;
      }
      if (parsed.field === "origin" && entryForMeta?.entryType === "OBSERVATION") {
        const top = entryForMeta;
        if (!top.obj.data) {
          top.obj.data = { _type: "HISTORY", events: [] };
        }
        const hist = top.obj.data as Record<string, unknown>;
        applyPendingStructureMeta(hist);
        hist.origin = { _type: "DV_DATE_TIME", value: parsed.valueText ?? "" };
        stack.push({ kind: "history", obj: hist });
        continue;
      }
      if (parsed.field === "time" && top?.kind === "event") {
        top.obj.time = { _type: "DV_DATE_TIME", value: parsed.valueText ?? "" };
        continue;
      }
      if (parsed.name && parsed.valueText === undefined && li.label && !parsed.field) {
        const items = currentItems();
        if (items) {
          const cluster = mergeRmPatchPayload(
            {
              _type: "CLUSTER",
              name: dvText(parsed.name),
              ...(li.archetypeNodeId ? { archetype_node_id: li.archetypeNodeId } : {}),
            },
            li.oeRmPayload,
          );
          items.push(cluster);
          stack.push({
            kind: "items",
            parent: cluster,
            itemsKey: "items",
            listIndent: li.indent,
          });
          continue;
        }
      }
      if (parsed.name && parsed.valueText !== undefined) {
        const items = currentItems();
        if (items) {
          addElement(
            items,
            parsed.name,
            parsed.valueText ?? "",
            li.archetypeNodeId,
            li.oeValuePayload,
            li.oeRmPayload,
          );
          continue;
        }
        if (top?.kind === "section") {
          const tree = itemTree();
          addElement(
            ensureArray(tree, "items"),
            parsed.name,
            parsed.valueText ?? "",
            li.archetypeNodeId,
            li.oeValuePayload,
          );
          ensureArray(top.obj, "items").push(tree);
        }
      }
    }
  }

  if (!root) {
    // Standalone OBSERVATION / SECTION documents (tests serialize non-composition roots)
    const first = blocks.find((b) => b.kind === "heading") as DocumentHeadingBlock | undefined;
    if (first && first.rmType && ENTRY_TYPES.has(first.rmType)) {
      root = { _type: first.rmType, name: dvText(first.title) };
      if (first.archetypeNodeId) root.archetype_node_id = first.archetypeNodeId;
      // Re-run simplified path — for tests, rebuild from list blocks only
      const items = itemTree();
      for (const block of blocks) {
        if (block.kind === "list_item") {
          const li = block as DocumentListItemBlock;
          const parsed = parseListMeta(li);
          if (parsed.name && parsed.valueText) {
            addElement(
              ensureArray(items, "items"),
              parsed.name,
              parsed.valueText ?? "",
              li.archetypeNodeId,
              li.oeValuePayload,
            );
          }
        }
      }
      if (first.rmType === "OBSERVATION") {
        root.data = { _type: "HISTORY", events: [{ _type: "POINT_EVENT", name: dvText("Any event"), data: items }] };
      } else {
        root.data = items;
      }
    }
  }

  if (!root) {
    throw new Error("Document contains no composition or supported root heading");
  }

  void options?.validateAgainstTemplate;

  // If observation has events but no explicit origin, copy first event time when present
  if (root._type === "OBSERVATION" && root.data) {
    const hist = root.data as Record<string, unknown>;
    const events = hist.events as Record<string, unknown>[] | undefined;
    if (!hist.origin && events?.[0]?.time) {
      hist.origin = events[0].time;
    }
  }

  applyCompositionEntryDefaults(root, meta);

  return root;
}

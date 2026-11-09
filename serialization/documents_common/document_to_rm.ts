/**
 * Build plain RM object trees from a normalized document block stream.
 */

import type { openehr_am } from "../../am/openehr_am.ts";
import { parseCodePhraseDisplay, parseDvCodedTextDisplay } from "./value_parse.ts";
import { resolveDataValueFromDisplayAndAnnotation } from "./oe_value_annotation.ts";
import type { DocumentBlock, DocumentBoldBlock, DocumentHeadingBlock, DocumentListItemBlock } from "./document_blocks.ts";
import { ENTRY_TYPES } from "./document_blocks.ts";

export interface DocumentMetadata {
  frontmatter: Record<string, string>;
}

type StackFrame =
  | { kind: "composition"; obj: Record<string, unknown> }
  | { kind: "section"; obj: Record<string, unknown> }
  | { kind: "entry"; obj: Record<string, unknown>; entryType: string }
  | { kind: "history"; obj: Record<string, unknown> }
  | { kind: "event"; obj: Record<string, unknown>; data: Record<string, unknown> }
  | { kind: "items"; parent: Record<string, unknown>; itemsKey: string };

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
    return { _type: "HIER_OBJECT_ID", value: unquoted };
  }
  if (key === "template_id") {
    return { _type: "TEMPLATE_ID", value: unquoted };
  }
  if (key === "archetype_id") {
    return { _type: "ARCHETYPE_ID", value: unquoted };
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
    if (key === "template_id" || key === "archetype_id") {
      ad[key] = val;
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
): void {
  const el: Record<string, unknown> = {
    _type: "ELEMENT",
    name: dvText(name),
    value: resolveDataValueFromDisplayAndAnnotation(valueText, oeValuePayload),
  };
  if (nodeId) el.archetype_node_id = nodeId;
  items.push(el);
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
      const top = stack[stack.length - 1];
      const parsed = parseListMeta(li);
      const entryForMeta = top?.kind === "entry"
        ? top
        : [...stack].reverse().find(
          (f): f is Extract<StackFrame, { kind: "entry" }> => f.kind === "entry",
        );
      if (parsed.field === "language" && entryForMeta) {
        const cp = parseCodePhraseDisplay(parsed.valueText ?? "");
        if (cp) entryForMeta.obj.language = cp;
        continue;
      }
      if (parsed.field === "encoding" && entryForMeta) {
        const cp = parseCodePhraseDisplay(parsed.valueText ?? "");
        if (cp) entryForMeta.obj.encoding = cp;
        continue;
      }
      if (parsed.field === "subject" && entryForMeta) {
        entryForMeta.obj.subject = { _type: parsed.valueText ?? "PARTY_SELF" };
        continue;
      }
      if (parsed.field === "item_node_id") {
        const target = listItemStructureTarget(stack, entryForMeta);
        if (target) {
          target.archetype_node_id = parsed.valueText;
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
          const cluster: Record<string, unknown> = {
            _type: "CLUSTER",
            name: dvText(parsed.name),
          };
          if (li.archetypeNodeId) cluster.archetype_node_id = li.archetypeNodeId;
          items.push(cluster);
          continue;
        }
      }
      if (parsed.name && parsed.valueText !== undefined) {
        const items = currentItems();
        if (items) {
          addElement(items, parsed.name, parsed.valueText ?? "", li.archetypeNodeId, li.oeValuePayload);
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

  return root;
}

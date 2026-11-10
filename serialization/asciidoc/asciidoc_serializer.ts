/**
 * AsciiDoc Serializer for openEHR RM Objects
 * 
 * Converts openEHR Reference Model instances to AsciiDoc representations.
 * 
 * Two variants are supported:
 * 1. **Compact** - Human-readable documents (lossy, good for display)
 * 2. **Lossless** - Full round-trip format (reconstructable with template)
 * 
 * The structural mapping is:
 * - COMPOSITION → Document (= composition name)
 * - SECTION → Headings (==, ===, ...)
 * - ENTRY types (OBSERVATION, EVALUATION, etc.) → Headings or bold items
 * - CLUSTER → Nested lists or sub-headings
 * - ELEMENT → List items with values
 * - DATA_VALUE subtypes → Inline formatted values
 * 
 * Lossless mode uses:
 * - AsciiDoc comments (`// node-id`) for archetype_node_ids
 * - Document attributes for metadata
 * - openEHR URN-based cross-references for archetype links
 */

import { TypeRegistry } from '../common/type_registry.ts';
import { SerializationError } from '../common/errors.ts';
import {
  toTerseCodePhrase,
  toTerseDvCodedText,
} from '../terse_format.ts';
import {
  AsciidocSerializationConfig,
  DEFAULT_ASCIIDOC_SERIALIZATION_CONFIG,
} from './asciidoc_config.ts';
import { toOpenehrAomArchetypeUrn } from '../documents_common/openehr_aom_urn.ts';
import {
  formatOeValueAnnotationAsciidoc,
  needsOeValueAnnotation,
} from '../documents_common/oe_value_annotation.ts';
import {
  ensureBlankLineBeforeBlock,
  finalizeDocumentText,
} from '../documents_common/document_emit.ts';
import {
  computeCompositionEntryDefaults,
  entryMetadataDiffersFromDefaults,
  formatSubjectMeta,
  formatSubjectStructural,
  writeEntryDefaultsToAsciidocAttrs,
  type CompositionEntryDefaults,
} from '../documents_common/document_entry_defaults.ts';
import { formatOeMetaAsciidoc } from '../documents_common/oe_structure_meta.ts';
import {
  emitStructuralCompositionExtrasAsciidoc,
  emitStructuralEntryExtrasAsciidoc,
  emitStructuralEventContextAsciidoc,
} from "../documents_common/document_structural_emit.ts";
import { formatSparseRmAsciidoc } from "../documents_common/oe_rm_sparse.ts";
import { parseDataValueDisplay } from "../documents_common/value_parse.ts";
import {
  shouldEmitHistoryOrigin,
  shouldSkipLossyEventTitles,
} from '../documents_common/history_lossy_emit.ts';
import { asciidocDlistTermLine } from '../documents_common/document_list_layout.ts';
import {
  type DocumentRmRenderOptions,
  renderRmValue,
} from '../documents_common/document_rm_render.ts';

/**
 * AsciiDoc Serializer for openEHR RM objects
 * 
 * @example
 * ```typescript
 * import { AsciidocSerializer } from './serialization/asciidoc/mod.ts';
 * import { COMPACT_ASCIIDOC_CONFIG } from './serialization/asciidoc/mod.ts';
 * 
 * const serializer = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG);
 * const adoc = serializer.serialize(composition);
 * ```
 */
export class AsciidocSerializer {
  private config: Required<AsciidocSerializationConfig>;
  private activeEntryDefaults?: CompositionEntryDefaults;
  /** Set while serializing event data in compact table mode (Time column). */
  private compactTableEventTime = "";

  constructor(config: AsciidocSerializationConfig = {}) {
    this.config = { ...DEFAULT_ASCIIDOC_SERIALIZATION_CONFIG, ...config };
  }

  /**
   * Serialize an RM object to AsciiDoc string
   * 
   * @param obj - The openEHR RM object to serialize
   * @returns AsciiDoc string
   * @throws SerializationError if serialization fails
   */
  serialize(obj: any): string {
    try {
      const lines: string[] = [];
      const typeName = this.getTypeName(obj);

      if (typeName === 'COMPOSITION') {
        this.activeEntryDefaults = computeCompositionEntryDefaults(obj);
        this.serializeComposition(obj, lines);
        this.activeEntryDefaults = undefined;
      } else if (typeName === 'SECTION') {
        this.serializeSection(obj, lines, 2);
      } else if (this.isEntryType(typeName)) {
        this.serializeEntry(obj, typeName, lines, 2);
      } else if (this.isItemStructureType(typeName)) {
        this.serializeItemStructure(obj, lines, 2);
      } else {
        // Non-composition objects: serialize as standalone
        this.serializeNode(obj, typeName, lines, 2);
      }

      return finalizeDocumentText(lines);
    } catch (error) {
      throw new SerializationError(
        `Failed to serialize to AsciiDoc: ${error instanceof Error ? error.message : String(error)}`,
        obj,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Serialize with a specific configuration (one-time use)
   */
  static serializeWith(obj: any, config: AsciidocSerializationConfig): string {
    const serializer = new AsciidocSerializer(config);
    return serializer.serialize(obj);
  }

  // ─── COMPOSITION ─────────────────────────────────────────────────────

  private serializeComposition(comp: any, lines: string[]): void {
    // Document header with attributes
    if (this.config.includeHeader && this.config.style !== 'embedding') {
      this.writeHeader(comp, lines);
    }

    // = Composition name (level 1 heading)
    const name = this.extractName(comp);
    const title = this.formatLocatableHeadingTitle(comp, name);
    const nodeIdAnnotation = this.formatBlockNodeIdComment(comp);
    if (nodeIdAnnotation) {
      this.pushBlockCommentLine(lines, nodeIdAnnotation);
    }
    lines.push(`= ${title}`);
    lines.push('');

    if (this.config.style === "structural") {
      emitStructuralCompositionExtrasAsciidoc(comp, (line) => lines.push(line));
      lines.push("");
    }

    // Context (if present)
    if (comp.context) {
      this.serializeEventContext(comp.context, lines);
    }

    // Content items (SECTIONs and/or ENTRYs)
    if (comp.content && Array.isArray(comp.content)) {
      for (const item of comp.content) {
        this.serializeContentItem(item, lines, 2);
      }
    }

  }

  private writeHeader(comp: any, lines: string[]): void {
    // AsciiDoc document attributes (free-form // lines are not round-trip node ids)
    lines.push(":openehr-document: composition");

    // UID
    if (comp.uid) {
      const uidValue = typeof comp.uid === 'object' ? comp.uid.value : comp.uid;
      if (uidValue) lines.push(`:uid: ${uidValue}`);
    }

    // Template
    if (comp.archetype_details?.template_id) {
      const tmplValue = typeof comp.archetype_details.template_id === 'object'
        ? comp.archetype_details.template_id.value
        : comp.archetype_details.template_id;
      if (tmplValue) lines.push(`:template-id: ${tmplValue}`);
    }

    // Archetype ID
    if (comp.archetype_details?.archetype_id) {
      const archValue = typeof comp.archetype_details.archetype_id === 'object'
        ? comp.archetype_details.archetype_id.value
        : comp.archetype_details.archetype_id;
      if (archValue) lines.push(`:archetype-id: ${archValue}`);
    }
    if (comp.archetype_details?.rm_version) {
      lines.push(`:rm-version: ${comp.archetype_details.rm_version}`);
    }

    // Composer
    if (comp.composer) {
      const composerName = this.extractPartyName(comp.composer);
      if (composerName) lines.push(`:composer: ${composerName}`);
    }

    // Composition metadata
    if (this.config.includeCompositionMetadata) {
      if (comp.language) {
        lines.push(`:language: ${this.formatCodePhrase(comp.language)}`);
      }
      if (comp.territory) {
        lines.push(`:territory: ${this.formatCodePhrase(comp.territory)}`);
      }
      if (comp.category) {
        lines.push(`:category: ${this.formatDvCodedText(comp.category)}`);
      }
      if (this.activeEntryDefaults) {
        writeEntryDefaultsToAsciidocAttrs(this.activeEntryDefaults, lines);
      }
    }

    lines.push('');
  }

  // ─── EVENT CONTEXT ───────────────────────────────────────────────────

  private serializeEventContext(ctx: any, lines: string[]): void {
    if (this.config.style === "structural") {
      emitStructuralEventContextAsciidoc(ctx, (line) => lines.push(line));
      if (ctx.other_context) {
        this.serializeItemStructure(ctx.other_context, lines, 1);
      }
      lines.push("");
      return;
    }

    const parts: string[] = [];

    if (ctx.start_time) {
      parts.push(`*Date:* ${this.formatDateTime(ctx.start_time)}`);
    }
    if (ctx.end_time) {
      parts.push(`*End:* ${this.formatDateTime(ctx.end_time)}`);
    }
    if (ctx.location) {
      const loc = typeof ctx.location === 'string' ? ctx.location : ctx.location?.value;
      if (loc) parts.push(`*Location:* ${loc}`);
    }
    if (ctx.setting) {
      parts.push(`*Setting:* ${this.formatDvCodedText(ctx.setting)}`);
    }
    if (ctx.health_care_facility) {
      const facName = this.extractPartyName(ctx.health_care_facility);
      if (facName) parts.push(`*Facility:* ${facName}`);
    }

    if (parts.length > 0) {
      if (this.config.style === 'compact') {
        lines.push(parts.join(' | '));
      } else if (this.config.style === 'embedding') {
        for (const part of parts) {
          const plain = part.replace(/\*([^*]+)\*/g, "$1");
          const colon = plain.indexOf(":");
          if (colon > 0) {
            const key = plain.slice(0, colon).trim();
            const val = plain.slice(colon + 1).trim();
            lines.push(`${key}:: ${val}`);
          } else {
            lines.push(plain);
          }
        }
      } else {
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          lines.push(isLast ? part : part + " +");
        }
      }
      lines.push('');
    }

    // Other context (archetyped extension)
    if (ctx.other_context) {
      this.serializeItemStructure(ctx.other_context, lines, 2);
    }
  }

  // ─── CONTENT ITEMS (SECTION / ENTRY) ─────────────────────────────────

  private serializeContentItem(item: any, lines: string[], depth: number): void {
    const typeName = this.getTypeName(item);

    if (typeName === 'SECTION') {
      this.serializeSection(item, lines, depth);
    } else if (this.isEntryType(typeName)) {
      this.serializeEntry(item, typeName, lines, depth);
    } else {
      // Unknown content item - render generically
      this.serializeNode(item, typeName, lines, depth);
    }
  }

  private serializeSection(section: any, lines: string[], depth: number): void {
    const name = this.extractName(section);
    const headingTitle = this.formatLocatableHeadingTitle(section, name);
    const nodeId = this.formatBlockNodeIdComment(section);

    if (nodeId) this.pushBlockCommentLine(lines, nodeId);
    this.writeHeading(headingTitle, depth, lines);
    lines.push('');

    if (section.items && Array.isArray(section.items)) {
      for (const item of section.items) {
        this.serializeContentItem(item, lines, depth + 1);
      }
    }
  }

  private serializeEntry(entry: any, typeName: string | undefined, lines: string[], depth: number): void {
    const name = this.extractName(entry);
    const headingTitle = this.formatLocatableHeadingTitle(entry, name);
    const nodeId = this.formatBlockNodeIdComment(entry);
    const typeAnnotation = this.formatTypeAnnotation(typeName);

    if (nodeId) this.pushBlockCommentLine(lines, nodeId);
    const headingText = typeAnnotation ? `${headingTitle} ${typeAnnotation}` : headingTitle;
    this.writeHeading(headingText, depth, lines);
    lines.push('');

    this.emitEntryMetadataWhenDiffers(entry, lines);
    if (this.config.style === "structural") {
      emitStructuralEntryExtrasAsciidoc(entry, (line) => lines.push(line));
      if (entry.archetype_details) {
        const ad = entry.archetype_details as Record<string, unknown>;
        const adVis = renderRmValue(ad, this.rmRenderOptions(), 0);
        lines.push(
          `* _archetype_details:_ ${adVis}${formatSparseRmAsciidoc(ad, { _type: "ARCHETYPED", value: adVis })}`,
        );
      }
    }

    // Type-specific content
    switch (typeName) {
      case 'OBSERVATION':
        this.serializeObservation(entry, lines, depth);
        break;
      case 'EVALUATION':
        this.serializeEvaluation(entry, lines, depth);
        break;
      case 'INSTRUCTION':
        this.serializeInstruction(entry, lines, depth);
        break;
      case 'ACTION':
        this.serializeAction(entry, lines, depth);
        break;
      case 'ADMIN_ENTRY':
        this.serializeAdminEntry(entry, lines, depth);
        break;
      case 'GENERIC_ENTRY':
        this.serializeGenericEntry(entry, lines, depth);
        break;
      default:
        this.serializeGenericEntry(entry, lines, depth);
    }
  }

  // ─── ENTRY TYPE SERIALIZERS ──────────────────────────────────────────

  private serializeObservation(obs: any, lines: string[], depth: number): void {
    if (obs.data) {
      this.serializeHistory(obs.data, 'Data', lines, depth);
    }
    if (obs.state) {
      this.serializeHistory(obs.state, 'State', lines, depth);
    }
    if (obs.protocol) {
      this.serializeNamedItemStructure(obs.protocol, 'Protocol', lines, depth);
    }
  }

  private serializeEvaluation(eval_: any, lines: string[], depth: number): void {
    if (eval_.data) {
      this.serializeItemStructure(eval_.data, lines, depth);
    }
    if (eval_.protocol) {
      this.serializeNamedItemStructure(eval_.protocol, 'Protocol', lines, depth);
    }
  }

  private serializeInstruction(instr: any, lines: string[], depth: number): void {
    if (instr.narrative) {
      const narrative = this.formatDvText(instr.narrative);
      ensureBlankLineBeforeBlock(lines);
      lines.push(`[quote]`);
      lines.push(`____`);
      lines.push(narrative);
      lines.push(`____`);
      lines.push('');
    }
    if (instr.activities && Array.isArray(instr.activities)) {
      for (const activity of instr.activities) {
        this.serializeActivity(activity, lines, depth);
      }
    }
    if (instr.protocol) {
      this.serializeNamedItemStructure(instr.protocol, 'Protocol', lines, depth);
    }
  }

  private serializeAction(action: any, lines: string[], depth: number): void {
    if (action.time) {
      lines.push(`* _time:_ ${this.formatDateTime(action.time)}`);
    }
    if (action.ism_transition) {
      this.serializeIsmTransition(action.ism_transition, lines);
    }
    if (action.description) {
      this.serializeItemStructure(action.description, lines, depth);
    }
    if (action.protocol) {
      this.serializeNamedItemStructure(action.protocol, 'Protocol', lines, depth);
    }
  }

  private serializeAdminEntry(admin: any, lines: string[], depth: number): void {
    if (admin.data) {
      this.serializeItemStructure(admin.data, lines, depth);
    }
  }

  private serializeGenericEntry(entry: any, lines: string[], depth: number): void {
    if (entry.data) {
      this.serializeItemStructure(entry.data, lines, depth);
    }
  }

  private serializeActivity(activity: any, lines: string[], depth: number): void {
    const name = this.extractName(activity);
    if (name && name !== 'Activity') {
      ensureBlankLineBeforeBlock(lines);
      lines.push(`*${name}*`);
      lines.push('');
    }
    if (activity.description) {
      this.serializeItemStructure(activity.description, lines, depth);
    }
    if (activity.timing) {
      lines.push(`* _timing:_ ${this.formatDvParsable(activity.timing)}`);
    }
  }

  private serializeIsmTransition(ism: any, lines: string[]): void {
    const parts: string[] = [];
    if (ism.current_state) {
      parts.push(`state: ${this.formatDvCodedText(ism.current_state)}`);
    }
    if (ism.transition) {
      parts.push(`transition: ${this.formatDvCodedText(ism.transition)}`);
    }
    if (ism.careflow_step) {
      parts.push(`step: ${this.formatDvCodedText(ism.careflow_step)}`);
    }
    if (parts.length > 0) {
      lines.push(`* _ISM:_ ${parts.join(', ')}`);
    }
  }

  // ─── HISTORY ─────────────────────────────────────────────────────────

  private emitItemStructureMeta(itemStruct: any, lines: string[]): void {
    if (this.config.style !== "structural" || !itemStruct) return;
    if (Object.prototype.hasOwnProperty.call(itemStruct, "archetype_node_id")) {
      this.pushBlockCommentLine(lines, formatOeMetaAsciidoc(
        "item_node_id",
        String(itemStruct.archetype_node_id),
      ));
    }
    const n = this.extractName(itemStruct);
    if (n) {
      this.pushBlockCommentLine(lines, formatOeMetaAsciidoc("item_name", n));
    }
  }

  private emitEntryMetadataWhenDiffers(entry: any, lines: string[]): void {
    const defaults = this.activeEntryDefaults;
    if (!defaults) {
      if (!this.config.includeRedundantEntryMetadata) return;
      if (entry.language) lines.push(`* _language:_ ${this.formatCodePhrase(entry.language)}`);
      if (entry.encoding) lines.push(`* _encoding:_ ${this.formatCodePhrase(entry.encoding)}`);
      if (entry.subject) {
        lines.push(`* _subject:_ ${formatSubjectStructural(entry.subject, "asciidoc")}`);
      }
      return;
    }
    const diff = entryMetadataDiffersFromDefaults(entry, defaults);
    if (diff.language && entry.language) {
      lines.push(`* _language:_ ${this.formatCodePhrase(entry.language)}`);
    }
    if (diff.encoding && entry.encoding) {
      lines.push(`* _encoding:_ ${this.formatCodePhrase(entry.encoding)}`);
    }
    if (diff.subject && entry.subject) {
      lines.push(`* _subject:_ ${formatSubjectStructural(entry.subject, "asciidoc")}`);
    }
  }

  private serializeHistory(history: any, label: string, lines: string[], depth: number): void {
    this.emitItemStructureMeta(history, lines);
    const events = history.events && Array.isArray(history.events) ? history.events : [];
    const skipEventTitles = shouldSkipLossyEventTitles(this.config.style, events.length);

    if (history.origin && shouldEmitHistoryOrigin(history, this.config.style)) {
      if (this.config.style === 'embedding' || this.config.style === 'compact') {
        ensureBlankLineBeforeBlock(lines);
        lines.push(`origin:: ${this.formatDateTime(history.origin)}`);
      } else {
        lines.push(`* _origin:_ ${this.formatDateTime(history.origin)}`);
      }
    }

    for (const event of events) {
      this.serializeEvent(event, lines, depth, skipEventTitles);
    }

    if (history.summary) {
      this.serializeNamedItemStructure(history.summary, 'Summary', lines, depth);
    }
  }

  private serializeEvent(
    event: any,
    lines: string[],
    depth: number,
    skipTitle = false,
  ): void {
    const name = this.extractName(event);
    const nodeId = this.formatBlockNodeIdComment(event);
    const typeName = this.getTypeName(event);

    if (!skipTitle && name) {
      const typeAnn = (typeName === 'INTERVAL_EVENT') ? ' _(interval)_' : '';
      if (nodeId) this.pushBlockCommentLine(lines, nodeId);
      ensureBlankLineBeforeBlock(lines);
      if (this.config.style === 'embedding') {
        const title = this.formatLocatableHeadingTitle(event, name);
        lines.push(`.${title}${typeAnn}`);
      } else {
        const title = this.formatLocatableHeadingTitle(event, name);
        lines.push(`*${title}*${typeAnn}`);
      }
      lines.push('');
    }

    if (event.time && this.config.style !== 'compact') {
      if (this.config.style === 'embedding') {
        lines.push(`time:: ${this.formatDateTime(event.time)}`);
      } else {
        lines.push(`* _time:_ ${this.formatDateTime(event.time)}`);
      }
    }

    if (event.width && this.config.style !== 'compact') {
      if (this.config.style === 'embedding') {
        lines.push(`width:: ${this.formatDuration(event.width)}`);
      } else {
        lines.push(`* _width:_ ${this.formatDuration(event.width)}`);
      }
    }

    const prevCompactTime = this.compactTableEventTime;
    if (this.config.style === 'compact') {
      this.compactTableEventTime = this.formatEventTimeForCompactTable(event);
    }
    if (event.data) {
      this.serializeItemStructure(event.data, lines, depth);
    }

    if (event.state) {
      if (this.config.style === 'compact') {
        this.serializeItemStructure(event.state, lines, depth);
      } else {
        this.serializeNamedItemStructure(event.state, 'State', lines, depth);
      }
    }
    this.compactTableEventTime = prevCompactTime;
  }

  // ─── ITEM STRUCTURES ─────────────────────────────────────────────────

  private serializeNamedItemStructure(itemStruct: any, label: string, lines: string[], depth: number): void {
    if (this.config.style === 'compact') {
      this.serializeItemStructure(itemStruct, lines, depth);
      return;
    }
    if (this.config.style === 'structural') {
      const field = label.toLowerCase().replace(/\s+/g, "_");
      ensureBlankLineBeforeBlock(lines);
      lines.push(`* _${field}:_`);
      lines.push("");
      this.serializeItemStructure(itemStruct, lines, depth + 1);
      return;
    }
    ensureBlankLineBeforeBlock(lines);
    lines.push(`*${label}:*`);
    lines.push("");
    this.serializeItemStructure(itemStruct, lines, depth);
  }

  private serializeItemStructure(itemStruct: any, lines: string[], _depth: number): void {
    if (!itemStruct) return;
    // Heading depth is not labelled-list depth. Under a section, entry, or
    // block title the list starts again at `::`.
    const depth = this.config.style === "embedding" ? 0 : _depth;

    const typeName = this.getTypeName(itemStruct);

    if (typeName === 'ITEM_TREE' || typeName === 'ITEM_LIST' || typeName === 'ITEM_TABLE') {
      this.emitItemStructureMeta(itemStruct, lines);
      if (this.config.style === 'structural' && typeName !== 'ITEM_TREE') {
        this.pushBlockCommentLine(lines, formatOeMetaAsciidoc("structure", typeName));
      }
      if (itemStruct.items && Array.isArray(itemStruct.items)) {
        if (this.config.dataValueRendering === 'table' && this.canRenderAsTable(itemStruct.items)) {
          this.renderItemsAsTable(itemStruct.items, lines);
        } else {
          this.serializeItems(itemStruct.items, lines, depth);
        }
      }
    } else if (typeName === 'ITEM_SINGLE') {
      if (itemStruct.item) {
        this.serializeItem(itemStruct.item, lines, depth);
      }
    } else {
      if (itemStruct.items && Array.isArray(itemStruct.items)) {
        this.serializeItems(itemStruct.items, lines, depth);
      }
    }
  }

  private serializeItems(items: any[], lines: string[], nestLevel: number): void {
    for (const item of items) {
      this.serializeItem(item, lines, nestLevel);
    }
  }

  private serializeItem(item: any, lines: string[], nestLevel: number): void {
    const typeName = this.getTypeName(item);

    if (typeName === 'CLUSTER') {
      this.serializeCluster(item, lines, nestLevel);
    } else if (typeName === 'ELEMENT') {
      this.serializeElement(item, lines, nestLevel);
    } else {
      const name = this.extractName(item);
      const indent = this.getListPrefix(nestLevel);
      lines.push(`${indent} ${name || '(unknown)'}`);
    }
  }

  private useDefinitionListBody(): boolean {
    return this.config.style === "embedding" ||
      (this.config.style === "compact" &&
        this.config.dataValueRendering !== "table");
  }

  private rmRenderOptions(): DocumentRmRenderOptions {
    const code = this.config.codeRendering ?? "hidden";
    return {
      lossy: this.config.style !== "structural",
      useTerseFormat: this.config.useTerseFormat,
      codeRendering: code === "macro" ? "inline_bracket" : code,
      includeTypeAnnotations: !!this.config.includeTypeAnnotations,
    };
  }

  private serializeCluster(cluster: any, lines: string[], nestLevel: number): void {
    const name = this.extractName(cluster);
    if (this.config.style === "structural") {
      const indent = this.getListPrefix(nestLevel);
      const recovered: Record<string, unknown> = {
        _type: "CLUSTER",
        name: typeof name === "string" ? { _type: "DV_TEXT", value: name } : name,
      };
      const { items, ...clusterHead } = cluster as Record<string, unknown>;
      const patchTarget: Record<string, unknown> = { _type: "CLUSTER", ...clusterHead };
      if (Array.isArray(items)) {
        if (items.length === 0) {
          patchTarget.items = [];
        } else if (items.some((child) => !this.extractName(child))) {
          patchTarget.items = items;
        }
      }
      const tail = formatSparseRmAsciidoc(patchTarget, recovered);
      const nodeId = tail ? "" : this.formatNodeIdInline(cluster);
      lines.push(`${indent} *${name}*${tail}${nodeId}`);
      if (cluster.items && Array.isArray(cluster.items)) {
        this.serializeItems(cluster.items, lines, nestLevel + 1);
      }
      return;
    }
    if (this.useDefinitionListBody()) {
      ensureBlankLineBeforeBlock(lines);
      lines.push(`.${name}`);
      lines.push("");
      if (cluster.items && Array.isArray(cluster.items)) {
        this.serializeItems(cluster.items, lines, 0);
      }
      return;
    }
    const indent = this.getListPrefix(nestLevel);
    const title = this.formatLocatableHeadingTitle(cluster, name);
    if (
      this.config.style !== "structural" &&
      this.config.useOpenehrUrnLinks &&
      this.isArchetypeId(cluster?.archetype_node_id)
    ) {
      lines.push(`${indent} ${title}`);
    } else {
      const nodeId = this.formatNodeIdInline(cluster);
      lines.push(`${indent} *${name}*${nodeId}`);
    }

    if (cluster.items && Array.isArray(cluster.items)) {
      this.serializeItems(cluster.items, lines, nestLevel + 1);
    }
  }

  private serializeElement(element: any, lines: string[], nestLevel: number): void {
    const name = this.extractName(element);
    const nodeId = this.formatNodeIdInline(element);
    const indent = this.getListPrefix(nestLevel);

    if (element.value === undefined || element.value === null) {
      if (this.config.includeNullFlavour && element.null_flavour) {
        const nullStr = this.formatDvCodedText(element.null_flavour);
        lines.push(`${indent} ${name}: _${nullStr}_${nodeId}`);
      } else if (this.config.includeEmptyFields) {
        lines.push(`${indent} ${name}: —${nodeId}`);
      }
      return;
    }

    const valueStr = this.formatDataValue(element.value);
    const dvAnn = this.formatSparseValueAnnotation(element.value, valueStr);
    const elRmAnn = this.config.style === "structural"
      ? formatSparseRmAsciidoc(element as Record<string, unknown>, {
        _type: "ELEMENT",
        name: { _type: "DV_TEXT", value: name },
        value: typeof valueStr === "string"
          ? parseDataValueDisplay(valueStr) ?? { _type: "DV_TEXT", value: valueStr }
          : element.value,
      })
      : "";

    if (this.useDefinitionListBody()) {
      ensureBlankLineBeforeBlock(lines);
      lines.push(asciidocDlistTermLine(nestLevel, name, `${valueStr}${nodeId}${dvAnn}`));
    } else if (this.config.style === 'compact' || this.config.dataValueRendering === 'inline') {
      lines.push(`${indent} ${name}: ${valueStr}${nodeId}${dvAnn}${elRmAnn}`);
    } else {
      lines.push(`${indent} *${name}:* ${valueStr}${nodeId}${dvAnn}${elRmAnn}`);
    }
  }

  private formatSparseValueAnnotation(dv: unknown, display: string): string {
    if (this.config.style !== 'structural' || !dv || typeof dv !== 'object') return '';
    if (!needsOeValueAnnotation(dv as Record<string, unknown>, display)) return '';
    return formatOeValueAnnotationAsciidoc(dv as Record<string, unknown>);
  }

  // ─── TABLE RENDERING ─────────────────────────────────────────────────

  private canRenderAsTable(items: any[]): boolean {
    return items.every(item => {
      const typeName = this.getTypeName(item);
      return typeName === 'ELEMENT';
    });
  }

  private formatEventTimeForCompactTable(event: any): string {
    if (!event) return "";
    const time = event.time ? this.formatDateTime(event.time) : "";
    if (!time) return "";
    const typeName = this.getTypeName(event);
    if (typeName === "INTERVAL_EVENT" && event.width) {
      const width = this.formatDuration(event.width);
      const math = event.math_function
        ? `; ${this.formatDvCodedText(event.math_function)}`
        : "";
      return `${time} (+ ${width}${math})`;
    }
    return time;
  }

  private renderItemsAsTable(items: any[], lines: string[]): void {
    ensureBlankLineBeforeBlock(lines);
    const compactWithTime = this.config.style === "compact";
    const hasCode = !compactWithTime && this.config.codeRendering !== 'hidden' &&
      items.some(item => item.value && this.getDataValueCode(item.value));

    if (!compactWithTime) {
      if (hasCode) {
        lines.push('[cols="2,2,1", options="header"]');
      } else {
        lines.push('[cols="1,2", options="header"]');
      }
    }
    lines.push('|===');

  if (compactWithTime) {
      lines.push('| Item | Value | Time');
    } else if (hasCode) {
      lines.push('| Item | Value | Code');
    } else {
      lines.push('| Item | Value');
    }
    lines.push('');

    const timeCol = this.compactTableEventTime || "—";
    for (const item of items) {
      const name = this.extractName(item);
      const valueStr = item.value ? this.formatDataValueForTable(item.value) : '—';
      if (compactWithTime) {
        lines.push(`| ${name} | ${valueStr} | ${timeCol}`);
      } else if (hasCode) {
        const code = this.getDataValueCode(item.value) || '';
        lines.push(`| ${name} | ${valueStr} | ${code}`);
      } else {
        lines.push(`| ${name} | ${valueStr}`);
      }
    }

    lines.push('|===');
    lines.push('');
  }

  // ─── DATA VALUE FORMATTING ───────────────────────────────────────────

  private formatDataValue(dv: any): string {
    if (!dv) return '—';
    const typeName = this.getTypeName(dv);
    if (typeName === "DV_CODED_TEXT") {
      return this.formatDvCodedTextWithCode(dv);
    }
    if (
      typeName === "DV_DATE_TIME" || typeName === "DV_DATE" || typeName === "DV_TIME" ||
      typeName === "DV_DURATION"
    ) {
      return this.formatDateTime(dv);
    }
    return renderRmValue(dv, this.rmRenderOptions(), 0);
  }

  private formatDataValueForTable(dv: any): string {
    if (!dv) return '—';
    const typeName = this.getTypeName(dv);

    switch (typeName) {
      case 'DV_CODED_TEXT':
        return dv.value || '';
      case 'DV_QUANTITY':
        return `${dv.magnitude ?? ''} ${dv.units ?? ''}`.trim();
      default:
        return this.formatDataValue(dv);
    }
  }

  private getDataValueCode(dv: any): string | null {
    if (!dv) return null;
    const typeName = this.getTypeName(dv);

    if (typeName === 'DV_CODED_TEXT' && dv.defining_code) {
      return this.formatCodeReference(dv.defining_code);
    }
    if (typeName === 'DV_ORDINAL' && dv.symbol?.defining_code) {
      return this.formatCodeReference(dv.symbol.defining_code);
    }
    return null;
  }

  // ─── INDIVIDUAL DATA VALUE FORMATTERS ────────────────────────────────

  private formatDvText(dv: any): string {
    return dv.value || '';
  }

  private formatDvCodedText(ct: any): string {
    if (!ct) return '';
    if (this.config.useTerseFormat && ct.defining_code) {
      return toTerseDvCodedText(ct);
    }
    return ct.value || '';
  }

  private formatDvCodedTextWithCode(ct: any): string {
    if (!ct) return '';
    const text = ct.value || '';

    if (ct.defining_code && this.config.codeRendering !== 'hidden') {
      const code = this.formatCodeReference(ct.defining_code);
      switch (this.config.codeRendering) {
        case 'macro':
          return `${text} term:${ct.defining_code.terminology_id?.value || ''}[${ct.defining_code.code_string || ''}]`;
        case 'inline_bracket':
          return `${text} ${code}`;
        case 'footnote':
          return `${text} footnote:[${code}]`;
        default:
          return text;
      }
    }
    return text;
  }

  private formatDvQuantity(dv: any): string {
    const mag = dv.magnitude ?? '';
    const units = dv.units ?? '';
    return `${mag} ${units}`.trim();
  }

  private formatDvCount(dv: any): string {
    return String(dv.magnitude ?? '');
  }

  private formatDateTime(dv: any): string {
    if (!dv) return '';
    if (typeof dv === 'string') return dv;
    return dv.value || '';
  }

  private formatDvDate(dv: any): string {
    if (!dv) return '';
    return dv.value || '';
  }

  private formatDvTime(dv: any): string {
    if (!dv) return '';
    return dv.value || '';
  }

  private formatDuration(dv: any): string {
    if (!dv) return '';
    return dv.value || '';
  }

  private formatDvBoolean(dv: any): string {
    if (dv.value === true) return 'true';
    if (dv.value === false) return 'false';
    return '';
  }

  private formatDvProportion(dv: any): string {
    const num = dv.numerator ?? '';
    const den = dv.denominator ?? '';
    // Proportion types: 0=ratio, 1=unitary, 2=percent, 3=fraction, 4=integer_fraction
    switch (dv.type) {
      case 0: // ratio
        return `${num}:${den}`;
      case 1: // unitary (denominator is 1)
        return String(num);
      case 2: // percent
        return `${num}%`;
      case 3: // fraction
        return `${num}/${den}`;
      case 4: // integer_fraction
        return `${num}/${den}`;
      default:
        return den ? `${num}/${den}` : String(num);
    }
  }

  private formatDvOrdinal(dv: any): string {
    const ordinalValue = dv.value ?? '';
    const symbol = dv.symbol ? this.formatDvCodedText(dv.symbol) : '';
    if (symbol) return `${ordinalValue} - ${symbol}`;
    return String(ordinalValue);
  }

  private formatDvIdentifier(dv: any): string {
    const parts: string[] = [];
    if (dv.issuer) parts.push(dv.issuer);
    if (dv.assigner) parts.push(dv.assigner);
    if (dv.id) parts.push(dv.id);
    if (dv.type && this.config.style !== 'compact') parts.push(`(${dv.type})`);
    return parts.join(': ') || '';
  }

  private formatDvUri(dv: any): string {
    return dv.value || '';
  }

  private formatDvParsable(dv: any): string {
    if (!dv) return '';
    const formalism = dv.formalism || '';
    const value = dv.value || '';
    if (this.config.style === 'compact') return value;
    return formalism ? `\`${value}\` (${formalism})` : `\`${value}\``;
  }

  private formatDvMultimedia(dv: any): string {
    const mediaType = dv.media_type?.code_string || 'unknown';
    const size = dv.size || '';
    const altText = dv.alternate_text || '';
    const uri = dv.uri?.value || '';
    const parts = [`multimedia: ${mediaType}`];
    if (size) parts.push(`${size} bytes`);
    if (altText) parts.push(`"${altText}"`);
    if (uri) parts.push(uri);
    return `[${parts.join(', ')}]`;
  }

  private formatDvState(dv: any): string {
    if (!dv) return '';
    const stateValue = dv.value ? this.formatDvCodedText(dv.value) : '';
    const terminal = dv.is_terminal === true ? ' (terminal)' : '';
    return `${stateValue}${terminal}`;
  }

  private formatDvParagraph(dv: any): string {
    if (!dv || !dv.items || !Array.isArray(dv.items)) return '';
    return dv.items
      .map((item: any) => this.formatDvText(item))
      .filter((t: string) => t)
      .join(' +\n');
  }

  private formatDvInterval(dv: any): string {
    const lower = dv.lower ? this.formatDataValue(dv.lower) : '*';
    const upper = dv.upper ? this.formatDataValue(dv.upper) : '*';
    const lowerInc = dv.lower_included !== false ? '[' : '(';
    const upperInc = dv.upper_included !== false ? ']' : ')';
    return `${lowerInc}${lower}..${upper}${upperInc}`;
  }

  private formatDvScale(dv: any): string {
    const scaleValue = dv.value ?? '';
    const symbol = dv.symbol ? this.formatDvCodedText(dv.symbol) : '';
    if (symbol) return `${scaleValue} - ${symbol}`;
    return String(scaleValue);
  }

  private formatDvTimeSpecification(dv: any): string {
    if (!dv) return '';
    // DV_TIME_SPECIFICATION subtypes wrap a DV_PARSABLE
    if (dv.value) {
      return this.formatDvParsable(dv.value);
    }
    return '';
  }

  private formatCodePhrase(cp: any): string {
    if (!cp) return '';
    if (this.config.useTerseFormat) {
      return toTerseCodePhrase(cp);
    }
    const termId = cp.terminology_id?.value || '';
    const code = cp.code_string || '';
    return `${termId}::${code}`;
  }

  private formatCodeReference(cp: any): string {
    if (!cp) return '';
    const termId = cp.terminology_id?.value || '';
    const code = cp.code_string || '';

    switch (this.config.codeRendering) {
      case 'macro':
        return `term:${termId}[${code}]`;
      case 'inline_bracket':
        return `[${termId}::${code}]`;
      case 'footnote':
        return `${termId}::${code}`;
      default:
        return '';
    }
  }

  // ─── GENERIC NODE SERIALIZATION ──────────────────────────────────────

  private serializeNode(obj: any, typeName: string | undefined, lines: string[], depth: number): void {
    const name = this.extractName(obj);
    const title = this.formatLocatableHeadingTitle(obj, name);
    const nodeId = this.formatBlockNodeIdComment(obj);

    if (name) {
      if (nodeId) this.pushBlockCommentLine(lines, nodeId);
      this.writeHeading(title, depth, lines);
      lines.push('');
    }

    if (obj.items && Array.isArray(obj.items)) {
      this.serializeItems(obj.items, lines, 0);
    } else if (obj.value !== undefined && typeof obj.value !== 'object') {
      lines.push(`${obj.value}`);
      lines.push('');
    }
  }

  // ─── UTILITIES ───────────────────────────────────────────────────────

  private getTypeName(obj: any): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    if (obj._type) return obj._type;
    return TypeRegistry.getTypeNameFromInstance(obj);
  }

  private extractName(obj: any): string {
    if (!obj) return '';
    if (!obj.name) return '';
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.name === 'object' && obj.name.value) return obj.name.value;
    return '';
  }

  private extractPartyName(party: any): string {
    if (!party) return '';
    if (party.name) return party.name;
    if (party.external_ref?.id?.value) return party.external_ref.id.value;
    return '';
  }

  private formatLocatableHeadingTitle(obj: any, fallbackName: string): string {
    const nodeId = obj?.archetype_node_id;
    const name = fallbackName || this.extractName(obj);
    if (
      this.config.style !== "structural" &&
      this.config.useOpenehrUrnLinks &&
      nodeId &&
      this.isArchetypeId(nodeId)
    ) {
      return `link:${this.toOpenehrUrn(nodeId)}[${name}]`;
    }
    return name;
  }

  /** Block-level node id comments (omit when heading carries an openEHR URN link). */
  private formatBlockNodeIdComment(obj: any): string {
    const nodeId = obj?.archetype_node_id;
    if (
      this.config.style !== "structural" &&
      this.config.useOpenehrUrnLinks &&
      nodeId &&
      this.isArchetypeId(nodeId)
    ) {
      return "";
    }
    return this.formatNodeIdComment(obj);
  }

  /**
   * Format archetype_node_id as an AsciiDoc comment line
   */
  private formatNodeIdComment(obj: any): string {
    if (!this.config.includeArchetypeNodeIds) return '';
    const nodeId = obj?.archetype_node_id;
    if (!nodeId) return '';

    switch (this.config.nodeIdRendering) {
      case 'comment':
        if (this.config.useOpenehrUrnLinks && this.isArchetypeId(nodeId)) {
          return `// ${this.toOpenehrUrn(nodeId)}`;
        }
        return `// ${nodeId}`;
      case 'attribute':
        return `:node-id: ${nodeId}`;
      case 'inline_comment':
        // Will be appended inline - handled separately
        return '';
      default:
        return '';
    }
  }

  /**
   * Format archetype_node_id for inline use (within list items)
   */
  private formatNodeIdInline(obj: any): string {
    if (!this.config.includeArchetypeNodeIds) return '';
    const nodeId = obj?.archetype_node_id;
    if (!nodeId) return '';

    switch (this.config.nodeIdRendering) {
      case 'inline_comment':
        return ` // ${nodeId}`;
      case 'comment':
        // For inline context in structural mode, use a trailing comment marker
        if (this.config.useOpenehrUrnLinks && this.isArchetypeId(nodeId)) {
          return ` // ${this.toOpenehrUrn(nodeId)}`;
        }
        return ` // ${nodeId}`;
      default:
        return '';
    }
  }

  private formatTypeAnnotation(typeName: string | undefined): string {
    if (!this.config.includeTypeAnnotations || !typeName) return '';
    if (this.config.style === 'embedding' || this.config.style === 'compact') return '';
    return `_[${typeName}]_`;
  }

  private writeHeading(text: string, depth: number, lines: string[]): void {
    ensureBlankLineBeforeBlock(lines);
    if (depth <= this.config.maxHeadingDepth) {
      const equals = '='.repeat(depth);
      lines.push(`${equals} ${text}`);
    } else {
      // Beyond max heading depth, use bold
      lines.push(`*${text}*`);
    }
  }

  private pushBlockCommentLine(lines: string[], commentLine: string): void {
    if (!commentLine) return;
    ensureBlankLineBeforeBlock(lines);
    lines.push(commentLine);
  }

  private getListPrefix(nestLevel: number): string {
    // AsciiDoc uses * for list items, ** for nested, *** for deeper
    return '*'.repeat(nestLevel + 1);
  }

  private isEntryType(typeName: string | undefined): boolean {
    if (!typeName) return false;
    return ['OBSERVATION', 'EVALUATION', 'INSTRUCTION', 'ACTION', 'ADMIN_ENTRY', 'GENERIC_ENTRY'].includes(typeName);
  }

  private isItemStructureType(typeName: string | undefined): boolean {
    if (!typeName) return false;
    return ['ITEM_TREE', 'ITEM_LIST', 'ITEM_TABLE', 'ITEM_SINGLE'].includes(typeName);
  }

  /**
   * Check if a node ID looks like a full archetype ID (vs a local at-code)
   */
  private isArchetypeId(nodeId: string | undefined): boolean {
    return !!nodeId && nodeId.startsWith('openEHR-');
  }

  /**
   * Convert an archetype ID to an openEHR URN
   * e.g., openEHR-EHR-OBSERVATION.blood_pressure.v2 
   *   → urn:openehr:aom:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2
   */
  private toOpenehrUrn(archetypeId: string): string {
    return toOpenehrAomArchetypeUrn(archetypeId);
  }
}

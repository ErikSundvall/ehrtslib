/**
 * Markdown Serializer for openEHR RM Objects
 * 
 * Converts openEHR Reference Model instances to token-efficient Markdown
 * representations suitable for LLM context windows.
 * 
 * Three variants are supported:
 * 1. **Clinical** - Human-readable clinical documents (lossy)
 * 2. **Structural** - Lossless format (round-trippable with template)
 * 3. **Compact** - Maximum token efficiency (lossy)
 * 
 * The structural mapping is:
 * - COMPOSITION → Document (H1 = composition name)
 * - SECTION → Headings (H2, H3...)
 * - ENTRY types (OBSERVATION, EVALUATION, etc.) → Headings or bold items
 * - CLUSTER → Nested lists or sub-headings
 * - ELEMENT → List items with values
 * - DATA_VALUE subtypes → Inline formatted values
 */

import { TypeRegistry } from '../common/type_registry.ts';
import { TypeInferenceEngine } from '../common/type_inference.ts';
import { SerializationError } from '../common/errors.ts';
import {
  toTerseCodePhrase,
  toTerseDvCodedText,
} from '../../terse_format.ts';
import {
  MarkdownSerializationConfig,
  DEFAULT_MARKDOWN_SERIALIZATION_CONFIG,
} from './markdown_config.ts';

/**
 * Markdown Serializer for openEHR RM objects
 * 
 * @example
 * ```typescript
 * import { MarkdownSerializer } from './enhanced/serialization/markdown/mod.ts';
 * import { CLINICAL_MARKDOWN_CONFIG } from './enhanced/serialization/markdown/mod.ts';
 * 
 * const serializer = new MarkdownSerializer(CLINICAL_MARKDOWN_CONFIG);
 * const markdown = serializer.serialize(composition);
 * ```
 */
export class MarkdownSerializer {
  private config: Required<MarkdownSerializationConfig>;

  constructor(config: MarkdownSerializationConfig = {}) {
    this.config = { ...DEFAULT_MARKDOWN_SERIALIZATION_CONFIG, ...config };
  }

  /**
   * Serialize an RM object to Markdown string
   * 
   * @param obj - The openEHR RM object to serialize
   * @returns Markdown string
   * @throws SerializationError if serialization fails
   */
  serialize(obj: any): string {
    try {
      const lines: string[] = [];
      const typeName = this.getTypeName(obj);

      if (typeName === 'COMPOSITION') {
        this.serializeComposition(obj, lines);
      } else if (typeName === 'SECTION') {
        this.serializeSection(obj, lines, 1);
      } else if (this.isEntryType(typeName)) {
        this.serializeEntry(obj, typeName, lines, 1);
      } else if (this.isItemStructureType(typeName)) {
        this.serializeItemStructure(obj, lines, 1);
      } else {
        // Non-composition objects: serialize as standalone
        this.serializeNode(obj, typeName, lines, 1);
      }

      return lines.join('\n') + '\n';
    } catch (error) {
      throw new SerializationError(
        `Failed to serialize to Markdown: ${error instanceof Error ? error.message : String(error)}`,
        obj,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Serialize with a specific configuration (one-time use)
   */
  static serializeWith(obj: any, config: MarkdownSerializationConfig): string {
    const serializer = new MarkdownSerializer(config);
    return serializer.serialize(obj);
  }

  // ─── COMPOSITION ─────────────────────────────────────────────────────

  private serializeComposition(comp: any, lines: string[]): void {
    // YAML Frontmatter
    if (this.config.includeFrontmatter) {
      this.writeFrontmatter(comp, lines);
    }

    // H1: Composition name
    const name = this.extractName(comp);
    const nodeIdAnnotation = this.formatNodeIdAnnotation(comp);
    lines.push(`# ${name}${nodeIdAnnotation}`);
    lines.push('');

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

  private writeFrontmatter(comp: any, lines: string[]): void {
    lines.push('---');

    // UID
    if (comp.uid) {
      const uidValue = typeof comp.uid === 'object' ? comp.uid.value : comp.uid;
      if (uidValue) lines.push(`uid: "${uidValue}"`);
    }

    // Template
    if (comp.archetype_details?.template_id) {
      const tmplValue = typeof comp.archetype_details.template_id === 'object'
        ? comp.archetype_details.template_id.value
        : comp.archetype_details.template_id;
      if (tmplValue) lines.push(`template_id: "${tmplValue}"`);
    }

    // Archetype ID
    if (comp.archetype_details?.archetype_id) {
      const archValue = typeof comp.archetype_details.archetype_id === 'object'
        ? comp.archetype_details.archetype_id.value
        : comp.archetype_details.archetype_id;
      if (archValue) lines.push(`archetype_id: "${archValue}"`);
    }

    // Composer
    if (comp.composer) {
      const composerName = this.extractPartyName(comp.composer);
      if (composerName) lines.push(`composer: "${composerName}"`);
    }

    // Composition metadata
    if (this.config.includeCompositionMetadata) {
      if (comp.language) {
        lines.push(`language: "${this.formatCodePhrase(comp.language)}"`);
      }
      if (comp.territory) {
        lines.push(`territory: "${this.formatCodePhrase(comp.territory)}"`);
      }
      if (comp.category) {
        lines.push(`category: "${this.formatDvCodedText(comp.category)}"`);
      }
    }

    lines.push('---');
    lines.push('');
  }

  // ─── EVENT CONTEXT ───────────────────────────────────────────────────

  private serializeEventContext(ctx: any, lines: string[]): void {
    const parts: string[] = [];

    if (ctx.start_time) {
      parts.push(`**Date:** ${this.formatDateTime(ctx.start_time)}`);
    }
    if (ctx.end_time) {
      parts.push(`**End:** ${this.formatDateTime(ctx.end_time)}`);
    }
    if (ctx.location) {
      const loc = typeof ctx.location === 'string' ? ctx.location : ctx.location?.value;
      if (loc) parts.push(`**Location:** ${loc}`);
    }
    if (ctx.setting) {
      parts.push(`**Setting:** ${this.formatDvCodedText(ctx.setting)}`);
    }
    if (ctx.health_care_facility) {
      const facName = this.extractPartyName(ctx.health_care_facility);
      if (facName) parts.push(`**Facility:** ${facName}`);
    }

    if (parts.length > 0) {
      if (this.config.style === 'compact') {
        lines.push(parts.join(' | '));
      } else {
        for (const part of parts) {
          lines.push(part + '  ');
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
    const nodeId = this.formatNodeIdAnnotation(section);

    this.writeHeading(name + nodeId, depth, lines);
    lines.push('');

    if (section.items && Array.isArray(section.items)) {
      for (const item of section.items) {
        this.serializeContentItem(item, lines, depth + 1);
      }
    }
  }

  private serializeEntry(entry: any, typeName: string | undefined, lines: string[], depth: number): void {
    const name = this.extractName(entry);
    const nodeId = this.formatNodeIdAnnotation(entry);
    const typeAnnotation = this.formatTypeAnnotation(typeName);

    this.writeHeading(name + typeAnnotation + nodeId, depth, lines);
    lines.push('');

    // Entry-level metadata (if not redundant)
    if (this.config.includeRedundantEntryMetadata) {
      if (entry.language) {
        lines.push(`- _language:_ ${this.formatCodePhrase(entry.language)}`);
      }
      if (entry.encoding) {
        lines.push(`- _encoding:_ ${this.formatCodePhrase(entry.encoding)}`);
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
    // data (History)
    if (obs.data) {
      this.serializeHistory(obs.data, 'Data', lines, depth);
    }
    // state (History)
    if (obs.state) {
      this.serializeHistory(obs.state, 'State', lines, depth);
    }
    // protocol
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
      lines.push(`> ${narrative}`);
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
      lines.push(`- _time:_ ${this.formatDateTime(action.time)}`);
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
      lines.push(`**${name}**`);
      lines.push('');
    }
    if (activity.description) {
      this.serializeItemStructure(activity.description, lines, depth);
    }
    if (activity.timing) {
      lines.push(`- _timing:_ ${this.formatDvParsable(activity.timing)}`);
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
      lines.push(`- _ISM:_ ${parts.join(', ')}`);
    }
  }

  // ─── HISTORY ─────────────────────────────────────────────────────────

  private serializeHistory(history: any, label: string, lines: string[], depth: number): void {
    // History origin
    if (history.origin && this.config.style !== 'compact') {
      lines.push(`- _origin:_ ${this.formatDateTime(history.origin)}`);
    }

    // Events
    if (history.events && Array.isArray(history.events)) {
      for (const event of history.events) {
        this.serializeEvent(event, lines, depth);
      }
    }

    // Summary
    if (history.summary) {
      this.serializeNamedItemStructure(history.summary, 'Summary', lines, depth);
    }
  }

  private serializeEvent(event: any, lines: string[], depth: number): void {
    const name = this.extractName(event);
    const nodeId = this.formatNodeIdAnnotation(event);
    const typeName = this.getTypeName(event);

    // For single "Any event" we skip the heading in compact mode
    if (this.config.style !== 'compact' || name !== 'Any event') {
      if (name) {
        const typeAnn = (typeName === 'INTERVAL_EVENT') ? ' _(interval)_' : '';
        lines.push(`**${name}**${typeAnn}${nodeId}`);
        lines.push('');
      }
    }

    // Time
    if (event.time && this.config.style !== 'compact') {
      lines.push(`- _time:_ ${this.formatDateTime(event.time)}`);
    }

    // Width (for INTERVAL_EVENT)
    if (event.width) {
      lines.push(`- _width:_ ${this.formatDuration(event.width)}`);
    }

    // Data
    if (event.data) {
      this.serializeItemStructure(event.data, lines, depth);
    }

    // State
    if (event.state) {
      this.serializeNamedItemStructure(event.state, 'State', lines, depth);
    }
  }

  // ─── ITEM STRUCTURES ─────────────────────────────────────────────────

  private serializeNamedItemStructure(itemStruct: any, label: string, lines: string[], depth: number): void {
    if (this.config.style === 'compact') {
      // Skip labels in compact mode
      this.serializeItemStructure(itemStruct, lines, depth);
    } else {
      lines.push(`**${label}:**`);
      lines.push('');
      this.serializeItemStructure(itemStruct, lines, depth);
    }
  }

  private serializeItemStructure(itemStruct: any, lines: string[], _depth: number): void {
    if (!itemStruct) return;

    const typeName = this.getTypeName(itemStruct);

    if (typeName === 'ITEM_TREE' || typeName === 'ITEM_LIST' || typeName === 'ITEM_TABLE') {
      if (itemStruct.items && Array.isArray(itemStruct.items)) {
        // In clinical mode with table rendering, try to render as table
        if (this.config.dataValueRendering === 'table' && this.canRenderAsTable(itemStruct.items)) {
          this.renderItemsAsTable(itemStruct.items, lines);
        } else {
          this.serializeItems(itemStruct.items, lines, 0);
        }
      }
    } else if (typeName === 'ITEM_SINGLE') {
      if (itemStruct.item) {
        this.serializeItem(itemStruct.item, lines, 0);
      }
    } else {
      // Unknown structure - try items
      if (itemStruct.items && Array.isArray(itemStruct.items)) {
        this.serializeItems(itemStruct.items, lines, 0);
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
      // Unknown item type
      const name = this.extractName(item);
      const indent = this.getIndent(nestLevel);
      lines.push(`${indent}- ${name || '(unknown)'}`);
    }
  }

  private serializeCluster(cluster: any, lines: string[], nestLevel: number): void {
    const name = this.extractName(cluster);
    const nodeId = this.formatNodeIdAnnotation(cluster);
    const indent = this.getIndent(nestLevel);

    lines.push(`${indent}- **${name}**${nodeId}`);

    if (cluster.items && Array.isArray(cluster.items)) {
      this.serializeItems(cluster.items, lines, nestLevel + 1);
    }
  }

  private serializeElement(element: any, lines: string[], nestLevel: number): void {
    const name = this.extractName(element);
    const nodeId = this.formatNodeIdAnnotation(element);
    const indent = this.getIndent(nestLevel);

    if (element.value === undefined || element.value === null) {
      // Null element
      if (this.config.includeNullFlavour && element.null_flavour) {
        const nullStr = this.formatDvCodedText(element.null_flavour);
        lines.push(`${indent}- ${name}: _${nullStr}_${nodeId}`);
      } else if (this.config.includeEmptyFields) {
        lines.push(`${indent}- ${name}: —${nodeId}`);
      }
      return;
    }

    const valueStr = this.formatDataValue(element.value);

    if (this.config.style === 'compact' || this.config.dataValueRendering === 'inline') {
      lines.push(`${indent}- ${name}: ${valueStr}${nodeId}`);
    } else {
      lines.push(`${indent}- **${name}:** ${valueStr}${nodeId}`);
    }
  }

  // ─── TABLE RENDERING ─────────────────────────────────────────────────

  private canRenderAsTable(items: any[]): boolean {
    // Can render as table if all items are ELEMENTs (no nested CLUSTERs)
    return items.every(item => {
      const typeName = this.getTypeName(item);
      return typeName === 'ELEMENT';
    });
  }

  private renderItemsAsTable(items: any[], lines: string[]): void {
    // Determine if we need a code column
    const hasCode = this.config.codeRendering !== 'hidden' && items.some(item => {
      return item.value && this.getDataValueCode(item.value);
    });

    // Header
    if (hasCode) {
      lines.push('| Item | Value | Code |');
      lines.push('| :--- | :--- | :--- |');
    } else {
      lines.push('| Item | Value |');
      lines.push('| :--- | :--- |');
    }

    // Rows
    for (const item of items) {
      const name = this.extractName(item);
      const valueStr = item.value ? this.formatDataValueForTable(item.value) : '—';
      const code = hasCode ? this.getDataValueCode(item.value) || '' : '';

      if (hasCode) {
        lines.push(`| ${name} | ${valueStr} | ${code} |`);
      } else {
        lines.push(`| ${name} | ${valueStr} |`);
      }
    }
    lines.push('');
  }

  // ─── DATA VALUE FORMATTING ───────────────────────────────────────────

  private formatDataValue(dv: any): string {
    if (!dv) return '—';

    const typeName = this.getTypeName(dv);

    switch (typeName) {
      case 'DV_TEXT':
        return this.formatDvText(dv);
      case 'DV_CODED_TEXT':
        return this.formatDvCodedTextWithCode(dv);
      case 'DV_QUANTITY':
        return this.formatDvQuantity(dv);
      case 'DV_COUNT':
        return this.formatDvCount(dv);
      case 'DV_DATE_TIME':
        return this.formatDateTime(dv);
      case 'DV_DATE':
        return this.formatDvDate(dv);
      case 'DV_TIME':
        return this.formatDvTime(dv);
      case 'DV_DURATION':
        return this.formatDuration(dv);
      case 'DV_BOOLEAN':
        return this.formatDvBoolean(dv);
      case 'DV_PROPORTION':
        return this.formatDvProportion(dv);
      case 'DV_ORDINAL':
        return this.formatDvOrdinal(dv);
      case 'DV_SCALE':
        return this.formatDvScale(dv);
      case 'DV_IDENTIFIER':
        return this.formatDvIdentifier(dv);
      case 'DV_URI':
      case 'DV_EHR_URI':
        return this.formatDvUri(dv);
      case 'DV_PARSABLE':
        return this.formatDvParsable(dv);
      case 'DV_MULTIMEDIA':
        return this.formatDvMultimedia(dv);
      case 'DV_STATE':
        return this.formatDvState(dv);
      case 'DV_PARAGRAPH':
        return this.formatDvParagraph(dv);
      case 'DV_INTERVAL':
        return this.formatDvInterval(dv);
      case 'DV_PERIODIC_TIME_SPECIFICATION':
      case 'DV_GENERAL_TIME_SPECIFICATION':
        return this.formatDvTimeSpecification(dv);
      default:
        // Fallback: try to extract a value
        if (dv.value !== undefined) {
          return String(dv.value);
        }
        if (dv.magnitude !== undefined) {
          // Likely a numeric DV_AMOUNT subtype
          const units = dv.units ?? '';
          return `${dv.magnitude}${units ? ' ' + units : ''}`;
        }
        if (typeName && this.config.includeTypeAnnotations) {
          return `[${typeName}]`;
        }
        return '(complex value)';
    }
  }

  private formatDataValueForTable(dv: any): string {
    // For table cells, we strip terminology codes (they go in code column)
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
        case 'wikilink':
          return `[[${text}]] ${code}`;
        case 'wikilink_urn': {
          const termId = ct.defining_code.terminology_id?.value || '';
          const codeStr = ct.defining_code.code_string || '';
          // Use openEHR URN format for wikilinks where applicable
          if (termId && codeStr) {
            return `[[urn:openehr:term:${termId}::${codeStr}|${text}]]`;
          }
          return `[[${text}]]`;
        }
        case 'inline_bracket':
          return `${text} ${code}`;
        case 'footnote':
          return `${text}[^${code}]`;
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
      .join('\n');
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
      case 'wikilink':
        return `[${termId}:${code}]`;
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
    const nodeId = this.formatNodeIdAnnotation(obj);

    if (name) {
      this.writeHeading(name + nodeId, depth, lines);
      lines.push('');
    }

    // Try to serialize based on common patterns
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

    // Check _type property first (from plain objects / deserialized)
    if (obj._type) return obj._type;

    // Try TypeRegistry
    return TypeRegistry.getTypeNameFromInstance(obj);
  }

  private extractName(obj: any): string {
    if (!obj) return '';
    if (!obj.name) return '';

    // name is typically DV_TEXT with a .value
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.name === 'object' && obj.name.value) return obj.name.value;
    return '';
  }

  private extractPartyName(party: any): string {
    if (!party) return '';
    if (party.name) return party.name;
    // PARTY_IDENTIFIED has external_ref sometimes
    if (party.external_ref?.id?.value) return party.external_ref.id.value;
    return '';
  }

  private formatNodeIdAnnotation(obj: any): string {
    if (!this.config.includeArchetypeNodeIds) return '';
    const nodeId = obj?.archetype_node_id;
    if (!nodeId) return '';

    // Use openEHR URN wikilinks when configured
    if (this.config.useOpenehrUrnWikilinks && this.isArchetypeId(nodeId)) {
      const name = this.extractName(obj);
      return ` [[urn:openehr:am:org.openehr::${nodeId}|${name || nodeId}]]`;
    }

    // Use HTML comment for structural, inline for others
    if (this.config.style === 'structural') {
      return ` <!-- ${nodeId} -->`;
    }
    return '';
  }

  private formatTypeAnnotation(typeName: string | undefined): string {
    if (!this.config.includeTypeAnnotations || !typeName) return '';
    if (this.config.style === 'structural') {
      return ` _[${typeName}]_`;
    }
    return '';
  }

  private writeHeading(text: string, depth: number, lines: string[]): void {
    if (depth <= this.config.maxHeadingDepth) {
      const hashes = '#'.repeat(depth);
      lines.push(`${hashes} ${text}`);
    } else {
      // Beyond max heading depth, use bold
      lines.push(`**${text}**`);
    }
  }

  private getIndent(nestLevel: number): string {
    return ' '.repeat(nestLevel * this.config.indent);
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
  private isArchetypeId(nodeId: string): boolean {
    return nodeId.startsWith('openEHR-');
  }
}

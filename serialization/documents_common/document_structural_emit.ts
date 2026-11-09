/**
 * Shared structural (lossless) serialization helpers for Markdown and AsciiDoc.
 */

import { renderRmValue, type DocumentRmRenderOptions } from "./document_rm_render.ts";
import {
  encodeOeRmAnnotationPayload,
  formatOeRmAnnotationAsciidoc,
  formatOeRmAnnotationMarkdown,
} from "./oe_rm_annotation.ts";
import { formatOeMetaAsciidoc, formatOeMetaMarkdown } from "./oe_structure_meta.ts";

export type StructuralTextSink = (line: string) => void;

export const STRUCTURAL_RM_RENDER_OPTS: DocumentRmRenderOptions = {
  lossy: false,
  useTerseFormat: false,
  codeRendering: "inline_bracket",
  includeTypeAnnotations: false,
};

function rmDisplay(obj: unknown): string {
  return renderRmValue(obj, STRUCTURAL_RM_RENDER_OPTS, 0);
}

function mdAnn(obj: Record<string, unknown>): string {
  return formatOeRmAnnotationMarkdown(obj);
}

function adAnn(obj: Record<string, unknown>): string {
  return formatOeRmAnnotationAsciidoc(obj);
}

export function emitStructuralEventContextMarkdown(
  ctx: Record<string, unknown>,
  push: StructuralTextSink,
): void {
  push("- _context:_");
  if (ctx.start_time) push(`- _start_time:_ ${rmDisplay(ctx.start_time)}`);
  if (ctx.end_time) push(`- _end_time:_ ${rmDisplay(ctx.end_time)}`);
  if (ctx.location) push(`- _location:_ ${rmDisplay(ctx.location)}`);
  if (ctx.setting) push(`- _setting:_ ${rmDisplay(ctx.setting)}`);
  if (ctx.health_care_facility) {
    const party = { ...(ctx.health_care_facility as Record<string, unknown>) };
    if (!party._type) party._type = "PARTY_IDENTIFIED";
    push(`- _health_care_facility:_ ${rmDisplay(party)}${mdAnn(party)}`);
  }
  if (Array.isArray(ctx.participations)) {
    for (const p of ctx.participations) {
      if (!p || typeof p !== "object") continue;
      const part = { ...(p as Record<string, unknown>) };
      if (!part._type) part._type = "PARTICIPATION";
      push(`- _participation:_ ${rmDisplay(part)}${mdAnn(part)}`);
    }
  }
  if (ctx.other_context) {
    push(`- _other_context:_ <!-- structure item tree -->`);
  }
}

export function emitStructuralEventContextAsciidoc(
  ctx: Record<string, unknown>,
  push: StructuralTextSink,
): void {
  push("* _context:_");
  if (ctx.start_time) push(`* _start_time:_ ${rmDisplay(ctx.start_time)}`);
  if (ctx.end_time) push(`* _end_time:_ ${rmDisplay(ctx.end_time)}`);
  if (ctx.location) push(`* _location:_ ${rmDisplay(ctx.location)}`);
  if (ctx.setting) push(`* _setting:_ ${rmDisplay(ctx.setting)}`);
  if (ctx.health_care_facility) {
    const party = { ...(ctx.health_care_facility as Record<string, unknown>) };
    if (!party._type) party._type = "PARTY_IDENTIFIED";
    push(`* _health_care_facility:_ ${rmDisplay(party)}${adAnn(party)}`);
  }
  if (Array.isArray(ctx.participations)) {
    for (const p of ctx.participations) {
      if (!p || typeof p !== "object") continue;
      const part = { ...(p as Record<string, unknown>) };
      if (!part._type) part._type = "PARTICIPATION";
      push(`* _participation:_ ${rmDisplay(part)}${adAnn(part)}`);
    }
  }
  if (ctx.other_context) {
    push("* _other_context:_");
  }
}

export function formatStructuralCompositionRoundtripMarkdown(
  comp: Record<string, unknown>,
): string {
  const payload = encodeOeRmAnnotationPayload({
    ...comp,
    _type: "COMPOSITION",
  });
  return `<!-- ${payload} -->`;
}

export function formatStructuralCompositionRoundtripAsciidoc(
  comp: Record<string, unknown>,
): string {
  const payload = encodeOeRmAnnotationPayload({
    ...comp,
    _type: "COMPOSITION",
  });
  return `// ${payload}`;
}

export function emitStructuralCompositionExtrasMarkdown(
  comp: Record<string, unknown>,
  push: StructuralTextSink,
): void {
  if (comp.feeder_audit) {
    const fa = { ...(comp.feeder_audit as Record<string, unknown>) };
    if (!fa._type) fa._type = "FEEDER_AUDIT";
    push(`- _feeder_audit:_ ${rmDisplay(fa)}${mdAnn(fa)}`);
  }
  if (Array.isArray(comp.links)) {
    for (const link of comp.links) {
      if (!link || typeof link !== "object") continue;
      const l = { ...(link as Record<string, unknown>) };
      if (!l._type) l._type = "LINK";
      push(`- _link:_ ${rmDisplay(l)}${mdAnn(l)}`);
    }
  }
  if (comp.archetype_details?.rm_version) {
    push(formatOeMetaMarkdown("rm_version", String(
      (comp.archetype_details as Record<string, unknown>).rm_version,
    )));
  }
}

export function emitStructuralCompositionExtrasAsciidoc(
  comp: Record<string, unknown>,
  push: StructuralTextSink,
): void {
  if (comp.feeder_audit) {
    const fa = comp.feeder_audit as Record<string, unknown>;
    push(`* _feeder_audit:_ ${rmDisplay(fa)}${adAnn(fa)}`);
  }
  if (Array.isArray(comp.links)) {
    for (const link of comp.links) {
      if (!link || typeof link !== "object") continue;
      const l = link as Record<string, unknown>;
      push(`* _link:_ ${rmDisplay(l)}${adAnn(l)}`);
    }
  }
  if (comp.archetype_details?.rm_version) {
    push(formatOeMetaAsciidoc("rm_version", String(
      (comp.archetype_details as Record<string, unknown>).rm_version,
    )));
  }
}

export function emitStructuralEntryExtrasMarkdown(
  entry: Record<string, unknown>,
  push: StructuralTextSink,
): void {
  if (entry.feeder_audit) {
    const fa = entry.feeder_audit as Record<string, unknown>;
    push(`- _feeder_audit:_ ${rmDisplay(fa)}${mdAnn(fa)}`);
  }
  if (Array.isArray(entry.links)) {
    for (const link of entry.links) {
      if (!link || typeof link !== "object") continue;
      const l = link as Record<string, unknown>;
      push(`- _link:_ ${rmDisplay(l)}${mdAnn(l)}`);
    }
  }
}

export function hasExtraRmFields(obj: Record<string, unknown>): boolean {
  const skip = new Set(["_type", "name", "items", "archetype_node_id", "value"]);
  return Object.keys(obj).some((k) => !skip.has(k));
}

export function emitStructuralEntryExtrasAsciidoc(
  entry: Record<string, unknown>,
  push: StructuralTextSink,
): void {
  if (entry.feeder_audit) {
    const fa = entry.feeder_audit as Record<string, unknown>;
    push(`* _feeder_audit:_ ${rmDisplay(fa)}${adAnn(fa)}`);
  }
  if (Array.isArray(entry.links)) {
    for (const link of entry.links) {
      if (!link || typeof link !== "object") continue;
      const l = link as Record<string, unknown>;
      push(`* _link:_ ${rmDisplay(l)}${adAnn(l)}`);
    }
  }
}

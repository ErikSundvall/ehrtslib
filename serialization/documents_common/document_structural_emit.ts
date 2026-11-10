/**
 * Shared structural (lossless) serialization helpers for Markdown and AsciiDoc.
 */

import { renderRmValue, type DocumentRmRenderOptions } from "./document_rm_render.ts";
import { formatSparseRmAsciidoc, formatSparseRmMarkdown } from "./oe_rm_sparse.ts";
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

function mdAnn(target: Record<string, unknown>, display: string): string {
  return formatSparseRmMarkdown(target, { _type: target._type, value: display });
}

function adAnn(target: Record<string, unknown>, display: string): string {
  return formatSparseRmAsciidoc(target, { _type: target._type, value: display });
}

export function emitStructuralEventContextMarkdown(
  ctx: Record<string, unknown>,
  push: StructuralTextSink,
): void {
  push("- _context:_");
  const ctxScalar = (
    key: string,
    raw: unknown,
    defaultType: string,
  ) => {
    const o = { ...(raw as Record<string, unknown>) };
    if (!o._type) o._type = defaultType;
    const vis = rmDisplay(o);
    const recovered: Record<string, unknown> = { _type: defaultType };
    if (defaultType === "DV_CODED_TEXT" && vis.includes("[")) {
      recovered.value = vis.split("[")[0].trim();
    } else {
      recovered.value = vis;
    }
    push(`- _${key}:_ ${vis}${mdAnn(o, recovered)}`);
  };
  if (ctx.start_time) ctxScalar("start_time", ctx.start_time, "DV_DATE_TIME");
  if (ctx.end_time) ctxScalar("end_time", ctx.end_time, "DV_DATE_TIME");
  if (ctx.location !== undefined) {
    if (typeof ctx.location === "string") {
      push(`- _location:_ ${ctx.location || "—"}`);
    } else {
      ctxScalar("location", ctx.location, "DV_TEXT");
    }
  }
  if (ctx.setting) ctxScalar("setting", ctx.setting, "DV_CODED_TEXT");
  if (ctx.health_care_facility) {
    const party = { ...(ctx.health_care_facility as Record<string, unknown>) };
    if (!party._type) party._type = "PARTY_IDENTIFIED";
    const hcfVis = rmDisplay(party);
    push(`- _health_care_facility:_ ${hcfVis}${mdAnn(party, hcfVis)}`);
  }
  if (Array.isArray(ctx.participations)) {
    for (const p of ctx.participations) {
      if (!p || typeof p !== "object") continue;
      const part = { ...(p as Record<string, unknown>) };
      if (!part._type) part._type = "PARTICIPATION";
      const partVis = rmDisplay(part);
      push(`- _participation:_ ${partVis}${mdAnn(part, partVis)}`);
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
  const ctxScalar = (
    key: string,
    raw: unknown,
    defaultType: string,
  ) => {
    const o = { ...(raw as Record<string, unknown>) };
    if (!o._type) o._type = defaultType;
    const vis = rmDisplay(o);
    const recovered: Record<string, unknown> = { _type: defaultType };
    if (defaultType === "DV_CODED_TEXT" && vis.includes("[")) {
      recovered.value = vis.split("[")[0].trim();
    } else {
      recovered.value = vis;
    }
    push(`* _${key}:_ ${vis}${adAnn(o, recovered)}`);
  };
  if (ctx.start_time) ctxScalar("start_time", ctx.start_time, "DV_DATE_TIME");
  if (ctx.end_time) ctxScalar("end_time", ctx.end_time, "DV_DATE_TIME");
  if (ctx.location !== undefined) {
    if (typeof ctx.location === "string") {
      push(`* _location:_ ${ctx.location || "—"}`);
    } else {
      ctxScalar("location", ctx.location, "DV_TEXT");
    }
  }
  if (ctx.setting) ctxScalar("setting", ctx.setting, "DV_CODED_TEXT");
  if (ctx.health_care_facility) {
    const party = { ...(ctx.health_care_facility as Record<string, unknown>) };
    if (!party._type) party._type = "PARTY_IDENTIFIED";
    const hcfVis = rmDisplay(party);
    push(`* _health_care_facility:_ ${hcfVis}${adAnn(party, hcfVis)}`);
  }
  if (Array.isArray(ctx.participations)) {
    for (const p of ctx.participations) {
      if (!p || typeof p !== "object") continue;
      const part = { ...(p as Record<string, unknown>) };
      if (!part._type) part._type = "PARTICIPATION";
      const partVis = rmDisplay(part);
      push(`* _participation:_ ${partVis}${adAnn(part, partVis)}`);
    }
  }
  if (ctx.other_context) {
    push("* _other_context:_");
  }
}

export function emitStructuralCompositionExtrasMarkdown(
  comp: Record<string, unknown>,
  push: StructuralTextSink,
): void {
  if (comp.composer && typeof comp.composer === "object") {
    const party = { ...(comp.composer as Record<string, unknown>) };
    if (!party._type) party._type = "PARTY_IDENTIFIED";
    const vis = rmDisplay(party);
    push(`- _composer:_ ${vis}${mdAnn(party, vis)}`);
  }
  if (comp.feeder_audit) {
    const fa = { ...(comp.feeder_audit as Record<string, unknown>) };
    if (!fa._type) fa._type = "FEEDER_AUDIT";
    const vis = rmDisplay(fa);
    push(`- _feeder_audit:_ ${vis}${mdAnn(fa, vis)}`);
  }
  if (Array.isArray(comp.links)) {
    if (comp.links.length === 0) {
      push("- _links:_ —");
    } else {
      for (const link of comp.links) {
        if (!link || typeof link !== "object") continue;
        const l = { ...(link as Record<string, unknown>) };
        if (!l._type) l._type = "LINK";
        const vis = rmDisplay(l);
        push(`- _link:_ ${vis}${mdAnn(l, vis)}`);
      }
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
  if (comp.composer && typeof comp.composer === "object") {
    const party = { ...(comp.composer as Record<string, unknown>) };
    if (!party._type) party._type = "PARTY_IDENTIFIED";
    const vis = rmDisplay(party);
    push(`* _composer:_ ${vis}${adAnn(party, vis)}`);
  }
  if (comp.feeder_audit) {
    const fa = { ...(comp.feeder_audit as Record<string, unknown>) };
    if (!fa._type) fa._type = "FEEDER_AUDIT";
    const vis = rmDisplay(fa);
    push(`* _feeder_audit:_ ${vis}${adAnn(fa, vis)}`);
  }
  if (Array.isArray(comp.links)) {
    if (comp.links.length === 0) {
      push("* _links:_ —");
    } else {
      for (const link of comp.links) {
        if (!link || typeof link !== "object") continue;
        const l = { ...(link as Record<string, unknown>) };
        if (!l._type) l._type = "LINK";
        const vis = rmDisplay(l);
        push(`* _link:_ ${vis}${adAnn(l, vis)}`);
      }
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
    const vis = rmDisplay(fa);
    push(`- _feeder_audit:_ ${vis}${mdAnn(fa, vis)}`);
  }
  if (Array.isArray(entry.other_participations)) {
    for (const p of entry.other_participations) {
      if (!p || typeof p !== "object") continue;
      const part = p as Record<string, unknown>;
      const vis = rmDisplay(part);
      push(`- _other_participation:_ ${vis}${mdAnn(part, vis)}`);
    }
  }
  if (Array.isArray(entry.links)) {
    for (const link of entry.links) {
      if (!link || typeof link !== "object") continue;
      const l = link as Record<string, unknown>;
      const vis = rmDisplay(l);
      push(`- _link:_ ${vis}${mdAnn(l, vis)}`);
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
    const vis = rmDisplay(fa);
    push(`* _feeder_audit:_ ${vis}${adAnn(fa, vis)}`);
  }
  if (Array.isArray(entry.other_participations)) {
    for (const p of entry.other_participations) {
      if (!p || typeof p !== "object") continue;
      const part = p as Record<string, unknown>;
      const vis = rmDisplay(part);
      push(`* _other_participation:_ ${vis}${adAnn(part, vis)}`);
    }
  }
  if (Array.isArray(entry.links)) {
    for (const link of entry.links) {
      if (!link || typeof link !== "object") continue;
      const l = link as Record<string, unknown>;
      const vis = rmDisplay(l);
      push(`* _link:_ ${vis}${adAnn(l, vis)}`);
    }
  }
}

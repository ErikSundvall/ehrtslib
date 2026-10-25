/**
 * Down-convert a draft's canonical RM JSON from ADL2 codes to ADL 1.4 codes,
 * for CDRs that hold OPT 1.4 templates (ADR 0010; design section 7).
 *
 * - `archetype_node_id` id-codes become at-codes (`id1` → `at0000`,
 *   `id5` → `at0004`, `id5.1` → `at0004.1`). Archetype ids stay.
 * - Local value codes (`CODE_PHRASE` with terminology `local`) go back to
 *   zero-padded at-codes (`at10` → `at0009`).
 * - `archetype_details.template_id` becomes the OPT 1.4 template id.
 *
 * For a binding made from an OPT 1.4 XML (`sourceFormat: "opt14-xml"`) this
 * is the exact inverse of the up-conversion (`parser/legacy/opt14_code_mapping.ts`),
 * and the template id is the OPT's own. For an ADL2-native template, the OPT
 * 1.4 exporter may renumber colliding node ids per archetype; pass its map in
 * {@link Adl14DownconversionOptions.codeMap} (and the exported template id),
 * otherwise the plain shift is used and a warning is returned.
 */

import { idToAtCode } from "../generation/id_to_at_code.ts";
import {
  opt14NodeIdToAdl2,
  opt14ValueCodeToAdl2,
} from "../parser/legacy/opt14_code_mapping.ts";
import type { RmJson } from "./operation_log.ts";
import type { TemplateBinding } from "./template_binding.ts";

export interface Adl14DownconversionOptions {
  /** OPT 1.4 template id to write in `archetype_details.template_id`. */
  templateId?: string;
  /**
   * ADL2 → ADL 1.4 code per archetype id (the archetype whose root the node
   * is under). Codes not in the map fall back to the plain shift.
   */
  codeMap?: (archetypeId: string, code: string) => string | undefined;
}

export interface Adl14DownconversionResult {
  data: RmJson;
  templateId: string;
  warnings: string[];
}

type Obj = Record<string, RmJson>;
const isObj = (v: unknown): v is Obj =>
  !!v && typeof v === "object" && !Array.isArray(v);

const ARCHETYPE_ID_RE = /^[A-Za-z][\w-]*-[A-Za-z]+-[A-Za-z_]+\.[\w-]+\.v\d/;
const ADL2_CODE_RE = /^(id|at)\d+(\.\d+)*$/;

/** Down-convert (returns a copy; the input is not changed). */
export function downConvertToAdl14(
  data: RmJson,
  binding: TemplateBinding,
  options: Adl14DownconversionOptions = {},
): Adl14DownconversionResult {
  const warnings: string[] = [];
  const templateId = options.templateId ?? binding.templateId;
  if (binding.sourceFormat !== "opt14-xml") {
    if (!options.codeMap) {
      warnings.push(
        "ADL2-native template: ADL 1.4 codes use the plain shift; pass the OPT 1.4 exporter's code map if it renumbered node ids",
      );
    }
    if (!options.templateId) {
      warnings.push(
        `ADL2-native template: archetype_details.template_id set to ${templateId}; pass the OPT 1.4 template id if it differs`,
      );
    }
  }
  const map = (archetypeId: string, code: string): string => {
    if (!ADL2_CODE_RE.test(code)) return code;
    return options.codeMap?.(archetypeId, code) ?? idToAtCode(code);
  };
  const copy = JSON.parse(JSON.stringify(data)) as RmJson;
  const walk = (v: RmJson, archetypeId: string, isRoot: boolean) => {
    if (Array.isArray(v)) {
      for (const x of v) walk(x, archetypeId, false);
      return;
    }
    if (!isObj(v)) return;
    let scope = archetypeId;
    const nodeId = v.archetype_node_id;
    if (typeof nodeId === "string") {
      if (ARCHETYPE_ID_RE.test(nodeId)) scope = nodeId;
      else v.archetype_node_id = map(scope, nodeId);
    }
    if (v._type === "CODE_PHRASE" && isLocal(v.terminology_id)) {
      const code = v.code_string;
      if (typeof code === "string") v.code_string = map(scope, code);
    }
    const details = v.archetype_details;
    if (isRoot && isObj(details) && isObj(details.template_id)) {
      details.template_id.value = templateId;
    }
    for (const [k, x] of Object.entries(v)) {
      if (k !== "archetype_details") walk(x, scope, false);
    }
  };
  walk(copy, "", true);
  return { data: copy, templateId, warnings };
}

function isLocal(tid: RmJson | undefined): boolean {
  return isObj(tid) && tid.value === "local";
}

/**
 * Inverse of {@link downConvertToAdl14}, for versions read back from a CDR
 * with ADL 1.4 codes: node at-codes become id-codes (`at0004` → `id5`) and
 * local value codes lose their padding (`at0009` → `at10`), the rule of
 * `parser/legacy/opt14_code_mapping.ts`. ADL2 and ADL 1.4 value codes look
 * alike (`at1001`), so call this only for ADL 1.4 data (see
 * {@link usesAdl14Codes}). Returns a copy.
 */
export function upConvertFromAdl14(data: RmJson): RmJson {
  const copy = JSON.parse(JSON.stringify(data)) as RmJson;
  const walk = (v: RmJson) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!isObj(v)) return;
    const nodeId = v.archetype_node_id;
    if (typeof nodeId === "string" && /^at\d/.test(nodeId)) {
      v.archetype_node_id = opt14NodeIdToAdl2(nodeId);
    }
    if (v._type === "CODE_PHRASE" && isLocal(v.terminology_id)) {
      const code = v.code_string;
      if (typeof code === "string" && /^at\d/.test(code)) {
        v.code_string = opt14ValueCodeToAdl2(code);
      }
    }
    for (const [k, x] of Object.entries(v)) {
      if (k !== "archetype_details") walk(x);
    }
  };
  walk(copy);
  return copy;
}

/** True when the data uses ADL 1.4 node codes (`at0001`, zero-padded). */
export function usesAdl14Codes(data: RmJson): boolean {
  let found = false;
  const walk = (v: RmJson) => {
    if (found) return;
    if (Array.isArray(v)) return v.forEach(walk);
    if (!isObj(v)) return;
    if (
      typeof v.archetype_node_id === "string" && isPadded14(v.archetype_node_id)
    ) {
      found = true;
      return;
    }
    for (const x of Object.values(v)) walk(x);
  };
  walk(data);
  return found;
}

/** ADL 1.4 at-code: four or more digits with a leading zero, or `at0.x`. */
function isPadded14(code: string): boolean {
  return /^at0\d{3,}(\.\d+)*$/.test(code) || /^at0(\.\d+)+$/.test(code);
}

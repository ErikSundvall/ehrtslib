/**
 * Group-aware openEHR terminology rubrics (English).
 *
 * Instruction-state codes are group-specific (SPECPR-51): e.g. 532 is
 * "completed" in `instruction_states`, not "complete" from other groups.
 *
 * The rubrics are embedded rather than read from
 * `terminology_data/openehr_terminology_en.xml` at runtime, so this module
 * also works in browsers (no file system access). A test checks them against
 * the XML file.
 */

type GroupMap = ReadonlyMap<string, string>;

export const INSTRUCTION_STATES_GROUP = "instruction_states";
export const SETTING_GROUP = "setting";
export const COMPOSITION_CATEGORY_GROUP = "composition_category";
export const PARTICIPATION_MODE_GROUP = "participation_mode";

const GROUPS: ReadonlyMap<string, GroupMap> = new Map([
  [
    INSTRUCTION_STATES_GROUP,
    new Map([
      ["524", "initial"],
      ["526", "planned"],
      ["527", "postponed"],
      ["528", "cancelled"],
      ["529", "scheduled"],
      ["245", "active"],
      ["530", "suspended"],
      ["531", "aborted"],
      ["532", "completed"],
      ["533", "expired"],
    ]),
  ],
  [
    SETTING_GROUP,
    new Map([
      ["225", "home"],
      ["227", "emergency care"],
      ["228", "primary medical care"],
      ["229", "primary nursing care"],
      ["230", "primary allied health care"],
      ["231", "midwifery care"],
      ["232", "secondary medical care"],
      ["233", "secondary nursing care"],
      ["234", "secondary allied health care"],
      ["235", "complementary health care"],
      ["236", "dental care"],
      ["237", "nursing home care"],
      ["802", "mental healthcare"],
      ["238", "other care"],
    ]),
  ],
  [
    COMPOSITION_CATEGORY_GROUP,
    new Map([
      ["431", "persistent"],
      ["451", "episodic"],
      ["433", "event"],
      ["815", "report"],
    ]),
  ],
  [
    PARTICIPATION_MODE_GROUP,
    new Map([
      ["193", "not specified"],
      ["216", "face-to-face communication"],
      ["223", "interpreted face-to-face communication"],
      ["217", "signing (face-to-face)"],
      ["195", "live audiovisual; videoconference; videophone"],
      ["198", "videoconferencing"],
      ["197", "videophone"],
      ["218", "signing over video"],
      ["224", "interpreted video communication"],
      ["194", "asynchronous audiovisual; recorded video"],
      ["196", "recorded video"],
      ["202", "live audio-only; telephone; internet phone; teleconference"],
      ["204", "telephone"],
      ["203", "teleconference"],
      ["205", "internet telephone"],
      ["222", "interpreted audio-only"],
      ["199", "asynchronous audio-only; dictated; voice mail"],
      ["200", "dictated"],
      ["201", "voice-mail"],
      ["212", "live text-only; internet chat; SMS chat; interactive written note"],
      ["213", "internet chat"],
      ["214", "SMS chat"],
      ["215", "interactive written note"],
      ["206", "asynchronous text; email; fax; letter; handwritten note; SMS message"],
      ["211", "handwritten note"],
      ["210", "printed/typed letter"],
      ["207", "email"],
      ["208", "facsimile/telefax"],
      ["221", "translated text"],
      ["209", "SMS message"],
      ["219", "physically present"],
      ["220", "physically remote"],
    ]),
  ],
]);

/** Codes of an embedded openEHR group, in terminology file order. */
export function openEhrGroupCodes(groupId: string): string[] {
  const group = GROUPS.get(groupId);
  return group ? [...group.keys()] : [];
}

/** Code for an English rubric within an embedded openEHR group. */
export function openEhrGroupCode(
  groupId: string,
  rubric: string,
): string | undefined {
  for (const [code, text] of GROUPS.get(groupId) ?? []) {
    if (text === rubric) return code;
  }
  return undefined;
}

/** Group ids whose rubrics are embedded in this module. */
export function embeddedOpenEhrGroupIds(): string[] {
  return [...GROUPS.keys()];
}

/** Rubric for a code within an embedded openEHR terminology group (English). */
export function openEhrGroupRubric(
  groupId: string,
  code: string,
): string | undefined {
  return GROUPS.get(groupId)?.get(code);
}

export function instructionStateRubric(code: string): string | undefined {
  return openEhrGroupRubric(INSTRUCTION_STATES_GROUP, code);
}

/** All instruction-state codes defined in the English terminology file. */
export function instructionStateCodes(): string[] {
  const group = GROUPS.get(INSTRUCTION_STATES_GROUP);
  return group ? [...group.keys()] : [];
}

export const NULL_FLAVOURS_GROUP = "null_flavours";
export const EVENT_MATH_FUNCTION_GROUP = "event_math_function";
export const AUDIT_CHANGE_TYPE_GROUP = "audit_change_type";
export const ATTESTATION_REASON_GROUP = "attestation_reason";
export const SUBJECT_RELATIONSHIP_GROUP = "subject_relationship";
export const TERM_MAPPING_PURPOSE_GROUP = "term_mapping_purpose";

const EXTRA_EN_GROUPS: ReadonlyMap<string, GroupMap> = new Map([
  [
    NULL_FLAVOURS_GROUP,
    new Map([
      ["271", "no information"],
      ["253", "unknown"],
      ["272", "masked"],
      ["273", "not applicable"],
    ]),
  ],
  [
    EVENT_MATH_FUNCTION_GROUP,
    new Map([
      ["145", "minimum"],
      ["144", "maximum"],
      ["267", "mode"],
      ["268", "median"],
      ["146", "mean"],
      ["147", "change"],
      ["148", "total"],
      ["149", "variation"],
      ["521", "decrease"],
      ["522", "increase"],
      ["640", "actual"],
    ]),
  ],
  [
    AUDIT_CHANGE_TYPE_GROUP,
    new Map([
      ["249", "creation"],
      ["250", "amendment"],
      ["251", "modification"],
      ["252", "synthesis"],
      ["523", "deleted"],
      ["666", "attestation"],
      ["816", "restoration"],
      ["817", "format conversion"],
      ["253", "unknown"],
    ]),
  ],
  [
    ATTESTATION_REASON_GROUP,
    new Map([
      ["240", "signed"],
      ["648", "witnessed"],
    ]),
  ],
  [
    TERM_MAPPING_PURPOSE_GROUP,
    new Map([
      ["669", "public health"],
      ["670", "reimbursement"],
      ["671", "research study"],
    ]),
  ],
]);

const LOCALIZED_GROUPS: ReadonlyMap<string, ReadonlyMap<string, GroupMap>> =
  new Map([
    [
      "sv",
      new Map([
        [
          SETTING_GROUP,
          new Map([
            ["225", "hem"],
            ["227", "akutsjukvård"],
            ["228", "primärvård"],
            ["229", "primär omvårdnad"],
            ["230", "primär rehabilitering"],
            ["231", "mödravård"],
            ["232", "specialiserad sjukvård"],
            ["233", "specialiserad omvårdnad"],
            ["234", "specialiserad rehabilitering"],
            ["235", "komplementär vård"],
            ["236", "tandvård"],
            ["237", "särskilt boende"],
            ["802", "psykiatrisk vård"],
            ["238", "övrig vård"],
          ]),
        ],
        [
          COMPOSITION_CATEGORY_GROUP,
          new Map([
            ["431", "bestående"],
            ["451", "episodisk"],
            ["433", "händelse"],
            ["815", "rapport"],
          ]),
        ],
        [
          NULL_FLAVOURS_GROUP,
          new Map([
            ["271", "ingen information"],
            ["253", "okänd"],
            ["272", "maskerad"],
            ["273", "ej tillämplig"],
          ]),
        ],
        [
          INSTRUCTION_STATES_GROUP,
          new Map([
            ["524", "initial"],
            ["526", "planerad"],
            ["527", "uppskjuten"],
            ["528", "avbruten"],
            ["529", "bokad"],
            ["245", "aktiv"],
            ["530", "pausad"],
            ["531", "avslutad i förtid"],
            ["532", "slutförd"],
            ["533", "utgången"],
          ]),
        ],
        [
          PARTICIPATION_MODE_GROUP,
          new Map([
            ["193", "ej angiven"],
            ["216", "fysiskt möte"],
            ["223", "tolkat fysiskt möte"],
            ["217", "teckenspråk (fysiskt möte)"],
            ["195", "direktsänd video"],
            ["198", "videokonferens"],
            ["197", "bildtelefon"],
            ["218", "teckenspråk via video"],
            ["224", "tolkad videokommunikation"],
            ["194", "inspelad video"],
            ["196", "inspelad video"],
            ["202", "ljudsamtal"],
            ["204", "telefon"],
            ["203", "telefonkonferens"],
            ["205", "internettelefon"],
            ["222", "tolkat ljudsamtal"],
            ["199", "inspelat ljud"],
            ["200", "dikterat"],
            ["201", "röstmeddelande"],
            ["212", "direkttext"],
            ["213", "chatt"],
            ["214", "SMS-chatt"],
            ["215", "interaktiv skriftlig anteckning"],
            ["206", "asynkron text"],
            ["211", "handskriven anteckning"],
            ["210", "utskrivet brev"],
            ["207", "e-post"],
            ["208", "fax"],
            ["221", "översatt text"],
            ["209", "SMS"],
            ["219", "fysiskt närvarande"],
            ["220", "på distans"],
          ]),
        ],
        [
          EVENT_MATH_FUNCTION_GROUP,
          new Map([
            ["145", "minimum"],
            ["144", "maximum"],
            ["267", "typvärde"],
            ["268", "median"],
            ["146", "medelvärde"],
            ["147", "förändring"],
            ["148", "totalt"],
            ["149", "variation"],
            ["521", "minskning"],
            ["522", "ökning"],
            ["640", "aktuell"],
          ]),
        ],
        [
          AUDIT_CHANGE_TYPE_GROUP,
          new Map([
            ["249", "skapande"],
            ["250", "tillägg"],
            ["251", "ändring"],
            ["252", "syntes"],
            ["523", "borttagen"],
            ["666", "attestering"],
            ["816", "återställning"],
            ["817", "formatkonvertering"],
            ["253", "okänd"],
          ]),
        ],
        [
          ATTESTATION_REASON_GROUP,
          new Map([
            ["240", "signerad"],
            ["648", "bevittnad"],
          ]),
        ],
        [
          SUBJECT_RELATIONSHIP_GROUP,
          new Map([
            ["0", "själv"],
            ["3", "foster"],
            ["10", "mor"],
            ["9", "far"],
            ["6", "donator"],
            ["253", "okänd"],
          ]),
        ],
        [
          TERM_MAPPING_PURPOSE_GROUP,
          new Map([
            ["669", "folkhälsa"],
            ["670", "ersättning"],
            ["671", "forskningsstudie"],
          ]),
        ],
      ]),
    ],
    [
      "es",
      new Map([
        [
          SETTING_GROUP,
          new Map([
            ["225", "hogar"],
            ["227", "atención de emergencia"],
            ["228", "atención médica primaria"],
            ["229", "atención primaria de enfermería"],
            ["230", "atención primaria de trabajadores de la salud"],
            ["231", "atención de partera"],
            ["232", "atención médica secundaria"],
            ["233", "atención secundaria de enfermería"],
            ["234", "atención secundaria de trabajadores de la salud"],
            ["235", "atención complementaria"],
            ["236", "atención dental"],
            ["237", "atención en casa de salud"],
            ["802", "salud mental"],
            ["238", "otros cuidados"],
          ]),
        ],
        [
          COMPOSITION_CATEGORY_GROUP,
          new Map([
            ["431", "persistente"],
            ["451", "episódico"],
            ["433", "evento"],
            ["815", "informe"],
          ]),
        ],
        [
          NULL_FLAVOURS_GROUP,
          new Map([
            ["271", "sin información"],
            ["253", "desconocido"],
            ["272", "oculto"],
            ["273", "no aplica"],
          ]),
        ],
        [
          INSTRUCTION_STATES_GROUP,
          new Map([
            ["524", "inicial"],
            ["526", "planificado"],
            ["527", "postpuesto"],
            ["528", "cancelado"],
            ["529", "coordinado"],
            ["245", "activo"],
            ["530", "suspendido"],
            ["531", "abortado"],
            ["532", "completado"],
            ["533", "expirado"],
          ]),
        ],
      ]),
    ],
    [
      "pt",
      new Map([
        [
          SETTING_GROUP,
          new Map([
            ["225", "cuidados domiciliários"],
            ["227", "cuidados de emergência"],
            ["228", "cuidados médicos primários"],
            ["229", "cuidados de enfermagem primários"],
            ["230", "cuidados de saúde primários"],
            ["231", "cuidados de obstetrícia"],
            ["232", "cuidados médicos secundários"],
            ["233", "cuidados de enfermagem secundários"],
            ["234", "cuidados de saúde especializada"],
            ["235", "cuidados de saúde complementares"],
            ["236", "cuidados dentários"],
            ["237", "cuidados em lares residenciais"],
            ["802", "cuidados de saúde mental"],
            ["238", "outros cuidados"],
          ]),
        ],
        [
          COMPOSITION_CATEGORY_GROUP,
          new Map([
            ["431", "persistente"],
            ["451", "episódico"],
            ["433", "evento"],
            ["815", "relatório"],
          ]),
        ],
        [
          NULL_FLAVOURS_GROUP,
          new Map([
            ["271", "sem informação"],
            ["253", "desconhecido"],
            ["272", "mascarado"],
            ["273", "não aplicável"],
          ]),
        ],
        [
          INSTRUCTION_STATES_GROUP,
          new Map([
            ["524", "inicial"],
            ["526", "planeado"],
            ["527", "adiado"],
            ["528", "cancelado"],
            ["529", "agendado"],
            ["245", "activo"],
            ["530", "suspenso"],
            ["531", "abortado"],
            ["532", "concluído"],
            ["533", "expirado"],
          ]),
        ],
      ]),
    ],
  ]);

/**
 * Localized rubric for an openEHR internal terminology code (`openehr::<code>`).
 * Browser-safe (embedded tables; no filesystem access). Returns `undefined`
 * when no translation exists for the requested language (never silently falls
 * back to English).
 */
export function localizedOpenEhrRubric(
  code: string,
  lang: string,
  groupId?: string,
): string | undefined {
  const normalized = lang.trim().toLowerCase().split(/[-_]/)[0];
  if (!normalized || !code) return undefined;

  if (normalized === "en") {
    if (groupId) {
      const fromGroup = GROUPS.get(groupId)?.get(code) ??
        EXTRA_EN_GROUPS.get(groupId)?.get(code);
      if (fromGroup) return fromGroup;
    }
    for (const g of GROUPS.values()) {
      const v = g.get(code);
      if (v) return v;
    }
    for (const g of EXTRA_EN_GROUPS.values()) {
      const v = g.get(code);
      if (v) return v;
    }
    return undefined;
  }

  const langGroups = LOCALIZED_GROUPS.get(normalized);
  if (!langGroups) return undefined;
  if (groupId) {
    const fromGroup = langGroups.get(groupId)?.get(code);
    if (fromGroup) return fromGroup;
  }
  for (const g of langGroups.values()) {
    const v = g.get(code);
    if (v) return v;
  }
  return undefined;
}


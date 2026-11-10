/** Hand-written demo bindings, not a template-to-form generator. */
import {
  bindTemplate,
  type BoundTemplate,
  DraftValidator,
  prepareContribution,
  ROOT_TARGET,
} from "../../../contribution_builder/mod.ts";
import {
  AutomergeOperationLogAdapter,
  createMultiCaller,
  mergeCaller,
  type MultiCaller,
  recordNativeText,
} from "../../../addons/cb_automerge/mod.ts";
import { deserializeFromFlat } from "../../../serialization/simplified/flat_deserializer.ts";
import { parseWebTemplate } from "../../../serialization/simplified/web_template_parser.ts";
import {
  allocateDemoUsername,
  USERNAMES,
} from "./cb-username-allocator.ts";

export { USERNAMES };

export const DELAY_PROFILES = {
  office: { label: "Office LAN", min: 80, max: 350 },
  ward: { label: "Ward Wi-Fi", min: 400, max: 1600 },
  rural: { label: "Rural phone", min: 2500, max: 7000 },
} as const;
export type DelayProfile = keyof typeof DELAY_PROFILES;
export type Field =
  | "diagnosisName"
  | "clinicalDescription"
  | "comment"
  | "systolic"
  | "diastolic"
  | "pulse"
  | "spo2"
  | "respirationRate"
  | "temperature"
  | "temperatureComment";

/** DV_TEXT fields edited as native Automerge text, not whole-value replacements. */
export const LONG_TEXT_FIELDS = [
  "clinicalDescription",
  "comment",
  "temperatureComment",
] as const;
export type LongTextField = typeof LONG_TEXT_FIELDS[number];

export function isLongText(field: Field): field is LongTextField {
  return (LONG_TEXT_FIELDS as readonly string[]).includes(field);
}

const CLINICAL_DESCRIPTION =
  "Symptoms began yesterday evening with a sore throat and a dry cough.\nThe patient is comfortable at rest and drinking well.\n\nNo chest pain. Follow-up is planned in two days if the fever persists.";
const DIAGNOSIS_COMMENT =
  "Synthetic additional comment. Household contacts have similar symptoms.\nThis note is not the diagnosis name.";
const TEMPERATURE_COMMENT =
  "Oral measurement. The room was warm.\nSynthetic example only.";
const DIAGNOSIS_NAME = "Suspected viral upper respiratory infection";
export interface FieldBinding {
  target: string;
  path: string;
}
export interface DemoClone {
  caller: MultiCaller;
  id: string;
  username: string;
  author: { id: string; name: string };
  profile: DelayProfile;
  minDelay: number;
  maxDelay: number;
}
export interface DemoSession {
  template: BoundTemplate;
  validator: DraftValidator;
  draftId: string;
  fields: Record<Field, FieldBinding>;
  clones: DemoClone[];
}

type Node = { [key: string]: unknown };
function nodeIn(tree: unknown, predicate: (node: Node) => boolean): Node {
  function visit(value: unknown): Node | undefined {
    if (!value || typeof value !== "object") return;
    if (!Array.isArray(value) && predicate(value as Node)) return value as Node;
    for (const child of Object.values(value)) {
      const found = visit(child);
      if (found) return found;
    }
  }
  const found = visit(tree);
  if (!found) {
    throw new Error("The demo field is absent from its bound template");
  }
  return found;
}
function key(node: Node): string {
  const uid = (node.uid as { value: string }).value;
  return uid.slice(uid.indexOf("::") + 2);
}
function binding(
  tree: unknown,
  archetype: string,
  element: string,
  path: string,
): FieldBinding {
  const entry = nodeIn(tree, (n) => n.archetype_node_id === archetype);
  return {
    target: key(
      nodeIn(
        entry,
        (n) => n._type === "ELEMENT" && n.archetype_node_id === element,
      ),
    ),
    path,
  };
}

export function delayFor(clone: DemoClone): number {
  return Math.round(
    clone.minDelay + Math.random() * (clone.maxDelay - clone.minDelay),
  );
}
export function setProfile(clone: DemoClone, profile: DelayProfile): void {
  clone.profile = profile;
  const base = DELAY_PROFILES[profile];
  // Each clone has its own slightly different range, not a single global timer.
  const factor = 0.8 + Math.random() * 0.4;
  clone.minDelay = Math.round(base.min * factor);
  clone.maxDelay = Math.round(base.max * factor);
}
function makeClone(
  bytes?: Uint8Array,
  buildId?: string,
  inUse: Iterable<string> = [],
): DemoClone {
  const id = `c${crypto.randomUUID().replaceAll("-", "")}`;
  const username = allocateDemoUsername(new Set(inUse));
  const author = { id, name: username };
  const clone: DemoClone = {
    id,
    username,
    author,
    profile: "office",
    minDelay: 0,
    maxDelay: 0,
    caller: createMultiCaller({ author, replica: id }, {
      bytes,
      buildId,
    }),
  };
  const profiles = Object.keys(DELAY_PROFILES) as DelayProfile[];
  setProfile(clone, profiles[Math.floor(Math.random() * profiles.length)]);
  return clone;
}

function parentKeyOf(
  tree: unknown,
  archetype: string,
  anchorId: string,
): string {
  const entry = nodeIn(tree, (n) => n.archetype_node_id === archetype);
  const anchor = nodeIn(
    entry,
    (n) => n._type === "ELEMENT" && n.archetype_node_id === anchorId,
  );
  let found: string | undefined;
  function visit(value: unknown): void {
    if (!value || typeof value !== "object" || found) return;
    const rec = value as Node;
    if (Array.isArray(rec.items) && rec.items.includes(anchor)) {
      found = key(rec);
      return;
    }
    for (const child of Object.values(rec)) {
      if (Array.isArray(child)) child.forEach(visit);
      else visit(child);
    }
  }
  visit(entry);
  if (!found) {
    throw new Error(`No parent item list for ${archetype} ${anchorId}`);
  }
  return found;
}

function ensureTextElement(
  build: DemoClone["caller"]["build"],
  draftId: string,
  spec: {
    archetype: string;
    anchor: string;
    nodeId: string;
    label: string;
    text: string;
  },
): void {
  const tree = build.toCanonicalJson(draftId);
  const entry = nodeIn(tree, (n) => n.archetype_node_id === spec.archetype);
  const existing = (() => {
    try {
      return nodeIn(
        entry,
        (n) => n._type === "ELEMENT" && n.archetype_node_id === spec.nodeId,
      );
    } catch {
      return undefined;
    }
  })();
  if (existing) {
    build.setValue(draftId, key(existing), "value/value", spec.text, {
      rev: build.logRev(),
    });
    return;
  }
  build.addInstance(draftId, parentKeyOf(tree, spec.archetype, spec.anchor), "items", {
    _type: "ELEMENT",
    archetype_node_id: spec.nodeId,
    name: { _type: "DV_TEXT", value: spec.label },
    value: { _type: "DV_TEXT", value: spec.text },
  });
}

export async function createDemoSession(
  optText: string,
  wtText: string,
): Promise<DemoSession> {
  const template = await bindTemplate(optText);
  const wt = parseWebTemplate(wtText);
  if (wt.templateId !== template.binding.templateId) {
    throw new Error("OPT / Web Template mismatch");
  }
  const clone = makeClone();
  const { build } = clone.caller;
  const draftId = build.newComposition(template, {
    language: "en",
    territory: "SE",
  });
  const root = wt.tree.id;
  // These are deliberately hand-selected WT paths. The UI is not generated.
  const vitals = `${root}/vital_signs`;
  const composition = deserializeFromFlat({
    "ctx/language": "en",
    "ctx/territory": "SE",
    [`${vitals}/blood_pressure/any_event:0/systolic|magnitude`]: 120,
    [`${vitals}/blood_pressure/any_event:0/systolic|unit`]: "mm[Hg]",
    [`${vitals}/blood_pressure/any_event:0/diastolic|magnitude`]: 80,
    [`${vitals}/blood_pressure/any_event:0/diastolic|unit`]: "mm[Hg]",
    [`${vitals}/pulse_heart_beat/any_event:0/rate|magnitude`]: 72,
    [`${vitals}/pulse_heart_beat/any_event:0/rate|unit`]: "/min",
    [`${vitals}/respiration/any_event:0/rate|magnitude`]: 16,
    [`${vitals}/respiration/any_event:0/rate|unit`]: "/min",
    [`${vitals}/body_temperature/any_event:0/temperature|magnitude`]: 36.8,
    [`${vitals}/body_temperature/any_event:0/temperature|unit`]: "Cel",
    [`${vitals}/pulse_oximetry/any_event:0/spo|numerator`]: 98,
    [`${vitals}/pulse_oximetry/any_event:0/spo|denominator`]: 100,
  }, wt);
  const section = nodeIn(composition, (n) => n._type === "SECTION");
  // The source WT omits the percentage discriminator: RM pk_percent = 2.
  nodeIn(section, (n) => n._type === "DV_PROPORTION").type = 2;
  build.addInstance(
    draftId,
    ROOT_TARGET,
    "content",
    section as Parameters<typeof build.addInstance>[3],
  );
  build.setComposer(draftId, {
    _type: "PARTY_IDENTIFIED",
    name: "Demo clinical team",
  });
  build.setValue(
    draftId,
    ROOT_TARGET,
    "context/start_time/value",
    new Date().toISOString(),
    { rev: build.logRev() },
  );
  ensureTextElement(build, draftId, {
    archetype: "openEHR-EHR-EVALUATION.problem_diagnosis.v1",
    anchor: "at0002",
    nodeId: "at0009",
    label: "Clinical description",
    text: CLINICAL_DESCRIPTION,
  });
  ensureTextElement(build, draftId, {
    archetype: "openEHR-EHR-EVALUATION.problem_diagnosis.v1",
    anchor: "at0002",
    nodeId: "at0069",
    label: "Comment",
    text: DIAGNOSIS_COMMENT,
  });
  ensureTextElement(build, draftId, {
    archetype: "openEHR-EHR-OBSERVATION.body_temperature.v2",
    anchor: "at0004",
    nodeId: "at0063",
    label: "Comment",
    text: TEMPERATURE_COMMENT,
  });
  const tree = build.toCanonicalJson(draftId);
  const diagnosis = "openEHR-EHR-EVALUATION.problem_diagnosis.v1";
  const bp = "openEHR-EHR-OBSERVATION.blood_pressure.v2";
  const fields: Record<Field, FieldBinding> = {
    diagnosisName: binding(tree, diagnosis, "at0002", "value/value"),
    clinicalDescription: binding(tree, diagnosis, "at0009", "value/value"),
    comment: binding(tree, diagnosis, "at0069", "value/value"),
    systolic: binding(tree, bp, "at0004", "value/magnitude"),
    diastolic: binding(tree, bp, "at0005", "value/magnitude"),
    pulse: binding(
      tree,
      "openEHR-EHR-OBSERVATION.pulse.v2",
      "at0004",
      "value/magnitude",
    ),
    respirationRate: binding(
      tree,
      "openEHR-EHR-OBSERVATION.respiration.v2",
      "at0004",
      "value/magnitude",
    ),
    temperature: binding(
      tree,
      "openEHR-EHR-OBSERVATION.body_temperature.v2",
      "at0004",
      "value/magnitude",
    ),
    temperatureComment: binding(
      tree,
      "openEHR-EHR-OBSERVATION.body_temperature.v2",
      "at0063",
      "value/value",
    ),
    spo2: binding(
      tree,
      "openEHR-EHR-OBSERVATION.pulse_oximetry.v1",
      "at0006",
      "value/numerator",
    ),
  };
  build.setValue(
    draftId,
    fields.diagnosisName.target,
    fields.diagnosisName.path,
    DIAGNOSIS_NAME,
    { rev: build.logRev() },
  );
  for (const field of LONG_TEXT_FIELDS) {
    const f = fields[field];
    clone.caller.adapter.seedText(
      draftId,
      f.target,
      f.path,
      String(readField({ draftId, fields }, clone, field)),
    );
  }
  const session = {
    template,
    validator: await DraftValidator.create(),
    draftId,
    fields,
    clones: [clone],
  };
  addClone(session);
  // Make the initial split visibly illustrate different links.
  setProfile(session.clones[0], "office");
  setProfile(session.clones[1], "rural");
  return session;
}

export function addClone(session: DemoSession): DemoClone {
  const source = session.clones[0].caller;
  const clone = makeClone(
    source.adapter.save(),
    source.build.buildId,
    session.clones.map((c) => c.username),
  );
  session.clones.push(clone);
  return clone;
}

export function readField(
  session: Pick<DemoSession, "draftId" | "fields">,
  clone: DemoClone,
  field: Field,
): string | number {
  const f = session.fields[field];
  if (isLongText(field)) {
    const text = clone.caller.adapter.nativeText(
      session.draftId,
      f.target,
      f.path,
    );
    if (text !== undefined) return text;
  }
  const node = nodeIn(
    clone.caller.build.toCanonicalJson(session.draftId),
    (n) =>
      typeof (n.uid as { value?: string } | undefined)?.value === "string" &&
      key(n) === f.target,
  );
  let value: unknown = node;
  for (const seg of f.path.split("/")) value = (value as Node)[seg];
  return value as string | number;
}

export function writeField(
  session: DemoSession,
  clone: DemoClone,
  field: Field,
  value: string | number,
  rev = clone.caller.build.logRev(),
): void {
  const f = session.fields[field];
  if (readField(session, clone, field) === value) return;
  const options = { rev, author: { id: clone.id, name: clone.username } };
  if (!isLongText(field)) {
    clone.caller.build.setValue(
      session.draftId,
      f.target,
      f.path,
      value,
      options,
    );
    return;
  }
  const before = Array.from(String(readField(session, clone, field)));
  const after = Array.from(String(value));
  let at = 0;
  while (at < before.length && at < after.length && before[at] === after[at]) {
    at++;
  }
  let end = 0;
  while (
    end < before.length - at && end < after.length - at &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  ) end++;
  clone.caller.build.editText(session.draftId, f.target, f.path, {
    at,
    delete: before.length - at - end,
    insert: after.slice(at, after.length - end).join(""),
  }, options);
}

/** Receive an independent saved Automerge snapshot; never share a mutable build. */
export function receive(
  session: DemoSession,
  clone: DemoClone,
  bytes: Uint8Array,
): boolean {
  mergeCaller(clone.caller, AutomergeOperationLogAdapter.load(bytes));
  let changed = false;
  for (const field of LONG_TEXT_FIELDS) {
    const f = session.fields[field];
    if (recordNativeText(clone.caller, session.draftId, f.target, f.path)) {
      changed = true;
    }
  }
  return changed;
}

/** Preparation compacts text: do it on an isolated replay, NOT the live CRDT. */
export async function preparePreview(
  session: DemoSession,
  clone: DemoClone,
  creatingSystemId = "demo.cdr.local",
) {
  const { build } = createMultiCaller({
    author: { id: clone.id, name: clone.username },
    replica: clone.id,
  }, {
    bytes: clone.caller.adapter.save(),
    buildId: clone.caller.build.buildId,
  });
  build.setComposer(session.draftId, {
    _type: "PARTY_IDENTIFIED",
    name: clone.username,
  });
  return await prepareContribution(build, session.validator, {
    systemId: "ehrtslib.demo",
    crdtLibrary: { name: "automerge", version: "3.0.0" },
  }, {
    drafts: [{ draftId: session.draftId, template: session.template }],
    committer: { _type: "PARTY_IDENTIFIED", name: clone.username },
    creatingSystemId,
    originatingSystemAudit: {
      _type: "FEEDER_AUDIT_DETAILS",
      system_id: "ehrtslib.demo.hand-coded-form",
    },
  });
}

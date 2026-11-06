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

export const USERNAMES = [
  "nurse.anna",
  "dr.berg",
  "midwife.chen",
  "gp.dalton",
  "physio.ek",
  "student.falk",
  "consultant.green",
  "paramedic.holm",
  "dietitian.iris",
  "oncology.johansson",
  "cardio.khan",
  "ward.clerk.lind",
  "anesthetist.mori",
  "radiologist.nguyen",
  "psych.olsson",
] as const;

export const DELAY_PROFILES = {
  office: { label: "Office LAN", min: 80, max: 350 },
  ward: { label: "Ward Wi-Fi", min: 400, max: 1600 },
  rural: { label: "Rural phone", min: 2500, max: 7000 },
} as const;
export type DelayProfile = keyof typeof DELAY_PROFILES;
export type Field =
  | "heading"
  | "narrative"
  | "systolic"
  | "diastolic"
  | "pulse"
  | "spo2";
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

export function suggestUsername(): string {
  return USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
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
function makeClone(bytes?: Uint8Array, buildId?: string): DemoClone {
  const id = `c${crypto.randomUUID().replaceAll("-", "")}`;
  const username = suggestUsername();
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
  const tree = build.toCanonicalJson(draftId);
  const diagnosis = "openEHR-EHR-EVALUATION.problem_diagnosis.v1";
  const bp = "openEHR-EHR-OBSERVATION.blood_pressure.v2";
  const fields: Record<Field, FieldBinding> = {
    heading: {
      target: key(nodeIn(tree, (n) => n.archetype_node_id === diagnosis)),
      path: "name/value",
    },
    narrative: binding(tree, diagnosis, "at0002", "value/value"),
    systolic: binding(tree, bp, "at0004", "value/magnitude"),
    diastolic: binding(tree, bp, "at0005", "value/magnitude"),
    pulse: binding(
      tree,
      "openEHR-EHR-OBSERVATION.pulse.v2",
      "at0004",
      "value/magnitude",
    ),
    spo2: binding(
      tree,
      "openEHR-EHR-OBSERVATION.pulse_oximetry.v1",
      "at0006",
      "value/numerator",
    ),
  };
  for (
    const [field, value] of [["heading", "Suspected viral infection"], [
      "narrative",
      "Synthetic example. Symptoms started yesterday.\nPatient is comfortable at rest. Follow-up planned.",
    ]] as const
  ) {
    const f = fields[field];
    build.setValue(draftId, f.target, f.path, value, { rev: build.logRev() });
  }
  const f = fields.narrative;
  clone.caller.adapter.seedText(
    draftId,
    f.target,
    f.path,
    String(readField({ draftId, fields }, clone, "narrative")),
  );
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
  const clone = makeClone(source.adapter.save(), source.build.buildId);
  session.clones.push(clone);
  return clone;
}

export function readField(
  session: Pick<DemoSession, "draftId" | "fields">,
  clone: DemoClone,
  field: Field,
): string | number {
  const f = session.fields[field];
  if (field === "narrative") {
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
  if (field !== "narrative") {
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
  const f = session.fields.narrative;
  return recordNativeText(clone.caller, session.draftId, f.target, f.path);
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

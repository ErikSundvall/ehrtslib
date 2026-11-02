/**
 * Validation state while a draft is edited (ADR 0008, ADR 0013, #173).
 *
 * Derived from the log and the bound template. It is not written to the log.
 * A quick check after each operation marks changed nodes; it never rejects
 * the edit. {@link DraftValidationState} is the build summary.
 */

import { EHRTSLIB_VERSION } from "../version.ts";
import type { BoundTemplate } from "./template_binding.ts";
import type { ContributionBuild } from "./contribution_build.ts";
import type { ValidationTracker } from "./contribution_build.ts";
import type { DraftProblem, DraftValidator } from "./draft_validation.ts";
import type { CbOperation } from "./operation_log.ts";

export const CB_VALIDATOR_ID = "ehrtslib-draft-validator";

/** Known CDR behaviour for an incomplete (553) version with missing template content. */
export interface CdrIncompleteProfile {
  id: string;
  /** Version this note was checked against. */
  version: string;
  /** True when the CDR rejects mandatory template content that is still missing. */
  rejectsIncompleteWithMissingMandatory: boolean;
  note: string;
}

/**
 * EHRbase 2.36 rejects (ehrbase#1630). FerroEHR 5.4.1 accepts.
 * Other servers are not listed; the caller can pass their own profile.
 */
export const CDR_INCOMPLETE_PROFILES: readonly CdrIncompleteProfile[] = [
  {
    id: "ehrbase",
    version: "2.36",
    rejectsIncompleteWithMissingMandatory: true,
    note:
      "EHRbase 2.36 rejects an incomplete version that misses mandatory template content (ehrbase#1630).",
  },
  {
    id: "ferroehr",
    version: "5.4.1",
    rejectsIncompleteWithMissingMandatory: false,
    note:
      "FerroEHR 5.4.1 accepts an incomplete version that misses mandatory template content.",
  },
];

export interface NodeValidationMark {
  node: string;
  uid?: string;
  /** `unfinished`: required content is absent. `invalid`: a present value breaks a constraint. */
  status: "unfinished" | "invalid";
  problems: DraftProblem[];
}

export interface CdrCommitAdvice extends CdrIncompleteProfile {
  canCommitIncomplete: boolean;
}

export interface DraftValidationState {
  draftId: string;
  /** Log position this state was computed at (`replica:seq`, or `"0"`). */
  rev: string;
  validatorId: string;
  validatorVersion: string;
  /**
   * False on a peer or an offline preview. The hub, or the committing peer
   * when there is no hub, is authoritative (ADR 0013).
   */
  authoritative: boolean;
  nodes: NodeValidationMark[];
  canCommitComplete: boolean;
  /** RM rule: missing template content is allowed; invalid content is not. */
  canCommitIncomplete: boolean;
  cdr: CdrCommitAdvice[];
}

export interface ValidationTrackOptions {
  authoritative?: boolean;
  validatorId?: string;
  validatorVersion?: string;
  /** Defaults to {@link CDR_INCOMPLETE_PROFILES}. */
  cdrProfiles?: readonly CdrIncompleteProfile[];
}

/**
 * Follow a build. Call {@link ContributionBuild.trackValidation} with the
 * result. Templates are matched by binding hash.
 */
export function trackValidation(
  validator: DraftValidator,
  templates: readonly BoundTemplate[],
  options: ValidationTrackOptions = {},
): ValidationTracker {
  const byHash = new Map(
    templates.map((t) => [t.binding.hash.value, t]),
  );
  const quick = new Map<string, NodeValidationMark[]>();
  const profiles = options.cdrProfiles ?? CDR_INCOMPLETE_PROFILES;
  const validatorId = options.validatorId ?? CB_VALIDATOR_ID;
  const validatorVersion = options.validatorVersion ?? EHRTSLIB_VERSION;
  const authoritative = options.authoritative === true;

  const templateFor = (build: ContributionBuild, draftId: string) => {
    const hash = build.getDraft(draftId).templateBinding.hash.value;
    return byHash.get(hash);
  };

  return {
    note(build, op) {
      const template = templateFor(build, op.draft);
      if (!template || op.draft === "*") return;
      const keys = changedNodeKeys(op);
      if (!keys.length) return;
      const problems = validator.quickValueProblems(
        build,
        op.draft,
        template,
        keys,
      );
      const marks = new Map<string, NodeValidationMark>();
      for (const key of keys) {
        const mine = problems.filter((p) => p.node === key || p.uid === key);
        if (!mine.length) continue;
        marks.set(key, {
          node: key,
          ...(mine[0].uid ? { uid: mine[0].uid } : {}),
          status: "invalid",
          problems: mine,
        });
      }
      quick.set(op.draft, [...marks.values()]);
    },
    state(build, draftId): DraftValidationState {
      const template = templateFor(build, draftId);
      if (!template) {
        throw new Error(
          `No template registered for draft ${draftId}; pass it to trackValidation`,
        );
      }
      const complete = validator.validate(build, draftId, template, {
        mode: "complete",
      });
      const incomplete = validator.validate(build, draftId, template, {
        mode: "incomplete",
      });
      const byNode = new Map<string, NodeValidationMark>();
      const add = (p: DraftProblem, status: "unfinished" | "invalid") => {
        const prev = byNode.get(p.node);
        const problems = prev ? [...prev.problems, p] : [p];
        const next: NodeValidationMark["status"] =
          status === "invalid" || prev?.status === "invalid"
            ? "invalid"
            : "unfinished";
        const mark: NodeValidationMark = {
          node: p.node,
          status: next,
          problems,
        };
        if (p.uid) mark.uid = p.uid;
        else if (prev?.uid) mark.uid = prev.uid;
        byNode.set(p.node, mark);
      };
      for (const p of complete.missing) add(p, "unfinished");
      for (const p of [...complete.errors, ...incomplete.errors]) {
        if (p.kind === "invalid") add(p, "invalid");
      }
      // Quick check wins for a node it marked, when the full pass agrees it is invalid.
      for (const mark of quick.get(draftId) ?? []) {
        if (mark.status !== "invalid") continue;
        const prev = byNode.get(mark.node);
        if (prev?.status === "invalid") continue;
        if (mark.problems.length) byNode.set(mark.node, mark);
      }
      const nodes = [...byNode.values()].sort((a, b) =>
        a.node < b.node ? -1 : a.node > b.node ? 1 : 0
      );
      const unfinished = nodes.some((n) => n.status === "unfinished");
      const canCommitIncomplete = incomplete.valid;
      return {
        draftId,
        rev: build.logRev(),
        validatorId,
        validatorVersion,
        authoritative,
        nodes,
        canCommitComplete: complete.valid,
        canCommitIncomplete,
        cdr: profiles.map((profile) => ({
          ...profile,
          canCommitIncomplete: canCommitIncomplete &&
            !(profile.rejectsIncompleteWithMissingMandatory && unfinished),
        })),
      };
    },
  };
}

function changedNodeKeys(op: CbOperation): string[] {
  switch (op.type) {
    case "set-value":
    case "edit-text":
    case "remove-instance":
    case "move-instance":
    case "set-participation":
      return [op.target];
    case "add-instance":
      return op.keys.length ? [op.keys[0]] : [op.parent];
    case "assign-uid":
      return [op.key];
    case "set-composer":
    case "import":
    case "set-lifecycle":
      return ["root"];
    default:
      return [];
  }
}

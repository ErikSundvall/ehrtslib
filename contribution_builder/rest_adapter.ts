/**
 * Single-caller REST adapter for the openEHR REST ITS (ADR 0010): sends a
 * prepared contribution to `POST /ehr/{ehr_id}/contribution` on any
 * conformant CDR. `fetch` is injectable (tests, auth, proxies).
 */

import type {
  ContributionBuild,
  LoadVersionOptions,
} from "./contribution_build.ts";
import { type ConflictReport, detectConflicts } from "./conflicts.ts";
import type { OperationAuthor } from "./operation_log.ts";
import type { BoundTemplate } from "./template_binding.ts";
import type { DraftValidator } from "./draft_validation.ts";
import {
  type CommitConfig,
  prepareContribution,
  type PrepareContributionOptions,
  type PreparedContribution,
} from "./commit.ts";
import type { RmJson } from "./operation_log.ts";

export interface ItsRestAdapterOptions {
  /** REST ITS base URL, e.g. `https://cdr.example.org/rest/openehr/v1`. */
  baseUrl: string;
  /** Default `globalThis.fetch`. */
  fetch?: typeof fetch;
  /** Extra headers on every request (for example `Authorization`). */
  headers?: Record<string, string>;
}

/**
 * A commit failed and at least one updated object has a newer version than
 * the draft's base. `reports` holds the conflict data (ADR 0009).
 */
export class CommitConflictError extends Error {
  constructor(
    readonly reports: ConflictReport[],
    readonly cause: ItsRestError,
  ) {
    super(
      `Commit conflict: ${
        reports.map((r) =>
          `${r.draftId} based on ${r.baseVersionUid}, latest ${r.latestVersionUid} (${r.conflicts.length} conflicting operations)`
        ).join("; ")
      }`,
    );
    this.name = "CommitConflictError";
  }
}

export class ItsRestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody: string,
  ) {
    super(message);
    this.name = "ItsRestError";
  }
}

export interface CommitResult {
  prepared: PreparedContribution;
  /** Contribution uid from the server (body or `Location`/`ETag`), if given. */
  contributionUid?: string;
  /** HTTP status of the POST. */
  status: number;
  /** Parsed response body, when the server returned JSON. */
  response?: RmJson;
  /**
   * Version uids as stored, in draft order (from the response's
   * `versions`; the prepared uid when the server did not return them).
   */
  versionUids: string[];
  /**
   * True when the server replaced the sent versioned-object uuid. Inner node
   * uids then still start with the provisional uuid (a warning is added).
   */
  serverAssignedUids: boolean;
  warnings: string[];
}

export class ItsRestContributionAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly headers: Record<string, string>;

  constructor(options: ItsRestAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.headers = options.headers ?? {};
  }

  /** `EHR.system_id` of an EHR: the CDR's id, used as `creating_system_id`. */
  async systemId(ehrId: string): Promise<string> {
    const ehr = await this.getJson(`/ehr/${encodeURIComponent(ehrId)}`) as {
      system_id?: { value?: string };
    };
    const id = ehr?.system_id?.value;
    if (!id) throw new ItsRestError("EHR has no system_id", 200, "");
    return id;
  }

  /** POST a prepared `NewContribution` body. */
  async postContribution(
    ehrId: string,
    prepared: PreparedContribution,
  ): Promise<CommitResult> {
    const res = await this.fetchFn(
      `${this.baseUrl}/ehr/${encodeURIComponent(ehrId)}/contribution`,
      {
        method: "POST",
        headers: {
          ...this.headers,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(prepared.body),
      },
    );
    const text = await res.text();
    if (!res.ok) {
      throw new ItsRestError(
        `POST contribution failed: ${res.status} ${text.slice(0, 500)}`,
        res.status,
        text,
      );
    }
    let response: RmJson | undefined;
    try {
      response = text ? JSON.parse(text) : undefined;
    } catch {
      response = undefined;
    }
    const fromBody = (response as { uid?: { value?: string } } | undefined)
      ?.uid?.value;
    const location = res.headers.get("Location") ?? "";
    const etag = res.headers.get("ETag")?.replace(/^W\//, "").replace(
      /"/g,
      "",
    );
    const refs = (response as
      | { versions?: Array<{ id?: { value?: string } }> }
      | undefined)
      ?.versions;
    const sent = prepared.versions.map((v) => v.versionUid);
    const versionUids = sent.map((uid, i) => refs?.[i]?.id?.value ?? uid);
    const objectId = (uid: string) => uid.split("::")[0];
    const serverAssignedUids = versionUids.some((uid, i) =>
      objectId(uid) !== objectId(sent[i])
    );
    const warnings = [...prepared.warnings];
    if (serverAssignedUids) {
      warnings.push(
        "The server assigned its own versioned-object uuid; inner node uids keep the provisional uuid as prefix",
      );
    }
    return {
      prepared,
      status: res.status,
      response,
      versionUids,
      serverAssignedUids,
      warnings,
      contributionUid: fromBody ?? (etag || location.split("/").pop()) ??
        undefined,
    };
  }

  /**
   * Validate, prepare and POST in one step. Reads the CDR's system id from
   * the EHR unless `creatingSystemId` is given. No request is sent when
   * preparation fails.
   */
  async commit(
    build: ContributionBuild,
    validator: DraftValidator,
    config: CommitConfig,
    ehrId: string,
    options: Omit<PrepareContributionOptions, "creatingSystemId"> & {
      creatingSystemId?: string;
      /** Author of the `record-commit` operation; default the build's author. */
      recordAs?: OperationAuthor;
    },
  ): Promise<CommitResult> {
    // Local checks first, so a bad build never reaches the server.
    const probe = await prepareContribution(build, validator, config, {
      ...options,
      creatingSystemId: options.creatingSystemId ?? "local.check",
    });
    const prepared = options.creatingSystemId
      ? probe
      : await prepareContribution(
        build,
        validator,
        config,
        { ...options, creatingSystemId: await this.systemId(ehrId) },
      );
    let result: CommitResult;
    try {
      result = await this.postContribution(ehrId, prepared);
    } catch (e) {
      if (!(e instanceof ItsRestError)) throw e;
      // Status-independent conflict check (ADR 0009): re-read the latest
      // version of every updated object; the status code is only a hint.
      const reports: ConflictReport[] = [];
      for (const v of prepared.versions) {
        if (!v.precedingVersionUid) continue;
        const latest = await this.getComposition(
          ehrId,
          v.precedingVersionUid.split("::")[0],
        );
        const report = detectConflicts(build, v.draftId, latest, {
          statusHint: e.status,
        });
        if (report) reports.push(report);
      }
      if (reports.length) throw new CommitConflictError(reports, e);
      throw e;
    }
    // Record the commit in the log (#177): blocks a second commit of the draft.
    prepared.versions.forEach((v, i) => {
      build.recordCommit(v.draftId, {
        versionUid: result.versionUids[i],
        ...(result.contributionUid
          ? { contributionUid: result.contributionUid }
          : {}),
        changeType: v.changeType,
        lifecycleState: v.lifecycleState,
        logSha256: prepared.logSha256,
      }, options.recordAs ? { author: options.recordAs } : {});
    });
    return result;
  }

  /**
   * update-version: read the latest version of a versioned object (or the
   * given version) and open a modify draft on it.
   */
  async updateVersion(
    build: ContributionBuild,
    template: BoundTemplate,
    ehrId: string,
    uid: string,
    options: LoadVersionOptions = {},
  ): Promise<string> {
    const stored = await this.getComposition(ehrId, uid);
    return build.openVersion(template, stored, options);
  }

  /** copy-version: read a version and start a new versioned object from its content. */
  async copyVersion(
    build: ContributionBuild,
    template: BoundTemplate,
    ehrId: string,
    uid: string,
    options: LoadVersionOptions = {},
  ): Promise<string> {
    const stored = await this.getComposition(ehrId, uid);
    return build.copyVersion(template, stored, options);
  }

  /**
   * GET a COMPOSITION: by version uid, or by versioned-object uuid for the
   * latest version.
   */
  getComposition(ehrId: string, versionUid: string): Promise<RmJson> {
    return this.getJson(
      `/ehr/${encodeURIComponent(ehrId)}/composition/${
        encodeURIComponent(versionUid)
      }`,
    );
  }

  /** GET a contribution by uid. */
  getContribution(ehrId: string, contributionUid: string): Promise<RmJson> {
    return this.getJson(
      `/ehr/${encodeURIComponent(ehrId)}/contribution/${
        encodeURIComponent(contributionUid)
      }`,
    );
  }

  private async getJson(path: string): Promise<RmJson> {
    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      headers: { ...this.headers, Accept: "application/json" },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new ItsRestError(
        `GET ${path} failed: ${res.status} ${text.slice(0, 500)}`,
        res.status,
        text,
      );
    }
    return JSON.parse(text);
  }
}

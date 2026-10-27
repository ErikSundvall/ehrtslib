/**
 * Single-app REST adapter for the openEHR REST ITS (ADR 0010): sends a
 * prepared contribution to `POST /ehr/{ehr_id}/contribution` on any
 * conformant CDR. `fetch` is injectable (tests, auth, proxies).
 */

import type { ContributionBuild } from "./contribution_build.ts";
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
    },
  ): Promise<CommitResult> {
    // Local checks first, so a bad build never reaches the server.
    const probe = await prepareContribution(build, validator, config, {
      ...options,
      creatingSystemId: options.creatingSystemId ?? "local.check",
    });
    if (options.creatingSystemId) {
      return this.postContribution(ehrId, probe);
    }
    const creatingSystemId = await this.systemId(ehrId);
    const prepared = await prepareContribution(build, validator, config, {
      ...options,
      creatingSystemId,
    });
    return this.postContribution(ehrId, prepared);
  }

  /** GET a COMPOSITION version by its version uid. */
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

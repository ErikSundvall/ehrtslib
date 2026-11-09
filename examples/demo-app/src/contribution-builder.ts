/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { ItsRestContributionAdapter } from "../../../contribution_builder/mod.ts";
import {
  addClone,
  createDemoSession,
  DELAY_PROFILES,
  delayFor,
  type DelayProfile,
  type DemoClone,
  type DemoSession,
  type Field,
  preparePreview,
  readField,
  receive,
  setProfile,
  writeField,
} from "./contribution-demo.ts";
import {
  applyWireMessage,
  DEFAULT_PRESENCE_CONFIG,
  type LivePresenceState,
  PresenceView,
  type PresenceWireMessage,
} from "./cb-presence.ts";
import { ensurePresenceHosts, paintPresenceBadges } from "./cb-presence-ui.ts";

const PRESENCE_FIELDS: Field[] = [
  "heading",
  "narrative",
  "systolic",
  "diastolic",
  "pulse",
  "spo2",
];
const PRESENCE_BEAT_MS = 2_500;

const $ = <T extends HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T => {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`Missing demo element ${selector}`);
  return node;
};
const status = $("#status");
const panels = new Map<string, HTMLElement>();
const channels = new Map<string, MessageChannel>();
type Timer = ReturnType<typeof globalThis.setTimeout>;
const timers = new Set<Timer>();
const sending = new Map<string, Timer>();
interface LogPacket {
  epoch: number;
  kind: "log";
  bytes: Uint8Array;
  recipients: string[];
}
interface PresencePacket {
  epoch: number;
  kind: "presence";
  message: PresenceWireMessage;
  recipients: string[];
}
type Packet = LogPacket | PresencePacket;
let epoch = 0;
let inFlight = 0;
const composing = new Set<string>();
const deferred = new Map<string, Uint8Array[]>();
let session: DemoSession;
let busy = false;
let sent = false;
const presenceViews = new Map<string, PresenceView>();
const presenceHosts = new Map<string, Map<Field, HTMLElement>>();
const presenceBeats = new Map<string, ReturnType<typeof globalThis.setInterval>>();
const presenceFocus = new Map<string, { field: Field; state: LivePresenceState }>();
let presenceClock = 0;
let presenceTicker: ReturnType<typeof globalThis.setInterval> | undefined;

function later(fn: () => void, ms: number): Timer {
  const timer = globalThis.setTimeout(() => {
    timers.delete(timer);
    fn();
    renderSync();
  }, ms);
  timers.add(timer);
  renderSync();
  return timer;
}
function authorError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
function feedback(clone: DemoClone, text: string, error = false): void {
  const el = $(".feedback", panels.get(clone.id)!);
  el.textContent = text;
  el.classList.toggle("error", error);
}
function nowMs(): number {
  return Date.now();
}
function broadcastPresence(
  clone: DemoClone,
  message: PresenceWireMessage,
): void {
  const recipients = session.clones.filter((peer) => peer.id !== clone.id)
    .map((peer) => peer.id);
  if (!recipients.length) return;
  const channel = channels.get(clone.id);
  if (!channel) return;
  inFlight += recipients.length;
  channel.port2.postMessage({
    epoch,
    kind: "presence",
    message,
    recipients,
  } satisfies PresencePacket);
}
function emitPresence(
  clone: DemoClone,
  field: Field | null,
  state: LivePresenceState,
): void {
  const atMs = nowMs();
  broadcastPresence(clone, {
    t: "heartbeat",
    userId: clone.id,
    name: clone.username,
    field,
    state,
    atMs,
  });
  const focus = field ? { field, state } : undefined;
  if (focus) presenceFocus.set(clone.id, focus);
  else presenceFocus.delete(clone.id);
}
function stopPresenceBeat(cloneId: string): void {
  const timer = presenceBeats.get(cloneId);
  if (timer !== undefined) {
    clearInterval(timer);
    presenceBeats.delete(cloneId);
    timers.delete(timer);
  }
}
function startPresenceBeat(clone: DemoClone): void {
  stopPresenceBeat(clone.id);
  const timer = globalThis.setInterval(() => {
    const focus = presenceFocus.get(clone.id);
    if (!focus || busy || sent) return;
    emitPresence(clone, focus.field, focus.state);
  }, PRESENCE_BEAT_MS);
  presenceBeats.set(clone.id, timer);
  timers.add(timer);
}
function applyPresence(clone: DemoClone, message: PresenceWireMessage): void {
  const view = presenceViews.get(clone.id);
  if (!view) return;
  applyWireMessage(view, message);
  renderPresence(clone);
}
function renderAllPresence(): void {
  presenceClock = nowMs();
  for (const clone of session.clones) renderPresence(clone);
}
function renderPresence(clone: DemoClone): void {
  const hosts = presenceHosts.get(clone.id);
  const view = presenceViews.get(clone.id);
  if (!hosts || !view) return;
  paintPresenceBadges(hosts, view, presenceClock || nowMs());
}
function ensurePresenceTicker(): void {
  if (presenceTicker !== undefined) return;
  presenceTicker = globalThis.setInterval(renderAllPresence, 800);
  timers.add(presenceTicker);
}
function applyIncoming(clone: DemoClone, bytes: Uint8Array): void {
  if (composing.has(clone.id)) {
    const queue = deferred.get(clone.id) ?? [];
    queue.push(bytes);
    deferred.set(clone.id, queue);
    return;
  }
  try {
    // Reconciliation writes are themselves audited operations. Exchange them too.
    if (receive(session, clone, bytes)) schedule(clone);
    render(clone);
  } catch (error) {
    feedback(clone, authorError(error), true);
  }
}
function connect(clone: DemoClone): void {
  // Real postMessage transport: every clone has an independent port/build.
  const channel = new MessageChannel();
  channels.set(clone.id, channel);
  channel.port1.onmessage = (event: MessageEvent<Packet>) => {
    if (event.data.epoch !== epoch) return;
    for (const id of event.data.recipients) {
      const peer = session.clones.find((candidate) => candidate.id === id)!;
      const packet = event.data;
      later(
        () => channels.get(peer.id)!.port1.postMessage(packet),
        delayFor(peer),
      );
    }
  };
  channel.port2.onmessage = (event: MessageEvent<Packet>) => {
    if (event.data.epoch !== epoch) return;
    inFlight--;
    if (event.data.kind === "presence") {
      applyPresence(clone, event.data.message);
    } else {
      applyIncoming(clone, event.data.bytes);
    }
    renderSync();
  };
}
function schedule(clone: DemoClone): void {
  const pending = sending.get(clone.id);
  if (pending !== undefined) {
    clearTimeout(pending);
    timers.delete(pending);
  }
  sending.set(
    clone.id,
    later(() => {
      sending.delete(clone.id);
      const recipients = session.clones.filter((peer) => peer.id !== clone.id)
        .map((peer) => peer.id);
      inFlight += recipients.length;
      channels.get(clone.id)!.port2.postMessage({
        epoch,
        kind: "log",
        recipients,
        bytes: clone.caller.adapter.save(),
      });
    }, delayFor(clone)),
  );
}
function renderSync(): void {
  if (!session) return;
  for (const clone of session.clones) {
    const panel = panels.get(clone.id);
    if (panel) {
      $(".sync-state", panel).textContent = `${
        DELAY_PROFILES[clone.profile].label
      }: ${clone.minDelay}–${clone.maxDelay} ms each way · ${clone.caller.adapter.operations().length} ops · ${
        (timers.size || inFlight) ? "updates in flight" : "transport idle"
      }`;
    }
  }
}
function renderLog(): void {
  if (!$("#log-pane").hasAttribute("open")) return;
  const selected = $<HTMLSelectElement>("#log-clone").value;
  const clone = session.clones.find((c) => c.id === selected) ??
    session.clones[0];
  const log = clone.caller.build.exportLog();
  $("#log-count").textContent = `(${log.operations.length})`;
  $("#operation-log").textContent = JSON.stringify(log, null, 2);
}
function updateText(
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  if (input.value === value) return;
  if (
    input instanceof HTMLTextAreaElement && document.activeElement === input
  ) {
    // Preserve the caret through the one-splice difference of a remote update.
    const old = input.value;
    let at = 0;
    while (at < old.length && at < value.length && old[at] === value[at]) at++;
    let suffix = 0;
    while (
      suffix < old.length - at && suffix < value.length - at &&
      old[old.length - 1 - suffix] === value[value.length - 1 - suffix]
    ) suffix++;
    const end = old.length - suffix;
    const inserted = value.length - suffix - at;
    const shift = (pos: number) =>
      pos <= at
        ? pos
        : pos >= end
        ? pos + inserted - (end - at)
        : at + inserted;
    const start = shift(input.selectionStart),
      finish = shift(input.selectionEnd);
    input.value = value;
    input.setSelectionRange(start, finish);
  } else input.value = value;
}
function render(clone: DemoClone): void {
  const panel = panels.get(clone.id)!;
  for (
    const input of panel.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >("[data-field]")
  ) {
    const field = input.dataset.field as Field;
    // A focused whole-value edit retains its base rev and unsubmitted value.
    if (document.activeElement === input && field !== "narrative") continue;
    if (composing.has(clone.id) && field === "narrative") continue;
    updateText(input, String(readField(session, clone, field)));
    input.dataset.rev = clone.caller.build.logRev();
  }
  const validation = session.validator.validate(
    clone.caller.build,
    session.draftId,
    session.template,
  );
  $(".diagnostics", panel).textContent = JSON.stringify(
    {
      rev: clone.caller.build.logRev(),
      canCommitComplete: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      skipped: clone.caller.build.concurrentSkips(),
    },
    null,
    2,
  );
  renderSync();
  renderLog();
}
function createPanel(clone: DemoClone): void {
  presenceViews.set(clone.id, new PresenceView(clone.id, DEFAULT_PRESENCE_CONFIG));
  const template = $<HTMLTemplateElement>("#clone-template");
  const panel = template.content.firstElementChild!.cloneNode(
    true,
  ) as HTMLElement;
  panels.set(clone.id, panel);
  $("h2", panel).textContent = `Clone ${session.clones.indexOf(clone) + 1}`;
  const username = $<HTMLInputElement>(".username", panel);
  username.value = clone.username;
  username.addEventListener("change", () => {
    clone.username = username.value.trim() || clone.username;
    username.value = clone.username;
    clone.author.name = clone.username;
    updateLogChoices();
  });
  const profile = $<HTMLSelectElement>(".profile", panel);
  profile.value = clone.profile;
  profile.addEventListener("change", () => {
    setProfile(clone, profile.value as DelayProfile);
    renderSync();
  });
  const hosts = ensurePresenceHosts(panel, PRESENCE_FIELDS);
  presenceHosts.set(clone.id, hosts);
  ensurePresenceTicker();
  for (
    const input of panel.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >("[data-field]")
  ) {
    const field = input.dataset.field as Field;
    input.id = `${clone.id}-${field}`;
    input.addEventListener("focus", () => {
      input.dataset.rev = clone.caller.build.logRev();
      emitPresence(clone, field, "focused");
      startPresenceBeat(clone);
    });
    input.addEventListener("blur", () => {
      stopPresenceBeat(clone.id);
      emitPresence(clone, null, "focused");
    });
  const edit = () => {
      if (busy || sent || composing.has(clone.id)) return;
      if (!input.reportValidity()) return;
      try {
        const before = String(readField(session, clone, field));
        const value =
          input instanceof HTMLInputElement && input.type === "number"
            ? input.valueAsNumber
            : input.value;
        writeField(
          session,
          clone,
          field,
          value,
          field === "narrative"
            ? clone.caller.build.logRev()
            : input.dataset.rev,
        );
        input.dataset.rev = clone.caller.build.logRev();
        const after = String(value);
        if (before !== after) {
          emitPresence(clone, field, "editing");
          broadcastPresence(clone, {
            t: "edit",
            userId: clone.id,
            name: clone.username,
            field,
            from: before,
            to: after,
            atMs: nowMs(),
          });
        }
        feedback(clone, "Local edit appended; waiting for this clone’s link.");
        schedule(clone);
        render(clone);
      } catch (error) {
        feedback(
          clone,
          `${
            authorError(error)
          }. Your value was not applied; blur to see the current value.`,
          true,
        );
      }
    };
    if (field === "narrative") {
      input.addEventListener("input", () => {
        emitPresence(clone, field, "editing");
        startPresenceBeat(clone);
        edit();
      });
    } else {
      input.addEventListener("change", edit);
    }
    input.addEventListener("blur", () => render(clone));
    if (field === "narrative") {
      input.addEventListener("compositionstart", () => composing.add(clone.id));
      input.addEventListener("compositionend", () => {
        composing.delete(clone.id);
        edit();
        for (const bytes of deferred.get(clone.id) ?? []) {
          applyIncoming(clone, bytes);
        }
        deferred.delete(clone.id);
      });
    }
  }
  $("form", panel).addEventListener("submit", (event) => {
    event.preventDefault();
    void commit(clone);
  });
  $("#clones").append(panel);
  connect(clone);
  broadcastPresence(clone, {
    t: "join",
    userId: clone.id,
    name: clone.username,
    atMs: nowMs(),
  });
  updateLogChoices();
  render(clone);
  renderPresence(clone);
}
function updateLogChoices(): void {
  const select = $<HTMLSelectElement>("#log-clone");
  const old = select.value;
  select.replaceChildren(
    ...session.clones.map((clone, i) => {
      const option = document.createElement("option");
      option.textContent = `Clone ${i + 1}: ${clone.username}`;
      option.value = clone.id;
      return option;
    }),
  );
  if (session.clones.some((clone) => clone.id === old)) select.value = old;
}
function setBusy(value: boolean): void {
  busy = value;
  for (
    const element of document.querySelectorAll<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLButtonElement
      | HTMLTextAreaElement
    >("input,select,textarea,button")
  ) element.disabled = value || sent;
}
async function commit(clone: DemoClone): Promise<void> {
  if (busy || sent) return;
  const isCdr = $<HTMLSelectElement>("#destination").value === "cdr";
  if (isCdr && (timers.size || inFlight || composing.size)) {
    feedback(
      clone,
      "Wait for all links to be idle (or Sync all now) before sending to the CDR.",
      true,
    );
    return;
  }
  const cdrUrl = $<HTMLInputElement>("#cdr-url").value.trim();
  const ehrId = $<HTMLInputElement>("#ehr-id").value.trim();
  const systemId = $<HTMLInputElement>("#system-id").value.trim();
  if (isCdr) {
    try {
      if (
        !ehrId || !systemId ||
        !["http:", "https:"].includes(new URL(cdrUrl).protocol)
      ) throw new Error();
    } catch {
      feedback(
        clone,
        "Provide an http(s) REST base URL, EHR ID and CDR system ID.",
        true,
      );
      return;
    }
    if (
      !globalThis.confirm(
        `Send this synthetic Contribution Builder payload to ${cdrUrl} for EHR ${ehrId}?`,
      )
    ) return;
  }
  // Reserve a UNIQUE tab during the user gesture, before async validation/hash.
  const popup = globalThis.open("about:blank", "_blank");
  if (!popup) {
    feedback(
      clone,
      "Popup blocked. Allow popups for this demo and retry; nothing was sent.",
      true,
    );
    return;
  }
  popup.opener = null;
  const doc = popup.document;
  doc.title = `Contribution Builder ${crypto.randomUUID()}`;
  const title = doc.createElement("h1");
  title.textContent = "Contribution Builder — NewContribution";
  const result = doc.createElement("p");
  result.textContent = "Validating and preparing…";
  const pre = doc.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.style.overflowWrap = "anywhere";
  doc.body.append(title, result, pre);
  setBusy(true);
  try {
    const prepared = await preparePreview(
      session,
      clone,
      isCdr ? systemId : undefined,
    );
    pre.textContent = JSON.stringify(prepared.body, null, 2);
    const link = doc.createElement("a");
    link.textContent = "Save request JSON";
    const objectUrl = URL.createObjectURL(
      new Blob([pre.textContent], { type: "application/json" }),
    );
    link.href = objectUrl;
    link.download = `contribution-${crypto.randomUUID()}.json`;
    doc.body.insertBefore(link, pre);
    const logLink = doc.createElement("a");
    const logUrl = URL.createObjectURL(
      new Blob([prepared.logBytes.slice().buffer], {
        type: "application/json",
      }),
    );
    logLink.textContent = "Save compacted audit log (matches payload hash)";
    logLink.href = logUrl;
    logLink.download = `contribution-log-${prepared.logSha256}.json`;
    logLink.style.marginLeft = "1rem";
    doc.body.insertBefore(logLink, pre);
    popup.addEventListener("pagehide", () => {
      URL.revokeObjectURL(objectUrl);
      URL.revokeObjectURL(logUrl);
    }, { once: true });
    if (isCdr) {
      // Post the EXACT body displayed above. The adapter records no success on failure.
      const rest = new ItsRestContributionAdapter({ baseUrl: cdrUrl });
      const response = await rest.postContribution(ehrId, prepared);
      clone.caller.build.setComposer(session.draftId, {
        _type: "PARTY_IDENTIFIED",
        name: clone.username,
      }, { author: clone.author });
      clone.caller.build.ensureDataEntryParticipations();
      for (const [i, version] of prepared.versions.entries()) {
        const stored = response.versionUids[i];
        const provisionalObjectUuid = version.versionUid.split("::")[0];
        const storedObjectUuid = stored.split("::")[0];
        clone.caller.build.recordCommit(version.draftId, {
          versionUid: stored,
          changeType: version.changeType,
          lifecycleState: version.lifecycleState,
          logSha256: prepared.logSha256,
          ...(response.contributionUid
            ? { contributionUid: response.contributionUid }
            : {}),
          ...(storedObjectUuid !== provisionalObjectUuid
            ? { provisionalObjectUuid, storedObjectUuid }
            : {}),
        }, { author: { id: clone.id, name: clone.username } });
      }
      sent = true;
      schedule(clone);
      result.textContent =
        `POST succeeded: HTTP ${response.status}. Draft locked; reload for a fresh build.`;
    } else {result.textContent =
        "Preview only — no CDR request sent. Close or keep this tab. The live build remains editable; this is this clone’s current view, which may not yet include delayed peers.";}
    feedback(
      clone,
      isCdr
        ? "CDR commit succeeded. Reload to start another build."
        : "NewContribution opened in a unique tab; no server needed.",
    );
    render(clone);
  } catch (error) {
    result.textContent = `No successful commit recorded: ${authorError(error)}`;
    feedback(clone, authorError(error), true);
  } finally {
    setBusy(false);
  }
}
async function start(): Promise<void> {
  const load = async (name: string) => {
    const response = await fetch(`contribution-builder/${name}`);
    if (!response.ok) {
      throw new Error(`Template load failed: ${response.status}`);
    }
    return response.text();
  };
  const [opt, wt] = await Promise.all([
    load("simple-diagnose-and-vitals.opt"),
    load("simple-diagnose-and-vitals.wt.json"),
  ]);
  session = await createDemoSession(opt, wt);
  for (const clone of session.clones) createPanel(clone);
  $("#build-info").textContent = `Build ${
    session.clones[0].caller.build.buildId.slice(0, 8)
  } · in-page MessageChannel`;
  $<HTMLButtonElement>("#add-clone").disabled = false;
  $<HTMLButtonElement>("#sync-now").disabled = false;
  $("#add-clone").addEventListener("click", () => {
    const clone = addClone(session);
    createPanel(clone);
    for (const peer of session.clones) {
      if (peer !== clone) {
        broadcastPresence(peer, {
          t: "join",
          userId: peer.id,
          name: peer.username,
          atMs: nowMs(),
        });
      }
      schedule(peer);
    }
  });
  $("#sync-now").addEventListener("click", () => {
    if (composing.size) {
      status.textContent =
        "Finish the current text composition before synchronising.";
      return;
    }
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    sending.clear();
    epoch++;
    inFlight = 0;
    // Two passes distribute the merged text AND reconciliation operations.
    for (let pass = 0; pass < 2; pass++) {
      for (const source of session.clones) {
        for (const peer of session.clones) {
          if (source !== peer) {
            receive(session, peer, source.caller.adapter.save());
          }
        }
      }
    }
    for (const clone of session.clones) render(clone);
    status.textContent =
      "All clones synchronised; normal delayed links remain enabled.";
  });
  $("#log-pane").addEventListener("toggle", renderLog);
  $("#log-clone").addEventListener("change", renderLog);
  status.textContent =
    "Ready. Scalar fields apply on change; diagnosis narrative merges as you type. Each sender and receiver adds its own random link delay.";
}
globalThis.addEventListener("pagehide", () => {
  for (const timer of timers) clearTimeout(timer);
  for (const channel of channels.values()) {
    channel.port1.close();
    channel.port2.close();
  }
});
start().catch((error) => {
  status.textContent = authorError(error);
  status.classList.add("error");
  console.error(error);
});

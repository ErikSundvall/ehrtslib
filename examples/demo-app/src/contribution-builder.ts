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
  isLongText,
  LONG_TEXT_FIELDS,
  type LongTextField,
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
import { historicalBadgesForField } from "./cb-history-presence.ts";
import {
  ensurePresenceHosts,
  paintFieldBadgeView,
  paintPresenceBadges,
} from "./cb-presence-ui.ts";
import {
  diffRange,
  NarrativeCollabView,
  type NarrativeCollabWireMessage,
} from "./cb-narrative-collab.ts";
import {
  ensureNarrativeShell,
  paintNarrativeCollab,
  paintNarrativeHighlights,
} from "./cb-narrative-ui.ts";
import {
  historicalTextHighlights,
  opNewAtStep,
} from "./cb-time-travel-narrative.ts";
import { clampCaretOffset } from "./cb-narrative-layout.ts";
import {
  advancePlaybackStep,
  createHistoricalCaller,
  exitTimeTravel,
  initialTimeTravelState,
  isCloneReadOnly,
  refreshTimeline,
  setScrubStep,
  toggleHistoryPlayback,
  toggleTimelinePanel,
  type TimeTravelState,
} from "./cb-time-travel.ts";
import { deriveTimeTravelChrome } from "./cb-time-travel-ui.ts";

const PRESENCE_FIELDS: Field[] = [
  "diagnosisName",
  "clinicalDescription",
  "comment",
  "systolic",
  "diastolic",
  "pulse",
  "respirationRate",
  "temperature",
  "temperatureComment",
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
interface CollabPacket {
  epoch: number;
  kind: "collab";
  message: NarrativeCollabWireMessage;
  recipients: string[];
}
type Packet = LogPacket | PresencePacket | CollabPacket;
let epoch = 0;
let inFlight = 0;
const composing = new Set<string>();
const deferred = new Map<string, Uint8Array[]>();
let session: DemoSession;
let busy = false;
let sent = false;
const presenceViews = new Map<string, PresenceView>();
const presenceHosts = new Map<string, Map<Field, HTMLElement>>();
const presenceBeats = new Map<
  string,
  ReturnType<typeof globalThis.setInterval>
>();
const presenceFocus = new Map<
  string,
  { field: Field; state: LivePresenceState }
>();
let presenceClock = 0;
let presenceTicker: ReturnType<typeof globalThis.setInterval> | undefined;
const narrativeViews = new Map<string, NarrativeCollabView>();

function narrativeCollabKey(cloneId: string, field: LongTextField): string {
  return `${cloneId}:${field}`;
}

function narrativeView(
  cloneId: string,
  field: LongTextField,
): NarrativeCollabView {
  const key = narrativeCollabKey(cloneId, field);
  let view = narrativeViews.get(key);
  if (!view) {
    view = new NarrativeCollabView(cloneId);
    narrativeViews.set(key, view);
  }
  return view;
}
const timeTravel = new Map<string, TimeTravelState>();
const scrubPreview = new Map<
  string,
  Map<number, DemoClone["caller"]>
>();
const historyPlayTimers = new Map<
  string,
  ReturnType<typeof globalThis.setInterval>
>();

function stopHistoryPlayback(cloneId: string): void {
  const timer = historyPlayTimers.get(cloneId);
  if (timer !== undefined) {
    clearInterval(timer);
    historyPlayTimers.delete(cloneId);
    timers.delete(timer);
  }
}

function syncHistoryPlayback(clone: DemoClone): void {
  const state = timeTravel.get(clone.id);
  if (!state?.playing || !state.panelOpen) {
    stopHistoryPlayback(clone.id);
    return;
  }
  if (historyPlayTimers.has(clone.id)) return;
  const timer = globalThis.setInterval(() => {
    const current = timeTravel.get(clone.id);
    if (!current?.playing || !current.panelOpen) {
      stopHistoryPlayback(clone.id);
      return;
    }
    const next = advancePlaybackStep(current);
    timeTravel.set(clone.id, next);
    scrubPreview.delete(clone.id);
    render(clone);
    if (!next.playing) stopHistoryPlayback(clone.id);
  }, 500);
  historyPlayTimers.set(clone.id, timer);
  timers.add(timer);
}

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
function broadcastCollab(
  clone: DemoClone,
  message: NarrativeCollabWireMessage,
): void {
  const recipients = session.clones.filter((peer) => peer.id !== clone.id)
    .map((peer) => peer.id);
  if (!recipients.length) return;
  const channel = channels.get(clone.id);
  if (!channel) return;
  inFlight += recipients.length;
  channel.port2.postMessage(
    {
      epoch,
      kind: "collab",
      message,
      recipients,
    } satisfies CollabPacket,
  );
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
  channel.port2.postMessage(
    {
      epoch,
      kind: "presence",
      message,
      recipients,
    } satisfies PresencePacket,
  );
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
function applyCollab(
  clone: DemoClone,
  message: NarrativeCollabWireMessage,
): void {
  const view = narrativeView(clone.id, message.field);
  view.apply(message);
  const panel = panels.get(clone.id);
  const textarea = panel?.querySelector<HTMLTextAreaElement>(
    `[data-field="${message.field}"]`,
  );
  if (textarea) {
    paintNarrativeCollab(textarea, view, nowMs());
  }
}
function renderAllPresence(): void {
  presenceClock = nowMs();
  for (const clone of session.clones) {
    renderPresence(clone);
    renderNarrativeCollab(clone);
  }
}
function historicalCaller(
  clone: DemoClone,
  step: number,
): DemoClone["caller"] {
  let byStep = scrubPreview.get(clone.id);
  if (!byStep) {
    byStep = new Map();
    scrubPreview.set(clone.id, byStep);
  }
  const cached = byStep.get(step);
  if (cached) return cached;
  const caller = createHistoricalCaller(
    { author: clone.author, replica: clone.id },
    clone.caller.adapter.save(),
    step,
    clone.caller.build.buildId,
  );
  byStep.set(step, caller);
  return caller;
}

function renderNarrativeCollab(clone: DemoClone): void {
  const panel = panels.get(clone.id);
  if (!panel) return;
  const travel = timeTravel.get(clone.id);
  const atMs = presenceClock || nowMs();
  for (const field of LONG_TEXT_FIELDS) {
    const textarea = panel.querySelector<HTMLTextAreaElement>(
      `[data-field="${field}"]`,
    );
    if (!textarea) continue;
    if (travel?.panelOpen) {
      const afterText = String(readFieldForPanel(clone, field));
      const beforeText = travel.step > 0
        ? String(
          readField(
            session,
            { ...clone, caller: historicalCaller(clone, travel.step - 1) },
            field,
          ),
        )
        : afterText;
      const opsAtStep = historicalCaller(clone, travel.step).adapter.operations();
      const opsAtPrev = travel.step > 0
        ? historicalCaller(clone, travel.step - 1).adapter.operations()
        : [];
      const op = opNewAtStep(opsAtStep, opsAtPrev, session.fields, field);
      const highlights = historicalTextHighlights(
        field,
        beforeText,
        afterText,
        op,
      );
      paintNarrativeHighlights(textarea, afterText, highlights);
      continue;
    }
    paintNarrativeCollab(textarea, narrativeView(clone.id, field), atMs);
  }
}
function cloneReadOnly(clone: DemoClone): boolean {
  const state = timeTravel.get(clone.id);
  return state ? isCloneReadOnly(state) : false;
}
function refreshTimeTravel(clone: DemoClone): void {
  const panel = panels.get(clone.id);
  if (!panel) return;
  const scrub = $<HTMLInputElement>(".time-travel-scrub", panel);
  let prev = timeTravel.get(clone.id) ?? initialTimeTravelState(0);
  if (prev.panelOpen && document.activeElement === scrub) {
    const fromDom = Number(scrub.value);
    if (Number.isFinite(fromDom) && fromDom !== prev.step) {
      prev = setScrubStep(prev, fromDom);
    }
  }
  const bytes = clone.caller.adapter.save();
  const next = refreshTimeline(bytes, prev);
  timeTravel.set(clone.id, next);
  scrub.max = String(next.maxStep);
  scrub.min = "0";
  scrub.value = String(next.step);
  scrub.setAttribute("aria-valuemax", String(next.maxStep));
  scrub.setAttribute(
    "aria-valuetext",
    next.step >= next.maxStep ? "Live" : `Step ${next.step} of ${next.maxStep}`,
  );
  const toggle = $(".time-travel-toggle", panel);
  const panelEl = $(".time-travel-panel", panel);
  const liveBtn = $(".time-travel-live", panel);
  const playBtn = $<HTMLButtonElement>(".time-travel-play", panel);
  const banner = $(".time-travel-readonly-banner", panel);
  const chrome = deriveTimeTravelChrome(next, bytes);
  panelEl.hidden = !chrome.panelOpen;
  toggle.setAttribute("aria-expanded", chrome.panelOpen ? "true" : "false");
  toggle.textContent = chrome.toggleLabel;
  liveBtn.hidden = true;
  banner.hidden = !chrome.bannerVisible;
  $(".time-travel-status", panel).textContent = chrome.statusText;
  $(".time-travel-moment", panel).textContent = chrome.timelineCaption;
  playBtn.hidden = !chrome.panelOpen;
  playBtn.textContent = chrome.playing ? "Pause" : "Play";
  playBtn.setAttribute("aria-pressed", chrome.playing ? "true" : "false");
  panel.classList.toggle("clone--history-readonly", chrome.bannerVisible);
  syncHistoryPlayback(clone);
  updateCloneInputsDisabled(clone);
}
function updateCloneInputsDisabled(clone: DemoClone): void {
  const panel = panels.get(clone.id);
  if (!panel) return;
  const readOnly = cloneReadOnly(clone) || busy || sent;
  for (
    const el of panel.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
    >("input[data-field],textarea[data-field],button.commit")
  ) {
    el.disabled = readOnly;
    el.setAttribute("aria-readonly", readOnly ? "true" : "false");
  }
}
function readFieldForPanel(clone: DemoClone, field: Field): string | number {
  const state = timeTravel.get(clone.id);
  if (state && isCloneReadOnly(state)) {
    try {
      return readField(
        session,
        { ...clone, caller: historicalCaller(clone, state.step) },
        field,
      );
    } catch {
      return readField(session, clone, field);
    }
  }
  return readField(session, clone, field);
}
function renderPresence(clone: DemoClone): void {
  const hosts = presenceHosts.get(clone.id);
  const view = presenceViews.get(clone.id);
  if (!hosts || !view) return;
  const travel = timeTravel.get(clone.id);
  const atMs = presenceClock || nowMs();
  if (travel?.panelOpen) {
    const ops = historicalCaller(clone, travel.step).adapter.operations();
    for (const [field, host] of hosts) {
      paintFieldBadgeView(
        host,
        historicalBadgesForField(
          ops,
          session.fields,
          field,
          clone.id,
          atMs,
        ),
      );
    }
    return;
  }
  paintPresenceBadges(hosts, view, atMs);
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
    } else if (event.data.kind === "collab") {
      applyCollab(clone, event.data.message);
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
  refreshTimeTravel(clone);
  const panel = panels.get(clone.id)!;
  for (
    const input of panel.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >("[data-field]")
  ) {
    const field = input.dataset.field as Field;
    // A focused whole-value edit retains its base rev and unsubmitted value.
    if (document.activeElement === input && !isLongText(field)) continue;
    if (composing.has(clone.id) && isLongText(field)) continue;
    updateText(input, String(readFieldForPanel(clone, field)));
    if (!cloneReadOnly(clone)) {
      input.dataset.rev = clone.caller.build.logRev();
    }
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
  renderNarrativeCollab(clone);
}
function setupTimeTravel(clone: DemoClone, panel: HTMLElement): void {
  const toggle = $(".time-travel-toggle", panel);
  const scrub = $(".time-travel-scrub", panel);
  const playBtn = $(".time-travel-play", panel);
  timeTravel.set(
    clone.id,
    initialTimeTravelState(0),
  );
  toggle.addEventListener("click", () => {
    const state = timeTravel.get(clone.id)!;
    const toggled = state.panelOpen
      ? exitTimeTravel(state)
      : toggleTimelinePanel(state);
    const next = refreshTimeline(clone.caller.adapter.save(), toggled);
    timeTravel.set(clone.id, next);
    scrubPreview.delete(clone.id);
    render(clone);
  });
  const onScrubInput = () => {
    const state = timeTravel.get(clone.id)!;
    const next = setScrubStep(state, Number(scrub.value));
    timeTravel.set(clone.id, next);
    scrubPreview.delete(clone.id);
    render(clone);
  };
  scrub.addEventListener("input", onScrubInput);
  scrub.addEventListener("change", onScrubInput);
  scrub.addEventListener("pointerup", onScrubInput);
  playBtn.addEventListener("click", () => {
    const state = timeTravel.get(clone.id)!;
    const next = refreshTimeline(
      clone.caller.adapter.save(),
      toggleHistoryPlayback(state),
    );
    timeTravel.set(clone.id, next);
    render(clone);
  });
}

function createPanel(clone: DemoClone): void {
  presenceViews.set(
    clone.id,
    new PresenceView(clone.id, DEFAULT_PRESENCE_CONFIG),
  );
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
  setupTimeTravel(clone, panel);
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
      if (busy || sent || composing.has(clone.id) || cloneReadOnly(clone)) {
        return;
      }
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
          isLongText(field)
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
          if (isLongText(field)) {
            const { start, end } = diffRange(before, after);
            const snippet = after.slice(start, end);
            if (snippet) {
              broadcastCollab(clone, {
                t: "text-hl",
                userId: clone.id,
                name: clone.username,
                field,
                start,
                end,
                snippet,
                atMs: nowMs(),
              });
            }
          }
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
    if (isLongText(field)) {
      ensureNarrativeShell(input);
      input.addEventListener("input", () => {
        emitPresence(clone, field, "editing");
        startPresenceBeat(clone);
        const offset = clampCaretOffset(
          input.value,
          input.selectionEnd ?? input.selectionStart ?? input.value.length,
        );
        broadcastCollab(clone, {
          t: "caret",
          userId: clone.id,
          name: clone.username,
          field,
          offset,
          atMs: nowMs(),
        });
        edit();
      });
      const repaintsCollab = () => renderNarrativeCollab(clone);
      input.addEventListener("scroll", repaintsCollab);
      globalThis.addEventListener("resize", repaintsCollab);
      input.addEventListener("keyup", () => {
        if (cloneReadOnly(clone)) return;
        const offset = clampCaretOffset(
          input.value,
          input.selectionEnd ?? input.selectionStart ?? input.value.length,
        );
        broadcastCollab(clone, {
          t: "caret",
          userId: clone.id,
          name: clone.username,
          field,
          offset,
          atMs: nowMs(),
        });
      });
      input.addEventListener("select", () => {
        if (cloneReadOnly(clone)) return;
        const offset = clampCaretOffset(
          input.value,
          input.selectionEnd ?? input.selectionStart ?? input.value.length,
        );
        broadcastCollab(clone, {
          t: "caret",
          userId: clone.id,
          name: clone.username,
          field,
          offset,
          atMs: nowMs(),
        });
      });
    } else {
      input.addEventListener("change", edit);
    }
    input.addEventListener("blur", () => render(clone));
    if (isLongText(field)) {
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
  renderNarrativeCollab(clone);
  refreshTimeTravel(clone);
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
    >("input,select,textarea,button.commit")
  ) element.disabled = value || sent;
  if (session) {
    for (const clone of session.clones) updateCloneInputsDisabled(clone);
  }
}
async function commit(clone: DemoClone): Promise<void> {
  if (busy || sent || cloneReadOnly(clone)) return;
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
    "Ready. Scalar fields apply on change; long narrative fields merge as you type. Each sender and receiver adds its own random link delay.";
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

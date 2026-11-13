/** Per-clone Automerge history scrubbing (demo only). */
import {
  AutomergeOperationLogAdapter,
  createMultiCaller,
  historyStepCount,
  materializeAtStep,
  type MultiCaller,
} from "../../../addons/cb_automerge/mod.ts";
import type { BuildContext } from "../../../contribution_builder/mod.ts";
import { formatAbsolute } from "./cb-presence.ts";

export interface TimeTravelState {
  /** Scrub UI expanded (collapsed by default). */
  panelOpen: boolean;
  /** Inclusive step index; live editing uses `panelOpen === false`. */
  step: number;
  maxStep: number;
  /** Auto-replay history on the scrub slider. */
  playing: boolean;
}

export function initialTimeTravelState(maxStep: number): TimeTravelState {
  return { panelOpen: false, step: maxStep, maxStep, playing: false };
}

export function toggleTimelinePanel(state: TimeTravelState): TimeTravelState {
  const panelOpen = !state.panelOpen;
  return {
    ...state,
    panelOpen,
    playing: false,
    step: panelOpen ? state.step : state.maxStep,
  };
}

export function exitTimeTravel(state: TimeTravelState): TimeTravelState {
  return { ...state, panelOpen: false, step: state.maxStep, playing: false };
}

export function setScrubStep(
  state: TimeTravelState,
  step: number,
): TimeTravelState {
  const clamped = Math.max(0, Math.min(step, state.maxStep));
  return { ...state, step: clamped, panelOpen: true, playing: false };
}

export function scrubToStart(state: TimeTravelState): TimeTravelState {
  return setScrubStep(state, 0);
}

export function scrubToEnd(state: TimeTravelState): TimeTravelState {
  return setScrubStep(state, state.maxStep);
}

export function refreshTimeline(
  liveBytes: Uint8Array,
  state: TimeTravelState,
): TimeTravelState {
  const maxStep = Math.max(0, historyStepCount(liveBytes) - 1);
  const step = state.panelOpen
    ? Math.min(state.step, maxStep)
    : maxStep;
  return { panelOpen: state.panelOpen, step, maxStep, playing: state.playing };
}

export function toggleHistoryPlayback(state: TimeTravelState): TimeTravelState {
  if (!state.panelOpen) return state;
  return { ...state, playing: !state.playing };
}

export function advancePlaybackStep(state: TimeTravelState): TimeTravelState {
  if (!state.playing || !state.panelOpen) return state;
  if (state.step >= state.maxStep) {
    return { ...state, playing: false };
  }
  return { ...state, step: state.step + 1 };
}

/** Time travel mode (read-only); includes the slider at the latest step. */
export function isCloneReadOnly(state: TimeTravelState): boolean {
  return state.panelOpen;
}

export function showTimelinePanel(state: TimeTravelState): boolean {
  return state.panelOpen;
}

export function showReturnToLive(state: TimeTravelState): boolean {
  return state.panelOpen;
}

export function createHistoricalCaller(
  context: BuildContext,
  liveBytes: Uint8Array,
  step: number,
  buildId: string,
): MultiCaller {
  const bytes = materializeAtStep(liveBytes, step);
  return createMultiCaller(context, { bytes, buildId });
}

export function historyStepCaption(
  liveBytes: Uint8Array,
  step: number,
  maxStep: number,
): string {
  if (step >= maxStep) return "Latest snapshot";
  try {
    const partial = materializeAtStep(liveBytes, step);
    const ops = AutomergeOperationLogAdapter.load(partial).operations();
    const last = ops.at(-1);
    if (last?.timestamp) {
      const ms = Date.parse(last.timestamp);
      if (Number.isFinite(ms)) return formatAbsolute(ms);
      return last.timestamp;
    }
  } catch {
    /* demo caption fallback */
  }
  return `Step ${step} of ${maxStep}`;
}

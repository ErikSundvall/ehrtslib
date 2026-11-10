/** Per-clone Automerge history scrubbing (demo only). */
import {
  createMultiCaller,
  historyStepCount,
  materializeAtStep,
  type MultiCaller,
} from "../../../addons/cb_automerge/mod.ts";
import type { BuildContext } from "../../../contribution_builder/mod.ts";

export interface TimeTravelState {
  /** Scrub UI expanded (collapsed by default). */
  panelOpen: boolean;
  /** Inclusive step index; live is always `maxStep`. */
  step: number;
  maxStep: number;
}

export function initialTimeTravelState(maxStep: number): TimeTravelState {
  return { panelOpen: false, step: maxStep, maxStep };
}

export function toggleTimelinePanel(state: TimeTravelState): TimeTravelState {
  const panelOpen = !state.panelOpen;
  return {
    ...state,
    panelOpen,
    step: panelOpen ? state.step : state.maxStep,
  };
}

export function leaveScrubbing(state: TimeTravelState): TimeTravelState {
  return { ...state, step: state.maxStep };
}

export function setScrubStep(
  state: TimeTravelState,
  step: number,
): TimeTravelState {
  const clamped = Math.max(0, Math.min(step, state.maxStep));
  return { ...state, step: clamped, panelOpen: true };
}

export function refreshTimeline(
  liveBytes: Uint8Array,
  state: TimeTravelState,
): TimeTravelState {
  const maxStep = Math.max(0, historyStepCount(liveBytes) - 1);
  const step = state.panelOpen && state.step < maxStep
    ? Math.min(state.step, maxStep)
    : maxStep;
  return { panelOpen: state.panelOpen, step, maxStep };
}

/** Viewing a historical step inside the open timeline panel. */
export function isCloneReadOnly(state: TimeTravelState): boolean {
  return state.panelOpen && state.step < state.maxStep;
}

export function showTimelinePanel(state: TimeTravelState): boolean {
  return state.panelOpen;
}

export function showReturnToLive(state: TimeTravelState): boolean {
  return state.panelOpen && state.step < state.maxStep;
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

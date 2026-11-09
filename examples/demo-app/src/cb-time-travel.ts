/** Per-clone Automerge history scrubbing (demo only). */
import {
  createMultiCaller,
  historyStepCount,
  materializeAtStep,
  type MultiCaller,
} from "../../../addons/cb_automerge/mod.ts";
import type { BuildContext } from "../../../contribution_builder/mod.ts";

export interface TimeTravelState {
  scrubbing: boolean;
  /** Inclusive step index; live is always `maxStep`. */
  step: number;
  maxStep: number;
}

export function initialTimeTravelState(maxStep: number): TimeTravelState {
  return { scrubbing: false, step: maxStep, maxStep };
}

export function enterScrubbing(state: TimeTravelState): TimeTravelState {
  return { ...state, scrubbing: true, step: state.maxStep };
}

export function leaveScrubbing(state: TimeTravelState): TimeTravelState {
  return { ...state, scrubbing: false, step: state.maxStep };
}

export function setScrubStep(
  state: TimeTravelState,
  step: number,
): TimeTravelState {
  const clamped = Math.max(0, Math.min(step, state.maxStep));
  return { ...state, step: clamped, scrubbing: true };
}

export function refreshTimeline(
  liveBytes: Uint8Array,
  state: TimeTravelState,
): TimeTravelState {
  const maxStep = Math.max(0, historyStepCount(liveBytes) - 1);
  const step = state.scrubbing ? Math.min(state.step, maxStep) : maxStep;
  return { scrubbing: state.scrubbing, step, maxStep };
}

export function isCloneReadOnly(state: TimeTravelState): boolean {
  return state.scrubbing && state.step < state.maxStep;
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

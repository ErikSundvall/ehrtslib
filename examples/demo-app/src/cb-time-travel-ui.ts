import {
  historyStepCaption,
  isCloneReadOnly,
  showReturnToLive,
  showTimelinePanel,
  type TimeTravelState,
} from "./cb-time-travel.ts";

export interface TimeTravelChrome {
  panelOpen: boolean;
  returnToLiveVisible: boolean;
  toggleLabel: string;
  bannerVisible: boolean;
  statusText: string;
  timelineCaption: string;
  playing: boolean;
  playLabel: string;
  playTooltip: string;
}

export function deriveTimeTravelChrome(
  state: TimeTravelState,
  liveBytes?: Uint8Array,
): TimeTravelChrome {
  const historical = isCloneReadOnly(state);
  const panelOpen = showTimelinePanel(state);
  const timelineCaption = liveBytes
    ? historyStepCaption(liveBytes, state.step, state.maxStep)
    : `Step ${state.step} of ${state.maxStep}`;
  return {
    panelOpen,
    returnToLiveVisible: showReturnToLive(state),
    toggleLabel: panelOpen ? "Return to live" : "Time travel",
    bannerVisible: historical,
    playing: state.playing,
    timelineCaption,
    statusText: historical
      ? state.step < state.maxStep
        ? `Viewing history step ${state.step} of ${state.maxStep} (read-only)`
        : "Viewing latest snapshot (read-only) — use Return to live to edit"
      : panelOpen
      ? "Live editing — scrub the slider to explore history"
      : "",
    playLabel: chromePlayingLabel(state.playing),
    playTooltip: chromePlayingLabel(state.playing),
  };
}

function chromePlayingLabel(playing: boolean): string {
  return playing ? "Pause history playback" : "Play history";
}

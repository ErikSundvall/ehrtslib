import {
  isCloneReadOnly,
  showReturnToLive,
  showTimelinePanel,
  type TimeTravelState,
} from "./cb-time-travel.ts";

export interface TimeTravelChrome {
  panelOpen: boolean;
  returnToLiveVisible: boolean;
  bannerVisible: boolean;
  statusText: string;
}

export function deriveTimeTravelChrome(state: TimeTravelState): TimeTravelChrome {
  const historical = isCloneReadOnly(state);
  const panelOpen = showTimelinePanel(state);
  return {
    panelOpen,
    returnToLiveVisible: showReturnToLive(state),
    bannerVisible: historical,
    statusText: historical
      ? `Viewing history step ${state.step} of ${state.maxStep} (read-only)`
      : panelOpen
      ? "Live editing — scrub the slider to explore history"
      : "",
  };
}

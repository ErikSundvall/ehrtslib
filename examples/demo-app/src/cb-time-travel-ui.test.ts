import { assertEquals } from "@std/assert";
import {
  deriveTimeTravelChrome,
  type TimeTravelChrome,
} from "./cb-time-travel-ui.ts";
import { initialTimeTravelState } from "./cb-time-travel.ts";

Deno.test("time travel UI: play control exposes accessible labels", () => {
  const live = deriveTimeTravelChrome(initialTimeTravelState(4));
  assertEquals(live.playLabel, "Play history");
  const playing: TimeTravelChrome = deriveTimeTravelChrome({
    ...initialTimeTravelState(4),
    panelOpen: true,
    step: 1,
    playing: true,
  });
  assertEquals(playing.playLabel, "Pause history playback");
});

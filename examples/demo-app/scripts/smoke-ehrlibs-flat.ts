/**
 * Smoke: Ehrlibs Accident report FLAT against published Web Template.
 * Run: deno run -A --no-check examples/demo-app/scripts/smoke-ehrlibs-flat.ts
 */
import { deserializeFromFlat } from "../../../serialization/simplified/flat_deserializer.ts";

const wtUrl =
  "https://raw.githubusercontent.com/Ehrlibs/openEHR-model-examples/main/local/theme-packs/sport-event-details/templates/Accident%20report%20including%20vital%20signs.wt.json";

const publishedWt = await (await fetch(wtUrl)).json();
const publishedFlat: Record<string, unknown> = {
  "ctx/language": "en",
  "ctx/territory": "SE",
  "ctx/time": "2026-08-02T10:15:00Z",
  "ctx/composer_name": "Dr. A. Smith",
  "ctx/category|code": "433",
  "ctx/category|value": "event",
  "ctx/category|terminology": "openehr",
  "ctx/setting|code": "225",
  "ctx/setting|value": "secondary medical care",
  "ctx/setting|terminology": "openehr",
  "accident_report_including_vital_signs/problem_diagnosis:0/injury":
    "Ankle sprain during marathon",
  "accident_report_including_vital_signs/problem_diagnosis:0/clinical_description":
    "Twisted left ankle at kilometre 18",
  "accident_report_including_vital_signs/problem_diagnosis:0/sport_event:0/event_name":
    "Stockholm Marathon 2026",
  "accident_report_including_vital_signs/vital_signs/pulse_oximetry:0/any_event:0/spo|numerator":
    98,
  "accident_report_including_vital_signs/vital_signs/pulse_oximetry:0/any_event:0/spo|denominator":
    100,
  "accident_report_including_vital_signs/vital_signs/pulse_oximetry:0/any_event:0/spo|type":
    2,
  "accident_report_including_vital_signs/vital_signs/respiration:0/any_event:0/rate|magnitude":
    18,
  "accident_report_including_vital_signs/vital_signs/respiration:0/any_event:0/rate|unit":
    "/min",
  "accident_report_including_vital_signs/vital_signs/pulse_heart_beat:0/any_event:0/rate|magnitude":
    92,
  "accident_report_including_vital_signs/vital_signs/pulse_heart_beat:0/any_event:0/rate|unit":
    "/min",
};

const rm = deserializeFromFlat(publishedFlat, publishedWt) as {
  _type?: string;
  content?: unknown[];
};
const n = Array.isArray(rm.content) ? rm.content.length : 0;
if (rm._type !== "COMPOSITION" || n < 1) {
  console.error("Unexpected RM:", rm._type, "content", n);
  Deno.exit(1);
}
console.log("OK — COMPOSITION with", n, "content entries");

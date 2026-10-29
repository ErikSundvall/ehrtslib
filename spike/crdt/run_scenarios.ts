#!/usr/bin/env -S deno run -A --config ../../deno.json
import { runAllScenarios } from "./scenarios.ts";

const results = await runAllScenarios();
for (const r of results) {
  console.log("\n===", r.name, `(${r.library})`, "===");
  console.log("ops:", r.mergedOpCount, "snapshot bytes:", r.snapshotBytes);
  console.log("CRDT list order:", r.crdtOrder.join(", "));
  console.log("sorted replay order:", r.sortedOrder.join(", "));
  console.log("applied:", r.applied, "skipped:", r.skipped.length);
  for (const s of r.skipped) {
    console.log("  skip", s.id, s.reason, "-", s.message.slice(0, 80));
  }
}

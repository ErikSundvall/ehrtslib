import { assertEquals } from "@std/assert";
import {
  allocateDemoUsername,
  parseDemoUsername,
} from "./cb-username-allocator.ts";
import { USERNAMES } from "./contribution-demo.ts";

Deno.test("username allocator: assigns roster in order before any suffix", () => {
  const inUse = new Set<string>();
  for (let i = 0; i < USERNAMES.length; i++) {
    const name = allocateDemoUsername(inUse);
    assertEquals(name, USERNAMES[i]);
    inUse.add(name);
  }
  assertEquals(allocateDemoUsername(inUse), `${USERNAMES[0]} 2`);
  inUse.add(`${USERNAMES[0]} 2`);
  assertEquals(allocateDemoUsername(inUse), `${USERNAMES[1]} 2`);
});

Deno.test("username allocator: reuses a base after a user leaves", () => {
  const inUse = new Set<string>(USERNAMES);
  inUse.delete("gp.dalton");
  assertEquals(allocateDemoUsername(inUse), "gp.dalton");
  inUse.delete(USERNAMES[0]!);
  assertEquals(allocateDemoUsername(inUse), USERNAMES[0]);
});

Deno.test("username allocator: parses roster suffixes", () => {
  assertEquals(parseDemoUsername("nurse.andersson"), {
    base: "nurse.andersson",
    generation: 1,
  });
  assertEquals(parseDemoUsername("dr.berg 2"), {
    base: "dr.berg",
    generation: 2,
  });
  assertEquals(parseDemoUsername("custom.user"), undefined);
});

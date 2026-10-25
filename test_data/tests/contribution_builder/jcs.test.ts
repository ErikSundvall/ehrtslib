/**
 * RFC 8785 (JCS) canonicalization used for the CB template hash (#163).
 */

import { assertEquals, assertThrows } from "@std/assert";
import {
  canonicalizeJson,
  JcsError,
  sha256Hex,
} from "../../../contribution_builder/mod.ts";

Deno.test("JCS — object members sorted by UTF-16 code units (RFC 8785 §3.2.3 example)", () => {
  const input = {
    "\u20ac": "Euro Sign",
    "\r": "Carriage Return",
    "\ufb33": "Hebrew Letter Dalet With Dagesh",
    "1": "One",
    "\ud83d\ude00": "Emoji: Grinning Face",
    "\u0080": "Control",
    "\u00f6": "Latin Small Letter O With Diaeresis",
  };
  const keys = Object.keys(JSON.parse(canonicalizeJson(input)));
  // JSON.parse puts integer-like keys first; check the raw order instead.
  const raw = canonicalizeJson(input);
  const order = [
    "\\r",
    "1",
    "\u0080",
    "\u00f6",
    "\u20ac",
    "\ud83d\ude00",
    "\ufb33",
  ];
  let pos = -1;
  for (const k of order) {
    const at = raw.indexOf(`"${k}":`);
    assertEquals(at > pos, true, `${JSON.stringify(k)} out of order in ${raw}`);
    pos = at;
  }
  assertEquals(keys.length, 7);
});

Deno.test("JCS — numbers, literals, whitespace and array order", () => {
  assertEquals(
    canonicalizeJson({
      b: [3, 1, 2],
      a: { y: null, x: true },
      n: [1e21, 1e-7, 0.000001, -0, 10.5],
    }),
    '{"a":{"x":true,"y":null},"b":[3,1,2],"n":[1e+21,1e-7,0.000001,0,10.5]}',
  );
  assertEquals(
    canonicalizeJson({ u: undefined, s: '\u2028\n"' }),
    '{"s":"\u2028\\n\\""}',
  );
});

Deno.test("JCS — rejects non-finite numbers and lone surrogates", () => {
  assertThrows(() => canonicalizeJson({ x: NaN }), JcsError);
  assertThrows(() => canonicalizeJson({ x: Infinity }), JcsError);
  assertThrows(() => canonicalizeJson("\ud800"), JcsError);
});

Deno.test("sha256Hex — known vector", async () => {
  assertEquals(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

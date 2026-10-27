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

// RFC 8785 test vectors, expected outputs copied from the RFC text.
const RFC_3_2_2_INPUT = String.raw`{
  "numbers": [333333333.33333329, 1E30, 4.50,
              2e-3, 0.000000000000000000000000001],
  "string": "\u20ac$\u000F\u000aA'\u0042\u0022\u005c\\\"\/",
  "literals": [null, true, false]
}`;

Deno.test("JCS — RFC 8785 §3.2.3 canonical form of the §3.2.2 sample", () => {
  assertEquals(
    canonicalizeJson(JSON.parse(RFC_3_2_2_INPUT)),
    String.raw`{"literals":[null,true,false],"numbers":[333333333.3333333,` +
      String.raw`1e+30,4.5,0.002,1e-27],"string":"€$\u000f\nA'B\"\\\\\"/"}`,
  );
});

Deno.test("JCS — RFC 8785 §3.2.4 UTF-8 bytes of the §3.2.3 sample", () => {
  const hex = `
    7b 22 6c 69 74 65 72 61 6c 73 22 3a 5b 6e 75 6c 6c 2c 74 72
    75 65 2c 66 61 6c 73 65 5d 2c 22 6e 75 6d 62 65 72 73 22 3a
    5b 33 33 33 33 33 33 33 33 33 2e 33 33 33 33 33 33 33 2c 31
    65 2b 33 30 2c 34 2e 35 2c 30 2e 30 30 32 2c 31 65 2d 32 37
    5d 2c 22 73 74 72 69 6e 67 22 3a 22 e2 82 ac 24 5c 75 30 30
    30 66 5c 6e 41 27 42 5c 22 5c 5c 5c 5c 5c 22 2f 22 7d`.trim().split(/\s+/);
  const bytes = new TextEncoder().encode(
    canonicalizeJson(JSON.parse(RFC_3_2_2_INPUT)),
  );
  assertEquals(
    Array.from(bytes, (b) => b.toString(16).padStart(2, "0")),
    hex,
  );
});

Deno.test("JCS — RFC 8785 §3.2.3 sorting sample gives the expected value order", () => {
  const input = JSON.parse(String.raw`{
    "\u20ac": "Euro Sign",
    "\r": "Carriage Return",
    "\ufb33": "Hebrew Letter Dalet With Dagesh",
    "1": "One",
    "\ud83d\ude00": "Emoji: Grinning Face",
    "\u0080": "Control",
    "\u00f6": "Latin Small Letter O With Diaeresis"
  }`);
  const values = [...canonicalizeJson(input).matchAll(/:"([^"]*)"/g)].map((
    m,
  ) => m[1]);
  assertEquals(values, [
    "Carriage Return",
    "One",
    "Control",
    "Latin Small Letter O With Diaeresis",
    "Euro Sign",
    "Emoji: Grinning Face",
    "Hebrew Letter Dalet With Dagesh",
  ]);
});

/** RFC 8785 Appendix B: IEEE 754 bits → JSON representation. */
const APPENDIX_B: [string, string][] = [
  ["0000000000000000", "0"],
  ["8000000000000000", "0"],
  ["0000000000000001", "5e-324"],
  ["8000000000000001", "-5e-324"],
  ["7fefffffffffffff", "1.7976931348623157e+308"],
  ["ffefffffffffffff", "-1.7976931348623157e+308"],
  ["4340000000000000", "9007199254740992"],
  ["c340000000000000", "-9007199254740992"],
  ["4430000000000000", "295147905179352830000"],
  ["44b52d02c7e14af5", "9.999999999999997e+22"],
  ["44b52d02c7e14af6", "1e+23"],
  ["44b52d02c7e14af7", "1.0000000000000001e+23"],
  ["444b1ae4d6e2ef4e", "999999999999999700000"],
  ["444b1ae4d6e2ef4f", "999999999999999900000"],
  ["444b1ae4d6e2ef50", "1e+21"],
  ["3eb0c6f7a0b5ed8c", "9.999999999999997e-7"],
  ["3eb0c6f7a0b5ed8d", "0.000001"],
  ["41b3de4355555553", "333333333.3333332"],
  ["41b3de4355555554", "333333333.33333325"],
  ["41b3de4355555555", "333333333.3333333"],
  ["41b3de4355555556", "333333333.3333334"],
  ["41b3de4355555557", "333333333.33333343"],
  ["becbf647612f3696", "-0.0000033333333333333333"],
  ["43143ff3c1cb0959", "1424953923781206.2"],
];

function fromIeee754(hex: string): number {
  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, BigInt(`0x${hex}`));
  return view.getFloat64(0);
}

Deno.test("JCS — RFC 8785 Appendix B number serialization samples", () => {
  for (const [bits, expected] of APPENDIX_B) {
    assertEquals(canonicalizeJson(fromIeee754(bits)), expected, bits);
    assertEquals(canonicalizeJson([fromIeee754(bits)]), `[${expected}]`, bits);
  }
  // NaN and Infinity (7fffffffffffffff, 7ff0000000000000) are errors.
  assertThrows(
    () => canonicalizeJson(fromIeee754("7fffffffffffffff")),
    JcsError,
  );
  assertThrows(
    () => canonicalizeJson(fromIeee754("7ff0000000000000")),
    JcsError,
  );
});

Deno.test("JCS — I-JSON wrapper rules kept from the hand-written version", () => {
  // toJSON is honoured, also when nested and in arrays.
  assertEquals(
    canonicalizeJson({
      d: new Date(0),
      w: [{ toJSON: () => ({ b: 1, a: 2 }) }],
    }),
    '{"d":"1970-01-01T00:00:00.000Z","w":[{"a":2,"b":1}]}',
  );
  // undefined: dropped as a member, null as an array item.
  assertEquals(
    canonicalizeJson([1, undefined, { x: undefined }]),
    "[1,null,{}]",
  );
  // Lone surrogates in member names too.
  assertThrows(() => canonicalizeJson({ "\udc00": 1 }), JcsError);
  assertThrows(() => canonicalizeJson(["ok", "\ud83d"]), JcsError);
  // Non-JSON values throw instead of being dropped or nulled.
  assertThrows(() => canonicalizeJson(undefined), JcsError);
  assertThrows(() => canonicalizeJson({ f: () => 1 }), JcsError);
  assertThrows(() => canonicalizeJson([() => 1]), JcsError);
  assertThrows(() => canonicalizeJson({ s: Symbol("x") }), JcsError);
  assertThrows(() => canonicalizeJson({ n: 1n }), JcsError);
  assertThrows(
    () => canonicalizeJson({ t: { toJSON: () => undefined } }),
    JcsError,
  );
  // Cycles throw JcsError; shared (acyclic) references are fine.
  const loop: Record<string, unknown> = {};
  loop.self = loop;
  assertThrows(() => canonicalizeJson(loop), JcsError);
  const shared = { a: 1 };
  assertEquals(canonicalizeJson([shared, shared]), '[{"a":1},{"a":1}]');
});

Deno.test("JCS — golden template hashes; only the identity member changed them (/1 → /2)", async () => {
  const { bindTemplate, templateContentForm, templateHashIdentity } =
    await import("../../../contribution_builder/mod.ts");
  // v1: computed with the hand-written RFC 8785 code over the content alone
  // (`ehrtslib-cb-opt-json/1`). v2: `{ identity, content }` (`/2`).
  const golden: Record<string, { v1: string; v2: string }> = {
    "ehrbase_blood_pressure_simple.de.v0.opt": {
      v1: "a681198f5ade6a30efa05efabc4ee71e51c139cfd09f145c7256f9d2c5f7bb1c",
      v2: "b8b03dbdbe65e3985c83f25878346d0c87c202a830914fc2fcd62a8edef319cf",
    },
    "Test_all_types.opt": {
      v1: "21a729c77f27aee4f45f9a37bc425085829331ffc80409f3d0c8daf7fc4f2693",
      v2: "b61ea1ba3baf79abaccdf3fe5f650c4caa909cfb58823ba5765ae94c9d1d1759",
    },
    "multilingual_en_sv_de.opt": {
      v1: "772a3f24e4d55731a32e213cfe6724f943c1021d7fa7a5b7e4c9a9f18d70948b",
      v2: "3c6b6332d1e2e94b97337cf9291c461a00bd346f4071cc7f4b5e28d96057e56a",
    },
  };
  for (const [name, { v1, v2 }] of Object.entries(golden)) {
    const xml = await Deno.readTextFile(
      new URL(`../../opt14/${name}`, import.meta.url),
    );
    const { binding, operationalTemplate } = await bindTemplate(xml);
    assertEquals(binding.hash.value, v2, name);
    // The content part is byte-identical to the /1 hashed form ...
    const content = canonicalizeJson(templateContentForm(operationalTemplate));
    assertEquals(await sha256Hex(content), v1, name);
    // ... and /2 is exactly {identity, content} over it.
    const identity = templateHashIdentity(binding);
    assertEquals(
      await sha256Hex(
        `{"content":${content},"identity":${canonicalizeJson(identity)}}`,
      ),
      v2,
      name,
    );
  }
});

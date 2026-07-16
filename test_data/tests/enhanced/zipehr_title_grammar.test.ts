import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  escapeTitleValue,
  formatLocatableTitle,
  parseLocatableTitle,
  splitTitlePairs,
  unescapeTitleValue,
} from "../../enhanced/serialization/zipehr/title_grammar.ts";

Deno.test("zipehr title grammar: round-trip pairs", () => {
  const fields = {
    te: "ChemoForm-MBA.v7",
    ar: "openEHR-EHR-COMPOSITION.self_reported_data.v1",
    rm: "1.1.0",
  };
  const title = formatLocatableTitle(fields);
  assertEquals(parseLocatableTitle(title), fields);
});

Deno.test("zipehr title grammar: emoji wire codes round-trip", () => {
  const fields = {
    id: "at0004",
    ar: true as const,
    te: "ChemoForm-MBA.v7",
    rm: "1.1.0",
  };
  const title = formatLocatableTitle(fields, "emoji");
  assertEquals(title, "🆔: at0004; Ⓐ; Ⓣ: ChemoForm-MBA.v7; ⚙️: 1.1.0");
  assertEquals(parseLocatableTitle(title), fields);
});

Deno.test("zipehr title grammar: semicolon escape in values", () => {
  const value = "a; b; c";
  const title = formatLocatableTitle({ id: value });
  assertEquals(splitTitlePairs(title).length, 1);
  assertEquals(parseLocatableTitle(title).id, value);
  assertEquals(unescapeTitleValue(escapeTitleValue(value)), value);
});

Deno.test("zipehr title grammar: quoted values with semicolons", () => {
  const value = 'say "hello"; world';
  const title = formatLocatableTitle({ ar: value });
  assertEquals(parseLocatableTitle(title).ar, value);
});

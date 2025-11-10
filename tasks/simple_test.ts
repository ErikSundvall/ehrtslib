// tasks/simple_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("simple test", () => {
    assertEquals(1, 1);
});
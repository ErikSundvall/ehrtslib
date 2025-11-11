// Deno test suite for the BASE package - Unimplemented Classes

import { assert } from "https://deno.land/std@0.224.0/testing/asserts.ts";

import { Integer, Real, Double, Character, Boolean, Octet, Integer64, Iso8601_date_time, Iso8601_date } from "../openehr_base.ts";

Deno.test("Integer.is_equal", () => {
    const int1 = new Integer(10);
    const int2 = new Integer(10);
    const int3 = new Integer(20);
    assert(int1.is_equal(int2));
    assert(!int1.is_equal(int3));
});

Deno.test("Integer.less_than", () => {
    const int1 = new Integer(10);
    const int2 = new Integer(20);
    assert(int1.less_than(int2));
    assert(!int2.less_than(int1));
});

Deno.test("Real.is_equal", () => {
    const r1 = new Real(10.5);
    const r2 = new Real(10.5);
    const r3 = new Real(20.5);
    assert(r1.is_equal(r2));
    assert(!r1.is_equal(r3));
});

Deno.test("Real.less_than", () => {
    const r1 = new Real(10.5);
    const r2 = new Real(20.5);
    assert(r1.less_than(r2));
    assert(!r2.less_than(r1));
});

Deno.test("Double.is_equal", () => {
    const d1 = new Double(10.5);
    const d2 = new Double(10.5);
    const d3 = new Double(20.5);
    assert(d1.is_equal(d2));
    assert(!d1.is_equal(d3));
});

Deno.test("Double.less_than", () => {
    const d1 = new Double(10.5);
    const d2 = new Double(20.5);
    assert(d1.less_than(d2));
    assert(!d2.less_than(d1));
});

Deno.test("Character.is_equal", () => {
    const c1 = new Character("a");
    const c2 = new Character("a");
    const c3 = new Character("b");
    assert(c1.is_equal(c2));
    assert(!c1.is_equal(c3));
});

Deno.test("Character.less_than", () => {
    const c1 = new Character("a");
    const c2 = new Character("b");
    assert(c1.less_than(c2));
    assert(!c2.less_than(c1));
});

Deno.test("Boolean.is_equal", () => {
    const b1 = new Boolean(true);
    const b2 = new Boolean(true);
    const b3 = new Boolean(false);
    assert(b1.is_equal(b2));
    assert(!b1.is_equal(b3));
});

Deno.test("Octet.is_equal", () => {
    const o1 = new Octet(10);
    const o2 = new Octet(10);
    const o3 = new Octet(20);
    assert(o1.is_equal(o2));
    assert(!o1.is_equal(o3));
});

Deno.test("Octet.less_than", () => {
    const o1 = new Octet(10);
    const o2 = new Octet(20);
    assert(o1.less_than(o2));
    assert(!o2.less_than(o1));
});

Deno.test("Integer64.is_equal", () => {
    const i64_1 = new Integer64(10n);
    const i64_2 = new Integer64(10n);
    const i64_3 = new Integer64(20n);
    assert(i64_1.is_equal(i64_2));
    assert(!i64_1.is_equal(i64_3));
});

Deno.test("Integer64.less_than", () => {
    const i64_1 = new Integer64(10n);
    const i64_2 = new Integer64(20n);
    assert(i64_1.less_than(i64_2));
    assert(!i64_2.less_than(i64_1));
});

Deno.test("Iso8601_date_time.is_equal", () => {
    const dt1 = new Iso8601_date_time("2024-01-01T12:00:00Z");
    const dt2 = new Iso8601_date_time("2024-01-01T12:00:00Z");
    const dt3 = new Iso8601_date_time("2025-01-01T12:00:00Z");
    assert(dt1.is_equal(dt2));
    assert(!dt1.is_equal(dt3));
});

Deno.test("Iso8601_date_time.less_than", () => {
    const dt1 = new Iso8601_date_time("2024-01-01T12:00:00Z");
    const dt2 = new Iso8601_date_time("2025-01-01T12:00:00Z");
    assert(dt1.less_than(dt2));
    assert(!dt2.less_than(dt1));
});

Deno.test("Iso8601_date.is_equal", () => {
    const d1 = new Iso8601_date("2024-01-01");
    const d2 = new Iso8601_date("2024-01-01");
    const d3 = new Iso8601_date("2025-01-01");
    assert(d1.is_equal(d2));
    assert(!d1.is_equal(d3));
});

Deno.test("Iso8601_date.less_than", () => {
    const d1 = new Iso8601_date("2024-01-01");
    const d2 = new Iso8601_date("2025-01-01");
    assert(d1.less_than(d2));
    assert(!d2.less_than(d1));
});

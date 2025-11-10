// Deno test suite for the BASE package

import { assert } from "https://deno.land/std@0.177.0/testing/asserts.ts";

import { Any } from "../openehr_base.ts";

// Concrete implementation for testing purposes
class ConcreteAny extends Any {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  is_equal(other: Any): boolean {
    if (other instanceof ConcreteAny) {
      return this.value === other.value;
    }
    return false;
  }
}

Deno.test("Any.equal should return true for the same instance", () => {
  const a = new ConcreteAny(1);
  assert(a.equal(a));
});

Deno.test("Any.equal should return false for different instances", () => {
  const a = new ConcreteAny(1);
  const b = new ConcreteAny(1);
  assert(!a.equal(b));
});

Deno.test("Any.not_equal should return false for the same instance", () => {
  const a = new ConcreteAny(1);
  assert(!a.not_equal(a));
});

Deno.test("Any.not_equal should return true for different instances", () => {
  const a = new ConcreteAny(1);
  const b = new ConcreteAny(1);
  assert(a.not_equal(b));
});

Deno.test("Any.is_equal should return true for different instances with the same value", () => {
  const a = new ConcreteAny(1);
  const b = new ConcreteAny(1);
  assert(a.is_equal(b));
});

Deno.test("Any.is_equal should return false for different instances with different values", () => {
  const a = new ConcreteAny(1);
  const c = new ConcreteAny(2);
  assert(!a.is_equal(c));
});

import { Hash, String as OpenEHRString } from "../openehr_base.ts";

Deno.test("Any.type_of should return the correct class name", () => {
  const a = new ConcreteAny(1);
  assert(a.type_of(a) === "ConcreteAny");
});

Deno.test("Hash constructor initializes with entries", () => {
  const key1 = new OpenEHRString();
  key1.value = "one";
  const key2 = new OpenEHRString();
  key2.value = "two";
  const hash = new Hash<OpenEHRString, number>([[key1, 1], [key2, 2]]);
  assert(hash.count() === 2);
  assert(hash.item(key1) === 1);
});

Deno.test("Hash.has_key returns true for existing keys", () => {
  const key1 = new OpenEHRString();
  key1.value = "one";
  const hash = new Hash<OpenEHRString, number>([[key1, 1]]);
  assert(hash.has_key(key1));
});

Deno.test("Hash.has_key returns false for non-existing keys", () => {
    const key1 = new OpenEHRString();
    key1.value = "one";
    const key2 = new OpenEHRString();
    key2.value = "two";
    const hash = new Hash<OpenEHRString, number>([[key1, 1]]);
    assert(!hash.has_key(key2));
});

Deno.test("Hash.has returns true for existing values", () => {
    const key1 = new OpenEHRString();
    key1.value = "one";
    const hash = new Hash<OpenEHRString, number>([[key1, 1]]);
    assert(hash.has(1));
});

Deno.test("Hash.has returns false for non-existing values", () => {
    const key1 = new OpenEHRString();
    key1.value = "one";
    const hash = new Hash<OpenEHRString, number>([[key1, 1]]);
    assert(!hash.has(2));
});

Deno.test("Hash.count returns the correct number of items", () => {
    const key1 = new OpenEHRString();
    key1.value = "one";
    const key2 = new OpenEHRString();
    key2.value = "two";
    const hash = new Hash<OpenEHRString, number>([[key1, 1], [key2, 2]]);
    assert(hash.count() === 2);
});

Deno.test("Hash.is_empty returns true for an empty hash", () => {
    const hash = new Hash();
    assert(hash.is_empty());
});

Deno.test("Hash.is_empty returns false for a non-empty hash", () => {
    const key1 = new OpenEHRString();
    key1.value = "one";
    const hash = new Hash<OpenEHRString, number>([[key1, 1]]);
    assert(!hash.is_empty());
});

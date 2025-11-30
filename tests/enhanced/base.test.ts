// Deno test suite for the BASE package

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";

import { Any, Boolean as OpenEHRBoolean } from "../../openehr_base.ts";

// Concrete implementation for testing purposes
class ConcreteAny extends Any {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  is_equal(other: Any): OpenEHRBoolean {
    if (other instanceof ConcreteAny) {
      return new OpenEHRBoolean(this.value === other.value);
    }
    return new OpenEHRBoolean(false);
  }
}

Deno.test("Any.equal should return true for the same instance", () => {
  const a = new ConcreteAny(1);
  assert(a.equal(a).value);
});

Deno.test("Any.equal should return false for different instances", () => {
  const a = new ConcreteAny(1);
  const b = new ConcreteAny(1);
  assert(!a.equal(b).value);
});

Deno.test("Any.not_equal should return false for the same instance", () => {
  const a = new ConcreteAny(1);
  assert(!a.not_equal(a).value);
});

Deno.test("Any.not_equal should return true for different instances", () => {
  const a = new ConcreteAny(1);
  const b = new ConcreteAny(1);
  assert(a.not_equal(b).value);
});

Deno.test("Any.is_equal should return true for different instances with the same value", () => {
  const a = new ConcreteAny(1);
  const b = new ConcreteAny(1);
  assert(a.is_equal(b).value);
});

Deno.test("Any.is_equal should return false for different instances with different values", () => {
  const a = new ConcreteAny(1);
  const c = new ConcreteAny(2);
  assert(!a.is_equal(c).value);
});

import { Hash, String as OpenEHRString } from "../../openehr_base.ts";

Deno.test("Any.type_of should return the correct class name", () => {
  const a = new ConcreteAny(1);
  assert(a.type_of(a).value === "ConcreteAny");
});

Deno.test("Hash constructor initializes with entries", () => {
  const key1 = new OpenEHRString();
  key1.value = "one";
  const key2 = new OpenEHRString();
  key2.value = "two";
  const hash = new Hash<OpenEHRString, number>([[key1, 1], [key2, 2]]);
  assertEquals(hash.count().value, 2);
  assertEquals(hash.item(key1), 1);
});

Deno.test("Hash.has_key returns true for existing keys", () => {
  const key1 = new OpenEHRString();
  key1.value = "one";
  const hash = new Hash<OpenEHRString, number>([[key1, 1]]);
  assert(hash.has_key(key1).value);
});

Deno.test("Hash.has_key returns false for non-existing keys", () => {
  const key1 = new OpenEHRString();
  key1.value = "one";
  const key2 = new OpenEHRString();
  key2.value = "two";
  const hash = new Hash<OpenEHRString, number>([[key1, 1]]);
  assert(!hash.has_key(key2).value);
});

Deno.test("Hash.has returns true for existing keys", () => {
  const key1 = new OpenEHRString();
  key1.value = "one";
  const hash = new Hash<OpenEHRString, number>();
  hash.put(key1, 1);
  assert(hash.has(key1).value);
});

Deno.test("Hash.has returns false for non-existing keys", () => {
  const key1 = new OpenEHRString();
  key1.value = "one";
  const key2 = new OpenEHRString();
  key2.value = "two";
  const hash = new Hash<OpenEHRString, number>();
  hash.put(key1, 1);
  assert(!hash.has(key2).value);
});

Deno.test("Hash.count returns the correct number of items", () => {
  const key1 = new OpenEHRString();
  key1.value = "one";
  const key2 = new OpenEHRString();
  key2.value = "two";
  const hash = new Hash<OpenEHRString, number>();
  hash.put(key1, 1);
  hash.put(key2, 2);
  assertEquals(hash.count().value, 2);
});

Deno.test("Hash.is_empty returns true for an empty hash", () => {
  const hash = new Hash();
  assert(hash.is_empty().value);
});

Deno.test("Hash.is_empty returns false for a non-empty hash", () => {
  const key1 = new OpenEHRString();
  key1.value = "one";
  const hash = new Hash<OpenEHRString, number>();
  hash.put(key1, 1);
  assert(!hash.is_empty().value);
});

// ===== ARCHETYPE_ID Tests =====
import { ARCHETYPE_ID } from "../../openehr_base.ts";

Deno.test("ARCHETYPE_ID.qualified_rm_entity extracts correct value", () => {
  const archetypeId = new ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-OBSERVATION.blood_pressure.v1";

  const qualified = archetypeId.qualified_rm_entity();
  assert(qualified.value === "openEHR-EHR-OBSERVATION");
});

Deno.test("ARCHETYPE_ID.rm_originator extracts correct value", () => {
  const archetypeId = new ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-OBSERVATION.blood_pressure.v1";

  const originator = archetypeId.rm_originator();
  assert(originator.value === "openEHR");
});

Deno.test("ARCHETYPE_ID.rm_name extracts correct value", () => {
  const archetypeId = new ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-OBSERVATION.blood_pressure.v1";

  const rmName = archetypeId.rm_name();
  assert(rmName.value === "EHR");
});

Deno.test("ARCHETYPE_ID.rm_entity extracts correct value", () => {
  const archetypeId = new ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-OBSERVATION.blood_pressure.v1";

  const entity = archetypeId.rm_entity();
  assert(entity.value === "OBSERVATION");
});

Deno.test("ARCHETYPE_ID.domain_concept extracts correct value", () => {
  const archetypeId = new ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-OBSERVATION.blood_pressure.v1";

  const concept = archetypeId.domain_concept();
  assert(concept.value === "blood_pressure");
});

Deno.test("ARCHETYPE_ID.version_id extracts correct value", () => {
  const archetypeId = new ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-OBSERVATION.blood_pressure.v1";

  const version = archetypeId.version_id();
  assert(version.value === "1");
});

Deno.test("ARCHETYPE_ID with specialization", () => {
  const archetypeId = new ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-OBSERVATION.blood_pressure-standing.v2";

  const concept = archetypeId.domain_concept();
  assert(concept.value === "blood_pressure-standing");

  const specialisation = archetypeId.specialisation();
  assert(specialisation.value === "standing");
});

Deno.test("ARCHETYPE_ID without specialization", () => {
  const archetypeId = new ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-OBSERVATION.blood_pressure.v1";

  const specialisation = archetypeId.specialisation();
  assert(specialisation.value === "");
});

// ===== HIER_OBJECT_ID Tests =====
import { HIER_OBJECT_ID, UUID } from "../../openehr_base.ts";

Deno.test("HIER_OBJECT_ID.root returns UUID for UUID-based ID", () => {
  const id = new HIER_OBJECT_ID();
  id.value = "550e8400-e29b-41d4-a716-446655440000";

  const root = id.root();
  assert(root instanceof UUID);
  assert(root.value === "550e8400-e29b-41d4-a716-446655440000");
});

Deno.test("HIER_OBJECT_ID.extension returns empty string when no extension", () => {
  const id = new HIER_OBJECT_ID();
  id.value = "550e8400-e29b-41d4-a716-446655440000";

  const ext = id.extension();
  assert(ext.value === "");
});

Deno.test("HIER_OBJECT_ID.extension returns correct value when present", () => {
  const id = new HIER_OBJECT_ID();
  id.value = "550e8400-e29b-41d4-a716-446655440000::local.hospital";

  const ext = id.extension();
  assert(ext.value === "local.hospital");
});

Deno.test("HIER_OBJECT_ID.has_extension returns false when no extension", () => {
  const id = new HIER_OBJECT_ID();
  id.value = "550e8400-e29b-41d4-a716-446655440000";

  assert(!id.has_extension().value);
});

Deno.test("HIER_OBJECT_ID.has_extension returns true when extension present", () => {
  const id = new HIER_OBJECT_ID();
  id.value = "550e8400-e29b-41d4-a716-446655440000::local";

  assert(id.has_extension().value);
});

// ===== Integer Tests =====
import { Integer } from "../../openehr_base.ts";

Deno.test("Integer.add performs addition", () => {
  const a = new Integer();
  a.value = 10;
  const b = new Integer();
  b.value = 3;

  const result = a.add(b);
  assert(result.value === 13);
});

Deno.test("Integer.subtract performs subtraction", () => {
  const a = new Integer();
  a.value = 10;
  const b = new Integer();
  b.value = 3;

  const result = a.subtract(b);
  assert(result.value === 7);
});

Deno.test("Integer.multiply performs multiplication", () => {
  const a = new Integer();
  a.value = 10;
  const b = new Integer();
  b.value = 3;

  const result = a.multiply(b);
  assert(result.value === 30);
});

Deno.test("Integer.less_than compares correctly", () => {
  const a = new Integer();
  a.value = 3;
  const b = new Integer();
  b.value = 10;

  assert(a.less_than(b).value);
  assert(!b.less_than(a).value);
});

Deno.test("Integer.is_equal compares values correctly", () => {
  const a = new Integer();
  a.value = 10;
  const b = new Integer();
  b.value = 10;
  const c = new Integer();
  c.value = 5;

  assert(a.is_equal(b).value);
  assert(!a.is_equal(c).value);
});

// ===== CODE_PHRASE Tests =====
import { CODE_PHRASE, TERMINOLOGY_ID } from "../../openehr_base.ts";

Deno.test("CODE_PHRASE can be created with terminology and code", () => {
  const codePhrase = CODE_PHRASE.from("SNOMED-CT", "38341003");

  assert(codePhrase.terminology_id?.value === "SNOMED-CT");
  assert(codePhrase.code_string === "38341003");
});

Deno.test("CODE_PHRASE.is_equal compares correctly", () => {
  const code1 = CODE_PHRASE.from("SNOMED-CT", "38341003");
  const code2 = CODE_PHRASE.from("SNOMED-CT", "38341003");

  assert(code1.is_equal(code2).value);
});

Deno.test("CODE_PHRASE.is_equal returns false for different codes", () => {
  const code1 = CODE_PHRASE.from("SNOMED-CT", "38341003");
  const code2 = CODE_PHRASE.from("SNOMED-CT", "73211009");

  assert(!code1.is_equal(code2).value);
});

// ===== OBJECT_REF Tests =====
import { OBJECT_REF } from "../../openehr_base.ts";

Deno.test("OBJECT_REF can be created with all properties", () => {
  const id = new HIER_OBJECT_ID();
  id.value = "550e8400-e29b-41d4-a716-446655440000";

  const ref = new OBJECT_REF();
  ref.id = id;
  ref.namespace = "local"; // Can assign primitive string directly
  ref.type = "COMPOSITION"; // Can assign primitive string directly

  assert(ref.id.value === "550e8400-e29b-41d4-a716-446655440000");
  assert(ref.namespace === "local");
  assert(ref.type === "COMPOSITION");
});

Deno.test("OBJECT_REF.is_equal compares correctly", () => {
  const id1 = new HIER_OBJECT_ID();
  id1.value = "550e8400-e29b-41d4-a716-446655440000";

  const ref1 = new OBJECT_REF();
  ref1.id = id1;
  ref1.namespace = "local";
  ref1.type = "COMPOSITION";

  const id2 = new HIER_OBJECT_ID();
  id2.value = "550e8400-e29b-41d4-a716-446655440000";

  const ref2 = new OBJECT_REF();
  ref2.id = id2;
  ref2.namespace = "local";
  ref2.type = "COMPOSITION";

  assert(ref1.is_equal(ref2));
});

// ===== Dual Approach Pattern Tests for BASE =====
// Tests for the dual getter/setter pattern in BASE package

Deno.test("Dual Approach - String accepts primitive and returns primitive", () => {
  const str = new OpenEHRString();
  
  // Set with primitive
  str.value = "Hello World";
  
  // Get returns primitive
  assertEquals(typeof str.value, "string");
  assertEquals(str.value, "Hello World");
});

Deno.test("Dual Approach - String.from() creates wrapper from primitive", () => {
  const str = OpenEHRString.from("Test Value");
  
  assertEquals(str.value, "Test Value");
  assert(str instanceof OpenEHRString);
});

Deno.test("Dual Approach - Integer accepts primitive and returns primitive", () => {
  const int = new Integer();
  
  // Set with primitive
  int.value = 42;
  
  // Get returns primitive
  assertEquals(typeof int.value, "number");
  assertEquals(int.value, 42);
});

Deno.test("Dual Approach - Integer.from() creates wrapper from primitive", () => {
  const int = Integer.from(100);
  
  assertEquals(int.value, 100);
  assert(int instanceof Integer);
});

Deno.test("Dual Approach - Boolean accepts primitive and returns primitive", () => {
  const bool = new OpenEHRBoolean();
  
  // Set with primitive
  bool.value = true;
  
  // Get returns primitive
  assertEquals(typeof bool.value, "boolean");
  assertEquals(bool.value, true);
});

Deno.test("Dual Approach - Boolean.from() creates wrapper from primitive", () => {
  const bool = OpenEHRBoolean.from(false);
  
  assertEquals(bool.value, false);
  assert(bool instanceof OpenEHRBoolean);
});

Deno.test("Dual Approach - CODE_PHRASE code_string with primitive", () => {
  const codePhrase = new CODE_PHRASE();
  
  // Set with primitive
  codePhrase.code_string = "at0001";
  
  // Get returns primitive
  assertEquals(typeof codePhrase.code_string, "string");
  assertEquals(codePhrase.code_string, "at0001");
});

Deno.test("Dual Approach - CODE_PHRASE $code_string returns wrapper", () => {
  const codePhrase = new CODE_PHRASE();
  codePhrase.code_string = "at0001";
  
  // $code_string returns wrapper
  const wrapper = codePhrase.$code_string;
  assert(wrapper !== undefined);
  assert(wrapper instanceof OpenEHRString);
  assertEquals(wrapper.value, "at0001");
});

Deno.test("Dual Approach - OBJECT_REF namespace with primitive", () => {
  const ref = new OBJECT_REF();
  
  // Set with primitive
  ref.namespace = "local";
  
  // Get returns primitive
  assertEquals(typeof ref.namespace, "string");
  assertEquals(ref.namespace, "local");
});

Deno.test("Dual Approach - OBJECT_REF $namespace returns wrapper", () => {
  const ref = new OBJECT_REF();
  ref.namespace = "local";
  
  // $namespace returns wrapper
  const wrapper = ref.$namespace;
  assert(wrapper !== undefined);
  assert(wrapper instanceof OpenEHRString);
  assertEquals(wrapper.value, "local");
});

Deno.test("Dual Approach - ARCHETYPE_ID value with primitive", () => {
  const archetypeId = new ARCHETYPE_ID();
  
  // Set with primitive
  archetypeId.value = "openEHR-EHR-OBSERVATION.test.v1";
  
  // Get returns primitive
  assertEquals(typeof archetypeId.value, "string");
  assertEquals(archetypeId.value, "openEHR-EHR-OBSERVATION.test.v1");
});

Deno.test("Dual Approach - ARCHETYPE_ID $value returns wrapper", () => {
  const archetypeId = new ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-OBSERVATION.test.v1";
  
  // $value returns wrapper
  const wrapper = archetypeId.$value;
  assert(wrapper !== undefined);
  assert(wrapper instanceof OpenEHRString);
  assertEquals(wrapper.value, "openEHR-EHR-OBSERVATION.test.v1");
});

Deno.test("Dual Approach - TERMINOLOGY_ID value with primitive", () => {
  const termId = new TERMINOLOGY_ID();
  
  // Set with primitive
  termId.value = "SNOMED-CT";
  
  // Get returns primitive
  assertEquals(typeof termId.value, "string");
  assertEquals(termId.value, "SNOMED-CT");
});

Deno.test("Dual Approach - HIER_OBJECT_ID value with primitive", () => {
  const id = new HIER_OBJECT_ID();
  
  // Set with primitive
  id.value = "550e8400-e29b-41d4-a716-446655440000";
  
  // Get returns primitive
  assertEquals(typeof id.value, "string");
  assertEquals(id.value, "550e8400-e29b-41d4-a716-446655440000");
});

Deno.test("Dual Approach - wrapper methods accessible on base types", () => {
  const str = OpenEHRString.from("");
  
  // Test wrapper methods
  const isEmpty = str.is_empty();
  assertEquals(isEmpty.value, true);
  
  str.value = "not empty";
  const isNowEmpty = str.is_empty();
  assertEquals(isNowEmpty.value, false);
});

Deno.test("Dual Approach - handles undefined values in base types", () => {
  const str = new OpenEHRString();
  
  // Initially undefined
  assertEquals(str.value, undefined);
  
  // Set a value
  str.value = "test";
  assertEquals(str.value, "test");
  
  // Set back to undefined
  str.value = undefined;
  assertEquals(str.value, undefined);
});

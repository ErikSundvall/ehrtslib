// Deno test suite for TypeRegistry and error classes

import {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";

import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import {
  SerializationError,
  DeserializationError,
  TypeNotFoundError,
} from "../../enhanced/serialization/common/errors.ts";

// Test classes
class TestClass1 {
  value: string = "";
}

class TestClass2 {
  number: number = 0;
}

Deno.test("TypeRegistry - register and retrieve constructor", () => {
  TypeRegistry.clear();
  TypeRegistry.register("TEST_CLASS_1", TestClass1);
  
  const constructor = TypeRegistry.getConstructor("TEST_CLASS_1");
  assert(constructor === TestClass1);
});

Deno.test("TypeRegistry - register and retrieve type name", () => {
  TypeRegistry.clear();
  TypeRegistry.register("TEST_CLASS_2", TestClass2);
  
  const typeName = TypeRegistry.getTypeName(TestClass2);
  assertEquals(typeName, "TEST_CLASS_2");
});

Deno.test("TypeRegistry - hasType returns true for registered type", () => {
  TypeRegistry.clear();
  TypeRegistry.register("TEST_CLASS_1", TestClass1);
  
  assert(TypeRegistry.hasType("TEST_CLASS_1"));
  assert(!TypeRegistry.hasType("NON_EXISTENT"));
});

Deno.test("TypeRegistry - getTypeNameFromInstance", () => {
  TypeRegistry.clear();
  TypeRegistry.register("TEST_CLASS_1", TestClass1);
  
  const instance = new TestClass1();
  instance.value = "test";
  
  const typeName = TypeRegistry.getTypeNameFromInstance(instance);
  assertEquals(typeName, "TEST_CLASS_1");
});

Deno.test("TypeRegistry - getTypeNameFromInstance returns uppercase constructor name for unregistered", () => {
  TypeRegistry.clear();
  
  const instance = new TestClass1();
  const typeName = TypeRegistry.getTypeNameFromInstance(instance);
  
  // When type is not registered, falls back to uppercase constructor name
  assertEquals(typeName, "TESTCLASS1");
});

Deno.test("TypeRegistry - getAllTypeNames", () => {
  TypeRegistry.clear();
  TypeRegistry.register("TEST_CLASS_1", TestClass1);
  TypeRegistry.register("TEST_CLASS_2", TestClass2);
  
  const typeNames = TypeRegistry.getAllTypeNames();
  assertEquals(typeNames.length, 2);
  assert(typeNames.includes("TEST_CLASS_1"));
  assert(typeNames.includes("TEST_CLASS_2"));
});

Deno.test("TypeRegistry - clear removes all registrations", () => {
  TypeRegistry.clear();
  TypeRegistry.register("TEST_CLASS_1", TestClass1);
  assertEquals(TypeRegistry.getAllTypeNames().length, 1);
  
  TypeRegistry.clear();
  assertEquals(TypeRegistry.getAllTypeNames().length, 0);
});

Deno.test("TypeRegistry - registerModule throws error for non-class exports", () => {
  TypeRegistry.clear();
  
  const moduleWithNonClass = {
    TestClass1,
    TestClass2,
    notAClass: "string value",
    alsoNotAClass: 123,
  };
  
  // Should throw error when encountering non-class exports
  assertThrows(
    () => TypeRegistry.registerModule(moduleWithNonClass),
    Error,
    "Cannot register 'notAClass': expected a class constructor"
  );
});

Deno.test("TypeRegistry - registerModule succeeds with only classes", () => {
  TypeRegistry.clear();
  
  const cleanModule = {
    TestClass1,
    TestClass2,
  };
  
  TypeRegistry.registerModule(cleanModule);
  
  assert(TypeRegistry.hasType("TestClass1"));
  assert(TypeRegistry.hasType("TestClass2"));
});

// Error class tests
Deno.test("SerializationError - creates error with message and object", () => {
  const obj = { test: "value" };
  const error = new SerializationError("Test error", obj);
  
  assertEquals(error.message, "Test error");
  assertEquals(error.object, obj);
  assertEquals(error.name, "SerializationError");
});

Deno.test("SerializationError - includes cause", () => {
  const cause = new Error("Original error");
  const error = new SerializationError("Test error", {}, cause);
  
  assertEquals(error.cause, cause);
});

Deno.test("DeserializationError - creates error with message and data", () => {
  const data = "<xml>test</xml>";
  const error = new DeserializationError("Test error", data);
  
  assertEquals(error.message, "Test error");
  assertEquals(error.data, data);
  assertEquals(error.name, "DeserializationError");
});

Deno.test("TypeNotFoundError - creates error with type name", () => {
  const error = new TypeNotFoundError("UNKNOWN_TYPE", "<xml/>");
  
  assertEquals(error.message, "Type not found in registry: UNKNOWN_TYPE");
  assertEquals(error.typeName, "UNKNOWN_TYPE");
  assertEquals(error.name, "TypeNotFoundError");
});

/**
 * Apply a partial attribute bag to an already constructed RM instance.
 *
 * Call this from the most derived constructor, after `super()`. Subclass
 * field initialisers run after an ancestor constructor returns and would
 * wipe assignments made in `Any` or `BASIC_DEFINITIONS`.
 *
 * Unknown keys throw. Terse strings coerce for `CODE_PHRASE`, `DV_TEXT`,
 * `DV_CODED_TEXT`, and abstract `DATA_VALUE` slots. A plain object with
 * `_type` is built via `TypeRegistry` (`registerOpenEhrModelTypes`).
 *
 * `Object.assign(new X(), init)` does not use this function, so it still
 * does not coerce terse strings. The constructor is the supported path.
 */

import { createRequire } from "node:module";
import {
  attributesFor,
  isAbstractType,
  isDataValueType,
} from "../meta/rm_attributes.ts";
import type { RmAttributeMeta } from "../meta/rm_attributes.ts";
import { TypeRegistry } from "../serialization/common/type_registry.ts";
import {
  isTerseDvCodedTextString,
} from "../serialization/terse_strings.ts";

/** Partial attribute bag accepted by RM constructors. */
export type RmInit = object;

const PRIMITIVE_TYPES = new Set([
  "String",
  "Integer",
  "Integer64",
  "Real",
  "Double",
  "Boolean",
  "Octet",
  "Character",
  "Numeric",
  "Ordered_Numeric",
]);

type InitHelpers = {
  initCodePhrase: (value: unknown) => unknown;
  initDvCodedText: (value: unknown) => unknown;
  initDvText: (value: unknown) => unknown;
};

type Ctor = new () => object;

const require = createRequire(import.meta.url);
const initStack = new WeakSet<object>();

let initHelpers: InitHelpers | undefined;
let modelTypesReady = false;
let exportCtors: Map<string, Ctor> | undefined;

function loadInitHelpers(): InitHelpers {
  if (!initHelpers) {
    initHelpers = require("./init_helpers.ts") as InitHelpers;
  }
  return initHelpers;
}

function ensureModelTypes(): void {
  if (modelTypesReady || TypeRegistry.isOpenEhrModelTypesRegistered()) {
    modelTypesReady = true;
    return;
  }
  const { registerOpenEhrModelTypes } = require(
    "../serialization/common/openehr_model_registry.ts",
  ) as { registerOpenEhrModelTypes: () => void };
  registerOpenEhrModelTypes();
  modelTypesReady = true;
}

function ctorFor(typeName: string): Ctor | undefined {
  ensureModelTypes();
  const registered = TypeRegistry.getConstructor(typeName);
  if (registered) return registered as Ctor;
  if (!exportCtors) {
    exportCtors = new Map();
    const mods = [
      require("../rm/mod.ts") as Record<string, unknown>,
      require("../base/mod.ts") as Record<string, unknown>,
    ];
    for (const mod of mods) {
      for (const [name, value] of Object.entries(mod)) {
        if (exportCtors.has(name)) continue;
        if (typeof value === "function" && value.prototype) {
          exportCtors.set(name, value as Ctor);
        }
      }
    }
  }
  return exportCtors.get(typeName);
}

function constructEmpty(typeName: string): object {
  const Ctor = ctorFor(typeName);
  if (!Ctor) {
    throw new Error(`No constructor registered for RM type ${typeName}`);
  }
  return new Ctor();
}

/** Type name with a single outer generic argument list removed. */
export function rmTypeBaseName(typeName: string): string {
  const list = unwrapContainer(typeName);
  const name = list?.inner ?? typeName;
  const lt = name.indexOf("<");
  return lt > 0 ? name.slice(0, lt) : name;
}

function unwrapContainer(
  typeName: string,
): { kind: "List" | "Array"; inner: string } | undefined {
  for (const kind of ["List", "Array"] as const) {
    const prefix = `${kind}<`;
    if (typeName.startsWith(prefix) && typeName.endsWith(">")) {
      return { kind, inner: typeName.slice(prefix.length, -1) };
    }
  }
  return undefined;
}

function isClassInstance(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto !== null && proto !== Object.prototype;
}

function isWritableProperty(instance: object, key: string): boolean {
  let current: object | null = instance;
  while (current && current !== Object.prototype) {
    const desc = Object.getOwnPropertyDescriptor(current, key);
    if (desc) {
      if (desc.get || desc.set) return Boolean(desc.set);
      if (typeof desc.value === "function") return false;
      return desc.writable !== false;
    }
    current = Object.getPrototypeOf(current);
  }
  return true;
}

function hasStringValueAttribute(typeName: string): boolean {
  return attributesFor(typeName).some((attr) =>
    attr.name === "value" && attr.typeName === "String"
  );
}

function assignParent(instance: object, value: unknown, typeName: string): void {
  const setter = (instance as { setParent?: (parent: unknown) => void }).setParent;
  if (typeof setter !== "function") {
    throw new Error(
      `Cannot set "parent" on RM type ${typeName}: no setParent method`,
    );
  }
  if (value === undefined || value === null) {
    setter.call(instance, undefined);
    return;
  }
  if (typeof value === "object" && !Array.isArray(value) && isClassInstance(value)) {
    setter.call(instance, value);
    return;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record._type === "string") {
      setter.call(instance, coerceValue(value, {
        name: "parent",
        typeName: record._type,
        multiplicity: { min: 0, max: 1 },
        mandatory: false,
        declaredIn: typeName,
        polymorphic: false,
      }, typeName));
      return;
    }
  }
  throw new Error(
    `Cannot set "parent" on RM type ${typeName} from a plain object without _type (PATHABLE is abstract)`,
  );
}

function coerceValue(
  value: unknown,
  attr: RmAttributeMeta,
  ownerType: string,
): unknown {
  if (value === undefined || value === null) return value;

  const container = unwrapContainer(attr.typeName);
  if (container) {
    if (!Array.isArray(value)) {
      throw new Error(
        `Attribute "${attr.name}" on RM type ${ownerType} expects an array (${attr.typeName})`,
      );
    }
    const elementAttr: RmAttributeMeta = {
      ...attr,
      typeName: container.inner,
    };
    return value.map((element) => coerceValue(element, elementAttr, ownerType));
  }

  if (typeof value === "object" && isClassInstance(value)) {
    return value;
  }

  const base = rmTypeBaseName(attr.typeName);

  if (PRIMITIVE_TYPES.has(base)) {
    return value;
  }

  if (typeof value === "string") {
    return coerceString(value, base, attr, ownerType);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return coerceObject(value as Record<string, unknown>, base, attr, ownerType);
  }

  return value;
}

function coerceString(
  value: string,
  base: string,
  attr: RmAttributeMeta,
  ownerType: string,
): unknown {
  const helpers = loadInitHelpers();
  if (base === "CODE_PHRASE") {
    const parsed = helpers.initCodePhrase(value);
    if (parsed == null) {
      throw new Error(
        `Cannot coerce string to CODE_PHRASE for "${attr.name}" on RM type ${ownerType}`,
      );
    }
    return parsed;
  }
  if (base === "DV_CODED_TEXT") {
    const parsed = helpers.initDvCodedText(value);
    if (parsed == null) {
      throw new Error(
        `Cannot coerce string to DV_CODED_TEXT for "${attr.name}" on RM type ${ownerType}`,
      );
    }
    return parsed;
  }
  if (base === "DV_TEXT") {
    const parsed = helpers.initDvText(value);
    if (parsed == null) {
      throw new Error(
        `Cannot coerce string to DV_TEXT for "${attr.name}" on RM type ${ownerType}`,
      );
    }
    return parsed;
  }
  if (isAbstractType(base) && isDataValueType(base)) {
    if (isTerseDvCodedTextString(value)) {
      const parsed = helpers.initDvCodedText(value);
      if (parsed == null) {
        throw new Error(
          `Cannot coerce string to DV_CODED_TEXT for "${attr.name}" on RM type ${ownerType}`,
        );
      }
      return parsed;
    }
    const parsed = helpers.initDvText(value);
    if (parsed == null) {
      throw new Error(
        `Cannot coerce string to DV_TEXT for "${attr.name}" on RM type ${ownerType}`,
      );
    }
    return parsed;
  }
  if (!isAbstractType(base) && hasStringValueAttribute(base)) {
    const inst = constructEmpty(base);
    (inst as { value?: string }).value = value;
    return inst;
  }
  throw new Error(
    `Cannot coerce string "${value}" to ${base} for "${attr.name}" on RM type ${ownerType}`,
  );
}

function coerceObject(
  value: Record<string, unknown>,
  base: string,
  attr: RmAttributeMeta,
  ownerType: string,
): object {
  if (typeof value._type === "string") {
    const typeName = value._type;
    const rest: Record<string, unknown> = { ...value };
    delete rest._type;
    const inst = constructEmpty(typeName);
    applyRmInit(inst, rest);
    return inst;
  }
  if (isAbstractType(base) || base === "T" || base === "X") {
    throw new Error(
      `Cannot construct abstract type ${base} for "${attr.name}" on RM type ${ownerType} without _type`,
    );
  }
  const inst = constructEmpty(base);
  applyRmInit(inst, value);
  return inst;
}

function applyRmInitObject(
  instance: object,
  init: Record<string, unknown>,
): void {
  const typeName = instance.constructor?.name || "object";
  const byName = new Map(attributesFor(typeName).map((attr) => [attr.name, attr]));

  for (const key of Object.keys(init)) {
    const value = init[key];
    if (value === undefined) continue;
    if (key === "parent") {
      assignParent(instance, value, typeName);
      continue;
    }
    const attr = byName.get(key);
    if (!attr) {
      throw new Error(`Unknown attribute "${key}" for RM type ${typeName}`);
    }
    if (!isWritableProperty(instance, key)) {
      throw new Error(
        `Attribute "${key}" on RM type ${typeName} is not writable`,
      );
    }
    (instance as Record<string, unknown>)[key] = coerceValue(value, attr, typeName);
  }
}

/**
 * Assign known attributes from `init` onto `instance`.
 * No-op when `init` is `undefined` or `null`.
 */
export function applyRmInit(instance: object, init: unknown): void {
  if (init === undefined || init === null) return;
  if (typeof init !== "object" || Array.isArray(init)) {
    const typeName = instance.constructor?.name || "object";
    throw new Error(`RM init for ${typeName} must be a plain object`);
  }
  if (initStack.has(init)) {
    const typeName = instance.constructor?.name || "object";
    throw new Error(`Circular init object while applying RM type ${typeName}`);
  }
  initStack.add(init);
  try {
    applyRmInitObject(instance, init as Record<string, unknown>);
  } finally {
    initStack.delete(init);
  }
}

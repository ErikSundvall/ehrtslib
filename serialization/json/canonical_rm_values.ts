/**
 * Canonical-JSON checks for RM-class attribute values.
 *
 * These checks live beside the JSON canonical serializer and the strict JSON
 * deserializer. `walkRmTreeToPlain` is shared with YAML and must keep emitting
 * today's plain values; do not throw from that walker.
 */

import {
  attributesFor,
  hasRmType,
  isAbstractType,
  isSubtypeOf,
} from '../../meta/mod.ts';
import {
  initCodePhrase,
  initDvCodedText,
  initDvText,
} from '../../base/init_helpers.ts';
import {
  normalizeRmTypeName,
  TypeInferenceEngine,
} from '../common/type_inference.ts';
import { TypeRegistry } from '../common/type_registry.ts';
import { SerializationError } from '../common/errors.ts';
import { isTerseDvCodedText } from '../terse_format.ts';

/** What to do when a canonical attribute value is not an RM instance. */
export type CanonicalOnNonRmValue = 'throw' | 'coerce' | 'pass';

/**
 * BMM / BASE names that serialize as JSON primitives, not RM objects.
 * Matches `TypeInferenceEngine`'s primitive set.
 */
const PRIMITIVE_LIKE = new Set([
  'String',
  'Boolean',
  'Integer',
  'Integer64',
  'Real',
  'Double',
  'Byte',
  'Any',
  'Character',
  'Octet',
]);

export interface DeclaredAttributeSlot {
  /** BMM type as declared, including `List<...>` when the attribute is a list. */
  rawTypeName: string;
  /** Element type for a list, otherwise the declared type, with generics stripped. */
  typeName: string;
  isList: boolean;
  /** True when the (element) type is an RM object type, not a primitive or container. */
  isRmObject: boolean;
  /**
   * True when canonical JSON must carry `_type`: the declared type is abstract
   * or polymorphic (has RM object subtypes). Concrete types such as CODE_PHRASE
   * stay inferable.
   */
  requiresTypeTag: boolean;
}

/**
 * An RM object type is serialized as a JSON object. Primitive BMM types
 * (`String`, …) and empty containers (`Hash`, `List`, …) are not.
 */
function isRmObjectType(typeName: string): boolean {
  if (PRIMITIVE_LIKE.has(typeName)) return false;
  if (!hasRmType(typeName)) return false;
  if (isAbstractType(typeName)) return true;
  return attributesFor(typeName).length > 0;
}

/**
 * Declared BMM slot for `parentType.propertyName`, or undefined when the
 * parent is not a known RM type or the property is not one of its attributes.
 */
export function declaredAttributeSlot(
  parentType: string | undefined,
  propertyName: string | undefined,
): DeclaredAttributeSlot | undefined {
  if (!parentType || !propertyName) return undefined;
  const attr = attributesFor(parentType).find((a) => a.name === propertyName);
  if (!attr) return undefined;

  const rawTypeName = attr.typeName.trim();
  const isList = /^List\s*</i.test(rawTypeName);
  const typeName = normalizeRmTypeName(rawTypeName);
  if (!typeName) return undefined;

  const isRmObject = isRmObjectType(typeName);
  const requiresTypeTag = isRmObject &&
    TypeInferenceEngine.isPolymorphic(typeName);

  return { rawTypeName, typeName, isList, isRmObject, requiresTypeTag };
}

/**
 * BMM attribute names for an RM object type, including inherited attributes.
 * Undefined when `typeName` is not an RM object type (primitives, unknown types),
 * so callers do not reject every property of a type they cannot describe.
 */
export function knownRmAttributeNames(
  typeName: string,
): ReadonlySet<string> | undefined {
  const normalized = normalizeRmTypeName(typeName);
  if (!normalized || !isRmObjectType(normalized)) return undefined;
  return new Set(attributesFor(normalized).map((a) => a.name));
}

export function resolveOnNonRmValue(
  mode: CanonicalOnNonRmValue | undefined,
): CanonicalOnNonRmValue {
  if (mode === undefined || mode === 'throw') return 'throw';
  if (mode === 'coerce' || mode === 'pass') return mode;
  throw new SerializationError(
    `Invalid onNonRmValue '${String(mode)}'. Expected "throw", "coerce", or "pass".`,
  );
}

function isKnownRmInstance(value: object): boolean {
  const ctor = value.constructor as (new () => unknown) | undefined;
  if (!ctor || ctor === Object || ctor === Array) return false;
  const registered = TypeRegistry.getTypeName(ctor);
  if (registered) return isRmObjectType(registered);
  const name = ctor.name;
  if (!name || PRIMITIVE_LIKE.has(name)) return false;
  return isRmObjectType(name);
}

function concreteTypeTag(value: object): string | undefined {
  const tag = (value as { _type?: unknown })._type;
  if (typeof tag !== 'string' || !tag) return undefined;
  if (!isRmObjectType(tag) || isAbstractType(tag)) return undefined;
  return tag;
}

/**
 * Turn a terse or plain string into CODE_PHRASE, DV_CODED_TEXT, or DV_TEXT
 * when the declared type is one of those. Returns undefined when this slot
 * cannot be coerced (no abstract-type guess, including PARTY_PROXY).
 */
function coerceString(declaredType: string, value: string): object | undefined {
  if (isSubtypeOf(declaredType, 'CODE_PHRASE')) {
    return initCodePhrase(value);
  }
  if (isSubtypeOf(declaredType, 'DV_CODED_TEXT')) {
    return initDvCodedText(value);
  }
  if (isSubtypeOf(declaredType, 'DV_TEXT')) {
    if (isTerseDvCodedText(value)) return initDvCodedText(value);
    return initDvText(value);
  }
  return undefined;
}

function nonRmError(
  propertyLabel: string,
  slot: DeclaredAttributeSlot,
  detail: string,
): SerializationError {
  return new SerializationError(
    `Non-RM value for attribute '${propertyLabel}' (${slot.rawTypeName}): ${detail}`,
  );
}

function prepareOne(
  slot: DeclaredAttributeSlot,
  value: unknown,
  mode: CanonicalOnNonRmValue,
  propertyLabel: string,
): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value !== 'object') {
    if (mode === 'coerce' && typeof value === 'string') {
      const coerced = coerceString(slot.typeName, value);
      if (coerced) return coerced;
    }
    throw nonRmError(
      propertyLabel,
      slot,
      `expected an RM instance, got ${typeof value}`,
    );
  }

  if (Array.isArray(value)) {
    throw nonRmError(propertyLabel, slot, 'expected an RM instance, got array');
  }

  if (isKnownRmInstance(value)) return value;
  if (concreteTypeTag(value)) return value;

  const detail = slot.requiresTypeTag
    ? `declared type '${slot.typeName}' is abstract or polymorphic and the value has no concrete _type`
    : 'value is not a known RM class instance';
  throw nonRmError(propertyLabel, slot, detail);
}

/**
 * Prepare one attribute value for the canonical JSON walker.
 * `'pass'` returns the value unchanged. `'throw'` (default) and `'coerce'`
 * reject a primitive or a plain object in an RM-class slot; `'coerce'` first
 * tries the text/code init helpers for a string.
 */
export function prepareCanonicalAttributeValue(
  parentType: string | undefined,
  propertyName: string,
  value: unknown,
  mode: CanonicalOnNonRmValue,
): unknown {
  if (mode === 'pass' || value === null || value === undefined) return value;
  const slot = declaredAttributeSlot(parentType, propertyName);
  if (!slot?.isRmObject) return value;

  if (Array.isArray(value)) {
    if (!slot.isList) {
      throw nonRmError(
        propertyName,
        slot,
        'expected an RM instance, got array',
      );
    }
    return value.map((item, index) =>
      prepareOne(slot, item, mode, `${propertyName}[${index}]`)
    );
  }

  return prepareOne(slot, value, mode, propertyName);
}

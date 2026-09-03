/**
 * Common Serialization Utilities Module
 * 
 * Shared infrastructure for JSON, XML, and YAML serialization.
 */

export { TypeRegistry } from './type_registry.ts';
export {
  TypeInferenceEngine,
  normalizeRmTypeName,
} from './type_inference.ts';
export { HybridStyleFormatter } from './hybrid_formatter.ts';
export type { HybridFormatterOptions } from './hybrid_formatter.ts';
export type { ArchetypeNodeIdLocation, NameLocation } from './types.ts';
export { orderSerializationKeys } from './property_order.ts';
export type { PropertyOrderOptions } from './property_order.ts';
export {
  SerializationError,
  DeserializationError,
  TypeNotFoundError,
  InvalidFormatError,
} from './errors.ts';
export type { JsonSourceLocation } from './errors.ts';
export {
  buildJsonSourceIndex,
  enrichValidationMessageWithSource,
  escapeJsonPointerSegment,
  lookupJsonSourceLocation,
  rmPathToJsonPointer,
} from './json_source_index.ts';
export type { JsonSourceIndex } from './json_source_index.ts';
export {
  collectRmPropertyNames,
  resolveRmTypeName,
  walkRmTreeToPlain,
} from './rm_tree_walker.ts';
export type {
  RmTreeNodeContext,
  RmTreeWalkOptions,
} from './rm_tree_walker.ts';

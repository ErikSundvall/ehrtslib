/**
 * openEHR simplified formats (Web Template, FLAT, STRUCTURED).
 */

export type {
  WebTemplate,
  WebTemplateNode,
  WebTemplateInput,
  FlatPayload,
  FlatValidationResult,
  SimplifiedValidationMessage,
} from "./types.ts";

export {
  normalizeWebTemplateId,
  nodeIdToAtCode,
  templateRootId,
  joinAqlPath,
} from "./normalize.ts";

export {
  WebTemplateBuilder,
  buildWebTemplate,
  type WebTemplateBuilderOptions,
} from "./web_template_builder.ts";

export {
  FlatSerializer,
  serializeToFlat,
  serializeToFlatJson,
  type FlatSerializerOptions,
} from "./flat_serializer.ts";

export {
  FlatDeserializer,
  deserializeFromFlat,
  deserializeFromFlatJson,
} from "./flat_deserializer.ts";

export {
  StructuredSerializer,
  serializeToStructured,
  serializeToStructuredJson,
  type StructuredSerializerOptions,
} from "./structured_serializer.ts";

export {
  StructuredDeserializer,
  deserializeFromStructured,
  deserializeFromStructuredJson,
} from "./structured_deserializer.ts";

export { structuredToFlat } from "./structured_to_flat.ts";

export {
  validateFlatPayload,
  collectExpectedFlatKeys,
  type FlatValidatorOptions,
} from "./flat_validator.ts";

export { resolveAtPath, countInstancesAtPath } from "./instance_nav.ts";
export { extractValueFields, extractContextField } from "./value_extract.ts";
export { buildRmValue, applyContextFromFields } from "./value_build.ts";
export { assignAtAqlPath } from "./rm_instance_builder.ts";

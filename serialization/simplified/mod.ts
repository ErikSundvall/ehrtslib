/**
 * openEHR simplified formats (Web Template, FLAT, STRUCTURED).
 */

export type {
  FlatPayload,
  FlatValidationResult,
  SimplifiedValidationMessage,
  WebTemplate,
  WebTemplateInput,
  WebTemplateNode,
} from "./types.ts";

export {
  joinAqlPath,
  nodeIdToAtCode,
  normalizeWebTemplateId,
  templateRootId,
} from "./normalize.ts";

export {
  buildWebTemplate,
  WebTemplateBuilder,
  type WebTemplateBuilderOptions,
} from "./web_template_builder.ts";

export {
  FlatSerializer,
  type FlatSerializerOptions,
  serializeToFlat,
  serializeToFlatJson,
} from "./flat_serializer.ts";

export {
  deserializeFromFlat,
  deserializeFromFlatJson,
  FlatDeserializer,
} from "./flat_deserializer.ts";

export {
  serializeToStructured,
  serializeToStructuredJson,
  StructuredSerializer,
  type StructuredSerializerOptions,
} from "./structured_serializer.ts";

export {
  deserializeFromStructured,
  deserializeFromStructuredJson,
  StructuredDeserializer,
} from "./structured_deserializer.ts";

export { structuredToFlat } from "./structured_to_flat.ts";

export {
  collectExpectedFlatKeys,
  type FlatValidatorOptions,
  validateFlatPayload,
} from "./flat_validator.ts";

export {
  isWebTemplateJson,
  parseWebTemplate,
} from "./web_template_parser.ts";

export {
  WebTemplateToOptConverter,
  webTemplateToOpt,
} from "./web_template_to_opt.ts";

export { toTypedRm } from "./typed_rm.ts";

export {
  buildDvValue,
  extractFields,
  fallbackFieldMap,
  getFieldMap,
  inputsForRmType,
  resolveDvType,
} from "./dv_field_maps.ts";

export { countInstancesAtPath, resolveAtPath } from "./instance_nav.ts";
export { extractContextField, extractValueFields } from "./value_extract.ts";
export { applyContextFromFields, buildRmValue } from "./value_build.ts";
export { assignAtAqlPath } from "./rm_instance_builder.ts";

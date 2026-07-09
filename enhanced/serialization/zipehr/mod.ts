/**
 * ZipEHR compact serialization format (emoji type symbols).
 *
 * Two output variants:
 * - **zipehr.json**: flow-style JSON text from canonical JSON (_type) via direct emoji substitution
 * - **zipehr.yaml**: YAML with terse format, type inference, emoji symbols, and hybrid layout
 */

export {
  ARCHETYPE_DETAIL_SYMBOLS,
  buildLocatableStructuredObject,
  canFoldInferrableValueLeaf,
  compactArchetypeDetails,
  expandTerseString,
  getSymbolFor,
  inferrablePropertyType,
  inferType,
  isLocatableStructuredObject,
  isSymbolKey,
  isTerseCodePhrase,
  isTerseDvCodedText,
  isValueOnlyRmObject,
  loadSymbolMapFromText,
  parseLocatableStructuredObject,
  POLYMORPHIC_TYPES,
  PROPERTY_TYPE_MAP,
  resolveType,
  shortenTerseString,
  TERMINOLOGY_FIELD_PROMOTIONS,
  TERMINOLOGY_SHORTCUTS,
} from "./shared.ts";

export {
  buildReverseSymbolMap,
  loadDefaultSymbolMap,
  loadSymbolMap,
  loadSymbolMapFromFileText,
  type ZipehrSymbolVariant,
} from "./symbol_map.ts";

export {
  FLOW_YAML_CONFIG,
  jsonToCompactPlain,
  toPlainObjectCompact,
} from "./compact.ts";

export {
  applyEmojiToCompact,
  applyZipehrShorthands,
  convertObjectDirect,
  convertObjectEhrtslib,
} from "./convert.ts";

export { expandZipehrToCanonical } from "./deserialize.ts";

export {
  detectInputFormat,
  type InputDetectionResult,
  parseZipehrText,
  parseZipehrTextWithMeta,
  type ZipehrParseResult,
  type ZipehrVariant,
} from "./detect.ts";

export {
  stripZipehrJsonSchemaProperty,
  stripZipehrYamlSchemaDirective,
  warnMissingZipehrSchema,
  warnMismatchedZipehrSchema,
  ZIPEHR_SCHEMA_URL,
  ZIPEHR_YAML_SCHEMA_DIRECTIVE,
} from "./schema.ts";

export { flowFormat } from "./flow_format.ts";

export {
  rmToCanonicalPlain,
  serializeToJZipehr,
  serializeToYZipehr,
  serializeZipehrPlainToJson,
  serializeZipehrPlainToYaml,
  type ZipehrOutputVariant,
  zipehrTextToCanonical,
} from "./serializer.ts";

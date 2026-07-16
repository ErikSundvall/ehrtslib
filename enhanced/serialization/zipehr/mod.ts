/**
 * ZipEHR compact serialization format (emoji type symbols).
 *
 * Three output variants:
 * - **zipehr.json**: flow-style JSON text from canonical JSON (_type) via direct emoji substitution
 * - **zipehr.yaml**: YAML with terse format, type inference, emoji symbols, and hybrid layout
 * - **zipehr.xhtml**: FHIR-safe XHTML fragment with Ehrbase letter-code class/title metadata
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
  shouldUseTerminologyShortcuts,
  MAGNITUDE_STATUS_EXACT_RM,
  MAGNITUDE_STATUS_OPERATORS,
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
  buildLocatableTitleFromCanonical,
  ensureLetterCodeMapLoaded,
  serializeCanonicalToXhtml,
  serializeZipehrPlainToXhtml,
  wrapFhirNarrative,
  ZIPEHR_XHTML_VERSION_URI,
} from "./xhtml_serialize.ts";

export {
  xhtmlElementToZipehrObject,
  zipehrXhtmlToCanonical,
  zipehrXhtmlToLetterObject,
} from "./xhtml_deserialize.ts";

export {
  classFromRmType,
  getLetterCodeReverseMap,
  knownLetterClassTokens,
  loadLetterCodeMap,
  rmTypeFromClass,
} from "./letter_codes.ts";

export {
  escapeTitleValue,
  formatLocatableTitle,
  parseLocatableTitle,
  splitTitlePairs,
  unescapeTitleValue,
  type LocatableTitleFields,
} from "./title_grammar.ts";

export {
  rmToCanonicalPlain,
  serializeToHtml5Variant,
  serializeToJZipehr,
  serializeToXZipehr,
  serializeToYZipehr,
  serializeToZipehrHtml5,
  serializeZipehrPlainToJson,
  serializeZipehrPlainToYaml,
  type Html5Dialect,
  type Html5SerializeOptions,
  type ZipehrOutputVariant,
  zipehrTextToCanonical,
} from "./serializer.ts";

export {
  serializeCanonicalToHtml5,
  ZIPEHR_HTML5_FMT_TOKEN,
  ZIPEHR_HTML5_URI,
} from "./html5_serialize.ts";

export {
  detectHtml5Dialect,
  looksLikeZipehrHtml5,
  zipehrHtml5ToCanonical,
} from "./html5_deserialize.ts";

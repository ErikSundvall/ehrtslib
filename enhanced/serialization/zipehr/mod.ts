/**
 * ZipEHR compact serialization format (emoji type symbols).
 *
 * Two output variants:
 * - **j-zipehr**: flow-style JSON text from canonical JSON (_type) via direct emoji substitution
 * - **y-zipehr**: YAML with terse format, type inference, emoji symbols, and hybrid layout
 */

export {
  ARCHETYPE_DETAIL_SYMBOLS,
  buildLocatableBracket,
  buildLocatableFoldedString,
  canFoldInferrableValueLeaf,
  compactArchetypeDetails,
  expandTerseString,
  getSymbolFor,
  inferrablePropertyType,
  inferType,
  isSymbolKey,
  isTerseCodePhrase,
  isTerseDvCodedText,
  isValueOnlyRmObject,
  loadSymbolMapFromText,
  parseLocatableBracket,
  parseLocatableFolded,
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
  loadSymbolMapFromFileText,
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
  type ZipehrVariant,
} from "./detect.ts";

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

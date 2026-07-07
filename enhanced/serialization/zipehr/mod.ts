/**
 * ZipEHR compact serialization format (emoji type symbols).
 *
 * Two output variants:
 * - **j-zipehr**: flow-style JSON text from canonical JSON (_type) via direct emoji substitution
 * - **y-zipehr**: YAML with terse format, type inference, emoji symbols, and hybrid layout
 */

export {
  TERMINOLOGY_SHORTCUTS,
  TERMINOLOGY_FIELD_PROMOTIONS,
  ARCHETYPE_DETAIL_SYMBOLS,
  POLYMORPHIC_TYPES,
  PROPERTY_TYPE_MAP,
  loadSymbolMapFromText,
  getSymbolFor,
  shortenTerseString,
  expandTerseString,
  inferType,
  resolveType,
  isTerseCodePhrase,
  isTerseDvCodedText,
  compactArchetypeDetails,
  buildLocatableBracket,
  buildLocatableFoldedString,
  parseLocatableBracket,
  parseLocatableFolded,
  inferrablePropertyType,
  isSymbolKey,
} from "./shared.ts";

export {
  loadDefaultSymbolMap,
  loadSymbolMapFromFileText,
  buildReverseSymbolMap,
} from "./symbol_map.ts";

export {
  FLOW_YAML_CONFIG,
  jsonToCompactPlain,
  toPlainObjectCompact,
} from "./compact.ts";

export {
  convertObjectDirect,
  convertObjectEhrtslib,
  applyZipehrShorthands,
  applyEmojiToCompact,
} from "./convert.ts";

export { expandZipehrToCanonical } from "./deserialize.ts";

export {
  detectInputFormat,
  parseZipehrText,
  type ZipehrVariant,
  type InputDetectionResult,
} from "./detect.ts";

export { flowFormat } from "./flow_format.ts";

export {
  rmToCanonicalPlain,
  serializeToJZipehr,
  serializeToYZipehr,
  zipehrTextToCanonical,
  type ZipehrOutputVariant,
} from "./serializer.ts";

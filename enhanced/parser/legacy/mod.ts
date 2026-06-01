export {
  parseLegacyTemplateXml,
  asArray,
  textValue,
  parseCObject,
  parseAttribute,
  collectTermDefinitions,
} from "./xml_aom_mapper.ts";
export { isOptXml, parseOptXml, type OptXmlParseResult } from "./opt_xml_parser.ts";
export { isOetXml, parseOetXml, type OetParseResult, type OetTemplateDocument } from "./oet_xml_parser.ts";
export {
  ArchetypeRepository,
  parseArchetypeFile,
  type ArchetypeRepositoryOptions,
} from "./archetype_repository.ts";
export {
  detectTemplateInputFormat,
  parseTemplateInput,
  getOperationalTemplateFromInput,
  type TemplateInputFormat,
  type ParseTemplateInputResult,
  type ParseTemplateInputOptions,
} from "./parse_template_input.ts";
export {
  compileOetToOperational,
  type OetCompileOptions,
  type OetCompileResult,
} from "./oet_compiler.ts";

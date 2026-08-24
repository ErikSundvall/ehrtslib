/**
 * Generation Module
 * 
 * Exports generation and serialization functionality.
 */

export { RMInstanceGenerator } from "./rm_instance_generator.ts";
export type { GeneratorConfig, GenerationMode } from "./rm_instance_generator.ts";

export {
  availableTemplateLanguages,
  resolveTemplateLanguage,
  termCodeCandidates,
} from "./term_codes.ts";

export {
  assertTemplateInstanceCoverage,
  expectedTemplateSlots,
  templateInstanceCoverage,
} from "./template_instance_coverage.ts";
export type {
  CoverageResult,
  TemplateSlotExpectation,
} from "./template_instance_coverage.ts";

export {
  applyOperationalTemplateTermScopes,
  archetypeTermBagsForLanguage,
  lookupTermEntryInBag,
  lookupTermInBag,
  resolveLocatableLabel,
  resolveTermEntry,
  COMPONENT_TERM_DEFINITIONS_KEY,
  TERM_ARCHETYPE_SCOPE_KEY,
  TERM_NAME_FALLBACK_NODE_ID_KEY,
} from "./term_scope.ts";
export type {
  OperationalTemplateWithTermScopes,
  TermEntry,
  TermScopeMeta,
} from "./term_scope.ts";

export { TypeScriptGenerator } from "./typescript_generator.ts";
export type { TypeScriptGeneratorConfig } from "./typescript_generator.ts";

export { ADL2Serializer } from "./adl2_serializer.ts";
export type { ADL2SerializerConfig } from "./adl2_serializer.ts";

export { ADL14Serializer, adl14RoundTripMetrics } from "./adl14_serializer.ts";
export type { Adl14SerializerConfig } from "./adl14_serializer.ts";

export { OptXmlSerializer } from "./opt_xml_serializer.ts";
export type { OptXmlSerializerConfig } from "./opt_xml_serializer.ts";

export {
  annotationsForAqlPath,
  applyL10nToLocalizedNames,
  applyPathAnnotationsToOpt,
  collectL10nAnnotationsFromWebTemplateTree,
  extractL10nNames,
  flattenOptPathAnnotations,
  l10nAnnotationKey,
  l10nItemsFromLocalizedNames,
  languageFromL10nKey,
  normalizeAnnotationPath,
  OPT_ANNOTATION_LANG,
  optAnnotationsForXml,
  setOptPathAnnotation,
  setOptPathAnnotationItems,
  stripLeadingArchetypeId,
  stripNamePredicates,
} from "./opt_l10n.ts";
export type {
  AnnotationDocumentation,
  OptPathAnnotationMap,
} from "./opt_l10n.ts";

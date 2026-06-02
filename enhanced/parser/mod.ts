/**
 * ADL parsing (ADL 1.4 and ADL 2).
 */

export { ADL2Tokenizer, type Token, TokenType } from "./adl2_tokenizer.ts";
export { ADL2Parser, type ADL2ParseResult } from "./adl2_parser.ts";
export {
  parseAdl,
  type ParseAdlOptions,
  type ParseAdlResult,
} from "./parse_adl.ts";
export {
  type Adl14ConversionOptions,
  type Adl14ConversionResult,
  convertAdl14ToAdl2,
} from "./adl14_to_adl2_converter.ts";
export {
  type AdlDetectedVersion,
  detectAdlVersion,
  isAdl14,
} from "./adl_version.ts";
export {
  ArchetypeRepository,
  compileOetToOperational,
  detectTemplateInputFormat,
  getOperationalTemplateFromInput,
  isOetXml,
  isOptXml,
  isTemplateJson,
  parseOetXml,
  parseOptXml,
  parseTemplateInput,
  type ParseTemplateInputOptions,
  type ParseTemplateInputResult,
  parseTemplateJson,
  type TemplateInputFormat,
  type TemplateJsonParseResult,
} from "./legacy/mod.ts";
export { RulesParser } from "./rules_parser.ts";
export { serializeRulesSection } from "./rules_serializer.ts";
export {
  annotatedPaths,
  type AnnotationEntry,
  type AomTreeNode,
  buildAomTree,
  countAnnotationsForPath,
  getAnnotationsForPath,
  listAnnotations,
  removeAnnotation,
  setAnnotation,
  type SetAnnotationOptions,
} from "./aom_annotations.ts";
export {
  canBeGenerationRoot,
  getOperationalTemplateFromWorkspace,
  type ResolveOperationalOptions,
  type ResolveOperationalResult,
  resolveToOperationalTemplate,
  TemplateWorkspace,
  type TemplateWorkspaceFile,
} from "./template_workspace.ts";
export {
  type ClinicalModelExportEntry,
  type ClinicalModelFile,
  ClinicalModelWorkspace,
} from "./clinical_model_workspace.ts";
export {
  type GitHubFileEntry,
  type GitHubRepoRef,
  type GitHubTreeLoadResult,
  loadGitHubRepoTree,
  parseGitHubRepoSpec,
} from "./github_repo_loader.ts";
export {
  buildClinicalModelPathIndex,
  type ClinicalModelPathIndex,
  type GitHubFileRef,
  type GitHubTemplateClosureOptions,
  type GitHubTemplateClosureResult,
  type GitHubTemplateLoadProgress,
  loadGitHubTemplateClosure,
  parseGitHubTemplateFileUrl,
  resolveClinicalModelRef,
} from "./github_template_closure.ts";
export {
  collectTemplateJsonExternalRefs,
  collectTemplateJsonExternalRefsFromText,
  collectTemplateJsonOverlayIds,
} from "./template_json_dependencies.ts";
export {
  CLINICAL_MODEL_EXTENSIONS,
  isClinicalModelPath,
  normalizeClinicalModelPath,
} from "./clinical_model_paths.ts";

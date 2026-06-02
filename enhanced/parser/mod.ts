/**
 * ADL parsing (ADL 1.4 and ADL 2).
 */

export { ADL2Tokenizer, TokenType, type Token } from "./adl2_tokenizer.ts";
export { ADL2Parser, type ADL2ParseResult } from "./adl2_parser.ts";
export { parseAdl, type ParseAdlOptions, type ParseAdlResult } from "./parse_adl.ts";
export {
  convertAdl14ToAdl2,
  type Adl14ConversionOptions,
  type Adl14ConversionResult,
} from "./adl14_to_adl2_converter.ts";
export {
  detectAdlVersion,
  isAdl14,
  type AdlDetectedVersion,
} from "./adl_version.ts";
export {
  detectTemplateInputFormat,
  getOperationalTemplateFromInput,
  isOptXml,
  isOetXml,
  parseOptXml,
  parseOetXml,
  parseTemplateInput,
  isTemplateJson,
  parseTemplateJson,
  ArchetypeRepository,
  compileOetToOperational,
  type ParseTemplateInputOptions,
  type ParseTemplateInputResult,
  type TemplateInputFormat,
  type TemplateJsonParseResult,
} from "./legacy/mod.ts";
export { RulesParser } from "./rules_parser.ts";
export { serializeRulesSection } from "./rules_serializer.ts";
export {
  TemplateWorkspace,
  resolveToOperationalTemplate,
  getOperationalTemplateFromWorkspace,
  type TemplateWorkspaceFile,
  type ResolveOperationalOptions,
  type ResolveOperationalResult,
  canBeGenerationRoot,
} from "./template_workspace.ts";
export {
  ClinicalModelWorkspace,
  type ClinicalModelFile,
  type ClinicalModelExportEntry,
} from "./clinical_model_workspace.ts";
export {
  loadGitHubRepoTree,
  parseGitHubRepoSpec,
  type GitHubRepoRef,
  type GitHubFileEntry,
  type GitHubTreeLoadResult,
} from "./github_repo_loader.ts";
export {
  loadGitHubTemplateClosure,
  parseGitHubTemplateFileUrl,
  buildClinicalModelPathIndex,
  resolveClinicalModelRef,
  type GitHubFileRef,
  type GitHubTemplateClosureResult,
  type GitHubTemplateClosureOptions,
  type GitHubTemplateLoadProgress,
  type ClinicalModelPathIndex,
} from "./github_template_closure.ts";
export {
  collectTemplateJsonOverlayIds,
  collectTemplateJsonExternalRefs,
  collectTemplateJsonExternalRefsFromText,
} from "./template_json_dependencies.ts";
export {
  CLINICAL_MODEL_EXTENSIONS,
  isClinicalModelPath,
  normalizeClinicalModelPath,
} from "./clinical_model_paths.ts";

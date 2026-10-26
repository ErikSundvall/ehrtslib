/**
 * Contribution builder (CB). Design: docs/maintainers/contribution-builder-design.md
 * and ADRs 0002–0012. Phase 1 starts with template binding (ADR 0007).
 */

export {
  assertTemplateBindingUnchanged,
  bindTemplate,
  type BindTemplateOptions,
  type BoundTemplate,
  canonicalTemplateJson,
  checkTemplateBinding,
  compareTemplateBindings,
  MD5_CAM_KEY,
  PARENT_MD5_CAM_KEY,
  TEMPLATE_BINDING_SERIALISATION_VERSION,
  type TemplateBinding,
  type TemplateBindingComparison,
  type TemplateBindingDiagnosis,
  type TemplateBindingIssue,
  type TemplateBindingIssueCode,
  TemplateBindingMismatchError,
  templateCanonicalForm,
  templateContentForm,
  templateHash,
  type TemplateHashIdentity,
  templateHashIdentity,
  type TemplateInput,
  type TemplateSourceFormat,
  type TemplateSourceIdentifiers,
} from "./template_binding.ts";
export { canonicalizeJson, JcsError, sha256Hex } from "./jcs.ts";
export {
  type BuildContext,
  CbOperationError,
  ContributionBuild,
  type NewCompositionOptions,
  type OperationLogAdapter,
  type OperationOptions,
  SingleAppLogAdapter,
  toCanonicalRmJson,
  type VersionDraftInfo,
} from "./contribution_build.ts";
export {
  type AddInstanceOperation,
  canonicalLogText,
  type CbOperation,
  type CbOperationType,
  type CreateDraftOperation,
  OPERATION_LOG_FORMAT,
  OPERATION_LOG_FORMAT_VERSION,
  type OperationAuthor,
  operationLogBytes,
  type OperationLogDocument,
  OperationLogFormatError,
  readOperationLog,
  type RemoveInstanceOperation,
  REPLICA_RE,
  type RmJson,
  ROOT_TARGET,
  type SetComposerOperation,
  type SetValueOperation,
  SHORT_KEY_RE,
} from "./operation_log.ts";

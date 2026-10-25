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
  type TemplateBindingIssue,
  type TemplateBindingIssueCode,
  TemplateBindingMismatchError,
  templateCanonicalForm,
  templateHash,
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
export {
  type DraftProblem,
  type DraftProblemKind,
  type DraftProblemSource,
  type DraftValidateOptions,
  type DraftValidationMode,
  type DraftValidationResult,
  DraftValidator,
  LIFECYCLE_STATE_COMPLETE,
  LIFECYCLE_STATE_INCOMPLETE,
  lifecycleStateFor,
  parseInstancePath,
  problemsForNode,
  validateDraft,
} from "./draft_validation.ts";
export {
  type Adl14DownconversionOptions,
  type Adl14DownconversionResult,
  downConvertToAdl14,
} from "./adl14_downconvert.ts";
export {
  BUILDER_NAME,
  builderProvenance,
  CHANGE_TYPE,
  type ChangeType,
  type CommitConfig,
  type CommitDraftOptions,
  CommitError,
  type CommitErrorCode,
  feederAuditFor,
  prepareContribution,
  type PrepareContributionOptions,
  type PreparedContribution,
  type PreparedVersion,
} from "./commit.ts";
export {
  type CommitResult,
  type ItsRestAdapterOptions,
  ItsRestContributionAdapter,
  ItsRestError,
} from "./rest_adapter.ts";

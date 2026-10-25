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

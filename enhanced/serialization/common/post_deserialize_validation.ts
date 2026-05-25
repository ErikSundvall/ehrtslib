/**
 * Optional post-deserialize validation against an operational template or archetype.
 */

import type * as openehr_am from "../../openehr_am.ts";
import {
  TemplateValidator,
  type ValidationResult,
} from "../../validation/template_validator.ts";

export interface PostDeserializeValidationOptions {
  validateAgainstTemplate?: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE;
  validator?: TemplateValidator;
}

export function validateDeserializedInstance(
  instance: unknown,
  options?: PostDeserializeValidationOptions,
): ValidationResult | undefined {
  const template = options?.validateAgainstTemplate;
  if (!template || instance === null || instance === undefined) {
    return undefined;
  }

  const validator = options.validator ?? new TemplateValidator();
  return validator.validate(instance, template);
}

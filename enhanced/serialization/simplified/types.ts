/**
 * openEHR Web Template and simplified format (FLAT / STRUCTURED) types.
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

export interface WebTemplateInput {
  type: string;
  suffix?: string;
  validation?: Record<string, unknown>;
  list?: Array<Record<string, unknown>>;
}

export interface WebTemplateNode {
  id: string;
  name?: string;
  localizedName?: string;
  rmType: string;
  nodeId?: string;
  min: number;
  /** -1 = unbounded */
  max: number;
  aqlPath: string;
  inContext?: boolean;
  inputs?: WebTemplateInput[];
  children?: WebTemplateNode[];
  localizedNames?: Record<string, string>;
  localizedDescriptions?: Record<string, string>;
}

export interface WebTemplate {
  templateId: string;
  version?: string;
  defaultLanguage: string;
  tree: WebTemplateNode;
}

export type FlatPayload = Record<string, string | number | boolean | null>;

export interface SimplifiedValidationMessage {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface FlatValidationResult {
  valid: boolean;
  errors: SimplifiedValidationMessage[];
  warnings: SimplifiedValidationMessage[];
}

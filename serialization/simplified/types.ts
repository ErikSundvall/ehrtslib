/**
 * openEHR Web Template and simplified format (FLAT / STRUCTURED) types.
 * @see openehr://guides/specs/its-rest-simplified_formats
 * @see docs/vendor/simplified_formats.md
 */

export interface WebTemplateInputListItem {
  value: string;
  label?: string;
  localizedLabels?: Record<string, string>;
  localizedDescriptions?: Record<string, string>;
  validation?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WebTemplateInput {
  type: string;
  /**
   * Pipe suffix for the flat key (e.g. "magnitude"). Absent/undefined means
   * the value is written on the bare path key (no `|suffix`), per the
   * simplified formats spec (e.g. DV_TEXT, DV_DATE_TIME, DV_COUNT).
   */
  suffix?: string;
  validation?: Record<string, unknown>;
  list?: WebTemplateInputListItem[];
  /** True when a coded list is open (free text allowed via `|other`). */
  listOpen?: boolean;
  terminology?: string;
  defaultValue?: unknown;
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
  dependsOn?: string[];
  inputs?: WebTemplateInput[];
  children?: WebTemplateNode[];
  localizedNames?: Record<string, string>;
  localizedDescriptions?: Record<string, string>;
  annotations?: Record<string, unknown>;
  termBindings?: Record<string, { value?: string; terminologyId?: string }>;
}

export interface WebTemplate {
  templateId: string;
  semVer?: string;
  version?: string;
  defaultLanguage: string;
  languages?: string[];
  tree: WebTemplateNode;
}

/**
 * FLAT payload. Values are primitives; `|raw` keys may carry embedded
 * canonical JSON objects.
 */
export type FlatValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>;

export type FlatPayload = Record<string, FlatValue>;

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

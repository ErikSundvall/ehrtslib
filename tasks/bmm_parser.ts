// tasks/bmm_parser.ts

export interface BmmTypeReference {
  _type: string; // e.g., "P_BMM_SIMPLE_TYPE", "P_BMM_CONTAINER_TYPE", "P_BMM_GENERIC_TYPE"
  type: string; // The actual type name (e.g., "String", "Integer", "ARCHETYPE_ID")
  container_type?: string; // e.g., "List", "Set", "Hash" for container types
  generic_parameters?: BmmTypeReference[]; // For generic types
  root_type?: string; // For generic types
  generic_parameter_defs?: { [key: string]: BmmTypeReference }; // For generic types
}

export interface BmmFunctionParameter {
  _type: string; // e.g., "P_BMM_SINGLE_FUNCTION_PARAMETER"
  name: string;
  type: string; // Type name as string
}

export interface BmmFunction {
  name: string;
  documentation?: string;
  is_abstract?: boolean;
  parameters?: { [key: string]: BmmFunctionParameter };
  result?: BmmTypeReference;
  pre_conditions?: { [key: string]: string };
  post_conditions?: { [key: string]: string };
}

export interface BmmProperty {
  _type: string; // e.g., "P_BMM_SINGLE_PROPERTY", "P_BMM_GENERIC_PROPERTY", "P_BMM_CONTAINER_PROPERTY"
  name: string;
  documentation?: string;
  is_mandatory?: boolean;
  type: string; // Simple type name
  type_def?: BmmTypeReference; // For generic or container properties
  cardinality?: {
    lower: number;
    upper_unbounded?: boolean;
    upper?: number;
  };
}

export interface BmmClass {
  name: string;
  documentation?: string;
  is_abstract?: boolean;
  ancestors?: string[]; // Array of ancestor class names
  properties?: { [key: string]: BmmProperty };
  functions?: { [key: string]: BmmFunction };
  generic_parameter_defs?: {
    [key: string]: { name: string; conforms_to_type?: string };
  };
  invariants?: { [key: string]: string };
  _type?: string; // e.g., "P_BMM_ENUMERATION_STRING" for enums
  item_names?: string[]; // For enums
  item_documentations?: string[]; // For enums
}

export interface BmmPackage {
  name: string;
  classes?: string[]; // Array of class names directly within this package
  packages?: { [key: string]: BmmPackage }; // Nested packages
}

export interface BmmModel {
  bmm_version: string;
  rm_publisher: string;
  schema_name: string;
  rm_release: string;
  schema_revision: string;
  schema_lifecycle_state: string;
  schema_description: string;
  schema_author: string;
  packages: { [key: string]: BmmPackage };
  primitive_types: { [key: string]: BmmClass }; // Primitive types are also BmmClass
  class_definitions: { [key: string]: BmmClass }; // Actual class definitions
}

export async function readAndParseBmmJson(filePath: string): Promise<BmmModel> {
  const fileContent = await Deno.readTextFile(filePath);
  const bmmData: BmmModel = JSON.parse(fileContent);

  // Basic validation based on observed structure
  if (!bmmData.schema_name || !bmmData.packages || !bmmData.class_definitions) {
    throw new Error(
      "Invalid BMM JSON structure: missing schema_name, packages, or class_definitions.",
    );
  }
  return bmmData;
}

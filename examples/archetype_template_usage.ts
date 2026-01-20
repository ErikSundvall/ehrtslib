/**
 * Archetype and Template Usage Examples
 * 
 * Demonstrates ADL2 parsing, validation, and generation capabilities
 * for openEHR archetypes and operational templates.
 */

// Parsing ADL2
import { ADL2Tokenizer } from "../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../enhanced/parser/adl2_parser.ts";

// Validation with optional enhancements
import { TemplateValidator } from "../enhanced/validation/template_validator.ts";

// Generation
import { 
  RMInstanceGenerator,
  TypeScriptGenerator,
  ADL2Serializer 
} from "../enhanced/generation/mod.ts";

/**
 * Example 1: Parse ADL2 file
 */
export function exampleParseADL2(adl2Text: string) {
  // Tokenize
  const tokenizer = new ADL2Tokenizer(adl2Text);
  const tokens = tokenizer.tokenize();
  
  // Parse
  const parser = new ADL2Parser(tokens);
  const result = parser.parse();
  
  console.log("Parsed archetype:", result.archetype.archetype_id?.value);
  console.log("Definition:", result.archetype.definition?.rm_type_name);
  console.log("Warnings:", result.warnings);
  
  return result.archetype;
}

/**
 * Example 2: Validate RM instance with enhanced features
 * 
 * Demonstrates optional validation features:
 * - Primitive constraint validation (patterns, ranges, lists)
 * - UCUM unit validation
 * - Terminology validation
 * - TypeRegistry integration
 */
export async function exampleEnhancedValidate(rmInstance: any, template: any) {
  const validator = new TemplateValidator({
    failFast: false,
    maxDepth: 100,
    validateUnits: true,         // Enable UCUM unit validation
    validateTerminology: true,   // Enable terminology validation
    useTypeRegistry: true,       // Use TypeRegistry for type resolution
  });
  
  // Initialize async dependencies (UCUM service)
  await validator.initialize();
  
  const result = validator.validate(rmInstance, template);
  
  console.log("Valid:", result.valid);
  if (!result.valid) {
    console.log("Errors:");
    result.errors.forEach(err => {
      console.log(`  ${err.path}: ${err.message} [${err.constraintType}]`);
    });
  }
  
  return result;
}

/**
 * Example 3: Generate RM instance from template
 */
export function exampleGenerateInstance(template: any) {
  const generator = new RMInstanceGenerator({
    mode: "minimal",
    fillOptional: false,
  });
  
  const instance = generator.generate(template);
  
  console.log("Generated instance:", instance);
  
  return instance;
}

/**
 * Example 4: Generate TypeScript code with natural language names
 */
export function exampleGenerateTypeScript(template: any) {
  const generator = new TypeScriptGenerator({
    language: "en",
    includeValidation: true,
    terseStyle: true,
  });
  
  const code = generator.generate(template);
  
  console.log("Generated TypeScript:");
  console.log(code);
  
  return code;
}

/**
 * Example 5: Serialize archetype back to ADL2
 */
export function exampleSerializeADL2(archetype: any) {
  const serializer = new ADL2Serializer({
    indent: "    ",
  });
  
  const adl2 = serializer.serialize(archetype);
  
  console.log("Serialized ADL2:");
  console.log(adl2);
  
  return adl2;
}

/**
 * Example 6: Complete workflow - Parse, Validate, Generate
 */
export async function exampleCompleteWorkflow(adl2FilePath: string) {
  // 1. Parse ADL2 file
  const adl2Text = await Deno.readTextFile(adl2FilePath);
  const archetype = exampleParseADL2(adl2Text);
  
  // 2. Generate RM instance
  const instance = exampleGenerateInstance(archetype);
  
  // 3. Validate generated instance with enhanced features
  const validationResult = await exampleEnhancedValidate(instance, archetype);
  
  // 4. Generate TypeScript code
  const tsCode = exampleGenerateTypeScript(archetype);
  
  // 5. Serialize back to ADL2
  const serialized = exampleSerializeADL2(archetype);
  
  return {
    archetype,
    instance,
    validationResult,
    tsCode,
    serialized,
  };
}

/**
 * Example 7: Primitive constraint validation
 */
export async function examplePrimitiveValidation() {
  console.log("=== Primitive Constraint Validation ===\n");
  
  // String pattern validation
  const stringValidator = new TemplateValidator();
  console.log("String pattern validation: checking if value matches ^[A-Z]{3}$");
  
  // Integer range validation
  console.log("Integer range validation: checking if value is in range 0..100");
  
  // Real value validation
  console.log("Real value validation: checking decimal precision");
  
  // Boolean constraint validation
  console.log("Boolean constraint validation: checking allowed values");
}

/**
 * Example 8: UCUM unit validation
 */
export async function exampleUCUMValidation() {
  console.log("=== UCUM Unit Validation ===\n");
  
  const validator = new TemplateValidator({
    validateUnits: true,  // Enable UCUM validation
  });
  
  await validator.initialize();
  
  console.log("Validating units in DV_QUANTITY instances");
  console.log("Examples: mg/dL, Cel, [degF], m/s");
  
  // UCUM service checks units against official UCUM specification
}

// Run example if this is the main module
if (import.meta.main) {
  console.log("=== Archetype and Template Usage Examples ===\n");
  
  const testADL = `archetype (adl_version=2.0.5)
    openEHR-EHR-OBSERVATION.test.v1.0.0

language
    original_language = <"ISO_639-1::en">

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"Test">>
        >
    >`;
  
  console.log("Example 1: Parse ADL2");
  exampleParseADL2(testADL);
  
  console.log("\nArchetype and template capabilities demonstrated!");
  console.log("\nOptional enhancements available:");
  console.log("- Primitive constraint validation (patterns, ranges, lists)");
  console.log("- UCUM unit validation using @lhncbc/ucum-lhc");
  console.log("- Terminology validation (coded text, terminology IDs)");
  console.log("- TypeRegistry integration for type resolution");
}

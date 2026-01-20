/**
 * Phase 5b Usage Examples
 * 
 * Demonstrates ADL2 parsing, validation, and generation capabilities.
 */

// Parsing ADL2
import { ADL2Tokenizer } from "../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../enhanced/parser/adl2_parser.ts";

// Validation
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
 * Example 2: Validate RM instance against template
 */
export function exampleValidate(rmInstance: any, template: any) {
  const validator = new TemplateValidator({
    failFast: false,
    maxDepth: 100,
  });
  
  const result = validator.validate(rmInstance, template);
  
  console.log("Valid:", result.valid);
  if (!result.valid) {
    console.log("Errors:");
    result.errors.forEach(err => {
      console.log(`  ${err.path}: ${err.message}`);
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
  
  // 3. Validate generated instance
  const validationResult = exampleValidate(instance, archetype);
  
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

// Run example if this is the main module
if (import.meta.main) {
  console.log("=== Phase 5b Examples ===\n");
  
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
  
  console.log("\nPhase 5b capabilities demonstrated!");
}

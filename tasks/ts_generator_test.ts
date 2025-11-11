// tasks/ts_generator_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { generateTypeScriptClass, generateBasePackage } from "./ts_generator.ts";
import { readAndParseBmmJson, BmmClass } from "./bmm_parser.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";

Deno.test("generateTypeScriptClass generates CODE_PHRASE class with JSDoc correctly", async () => {
    const bmmModel = await readAndParseBmmJson("./tasks/test_bmm.json");
    const codePhraseClass = bmmModel.class_definitions["CODE_PHRASE"];

    // Note: The expectedTsClass does NOT include "type TERMINOLOGY_ID = any;" prefix
    // because generateTypeScriptClass() only generates a single class definition.
    // Type aliases for unresolved types are added by the higher-level orchestrator
    // (generateBasePackage or generate_ts_libs.ts), not by generateTypeScriptClass().
    // This test verifies the isolated class generation logic only.
    const expectedTsClass = "/**\n" +
        " * A fully coordinated (i.e. all coordination has been performed) term from a terminology service (as distinct from a particular terminology).\n" +
        " * \n" +
        " * Retain for LEGACY only, while ADL1.4 requires CODE_PHRASE.\n" +
        " */\n" +
        "export class CODE_PHRASE {\n" +
        "    /**\n" +
        "     * Identifier of the distinct terminology from which the code_string (or its elements) was extracted.\n" +
        "     */\n" +
        "    terminology_id?: TERMINOLOGY_ID;\n" +
        "    /**\n" +
        "     * The key used by the terminology service to identify a concept or coordination of concepts. This string is most likely parsable inside the terminology service, but nothing can be assumed about its syntax outside that context. \n" +
        "     */\n" +
        "    code_string?: string;\n" +
        "    /**\n" +
        "     * Optional attribute to carry preferred term corresponding to the code or expression in \\`_code_string_\\`. Typical use in integration situations which create mappings, and representing data for which both a (non-preferred) actual term and a preferred term are both required.\n" +
        "     */\n" +
        "    preferred_term?: string;\n" +
        "}\n";
    const generatedTsClass = generateTypeScriptClass(codePhraseClass);
    assertEquals(generatedTsClass, expectedTsClass);
});

Deno.test("generateBasePackage generates all classes for BASE package", async () => {
    const bmmModel = await readAndParseBmmJson("./tasks/test_bmm.json");
    const generatedBasePackage = generateBasePackage(bmmModel);

    // Basic check: ensure some expected classes are present
    assert(generatedBasePackage.includes("export class ARCHETYPE_ID"));
    assert(generatedBasePackage.includes("export class CODE_PHRASE"));
    assert(generatedBasePackage.includes("export class Any"));
    assert(generatedBasePackage.includes("export class String"));
    assert(generatedBasePackage.includes("export class Integer"));
    assert(generatedBasePackage.includes("export class Boolean"));
    assert(generatedBasePackage.includes("export class Double"));
    assert(generatedBasePackage.includes("export class Real"));
    assert(generatedBasePackage.includes("export class Character"));
    assert(generatedBasePackage.includes("export class Octet"));
    assert(generatedBasePackage.includes("export class UUID"));
    assert(generatedBasePackage.includes("export class Uri"));
});

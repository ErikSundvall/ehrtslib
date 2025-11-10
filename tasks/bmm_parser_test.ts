// tasks/bmm_parser_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { readAndParseBmmJson, BmmClass } from "./bmm_parser.ts";

Deno.test("readAndParseBmmJson reads and parses BMM JSON correctly", async () => {
    const bmmModel = await readAndParseBmmJson("./tasks/test_bmm.json");

    // Assert top-level properties
    assertEquals(bmmModel.schema_name, "base");
    assertEquals(bmmModel.rm_publisher, "openehr");
    assertEquals(bmmModel.rm_release, "1.3.0");
    
    // Assert package structure
    const orgOpenehrBaseBaseTypes = bmmModel.packages["org.openehr.base.base_types"];
    assertEquals(orgOpenehrBaseBaseTypes.name, "org.openehr.base.base_types");
    assertEquals(orgOpenehrBaseBaseTypes.packages!["identification"].name, "identification");
    assertEquals(orgOpenehrBaseBaseTypes.packages!["identification"].classes!.includes("ARCHETYPE_ID"), true);

    // Assert primitive types
    const anyPrimitive = bmmModel.primitive_types["Any"];
    assertEquals(anyPrimitive.name, "Any");
    assertEquals(anyPrimitive.documentation!.startsWith("Abstract ancestor class for all other classes."), true);

    // Assert a class from class_definitions
    const archetypeIdClass = bmmModel.class_definitions["ARCHETYPE_ID"];
    assertEquals(archetypeIdClass.name, "ARCHETYPE_ID");
    assertEquals(archetypeIdClass.ancestors!.includes("OBJECT_ID"), true);
    assertEquals(archetypeIdClass.properties!["value"].name, "value");
    assertEquals(archetypeIdClass.properties!["value"].type, "String");
    assertEquals(archetypeIdClass.properties!["value"].is_mandatory, true);
});
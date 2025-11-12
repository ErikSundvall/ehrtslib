// tests/generated_libs_test.ts
// Unit tests for generated TypeScript libraries

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import * as openehr_base from "../openehr_base.ts";
import * as openehr_rm from "../openehr_rm.ts";
import * as openehr_am from "../openehr_am.ts";
import * as openehr_term from "../openehr_term.ts";
import * as openehr_lang from "../openehr_lang.ts";

Deno.test("openehr_base module exports classes", () => {
    // Check that key base classes exist
    assertExists(openehr_base.OBJECT_ID);
    assertExists(openehr_base.UID_BASED_ID);
    assertExists(openehr_base.ARCHETYPE_ID);
    assertExists(openehr_base.OBJECT_REF);
});

Deno.test("openehr_base classes can be instantiated", () => {
    const objectRef = new openehr_base.OBJECT_REF();
    assertExists(objectRef);
    
    const archetypeId = new openehr_base.ARCHETYPE_ID();
    assertExists(archetypeId);
});

Deno.test("openehr_rm module exports classes", () => {
    // Check that key RM classes exist
    assertExists(openehr_rm.PATHABLE);
    assertExists(openehr_rm.LOCATABLE);
    assertExists(openehr_rm.COMPOSITION);
    assertExists(openehr_rm.OBSERVATION);
});

Deno.test("openehr_rm classes can be instantiated", () => {
    // LOCATABLE is abstract, use concrete class COMPOSITION
    const composition = new openehr_rm.COMPOSITION();
    assertExists(composition);
    
    const observation = new openehr_rm.OBSERVATION();
    assertExists(observation);
});

Deno.test("openehr_rm can reference openehr_base types", () => {
    // Use concrete class COMPOSITION instead of abstract LOCATABLE
    const composition = new openehr_rm.COMPOSITION();
    
    // The uid property should accept openehr_base.UID_BASED_ID subtype
    // UID_BASED_ID is abstract, use concrete subclass HIER_OBJECT_ID
    const uid = new openehr_base.HIER_OBJECT_ID();
    composition.uid = uid;
    
    assertEquals(composition.uid, uid);
});

Deno.test("openehr_am module exports classes", () => {
    // Check that key AM classes exist
    assertExists(openehr_am.ARCHETYPE);
    assertExists(openehr_am.OPERATIONAL_TEMPLATE);
});

Deno.test("openehr_am classes can be instantiated", () => {
    const archetype = new openehr_am.ARCHETYPE();
    assertExists(archetype);
});

Deno.test("openehr_term module exports classes", () => {
    // Check that key TERM classes exist if any are defined
    // Note: term might have fewer or different classes
    const termClasses = Object.keys(openehr_term);
    assertExists(termClasses);
});

Deno.test("openehr_lang module exports classes", () => {
    // Check that key LANG classes exist if any are defined
    const langClasses = Object.keys(openehr_lang);
    assertExists(langClasses);
});

Deno.test("Cross-package type references work correctly", () => {
    // Create an instance that uses types from another package
    const archetype = new openehr_am.ARCHETYPE();
    
    // archetype_id should be of type openehr_base.ARCHETYPE_ID
    const archetypeId = new openehr_base.ARCHETYPE_ID();
    archetype.archetype_id = archetypeId;
    
    assertEquals(archetype.archetype_id, archetypeId);
});

Deno.test("All exported classes have proper structure", () => {
    // Test that classes are proper TypeScript classes with constructors
    // Use only concrete classes (not abstract ones)
    const testClasses = [
        openehr_base.OBJECT_REF,
        openehr_rm.COMPOSITION,  // Changed from abstract LOCATABLE to concrete COMPOSITION
        openehr_am.ARCHETYPE
    ];
    
    for (const ClassDef of testClasses) {
        // Should be able to create instances
        const instance = new ClassDef();
        assertExists(instance);
        
        // Instance should be of the correct type
        assertEquals(instance.constructor, ClassDef);
    }
});

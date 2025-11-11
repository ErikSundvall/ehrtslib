# Instruction: Implementing the `ARCHETYPE_ID` Class

## 1. Description

The `ARCHETYPE_ID` class represents an identifier for archetypes. It follows a specific lexical format that encodes information about the archetype's origin, target model, concept, and version.

-   **Lexical Format:** `rm_originator '-' rm_name '-' rm_entity '.' concept_name { '-' specialisation }* '.v' version_number`
-   **Example:** `openEHR-EHR-OBSERVATION.blood_pressure.v1`
-   **Reference:** [openEHR BASE - ARCHETYPE_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_archetype_id_class)

## 2. Behavior

The ARCHETYPE_ID class must parse its value string and extract the various components.

### 2.1. `qualified_rm_entity(): String`

-   **Purpose:** Returns the globally qualified reference model entity.
-   **Format:** `rm_originator '-' rm_name '-' rm_entity`
-   **Example:** For value `"openEHR-EHR-OBSERVATION.blood_pressure.v1"`, returns `"openEHR-EHR-OBSERVATION"`
-   **Pseudo-code:**
    ```typescript
    qualified_rm_entity(): String {
      const val = this.value;
      if (!val) throw new Error("Value is not set");
      
      // Split at the first '.' to separate the qualified entity from the rest
      const dotIndex = val.indexOf('.');
      if (dotIndex === -1) throw new Error("Invalid ARCHETYPE_ID format");
      
      return String.from(val.substring(0, dotIndex));
    }
    ```

### 2.2. `rm_originator(): String`

-   **Purpose:** Returns the organization originating the reference model.
-   **Examples:** `"openEHR"`, `"CEN"`, `"HL7"`
-   **Pseudo-code:**
    ```typescript
    rm_originator(): String {
      const qualified = this.qualified_rm_entity().value;
      const parts = qualified.split('-');
      if (parts.length < 3) throw new Error("Invalid qualified_rm_entity format");
      return String.from(parts[0]);
    }
    ```

### 2.3. `rm_name(): String`

-   **Purpose:** Returns the name of the reference model.
-   **Examples:** `"RIM"`, `"EHR"`, `"EN13606"`
-   **Pseudo-code:**
    ```typescript
    rm_name(): String {
      const qualified = this.qualified_rm_entity().value;
      const parts = qualified.split('-');
      if (parts.length < 3) throw new Error("Invalid qualified_rm_entity format");
      return String.from(parts[1]);
    }
    ```

### 2.4. `rm_entity(): String`

-   **Purpose:** Returns the name of the ontological level within the reference model.
-   **Examples:** `"FOLDER"`, `"COMPOSITION"`, `"SECTION"`, `"OBSERVATION"`
-   **Pseudo-code:**
    ```typescript
    rm_entity(): String {
      const qualified = this.qualified_rm_entity().value;
      const parts = qualified.split('-');
      if (parts.length < 3) throw new Error("Invalid qualified_rm_entity format");
      return String.from(parts[2]);
    }
    ```

### 2.5. `domain_concept(): String`

-   **Purpose:** Returns the name of the concept represented by this archetype, including specialisation.
-   **Example:** For `"openEHR-EHR-OBSERVATION.blood_pressure-standing.v1"`, returns `"blood_pressure-standing"`
-   **Pseudo-code:**
    ```typescript
    domain_concept(): String {
      const val = this.value;
      if (!val) throw new Error("Value is not set");
      
      // Extract part between first '.' and '.v'
      const dotIndex = val.indexOf('.');
      const vIndex = val.lastIndexOf('.v');
      
      if (dotIndex === -1 || vIndex === -1 || vIndex <= dotIndex) {
        throw new Error("Invalid ARCHETYPE_ID format");
      }
      
      return String.from(val.substring(dotIndex + 1, vIndex));
    }
    ```

### 2.6. `specialisation(): String`

-   **Purpose:** Returns the name of specialisation of concept, if this archetype is a specialisation.
-   **Returns:** Empty string if not specialized.
-   **Example:** For `"blood_pressure-standing"`, returns `"standing"`
-   **Pseudo-code:**
    ```typescript
    specialisation(): String {
      const concept = this.domain_concept().value;
      const dashIndex = concept.indexOf('-');
      
      if (dashIndex === -1) {
        return String.from(""); // Not specialized
      }
      
      return String.from(concept.substring(dashIndex + 1));
    }
    ```

### 2.7. `version_id(): String`

-   **Purpose:** Returns the version of this archetype.
-   **Example:** For `"...v1"`, returns `"1"` or `"v1"` depending on interpretation
-   **Pseudo-code:**
    ```typescript
    version_id(): String {
      const val = this.value;
      if (!val) throw new Error("Value is not set");
      
      const vIndex = val.lastIndexOf('.v');
      if (vIndex === -1) throw new Error("Invalid ARCHETYPE_ID format");
      
      // Return everything after '.v'
      return String.from(val.substring(vIndex + 2));
    }
    ```

## 3. Invariants

-   **Physical_id_valid:** Value matches the regex pattern for ARCHETYPE_ID format
-   **Rm_originator_valid:** `not rm_originator().is_empty()`
-   **Rm_name_valid:** `not rm_name().is_empty()`
-   **Rm_entity_valid:** `not rm_entity().is_empty()`
-   **Domain_concept_valid:** `not domain_concept().is_empty()`
-   **Version_id_valid:** `not version_id().is_empty()`

## 4. Pre-conditions

-   Value must be set and follow the correct format before calling any of the extraction methods.

## 5. Post-conditions

-   All extraction methods should return non-empty strings for valid ARCHETYPE_IDs.

## 6. Example Usage

```typescript
const archetypeId = new ARCHETYPE_ID();
archetypeId.value = "openEHR-EHR-OBSERVATION.blood_pressure-standing.v2";

console.log(archetypeId.rm_originator().value);      // "openEHR"
console.log(archetypeId.rm_name().value);            // "EHR"
console.log(archetypeId.rm_entity().value);          // "OBSERVATION"
console.log(archetypeId.domain_concept().value);     // "blood_pressure-standing"
console.log(archetypeId.specialisation().value);     // "standing"
console.log(archetypeId.version_id().value);         // "2"
console.log(archetypeId.qualified_rm_entity().value); // "openEHR-EHR-OBSERVATION"
```

## 7. Test Cases

Key test cases to implement:
1. Test parsing of simple ARCHETYPE_ID without specialization
2. Test parsing of specialized ARCHETYPE_ID
3. Test error handling for invalid formats
4. Test all extraction methods return correct values
5. Test with various rm_originators and rm_names

## 8. References

-   [openEHR BASE Specification - ARCHETYPE_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_archetype_id_class)
-   [Archie ArchetypeID Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/archetyped/ArchetypeID.java)
-   [Java-libs ArchetypeID](https://github.com/openEHR/java-libs/blob/master/openehr-rm-core/src/main/java/org/openehr/rm/support/identification/ArchetypeID.java)

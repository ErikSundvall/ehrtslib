# Instruction: Implementing the `AUTHORED_RESOURCE` Class

## 1. Description

The `AUTHORED_RESOURCE` class is an abstract parent for authored clinical content like archetypes and templates. It contains metadata about authoring, translations, and lifecycle.

-   **Reference:** [openEHR BASE - AUTHORED_RESOURCE](https://specifications.openehr.org/releases/BASE/latest/resource.html#_authored_resource_class)

## 2. Behavior

### 2.1. Properties

#### Identification
-   **`uid: UUID`** - Unique identifier for the resource
-   **`original_language: Terminology_code`** - Language of original authoring

#### Description and Documentation
-   **`description: RESOURCE_DESCRIPTION`** - Metadata about the resource
-   **`annotations: RESOURCE_ANNOTATIONS`** - Annotations for the resource

#### Translation
-   **`translations: Hash<String, TRANSLATION_DETAILS>`** - Available translations

#### Lifecycle
-   **`is_controlled(): Boolean`** - Whether under change control

### 2.2. Query Methods

#### `languages_available(): List<String>`

-   **Purpose:** Return list of all available languages.
-   **Pseudo-code:**
    ```typescript
    languages_available(): List<String> {
      const langs = new List<String>();
      langs.append(this.original_language);
      
      if (this.translations) {
        for (const lang of this.translations.keys()) {
          langs.append(lang);
        }
      }
      
      return langs;
    }
    ```

#### `current_revision(): String`

-   **Purpose:** Return current version/revision identifier.
-   **Pseudo-code:**
    ```typescript
    current_revision(): String {
      // Extract from description or return default
      if (this.description && this.description.lifecycle_state) {
        return this.description.lifecycle_state;
      }
      return String.from("uncontrolled");
    }
    ```

## 3. Invariants

-   **Original_language_valid:** `original_language /= Void`
-   **Languages_available_valid:** `languages_available().has(original_language)`
-   **Description_valid:** `description /= Void`

## 4. Pre-conditions

-   Original language must be set.
-   Description must be provided.

## 5. Post-conditions

-   All metadata accessible.
-   Translation information available.

## 6. Example Usage

```typescript
// Create an archetype (subclass of AUTHORED_RESOURCE)
const archetype = new ARCHETYPE();

// Set identification
archetype.uid = UUID.generate();
archetype.original_language = Terminology_code.from("en");

// Set description
const desc = new RESOURCE_DESCRIPTION();
desc.lifecycle_state = String.from("published");
desc.original_author = /* ... */;
archetype.description = desc;

// Add translation
const translation = new TRANSLATION_DETAILS();
translation.language = Terminology_code.from("de");
translation.author = /* ... */;

const translations = new Hash<String, TRANSLATION_DETAILS>();
translations.put(String.from("de"), translation);
archetype.translations = translations;

// Query
const langs = archetype.languages_available();
console.log(langs.count().value);  // 2 (en + de)
```

## 7. Use in openEHR

AUTHORED_RESOURCE is the base for:
- **ARCHETYPE** - Clinical content patterns
- **TEMPLATE** - Constrained archetypes for specific use
- **TERMINOLOGY** - Terminology definitions

All these inherit the authoring metadata structure.

## 8. Test Cases

Key test cases to implement:
1. Test creation with required properties
2. Test uid assignment
3. Test original_language setting
4. Test description assignment
5. Test translations addition
6. Test languages_available() includes original and translated
7. Test current_revision() extraction
8. Test is_controlled() query
9. Test with multiple translations
10. Test invariant validation (original_language required)

## 9. References

-   [openEHR BASE - AUTHORED_RESOURCE](https://specifications.openehr.org/releases/BASE/latest/resource.html#_authored_resource_class)
-   [openEHR BASE - Resource Package](https://specifications.openehr.org/releases/BASE/latest/resource.html)
-   [Archie AuthoredResource](https://github.com/openEHR/archie/tree/master/openehr-rm/src/main/java/com/nedap/archie/rm/archetyped)

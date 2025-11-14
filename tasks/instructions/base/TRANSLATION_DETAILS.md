# Instruction: Implementing the `TRANSLATION_DETAILS` Class

## 1. Description

The `TRANSLATION_DETAILS` class contains metadata about a translation of a
resource.

- **Reference:**
  [openEHR BASE - TRANSLATION_DETAILS](https://specifications.openehr.org/releases/BASE/latest/resource.html#_translation_details_class)

## 2. Behavior

### 2.1. Properties

- **`language: Terminology_code`** - Target language
- **`author: Hash<String, String>`** - Translator details
- **`accreditation: String`** - Accreditation of translator
- **`other_details: Hash<String, String>`** - Additional info
- **`version_last_translated: String`** - Version that was translated

## 3. Example Usage

```typescript
const translation = new TRANSLATION_DETAILS();

translation.language = Terminology_code.from("de");

const author = new Hash<String, String>();
author.put(String.from("name"), String.from("Dr. Mueller"));
author.put(String.from("email"), String.from("mueller@hospital.de"));
translation.author = author;

translation.version_last_translated = String.from("1.0.0");
```

## 4. References

- [openEHR BASE - TRANSLATION_DETAILS](https://specifications.openehr.org/releases/BASE/latest/resource.html#_translation_details_class)

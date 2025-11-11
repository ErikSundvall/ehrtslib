# Instruction: Implementing the `CODE_SET` Class

## 1. Description

The `CODE_SET` class represents a collection of self-defining codes from external standards (ISO, IANA) or openEHR-specific domains.

-   **Reference:** [openEHR TERM - CODE_SET](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html#_code_sets)

## 2. Behavior

### 2.1. Properties

- `name: String` - Name of the code set
- `openehr_id: String` - Identifier used in openEHR RM
- `issuer: String` - Issuing organization (ISO, IANA, etc.)
- `codes: List<CODE>` - Individual codes
- `external_id: String` - Published name identifier
- `status: TERMINOLOGY_STATUS` - Active/deprecated status

### 2.2. Methods

- `has_code(code: String): Boolean` - Check if code exists
- `all_codes(): List<String>` - Get all code strings

## 3. Examples

Common code sets:
- `countries` (ISO 3166-1) - "US", "GB", "SE"
- `character_sets` (IANA) - "UTF-8", "ISO-8859-1"
- `languages` (ISO 639-1) - "en", "es", "zh"
- `media_types` (IANA) - "image/jpeg", "text/html"

## 4. Example Usage

```typescript
const countries = new CODE_SET();
countries.name = "countries";
countries.issuer = "ISO";
countries.openehr_id = "3166-1";

// Check if code exists
if (countries.has_code("US")) {
  console.log("US is valid");
}
```

## 5. References

-   **Official Specification:** [openEHR TERM - Code Sets](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html#_code_sets)

# Instruction: Implementing the `TERM_MAPPING` Class

## 1. Description

TERM_MAPPING represents a mapping of a term to an external terminology.

- **Reference:**
  [openEHR RM - TERM_MAPPING](https://specifications.openehr.org/releases/RM/latest/data_types.html#_term_mapping_class)

## 2. Behavior

### 2.1. Properties

- `match: Character` - Match type ('=', '<', '>', '?')
- `purpose: DV_CODED_TEXT` - Purpose of mapping
- `target: CODE_PHRASE` - Target code in external terminology

### 2.2. Match Types

- '=' - Equivalent
- '<' - Narrower than
- '>' - Broader than
- '?' - Unknown match

## 3. Example Usage

```typescript
const mapping = new TERM_MAPPING();
mapping.match = Character.from("=");
mapping.purpose = new DV_CODED_TEXT("primary", "openehr::mapping_purpose");

const target = new CODE_PHRASE();
target.terminology_id = new TERMINOLOGY_ID("ICD-10");
target.code_string = "I10";
mapping.target = target;
```

## 4. References

- **Official Specification:**
  [openEHR RM - TERM_MAPPING](https://specifications.openehr.org/releases/RM/latest/data_types.html#_term_mapping_class)

# Instruction: Implementing the `TEMPLATE_ID` Class

## 1. Description

The `TEMPLATE_ID` class represents an identifier for operational templates.
Templates are used to constrain archetypes for specific use cases.

- **Format:** Similar to ARCHETYPE_ID but for templates
- **Example:** `"openEHR-EHR-COMPOSITION.encounter.v1"`
- **Reference:**
  [openEHR BASE - TEMPLATE_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_template_id_class)

## 2. Behavior

TEMPLATE_ID has similar structure to ARCHETYPE_ID. It extends OBJECT_ID.

### 2.1. Constructor

- **Pseudo-code:**
  ```typescript
  static from(templateIdStr: string): TEMPLATE_ID {
    const id = new TEMPLATE_ID();
    id.value = templateIdStr;
    // Validation similar to ARCHETYPE_ID
    return id;
  }
  ```

### 2.2. Validation

Should follow template naming conventions, typically similar to archetype IDs
but may have different version semantics.

## 3. Invariants

- **Value_exists:** `value /= Void and then not value.is_empty()`

## 4. Pre-conditions

- Value must follow template ID format.

## 5. Post-conditions

- Value is accessible and valid.

## 6. Example Usage

```typescript
const templateId = TEMPLATE_ID.from("openEHR-EHR-COMPOSITION.encounter.v1");
console.log(templateId.value); // Full template ID
```

## 7. Test Cases

1. Test creation with valid template ID
2. Test validation
3. Test comparison

## 8. References

- [openEHR BASE - TEMPLATE_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_template_id_class)
- [Operational Templates](https://specifications.openehr.org/releases/AM/latest/OPT2.html)

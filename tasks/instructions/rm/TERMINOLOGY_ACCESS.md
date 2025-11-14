# Instruction: Implementing the `TERMINOLOGY_ACCESS` Class

## 1. Description

TERMINOLOGY_ACCESS provides access to a specific terminology.

- **Reference:**
  [openEHR RM - TERMINOLOGY_ACCESS](https://specifications.openehr.org/releases/RM/latest/support.html#_terminology_access_class)

## 2. Behavior

### 2.1. Methods

#### 2.1.1. `id(): String`

Get terminology identifier.

#### 2.1.2. `has_code_for_group_id(group_id: String, code: String): Boolean`

Check if code belongs to a specific group.

**Pseudo-code:**

```typescript
has_code_for_group_id(group_id: String, code: String): Boolean {
  const group = this.get_group(group_id);
  if (!group) {
    return Boolean.from(false);
  }
  
  return Boolean.from(group.has_code(code));
}
```

#### 2.1.3. `rubric_for_code(code: String, language: String): String`

Get human-readable term for a code.

#### 2.1.4. `codes_for_group_id(group_id: String): List<String>`

Get all codes in a group.

## 3. Example Usage

```typescript
const snomed = termService.terminology("SNOMED-CT");
const term = snomed.rubric_for_code("38341003", "en"); // "Hypertension"
```

## 4. References

- **Official Specification:**
  [openEHR RM - TERMINOLOGY_ACCESS](https://specifications.openehr.org/releases/RM/latest/support.html#_terminology_access_class)

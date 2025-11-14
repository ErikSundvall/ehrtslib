# Instruction: Implementing the `CODE_SET_ACCESS` Class

## 1. Description

CODE_SET_ACCESS provides access to a specific code set.

- **Reference:**
  [openEHR RM - CODE_SET_ACCESS](https://specifications.openehr.org/releases/RM/latest/support.html#_code_set_access_class)

## 2. Behavior

### 2.1. Methods

#### 2.1.1. `id(): String`

Get code set identifier.

#### 2.1.2. `has_code(code: String): Boolean`

Check if code exists in this code set.

**Pseudo-code:**

```typescript
has_code(code: String): Boolean {
  return Boolean.from(this.all_codes().includes(code));
}
```

#### 2.1.3. `all_codes(): List<String>`

Get all codes in the code set.

## 3. Example Usage

```typescript
const codeSetService = termService.code_set("countries");
const hasSweden = codeSetService.has_code("SE"); // true for ISO 3166-1
```

## 4. References

- **Official Specification:**
  [openEHR RM - CODE_SET_ACCESS](https://specifications.openehr.org/releases/RM/latest/support.html#_code_set_access_class)

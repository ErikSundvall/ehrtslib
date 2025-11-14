# Instruction: Implementing the `EXTRACT_ERROR` Class

## 1. Description

EXTRACT_ERROR represents an error that occurred during extraction.

- **Reference:**
  [openEHR RM - EXTRACT_ERROR](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_error_class)

## 2. Behavior

### 2.1. Properties

- `code: DV_CODED_TEXT` - Error code
- `message: DV_TEXT` - Error message

## 3. Example Usage

```typescript
const error = new EXTRACT_ERROR();
error.code = new DV_CODED_TEXT("access_denied", "extract_errors::001");
error.message = new DV_TEXT("Access denied to requested EHR");
```

## 4. References

- **Official Specification:**
  [openEHR RM - EXTRACT_ERROR](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_error_class)

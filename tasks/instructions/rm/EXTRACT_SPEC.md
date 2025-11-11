# Instruction: Implementing the `EXTRACT_SPEC` Class

## 1. Description

EXTRACT_SPEC specifies the content to be extracted.

-   **Reference:** [openEHR RM - EXTRACT_SPEC](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_spec_class)

## 2. Behavior

### 2.1. Properties

- `ehr_id: HIER_OBJECT_ID` - EHR to extract from
- `directory: Boolean` - Include EHR directory
- `version_spec: EXTRACT_VERSION_SPEC` - Version criteria
- `manifest: EXTRACT_MANIFEST` - Manifest specification

## 3. Example Usage

```typescript
const spec = new EXTRACT_SPEC();
spec.ehr_id = new HIER_OBJECT_ID("ehr123");
spec.directory = Boolean.from(true);
```

## 4. References

-   **Official Specification:** [openEHR RM - EXTRACT_SPEC](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_spec_class)

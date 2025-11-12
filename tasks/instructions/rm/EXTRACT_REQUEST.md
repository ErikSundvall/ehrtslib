# Instruction: Implementing the `EXTRACT_REQUEST` Class

## 1. Description

EXTRACT_REQUEST specifies a request for EHR data extraction.

-   **Reference:** [openEHR RM - EXTRACT_REQUEST](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_request_class)

## 2. Behavior

### 2.1. Properties

- `extract_id: HIER_OBJECT_ID` - Unique request ID
- `spec: EXTRACT_SPEC` - Specification of what to extract
- `update: EXTRACT_UPDATE_SPEC` - Update specification (if applicable)

## 3. Example Usage

```typescript
const request = new EXTRACT_REQUEST();
request.extract_id = new HIER_OBJECT_ID("extract789");
request.spec = new EXTRACT_SPEC();
request.spec.ehr_id = new HIER_OBJECT_ID("ehr123");
```

## 4. References

-   **Official Specification:** [openEHR RM - EXTRACT_REQUEST](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_request_class)

# Instruction: Implementing the `DV_EHR_URI` Class

## 1. Description

DV_EHR_URI represents URIs for referencing EHR content.

- **Reference:**
  [openEHR RM - DV_EHR_URI](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ehr_uri_class)

## 2. Behavior

Extends DV_URI with EHR-specific URI format: `ehr://system_id/ehr_id/...`

## 3. Example Usage

```typescript
const ehrUri = new DV_EHR_URI();
ehrUri.value = "ehr://hospital.org/12345/composition/67890";
```

## 4. References

- **Official Specification:**
  [openEHR RM - DV_EHR_URI](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ehr_uri_class)

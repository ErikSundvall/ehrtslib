# Instruction: Implementing the `DV_IDENTIFIER` Class

## 1. Description

The `DV_IDENTIFIER` class represents identifiers like medical record numbers, social security numbers, etc.

-   **Reference:** [openEHR RM - DV_IDENTIFIER](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_identifier_class)

## 2. Behavior

### 2.1. Properties

- `issuer: String` - Organization that issued the ID
- `assigner: String` - Organization that assigned the ID
- `id: String` - The actual identifier value
- `type: String` - Type of identifier

## 3. Example Usage

```typescript
const mrn = new DV_IDENTIFIER();
mrn.id = "MRN-123456";
mrn.issuer = "City Hospital";
mrn.type = "Medical Record Number";

const ssn = new DV_IDENTIFIER();
ssn.id = "123-45-6789";
ssn.issuer = "Social Security Administration";
ssn.type = "SSN";
```

## 4. References

-   **Official Specification:** [openEHR RM - DV_IDENTIFIER](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_identifier_class)

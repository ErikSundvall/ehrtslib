# Instruction: Implementing the `EHR_STATUS` Class

## 1. Description

EHR_STATUS represents the status and control information for an EHR.

- **Reference:**
  [openEHR RM - EHR_STATUS](https://specifications.openehr.org/releases/RM/latest/ehr.html#_ehr_status_class)

## 2. Behavior

- `subject: PARTY_SELF` - The EHR subject
- `is_queryable: Boolean` - Whether EHR is queryable
- `is_modifiable: Boolean` - Whether EHR is modifiable
- `other_details: ITEM_STRUCTURE` - Additional details

## 3. Example Usage

```typescript
const status = new EHR_STATUS();
status.subject = new PARTY_SELF();
status.is_queryable = true;
status.is_modifiable = true;
```

## 4. References

- **Official Specification:**
  [openEHR RM - EHR_STATUS](https://specifications.openehr.org/releases/RM/latest/ehr.html#_ehr_status_class)

# Instruction: Implementing the `VERSIONED_EHR_STATUS` Class

## 1. Description

VERSIONED_EHR_STATUS manages all versions of an EHR_STATUS.

-   **Reference:** [openEHR RM - VERSIONED_EHR_STATUS](https://specifications.openehr.org/releases/RM/latest/ehr.html#_versioned_ehr_status_class)

## 2. Behavior

Inherits from VERSIONED_OBJECT<EHR_STATUS>:
- `uid: HIER_OBJECT_ID` - Unique identifier for all versions
- `owner_id: OBJECT_REF` - EHR owning this versioned status
- `time_created: DV_DATE_TIME` - Time first version was created

### Methods

- `version_count(): Integer` - Number of versions
- `all_versions(): List<VERSION<EHR_STATUS>>` - All versions
- `latest_version(): VERSION<EHR_STATUS>` - Most recent version

## 3. Example Usage

```typescript
const versioned = new VERSIONED_EHR_STATUS();
versioned.uid = new HIER_OBJECT_ID("ehr_status_uid_here");
versioned.owner_id = new OBJECT_REF("ehr_uid_here");
```

## 4. References

-   **Official Specification:** [openEHR RM - VERSIONED_EHR_STATUS](https://specifications.openehr.org/releases/RM/latest/ehr.html#_versioned_ehr_status_class)

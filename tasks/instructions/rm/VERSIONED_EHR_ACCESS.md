# Instruction: Implementing the `VERSIONED_EHR_ACCESS` Class

## 1. Description

VERSIONED_EHR_ACCESS manages all versions of an EHR_ACCESS.

- **Reference:**
  [openEHR RM - VERSIONED_EHR_ACCESS](https://specifications.openehr.org/releases/RM/latest/ehr.html#_versioned_ehr_access_class)

## 2. Behavior

Inherits from VERSIONED_OBJECT<EHR_ACCESS>:

- `uid: HIER_OBJECT_ID` - Unique identifier for all versions
- `owner_id: OBJECT_REF` - EHR owning this versioned access
- `time_created: DV_DATE_TIME` - Time first version was created

### Methods

- `version_count(): Integer` - Number of versions
- `all_versions(): List<VERSION<EHR_ACCESS>>` - All versions
- `latest_version(): VERSION<EHR_ACCESS>` - Most recent version

## 3. Example Usage

```typescript
const versioned = new VERSIONED_EHR_ACCESS();
versioned.uid = new HIER_OBJECT_ID("ehr_access_uid_here");
versioned.owner_id = new OBJECT_REF("ehr_uid_here");
```

## 4. References

- **Official Specification:**
  [openEHR RM - VERSIONED_EHR_ACCESS](https://specifications.openehr.org/releases/RM/latest/ehr.html#_versioned_ehr_access_class)

# Instruction: Implementing the `VERSIONED_COMPOSITION` Class

## 1. Description

VERSIONED_COMPOSITION manages all versions of a COMPOSITION.

-   **Reference:** [openEHR RM - VERSIONED_COMPOSITION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_versioned_composition_class)

## 2. Behavior

Inherits from VERSIONED_OBJECT<COMPOSITION>:
- `uid: HIER_OBJECT_ID` - Unique identifier for all versions
- `owner_id: OBJECT_REF` - EHR owning this versioned composition
- `time_created: DV_DATE_TIME` - Time first version was created

### Methods

- `version_count(): Integer` - Number of versions
- `all_versions(): List<VERSION<COMPOSITION>>` - All versions
- `latest_version(): VERSION<COMPOSITION>` - Most recent version
- `commit_original_version(contribution, audit, data)` - Commit new version

## 3. Example Usage

```typescript
const versioned = new VERSIONED_COMPOSITION();
versioned.uid = new HIER_OBJECT_ID("composition_uid_here");
versioned.owner_id = new OBJECT_REF("ehr_uid_here");
```

## 4. References

-   **Official Specification:** [openEHR RM - VERSIONED_COMPOSITION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_versioned_composition_class)

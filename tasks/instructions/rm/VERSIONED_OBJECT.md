# Instruction: Implementing the `VERSIONED_OBJECT` Class

## 1. Description

VERSIONED_OBJECT manages versioned content.

-   **Reference:** [openEHR RM - VERSIONED_OBJECT](https://specifications.openehr.org/releases/RM/latest/common.html#_versioned_object_class)

## 2. Behavior

- `uid: HIER_OBJECT_ID` - Identifier
- `owner_id: OBJECT_REF` - Owning EHR
- `time_created: DV_DATE_TIME` - Creation time

### 2.2. Methods

- `version_count(): Integer` - Number of versions
- `all_versions(): List<VERSION>` - All versions
- `latest_version(): VERSION` - Most recent version
- `has_version_at_time(time: DV_DATE_TIME): Boolean`
- `version_at_time(time: DV_DATE_TIME): VERSION`

## 3. References

-   **Official Specification:** [openEHR RM - VERSIONED_OBJECT](https://specifications.openehr.org/releases/RM/latest/common.html#_versioned_object_class)

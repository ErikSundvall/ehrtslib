# Instruction: Implementing the `VERSIONED_PARTY` Class

## 1. Description

VERSIONED_PARTY manages all versions of a PARTY (demographics).

- **Reference:**
  [openEHR RM - VERSIONED_PARTY](https://specifications.openehr.org/releases/RM/latest/demographic.html#_versioned_party_class)

## 2. Behavior

Inherits from VERSIONED_OBJECT<PARTY>:

- `uid: HIER_OBJECT_ID` - Unique identifier for all versions
- `owner_id: OBJECT_REF` - System owning this versioned party
- `time_created: DV_DATE_TIME` - Time first version was created

### Methods

- `version_count(): Integer` - Number of versions
- `all_versions(): List<VERSION<PARTY>>` - All versions
- `latest_version(): VERSION<PARTY>` - Most recent version

## 3. Example Usage

```typescript
const versioned = new VERSIONED_PARTY();
versioned.uid = new HIER_OBJECT_ID("party_uid_here");
versioned.owner_id = new OBJECT_REF("system_uid_here");
```

## 4. References

- **Official Specification:**
  [openEHR RM - VERSIONED_PARTY](https://specifications.openehr.org/releases/RM/latest/demographic.html#_versioned_party_class)

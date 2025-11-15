# Instruction: Implementing the `EXTRACT` Class

## 1. Description

EXTRACT is the root of an Extract structure for EHR data exchange.

- **Reference:**
  [openEHR RM - EXTRACT](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_class)

## 2. Behavior

### 2.1. Properties

- `request_id: HIER_OBJECT_ID` - ID of request this extract responds to
- `time_created: DV_DATE_TIME` - When extract was created
- `system_id: HIER_OBJECT_ID` - Source system ID
- `specification: EXTRACT_SPEC` - Extract specification
- `chapters: List<EXTRACT_CHAPTER>` - Extract chapters

## 3. Example Usage

```typescript
const extract = new EXTRACT();
extract.request_id = new HIER_OBJECT_ID("request123");
extract.time_created = new DV_DATE_TIME("2024-01-15T10:30:00");
extract.system_id = new HIER_OBJECT_ID("system456");
```

## 4. References

- **Official Specification:**
  [openEHR RM - EXTRACT](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_class)

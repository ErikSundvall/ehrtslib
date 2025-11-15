# Instruction: Implementing the `EXTRACT_MANIFEST` Class

## 1. Description

EXTRACT_MANIFEST lists what entities are included in an Extract.

- **Reference:**
  [openEHR RM - EXTRACT_MANIFEST](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_manifest_class)

## 2. Behavior

### 2.1. Properties

- `entities: List<EXTRACT_ENTITY_MANIFEST>` - List of included entities

## 3. Example Usage

```typescript
const manifest = new EXTRACT_MANIFEST();
manifest.entities = [];
// Add entity manifests
```

## 4. References

- **Official Specification:**
  [openEHR RM - EXTRACT_MANIFEST](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_manifest_class)

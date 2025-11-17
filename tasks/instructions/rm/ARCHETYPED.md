# Instruction: Implementing the `ARCHETYPED` Class

## 1. Description

ARCHETYPED holds archetype identification details at archetype roots.

- **Reference:**
  [openEHR RM - ARCHETYPED](https://specifications.openehr.org/releases/RM/latest/common.html#_archetyped_class)

## 2. Behavior

- `archetype_id: ARCHETYPE_ID` - The archetype identifier
- `rm_version: String` - RM release version
- `template_id: TEMPLATE_ID` - Optional template ID

## 3. Example Usage

```typescript
const archetyped = new ARCHETYPED();
archetyped.archetype_id = ARCHETYPE_ID.from(
  "openEHR-EHR-OBSERVATION.blood_pressure.v1",
);
archetyped.rm_version = "1.0.4";
```

## 4. References

- **Official Specification:**
  [openEHR RM - ARCHETYPED](https://specifications.openehr.org/releases/RM/latest/common.html#_archetyped_class)

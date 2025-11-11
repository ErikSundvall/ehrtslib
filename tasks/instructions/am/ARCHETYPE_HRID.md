# Instruction: Implementing the `ARCHETYPE_HRID` Class

## 1. Description

ARCHETYPE_HRID is the human-readable archetype identifier.

-   **Reference:** [openEHR AM - ARCHETYPE_HRID](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_hrid_class)

## 2. Behavior

- `namespace: String` - Optional namespace
- `rm_publisher: String` - RM publisher (openEHR, etc.)
- `rm_package: String` - RM package (EHR, DEMOGRAPHIC, etc.)
- `rm_class: String` - RM class (OBSERVATION, etc.)
- `concept_id: String` - Archetype concept
- `release_version: String` - Version

Format: `[namespace::]rm_publisher-rm_package-rm_class.concept_id.vN`

## 3. Example Usage

```typescript
const hrid = ARCHETYPE_HRID.from("openEHR-EHR-OBSERVATION.blood_pressure.v1");
console.log(hrid.rm_class);  // "OBSERVATION"
console.log(hrid.concept_id);  // "blood_pressure"
```

## 4. References

-   **Official Specification:** [openEHR AM - ARCHETYPE_HRID](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_hrid_class)

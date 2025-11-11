# Instruction: Implementing the `ARCHETYPE` Class

## 1. Description

The `ARCHETYPE` class is the abstract root for all archetypes and templates. It defines formal constraints on reference model data structures.

-   **Reference:** [openEHR AM - ARCHETYPE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_class)

## 2. Behavior

### 2.1. Properties

- `archetype_id: ARCHETYPE_HRID` - Archetype identifier
- `parent_archetype_id: String` - Parent archetype ID (for specializations)
- `definition: C_COMPLEX_OBJECT` - Root constraint definition
- `terminology: ARCHETYPE_TERMINOLOGY` - Archetype terminology
- `rules: List<ASSERTION>` - Invariant rules
- `rm_release: String` - Reference model release version

### 2.2. Methods

- `is_valid(): Boolean` - Check if archetype is structurally valid
- `is_specialized(): Boolean` - Check if specializes another archetype
- `specialization_depth(): Integer` - Depth in specialization hierarchy

## 3. Example Usage

```typescript
const archetype = new ARCHETYPE();
archetype.archetype_id = ARCHETYPE_HRID.from("openEHR-EHR-OBSERVATION.blood_pressure.v1");
archetype.rm_release = "1.0.4";
archetype.definition = new C_COMPLEX_OBJECT();
```

## 4. References

-   **Official Specification:** [openEHR AM - ARCHETYPE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_class)

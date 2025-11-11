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

#### 2.2.1. `is_valid(): Boolean`

Check if archetype is structurally valid.

**Pseudo-code:**
```typescript
is_valid(): Boolean {
  // Check required fields exist
  if (!this.archetype_id || !this.definition || !this.terminology) {
    return Boolean.from(false);
  }
  
  // Validate definition structure
  if (!this.definition.is_valid()) {
    return Boolean.from(false);
  }
  
  // Validate all node IDs in definition are in terminology
  const nodeIds = this.definition.all_node_ids();
  for (const nodeId of nodeIds) {
    if (!this.terminology.has_term(nodeId)) {
      return Boolean.from(false);
    }
  }
  
  return Boolean.from(true);
}
```

#### 2.2.2. `is_specialized(): Boolean`

Check if this archetype specializes another archetype.

**Pseudo-code:**
```typescript
is_specialized(): Boolean {
  return Boolean.from(this.parent_archetype_id !== null && 
                      this.parent_archetype_id !== "");
}
```

#### 2.2.3. `specialization_depth(): Integer`

Returns depth in specialization hierarchy (0 for top-level archetypes).

**Pseudo-code:**
```typescript
specialization_depth(): Integer {
  if (!this.archetype_id) {
    return Integer.from(0);
  }
  
  // Count dots in concept part after removing version
  const conceptPart = this.archetype_id.concept_id;
  const dashCount = (conceptPart.match(/-/g) || []).length;
  
  return Integer.from(dashCount);
}
```

## 3. Example Usage

```typescript
const archetype = new ARCHETYPE();
archetype.archetype_id = ARCHETYPE_HRID.from("openEHR-EHR-OBSERVATION.blood_pressure.v1");
archetype.rm_release = "1.0.4";
archetype.definition = new C_COMPLEX_OBJECT();
```

## 4. References

-   **Official Specification:** [openEHR AM - ARCHETYPE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_class)

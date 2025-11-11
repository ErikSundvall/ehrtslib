# Instruction: Implementing the `ARCHETYPE_SLOT` Class

## 1. Description

ARCHETYPE_SLOT defines a point where other archetypes can be included.

-   **Reference:** [openEHR AM - ARCHETYPE_SLOT](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_slot_class)

## 2. Behavior

### 2.1. Properties

- `includes: List<ASSERTION>` - Inclusion constraints (archetypes that match)
- `excludes: List<ASSERTION>` - Exclusion constraints (archetypes to exclude)
- `is_closed: Boolean` - Whether slot is closed (no archetypes allowed)

### 2.2. Methods

#### 2.2.1. `is_valid(): Boolean`

Check if slot is structurally valid.

**Pseudo-code:**
```typescript
is_valid(): Boolean {
  // Call parent validation
  if (!super.is_valid()) {
    return Boolean.from(false);
  }
  
  // If closed, should not have includes/excludes
  if (this.is_closed && (this.includes || this.excludes)) {
    return Boolean.from(false);
  }
  
  // All include assertions must be valid
  if (this.includes) {
    for (const assertion of this.includes) {
      if (!assertion.is_valid()) {
        return Boolean.from(false);
      }
    }
  }
  
  // All exclude assertions must be valid
  if (this.excludes) {
    for (const assertion of this.excludes) {
      if (!assertion.is_valid()) {
        return Boolean.from(false);
      }
    }
  }
  
  return Boolean.from(true);
}
```

#### 2.2.2. `allows_archetype(archetype_id: String): Boolean`

Check if a specific archetype ID is allowed in this slot.

**Pseudo-code:**
```typescript
allows_archetype(archetype_id: String): Boolean {
  // Closed slots don't allow anything
  if (this.is_closed) {
    return Boolean.from(false);
  }
  
  // Check excludes first
  if (this.excludes) {
    for (const exclude of this.excludes) {
      if (exclude.matches(archetype_id)) {
        return Boolean.from(false);
      }
    }
  }
  
  // Check includes
  if (this.includes && this.includes.length > 0) {
    for (const include of this.includes) {
      if (include.matches(archetype_id)) {
        return Boolean.from(true);
      }
    }
    return Boolean.from(false);  // No includes matched
  }
  
  // No includes means allow all (except excluded)
  return Boolean.from(true);
}
```

## 3. Example Usage

```typescript
const slot = new ARCHETYPE_SLOT();
slot.rm_type_name = "OBSERVATION";
slot.node_id = "at0001";

// Allow blood pressure and body temperature obs
const includes = new ARCHETYPE_ID_CONSTRAINT();
includes.pattern = "openEHR-EHR-OBSERVATION\\..*\\.v.*";
slot.includes = [includes];
```

## 4. References

-   **Official Specification:** [openEHR AM - ARCHETYPE_SLOT](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_slot_class)

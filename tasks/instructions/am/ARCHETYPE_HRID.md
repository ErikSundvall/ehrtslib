# Instruction: Implementing the `ARCHETYPE_HRID` Class

## 1. Description

ARCHETYPE_HRID is the human-readable archetype identifier.

- **Reference:**
  [openEHR AM - ARCHETYPE_HRID](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_hrid_class)

## 2. Behavior

### 2.1. Properties

- `namespace: String` - Optional namespace
- `rm_publisher: String` - RM publisher (openEHR, etc.)
- `rm_package: String` - RM package (EHR, DEMOGRAPHIC, etc.)
- `rm_class: String` - RM class (OBSERVATION, etc.)
- `concept_id: String` - Archetype concept
- `release_version: String` - Version

Format: `[namespace::]rm_publisher-rm_package-rm_class.concept_id.vN`

### 2.2. Methods

#### 2.2.1. `from(value: String): ARCHETYPE_HRID` (static)

Parse an ARCHETYPE_HRID from a string.

**Pseudo-code:**

```typescript
static from(value: String): ARCHETYPE_HRID {
  const hrid = new ARCHETYPE_HRID();
  
  // Check for optional namespace
  let remaining = value;
  if (value.includes("::")) {
    const parts = value.split("::");
    hrid.namespace = parts[0];
    remaining = parts[1];
  }
  
  // Split at first dot to separate qualified RM entity from concept
  const dotIndex = remaining.indexOf('.');
  if (dotIndex === -1) {
    throw new Error("Invalid ARCHETYPE_HRID format");
  }
  
  const qualifiedEntity = remaining.substring(0, dotIndex);
  const conceptAndVersion = remaining.substring(dotIndex + 1);
  
  // Parse qualified entity: rm_publisher-rm_package-rm_class
  const entityParts = qualifiedEntity.split('-');
  if (entityParts.length < 3) {
    throw new Error("Invalid qualified entity format");
  }
  
  hrid.rm_publisher = entityParts[0];
  hrid.rm_package = entityParts[1];
  hrid.rm_class = entityParts[2];
  
  // Parse concept and version: concept_id.vN
  const vIndex = conceptAndVersion.lastIndexOf('.v');
  if (vIndex === -1) {
    throw new Error("Invalid version format");
  }
  
  hrid.concept_id = conceptAndVersion.substring(0, vIndex);
  hrid.release_version = conceptAndVersion.substring(vIndex + 2);
  
  return hrid;
}
```

#### 2.2.2. `to_string(): String`

Convert ARCHETYPE_HRID back to string representation.

**Pseudo-code:**

```typescript
to_string(): String {
  let result = "";
  
  if (this.namespace) {
    result += this.namespace + "::";
  }
  
  result += this.rm_publisher + "-" + 
            this.rm_package + "-" + 
            this.rm_class + "." + 
            this.concept_id + ".v" + 
            this.release_version;
  
  return String.from(result);
}
```

## 3. Example Usage

```typescript
const hrid = ARCHETYPE_HRID.from("openEHR-EHR-OBSERVATION.blood_pressure.v1");
console.log(hrid.rm_class); // "OBSERVATION"
console.log(hrid.concept_id); // "blood_pressure"
```

## 4. References

- **Official Specification:**
  [openEHR AM - ARCHETYPE_HRID](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_hrid_class)

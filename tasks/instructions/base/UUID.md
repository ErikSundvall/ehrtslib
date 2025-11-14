# Instruction: Implementing the `UUID` Class

## 1. Description

The `UUID` class represents a Universally Unique Identifier conforming to
RFC 4122.

- **Format:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (32 hexadecimal digits in 5
  groups)
- **Example:** `"550e8400-e29b-41d4-a716-446655440000"`
- **Reference:**
  [openEHR BASE - UUID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_uuid_class)

## 2. Behavior

### 2.1. Constructor and Validation

- **Pseudo-code:**
  ```typescript
  constructor() {
    super();
  }

  static from(uuidStr: string): UUID {
    const uuid = new UUID();
    uuid.value = uuidStr;
    
    if (!uuid.is_valid()) {
      throw new Error("Invalid UUID format");
    }
    
    return uuid;
  }

  static generate(): UUID {
    // Generate a new UUID v4 (random)
    const uuid = new UUID();
    uuid.value = this.generate_v4();
    return uuid;
  }

  private static generate_v4(): string {
    // Use crypto.randomUUID() if available, or implement UUID v4
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  ```

### 2.2. Validation

#### `is_valid(): Boolean`

- **Purpose:** Check if value is a valid UUID.
- **Pseudo-code:**
  ```typescript
  is_valid(): Boolean {
    const val = this.value;
    if (!val) {
      return new Boolean(false);
    }
    
    // UUID pattern: 8-4-4-4-12 hexadecimal digits
    const pattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return new Boolean(pattern.test(val));
  }
  ```

### 2.3. Version Detection

#### `version(): Integer`

- **Purpose:** Extract UUID version (1-5).
- **Pseudo-code:**
  ```typescript
  version(): Integer {
    if (!this.is_valid()) {
      throw new Error("Invalid UUID");
    }
    
    // Version is in the 13th character (index 14 after hyphens)
    const versionChar = this.value.charAt(14);
    return Integer.from(parseInt(versionChar, 16));
  }
  ```

### 2.4. `is_equal(other: Any): Boolean`

- **Purpose:** Compare UUIDs (case-insensitive).
- **Pseudo-code:**
  ```typescript
  is_equal(other: Any): Boolean {
    if (!(other instanceof UUID)) {
      return new Boolean(false);
    }
    
    if (!this.value || !other.value) {
      return new Boolean(false);
    }
    
    // Case-insensitive comparison
    return new Boolean(
      this.value.toLowerCase() === other.value.toLowerCase()
    );
  }
  ```

## 3. Invariants

- **Format_valid:** Value must match UUID format
- **Case_insensitive:** UUIDs are case-insensitive for comparison

## 4. Pre-conditions

- Value must be a valid UUID string if set manually.

## 5. Post-conditions

- Generated UUIDs are unique (with very high probability).
- is_valid() returns true for properly formatted UUIDs.

## 6. Example Usage

```typescript
// Generate new UUID
const uuid1 = UUID.generate();
console.log(uuid1.value); // e.g., "550e8400-e29b-41d4-a716-446655440000"
console.log(uuid1.version().value); // 4 (for v4 UUIDs)

// Create from existing UUID string
const uuid2 = UUID.from("550e8400-e29b-41d4-a716-446655440000");
console.log(uuid2.is_valid()); // true

// Comparison (case-insensitive)
const uuid3 = UUID.from("550E8400-E29B-41D4-A716-446655440000");
console.log(uuid2.is_equal(uuid3)); // true

// Invalid UUID throws error
try {
  const invalid = UUID.from("not-a-uuid");
} catch (e) {
  console.log(e.message); // "Invalid UUID format"
}
```

## 7. UUID Versions

- **Version 1:** Time-based (includes timestamp and MAC address)
- **Version 2:** DCE Security
- **Version 3:** Name-based using MD5
- **Version 4:** Random (most commonly used)
- **Version 5:** Name-based using SHA-1

In healthcare contexts, Version 4 (random) is most commonly used to avoid
privacy concerns with MAC addresses.

## 8. Test Cases

Key test cases to implement:

1. Test generate() creates valid UUID
2. Test generate() creates unique UUIDs (probabilistically)
3. Test from() with valid UUID string
4. Test from() throws error with invalid format
5. Test is_valid() with various valid formats
6. Test is_valid() with invalid formats
7. Test is_equal() is case-insensitive
8. Test version() returns correct version number
9. Test with all UUID versions (1-5)
10. Test boundary cases (all zeros, all Fs)

## 9. References

- [openEHR BASE Specification - UUID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_uuid_class)
- [RFC 4122 - UUID Specification](https://tools.ietf.org/html/rfc4122)
- [Archie UUID Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/UUID.java)

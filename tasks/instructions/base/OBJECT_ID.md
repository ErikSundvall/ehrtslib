# Instruction: Implementing the `OBJECT_ID` Class

## 1. Description

The `OBJECT_ID` class is an abstract parent class for all object identifiers in openEHR. It provides a common interface for identifier classes by defining a `value` property that holds the identifier as a string.

-   **Reference:** [openEHR BASE - Identification Package](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_identification_package)

## 2. Behavior

### 2.1. `value` Property

-   **Purpose:** Holds the string representation of the identifier.
-   **Type:** String (openEHR String wrapper)
-   **Behavior:**
    -   This is an abstract class property that will be inherited by all concrete identifier classes.
    -   The value should be immutable once set (in most implementations).
    -   The value format depends on the specific subclass (ARCHETYPE_ID, HIER_OBJECT_ID, etc.).

## 3. Invariants

-   **Value_exists:** `value /= Void and then not value.is_empty()`
    -   The value must exist and must not be an empty string.

## 4. Pre-conditions

None specific to OBJECT_ID as it's an abstract class. Subclasses will define specific format requirements.

## 5. Post-conditions

None specific to the abstract class.

## 6. Pseudo-code

```typescript
abstract class OBJECT_ID {
  private _value?: String;
  
  get value(): string | undefined {
    return this._value?.value;
  }
  
  set value(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === 'string') {
      // Convert primitive string to String wrapper
      this._value = String.from(val);
    } else {
      this._value = val;
    }
  }
  
  // Validation should be implemented in concrete subclasses
}
```

## 7. Example Usage

```typescript
// OBJECT_ID is abstract, so we use a concrete subclass
const genericId = new GENERIC_ID();
genericId.value = "some-identifier-123";
genericId.scheme = "local";

console.log(genericId.value); // "some-identifier-123"
```

## 8. References

-   [openEHR Specifications - BASE Types - Identification](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_identification_package)
-   [Archie Implementation - ObjectId](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/ObjectId.java)
-   [openEHR Java-libs](https://github.com/openEHR/java-libs/tree/master/openehr-rm-core/src/main/java/org/openehr/rm/support/identification)

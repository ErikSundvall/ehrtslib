# Instruction: Implementing the `LOCATABLE_REF` Class

## 1. Description

The `LOCATABLE_REF` class extends OBJECT_REF to reference LOCATABLE objects with an optional path.

-   **Reference:** [openEHR BASE - LOCATABLE_REF](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_locatable_ref_class)

## 2. Behavior

### 2.1. Properties

-   Inherits `id`, `namespace`, `type` from OBJECT_REF
-   **`path: String`** - Optional path within the referenced object

### 2.2. Constructor

-   **Pseudo-code:**
    ```typescript
    static from(id: OBJECT_ID, namespace: string, type: string, path?: string): LOCATABLE_REF {
      const ref = new LOCATABLE_REF();
      ref.id = id;
      ref.namespace = String.from(namespace);
      ref.type = String.from(type);
      if (path) {
        ref.path = String.from(path);
      }
      return ref;
    }
    ```

## 3. Invariants

-   Inherits invariants from OBJECT_REF
-   **Path_valid:** If path exists, it must follow archetype path syntax

## 4. Example Usage

```typescript
const id = HIER_OBJECT_ID.from("550e8400-e29b-41d4-a716-446655440000");
const ref = LOCATABLE_REF.from(
  id,
  "local",
  "COMPOSITION",
  "/content[at0001]/data[at0002]"
);
console.log(ref.path.value);  // Path within composition
```

## 5. Test Cases

1. Test creation with path
2. Test creation without path
3. Test path validation
4. Test comparison

## 6. References

-   [openEHR BASE - LOCATABLE_REF](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_locatable_ref_class)
-   [Archie LocatableRef](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/LocatableRef.java)

# Instruction: Implementing the `ACCESS_GROUP_REF` Class

## 1. Description

The `ACCESS_GROUP_REF` class is a specialized OBJECT_REF for referencing access control groups.

-   **Reference:** [openEHR BASE - ACCESS_GROUP_REF](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_access_group_ref_class)

## 2. Behavior

ACCESS_GROUP_REF is used in security and access control contexts to reference groups of users or roles.

### 2.1. Constructor

-   **Pseudo-code:**
    ```typescript
    static from(id: OBJECT_ID, namespace: string): ACCESS_GROUP_REF {
      const ref = new ACCESS_GROUP_REF();
      ref.id = id;
      ref.namespace = String.from(namespace);
      ref.type = String.from("ACCESS_GROUP");
      return ref;
    }
    ```

## 3. Example Usage

```typescript
const groupId = GENERIC_ID.from("admin-group", "local");
const groupRef = ACCESS_GROUP_REF.from(groupId, "security");
```

## 4. Test Cases

1. Test creation
2. Test usage in access control contexts

## 5. References

-   [openEHR BASE - ACCESS_GROUP_REF](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_access_group_ref_class)

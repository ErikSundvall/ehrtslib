# Instruction: Implementing the `PARTY_REF` Class

## 1. Description

The `PARTY_REF` class is a specialized OBJECT_REF for referencing parties (persons, organizations, etc.).

-   **Reference:** [openEHR BASE - PARTY_REF](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_party_ref_class)

## 2. Behavior

PARTY_REF is a specialization of OBJECT_REF with type typically set to "PARTY" or specific party types like "PERSON", "ORGANIZATION".

### 2.1. Constructor

-   **Pseudo-code:**
    ```typescript
    static from(id: OBJECT_ID, namespace: string, type: string): PARTY_REF {
      const ref = new PARTY_REF();
      ref.id = id;
      ref.namespace = String.from(namespace);
      ref.type = String.from(type);
      return ref;
    }
    ```

## 3. Example Usage

```typescript
const patientId = HIER_OBJECT_ID.from("patient-123");
const patientRef = PARTY_REF.from(patientId, "demographics", "PERSON");

const observation = new OBSERVATION();
observation.subject = patientRef;
```

## 4. Test Cases

1. Test creation with PERSON type
2. Test creation with ORGANIZATION type
3. Test usage in clinical contexts

## 5. References

-   [openEHR BASE - PARTY_REF](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_party_ref_class)
-   [Archie PartyRef](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/PartyRef.java)

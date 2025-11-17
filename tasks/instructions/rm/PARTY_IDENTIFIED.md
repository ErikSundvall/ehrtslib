# Instruction: Implementing the `PARTY_IDENTIFIED` Class

## 1. Description

PARTY_IDENTIFIED represents an identified party (person/organization).

- **Reference:**
  [openEHR RM - PARTY_IDENTIFIED](https://specifications.openehr.org/releases/RM/latest/common.html#_party_identified_class)

## 2. Behavior

- `name: String` - Party name
- `identifiers: List<DV_IDENTIFIER>` - Identifiers (e.g., medical staff ID)

## 3. Example Usage

```typescript
const clinician = new PARTY_IDENTIFIED();
clinician.name = "Dr. John Smith";

const id = new DV_IDENTIFIER();
id.id = "12345";
id.issuer = "Hospital";
id.type = "Staff ID";

clinician.identifiers = new List<DV_IDENTIFIER>();
clinician.identifiers.append(id);
```

## 4. References

- **Official Specification:**
  [openEHR RM - PARTY_IDENTIFIED](https://specifications.openehr.org/releases/RM/latest/common.html#_party_identified_class)

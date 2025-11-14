# Instruction: Implementing the `ORGANISATION` Class

## 1. Description

ORGANISATION represents an organization in the demographic model.

- **Reference:**
  [openEHR RM - ORGANISATION](https://specifications.openehr.org/releases/RM/latest/demographic.html#_organisation_class)

## 2. Behavior

### 2.1. Properties

Inherits from PARTY:

- `uid: HIER_OBJECT_ID` - Unique identifier
- `identities: List<PARTY_IDENTITY>` - Organization names
- `contacts: List<CONTACT>` - Contact information
- `relationships: List<PARTY_RELATIONSHIP>` - Relationships to other parties
- `details: ITEM_STRUCTURE` - Additional details (registration number, type,
  etc.)

## 3. Example Usage

```typescript
const org = new ORGANISATION();
org.uid = new HIER_OBJECT_ID("660f9500-f39c-51e5-b827-557766551111");

const identity = new PARTY_IDENTITY();
identity.purpose = new DV_TEXT("registered name");
const name_details = new ITEM_TREE();
name_details.add_element("name", "Karolinska Hospital");
identity.details = name_details;

org.identities = [identity];
```

## 4. References

- **Official Specification:**
  [openEHR RM - ORGANISATION](https://specifications.openehr.org/releases/RM/latest/demographic.html#_organisation_class)

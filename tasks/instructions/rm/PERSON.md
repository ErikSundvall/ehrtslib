# Instruction: Implementing the `PERSON` Class

## 1. Description

PERSON represents a natural person in the demographic model.

-   **Reference:** [openEHR RM - PERSON](https://specifications.openehr.org/releases/RM/latest/demographic.html#_person_class)

## 2. Behavior

### 2.1. Properties

Inherits from PARTY:
- `uid: HIER_OBJECT_ID` - Unique identifier
- `identities: List<PARTY_IDENTITY>` - Names and identities
- `contacts: List<CONTACT>` - Contact information
- `relationships: List<PARTY_RELATIONSHIP>` - Relationships to other parties
- `details: ITEM_STRUCTURE` - Additional demographics (birth date, gender, etc.)

## 3. Example Usage

```typescript
const person = new PERSON();
person.uid = new HIER_OBJECT_ID("550e8400-e29b-41d4-a716-446655440000");

const identity = new PARTY_IDENTITY();
identity.purpose = new DV_TEXT("legal name");
const name_details = new ITEM_TREE();
name_details.add_element("given_name", "John");
name_details.add_element("family_name", "Doe");
identity.details = name_details;

person.identities = [identity];
```

## 4. References

-   **Official Specification:** [openEHR RM - PERSON](https://specifications.openehr.org/releases/RM/latest/demographic.html#_person_class)

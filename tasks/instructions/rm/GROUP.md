# Instruction: Implementing the `GROUP` Class

## 1. Description

GROUP represents a group of parties (persons or organizations).

-   **Reference:** [openEHR RM - GROUP](https://specifications.openehr.org/releases/RM/latest/demographic.html#_group_class)

## 2. Behavior

### 2.1. Properties

Inherits from PARTY:
- `uid: HIER_OBJECT_ID` - Unique identifier
- `identities: List<PARTY_IDENTITY>` - Group names
- `contacts: List<CONTACT>` - Contact information
- `relationships: List<PARTY_RELATIONSHIP>` - Members and relationships
- `details: ITEM_STRUCTURE` - Additional details

## 3. Example Usage

```typescript
const group = new GROUP();
group.uid = new HIER_OBJECT_ID("770fa611-g40d-62f6-c938-668877662222");

const identity = new PARTY_IDENTITY();
identity.purpose = new DV_TEXT("group name");
const name_details = new ITEM_TREE();
name_details.add_element("name", "Cardiology Team");
identity.details = name_details;

group.identities = [identity];
```

## 4. References

-   **Official Specification:** [openEHR RM - GROUP](https://specifications.openehr.org/releases/RM/latest/demographic.html#_group_class)

# Instruction: Implementing the `AGENT` Class

## 1. Description

AGENT represents a person or organization acting in a specific role.

-   **Reference:** [openEHR RM - AGENT](https://specifications.openehr.org/releases/RM/latest/demographic.html#_agent_class)

## 2. Behavior

### 2.1. Properties

Inherits from PARTY:
- `uid: HIER_OBJECT_ID` - Unique identifier
- `identities: List<PARTY_IDENTITY>` - Agent identities
- `contacts: List<CONTACT>` - Contact information
- `relationships: List<PARTY_RELATIONSHIP>` - Relationships (includes link to actual person/org)
- `details: ITEM_STRUCTURE` - Role-specific details

## 3. Example Usage

```typescript
const agent = new AGENT();
agent.uid = new HIER_OBJECT_ID("880fb722-h51e-73g7-d049-779988773333");

const identity = new PARTY_IDENTITY();
identity.purpose = new DV_TEXT("role name");
const name_details = new ITEM_TREE();
name_details.add_element("role", "Attending Physician");
identity.details = name_details;

agent.identities = [identity];
```

## 4. References

-   **Official Specification:** [openEHR RM - AGENT](https://specifications.openehr.org/releases/RM/latest/demographic.html#_agent_class)

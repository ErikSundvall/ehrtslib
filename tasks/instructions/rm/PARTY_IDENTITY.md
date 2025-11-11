# Instruction: Implementing the `PARTY_IDENTITY` Class

## 1. Description

PARTY_IDENTITY represents an identity or name of a party.

-   **Reference:** [openEHR RM - PARTY_IDENTITY](https://specifications.openehr.org/releases/RM/latest/demographic.html#_party_identity_class)

## 2. Behavior

### 2.1. Properties

- `purpose: DV_TEXT` - Purpose of identity (legal name, alias, professional name, etc.)
- `details: ITEM_STRUCTURE` - Identity details (name components, etc.)

## 3. Example Usage

```typescript
const identity = new PARTY_IDENTITY();
identity.purpose = new DV_TEXT("legal name");

const details = new ITEM_TREE();
details.add_element("given_name", "Anna");
details.add_element("family_name", "Andersson");
details.add_element("title", "Dr.");
identity.details = details;
```

## 4. References

-   **Official Specification:** [openEHR RM - PARTY_IDENTITY](https://specifications.openehr.org/releases/RM/latest/demographic.html#_party_identity_class)

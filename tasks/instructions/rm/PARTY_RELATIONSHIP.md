# Instruction: Implementing the `PARTY_RELATIONSHIP` Class

## 1. Description

PARTY_RELATIONSHIP represents a relationship between two parties.

-   **Reference:** [openEHR RM - PARTY_RELATIONSHIP](https://specifications.openehr.org/releases/RM/latest/demographic.html#_party_relationship_class)

## 2. Behavior

### 2.1. Properties

- `type: DV_CODED_TEXT` - Type of relationship (employment, membership, kinship, etc.)
- `source: PARTY_REF` - Source party
- `target: PARTY_REF` - Target party
- `time_validity: DV_INTERVAL<DV_DATE>` - Valid time period
- `details: ITEM_STRUCTURE` - Additional relationship details

## 3. Example Usage

```typescript
const relationship = new PARTY_RELATIONSHIP();
relationship.type = new DV_CODED_TEXT("employment", "openehr::relationship_type");
relationship.source = new PARTY_REF("person_uid_here");
relationship.target = new PARTY_REF("organization_uid_here");

const validity = new DV_INTERVAL();
validity.lower = new DV_DATE("2020-01-15");
relationship.time_validity = validity;
```

## 4. References

-   **Official Specification:** [openEHR RM - PARTY_RELATIONSHIP](https://specifications.openehr.org/releases/RM/latest/demographic.html#_party_relationship_class)

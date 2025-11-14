# Instruction: Implementing the `CAPABILITY` Class

## 1. Description

CAPABILITY represents a capability or qualification associated with a role.

- **Reference:**
  [openEHR RM - CAPABILITY](https://specifications.openehr.org/releases/RM/latest/demographic.html#_capability_class)

## 2. Behavior

### 2.1. Properties

- `credentials: ITEM_STRUCTURE` - Qualification credentials
- `time_validity: DV_INTERVAL<DV_DATE>` - Valid time period

## 3. Example Usage

```typescript
const capability = new CAPABILITY();

const credentials = new ITEM_TREE();
credentials.add_element("type", "Medical License");
credentials.add_element("number", "ML123456");
credentials.add_element("issuer", "Medical Board");
capability.credentials = credentials;

const validity = new DV_INTERVAL();
validity.lower = new DV_DATE("2020-01-01");
validity.upper = new DV_DATE("2025-12-31");
capability.time_validity = validity;
```

## 4. References

- **Official Specification:**
  [openEHR RM - CAPABILITY](https://specifications.openehr.org/releases/RM/latest/demographic.html#_capability_class)

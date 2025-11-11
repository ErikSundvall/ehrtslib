# Instruction: Implementing the `PARTY_PROXY` Class

## 1. Description

PARTY_PROXY is abstract parent for party references in the EHR.

-   **Reference:** [openEHR RM - PARTY_PROXY](https://specifications.openehr.org/releases/RM/latest/common.html#_party_proxy_class)

## 2. Behavior

- `external_ref: PARTY_REF` - Optional reference to demographic system

### 2.2. Subclasses

- PARTY_IDENTIFIED (with name and identifiers)
- PARTY_SELF (the EHR subject)
- PARTY_RELATED (with relationship)

## 3. References

-   **Official Specification:** [openEHR RM - PARTY_PROXY](https://specifications.openehr.org/releases/RM/latest/common.html#_party_proxy_class)

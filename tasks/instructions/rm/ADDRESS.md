# Instruction: Implementing the `ADDRESS` Class

## 1. Description

ADDRESS represents a postal or electronic address for a party.

-   **Reference:** [openEHR RM - ADDRESS](https://specifications.openehr.org/releases/RM/latest/demographic.html#_address_class)

## 2. Behavior

### 2.1. Properties

- `type: DV_TEXT` - Type of address (home, work, postal, electronic)
- `use: List<DV_CODED_TEXT>` - Purpose (business, personal, billing, etc.)
- `details: ITEM_STRUCTURE` - Address details (street, city, country, email, etc.)

### 2.2. Methods

#### 2.2.1. `is_valid(): Boolean`

Check if address is valid.

**Pseudo-code:**
```typescript
is_valid(): Boolean {
  // Must have type and details
  if (!this.type || !this.details) {
    return Boolean.from(false);
  }
  
  return Boolean.from(true);
}
```

## 3. Example Usage

```typescript
const address = new ADDRESS();
address.type = new DV_TEXT("postal");

const details = new ITEM_TREE();
details.add_element("street", "123 Main St");
details.add_element("city", "Stockholm");
details.add_element("country", "Sweden");
address.details = details;
```

## 4. References

-   **Official Specification:** [openEHR RM - ADDRESS](https://specifications.openehr.org/releases/RM/latest/demographic.html#_address_class)

# Instruction: Implementing the `CONTACT` Class

## 1. Description

CONTACT represents contact information for a party, including addresses and time
validity.

- **Reference:**
  [openEHR RM - CONTACT](https://specifications.openehr.org/releases/RM/latest/demographic.html#_contact_class)

## 2. Behavior

### 2.1. Properties

- `purpose: DV_TEXT` - Purpose of contact (business, personal, emergency)
- `addresses: List<ADDRESS>` - Contact addresses
- `time_validity: DV_INTERVAL<DV_DATE>` - Valid time period

## 3. Example Usage

```typescript
const contact = new CONTACT();
contact.purpose = new DV_TEXT("business");

const address = new ADDRESS();
address.type = new DV_TEXT("email");
const details = new ITEM_TREE();
details.add_element("email", "john@example.com");
address.details = details;

contact.addresses = [address];
```

## 4. References

- **Official Specification:**
  [openEHR RM - CONTACT](https://specifications.openehr.org/releases/RM/latest/demographic.html#_contact_class)

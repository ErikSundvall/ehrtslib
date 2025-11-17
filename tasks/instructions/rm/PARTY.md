# PARTY

## Description

Abstract parent for demographic entities (persons, organizations, groups, etc.).
Root of the demographic model.

**Specification Reference:**
[openEHR RM Demographic](https://specifications.openehr.org/releases/RM/latest/demographic.html#_party_class)

## Behavior

### Properties

- `identities`: List<PARTY_IDENTITY> - Identity information
- `contacts`: List<CONTACT> - Contact information
- `relationships`: List<PARTY_RELATIONSHIP> - Relationships to other parties
- `reverse_relationships`: List<PARTY_RELATIONSHIP> - Relationships from other
  parties
- `details`: ITEM_STRUCTURE (optional) - Additional demographic details
- `uid`: HIER_OBJECT_ID - Unique identifier
- Inherits from LOCATABLE: archetype_node_id, name, archetype_details

### Methods

#### type(): String

Type of party (abstract - implemented by subclasses).

## Invariants

- `Identities_valid`: identities /= Void and then not identities.is_empty
- `Contacts_valid`: contacts /= Void implies not contacts.is_empty
- `Relationships_validity`: relationships /= Void implies not
  relationships.is_empty
- `Reverse_relationships_validity`: reverse_relationships /= Void implies not
  reverse_relationships.is_empty
- `Is_archetype_root`: is_archetype_root

## Pre-conditions

None - abstract class

## Post-conditions

None

## Example Usage

```typescript
// Abstract - see PERSON, ORGANISATION for concrete examples
const person = new PERSON();
person.identities = [];
person.identities.push(personIdentity);
person.contacts = [];
person.contacts.push(contactInfo);
```

## Test Cases

1. **Has identities**: All parties have at least one identity
2. **Multiple identities**: Party can have multiple identities
3. **Contacts list**: Party can have contact information
4. **Relationships**: Party can have relationships to others
5. **Reverse relationships**: Track relationships from others
6. **Details structure**: Additional details in ITEM_STRUCTURE
7. **UID required**: All parties have unique identifier
8. **Archetype root**: Party is archetype root point

## References

- [openEHR RM Demographic Specification](https://specifications.openehr.org/releases/RM/latest/demographic.html)

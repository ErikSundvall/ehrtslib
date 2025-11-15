# ACTOR

## Description

Abstract class representing an actor in the system - an entity that performs
actions. Part of the demographic model.

**Specification Reference:**
[openEHR RM Demographic](https://specifications.openehr.org/releases/RM/latest/demographic.html)

## Behavior

### Properties

- Inherits from PARTY: identities, contacts, relationships, details, uid
- `roles`: List<ROLE> - Roles performed by this actor
- `languages`: List<DV_TEXT> - Languages spoken/used

### Methods

#### has_legal_identity(): boolean

True if actor has a legally recognized identity.

## Invariants

- `Roles_validity`: roles /= Void implies not roles.is_empty

## Example Usage

\`\`\`typescript // Abstract - see concrete implementations const person = new
PERSON(); // Person is an ACTOR person.roles = [healthcareProfessionalRole];
person.languages = [new DV_TEXT().value = "en"]; \`\`\`

## Test Cases

1. **Has roles**: Actor can have multiple roles
2. **Languages**: Actor specifies languages
3. **Legal identity**: Can check for legal identity
4. **Inheritance**: Inherits PARTY properties

## References

- [openEHR RM Demographic](https://specifications.openehr.org/releases/RM/latest/demographic.html)

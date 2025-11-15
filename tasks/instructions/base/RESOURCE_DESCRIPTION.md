# Instruction: Implementing the `RESOURCE_DESCRIPTION` Class

## 1. Description

The `RESOURCE_DESCRIPTION` class contains descriptive metadata about an authored
resource including authorship, purpose, lifecycle state, and details for
different languages.

- **Reference:**
  [openEHR BASE - RESOURCE_DESCRIPTION](https://specifications.openehr.org/releases/BASE/latest/resource.html#_resource_description_class)

## 2. Behavior

### 2.1. Properties

#### Authorship

- **`original_author: Hash<String, String>`** - Author details (name, email,
  organization, date)
- **`other_contributors: List<String>`** - Other contributors

#### Purpose and Use

- **`lifecycle_state: String`** - Current state (draft, published, deprecated,
  etc.)
- **`resource_package_uri: String`** - URI of resource package

#### Language-specific Details

- **`details: Hash<String, RESOURCE_DESCRIPTION_ITEM>`** - Details per language

#### Rights

- **`original_namespace: String`** - Namespace of original author
- **`original_publisher: String`** - Publishing organization
- **`other_details: Hash<String, String>`** - Additional metadata
- **`parent_resource: AUTHORED_RESOURCE`** - Reference to parent resource
- **`custodian_namespace: String`** - Namespace of custodian organization
- **`custodian_organisation: String`** - Custodian organization name
- **`copyright: String`** - Copyright statement
- **`licence: String`** - License information
- **`ip_acknowledgements: Hash<String, String>`** - IP acknowledgements

## 3. Example Usage

```typescript
const desc = new RESOURCE_DESCRIPTION();

// Set authorship
const author = new Hash<String, String>();
author.put(String.from("name"), String.from("Dr. Smith"));
author.put(String.from("email"), String.from("smith@hospital.org"));
author.put(String.from("organisation"), String.from("City Hospital"));
author.put(String.from("date"), String.from("2024-03-15"));
desc.original_author = author;

// Set lifecycle
desc.lifecycle_state = String.from("published");

// Add details for original language
const enDetails = new RESOURCE_DESCRIPTION_ITEM();
enDetails.language = Terminology_code.from("en");
enDetails.purpose = String.from("Blood pressure measurement archetype");
enDetails.use = String.from("For recording blood pressure observations");

const details = new Hash<String, RESOURCE_DESCRIPTION_ITEM>();
details.put(String.from("en"), enDetails);
desc.details = details;

// Set rights
desc.copyright = String.from("© 2024 City Hospital");
desc.licence = String.from("Apache 2.0");
```

## 4. Test Cases

1. Test creation with author details
2. Test lifecycle state setting
3. Test details for multiple languages
4. Test copyright and licence
5. Test other_contributors list

## 5. References

- [openEHR BASE - RESOURCE_DESCRIPTION](https://specifications.openehr.org/releases/BASE/latest/resource.html#_resource_description_class)

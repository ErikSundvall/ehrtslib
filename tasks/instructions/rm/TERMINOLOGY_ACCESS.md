# Instruction: Implementing the `TERMINOLOGY_ACCESS` Class

## 1. Description

TERMINOLOGY_ACCESS provides access to a specific terminology. It acts as a proxy
interface to terminology services, enabling code validation and lookup against
terminologies like openEHR, SNOMED-CT, ICD-10, LOINC, etc.

- **Reference:**
  [openEHR RM - TERMINOLOGY_ACCESS](https://specifications.openehr.org/releases/RM/latest/support.html#_terminology_access_class)

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TERMINOLOGY_SERVICE                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ TERMINOLOGY_ACCESS│  │ TERMINOLOGY_ACCESS│  │CODE_SET_ACCESS│ │
│  │   (openehr)       │  │   (SNOMED-CT)    │  │ (languages)   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                      │                    │         │
└───────────┼──────────────────────┼────────────────────┼─────────┘
            │                      │                    │
            ▼                      ▼                    ▼
    ┌───────────────┐      ┌───────────────┐    ┌─────────────┐
    │ Local openEHR │      │ External API  │    │ Local data  │
    │ terminology   │      │ (FHIR TS, etc)│    │ files       │
    │ data files    │      │               │    │             │
    └───────────────┘      └───────────────┘    └─────────────┘
```

## 3. Behavior

### 3.1. Properties

- `terminologyId: string` - Identifier of the terminology (e.g., "openehr",
  "SNOMED-CT")
- `language: string` - Default language for rubrics (e.g., "en")

### 3.2. Methods

#### 3.2.1. `id(): String`

Get terminology identifier.

**Pseudo-code:**

```typescript
id(): openehr_base.String {
  return openehr_base.String.from(this.terminologyId);
}
```

#### 3.2.2. `all_codes(): CODE_PHRASE`

Return all codes known in this terminology.

**Implementation Notes:**

- For openEHR terminology, return codes from local terminology data files
- For external terminologies, this may not be practical (millions of codes)
- Consider returning an iterator or paginated result for large terminologies

**Pseudo-code:**

```typescript
all_codes(): CODE_PHRASE {
  const service = OpenEHRTerminologyService.getInstance();
  const codes = service.getAllCodes(this.terminologyId, this.language);
  
  // Return first code (API limitation - should return array)
  const result = new CODE_PHRASE();
  if (codes.length > 0) {
    result.code_string = codes[0];
    result.terminology_id = new TERMINOLOGY_ID();
    result.terminology_id.value = this.terminologyId;
  }
  return result;
}
```

#### 3.2.3. `codes_for_group_id(a_group_id: String): CODE_PHRASE`

Return all codes under grouper `a_group_id` from this terminology.

**Implementation Notes:**

- Group IDs in openEHR terminology include: "attestation_reason",
  "audit_change_type", "composition_category", "compression_algorithms", etc.
- For SNOMED-CT, groups might be hierarchy concepts

**Pseudo-code:**

```typescript
codes_for_group_id(a_group_id: openehr_base.String): CODE_PHRASE {
  const groupId = typeof a_group_id === 'string' ? a_group_id : a_group_id.value;
  const service = OpenEHRTerminologyService.getInstance();
  
  // Get all codes for the group
  const group = service.getGroup(this.terminologyId, groupId);
  if (!group) {
    throw new Error(`Unknown group: ${groupId}`);
  }
  
  const codes = group.codes;
  
  // Return first code (API limitation)
  const result = new CODE_PHRASE();
  if (codes.length > 0) {
    result.code_string = codes[0].code;
    result.terminology_id = new TERMINOLOGY_ID();
    result.terminology_id.value = this.terminologyId;
  }
  return result;
}
```

#### 3.2.4. `codes_for_group_name(a_lang: String, a_name: String): CODE_PHRASE`

Return all codes under grouper whose name in `a_lang` is `a_name`.

**Pseudo-code:**

```typescript
codes_for_group_name(
  a_lang: openehr_base.String,
  a_name: openehr_base.String
): CODE_PHRASE {
  const lang = typeof a_lang === 'string' ? a_lang : a_lang.value;
  const name = typeof a_name === 'string' ? a_name : a_name.value;
  
  const service = OpenEHRTerminologyService.getInstance();
  const groups = service.getGroupsByName(this.terminologyId, lang, name);
  
  if (groups.length === 0) {
    throw new Error(`No group found with name: ${name}`);
  }
  
  const codes = groups[0].codes;
  const result = new CODE_PHRASE();
  if (codes.length > 0) {
    result.code_string = codes[0].code;
  }
  return result;
}
```

#### 3.2.5. `has_code_for_group_id(group_id: String, code: String): Boolean`

Check if `code` is known in group `group_id` in the terminology.

**Implementation Notes:**

- Used extensively in invariants for coded attributes
- e.g., FEEDER_AUDIT.change_type must be from "audit_change_type" group

**Pseudo-code:**

```typescript
has_code_for_group_id(
  group_id: openehr_base.String,
  code: openehr_base.String
): openehr_base.Boolean {
  const gid = typeof group_id === 'string' ? group_id : group_id.value;
  const codeStr = typeof code === 'string' ? code : code.value;
  
  const service = OpenEHRTerminologyService.getInstance();
  const group = service.getGroup(this.terminologyId, gid);
  
  if (!group) {
    return openehr_base.Boolean.from(false);
  }
  
  const hasCode = group.codes.some(c => c.code === codeStr);
  return openehr_base.Boolean.from(hasCode);
}
```

#### 3.2.6. `rubric_for_code(a_code: String): String`

Get human-readable term (rubric) for a code.

**Implementation Notes:**

- Returns the display name in the configured language
- Falls back to default language if translation not available

**Pseudo-code:**

```typescript
rubric_for_code(a_code: openehr_base.String): openehr_base.String {
  const code = typeof a_code === 'string' ? a_code : a_code.value;
  
  const service = OpenEHRTerminologyService.getInstance();
  const rubric = service.getRubric(this.terminologyId, code, this.language);
  
  if (!rubric) {
    // Fallback to English
    const fallback = service.getRubric(this.terminologyId, code, "en");
    return openehr_base.String.from(fallback ?? code);
  }
  
  return openehr_base.String.from(rubric);
}
```

## 4. External Terminology Service Integration

### 4.1. FHIR Terminology Service

For external terminologies like SNOMED-CT, ICD-10, LOINC, integrate with a FHIR
Terminology Service:

```typescript
class FHIRTerminologyAdapter implements TerminologyProvider {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async validateCode(
    system: string,
    code: string
  ): Promise<boolean> {
    const response = await fetch(
      `${this.baseUrl}/ValueSet/$validate-code?system=${system}&code=${code}`
    );
    const result = await response.json();
    return result.result === true;
  }
  
  async lookupCode(
    system: string,
    code: string,
    language: string
  ): Promise<string | null> {
    const response = await fetch(
      `${this.baseUrl}/CodeSystem/$lookup?system=${system}&code=${code}`
    );
    const result = await response.json();
    return result.parameter?.find(
      (p: any) => p.name === 'display'
    )?.valueString ?? null;
  }
}
```

### 4.2. Terminology Server URLs

Common FHIR terminology server endpoints:

| Server              | URL                                          |
| ------------------- | -------------------------------------------- |
| HAPI FHIR (public)  | https://hapi.fhir.org/baseR4                 |
| Ontoserver          | https://r4.ontoserver.csiro.au/fhir          |
| Snowstorm (SNOMED)  | https://snowstorm.ihtsdotools.org/fhir       |
| LOINC FHIR          | https://fhir.loinc.org                       |

### 4.3. openEHR Terminology Data

For openEHR terminology, use local data files:

- Location: `/terminology_data/` directory
- Format: JSON files with terminology definitions
- Languages: en, es, pt (currently supported)

## 5. Example Usage

```typescript
// Access openEHR terminology
const termService = new TERMINOLOGY_SERVICE();
const openehrTerm = termService.terminology("openehr");

// Check if code is valid for a group
const isValid = openehrTerm.has_code_for_group_id("audit_change_type", "249");
console.log(isValid.value); // true

// Get human-readable term
const rubric = openehrTerm.rubric_for_code("249");
console.log(rubric.value); // "creation"

// Get all codes for a group
const codes = openehrTerm.codes_for_group_id("attestation_reason");

// Access external terminology (SNOMED-CT)
const snomedTerm = termService.terminology("SNOMED-CT");
const term = snomedTerm.rubric_for_code("38341003");
console.log(term.value); // "Hypertension"
```

## 6. openEHR Terminology Groups

Key groups defined in openEHR terminology:

| Group ID                  | Description                          |
| ------------------------- | ------------------------------------ |
| attestation_reason        | Reasons for attestation              |
| audit_change_type         | Types of change for audit            |
| composition_category      | Categories of composition            |
| compression_algorithms    | Supported compression algorithms     |
| instruction_states        | States for instructions              |
| instruction_transitions   | Transitions for instructions         |
| integrity_check_algorithms| Checksum algorithms                  |
| math_function             | Mathematical functions for events    |
| media_types               | Supported media types                |
| null_flavours             | Null flavor codes                    |
| participation_function    | Participation function codes         |
| participation_mode        | Participation mode codes             |
| property                  | Physical property codes              |
| setting                   | Clinical setting codes               |
| subject_relationship      | Subject relationship codes           |
| term_mapping_purpose      | Term mapping purpose codes           |
| version_lifecycle_state   | Version lifecycle states             |

## 7. Test Cases

1. **Valid code lookup**: Get rubric for known code
2. **Invalid code**: Handle unknown codes gracefully
3. **Group membership**: Verify code is in correct group
4. **Language fallback**: Fall back to English if translation missing
5. **External terminology**: Connect to SNOMED-CT via FHIR
6. **Terminology ID**: Return correct terminology identifier
7. **All codes**: Return all codes for small terminologies
8. **Group codes**: Return codes for specific group

## 8. References

- **Official Specification:**
  [openEHR RM - TERMINOLOGY_ACCESS](https://specifications.openehr.org/releases/RM/latest/support.html#_terminology_access_class)
- **openEHR Terminology:**
  [openEHR Terminology](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html)
- **FHIR Terminology Services:**
  [HL7 FHIR TerminologyService](https://www.hl7.org/fhir/terminology-service.html)

# Instruction: Implementing the `DV_GENERAL_TIME_SPECIFICATION` Class

## 1. Description

DV_GENERAL_TIME_SPECIFICATION represents a general specification of timing using
the HL7v3 GTS (General Time Specification) syntax. This allows for complex time
expressions including unions, exclusions, and intersections of time intervals.

- **Reference:**
  [openEHR RM - DV_GENERAL_TIME_SPECIFICATION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_general_time_specification_class)

## 2. Behavior

### 2.1. Properties

- `value: DV_PARSABLE` - Time specification in HL7v3 GTS format

### 2.2. Invariants

- `value.formalism` must be "HL7:GTS"

### 2.3. Methods

#### 2.3.1. `calendar_alignment(): String`

Calendar alignment extracted from value. For GTS format, this may return the
alignment from the first PIVL component if present.

**Implementation Notes:**

- Parse the GTS expression to find any embedded PIVL specifications
- Extract alignment code from the first PIVL found
- Return empty string if no calendar alignment is specified

**Pseudo-code:**

```typescript
calendar_alignment(): openehr_base.String {
  const valueStr = this.value?.value?.value ?? "";
  
  // GTS may contain PIVL components - look for @alignment pattern
  const alignMatch = valueStr.match(/@([A-Z]{2})/);
  if (alignMatch) {
    return openehr_base.String.from(alignMatch[1]);
  }
  
  return openehr_base.String.from("");
}
```

#### 2.3.2. `event_alignment(): String`

Event alignment extracted from value. For GTS format, this may return the event
from the first EIVL component if present.

**Implementation Notes:**

- Parse the GTS expression to find any embedded EIVL specifications
- Extract event code from the first EIVL found
- Return empty string if no event alignment is specified

**Pseudo-code:**

```typescript
event_alignment(): openehr_base.String {
  const valueStr = this.value?.value?.value ?? "";
  
  // Look for event codes at word boundaries
  const eventCodes = ["ACD", "ACM", "ACV", "AC", "PCD", "PCM", "PCV", "PC", 
                      "WAKE", "HS", "CM", "CD", "CV", "C"];
  
  for (const code of eventCodes) {
    const regex = new RegExp(`\\b${code}\\b`);
    if (regex.test(valueStr)) {
      return openehr_base.String.from(code);
    }
  }
  
  return openehr_base.String.from("");
}
```

#### 2.3.3. `institution_specified(): Boolean`

Returns true if any part of the specification is institution specified.

**Implementation Notes:**

- Check for "IST" in the value string
- Can appear at the end of any PIVL component in the GTS expression

**Pseudo-code:**

```typescript
institution_specified(): openehr_base.Boolean {
  const valueStr = this.value?.value?.value ?? "";
  return openehr_base.Boolean.from(valueStr.includes("IST"));
}
```

## 3. GTS (General Time Specification) Syntax

The GTS syntax allows complex time expressions through combination operators:

```ebnf
general_time_spec = symbol | union | exclusion ;
union = intersection [ ";" union ] ;
exclusion = exclusion "\" intersection ;
intersection = factor intersection | factor ;
hull = factor [ ".." hull ] ;
factor = interval | phase_linked_time_spec | event_linked_time_spec | "(" general_time_spec ")" ;
```

### Operators

| Operator | Meaning      | Example                                            |
| -------- | ------------ | -------------------------------------------------- |
| `;`      | Union (OR)   | `PC;HS` - After meal OR before bedtime             |
| `\`      | Exclusion    | `[0800;1700]\[1200;1300]` - 8AM-5PM except 12PM-1PM|
| `..`     | Hull/Range   | `[0800;0830]..[2000;2030]` - Range from 8AM to 8PM |
| `()`     | Grouping     | `(PC;HS)+[1h;1h]` - 1 hour after meal or bedtime   |

## 4. Example Usage

```typescript
// Simple GTS - Union of event times
const gtsSpec = new DV_GENERAL_TIME_SPECIFICATION();
gtsSpec.value = new DV_PARSABLE();
gtsSpec.value.value = "PC;HS"; // After meal OR before bedtime
gtsSpec.value.formalism = "HL7:GTS";

gtsSpec.event_alignment(); // "PC" (first event found)
gtsSpec.calendar_alignment(); // ""
gtsSpec.institution_specified(); // false

// Complex GTS - Daily except weekends
const complexSpec = new DV_GENERAL_TIME_SPECIFICATION();
complexSpec.value = new DV_PARSABLE();
complexSpec.value.value = "[;]/(1d)@DW\\[;]/(7d)@DW"; // Every day except Sat/Sun
complexSpec.value.formalism = "HL7:GTS";

complexSpec.calendar_alignment(); // "DW"

// GTS with institution specified
const istSpec = new DV_GENERAL_TIME_SPECIFICATION();
istSpec.value = new DV_PARSABLE();
istSpec.value.value = "[0800;0830]/(1d)@DMIST"; // Daily at 8AM, institution times
istSpec.value.formalism = "HL7:GTS";

istSpec.institution_specified(); // true
istSpec.calendar_alignment(); // "DM"
```

## 5. Use Cases

### 5.1. Complex Medication Schedules

GTS is ideal for complex medication timing that cannot be expressed with simple
PIVL or EIVL:

- Take three times daily except before bed
- Take with meals but not dinner
- Take hourly during waking hours only

### 5.2. Appointment Scheduling

Express available appointment slots with exclusions:

- Available weekdays 9AM-5PM except 12PM-1PM lunch
- Available Monday, Wednesday, Friday mornings only

## 6. References

- **Official Specification:**
  [openEHR RM - DV_GENERAL_TIME_SPECIFICATION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_general_time_specification_class)
- **HL7 v3 GTS:**
  [HL7 v3 Datatypes R2](http://www.hl7.org/implement/standards/product_brief.cfm?product_id=186)

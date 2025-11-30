# Instruction: Implementing the `DV_PERIODIC_TIME_SPECIFICATION` Class

## 1. Description

DV_PERIODIC_TIME_SPECIFICATION represents periodic timing (e.g., daily, weekly).
Based on HL7v3 data types `PIVL<T>` (Periodic Interval of Time) and `EIVL<T>`
(Event-linked Interval).

- **Reference:**
  [openEHR RM - DV_PERIODIC_TIME_SPECIFICATION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_periodic_time_specification_class)

## 2. Behavior

### 2.1. Properties

- `value: DV_PARSABLE` - Periodic specification in HL7v3 syntax

### 2.2. Invariants

- `value.formalism` must be either "HL7:PIVL" or "HL7:EIVL"

### 2.3. Methods

#### 2.3.1. `period(): DV_DURATION`

Returns the period of the repetition, computationally derived from the syntax
representation.

**Implementation Notes:**

For PIVL format `[interval]/(duration)@alignment`:

- Extract the duration part between `/(` and `)`
- Parse ISO 8601 duration (e.g., "7d" = 7 days, "1mo" = 1 month)
- Return as DV_DURATION

**Pseudo-code:**

```typescript
period(): DV_DURATION {
  const valueStr = this.value?.value?.value ?? "";
  
  // Extract period from PIVL format: [interval]/(period)@alignment
  const periodMatch = valueStr.match(/\/\(([^)]+)\)/);
  if (periodMatch) {
    const periodStr = periodMatch[1];
    // Parse ISO 8601 duration
    return DV_DURATION.fromISO8601(periodStr);
  }
  
  throw new Error("Cannot extract period from value");
}
```

#### 2.3.2. `calendar_alignment(): String`

Calendar alignment extracted from value. Returns alignment code from
HL7::CalendarCycle domain.

**Implementation Notes:**

- Extract characters after "@" and before "IST" (if present)
- Valid values: "DW", "DM", "DY", "WY", "MY", "HD"
- Return empty string if no alignment

**Pseudo-code:**

```typescript
calendar_alignment(): openehr_base.String {
  const valueStr = this.value?.value?.value ?? "";
  
  // Extract alignment from PIVL format: ...@alignment[IST]
  const alignMatch = valueStr.match(/@([A-Z]+)/);
  if (alignMatch) {
    let alignment = alignMatch[1];
    // Remove IST suffix if present
    if (alignment.endsWith("IST")) {
      alignment = alignment.slice(0, -3);
    }
    return openehr_base.String.from(alignment);
  }
  
  return openehr_base.String.from("");
}
```

#### 2.3.3. `event_alignment(): String`

Event alignment extracted from value. Returns event code from HL7::TimingEvent
domain.

**Implementation Notes:**

- For EIVL format, extract the event code at the beginning
- Valid values: "AC", "ACD", "ACM", "ACV", "PC", "PCD", "PCM", "PCV", "HS",
  "WAKE", "C", "CM", "CD", "CV"
- Return empty string if not event-linked

**Pseudo-code:**

```typescript
event_alignment(): openehr_base.String {
  const valueStr = this.value?.value?.value ?? "";
  const formalism = this.value?.formalism?.value ?? "";
  
  // Only EIVL has event alignment
  if (formalism !== "HL7:EIVL") {
    return openehr_base.String.from("");
  }
  
  // Extract event from EIVL format: event[+/-offset]
  const eventCodes = ["ACD", "ACM", "ACV", "AC", "PCD", "PCM", "PCV", "PC", 
                      "WAKE", "HS", "CM", "CD", "CV", "C"];
  for (const code of eventCodes) {
    if (valueStr.startsWith(code)) {
      return openehr_base.String.from(code);
    }
  }
  
  return openehr_base.String.from("");
}
```

#### 2.3.4. `institution_specified(): Boolean`

Returns true if the specification is aligned with institution schedules.

**Implementation Notes:**

- Check for "IST" suffix in the value string
- IST = Institution Specified Time

**Pseudo-code:**

```typescript
institution_specified(): openehr_base.Boolean {
  const valueStr = this.value?.value?.value ?? "";
  return openehr_base.Boolean.from(valueStr.endsWith("IST"));
}
```

## 3. Example Usage

```typescript
// PIVL example - Every Tuesday 11:00-11:10 AM
const pivlSpec = new DV_PERIODIC_TIME_SPECIFICATION();
pivlSpec.value = new DV_PARSABLE();
pivlSpec.value.value = "[200004181100;200004181110]/(7d)@DW";
pivlSpec.value.formalism = "HL7:PIVL";

pivlSpec.period(); // DV_DURATION with 7 days
pivlSpec.calendar_alignment(); // "DW" (Day of Week)
pivlSpec.event_alignment(); // "" (empty - no event)
pivlSpec.institution_specified(); // false

// EIVL example - One hour after meal
const eivlSpec = new DV_PERIODIC_TIME_SPECIFICATION();
eivlSpec.value = new DV_PARSABLE();
eivlSpec.value.value = "PC+[1h;1h]";
eivlSpec.value.formalism = "HL7:EIVL";

eivlSpec.event_alignment(); // "PC" (After meal)
eivlSpec.institution_specified(); // false

// Institution specified example
const istSpec = new DV_PERIODIC_TIME_SPECIFICATION();
istSpec.value = new DV_PARSABLE();
istSpec.value.value = "[200004181100;200004181110]/(7d)@DWIST";
istSpec.value.formalism = "HL7:PIVL";

istSpec.institution_specified(); // true
istSpec.calendar_alignment(); // "DW"
```

## 4. HL7v3 Syntax Reference

### PIVL (Phase-linked Periodic Interval)

```ebnf
phase_linked_time_spec = pure_phase_linked_time_spec [ "IST" ] ;
pure_phase_linked_time_spec = phase [ "@" alignment ] ;
phase = interval "/" "(" difference ")" ;
alignment = "DW" | "DM" | "DY" | "WY" | "MY" | "HD" ;
```

### EIVL (Event-linked Periodic Interval)

```ebnf
event_linked_time_spec = event | event offset ;
event = "AC" | "ACD" | "ACM" | "ACV" | "PC" | "PCD" | "PCM" | "PCV" | "HS" | "WAKE" | "C" | "CM" | "CD" | "CV" ;
offset = ( "+" | "-" ) dur_interval ;
```

### Alignment Codes (HL7::CalendarCycle)

| Code | Meaning         |
| ---- | --------------- |
| DW   | Day of week     |
| DM   | Day of month    |
| DY   | Day of year     |
| WY   | Week of year    |
| MY   | Month of year   |
| HD   | Hour of day     |

### Event Codes (HL7::TimingEvent)

| Code | Meaning          |
| ---- | ---------------- |
| AC   | Before meal      |
| ACD  | Before lunch     |
| ACM  | Before breakfast |
| ACV  | Before dinner    |
| PC   | After meal       |
| PCD  | After lunch      |
| PCM  | After breakfast  |
| PCV  | After dinner     |
| HS   | Before bedtime   |
| WAKE | Upon waking      |
| C    | Meal             |
| CM   | Breakfast        |
| CD   | Lunch            |
| CV   | Dinner           |

## 5. References

- **Official Specification:**
  [openEHR RM - DV_PERIODIC_TIME_SPECIFICATION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_periodic_time_specification_class)
- **HL7 v3 Data Types:**
  [HL7 v3 Datatypes R2](http://www.hl7.org/implement/standards/product_brief.cfm?product_id=186)

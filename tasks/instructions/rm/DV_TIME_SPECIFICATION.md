# DV_TIME_SPECIFICATION

## Description

Abstract parent for time specifications (recurring times, schedules). Used for
timing of observations, medications, etc. This class encapsulates HL7v3 time
specification syntaxes (PIVL, EIVL, GTS) within openEHR types.

**Specification Reference:**
[openEHR RM Data Types](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_time_specification_class)

## Behavior

### Properties

- `value`: DV_PARSABLE - Time specification in HL7v3 syntax for PIVL, EIVL, or
  GTS types

### Methods

#### calendar_alignment(): String

Indicates what prototypical point in the calendar the specification is aligned
to (e.g., "5th of the month"). Empty if not aligned. Extracted from the `value`
attribute.

**Implementation Notes:**

- Parse the `value.value` string to extract the alignment code after "@"
- Valid alignment codes from HL7::CalendarCycle domain:
  - `DW` - Day of the week
  - `DM` - Day of the month
  - `DY` - Day of the year
  - `WY` - Week of the year
  - `MY` - Month of the year
  - `HD` - Hour of the day (half-day)

#### event_alignment(): String

Indicates what real-world event the specification is aligned to if any.
Extracted from the `value` attribute.

**Implementation Notes:**

- Parse the `value.value` string to extract event codes from EIVL format
- Valid event codes from HL7::TimingEvent domain:
  - `AC` - Before meal
  - `ACD` - Before lunch
  - `ACM` - Before breakfast
  - `ACV` - Before dinner
  - `PC` - After meal
  - `PCD` - After lunch
  - `PCM` - After breakfast
  - `PCV` - After dinner
  - `HS` - Before bedtime
  - `WAKE` - Upon waking
  - `C` - Meal
  - `CM` - Breakfast
  - `CD` - Lunch
  - `CV` - Dinner

#### institution_specified(): Boolean

Indicates if the specification is aligned with institution schedules, e.g., a
hospital nursing changeover or meal serving times. Extracted from the `value`
attribute.

**Implementation Notes:**

- Check for "IST" suffix in the `value.value` string
- Returns true if "IST" is present

## HL7v3 Time Specification Syntaxes

### PIVL (Periodic Interval) - Phase-linked

Used for calendar-aligned periodic specifications.

**Syntax (EBNF):**

```ebnf
phase_linked_time_spec = pure_phase_linked_time_spec [ "IST" ] ;
pure_phase_linked_time_spec = phase [ "@" alignment ] ;
phase = interval "/" "(" difference ")" ;
alignment = "DW" | "DM" | "DY" | "WY" | "MY" | "HD" ;
difference = (* ISO 8601 duration, e.g., "7d", "1mo" *) ;
interval = "[" interval_spec "]" ;
interval_spec = ";" | ";" date_time | date_time ";" date_time | date_time ";" ;
date_time = (* ISO 8601: yyyymmdd[hh[mm[ss]]] *) ;
```

**Examples:**

- `[200004181100;200004181110]/(7d)@DW` - "every Tuesday from 11:00 to 11:10 AM"
- `[200004181100;200004181110]/(1mo)@DM` - "every 18th of the month 11:00 to
  11:10 AM"

### EIVL (Event-linked Periodic Interval)

Used for event-aligned specifications (meals, bedtime, etc.).

**Syntax (EBNF):**

```ebnf
event_linked_time_spec = event | event offset ;
event = "AC" | "ACD" | "ACM" | "ACV" | "PC" | "PCD" | "PCM" | "PCV" | "HS" | "WAKE" | "C" | "CM" | "CD" | "CV" ;
offset = ( "+" | "-" ) dur_interval ;
dur_interval = "[" duration ";" duration "]" ;
duration = (* ISO 8601 duration *) ;
```

**Examples:**

- `PC+[1h;1h]` - "one hour after meal"
- `HS-[50min;1h]` - "one hour before bedtime for 10 minutes"
- `ACM` - "before breakfast"

### GTS (General Time Specification)

Used by DV_GENERAL_TIME_SPECIFICATION for complex time expressions.

**Syntax (EBNF):**

```ebnf
general_time_spec = symbol | union | exclusion ;
union = intersection [ ";" union ] ;
exclusion = exclusion "\" intersection ;
intersection = factor intersection | factor ;
hull = factor [ ".." hull ] ;
factor = interval | phase_linked_time_spec | event_linked_time_spec | "(" general_time_spec ")" ;
```

## Invariants

- `Value_valid`: value /= Void
- `Formalism_valid`: value.formalism is one of "HL7:PIVL", "HL7:EIVL", or
  "HL7:GTS"

## Pre-conditions

None - abstract class

## Post-conditions

None

## Example Usage

```typescript
// Abstract - see DV_PERIODIC_TIME_SPECIFICATION for concrete example
const periodicTime = new DV_PERIODIC_TIME_SPECIFICATION();
periodicTime.value = new DV_PARSABLE();
periodicTime.value.value = "[200004181100;200004181110]/(7d)@DW"; // Every Tuesday
periodicTime.value.formalism = "HL7:PIVL";

const alignment = periodicTime.calendar_alignment(); // Returns "DW"
```

## Test Cases

1. **Parsable value**: Value must be DV_PARSABLE
2. **Calendar alignment**: Can extract alignment from PIVL format
3. **Event alignment**: Can extract event from EIVL format
4. **Institution specified**: Can detect IST suffix
5. **Periodic times**: Support PIVL specifications
6. **Event times**: Support EIVL specifications
7. **General times**: Support GTS specifications
8. **Empty alignment**: Return empty string when no alignment present
9. **Clinical usage**: Used in medications, observations

## References

- [openEHR RM Data Types Specification](https://specifications.openehr.org/releases/RM/latest/data_types.html)
- [HL7 v3 Data Types - PIVL](http://www.hl7.org/implement/standards/product_brief.cfm?product_id=186)
- [HL7 v3 Data Types - EIVL](http://www.hl7.org/implement/standards/product_brief.cfm?product_id=186)

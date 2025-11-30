# Instruction: Implementing the `MEASUREMENT_SERVICE` Class

## 1. Description

MEASUREMENT_SERVICE provides measurement and unit conversion services. It acts
as a proxy to external unit validation services, primarily for UCUM (Unified
Code for Units of Measure) compliance.

- **Reference:**
  [openEHR RM - MEASUREMENT_SERVICE](https://specifications.openehr.org/releases/RM/latest/support.html#_measurement_service_class)

## 2. Background: UCUM Specification

UCUM (Unified Code for Units of Measure) is the default standard for expressing
units in openEHR `DV_QUANTITY` objects. Key characteristics:

- Case-sensitive syntax
- Supports SI and imperial unit systems
- Supports metric prefixes (k, m, μ, n, etc.)
- Supports special clinical units

### 2.1. Recommended Implementation Approach

Based on the openEHR community discussion
([Discourse Thread](https://discourse.openehr.org/t/propertyunitdata-xml-and-conversion-information/4968)),
the recommended approach is:

1. **Use the `@lhncbc/ucum-lhc` JavaScript library** for:
   - UCUM unit validation (`is_valid_units_string`)
   - Unit conversion (`convertUnitTo`)
   - Dimension/equivalence checking

2. **Use openEHR PropertyUnitData.xml** only for:
   - Property names and openEHR property IDs
   - Unit groupings by property (e.g., which units belong to "Mass")
   - **NOT** for conversion factors (these are erroneous/imprecise in the file)

3. **Use ucum-essence.xml (via ucum-lhc)** for:
   - Base/primitive unit definitions
   - Accurate conversion factors
   - Special unit handling (e.g., Celsius↔Fahrenheit)

### 2.2. Why This Approach?

Per the openEHR community discussion:
- PropertyUnitData.xml contains conversion factors that are "erroneous and/or
  imprecise" (Silje Ljosland Bakke)
- Some conversions like °F↔°C require special handling that simple conversion
  factors cannot provide (Sebastian Garde)
- The ucum-lhc library handles all UCUM operations correctly, including special
  cases

### 2.3. UCUM Syntax Overview

```ebnf
unit_expression = simple_unit | compound_unit ;
simple_unit = [ prefix ] atom [ exponent ] [ annotation ] ;
compound_unit = unit_expression ( "." | "/" ) unit_expression ;
prefix = "k" | "m" | "μ" | "n" | "c" | "d" | "da" | "h" | "M" | "G" | etc. ;
atom = (* basic unit symbol, e.g., "m", "g", "s", "L" *) ;
exponent = [ "-" ] digit+ ;
annotation = "{" text "}" ;
```

### 2.4. UCUM Unit Examples

| Unit       | Description                    |
| ---------- | ------------------------------ |
| `kg`       | Kilogram                       |
| `mm[Hg]`   | Millimeters of mercury         |
| `mg/dL`    | Milligrams per deciliter       |
| `mL/min`   | Milliliters per minute         |
| `mmol/L`   | Millimoles per liter           |
| `kg/m2`    | Kilograms per square meter     |
| `cm`       | Centimeter                     |
| `[degF]`   | Degrees Fahrenheit             |
| `[in_i]`   | Inch (international)           |
| `kg{body}` | Kilogram (annotated as body weight) |

## 3. Implementation with @lhncbc/ucum-lhc

### 3.1. Installation

```bash
npm install @lhncbc/ucum-lhc
# or
deno add npm:@lhncbc/ucum-lhc
```

### 3.2. Core Implementation

```typescript
import { UcumLhcUtils } from "@lhncbc/ucum-lhc";

export class MEASUREMENT_SERVICE {
  private ucumUtils: UcumLhcUtils;

  constructor() {
    this.ucumUtils = UcumLhcUtils.getInstance();
  }

  /**
   * Check if units string is valid UCUM format.
   */
  is_valid_units_string(units: openehr_base.String): openehr_base.Boolean {
    const unitsStr = typeof units === "string" ? units : (units?.value ?? "");

    // Empty string is valid (dimensionless)
    if (unitsStr === "" || unitsStr === "1") {
      return openehr_base.Boolean.from(true);
    }

    // Use ucum-lhc validation
    const result = this.ucumUtils.validateUnitString(unitsStr, true);
    return openehr_base.Boolean.from(result.status === "valid");
  }

  /**
   * Check if two unit strings are equivalent (same physical dimension).
   */
  units_equivalent(
    units1: openehr_base.String,
    units2: openehr_base.String
  ): openehr_base.Boolean {
    const u1 = typeof units1 === "string" ? units1 : (units1?.value ?? "");
    const u2 = typeof units2 === "string" ? units2 : (units2?.value ?? "");

    // Same units are equivalent
    if (u1 === u2) {
      return openehr_base.Boolean.from(true);
    }

    // Use ucum-lhc to check if conversion is possible
    // If conversion succeeds, units measure the same dimension
    try {
      const result = this.ucumUtils.convertUnitTo(u1, u2, 1);
      return openehr_base.Boolean.from(result.status === "succeeded");
    } catch {
      return openehr_base.Boolean.from(false);
    }
  }

  /**
   * Convert a value from one unit to another.
   */
  convert_units(
    value: number,
    fromUnits: string,
    toUnits: string
  ): { value: number; status: string } {
    const result = this.ucumUtils.convertUnitTo(fromUnits, toUnits, value);
    return {
      value: result.toVal ?? 0,
      status: result.status,
    };
  }

  /**
   * Get the canonical (base) form of a unit.
   */
  get_canonical_units(units: string): string | null {
    const result = this.ucumUtils.convertToBaseUnits(units, 1);
    if (result.status === "succeeded") {
      return result.toUnits ?? null;
    }
    return null;
  }
}
```

### 3.3. Methods

#### 3.3.1. `is_valid_units_string(units: String): Boolean`

Check if units string is valid UCUM format.

**Implementation Notes:**

- Uses `ucumUtils.validateUnitString()` from ucum-lhc
- Returns true for empty string or "1" (dimensionless)
- Case-sensitive validation (UCUM is case-sensitive)

#### 3.3.2. `units_equivalent(units1: String, units2: String): Boolean`

Check if two unit strings are equivalent (represent the same physical quantity).

**Implementation Notes:**

- Units are equivalent if they measure the same physical dimension
- Uses `ucumUtils.convertUnitTo()` - if conversion succeeds, units are equivalent
- e.g., "m" and "cm" are equivalent (both measure length)
- e.g., "kg" and "m" are NOT equivalent (different dimensions)

## 4. openEHR Property Data Integration

### 4.1. PropertyUnitData.xml Usage

The openEHR `PropertyUnitData.xml` file provides:
- Property names (e.g., "Mass", "Length", "Temperature")
- openEHR property IDs (e.g., 124 for Mass, 122 for Length)
- Unit groupings by property

**Important**: Do NOT use the conversion factors from this file - they contain
errors and imprecise values. Use ucum-lhc for all conversions.

### 4.2. PropertyUnitData.xml Structure

```xml
<PropertyUnits>
  <Property id="0" Text="Length" openEHR="122" />
  <Property id="1" Text="Mass" openEHR="124" />
  <!-- ... more properties ... -->
  
  <Unit property_id="1" Text="kg" name="kilogram" UCUM="kg" primary="true" />
  <Unit property_id="1" Text="g" name="gram" UCUM="g" primary="false" />
  <!-- ... more units ... -->
</PropertyUnits>
```

### 4.3. What to Use from PropertyUnitData.xml

| Use | Don't Use |
|-----|-----------|
| Property names | `conversion` attribute |
| openEHR IDs | `coefficient` attribute |
| Unit→Property mappings | |
| `primary` flag | |
| UCUM codes | |

### 4.4. PropertyUnitData Service

```typescript
interface PropertyData {
  id: number;
  text: string;
  openEHRId: number;
}

interface UnitData {
  propertyId: number;
  text: string;
  name: string;
  ucum: string;
  isPrimary: boolean;
}

class PropertyUnitDataService {
  private properties: Map<number, PropertyData> = new Map();
  private units: UnitData[] = [];
  private unitsByProperty: Map<number, UnitData[]> = new Map();

  /**
   * Load PropertyUnitData.xml (without conversion factors)
   */
  async loadFromXml(xmlContent: string): Promise<void> {
    // Parse XML and extract only property/unit grouping data
    // Ignore conversion and coefficient attributes
  }

  /**
   * Get openEHR property ID for a unit
   */
  getPropertyIdForUnit(ucumUnit: string): number | null {
    const unit = this.units.find((u) => u.ucum === ucumUnit);
    return unit?.propertyId ?? null;
  }

  /**
   * Get all units for a property
   */
  getUnitsForProperty(propertyId: number): UnitData[] {
    return this.unitsByProperty.get(propertyId) ?? [];
  }

  /**
   * Get property name
   */
  getPropertyName(propertyId: number): string | null {
    return this.properties.get(propertyId)?.text ?? null;
  }
}
```

## 5. Hybrid Approach: Combined Service

```typescript
import { UcumLhcUtils } from "@lhncbc/ucum-lhc";

export class MEASUREMENT_SERVICE {
  private ucumUtils: UcumLhcUtils;
  private propertyData: PropertyUnitDataService;

  constructor() {
    this.ucumUtils = UcumLhcUtils.getInstance();
    this.propertyData = new PropertyUnitDataService();
  }

  /**
   * Validate unit using ucum-lhc
   */
  is_valid_units_string(units: openehr_base.String): openehr_base.Boolean {
    const unitsStr = typeof units === "string" ? units : (units?.value ?? "");
    if (unitsStr === "" || unitsStr === "1") {
      return openehr_base.Boolean.from(true);
    }
    const result = this.ucumUtils.validateUnitString(unitsStr, true);
    return openehr_base.Boolean.from(result.status === "valid");
  }

  /**
   * Check equivalence using ucum-lhc
   */
  units_equivalent(
    units1: openehr_base.String,
    units2: openehr_base.String
  ): openehr_base.Boolean {
    const u1 = typeof units1 === "string" ? units1 : (units1?.value ?? "");
    const u2 = typeof units2 === "string" ? units2 : (units2?.value ?? "");
    if (u1 === u2) return openehr_base.Boolean.from(true);
    try {
      const result = this.ucumUtils.convertUnitTo(u1, u2, 1);
      return openehr_base.Boolean.from(result.status === "succeeded");
    } catch {
      return openehr_base.Boolean.from(false);
    }
  }

  /**
   * Get openEHR property ID using PropertyUnitData
   */
  get_property_id(unit: string): number | null {
    return this.propertyData.getPropertyIdForUnit(unit);
  }

  /**
   * Get common units for a property using PropertyUnitData
   */
  get_units_for_property(propertyId: number): string[] {
    return this.propertyData
      .getUnitsForProperty(propertyId)
      .map((u) => u.ucum);
  }
}
```

## 6. Example Usage

```typescript
const measService = new MEASUREMENT_SERVICE();

// Valid UCUM unit strings
measService.is_valid_units_string("mm[Hg]"); // true
measService.is_valid_units_string("mg/dL"); // true
measService.is_valid_units_string("kg/m2"); // true
measService.is_valid_units_string("Cel"); // true

// Invalid unit strings
measService.is_valid_units_string("invalid_unit"); // false
measService.is_valid_units_string("mmHG"); // false (wrong case)

// Unit equivalence
measService.units_equivalent("m", "cm"); // true (both length)
measService.units_equivalent("kg", "[lb_av]"); // true (both mass)
measService.units_equivalent("kg", "m"); // false (different dimensions)
measService.units_equivalent("Cel", "[degF]"); // true (both temperature)

// Unit conversion (using ucum-lhc)
const converted = measService.convert_units(100, "Cel", "[degF]");
// converted.value = 212, converted.status = "succeeded"

// Property lookup (using PropertyUnitData)
const propId = measService.get_property_id("kg"); // returns 124 (Mass)
const massUnits = measService.get_units_for_property(124); // ["kg", "g", "mg", ...]
```

## 7. Test Cases

1. **Valid SI units**: kg, m, L, s
2. **Valid prefixed units**: mm, kg, mL, μg
3. **Valid compound units**: mg/dL, mmol/L, mL/min
4. **Valid special units**: mm[Hg], [degF], [pH]
5. **Valid annotated units**: kg{body}, L{total}
6. **Invalid units**: misspelled, wrong case
7. **Equivalent units**: m/cm, kg/g, L/mL, Cel/[degF]
8. **Non-equivalent units**: kg/m, L/s
9. **Temperature conversions**: Cel↔[degF], Cel↔K (special handling)
10. **Property ID lookup**: kg→124, m→122

## 8. Data Sources and Update Process

### 8.1. Data Sources

| Source | URL | Usage |
|--------|-----|-------|
| ucum-lhc | npm: @lhncbc/ucum-lhc | Validation, conversion |
| PropertyUnitData.xml | [GitHub](https://github.com/openEHR/specifications-TERM/blob/master/computable/XML/PropertyUnitData.xml) | Property/unit groupings |
| ucum-essence.xml | Bundled in ucum-lhc | Base unit definitions |

### 8.2. Update Process

See the README.md "Maintaining External Dependencies" section for the update
process for ucum-lhc and PropertyUnitData.xml.

## 9. References

- **Official Specification:**
  [openEHR RM - MEASUREMENT_SERVICE](https://specifications.openehr.org/releases/RM/latest/support.html#_measurement_service_class)
- **UCUM Specification:**
  [https://ucum.org/ucum.html](https://ucum.org/ucum.html)
- **UCUM-LHC Library:**
  [https://lhncbc.github.io/ucum-lhc/](https://lhncbc.github.io/ucum-lhc/)
- **openEHR Discourse Discussion:**
  [PropertyUnitData.xml and conversion information](https://discourse.openehr.org/t/propertyunitdata-xml-and-conversion-information/4968)
- **PropertyUnitData.xml:**
  [GitHub - specifications-TERM](https://github.com/openEHR/specifications-TERM/blob/master/computable/XML/PropertyUnitData.xml)

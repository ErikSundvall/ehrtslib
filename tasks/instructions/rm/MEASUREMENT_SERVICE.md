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

### 2.1. UCUM Syntax Overview

```ebnf
unit_expression = simple_unit | compound_unit ;
simple_unit = [ prefix ] atom [ exponent ] [ annotation ] ;
compound_unit = unit_expression ( "." | "/" ) unit_expression ;
prefix = "k" | "m" | "μ" | "n" | "c" | "d" | "da" | "h" | "M" | "G" | etc. ;
atom = (* basic unit symbol, e.g., "m", "g", "s", "L" *) ;
exponent = [ "-" ] digit+ ;
annotation = "{" text "}" ;
```

### 2.2. UCUM Unit Examples

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

## 3. Behavior

### 3.1. Methods

#### 3.1.1. `is_valid_units_string(units: String): Boolean`

Check if units string is valid UCUM format.

**Implementation Options:**

1. **External UCUM Library** (Recommended): Use an existing UCUM validation
   library

2. **Basic Pattern Validation**: Implement regex-based validation for common
   patterns

3. **External API**: Call a UCUM validation web service

**Pseudo-code (Pattern-based):**

```typescript
is_valid_units_string(units: openehr_base.String): openehr_base.Boolean {
  const unitsStr = typeof units === 'string' ? units : units.value;
  
  // Common UCUM patterns
  const ucumPatterns = [
    // Basic units with optional prefix
    /^[yzafpnμmcdhkMGTPEZY]?[a-zA-Z]+(\d+)?$/,
    // Compound units with division
    /^[a-zA-Z]+\/[a-zA-Z]+$/,
    // Units with brackets (special units)
    /^[a-zA-Z]*\[[^\]]+\]$/,
    // Units with annotations
    /^[a-zA-Z]+\{[^}]+\}$/,
    // Common clinical units
    /^(mg|g|kg|L|mL|dL|mmol|mol|mm|cm|m|min|h|s|Cel|\[degF\])$/,
  ];
  
  // Check against known valid units or patterns
  const validUnits = new Set([
    "kg", "g", "mg", "μg", "ng",
    "L", "mL", "dL", "μL",
    "m", "cm", "mm", "km",
    "mmol/L", "mg/dL", "g/dL",
    "mm[Hg]", "kPa", "Pa",
    "mL/min", "L/min",
    "kg/m2", "kg/m^2",
    "Cel", "[degF]",
    "s", "min", "h", "d", "wk", "mo", "a",
    "%", "[pH]", "1", ""
  ]);
  
  if (validUnits.has(unitsStr)) {
    return openehr_base.Boolean.from(true);
  }
  
  for (const pattern of ucumPatterns) {
    if (pattern.test(unitsStr)) {
      return openehr_base.Boolean.from(true);
    }
  }
  
  return openehr_base.Boolean.from(false);
}
```

**Pseudo-code (External Library):**

```typescript
// Using hypothetical UCUM library
import { UcumValidator } from '@lhncbc/ucum-lhc';

is_valid_units_string(units: openehr_base.String): openehr_base.Boolean {
  const validator = new UcumValidator();
  const unitsStr = typeof units === 'string' ? units : units.value;
  const result = validator.validateUnitString(unitsStr);
  return openehr_base.Boolean.from(result.status === 'valid');
}
```

#### 3.1.2. `units_equivalent(units1: String, units2: String): Boolean`

Check if two unit strings are equivalent (represent the same physical quantity).

**Implementation Notes:**

- Units are equivalent if they measure the same physical dimension
- e.g., "m" and "cm" are equivalent (both measure length)
- e.g., "kg" and "lb" are equivalent (both measure mass)
- e.g., "kg" and "m" are NOT equivalent (different dimensions)

**Pseudo-code:**

```typescript
units_equivalent(
  units1: openehr_base.String,
  units2: openehr_base.String
): openehr_base.Boolean {
  const u1 = typeof units1 === 'string' ? units1 : units1.value;
  const u2 = typeof units2 === 'string' ? units2 : units2.value;
  
  // Same units are equivalent
  if (u1 === u2) {
    return openehr_base.Boolean.from(true);
  }
  
  // Define dimension groups
  const dimensionGroups: Record<string, string[]> = {
    "length": ["m", "cm", "mm", "km", "μm", "nm", "[in_i]", "[ft_i]", "[mi_i]"],
    "mass": ["kg", "g", "mg", "μg", "ng", "[lb_av]", "[oz_av]"],
    "volume": ["L", "mL", "dL", "μL", "[gal_us]", "[pt_us]"],
    "time": ["s", "min", "h", "d", "wk", "mo", "a"],
    "temperature": ["Cel", "[degF]", "K"],
    "pressure": ["Pa", "kPa", "mm[Hg]", "[psi]", "bar"],
    "concentration_mass": ["mg/dL", "g/L", "g/dL", "mg/L"],
    "concentration_substance": ["mmol/L", "mol/L", "μmol/L"],
    "velocity": ["m/s", "km/h", "[mi_i]/h"],
    "area": ["m2", "cm2", "mm2"],
    "flow_rate": ["mL/min", "L/min", "L/h"],
    "bmi": ["kg/m2", "kg/m^2"],
  };
  
  // Find dimension for each unit
  const getDimension = (unit: string): string | null => {
    for (const [dim, units] of Object.entries(dimensionGroups)) {
      if (units.includes(unit)) return dim;
    }
    return null;
  };
  
  const dim1 = getDimension(u1);
  const dim2 = getDimension(u2);
  
  if (dim1 && dim2 && dim1 === dim2) {
    return openehr_base.Boolean.from(true);
  }
  
  return openehr_base.Boolean.from(false);
}
```

## 4. External Library Integration

For production use, consider integrating with established UCUM libraries:

### 4.1. JavaScript/TypeScript Options

- **@lhncbc/ucum-lhc**: UCUM validator from Lister Hill National Center for
  Biomedical Communications
- **ucum-js**: JavaScript UCUM validation library

### 4.2. Integration Pattern

```typescript
import { UcumLhcUtils } from '@lhncbc/ucum-lhc';

export class MEASUREMENT_SERVICE {
  private ucumUtils: UcumLhcUtils;
  
  constructor() {
    this.ucumUtils = UcumLhcUtils.getInstance();
  }
  
  is_valid_units_string(units: openehr_base.String): openehr_base.Boolean {
    const unitsStr = typeof units === 'string' ? units : units.value;
    const result = this.ucumUtils.validateUnitString(unitsStr, true);
    return openehr_base.Boolean.from(result.status === 'valid');
  }
  
  units_equivalent(
    units1: openehr_base.String,
    units2: openehr_base.String
  ): openehr_base.Boolean {
    const u1 = typeof units1 === 'string' ? units1 : units1.value;
    const u2 = typeof units2 === 'string' ? units2 : units2.value;
    
    // Convert both to base units and compare dimensions
    const result = this.ucumUtils.convertUnitTo(u1, u2, 1);
    return openehr_base.Boolean.from(result.status === 'succeeded');
  }
}
```

## 5. Example Usage

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
measService.units_equivalent("kg", "lb"); // true (both mass)
measService.units_equivalent("kg", "m"); // false (different dimensions)
measService.units_equivalent("mmol/L", "mg/dL"); // false (different types)
```

## 6. Test Cases

1. **Valid SI units**: kg, m, L, s
2. **Valid prefixed units**: mm, kg, mL, μg
3. **Valid compound units**: mg/dL, mmol/L, mL/min
4. **Valid special units**: mm[Hg], [degF], [pH]
5. **Valid annotated units**: kg{body}, L{total}
6. **Invalid units**: misspelled, wrong case
7. **Equivalent units**: m/cm, kg/g, L/mL
8. **Non-equivalent units**: kg/m, L/s

## 7. References

- **Official Specification:**
  [openEHR RM - MEASUREMENT_SERVICE](https://specifications.openehr.org/releases/RM/latest/support.html#_measurement_service_class)
- **UCUM Specification:**
  [https://ucum.org/ucum.html](https://ucum.org/ucum.html)
- **UCUM-LHC Library:**
  [https://lhncbc.github.io/ucum-lhc/](https://lhncbc.github.io/ucum-lhc/)

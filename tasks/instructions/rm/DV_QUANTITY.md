# Instruction: Implementing the `DV_QUANTITY` Class

## 1. Description

The `DV_QUANTITY` class represents a quantified value with magnitude and units. It is used for measurements like blood pressure, weight, temperature, etc.

-   **Reference:** [openEHR RM - DV_QUANTITY](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_quantity_class)

## 2. Behavior

### 2.1. Properties

#### `magnitude: Real`

-   **Purpose:** The numerical value.
-   **Mandatory:** Yes

#### `units: String`

-   **Purpose:** Units of measurement (UCUM format).
-   **Mandatory:** Yes
-   **Examples:** "mm[Hg]", "kg", "cm", "°C"

#### `precision: Integer`

-   **Purpose:** Number of decimal places.
-   **Optional:** Yes (default -1 = full precision)

### 2.2. Factory Methods

```typescript
static from(magnitude: number, units: string): DV_QUANTITY {
  const dv = new DV_QUANTITY();
  dv.magnitude = magnitude;
  dv.units = units;
  return dv;
}
```

### 2.3. Arithmetic Operations

-   **`add(other: DV_QUANTITY): DV_QUANTITY`** - Addition (same units)
-   **`subtract(other: DV_QUANTITY): DV_QUANTITY`** - Subtraction
-   **`multiply(factor: Real): DV_QUANTITY`** - Multiply by scalar
-   **`is_strictly_comparable_to(other: DV_QUANTITY): Boolean`** - Check unit compatibility

## 3. Invariants

-   **Magnitude_valid:** `magnitude /= Void`
-   **Units_valid:** `units /= Void and then not units.is_empty()`
-   **Precision_valid:** `precision = -1 or precision >= 0`

## 4. Example Usage

```typescript
const systolic = DV_QUANTITY.from(120, "mm[Hg]");
const diastolic = DV_QUANTITY.from(80, "mm[Hg]");

// Arithmetic
const diff = systolic.subtract(diastolic);
console.log(diff.magnitude);  // 40

// Comparison
if (systolic.is_strictly_comparable_to(diastolic)) {
  console.log("Same units - can compare");
}

// With precision
const temp = new DV_QUANTITY();
temp.magnitude = 36.5;
temp.units = "°C";
temp.precision = 1;  // One decimal place
```

## 5. Test Cases

1. Test creation with magnitude and units
2. Test UCUM unit validation
3. Test arithmetic operations (add, subtract)
4. Test multiply by scalar
5. Test is_strictly_comparable_to with same/different units
6. Test precision handling
7. Test with various unit types

## 6. References

-   [openEHR RM - DV_QUANTITY](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_quantity_class)
-   [UCUM Units](https://ucum.org/)
-   [Archie DV_QUANTITY](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datavalues/quantity/DvQuantity.java)

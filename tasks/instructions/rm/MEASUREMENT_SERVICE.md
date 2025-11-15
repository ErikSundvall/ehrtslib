# Instruction: Implementing the `MEASUREMENT_SERVICE` Class

## 1. Description

MEASUREMENT_SERVICE provides measurement and unit conversion services.

- **Reference:**
  [openEHR RM - MEASUREMENT_SERVICE](https://specifications.openehr.org/releases/RM/latest/support.html#_measurement_service_class)

## 2. Behavior

### 2.1. Methods

#### 2.1.1. `is_valid_units_string(units: String): Boolean`

Check if units string is valid UCUM format.

**Pseudo-code:**

```typescript
is_valid_units_string(units: String): Boolean {
  // Validate against UCUM specification
  // e.g., "kg", "mm[Hg]", "mg/dL"
  return Boolean.from(this.ucum_validator.validate(units));
}
```

#### 2.1.2. `units_equivalent(units1: String, units2: String): Boolean`

Check if two unit strings are equivalent.

**Pseudo-code:**

```typescript
units_equivalent(units1: String, units2: String): Boolean {
  // Check if units represent same dimension
  // e.g., "m" and "cm" are equivalent
  return Boolean.from(this.get_dimension(units1) === this.get_dimension(units2));
}
```

## 3. Example Usage

```typescript
const measService = MEASUREMENT_SERVICE.instance();
const valid = measService.is_valid_units_string("mm[Hg]"); // true
const equiv = measService.units_equivalent("m", "cm"); // true
```

## 4. References

- **Official Specification:**
  [openEHR RM - MEASUREMENT_SERVICE](https://specifications.openehr.org/releases/RM/latest/support.html#_measurement_service_class)

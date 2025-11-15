# Instruction: Implementing the `DV_BOOLEAN` Class

## 1. Description

The `DV_BOOLEAN` class represents boolean (true/false) clinical data values.

- **Reference:**
  [openEHR RM - DV_BOOLEAN](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_boolean_class)

## 2. Behavior

### 2.1. Properties

#### `value: Boolean`

- **Purpose:** The boolean value.
- **Mandatory:** Yes

### 2.2. Factory Method

```typescript
static from(value: boolean): DV_BOOLEAN {
  const dv = new DV_BOOLEAN();
  dv.value = value;
  return dv;
}
```

## 3. Example Usage

```typescript
const isPregnant = DV_BOOLEAN.from(true);
const isSmoker = DV_BOOLEAN.from(false);

console.log(isPregnant.value); // true
```

## 4. Test Cases

1. Test creation with true
2. Test creation with false
3. Test comparison
4. Test in ELEMENT

## 5. References

- **Official Specification:**
  [openEHR RM - DV_BOOLEAN](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_boolean_class)

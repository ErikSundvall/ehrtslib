# Instruction: Implementing the `Cardinality` Class

## 1. Description

The `Cardinality` class specifies cardinality constraints (multiplicity +
uniqueness) for container attributes.

- **Reference:**
  [openEHR BASE - Cardinality](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_cardinality_class)

## 2. Behavior

### 2.1. Properties

- **`interval: Multiplicity_interval`** - The multiplicity
- **`is_ordered: Boolean`** - Whether order matters
- **`is_unique: Boolean`** - Whether duplicates allowed

### 2.2. Methods

- **`is_bag(): Boolean`** - Unordered, duplicates allowed
- **`is_list(): Boolean`** - Ordered, duplicates allowed
- **`is_set(): Boolean`** - Unordered, no duplicates

## 3. Example Usage

```typescript
const card = new Cardinality();
card.interval = Multiplicity_interval.oneOrMore();
card.is_ordered = true;
card.is_unique = false;

console.log(card.is_list()); // true
```

## 4. References

- [openEHR BASE - Cardinality](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_cardinality_class)

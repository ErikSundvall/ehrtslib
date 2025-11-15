# Instruction: Implementing the `DV_PARSABLE` Class

## 1. Description

DV_PARSABLE represents data in parsable string format (XML, JSON, etc.).

- **Reference:**
  [openEHR RM - DV_PARSABLE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_parsable_class)

## 2. Behavior

- `value: String` - The parsable content
- `formalism: String` - Format type (e.g., "text/xml", "application/json")

## 3. Example Usage

```typescript
const xml = new DV_PARSABLE();
xml.value = "<data><item>value</item></data>";
xml.formalism = "text/xml";
```

## 4. References

- **Official Specification:**
  [openEHR RM - DV_PARSABLE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_parsable_class)

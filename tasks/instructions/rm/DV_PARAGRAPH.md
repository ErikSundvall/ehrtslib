# Instruction: Implementing the `DV_PARAGRAPH` Class

## 1. Description

DV_PARAGRAPH represents a paragraph of text composed of multiple DV_TEXT items.

-   **Reference:** [openEHR RM - DV_PARAGRAPH](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_paragraph_class)

## 2. Behavior

### 2.1. Properties

- `items: List<DV_TEXT>` - Text items forming the paragraph

### 2.2. Methods

#### 2.2.1. `to_string(): String`

Convert paragraph to single string.

**Pseudo-code:**
```typescript
to_string(): String {
  if (!this.items || this.items.length === 0) {
    return String.from("");
  }
  
  let result = "";
  for (const item of this.items) {
    if (result !== "") {
      result += " ";
    }
    result += item.value;
  }
  
  return String.from(result);
}
```

## 3. Example Usage

```typescript
const paragraph = new DV_PARAGRAPH();
paragraph.items = [
  new DV_TEXT("First sentence."),
  new DV_TEXT("Second sentence."),
  new DV_TEXT("Third sentence.")
];
```

## 4. References

-   **Official Specification:** [openEHR RM - DV_PARAGRAPH](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_paragraph_class)

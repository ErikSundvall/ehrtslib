# Instruction: Implementing the `TERMINOLOGY_STATUS` Class

## 1. Description

The `TERMINOLOGY_STATUS` class indicates the status of a terminology entity.

- **Reference:**
  [openEHR TERM](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html)

## 2. Behavior

### 2.1. Values

- `active` - Currently in use
- `deprecated` - No longer recommended
- `experimental` - Under development

## 3. Example Usage

```typescript
const status = new TERMINOLOGY_STATUS();
status.value = "active";
```

## 4. References

- **Official Specification:**
  [openEHR TERM](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html)

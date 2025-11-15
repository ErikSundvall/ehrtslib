# EXTRACT_ITEM

## Description

Generic item within an extract. Used for versioned content extracts.

**Specification Reference:**
[openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- `uid`: HIER_OBJECT_ID (optional) - UID of the item
- `item`: Any - The extract content

## Example Usage

\`\`\`typescript const extractItem = new EXTRACT_ITEM(); extractItem.uid =
hierObjectId; extractItem.item = versionedContent; \`\`\`

## Test Cases

1. **UID optional**: Item may have UID
2. **Generic content**: Can hold any content type
3. **Extract integration**: Used in EXTRACT

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)

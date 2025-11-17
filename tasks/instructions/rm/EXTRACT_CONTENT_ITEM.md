# EXTRACT_CONTENT_ITEM

## Description

Item of content within an extract chapter. Base class for specific extract
content types.

**Specification Reference:**
[openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- `item`: LOCATABLE (optional) - The actual content item
- `is_primary`: Boolean - True if this is primary content (not ancillary)
- `is_changed`: Boolean - True if item changed since last extract
- `is_masked`: Boolean - True if item is masked for privacy

## Invariants

- All boolean properties defined

## Example Usage

\`\`\`typescript const contentItem = new EXTRACT_CONTENT_ITEM();
contentItem.item = composition; contentItem.is_primary = true;
contentItem.is_changed = true; contentItem.is_masked = false; \`\`\`

## Test Cases

1. **Content item**: Can contain LOCATABLE
2. **Primary flag**: Distinguishes primary vs ancillary
3. **Change tracking**: Tracks if item changed
4. **Privacy masking**: Support for masked content

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)

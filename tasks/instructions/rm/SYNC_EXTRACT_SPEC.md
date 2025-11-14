# SYNC_EXTRACT_SPEC

## Description

Specification for synchronization extracts.

**Specification Reference:**
[openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- Inherits from EXTRACT_SPEC
- `include_change_history`: Boolean - Include change history

## Example Usage

\`\`\`typescript const syncSpec = new SYNC_EXTRACT_SPEC();
syncSpec.include_change_history = true; syncSpec.include_directory = true;
\`\`\`

## Test Cases

1. **Change history**: Control history inclusion
2. **Sync configuration**: Configure sync behavior

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)

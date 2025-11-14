# SYNC_EXTRACT_REQUEST

## Description

Request for a synchronization extract.

**Specification Reference:**
[openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- Inherits from EXTRACT_REQUEST
- `sync_from`: DV_DATE_TIME (optional) - Sync changes from this time

## Example Usage

\`\`\`typescript const syncRequest = new SYNC_EXTRACT_REQUEST();
syncRequest.sync_from = lastSyncTime; syncRequest.update_spec = updateSpec;
\`\`\`

## Test Cases

1. **Sync from time**: Specify starting point
2. **Incremental**: Request incremental changes
3. **Full sync**: Can request full sync

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)

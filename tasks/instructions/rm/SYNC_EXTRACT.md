# SYNC_EXTRACT

## Description

Extract designed for synchronization between systems.

**Specification Reference:**
[openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- Inherits from EXTRACT: request_id, time_created, system_id, sequence_nr,
  chapters
- Specialized for synchronization scenarios

## Example Usage

\`\`\`typescript const syncExtract = new SYNC_EXTRACT();
syncExtract.time_created = new DV_DATE_TIME(); syncExtract.chapters =
[syncChapters]; \`\`\`

## Test Cases

1. **Synchronization**: Designed for sync operations
2. **Incremental updates**: Support incremental sync
3. **Change tracking**: Tracks changes since last sync

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)

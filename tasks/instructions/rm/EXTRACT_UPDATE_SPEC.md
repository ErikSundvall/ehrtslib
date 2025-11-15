# EXTRACT_UPDATE_SPEC

## Description

Specification for updating content via extract.

**Specification Reference:**
[openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- `persist_in_server`: Boolean - Should changes persist
- `commit_change_sets`: Boolean - Commit changes atomically
- `trigger_events`: DV_CODED_TEXT (optional) - Events to trigger

## Example Usage

\`\`\`typescript const updateSpec = new EXTRACT_UPDATE_SPEC();
updateSpec.persist_in_server = true; updateSpec.commit_change_sets = true;
\`\`\`

## Test Cases

1. **Persistence**: Control persistence behavior
2. **Atomic commits**: Support atomic operations
3. **Event triggering**: Can trigger events
4. **Update control**: Controls extract updates

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)

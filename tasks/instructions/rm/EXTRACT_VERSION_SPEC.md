# EXTRACT_VERSION_SPEC

## Description

Specification for versioning in extracts.

**Specification Reference:** [openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- `include_all_versions`: Boolean - Include all versions or just latest
- `include_revision_history`: Boolean - Include revision history
- `include_data`: Boolean - Include actual data

## Example Usage

\`\`\`typescript
const versionSpec = new EXTRACT_VERSION_SPEC();
versionSpec.include_all_versions = false; // Just latest
versionSpec.include_revision_history = true;
versionSpec.include_data = true;
\`\`\`

## Test Cases

1. **Version selection**: Choose all or latest
2. **History inclusion**: Control history inclusion
3. **Data inclusion**: Control data inclusion
4. **Extract configuration**: Configures extract content

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)

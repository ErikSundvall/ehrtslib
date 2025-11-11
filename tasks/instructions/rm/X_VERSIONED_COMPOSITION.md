# X_VERSIONED_COMPOSITION

## Description

XML-specific versioned COMPOSITION for XML messaging and extract scenarios.

**Specification Reference:** [openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- Inherits from X_VERSIONED_OBJECT<COMPOSITION>
- Specialized for COMPOSITION versioning in XML

## Example Usage

\`\`\`typescript
const xVersioned = new X_VERSIONED_COMPOSITION();
xVersioned.uid = versionedObjectId;
xVersioned.owner_id = ehrId;
\`\`\`

## Test Cases

1. **COMPOSITION versioning**: Versions COMPOSITION objects
2. **XML format**: Designed for XML messaging
3. **Extract integration**: Used in XML extracts

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)

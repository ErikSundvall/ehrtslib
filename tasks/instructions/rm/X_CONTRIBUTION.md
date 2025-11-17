# X_CONTRIBUTION

## Description

XML-specific CONTRIBUTION for XML messaging scenarios.

**Specification Reference:**
[openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- Similar to CONTRIBUTION but adapted for XML
- `uid`: HIER_OBJECT_ID - Contribution identifier
- `versions`: List<OBJECT_REF> - Version references
- `audit`: AUDIT_DETAILS - Audit information

## Example Usage

\`\`\`typescript const xContribution = new X_CONTRIBUTION(); xContribution.uid =
contributionId; xContribution.audit = auditDetails; xContribution.versions =
[versionRefs]; \`\`\`

## Test Cases

1. **XML format**: Designed for XML messaging
2. **Version tracking**: References versions
3. **Audit trail**: Includes audit information

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)

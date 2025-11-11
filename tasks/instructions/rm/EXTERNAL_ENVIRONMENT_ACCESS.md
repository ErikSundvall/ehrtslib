# EXTERNAL_ENVIRONMENT_ACCESS

## Description

Specifies access control settings for external environments accessing the EHR.

**Specification Reference:** [openEHR RM EHR](https://specifications.openehr.org/releases/RM/latest/ehr.html)

## Behavior

### Properties

- `url`: DV_URI - URL of external environment
- `settings`: List<ACCESS_CONTROL_SETTINGS> - Access settings for this environment

## Invariants

- `Url_valid`: url /= Void
- `Settings_valid`: settings /= Void implies not settings.is_empty

## Example Usage

\`\`\`typescript
const extAccess = new EXTERNAL_ENVIRONMENT_ACCESS();
extAccess.url = new DV_URI();
extAccess.url.value = "https://external-system.example.com";
extAccess.settings = [accessControlSettings];
\`\`\`

## Test Cases

1. **URL required**: Must have external environment URL
2. **Settings list**: Can have multiple settings
3. **EHR access**: Used in EHR_ACCESS
4. **Security**: Defines external access rules

## References

- [openEHR RM EHR Specification](https://specifications.openehr.org/releases/RM/latest/ehr.html)

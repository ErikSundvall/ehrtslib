# MESSAGE_CONTENT

## Description

Content of a message in the messaging framework.

**Specification Reference:**
[openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- `content`: Any - The message content (typically LOCATABLE or extract)

## Example Usage

\`\`\`typescript const messageContent = new MESSAGE_CONTENT();
messageContent.content = composition; // or extract, etc. \`\`\`

## Test Cases

1. **Generic content**: Can hold any content type
2. **Message payload**: Represents message payload
3. **Flexible**: Supports various content types

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)

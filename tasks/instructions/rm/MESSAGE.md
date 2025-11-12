# Instruction: Implementing the `MESSAGE` Class

## 1. Description

MESSAGE is the root class for messaging structures.

-   **Reference:** [openEHR RM - MESSAGE](https://specifications.openehr.org/releases/RM/latest/integration.html#_message_class)

## 2. Behavior

### 2.1. Properties

- `audit: AUDIT_DETAILS` - Audit information
- `content: CONTENT_ITEM` - Message content

## 3. Example Usage

```typescript
const message = new MESSAGE();
message.audit = new AUDIT_DETAILS();
message.audit.system_id = "system123";
message.content = new COMPOSITION();
```

## 4. References

-   **Official Specification:** [openEHR RM - MESSAGE](https://specifications.openehr.org/releases/RM/latest/integration.html#_message_class)

# Instruction: Implementing the `ADDRESSED_MESSAGE` Class

## 1. Description

ADDRESSED_MESSAGE is a message with sender and recipient information.

- **Reference:**
  [openEHR RM - ADDRESSED_MESSAGE](https://specifications.openehr.org/releases/RM/latest/integration.html#_addressed_message_class)

## 2. Behavior

### 2.1. Properties

Inherits from MESSAGE:

- `sender: PARTY_IDENTIFIED` - Message sender
- `receiver: PARTY_IDENTIFIED` - Message recipient
- `urgency: Integer` - Message urgency (0-9)

## 3. Example Usage

```typescript
const message = new ADDRESSED_MESSAGE();
message.sender = new PARTY_IDENTIFIED();
message.sender.name = "Dr. Smith";
message.receiver = new PARTY_IDENTIFIED();
message.receiver.name = "Cardiology Dept";
message.urgency = Integer.from(5);
```

## 4. References

- **Official Specification:**
  [openEHR RM - ADDRESSED_MESSAGE](https://specifications.openehr.org/releases/RM/latest/integration.html#_addressed_message_class)

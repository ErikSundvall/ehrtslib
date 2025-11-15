# RESOURCE_DESCRIPTION

## Description

This class is defined in the BASE package but used extensively in RM context.

**See:** `tasks/instructions/base/RESOURCE_DESCRIPTION.md` for detailed
documentation.

**Specification Reference:**
[openEHR BASE Foundation Types](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html)

## Usage in RM

This BASE package class is used in RM for:

- Resource annotation and metadata
- Authoring information
- Translation details
- Multi-language support

## Example Usage

```typescript
// See tasks/instructions/base/RESOURCE_DESCRIPTION.md for detailed examples
import { RESOURCE_DESCRIPTION } from "./openehr_base.ts";

const resource = new RESOURCE_DESCRIPTION();
// ... refer to BASE package documentation
```

## References

- See `tasks/instructions/base/RESOURCE_DESCRIPTION.md` for complete
  documentation
- [openEHR BASE Specification](https://specifications.openehr.org/releases/BASE/latest/)
- [openEHR RM Specification](https://specifications.openehr.org/releases/RM/latest/)

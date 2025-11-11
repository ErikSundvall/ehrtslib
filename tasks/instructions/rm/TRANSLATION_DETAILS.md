# TRANSLATION_DETAILS

## Description

This class is defined in the BASE package but used extensively in RM context.

**See:** `tasks/instructions/base/TRANSLATION_DETAILS.md` for detailed documentation.

**Specification Reference:** [openEHR BASE Foundation Types](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html)

## Usage in RM

This BASE package class is used in RM for:
- Resource annotation and metadata
- Authoring information
- Translation details
- Multi-language support

## Example Usage

```typescript
// See tasks/instructions/base/TRANSLATION_DETAILS.md for detailed examples
import { TRANSLATION_DETAILS } from "./openehr_base.ts";

const resource = new TRANSLATION_DETAILS();
// ... refer to BASE package documentation
```

## References

- See `tasks/instructions/base/TRANSLATION_DETAILS.md` for complete documentation
- [openEHR BASE Specification](https://specifications.openehr.org/releases/BASE/latest/)
- [openEHR RM Specification](https://specifications.openehr.org/releases/RM/latest/)

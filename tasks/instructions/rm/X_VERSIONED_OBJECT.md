# X_VERSIONED_OBJECT<T>

## Description

Generic/parameterized version of X_VERSIONED_OBJECT. See X_VERSIONED_OBJECT.md
for detailed documentation.

This is the generic type definition allowing type-safe implementations with
specific content types.

**Specification Reference:**
[openEHR RM Specification](https://specifications.openehr.org/releases/RM/latest/)

## Behavior

Same as X_VERSIONED_OBJECT but with generic type parameter T for type safety.

### Type Parameter

- `T`: The type of content being versioned/contained

## Example Usage

```typescript
// Generic type allows type-safe implementations
const version: VERSION<COMPOSITION> = new ORIGINAL_VERSION<COMPOSITION>();
const history: HISTORY<ITEM_STRUCTURE> = new HISTORY<ITEM_STRUCTURE>();
const event: EVENT<ITEM_STRUCTURE> = new POINT_EVENT<ITEM_STRUCTURE>();
```

## References

- See X_VERSIONED_OBJECT.md for detailed documentation
- [openEHR RM Specification](https://specifications.openehr.org/releases/RM/latest/)

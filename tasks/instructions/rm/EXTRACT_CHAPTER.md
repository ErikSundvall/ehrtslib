# Instruction: Implementing the `EXTRACT_CHAPTER` Class

## 1. Description

EXTRACT_CHAPTER represents a chapter in an Extract containing data.

-   **Reference:** [openEHR RM - EXTRACT_CHAPTER](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_chapter_class)

## 2. Behavior

### 2.1. Properties

- `directory: FOLDER` - Optional directory structure
- `content: CONTENT_ITEM` - Chapter content

## 3. Example Usage

```typescript
const chapter = new EXTRACT_CHAPTER();
chapter.content = new COMPOSITION();
```

## 4. References

-   **Official Specification:** [openEHR RM - EXTRACT_CHAPTER](https://specifications.openehr.org/releases/RM/latest/integration.html#_extract_chapter_class)

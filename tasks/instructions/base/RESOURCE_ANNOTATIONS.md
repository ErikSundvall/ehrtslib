# Instruction: Implementing the `RESOURCE_ANNOTATIONS` Class

## 1. Description

The `RESOURCE_ANNOTATIONS` class contains annotations for specific paths within
a resource, organized by language.

- **Reference:**
  [openEHR BASE - RESOURCE_ANNOTATIONS](https://specifications.openehr.org/releases/BASE/latest/resource.html#_resource_annotations_class)

## 2. Behavior

### 2.1. Properties

- **`documentation: Hash<String, Hash<String, Hash<String, String>>>`**
  - First key: language code
  - Second key: path in resource
  - Third key: annotation key
  - Value: annotation value

## 3. Example Usage

```typescript
const annotations = new RESOURCE_ANNOTATIONS();

// Create nested structure
const enAnnotations = new Hash<String, Hash<String, String>>();
const pathAnnotations = new Hash<String, String>();
pathAnnotations.put(
  String.from("design"),
  String.from("Note about design choice"),
);
pathAnnotations.put(String.from("comment"), String.from("Implementation note"));

enAnnotations.put(String.from("/data[at0001]"), pathAnnotations);

const documentation = new Hash<String, Hash<String, Hash<String, String>>>();
documentation.put(String.from("en"), enAnnotations);

annotations.documentation = documentation;
```

## 4. References

- [openEHR BASE - RESOURCE_ANNOTATIONS](https://specifications.openehr.org/releases/BASE/latest/resource.html#_resource_annotations_class)

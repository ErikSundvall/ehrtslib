# Instruction: Implementing the `Uri` Class

## 1. Description

The `Uri` class extends String to represent Uniform Resource Identifiers (URIs).

-   **Reference:** [openEHR BASE - Uri](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_uri_class)

## 2. Behavior

Uri validates that the string conforms to URI syntax and provides URI-specific operations.

### 2.1. Validation

-   **`is_valid(): Boolean`** - Check if string is a valid URI

### 2.2. Component Accessors

-   **`scheme(): String`** - Returns URI scheme (http, https, ftp, etc.)
-   **`host(): String`** - Returns host part
-   **`path(): String`** - Returns path part

## 3. Example Usage

```typescript
const uri = Uri.from("https://specifications.openehr.org/releases/BASE/latest");
console.log(uri.scheme().value);  // "https"
console.log(uri.host().value);    // "specifications.openehr.org"
```

## 4. Test Cases

1. Test parsing various URI schemes
2. Test component extraction
3. Test validation

## 5. References

-   [openEHR BASE - Uri](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_uri_class)
-   [RFC 3986 - URI Syntax](https://tools.ietf.org/html/rfc3986)

# Instruction: Implementing the `DV_MULTIMEDIA` Class

## 1. Description

DV_MULTIMEDIA represents multimedia data like images, audio, video.

- **Reference:**
  [openEHR RM - DV_MULTIMEDIA](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_multimedia_class)

## 2. Behavior

- `media_type: CODE_PHRASE` - MIME type
- `data: Array<Octet>` - Binary data
- `uri: DV_URI` - Alternative: reference to external data
- `size: Integer` - Size in bytes

## 3. Example Usage

```typescript
const image = new DV_MULTIMEDIA();
image.media_type = CODE_PHRASE.from("image/jpeg", "IANA_media-types");
image.uri = new DV_URI();
image.uri.value = "http://example.com/xray.jpg";
```

## 4. References

- **Official Specification:**
  [openEHR RM - DV_MULTIMEDIA](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_multimedia_class)

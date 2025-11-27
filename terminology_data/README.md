# OpenEHR Terminology Data

This directory contains the official openEHR terminology and code set definitions in XML format.

## Files

- `openehr_terminology_en.xml` - English terminology (groups and code sets)
- `openehr_terminology_es.xml` - Spanish terminology
- `openehr_terminology_pt.xml` - Portuguese terminology
- `openehr_external_terminologies.xml` - External code sets (ISO countries, languages, etc.)

## Source

These files are downloaded from the official openEHR specifications repository:
https://github.com/openEHR/specifications-TERM/tree/master/computable/XML

## Version

Current version: 3.1.0 (dated 2024-04-11)

## Usage

The terminology service automatically loads these files when initialized. See `enhanced/terminology_service.ts` for implementation details.

## Updating

To update to the latest terminology files, run:

```bash
cd terminology_data
for lang in en es pt; do
  curl -sL https://raw.githubusercontent.com/openEHR/specifications-TERM/master/computable/XML/${lang}/openehr_terminology.xml \
    -o openehr_terminology_${lang}.xml
done
curl -sL https://raw.githubusercontent.com/openEHR/specifications-TERM/master/computable/XML/openehr_external_terminologies.xml \
  -o openehr_external_terminologies.xml
```

## Documentation

For more information about openEHR terminologies, see:
https://specifications.openehr.org/releases/TERM/development

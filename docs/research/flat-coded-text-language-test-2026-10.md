# FLAT DV_CODED_TEXT language test (sv/en template)

> **2026-10-30. Status: research note, not normative; may be outdated.** Related: [ehrtslib PR #236](https://github.com/ErikSundvall/ehrtslib/pull/236) (`codedTextMismatch`, `codedTextDisplayValue`) and the Discourse topic [Simplified Formats (FLAT) completing partial DV_CODED_TEXT input](https://discourse.openehr.org/t/simplified-formats-flat-completing-partial-dv-coded-text-input/17446).

This note records how three openEHR implementations complete or reject partial FLAT `DV_CODED_TEXT` input when the template has more than one language.

## Template and leaf

- **Template:** `ChemoForm-MBA(oral_administration).v1`. Its original language is Swedish (sv), with an English (en) translation.
- **Source:** the public Region Stockholm release [ChemoForm-MBA(oral_administration).1.0.1](https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/releases/tag/ChemoForm-MBA%28oral_administration%29.1.0.1), asset `ChemoForm-MBA.oral_administration.1.0.1.sv.en.opt` (sha256 `6ec013e1ecc097747098bdafadeae1b11fbde60d86e0b2f7c56c4abcc6e59c9e`). The OPT is linked rather than copied here.
- **Leaf:** ELEMENT `at0005` "Upplever du svårigheter med din andning?" ("Do you have difficulty breathing?"), a local code list:

  | Code | sv rubric | en rubric |
  | ---- | --------- | --------- |
  | `at0023` | Ja | Yes |
  | `at0024` | Nej | No |

  FLAT path (written `<leaf>` below):
  `patientrapporterade_symptom_inför_medicinsk_onkologisk_behandling_oral_administrering/frågeformulär_för_symptom_och_andra_tecken/ospecificerad_händelse:0/andning/upplever_du_svårigheter_med_din_andning`

## FLAT inputs

Every variant sends the same base keys plus `ctx/language` and one leaf input. The base keys are:
- `ctx/territory` SE, `ctx/composer_name`, `ctx/time`, `ctx/setting` 238;
- category 433;
- the template's other mandatory leaves.

The exact keys are in [flat_inputs.json](flat-coded-text-language-test-2026-10/flat_inputs.json).

| ID | `ctx/language` | Leaf input |
| -- | -------------- | ---------- |
| V1 | sv | `<leaf>\|code` = `at0023` |
| V2 | en | `<leaf>\|code` = `at0023` |
| V3 | sv | `<leaf>\|value` = `Ja` |
| V4 | sv | `<leaf>\|value` = `Yes` (en rubric) |
| V5 | en | `<leaf>\|value` = `Yes` |
| V6 | en | `<leaf>\|value` = `Ja` (sv rubric) |
| V7 | sv | `<leaf>` = `Ja` (bare key) |
| V8 | en | `<leaf>` = `Yes` (bare key) |
| V9 | en | `<leaf>` = `at0023` (bare key) |

## Implementations tested

- **EHRbase 2.36.0** (openEHR_SDK 2.35.0), REST, using the original OPT.
- **FerroEHR 5.5.0**, REST.
  - FerroEHR refuses the original OPT with 422, because ordinal `<symbol>` elements have no `<value>`.
  - The test therefore used a copy that adds 34 empty `<value/>` elements to ordinal symbols and 3 `<id/>` elements to DV_IDENTIFIER default values. The coded texts are unchanged.
- **Better web-template 3.2.9 and 5.0.1** ([tag 5.0.1](https://github.com/better-care/web-template/tree/5.0.1)), used as a **library probe, not a CDR**.
  - The probe builds the Web Template with default language sv and languages sv and en, then calls `convertFromFlatToRaw` with the variant's language.
  - No RM or template validation step runs. A Better server might reject results that the library produces.

## Results

The stored `DV_CODED_TEXT` is shown as value / code. Results that differ from the requested language, or that are RM-invalid, are in bold.

| ID | Input | EHRbase 2.36.0 | FerroEHR 5.5.0 | Better 3.2.9 and 5.0.1 |
| -- | ----- | -------------- | -------------- | ---------------------- |
| V1 | `\|code` at0023, sv | Ja / at0023 | Ja / at0023 | Ja / at0023 |
| V2 | `\|code` at0023, en | **Ja** / at0023 | **Ja** / at0023 | Yes / at0023 |
| V3 | `\|value` Ja, sv | Ja / at0023 | 422 | **Ja / no `defining_code`** |
| V4 | `\|value` Yes, sv | 422 | 422 | **Yes / no `defining_code`** |
| V5 | `\|value` Yes, en | 422 | 422 | **Yes / no `defining_code`** |
| V6 | `\|value` Ja, en | **Ja** / at0023 | 422 | **Ja / no `defining_code`** |
| V7 | bare `Ja`, sv | Ja / at0023 | 422 | exception |
| V8 | bare `Yes`, en | 422 | 422 | exception |
| V9 | bare `at0023`, en | **Ja** / at0023 | 422 | Yes / at0023 |

Error messages:
- **EHRbase 422:** `Attribute code_string of class CODE_PHRASE does not match existence 1..1`. No code was found for the text.
- **FerroEHR 422:** `the datum parts do not form a valid DV_CODED_TEXT`.
- **Better exception:** `ConversionException: Missing DvCodedText.value at <leaf>`.

### EHRbase

A value with no code, and a bare key that is not a code, is matched against the Web Template labels. Those labels are in the template's default language (sv).
- So Swedish "Ja" completes to at0023 even in an English composition, and English "Yes" finds no code.
- A code alone gets the Swedish rubric whatever the composition language is.

Source: [DvCodedTextRMUnmarshaller.java L72–126](https://github.com/ehrbase/openEHR_SDK/blob/3d5ca54c6a488030cbd5ef33fd26a605f6435089/serialisation/src/main/java/org/ehrbase/openehr/sdk/serialisation/flatencoding/std/umarshal/rmunmarshaller/DvCodedTextRMUnmarshaller.java#L72-L126).

### FerroEHR

`|code` is required for every coded value, so value-only and bare-key input fails in any language. When `|value` is missing, the value comes from the Web Template label, which is in the default language.

Source (v5.5.0): [data_values.rs `build_coded_text` L585–609](https://github.com/FerroHEALTH/FerroEHR/blob/d25c95a974142ec13fe7b107fa098555ef1631c3/crates/openehr-sdt/src/flat/map/data_values.rs#L585-L609).

### Better web-template

- **`|code` alone** gets the rubric in the conversion (composition) language.
- **`|value` alone** is stored as sent, with no code lookup. The result is a `DV_CODED_TEXT` without `defining_code`, which the RM does not allow. The library itself doesn't reject it.
- **A bare key** is parsed as `code`, `code::value` or `terminology::code::value`. A bare rubric is therefore taken as a code, and when that code is unknown the conversion fails.
- **Names:** the ELEMENT name stays in the Web Template default language (Swedish) in English compositions.
- **5.0.1 vs 3.2.9:** 5.0.1 gives the same results as 3.2.9 for every variant.

Source (5.0.1):
- [DvCodedTextFactory.kt `handleDvCodedTextField` L107–162](https://github.com/better-care/web-template/blob/05320691dbda9b1ac94379d5591b17595c20a5b8/src/main/kotlin/care/better/platform/web/template/converter/raw/factory/leaf/DvCodedTextFactory.kt#L107-L162);
- [`handleDvCodedTextString` L317–336](https://github.com/better-care/web-template/blob/05320691dbda9b1ac94379d5591b17595c20a5b8/src/main/kotlin/care/better/platform/web/template/converter/raw/factory/leaf/DvCodedTextFactory.kt#L317-L336): the rubric is looked up in `conversionContext.language` only when no value was sent.

## Reproduction

The scripts are in [flat-coded-text-language-test-2026-10/](flat-coded-text-language-test-2026-10/).

- **REST servers:**
  1. Upload the OPT (the patched copy for FerroEHR).
  2. Run `python3 cdr_language_test.py <base-url> [--auth user:pass] [--ehrbase-format-param]`.
  - `--ehrbase-format-param` posts with `?format=FLAT&templateId=…`. Without it, the script uses `Content-Type: application/openehr.wt.flat+json` and the `openehr-template-id` header.
  - The script reads each stored composition back in canonical JSON and prints the leaf.
- **Better library:**
  1. Copy `BetterLanguageProbeTest.kt` into `src/test/kotlin/probe/` of a checkout of the tag.
  2. Run `mvn test -Dtest=BetterLanguageProbeTest -DargLine="-Dprobe.dir=<folder> -Dprobe.opt=<OPT path>"`.
  3. Run `python3 better_probe_summary.py`.
  - 3.2.9 builds with JDK 21 and needs the `javax.xml.bind.JAXBElement` import. 5.0.1 builds with JDK 25 and needs `jakarta.xml.bind.JAXBElement`.

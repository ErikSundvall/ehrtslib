# Contribution Builder demo fixtures

Copied from
[Ehrlibs/openEHR-model-examples](https://github.com/Ehrlibs/openEHR-model-examples/tree/3d11d53ba7f1333ac5ec46d846daf130a9495577/local/theme-packs/simple-diagnose-and-vitals)
at commit `3d11d53ba7f1333ac5ec46d846daf130a9495577` (template sem_ver 0.4.0).

- `simple-diagnose-and-vitals.t.json`: the Archetype Designer source at that
  commit. It allows the problem/diagnosis evaluation 0..*, and turns on
  `at0009.1` (clinical description), `at0069.1` (comment) and `at0063.1`
  (body-temperature comment). Those nodes were `0..0` in `40573df`.
- `simple-diagnose-and-vitals.opt` and `simple-diagnose-and-vitals.wt.json`:
  the previous Better export (`40573df`), which did not contain those elements
  in the definition, plus the same three DV_TEXT elements at the parent at-codes
  `at0009`, `at0069` and `at0063` (0..1). The upstream OPT and
  `simple-diagnose-and-vitals.wt..json` in that commit were not regenerated.
  The Web Template `semVer` is `0.4.0`. Diagnosis occurrences are 0..*.

Original author, translation and archetype attributions remain embedded in the
OPT. The upstream repository does not declare a top-level licence; this copy
makes no additional licensing claim about these model artefacts.

The page hand-codes respiration rate, BP, pulse, temperature and percentage
SpO₂ from the WT, plus the three narrative DV_TEXT elements above. The OPT is
bound with `bindTemplate` and used for full validation and ADL 1.4 commit codes.
SpO₂ explicitly sets RM `DV_PROPORTION.type = 2` (`pk_percent`), which this
source WT does not expose as an input.

Problem/Diagnosis name is `at0002` (`value/value`), a short DV_TEXT. Clinical
description is `at0009` and the extra comment is `at0069`; the temperature
comment is `at0063`. Those three are the native-text fields. The entry name is
not used as a narrative. No invented notes element and no Pencil-in form.

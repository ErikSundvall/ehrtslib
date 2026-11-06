# Contribution Builder demo fixtures

Copied from
[Ehrlibs/openEHR-model-examples](https://github.com/Ehrlibs/openEHR-model-examples/tree/40573df0c4647c1b812f2378b80c088d3238bac7/local/theme-packs/simple-diagnose-and-vitals)
at commit `40573df0c4647c1b812f2378b80c088d3238bac7`.

- `simple-diagnose-and-vitals.opt`: OPT 1.4 XML; two trailing spaces in
  human-readable descriptions were trimmed. No model constraint was changed.
- `simple-diagnose-and-vitals.wt.json`: unchanged Web Template JSON content;
  upstream filename is `simple-diagnose-and-vitals.wt..json` (double dot).

Original author, translation and archetype attributions remain embedded in the
OPT. The upstream repository does not declare a top-level licence; this copy
makes no additional licensing claim about these model artefacts.

The page hand-codes BP, pulse and percentage SpO₂ paths from the WT. The OPT is
bound with `bindTemplate` and used for full validation and ADL 1.4 commit codes.
SpO₂ explicitly sets RM `DV_PROPORTION.type = 2` (`pk_percent`), which this
source WT does not expose as an input. No template constraint is modified.

The diagnosis heading edits `EVALUATION.name/value`. The long diagnosis
narrative edits `data[at0001]/items[at0002]/value/value` (the template's
diagnosis DV_TEXT), not an invented general clinical-notes element. No
Pencil-in/generated form.

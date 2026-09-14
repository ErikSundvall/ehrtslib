# Generate L10n annotations without touching the definition tree

TAAAT must be able to mint Better/AD `L10n.{lang}` path annotations so repeated, renamed archetype occurrences keep translations in ADL 1.4 OPT export ([discourse #2760](https://discourse.openehr.org/t/2760)). Generation writes only `L10n.*` keys into `annotations.documentation`, copies those keys into every annotation language bag (AD treats annotations as language-specific), and never mutates definition, terminology, overlays’ constraint trees, or non-L10n keys. Existing `L10n.*` values are left alone unless the caller opts into overwrite.

**Considered options:** patch OPT XML by hand (rejected — OPTs are compiled artefacts); put extra translations in `component_ontologies` (rejected — one block per archetype id); a new language-independent annotation type (not what AD/Studio consume today).

# Contribution Builder: optional GraphQL API over draft content

Status: proposed (draft for review, open questions below). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).

## Context

Apps, form engines and AI agents want to read and change the content of a
contribution build without learning the builder's TypeScript API or the
canonical RM JSON tree. GraphQL lets a caller ask for exactly the nodes and
fields it needs and send typed changes, and it has tooling in most
languages.

People and agents name nodes in different ways:

- by **ADL2 codes**: archetype id plus id-codes or at-codes along a path,
  for example `openEHR-EHR-OBSERVATION.blood_pressure.v2/data[id2]/events[id7]/data[id4]/items[id5]`;
- by **natural-language names** of the nodes in a chosen language, for
  example `Blodtryck/Systoliskt` in Swedish or `Blood pressure/Systolic` in
  English;
- by **template annotations**: any annotation on a template node, for
  example the symbol annotations `a.id` or `am.symbol_binding` (such as
  `tobacco_user`) from the openEHR Discourse thread [Agreeing on optional user interface hints in templates](https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406/19),
  or a project's own keys. The bound template is in the builder's memory,
  so all of its annotations are available for lookup;
- by **instance uid**, as the builder does internally ([ADR 0003](0003-cb-identity-and-uids.md)).

Every change must still go through the operation log and target a node uid
([ADR 0004](0004-cb-operation-log-and-sync.md)).

## Decision

- An **optional module** (for example `ehrtslib/contribution-builder/graphql`)
  exposes a GraphQL schema over one `ContributionBuild`. The core builder
  does not depend on it, and GraphQL libraries are only loaded by this
  module.
- **Shipped as a separate add-on release file.** GraphQL is bloat for most
  users, so the module is not exported from `mod.ts` and is not part of the
  main `ehrtslib-<version>.min.js` bundle or the `-rm`, `-parser` and
  `-serialization` bundles. It gets its own entry point and its own GitHub
  Release asset, for example `ehrtslib-<version>-cb-graphql.min.js`, which
  contains the GraphQL library and imports the core instead of bundling a
  second copy of it.
- **Transport-neutral.** The module executes GraphQL in process
  (`execute(build, query, variables, context)`). Serving it over HTTP or
  WebSocket is the caller's choice, for example in the planned CDR proxy.
- **Scope is uncommitted CB content only**: drafts, their nodes, values,
  validation results, template binding and the build's audit input. Querying
  committed EHR data stays with AQL and the REST API.
- **A `NodeAddress` is either a `uid` or a path of steps.** The steps can
  be mixed freely in one path, and each step is one of:
  - a **code step**: an ADL2 id-code (or an at-code for ADL 1.4 style
    callers, mapped with the existing id-code to at-code mapping), with the
    archetype id where a path enters an archetype;
  - a **name step**: a node name from the bound template's terminology in
    the request's `lang`, or a Web Template node id;
  - an **annotation step**: `@key=value`, matching template nodes that
    carry that annotation key with that value. **Any annotation key can be
    used**, not only symbol keys;
  - a **symbol step**: `$value`, shorthand for an annotation step over a
    configurable list of symbol keys, by default `a.id` and
    `am.symbol_binding`;
  - an **index**: a 0-based instance index (`:1`), as in FLAT paths.
  Spec anchors: template annotations are the path-keyed, per-language
  `RESOURCE_ANNOTATIONS.documentation` structure (BASE Resource; ADL2
  "Annotations Section"). Variable-to-path bindings in rules are ADL2 rules
  variable declarations (`$name: Type := /path`) and, in the draft revised
  rules section, `symbols.symbol_bindings` with multilingual
  `symbol_definitions`; a symbol annotation is an interim way to author
  such a binding in tools without rules support.
- **A path does not have to start at the root.** A path that starts with a
  symbol or annotation step finds every matching template node anywhere in
  the template. Steps after it navigate down from those nodes.
- **No uniqueness is required of annotation values.** A step that matches
  several template nodes is fine in a query. If a mutation needs one node,
  the caller adds more prefix steps until the path matches only one, for
  example `$bp/$systolic` or `@ui.section=vitals/$systolic`. This follows
  the ADL2 rules pattern of narrowing with sub-paths of a bound symbol
  instead of requiring globally unique names.
- **Language of annotation values.** Annotations are stored per language.
  An annotation step matches in the request's `lang` and then falls back
  as for names. Values in language-independent families such as `a.` and
  `am.` are read from the original language when no translation exists.
- **Language follows the ehrtslib language design** (ehrtslib#160): `lang`
  is an ISO language code. When it is left out, the build's primary language
  (`lang.1`) is used. A name with no translation falls back along the
  build's ordered language list and finally to the archetype's original
  language.
- **Names are matched on the template's term texts**, not on instance
  `name` values, after the same normalisation that Web Template ids use
  (case-insensitive, whitespace and punctuation folded). Instance names that
  differ from the archetype term, such as a renamed `CLUSTER`, can be matched
  with an explicit instance-name step. Web Template node ids (Simplified
  Formats section 4.2, including the `_1` suffix for duplicate sibling names)
  are accepted as name-path steps too.
- **Annotations and symbols bind to template nodes, not instances.** As
  Thomas Beale points out in the same thread, the mapping from a template
  node to runtime data is 1:N, so an annotation step can match several
  instances. The index, uid and ambiguity rules below apply as for any
  other step.
- **Repeated instances** are picked with a 0-based index step (`event:1` for
  the second event, as in FLAT paths) or by uid. The result of resolving an
  address is always a list of uids.
- **Address resolution lives in the core**, as a plain function from a
  `uid` or a step path to uids. It is useful without GraphQL, and the
  add-on only wraps it.
- **Ambiguity is never guessed in a mutation.** A query may return several
  matches. A mutation whose address matches more than one node, or none,
  fails with a structured error that lists the candidates (uid, code path,
  name path in the requested language, and the annotations that would make
  the path unique).
- **Deep trees without deep queries.** GraphQL has no recursion or
  wildcards, so openEHR's deep trees are reached in three ways:
  - `nodes(at: [steps])` returns a flat list of matching nodes with `uid`,
    `parentUid`, `rmType`, value, and the path as an array (like the
    `path` array in GraphQL errors). Clients rebuild a tree from parent
    links if they need one;
  - `subtree(at: [steps], format: CANONICAL | FLAT | STRUCTURED)` returns a
    whole subtree as a JSON scalar in canonical RM JSON or one of the
    Simplified Formats;
  - the later generated schema (question 1) exposes annotation and symbol
    steps as **shortcut fields** that skip intermediate RM layers, as Web
    Template and FLAT do, so annotations become the natural entry points.
- **Typed steps are canonical; strings are shorthand.** A path is a list of
  typed step input objects (a one-of with `code`, `name`, `annotation
  {key, value}`, `symbol` or `index`), which is how GraphQL APIs usually
  take filters and needs no escaping. A `/`-separated string form is
  accepted as shorthand for people, AI agents and logs.
- **Every mutation is a thin layer over operations.** For example,
  `setValue`, `addInstance`, `removeInstance`, `moveInstance`,
  `setComposer`, `setParticipation` and `setLifecycle` each resolve their
  address to uids and append the matching operations to the log. The author
  comes from the GraphQL context, not from arguments. There is no
  GraphQL-only state.
- **Data value choices are explicit.** Where a node allows several `DV_*`
  types, `setValue` takes a one-of input with an explicit `rmType`, using
  GraphQL `@oneOf` input objects if the chosen library supports them.
- **Results carry validation.** Each mutation returns the changed nodes with
  their quick-check results ([ADR 0008](0008-cb-validation-and-lifecycle.md)).
  Each node in a query can return its own `problems`, and every node exposes
  its uid, code path, name path and its template annotations, so a caller
  can move between the ways of addressing.

## Consequences

- Callers can work in their own language and vocabulary, while the log,
  replay and conflict handling stay uid-based and language-independent.
- AI agents (for example via MCP) and form engines get a typed,
  self-describing interface to CB content.
- Name paths depend on template translations. A translation change in a new
  template version can change name paths but never uids or code paths.
- The module adds an optional dependency on a GraphQL implementation, which
  must run in Deno and the browser and have an acceptable licence. Users who
  don't load the add-on file pay nothing in bundle size.
- The release workflow needs one more bundle target, and the release docs
  need one more asset row.

## Alternatives considered

- **A GraphQL layer that bypasses the operation log.** Rejected: it would
  break replay, attribution and session playback.
- **Natural-language names as the only way of addressing.** Rejected: names
  are ambiguous and change with language and translation; code paths and
  uids are needed for reliable automation.
- **Inventing a CB-specific alias mechanism.** Rejected: annotations
  (including the symbol keys `a.id` and the later `am.symbol_binding` from
  t/2406 #46) already exist, ehrtslib reads them, and template tools can
  author them today.
- **Requiring unique symbol values, with duplicates as an authoring
  error.** Rejected by the maintainer: any annotation may be used for
  addressing, and ambiguity is solved by adding prefix steps.
- **Matching on instance `name` values only.** Rejected as the default:
  names in data may be free text, but kept as an explicit step.

## Open questions

1. **Schema shape:** one generic schema (a `Node` type with `uid`,
   `codePath`, `namePath`, `rmType`, `value` and `children`), a typed schema
   generated per bound template with fields named after nodes, or a generic
   schema first with a generated schema later. Generated field names would
   depend on the chosen language and would need Web Template style
   normalisation. Proposed: generic schema now, and an optional generated
   schema later with ASCII-folded Web Template ids as field names and the
   ADL2 code in a directive such as `@node(code: "id5")`.
2. **Symbol uniqueness (decided by Erik, 2026-10-25):** not required. Any
   annotation can address nodes, and non-unique matches need more path
   prefixing (see Decision). The evidence below is kept for the record.
   Evidence:
   - ADL2 rules declare variables once, in the archetype's or template's
     single `rules` section. The draft `symbol_bindings` is likewise one
     keyed table per artefact, so a symbol is unique within the (flattened)
     artefact. AOM2 rule VOKU requires keys in keyed lists to be unique. An `a.id` value is an annotation value, not a key, so VOKU does not enforce its uniqueness.
   - Nesting is expressed by sub-paths of a bound symbol, not by repeating
     names. Examples are `for_all $event : /data/events` with
     `$event/data/...` (ADL2 rules), and a `root` plus `children` binding
     (Thomas Beale, [t/2406 #44](https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406/44)).
   - Specialisation: templates are specialised archetypes (AOM2 Templates),
     so overlays add or override annotations at a path. Erik Sundvall
     ([#43](https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406/43))
     notes that a renderer "just gets the sum of all layers' annotations".
     The sections checked do not define merge rules for annotations.
   - Annotations are keyed by language first (AOM2 validation: annotations
     must be translations of each other). A symbol value should therefore
     be identical in every language, or be read from the original language.
   - t/2406 does not settle uniqueness.

   The evidence suggested treating duplicates as an authoring error; the
   maintainer chose prefixing instead, which matches the sub-path pattern
   above.
3. **Path string shorthand:** typed steps are canonical (see Decision).
   The string shorthand (`$`, `@key=`, `:n`, bracketed codes) still needs
   an escaping rule for `/` and `=` in names and values.
4. **Lifecycle verbs:** should `validate`, `discard` and `commit` be
   GraphQL mutations, or stay in the TypeScript API only?
5. **Annotation key (decision needed from Erik):** `a.id` (t/2406 #19,
   #39), or `am.symbol_binding` (Erik Sundvall,
   [#46](https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406/46),
   with Thomas Beale's approval in #47). The `am.` prefix marks things that
   ADL rules could represent natively, while `a.` is for hints passed on to
   other layers. #51 notes that "key" has also been used in ADL2 evolution
   discussions. The resolver accepts a configured list of symbol keys for
   the `$` shorthand, so this only decides the default list; any key also
   works through `@key=value`.
6. **Subscriptions:** should live changes (for example from other replicas
   in the multi-user flavour) be offered as GraphQL subscriptions, and in
   which phase?
7. **Prior work:** how much to align with earlier openEHR community
   discussions of GraphQL (to be summarised in the design document).
   Evidence so far (design document section 9.3, "Prior openEHR GraphQL
   discussions"):
   - Earlier threads treat GraphQL as an optional layer on top of the
     standard APIs, and several of them as an interface to a contribution
     builder.
   - The one published OPT-to-GraphQL generator moved away from per-path
     types towards shared data value types.
   - The only normative naming rules from term texts are the Simplified
     Formats node id rules.
   - No prior work covers mutations, choices or slots, so there is little to
     align with beyond those naming rules.

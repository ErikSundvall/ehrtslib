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
- **A node can be addressed in three ways**, all through one `NodeAddress`
  input that has exactly one of:
  - `uid`: the instance uid;
  - `codePath`: an ADL2 path with id-codes, or with at-codes for ADL 1.4
    style callers (mapped with the existing id-code to at-code mapping);
  - `namePath` plus optional `lang`: a path of node names taken from the
    bound operational template's terminology in that language.
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
- **Repeated instances** are picked with a 0-based index step (`event:1` for
  the second event, as in FLAT paths) or by uid. The result of resolving an
  address is always a list of uids.
- **Address resolution lives in the core**, as a plain function from `uid`,
  code path or name path to uids. It is useful without GraphQL, and the
  add-on only wraps it.
- **Ambiguity is never guessed in a mutation.** A query may return several
  matches. A mutation whose address matches more than one node, or none,
  fails with a structured error that lists the candidates (uid, code path and
  name path in the requested language).
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
  its uid, code path and name path, so a caller can move between the three
  ways of addressing.

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
2. **Name-path syntax:** `/`-separated names as above, a list of steps in
   the input type, or both.
3. **Lifecycle verbs:** should `validate`, `discard` and `commit` be
   GraphQL mutations, or stay in the TypeScript API only?
4. **Subscriptions:** should live changes (for example from other replicas
   in the multi-user flavour) be offered as GraphQL subscriptions, and in
   which phase?
5. **Prior work:** how much to align with earlier openEHR community
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

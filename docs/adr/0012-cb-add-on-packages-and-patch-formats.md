# Contribution Builder: add-on packages and patch formats

Status: proposed (draft for review, open questions below). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).
Builds on [ADR 0011](0011-cb-optional-graphql-api.md).

## Context

Apps want to create and change Contribution Builder content in the format they already use:
GraphQL, the Simplified Formats (FLAT and STRUCTURED JSON), canonical XML,
or server-rendered HTML. Most users need only one of these, so bundling all
of them would bloat every app.

The core already has what the add-ons need: canonical JSON and XML
serialisers (`serialization/json`, `serialization/xml`), FLAT and
STRUCTURED serialisers and deserialisers (`serialization/simplified`), and
the address resolver from ADR 0011.

## Decision

- **The core stays small. Each access style is a separate add-on package**
  with its own entry point and GitHub Release asset, not exported from
  `mod.ts` and not in the main bundles:

  | Package | Release asset (example) | Status |
  | --- | --- | --- |
  | GraphQL | `ehrtslib-<version>-cb-graphql.min.js` | planned (ADR 0011) |
  | Simplified Formats (FLAT and STRUCTURED) | `ehrtslib-<version>-cb-simplified.min.js` | planned |
  | Canonical XML | `ehrtslib-<version>-cb-xml.min.js` | planned |
  | htmx | `ehrtslib-<version>-cb-htmx.min.js` | future |

  Each add-on imports the core rather than bundling a copy of it.
- **Every add-on translates its input into ordinary operations** in the log
  and targets uids ([ADR 0004](0004-cb-operation-log-and-sync.md)). No
  add-on keeps state of its own, so replay, attribution, validation and
  conflict handling are the same whichever add-on made the change.
- **Simplified Formats package (FLAT and STRUCTURED JSON):**
  - Create a draft from a FLAT or STRUCTURED document, and read any draft
    or subtree back in either format.
  - Patch FLAT with a partial key map: present keys are set, and a key with
    value `null` removes that value or instance.
  - Patch STRUCTURED with JSON Merge Patch (RFC 7386), which matches its
    nested shape.
  - Keys follow the Web Template ids for the bound template and the
    request's `lang` (the primary language by default, ehrtslib#160).
- **Canonical XML package:**
  - Create a draft from canonical XML (the openEHR XML schemas), and
    serialise drafts and subtrees back to canonical XML.
  - Patch with the XML Patch framework (RFC 5261: `add`, `replace`,
    `remove`), whose selectors are XPath 1.0. openEHR archetype paths map
    to XPath predicates on `archetype_node_id` and `name`, and uids map to
    predicates on `uid/value`.
  - Created and patched documents can also be checked against the ITS-XML
    XSDs, in addition to the Contribution Builder's own template validation.
  - This is a separate format, not GraphQL. Selectors resolve through the
    same core resolver as ADR 0011 addresses.
- **htmx package (future):** server-side helpers for HTML forms driven by
  htmx. Form controls carry the node uid or step path. An `hx-post` or
  `hx-patch` becomes operations, and the response is the updated HTML
  fragment with that node's validation messages. This fits the planned CDR
  proxy and simple server-rendered apps without a JavaScript framework.

## Consequences

- Apps load only the add-on they use.
- All add-ons share one log, one resolver and one validation path, so they
  can be mixed in one build. For example, a form engine posts FLAT while an
  AI agent uses GraphQL.
- Each add-on needs a bundle target in the release workflow and an asset
  row in the release docs.
- Patch formats with removal (`null` in FLAT and Merge Patch, `remove` in
  XML Patch) become `remove-instance` operations, so they are recorded and
  replayable like any other removal.

## Alternatives considered

- **One big Contribution Builder bundle with every format.** Rejected: bloat for most users.
- **JSON Patch (RFC 6902) for STRUCTURED.** Possible, but its array-index
  paths are fragile under concurrent edits. Merge Patch with Web Template
  keys fits better. JSON Patch can be added later if asked for.
- **XQuery Update Facility or XSLT for XML.** More powerful, but heavy to
  implement in the browser. RFC 5261 is small and declarative. XUpdate is
  no longer maintained.

## Open questions

1. **FLAT removal semantics:** does `null` on a key remove only the value,
   or the whole instance when the key addresses a node?
2. **Merge Patch and repeated instances:** RFC 7386 replaces arrays as a
   whole. Should STRUCTURED arrays instead be merged by index or uid?
3. **XML selector restrictions:** should the XML package accept full XPath
   1.0, or only the subset that maps one-to-one onto archetype paths and
   uids?
4. **htmx scope:** only server-side helpers, or also a small client-side
   extension, and should it be tied to the CDR proxy? Proposed answer in
   [ADR 0014](0014-cb-htmx-add-on-and-editable-zipehr-html5.md).

# Contribution Builder: htmx add-on and editable ZipEHR HTML5 (`zipehr.html5-hx`)

Status: proposed (design only, open questions below). Part of the
[Contribution Builder design](../maintainers/contribution-builder-design.md).
Builds on [ADR 0011](0011-cb-optional-graphql-api.md) (node addresses) and
[ADR 0012](0012-cb-add-on-packages-and-patch-formats.md) (add-on packages,
where htmx is listed as a future add-on).

## Context

Simple server-rendered apps, the planned CDR proxy and offline browser apps
want an editable form over Contribution Builder content without a JavaScript
framework.
htmx fits: controls carry `hx-*` attributes, the browser sends ordinary form
data, and the answer is an HTML fragment that replaces part of the page.

What already exists:

- **ZipEHR HTML5** (`zipehr.html5.short|full|emoji`, see
  [`oehr_html5_v1.md`](../../serialization/zipehr/oehr_html5_v1.md)):
  `o-*` custom elements for RM instances. Names and values are element
  text, so a bare document reads well without CSS; codes and ids are
  attributes. The spec already names "optional upgrade to web components
  for in-browser edit → contribution builder" as a goal.
  `LOCATABLE.uid` is written as a child id element, for example
  `<o-hx title="…::a.7"></o-hx>` (short) or `<o-hier-object-id>` (full).
- **ZipEHR OPT HTML5** (`opt.html5.*`,
  [`opt_html5_v1.md`](../../serialization/zipehr/opt_html5_v1.md)): `a-*`
  elements for operational templates, with `data-opt-field`,
  `data-opt-optional` and `data-opt-choices`, and a client-side
  `hydrateOptHtml5` whose `onChange` callback is marked "for future
  contribution builder".
- **ZipEHR XHTML** (`zipehr.xhtml`): FHIR `Narrative.div`-safe. Narrative
  forbids scripts and forms, so it is not a base for editing.
- **Contribution Builder core** (`contribution_builder/`): the operation log with
  `set-value` (target short key plus an attribute path such as
  `value/magnitude`), `add-instance`, `remove-instance` and `set-composer`;
  uids `<versioned-object-uuid>::<replica>.<n>`
  ([ADR 0003](0003-cb-identity-and-uids.md)); `open-version` gives short
  keys to loaded nodes without a uid.
- **Multi-user:** ehrtslib uses Automerge 3 for its multi-user flavour
  (CRDT spike in PR #207). Other implementations, also in other languages,
  may use another CRDT or operational transformation.
- **htmx:** 2.x is the npm `latest`; 4.0 was released on 2026-08-28 and is
  `next` until early 2027. htmx 4 makes attribute inheritance explicit,
  replaces `selfRequestsOnly` with `htmx.config.mode` (default
  `same-origin`), removes `allowEval`, and adds an `hx-csp` extension.

## Decision

### Package

- **An optional add-on**, entry point `ehrtslib/contribution-builder/htmx`,
  release asset `ehrtslib-<version>-cb-htmx.min.js`, as ADR 0012 lists.
  Not exported from `mod.ts`, not in the main bundles; it imports the core
  and the ZipEHR HTML5 serialiser instead of bundling copies.
- **It does not ship htmx.** The host page loads a pinned htmx file with
  Subresource Integrity. The add-on contains:
  - a **renderer**: `renderEditable(build, draftId, options)` gives a
    `zipehr.html5-hx` document, and `renderNodes(build, draftId, keys,
    options)` gives fragments for changed nodes;
  - a **request handler**: `handleCbRequest(build, request, context)`
    takes a Fetch API `Request` and returns a `Response`;
  - `stripControls(html)`, which turns an `html5-hx` document into the
    plain `zipehr.html5` document of the same dialect.
- This answers ADR 0012 question 4: server-side helpers, plus, in a later
  phase if needed, a small client-side htmx extension. The add-on is not
  tied to the CDR proxy.

### The `zipehr.html5-hx` variant

- **A control layer over two existing HTML5 dialects**, not a new tag
  set. Only these two dialect settings get an editable variant, so the
  number of combinations stays small:

  | Variant id | Dialect settings | Format URI | `fmt` |
  | --- | --- | --- | --- |
  | `zipehr.html5-hx.full` | `o-` RM kebab tags, linesaving (hybrid) layout, RM property names as attributes | `http://purl.org/ehrtslib/zipehr/html5-hx/full/v1` | `hf1` |
  | `zipehr.html5-hx.short` | `o-` letter tags, oneliner (compact) layout, RM property names omitted when possible | `http://purl.org/ehrtslib/zipehr/html5-hx/short/v1` | `hs1` |

  Each variant is rendered in one of two render profiles (see [Render
  profiles](#render-profiles)), which gives a 2×2 matrix of editable
  documents. Other `zipehr.html5` settings (emoji symbols, other layouts)
  stay read-only.

- **Projection rule.** Removing the control layer gives a valid
  `zipehr.html5` v1 document of the same dialect with the same canonical
  JSON. The control layer is:
  - attributes named `hx-*` or `data-cb-*` on `o-*` elements;
  - `<cb-ctl>` elements and everything inside them. Native controls
    (`form`, `input`, `select`, `option`, `textarea`, `button`, `label`,
    `output`) and validation messages (`<cb-msg>`) appear only inside
    `<cb-ctl>`, so their text is never read as an RM name or value.
- **Every editable `LOCATABLE` carries `data-cb-uid`** with its short key.
  The root carries `data-cb-build`, `data-cb-draft`, `data-cb-api="1"` and
  `data-cb-rev` (the log position the page was rendered from). The RM
  `uid` itself stays where `zipehr.html5` puts it.
- **The variant is a view, not an exchange format.** It is rendered for
  one session by whoever holds the build. Stored, exchanged and committed
  content is canonical RM (or any other ZipEHR variant) plus the
  operation log. `detectInputFormat` and `zipehrHtml5ToCanonical` accept
  `html5-hx` input by stripping the control layer first.

Example (short dialect, excerpt):

```html
<o-ob fmt="hs1" n="openEHR-EHR-OBSERVATION.body_weight.v2" a lang="en"
      data-cb-api="1" data-cb-build="b1" data-cb-draft="d1" data-cb-rev="42"
      data-cb-uid="a.3">Body weight<o-hi><o-pe n="at0003" data-cb-uid="a.4">
  <o-tr n="at0001" data-cb-uid="a.5">
    <o-e n="at0004" data-cb-uid="a.7">Weight<o-hx title="8a5c…::a.7"></o-hx>
      <o-q><mag>85</mag><unit>kg</unit></o-q>
      <cb-ctl>
        <form method="post" action="/cb/v1/drafts/d1/nodes/a.7"
              hx-post="/cb/v1/drafts/d1/nodes/a.7" hx-trigger="change"
              hx-target="closest o-e" hx-swap="outerHTML">
          <input type="hidden" name="op" value="set-value">
          <input type="hidden" name="path" value="value/magnitude">
          <input type="hidden" name="rev" value="42">
          <input type="hidden" name="cb-token" value="…">
          <label>Weight <input type="number" name="value" value="85" step="any"></label> kg
        </form>
        <cb-msg role="status" aria-live="polite"></cb-msg>
      </cb-ctl>
    </o-e>
  …
```

### Request contract (control layer v1)

- **All changes are `POST` form posts** to
  `<base>/drafts/{draftId}/nodes/{key}` with an `op` field, so an htmx
  request and a plain HTML form post without JavaScript are the same
  request. `base` is a renderer option.

  | `op` | Fields | Operation |
  | --- | --- | --- |
  | `set-value` | `path`, `value` (or typed parts such as `magnitude`, `units`), optional `rmType` for `DV_*` choices | `set-value` |
  | `add-instance` | `attribute`, `node` (template code step), optional `before` / `after` sibling key | `add-instance` with a skeleton from the bound template |
  | `remove-instance` | — | `remove-instance` |
  | `set-composer` | party fields | `set-composer` |

  A `GET` on the same path returns the node fragment. Lifecycle verbs
  (`validate`, `discard`, `commit`) follow ADR 0011 question 4.
- **Addresses.** The key in the URL is a short key. Instead of it, a form
  may send an `address` field with an ADR 0011 `NodeAddress` in its string
  form (`$systolic`, `@a.id=systolic`, `Blood pressure/Systolic`,
  `[id5]:1`). Hand-written HTML forms can then target template annotations
  without knowing uids. Resolution uses the core resolver. An ambiguous or
  empty address is never guessed in a change; the answer lists the
  candidates, as in ADR 0011.
- **The author comes from the host's request context**, never from form
  fields. Every request becomes ordinary operations in the log; the add-on
  keeps no state of its own.
- **Answers.** An `HX-Request` header gets the re-rendered fragment of the
  changed node, plus out-of-band fragments for other nodes whose
  validation result changed. A plain form post gets the whole document (or
  a redirect to it). Errors the user can fix (a bad number, a stale `rev`)
  return `200` with the fragment and messages, so swapping works with the
  defaults of both htmx majors. Protocol errors (unknown op, bad token)
  return `4xx`.
- **Concurrency is sync-technology neutral.** `rev` is an opaque log
  position. If the node changed since `rev`, the handler applies or
  rejects the change by the build's own policy and returns the current
  node with a note. ehrtslib's multi-user flavour uses Automerge 3 behind
  the same handler; nothing in the variant or the request contract refers
  to Automerge, so another implementation can serve the same contract with
  another CRDT or operational transformation.
- **htmx attribute subset.** The renderer emits only `hx-get`, `hx-post`,
  `hx-trigger`, `hx-target`, `hx-swap` and `hx-include`, set on each
  control rather than inherited (explicit in htmx 4). It emits no `hx-on`,
  no event filters and no `js:` values, so no eval is needed. The add-on
  is tested against the htmx 2.x and 4.x lines.

### Who answers the requests

`handleCbRequest` uses only `Request` and `Response`, so the same code runs:

- **in a service worker** in the same origin (offline, build stored through
  the ADR 0005 storage adapter);
- **in a local server** (`Deno.serve`) or an app server;
- **in the planned CDR proxy**, which adds a Contribution Builder to a standard
  CDR.

Requests are same-origin by default (htmx 2 `selfRequestsOnly`, htmx 4
`mode: "same-origin"`).

### Render profiles

The root element records the profile as `data-cb-profile`. Both editable
profiles post to the same endpoints and strip to the same `zipehr.html5`
document, so the server side does not depend on the profile.

| | `forms` (no JavaScript) | `htmx` |
| --- | --- | --- |
| `zipehr.html5-hx.full` | 1 | 2 |
| `zipehr.html5-hx.short` | 3 | 4 |

- **`forms`:** plain `<form method="post">` controls and `<cb-ctl>`
  markers, with no `hx-*` attributes. Every change is a full-page post.
  Works with a strict CSP and without any script. This is the
  implementation-neutral baseline.
- **`htmx`:** the page loads the pinned htmx library and the renderer adds
  `hx-*` attributes for partial updates. The form underneath stays, so the
  page falls back to `forms` by itself when htmx does not load. Optional
  htmx features (`hx-select`, `hx-indicator`, `hx-sync`, the SSE and
  WebSocket extensions for live updates) are allowed here, within the
  rules in [Security](#security).
- **Host extensions stay outside the document.** A host app that wants
  more scripting adds its own scripts and htmx attributes in its page
  shell. The Contribution Builder renderer itself never emits script.
- **Read-only:** a viewer that ignores `cb-ctl` (CSS
  `cb-ctl { display: none }`, shipped as a read-only stylesheet next to the
  existing `zipehr-html5-*.css`) shows the plain clinical document;
  `stripControls` gives a storable `zipehr.html5` file.

#### `basic` output for old browsers (render-only)

An optional fifth output for old phones and browsers. It is rendered
from the same build as variant 3 (short, `forms`), but it is **not a
ZipEHR variant**: it has no `o-*` tags, so it is never stored, exchanged
or parsed as `zipehr.html5`. Only the 2×2 variants are editable ZipEHR
documents.

- **Markup:** `<div>`/`<span>` with `class` and `data-cb-*` attributes,
  one column with labels above fields, and one form per section instead of
  per field, so a slow connection makes fewer round trips.
- **CSS:** inlined, simple block layout; no grid, custom properties or
  newer selectors. Newer input types (`date`, `number`) are allowed because
  old browsers fall back to a text box. A build step may use CSS inlining
  and downlevelling tools (for example Juice and postcss-preset-env with a
  Browserslist target) instead of hand-written CSS.
- **Sessions as in the other profiles:** the same sign-in, token check and
  author binding apply; nothing is sent outside the web session.
- **Test targets:** an old Android WebView and Opera Mini. Old devices may
  also fail on HTTPS (outdated root certificates or no TLS 1.2); that is a
  hosting concern, not one the markup can solve.
- **Not by email.** Forms are not sent as email: patient data in email is
  seldom allowed in healthcare.

### Security

- **No script in the format.** In every profile the renderer never emits
  `<script>`, inline event handlers, `hx-on`, `hx-vals` with `js:`
  expressions or `javascript:` URLs. Recommended CSP:
  `script-src 'self'` (the pinned htmx with SRI), `connect-src 'self'`, no
  `unsafe-inline` or `unsafe-eval`; htmx 4's `hx-csp` extension or htmx 2
  `allowEval: false` and `allowScriptTags: false`.
- **Data never becomes markup.** RM values, template terms and annotation
  values are escaped as text; no data value becomes an attribute name or a
  URL.
- **Received `html5-hx` documents are untrusted.** Injected `hx-*`
  attributes could send requests elsewhere, so a client never swaps in a
  foreign `html5-hx` document. It strips the controls and re-renders from
  its own build.
- **Requests are checked.** The handler requires a per-session token
  (`cb-token` field or header, checked by a host callback) on every change,
  checks that the key belongs to the draft, and parses values with the
  core `DV_*` parsers before any operation is made.
- **Templates come from the binding.** Form posts cannot change the
  template binding ([ADR 0007](0007-cb-template-binding.md)); `add-instance`
  is accepted only for nodes the bound template allows.

### Validation feedback

After each operation the core runs the quick check
([ADR 0008](0008-cb-validation-and-lifecycle.md)). Problems for a node are
rendered in its `<cb-msg>` with `aria-invalid` on the control. The draft's
mode (complete or incomplete) decides which problems block a commit, not
which edits are accepted.

### Languages

- Labels come from the bound template's terms in the request `lang`, with
  the fallback of the ehrtslib language design (ehrtslib#160). Data names
  stay as recorded. The document root carries `lang`.
- Control texts (Add, Remove, messages) come from a small catalogue in the
  add-on that the host can override.
- Inputs use native types (`number`, `date`, `datetime-local`) so the wire
  value is locale-neutral and the browser localises the display.

### Relationship to other add-ons and formats

- **GraphQL (ADR 0011):** sibling add-on over the same resolver, log and
  validation. htmx returns HTML and GraphQL returns JSON; neither depends
  on the other, and both can change the same build.
- **OPT HTML5:** stays the template viewer. A later phase can make
  `hydrateOptHtml5`'s `onChange` post to the same request contract.
- **ZipEHR XHTML:** unchanged; FHIR narrative stays script- and form-free.

### Versioning

- `zipehr.html5` v1 is unchanged. `zipehr.html5-hx` v1 is
  `zipehr.html5` v1 plus control layer v1. A new version of either gives a
  new `html5-hx` version.
- A reader that only knows `zipehr.html5` sees an unknown `fmt` and rejects
  the document instead of misreading it.
- `data-cb-api` versions the request contract separately from the markup.

## Consequences

- Server-rendered and offline apps get Contribution Builder editing with no
  framework and little JavaScript.
- Every change is an ordinary operation, so replay, attribution, conflicts
  and multi-user sync are the same as for the other add-ons.
- The projection rule keeps one HTML5 parser for both variants and makes
  the hx variant safe to downgrade.
- One more bundle target in the release workflow and one more asset row in
  the release docs; one more stylesheet.
- htmx is a host dependency with its own release cycle (2.x and 4.x now).

## Alternatives considered

- **Put `hx-*` attributes into `zipehr.html5` v1 itself.** Rejected:
  stored documents would become active, and old readers could not tell
  views from data.
- **Build on ZipEHR XHTML.** Rejected: FHIR narrative forbids forms and
  scripts.
- **Extend `hydrateOptHtml5` into the Contribution Builder form.** Rejected as the main path:
  it edits an empty template on the client, while a build needs instance
  data, uids and a server-side log. It is kept as a later bridge.
- **Web components or a JSON API with a client framework.** Possible, and
  GraphQL already serves JSON clients; htmx serves apps that want HTML over
  the wire.
- **Separate `PATCH` and `DELETE` routes as the main contract.** Rejected:
  plain HTML forms only send `GET` and `POST`, which would break the no-JS
  fallback. The handler may accept them as aliases.

## Open questions

1. **Name:** `zipehr.html5-hx` with `fmt` `hs1`/`hf1`, or another
   name such as `zipehr.html5-cb`?
2. **Control placement:** controls always shown, or a `focus` mode as in
   `hydrateOptHtml5`, where an editor appears only for the focused field?
3. **Absent optional nodes:** only "Add" buttons that ask the server for a
   skeleton, or `<template>` skeletons rendered from the OPT up front?
4. **Swap granularity:** node, entry or whole draft when rules
   (`am.rule`, ADL2 rules) change other nodes?
5. **`data-cb-uid` value:** short key only (smaller), or the full uid?
6. **Live updates from other users:** offer an SSE or WebSocket stream of
   changed fragments (htmx `hx-sse`/`hx-ws`, `htmx` profile only), and in
   which phase? The
   stream would carry fragments only, never sync-library messages.
7. **`DV_*` choices and slots:** how to render a choice of data value types
   and archetype slots as controls.
8. **UI hints:** which template annotations (for example
   `a.hide_on_form`) the renderer honours in v1.
9. **htmx major:** test against both 2.x and 4.x, or target 4.x only once
   it becomes `latest`?
10. **Token check:** does the add-on own CSRF checks, or only call a host
    callback?

## Implementation plan (future, tracer bullets)

Each step is small enough for one PR and ends with tests.

1. **Format only:** `cb-ctl`/`hx-*`/`data-cb-*` skipping in the HTML5
   deserialiser, `stripControls`, `detectInputFormat` entries; tests that
   the projection rule holds for the existing HTML5 fixtures.
2. **One editable value end to end:** `renderEditable` for `DV_QUANTITY`
   and `DV_TEXT`, `handleCbRequest` for `set-value`, tested in Deno with
   `Request` objects and no browser.
3. **Structure and feedback:** `add-instance`, `remove-instance`, `rev`
   handling, `<cb-msg>` validation messages and out-of-band fragments.
4. **Hosts:** a service-worker example in the demo app, and the `forms`
   profile checked in a browser test next to the `htmx` profile with htmx 2
   and 4.
5. **Release:** bundle target and asset row (needs a release-workflow
   change by the maintainer).
6. **`basic` output:** the old-browser rendering with inlined CSS.
7. **Later:** `address` fields with ADR 0011 paths, lifecycle verbs, live
   updates (question 6), and the `hydrateOptHtml5` bridge.

# FLAT/STRUCTURED input and output flavours, and `ctx` defaults

> **2026-10-30. Status: research note, not normative; may be outdated.** Follow-up work: [#239](https://github.com/ErikSundvall/ehrtslib/issues/239).

This note compares how platforms treat the openEHR Simplified Formats (FLAT and STRUCTURED) on the way in and on the way out. It also lists what the specification leaves open. ehrtslib is used as a frontend for, and a converter between, several platforms, so it needs to read and write both flavours.

Sources:
- the [Simplified Formats specification](https://specifications.openehr.org/releases/ITS-REST/latest/simplified_formats.html) (ITS-REST 1.1.0, with amendment 1.1.1), cited by section number;
- public platform documentation and source code;
- conformance-style tests against EHRbase 2.36.0 and FerroEHR 5.5.0.

## Main points

- **Two flavours exist in practice.**
  - *Input* is minimal: it uses `ctx/` shortcuts, and the receiver fills in defaults.
  - *Output* is what a server returns after applying those defaults. It has every value at its own path, such as entry language and encoding, event time, history origin, context start time and setting.
- **The REST API names both flavours, but the Simplified Formats spec doesn't say how they differ.** The template example resource has `type=input|output` ([SPECITS-58](https://openehr.atlassian.net/browse/SPECITS-58)).
- **Platforms read the spec differently.** For the same input, one tested server returned no `ctx/` keys and every value at its path. The other kept `ctx/` keys in its output and left out entry-level values. Both readings comply with the current text, so one server's "output" can be rejected as the other's input.
- **ehrtslib (v0.8):**
  - The FLAT serializer writes context-like values only as `ctx/` keys.
  - The deserializer fills almost none of the RM-mandatory fields back in.
  - Unknown keys are dropped silently.
  - As a result, a FLAT round trip loses RM-mandatory fields. [#239](https://github.com/ErikSundvall/ehrtslib/issues/239) proposes supporting both flavours.

## 1. Platform behaviour

### Template example resources
- **Better:** the template example endpoint takes `exampleFilter=INPUT|OUTPUT`. Andraž Koželj (Better), [Discourse t/1720](https://discourse.openehr.org/t/understanding-flat-composition-json/1720) (2021): *"'INPUT' … prepares a WebTemplate formatted composition ready to be stored in the CDR. If you used the 'OUTPUT' value, you'd get the example WebTemplate composition as if it were read from the CDR. The field prefixed with 'ctx/' are just Better EHR Server shortcuts for some RM fields."*
- **openEHR REST API 1.1.0:** `GET /definition/template/adl1.4/{template_id}/example` has `type=input|output` (default `input`): *"either of type `input` (i.e., ready to be submitted to the repository) or `output` (as it would appear when retrieved from the repository)"* ([SPECITS-58](https://openehr.atlassian.net/browse/SPECITS-58)). The difference between the two is not defined anywhere.

### Using output as input
- Ian McNicoll, [Discourse t/905](https://discourse.openehr.org/t/simplified-data-template-sdt-behavior/905) (2020), on Better's OUTPUT format: *"does not use the ctx construct and is essentially what comes back out again after the ctx defaults are applied - so things like entry-level language, observation.origin are explicit. You can also send these as an input format … devs have to get used to the OUTPUT format, in order to do PUTS."*
- In the same thread, Birger Haarbrandt notes that `ctx/origin` is set from `ctx/time` and the composer possibly from the session. He asks for these rules to be specified.

### Library implementations (open source)
- **[better-care/web-template](https://github.com/better-care/web-template)** has no flavour flag, but behaves this way:
  - The Web Template builder adds RM-mandatory attributes that the template does not constrain (time, language, encoding, subject, setting, category, …) as `inContext: true` nodes.
  - FLAT→RM fills them from a conversion context, whose time defaults to `now()`.
  - RM→FLAT writes them at their own paths and never writes `ctx/`. It leaves out a plain `PARTY_SELF` subject and a name equal to the template name.
- **[ehrbase/openEHR_SDK](https://github.com/ehrbase/openEHR_SDK)**:
  - The FLAT unmarshaller builds a full skeleton from the Web Template, so names and node ids come from the template.
  - It defaults language to the template language, time to `now()` and setting to "other care", and then applies the `ctx/` defaults.
  - Unconsumed non-`ctx` keys are an error.
  - The marshaller writes resolved values and no `ctx/`.
  - The EHRbase docs describe `ctx/` only as input defaults ([Context](https://docs.ehrbase.org/docs/EHRbase/Explore/Simplified-data-template/Context)).

### Server tests (2026-10-30)
Template `ehrbase_blood_pressure_simple.de.v0`. Input: 4 `ctx/` keys (language, territory, composer name, time) plus 3 data keys (systolic magnitude and unit, position code).

| | EHRbase 2.36.0 | FerroEHR 5.5.0 |
|---|---|---|
| POST response / GET as FLAT | 23 keys, **no `ctx/`**. Category, context start_time and setting (defaulted to 238 "other care"), event time, entry language and encoding, composition language, territory and composer are all at their paths. A `PARTY_SELF` subject is left out. | **Keeps `ctx/`** language, territory, composer_name, time and setting, plus data and `history_origin`. Leaves out entry language and encoding and event time. |
| Re-submit own output | accepted, identical result apart from `_uid` | accepted |
| Submit the other server's output | not tested | rejected (422, unknown path for the event `time`; the two servers build different Web Templates for this OPT); accepted once that key was removed |
| No `ctx/time` | server `now()`, UTC | server `now()`, UTC |
| Unknown key | 400 | 422 |

## 2. Specification: what is open

Section numbers are from the published [Simplified Formats](https://specifications.openehr.org/releases/ITS-REST/latest/simplified_formats.html) page.

1. **Flavours are not defined.** The REST API names `input` and `output`, but the Simplified Formats spec only describes `ctx/` as input help (§6 intro: *"To simplify the input, the flat formate offers the option to set context values which set default values in the rm-tree"*). Nothing says what a response contains, or that a response must be accepted as input. §2.2 Scope lists "Serialization and deserialization requirements", but there is no such section.
2. **"Input" and "output" are used without being defined.** Examples: §5.32 DV_IDENTIFIER, *"For the input |id might be left out"*, although the same row says Required "Yes"; §5.34 DV_PROPORTION magnitude, *"calculated on output"*; §5.43 DV_INTERVAL, *"defaults to false. only in output if true"*. The two §5.1 COMPOSITION examples are both output style (no `ctx/`, explicit `language`, `encoding`, event `time`, `context/setting`). The second is a fuller example, not an input/output pair.
3. **"Mandatory ctx" doesn't fit output.** §4.3 says language and territory are mandatory context, and §4.8 says to validate that they are present. Output-style examples carry them at their paths and have no `ctx/`. The requirement could read "given by `ctx/` or at their paths".
4. **The HISTORY.origin rule contradicts itself.** §5.6: origin *"will be set to the time of the earliest event if not explicitly set"*. §6.7/§6.9: `ctx/time` sets origin, and *"EVENT.time will be set to history.origin"*.
5. **Defaults are only partly listed.**
   - Specified: subject (`PARTY_SELF`), setting (other care), `ctx/time` → `now()`, and `ctx/language` → ENTRY and COMPOSITION language.
   - Not specified: LOCATABLE name, archetype_node_id and archetype_details from the template; ENTRY.encoding (no `/encoding` row, yet every example has UTF-8); category from the template; composer from the session.
6. **There are no omission rules for output**, except the DV_INTERVAL booleans.
7. **There is no precedence rule** for when `ctx/X` and the explicit path are both given, or for whether they may be mixed. Implementations differ on whether `…/context/start_time` feeds the same derived defaults as `ctx/time`.
8. **`now()` is underspecified:** whose clock, which timezone or offset, and what applies to a client-side converter without a server.
9. **Computed fields are not marked.** EVENT `offset` has no mapping row, and one server rejects it on input. DV_PROPORTION magnitude has an empty Flat Path cell.
10. **The root segment is not tied to anything.** §4.2.2 shows `composition_id/…`, and §4.4.1 says paths are *"fully qualified from the data instance root"*. Nothing ties this to the Web Template `tree.id` or to a normalised template id. For the template above, EHRbase uses `tree.id` = `encounter_training_sample`, while ehrtslib v0.8 uses the template id. `inContext` appears in §4.1 but is not defined. A separate source of difference is Web Template generation: an `event_context` segment seen in 2023 ([Discourse t/3819](https://discourse.openehr.org/t/the-good-the-bad-and-the-wat-of-current-simplified-flat-simsdt-openehr-exchange-format/3819)) came from Archetype Designer adding a node id to EVENT_CONTEXT. It was not a feature of an output format.
11. **There is no rule for unknown keys.** Both tested servers reject them, with different status codes.

## 3. Consequences for ehrtslib (v0.8)

- **Serializer:** `FlatSerializer` writes every `inContext` node as `ctx/<id>`, read from the composition root. Entry-level and event-level time, language, encoding and subject therefore collapse into `ctx/*` or are lost.
- **Deserializer:** FLAT→RM post-processing handles ISM_TRANSITION and coded text only. It does not fill name, archetype_node_id, ENTRY subject, language or encoding, HISTORY.origin, EVENT.time, or context setting and start time.
- **Web Template builder:** for the template above, ehrtslib's Web Template has no nodes for `context/start_time`, `context/setting`, entry `language`/`encoding`/`subject` or event `time`. The serializer has nowhere to write those fields.
- **Unknown keys:** they are dropped without an issue. EHRbase output with its own root segment deserialized to an empty composition with 0 issues.
- **Effect:** a template example that validates with 0 messages as canonical JSON gave 28 messages after `serializeToFlat` → `deserializeFromFlatWithIssues`.

### Direction (details in #239)
- **Serializer:** `flavor: "output" | "input"`, default `"output"`. Output writes every value at its node path, with no `ctx/`. Input keeps `ctx/` shortcuts.
- **Deserializer:**
  - Always accepts both flavours.
  - Fills RM-mandatory fields in the order explicit path, then `ctx/`, then template or RM default.
  - New options: `contextDefaults`, `clock` (or `null` to not invent times) and `unknownKeys`.
- **Prerequisite:** the Web Template builder emits RM-mandatory attributes as `inContext` nodes at their own paths, as other implementations do.
- **Changelog:** the default serializer output changes, so it needs a CHANGELOG entry.

Spec clarification of the points in section 2 is being taken up separately with the openEHR specification editors.

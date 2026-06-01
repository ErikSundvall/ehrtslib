---
name: openehr-assistant
description: >
  This skill should be used when the user mentions openEHR concepts (archetypes, templates,
  AQL, ADL, CKM, RM types, compositions, OPT, terminology bindings, clinical modeling) outside
  of a specific command context. Provides general openEHR awareness, clinical modeling guidance,
  and routes to appropriate tools and commands.
user-invocable: false
allowed-tools:
  - mcp__openehr-assistant__ckm_archetype_search
  - mcp__openehr-assistant__ckm_archetype_get
  - mcp__openehr-assistant__ckm_template_search
  - mcp__openehr-assistant__ckm_template_get
  - mcp__openehr-assistant__guide_search
  - mcp__openehr-assistant__guide_get
  - mcp__openehr-assistant__guide_adl_idiom_lookup
  - mcp__openehr-assistant__type_specification_search
  - mcp__openehr-assistant__type_specification_get
  - mcp__openehr-assistant__terminology_resolve
  - mcp__openehr-assistant__examples_search
  - mcp__openehr-assistant__examples_get
---

# openEHR Assistant

An openEHR-aware assistant and clinical modeling specialist. When a conversation touches openEHR topics, proactively use MCP tools to provide accurate, specification-grounded answers. For clinical modeling tasks, guide the full workflow from archetype selection through template design and model review.

- Prefer official openEHR specs/guides and MCP resources over assumptions.
- Provide structured, scannable answers; separate facts from assumptions; call out uncertainty explicitly.

## Domain Context

openEHR is a vendor-neutral open standard for electronic health records. Key concepts:
- **Archetypes**: Reusable clinical content definitions in ADL format
- **Templates**: Use-case-specific constraint sets combining archetypes (OET/OPT)
- **Compositions**: Runtime clinical data instances conforming to templates
- **Reference Model (RM)**: Core data types and structures (COMPOSITION, OBSERVATION, EVALUATION, INSTRUCTION, ACTION, CLUSTER, ELEMENT, etc.)
- **AQL**: Archetype Query Language for querying clinical data repositories
- **CKM**: Clinical Knowledge Manager, the international archetype/template registry
- **EHR Structure**: Composition categories (event/persistent/episodic), Entry types, ISM state machine, versioning (VERSIONED_OBJECT, CONTRIBUTION), time semantics
- **Demographic Model**: PARTY hierarchy (PERSON, ORGANISATION, GROUP, AGENT, ROLE), identities, relationships, EHR/demographic separation
- **Platform Services**: Abstract service interfaces (Definitions, EHR, Demographic, Query, Admin), version update semantics, deployment architecture

## Quick Reference

For a compact offline summary of core principles, design rules, anti-patterns, RM entry types, CGEM framework, and the full canonical guide URI index, see [reference/openehr-quick-reference.md](reference/openehr-quick-reference.md).

## Guide-First Principle

Before answering any openEHR question or starting modeling work, search and load relevant guides from the MCP server:

1. Use `guide_search` to find relevant guides for the topic
2. Use `guide_get` to load the full guide content
3. Base your answer on the guide content, not on general knowledge

Key guide categories:
- `archetypes/` — archetype design principles, ADL syntax, constraints, anti-patterns
- `templates/` — template design, OET syntax, CGEM framework
- `aql/` — query syntax, patterns, optimization
- `simplified_formats/` — FLAT, STRUCTURED, CANONICAL composition formats
- `specs/` — openEHR specification digests (RM, AM, AM2, BASE, QUERY, TERM, LANG, CDS, SM, ITS-REST); these digests track the `development` branch of the openEHR specifications and replace the legacy `rm/` category
- `howto/` — toolchain how-tos (e.g. `spec-lookup` for efficient external spec retrieval via `llms.txt` and Markdown twin URLs)

## MCP Tool Reference

Use these tools to provide accurate answers:

| Tool | When to Use |
|------|-------------|
| `ckm_archetype_search` | Find existing archetypes in the Clinical Knowledge Manager |
| `ckm_archetype_get` | Retrieve full archetype content (ADL source) |
| `ckm_template_search` | Find existing templates in CKM |
| `ckm_template_get` | Retrieve full template content |
| `guide_search` | Search implementation guides by topic |
| `guide_get` | Load a specific guide by path (including `specs/*` digests and `howto/*` how-tos) |
| `guide_adl_idiom_lookup` | Quick lookup of ADL constraint patterns |
| `type_specification_search` | Search RM/AM/BASE/LANG type specifications (BMM-backed) |
| `type_specification_get` | Get detailed type specification, including class-level attribute/function/invariant tables |
| `terminology_resolve` | Resolve terminology codes, rubrics, and value sets |
| `examples_search` | Find curated worked examples (AQL queries, FLAT/STRUCTURED payloads, reference `.adl` archetypes) |
| `examples_get` | Retrieve a specific example by URI (`openehr://examples/{kind}/{name}` — kinds: `aql`, `flat`, `structured`, `archetypes`) |

The MCP server's own `instructions` carry conditional retrieval policies (Spec-Lookup-First for external spec pages, Digest-First for spec-overview questions, Examples-First for "show me an example" questions). Follow them when they apply; don't reach for these tools unconditionally.

## Clinical Modeling Capabilities

### Template Design

Select appropriate archetypes from CKM and combine them into COMPOSITION structures following the CGEM framework:

| Category | Description | Template Scope |
|----------|-------------|---------------|
| **Global Background** | Persistent patient data (allergies, diagnoses, demographics) | Persistent compositions |
| **Contextual Situation** | Episodic context (reason for encounter, admission details) | Episode-level compositions |
| **Event Assessment** | Point-in-time observations and evaluations | Event compositions |
| **Managed Response** | Orders, plans, actions taken | Action/instruction compositions |

### Archetype Selection

Always search CKM before proposing new archetypes. Reuse is a core openEHR principle.

```
ckm_archetype_search("<concept>")
```

Advise on reuse vs specialization vs new creation based on what CKM offers.

### Constraint Specification

Apply the Narrowing Principle when constraining archetypes within templates:
- **Mandatory stays mandatory**: Cannot make required fields optional
- **Optional can become mandatory**: Set `min=1` on optional fields
- **Optional can be excluded**: Set `max=0` to hide fields
- **Value sets only narrow**: Restrict coded text options, never add new ones
- **Cardinality only narrows**: Reduce max occurrences, never increase beyond archetype definition

### Terminology Binding

Advise on binding to standard terminologies (SNOMED CT, LOINC, ICD-10) with semantic equivalence. Use `terminology_resolve` to validate codes. Ensure bindings represent true semantic equivalence, not approximation.

### Model Review

When reviewing clinical models, verify:
- Correct RM type selection for each entry
- Appropriate archetype reuse from CKM
- Narrowing principle respected in templates
- Terminology bindings are semantically correct
- CGEM framework applied for template scoping
- No anti-patterns present (load `guide_get("archetypes/anti-patterns")`)

Use `type_specification_get` to verify RM type structures. Use `guide_adl_idiom_lookup` for correct ADL constraint patterns.

## Routing to Specialized Workflows

When users need deeper task-specific workflows, suggest the appropriate skill or command:

- **Creating/editing archetypes** -> archetype-authoring skill
- **Creating templates** -> template-authoring skill
- **Building compositions** -> composition-builder skill
- **Writing AQL queries** -> aql-query skill
- **Quick lookups** -> `/archetype-search`, `/template-search`, `/guide`, `/terminology`, `/type-spec`
- **ADL patterns** -> `/adl-idiom`
- **Fixing syntax** -> `/archetype-fix-syntax`
- **Translations** -> `/archetype-translate`
- **Demographic modeling** -> demographic-modeling skill
- **Platform / REST service integration** -> consult `guide_get("specs/sm-openehr_platform")` and `guide_get("specs/its-rest-api")`
- **RM structure lookups** (EHR or demographic domain) -> `/rm-structure`
- **Deep spec research** (precise attribute/function/invariant questions; cross-document reconciliation) -> dispatch the `spec-researcher` agent
- **Curated worked examples** (AQL queries, FLAT/STRUCTURED payloads, reference archetypes) -> `examples_search` / `examples_get` MCP tools; resources at `openehr://examples/{kind}/{name}`

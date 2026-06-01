# ADL 1.4 Syntax Reference

**Purpose:** Offline reference for ADL structure, AOM constraint types, and constraint syntax patterns. Use when writing, editing, or validating archetype (.adl) files locally.

---

## Archetype Sections (required order)

Matches ADL 1.4 archetype structure (see openEHR ADL 1.4 spec, archetype overview figure):

1. **`archetype`** — version line and archetype id
2. **`specialise` / `specialize`** (optional)
3. **`concept`**
4. **`language`**
5. **`description`** (optional)
6. **`definition`** — cADL constraint tree
7. **`invariant`** (optional) — top-level assertions
8. **`ontology`** — term definitions, constraint definitions (`ac` codes), term bindings (external terminology is wired here; not a separate top-level `terminology` section in standard ADL 1.4)
9. **`revision_history`** (optional)

Sections must appear in this order. Every node in the definition must have a corresponding at-code in the ontology.

---

## Archetype ID Format

```
openEHR-EHR-<RM_TYPE>.<concept>.v<MAJOR>
```

Examples:
- `openEHR-EHR-OBSERVATION.blood_pressure.v2`
- `openEHR-EHR-CLUSTER.anatomical_location.v1`
- `openEHR-EHR-EVALUATION.problem_diagnosis.v1`

---

## AOM Constraint Types (AOM 1.4)

| Type | Purpose | Key Properties |
|------|---------|----------------|
| **C_OBJECT** | Abstract base | `rm_type_name`, `occurrences`, `node_id` |
| **C_COMPLEX_OBJECT** | Complex RM type with attributes | Contains C_ATTRIBUTEs |
| **C_PRIMITIVE_OBJECT** | Primitive types (String, Integer, Date, etc.) | Leaf constraint |
| **C_ATTRIBUTE** | Attribute constraint | `rm_attribute_name`, `existence` |
| **C_SINGLE_ATTRIBUTE** | Single-valued attribute | Exactly one child |
| **C_MULTIPLE_ATTRIBUTE** | Container attribute | Has `cardinality` |
| **ARCHETYPE_SLOT** | Placeholder for other archetypes | `include`/`exclude` assertions |
| **ARCHETYPE_INTERNAL_REF** | Reuse constraint within same archetype | `target_path` (ADL: `use_node`) |
| **CONSTRAINT_REF** | Reference to ac-code | External terminology value set |

---

## Existence, Occurrences, Cardinality

### existence (on attributes)
- `existence matches {0..1}` — optional attribute
- `existence matches {1..1}` — mandatory attribute

### occurrences (on object nodes)
- `occurrences matches {0..1}` — optional, at most one
- `occurrences matches {0..*}` — optional, unbounded
- `occurrences matches {1..1}` — mandatory, exactly one
- `occurrences matches {1..*}` — mandatory, at least one

### cardinality (on container attributes only)
- `cardinality matches {0..*; unordered; unique}` — set semantics
- `cardinality matches {1..*; ordered}` — ordered list, at least one

**Critical rule:** Never use cardinality on object nodes or occurrences on container attributes.

---

## Constraint Syntax Patterns

### Attribute constraint (canonical form)
```adl
<rm_attribute_name> matches {
    <constraint>
}
```

All RM attribute names must match the Reference Model exactly. Do not invent or alias attributes.

### Incorrect vs Correct
```adl
-- WRONG: missing matches {*} on type
value matches { DV_TEXT }

-- CORRECT:
value matches { DV_TEXT matches {*} }
```

---

## Data Type Constraints

### DV_TEXT (free text)
```adl
value matches {
    DV_TEXT matches {*}
}
```

### DV_CODED_TEXT (coded value from internal value set)
```adl
value matches {
    DV_CODED_TEXT matches {
        defining_code matches {
            [local::
            at0001,    -- Option A
            at0002,    -- Option B
            at0003]    -- Option C
        }
    }
}
```

### DV_CODED_TEXT (external terminology)
```adl
value matches {
    DV_CODED_TEXT matches {
        defining_code matches {[ac0001]}
    }
}
```

### DV_QUANTITY (magnitude + units)
```adl
value matches {
    C_DV_QUANTITY <
        property = <[openehr::125]>
        list = <
            ["1"] = <
                units = <"mm[Hg]">
                magnitude = <|0.0..1000.0|>
            >
        >
    >
}
```

### DV_ORDINAL (ordered coded values with scores)
```adl
value matches {
    DV_ORDINAL matches {
        0|[local::at0010],    -- None
        1|[local::at0011],    -- Mild
        2|[local::at0012],    -- Moderate
        3|[local::at0013]     -- Severe
    }
}
```

### DV_COUNT (integer value)
```adl
value matches {
    DV_COUNT matches {
        magnitude matches {|0..100|}
    }
}
```

### DV_BOOLEAN
```adl
value matches {
    DV_BOOLEAN matches {*}
}
```

### DV_DATE_TIME
```adl
value matches {
    DV_DATE_TIME matches {*}
}
```

### DV_DATE
```adl
value matches {
    DV_DATE matches {*}
}
```

### DV_DURATION
```adl
value matches {
    DV_DURATION matches {
        value matches {PYMWD}
    }
}
```
Pattern characters: P (period), Y (years), M (months), W (weeks), D (days), T (time separator), H (hours), m (minutes), S (seconds).

### DV_PROPORTION
```adl
value matches {
    DV_PROPORTION matches {
        numerator matches {|0.0..100.0|}
        type matches {2}
    }
}
```
Proportion types: 0=ratio, 1=unitary, 2=percent, 3=fraction, 4=integer_fraction.

### DV_MULTIMEDIA
```adl
value matches {
    DV_MULTIMEDIA matches {
        media_type matches {
            [openEHR::
            425,    -- JPEG
            426,    -- PNG
            427]    -- GIF
        }
    }
}
```

### DV_URI
```adl
value matches {
    DV_URI matches {*}
}
```

---

## Slot Syntax

### Constrained slot (recommended)
```adl
allow_archetype CLUSTER[at0020] occurrences matches {0..*} matches {
    include
        archetype_id/value matches {/openEHR-EHR-CLUSTER\.anatomical_location(-[a-zA-Z0-9_]+)*\.v1/}
}
```

### Slot with exclusions
```adl
allow_archetype CLUSTER[at0021] occurrences matches {0..*} matches {
    include
        archetype_id/value matches {/.*/}
    exclude
        archetype_id/value matches {/openEHR-EHR-CLUSTER\.device(-[a-zA-Z0-9_]+)*\.v1/}
}
```

### Closed slot (no filling allowed)
```adl
allow_archetype CLUSTER[at0022] closed
```

---

## Internal Reference (use_node)

Reuse a constraint tree from elsewhere in the same archetype:
```adl
use_node CLUSTER[at0010] /data[at0001]/items[at0005]
```

---

## Invariant Section

Optional assertions for cross-node constraints:
```adl
invariant
    systolic_greater: /data[at0001]/events[at0006]/data[at0003]/items[at0004]/value/magnitude >= /data[at0001]/events[at0006]/data[at0003]/items[at0005]/value/magnitude
```

---

## Ontology / Terminology Section

Ontology follows **`invariant`** in a valid ADL 1.4 file. Terminology bindings are part of this block, not a separate top-level section.

### Term definitions
```adl
ontology
    term_definitions = <
        ["en"] = <
            items = <
                ["at0000"] = <
                    text = <"Blood pressure">
                    description = <"Measurement of arterial blood pressure">
                >
            >
        >
    >
```

### Constraint definitions (ac-codes)
```adl
    constraint_definitions = <
        ["en"] = <
            items = <
                ["ac0001"] = <
                    text = <"Body site">
                    description = <"Location on the body where measured">
                >
            >
        >
    >
```

### Term bindings
```adl
    term_bindings = <
        ["SNOMED-CT"] = <
            items = <
                ["at0000"] = <[SNOMED-CT::75367002]>
            >
        >
    >
```

---

## data / protocol / state Separation

For OBSERVATION and ACTION archetypes:
- **data** — what was observed or done
- **protocol** — how it was observed or done (method, device)
- **state** — relevant subject state at time of observation

Never encode workflow ordering in these sections.

---

## Versioning in ADL

- Syntax-only changes (formatting, typos) — patch version
- New optional elements, constraint relaxation — minor version
- Path-breaking changes, semantic changes — major version

---

## Style

- Human-readable, consistently indented (tabs)
- Group related constraints logically
- Avoid deep nesting without semantic justification
- All at-codes must have corresponding ontology entries

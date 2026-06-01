# ADL Idioms Reference

**Purpose:** Offline reference for common ADL constraint patterns. Use when writing, editing, or reviewing archetype constraint trees locally.

---

## Core Mental Model

- Archetype = constraints on Reference Model (RM) objects
- Constraint tree = C_OBJECT + C_ATTRIBUTE
- Leaves constrain DV_* types and should never be semantically empty
- Canonical form: `<rm_attribute> matches { <constraint> }`

---

## 1. Root Node

Root constraint MUST match the declared RM type:
```adl
-- OBSERVATION archetype → OBSERVATION root
OBSERVATION[at0000] matches {    -- Blood pressure
    data matches { ... }
}
```

Never substitute a different RM type.

---

## 2. Free Text

```adl
ELEMENT[at0010] occurrences matches {0..1} matches {    -- Comment
    value matches {
        DV_TEXT matches {*}
    }
}
```

Use for narrative fields. Document why unconstrained if flagged by lint rule 14.

---

## 3. Coded Text (internal value set)

```adl
ELEMENT[at0020] matches {    -- Severity
    value matches {
        DV_CODED_TEXT matches {
            defining_code matches {
                [local::
                at0021,    -- Mild
                at0022,    -- Moderate
                at0023]    -- Severe
            }
        }
    }
}
```

Each at-code must have a term definition in the ontology.

---

## 4. Coded Text (external terminology)

```adl
ELEMENT[at0030] matches {    -- Diagnosis
    value matches {
        DV_CODED_TEXT matches {
            defining_code matches {[ac0001]}
        }
    }
}
```

The ac-code is defined in `constraint_definitions` and optionally bound via `constraint_bindings`.

---

## 5. Quantity with Units

```adl
ELEMENT[at0004] matches {    -- Systolic
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
}
```

Use UCUM unit codes. Constrain magnitude where clinically universal.

---

## 6. Quantity with Multiple Units

```adl
ELEMENT[at0040] matches {    -- Body weight
    value matches {
        C_DV_QUANTITY <
            property = <[openehr::124]>
            list = <
                ["1"] = <
                    units = <"kg">
                    magnitude = <|0.0..1000.0|>
                >
                ["2"] = <
                    units = <"[lb_av]">
                    magnitude = <|0.0..2000.0|>
                >
            >
        >
    }
}
```

---

## 7. Ordinal (scored coded values)

```adl
ELEMENT[at0050] matches {    -- Response
    value matches {
        DV_ORDINAL matches {
            0|[local::at0051],    -- None
            1|[local::at0052],    -- Slight
            2|[local::at0053],    -- Moderate
            3|[local::at0054]     -- Strong
        }
    }
}
```

Score is the integer before the pipe. Each code needs a term definition.

---

## 8. Count

```adl
ELEMENT[at0060] matches {    -- Number of episodes
    value matches {
        DV_COUNT matches {
            magnitude matches {|0..100|}
        }
    }
}
```

---

## 9. Boolean

```adl
ELEMENT[at0070] matches {    -- Active?
    value matches {
        DV_BOOLEAN matches {*}
    }
}
```

---

## 10. Date / DateTime / Time

```adl
-- Date only
ELEMENT[at0080] matches {
    value matches {
        DV_DATE matches {*}
    }
}

-- DateTime
ELEMENT[at0081] matches {
    value matches {
        DV_DATE_TIME matches {*}
    }
}

-- Time only
ELEMENT[at0082] matches {
    value matches {
        DV_TIME matches {*}
    }
}
```

---

## 11. Duration

```adl
ELEMENT[at0090] matches {    -- Duration of symptoms
    value matches {
        DV_DURATION matches {
            value matches {PYMWDTHMS}
        }
    }
}
```

Pattern characters: P=period, Y=years, M=months, W=weeks, D=days, T=time separator, H=hours, M=minutes, S=seconds.
Omit characters to restrict (e.g., `PD` for days-only duration).

---

## 12. Proportion

```adl
ELEMENT[at0100] matches {    -- Percentage
    value matches {
        DV_PROPORTION matches {
            numerator matches {|0.0..100.0|}
            type matches {2}
        }
    }
}
```

Types: 0=ratio, 1=unitary, 2=percent, 3=fraction, 4=integer_fraction.

---

## 13. Multimedia

```adl
ELEMENT[at0110] matches {    -- Image
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
}
```

---

## 14. URI

```adl
ELEMENT[at0120] matches {    -- Reference link
    value matches {
        DV_URI matches {*}
    }
}
```

---

## 15. Choice (multiple types)

```adl
ELEMENT[at0130] matches {    -- Value
    value matches {
        DV_TEXT matches {*}
        DV_CODED_TEXT matches {
            defining_code matches {[local::at0131, at0132]}
        }
        C_DV_QUANTITY <
            property = <[openehr::125]>
            list = <
                ["1"] = <units = <"mm[Hg]">>
            >
        >
    }
}
```

Multiple sibling constraints under the same attribute represent a type choice.

---

## 16. Slot (constrained)

```adl
allow_archetype CLUSTER[at0140] occurrences matches {0..*} matches {
    include
        archetype_id/value matches {/openEHR-EHR-CLUSTER\.anatomical_location(-[a-zA-Z0-9_]+)*\.v1/}
}
```

Always constrain slots. Wildcard slots (Rule 12) are discouraged.

---

## 17. Slot (closed)

```adl
allow_archetype CLUSTER[at0141] closed
```

Use to prevent any archetype from filling this slot.

---

## 18. Internal Reference (use_node)

Reuse a constraint tree from elsewhere in the same archetype:
```adl
use_node CLUSTER[at0150] /data[at0001]/items[at0005]
```

The referenced path must exist in the same archetype. The target node's constraints apply.

---

## 19. CLUSTER as Semantic Group

```adl
CLUSTER[at0160] occurrences matches {0..*} matches {    -- Examination findings
    items cardinality matches {1..*; unordered} matches {
        ELEMENT[at0161] occurrences matches {0..1} matches { ... }
        ELEMENT[at0162] occurrences matches {0..1} matches { ... }
        allow_archetype CLUSTER[at0163] occurrences matches {0..*} matches {
            include
                archetype_id/value matches {/openEHR-EHR-CLUSTER\.exam.*\.v1/}
        }
    }
}
```

CLUSTERs represent inseparable semantic groups, not generic containers (Rule 11).

---

## 20. data / protocol / state Separation

```adl
OBSERVATION[at0000] matches {
    data matches {
        HISTORY[at0001] matches {
            events cardinality matches {1..*; unordered} matches {
                EVENT[at0002] occurrences matches {0..*} matches {
                    data matches {
                        ITEM_TREE[at0003] matches { ... }
                    }
                    state matches {
                        ITEM_TREE[at0007] matches { ... }
                    }
                }
            }
        }
    }
    protocol matches {
        ITEM_TREE[at0011] matches { ... }
    }
}
```

- **data** — what was observed
- **protocol** — how it was observed (method, device, calibration)
- **state** — relevant subject state (position, exertion, fasting)

---

## Quick Validation Checklist

- [ ] Root node matches declared RM type?
- [ ] All RM attribute names valid?
- [ ] Every at-code has text + description in ontology?
- [ ] occurrences on objects, cardinality on containers?
- [ ] Slots constrained (not wildcard)?
- [ ] No unconstrained DV_* without justification?
- [ ] Term bindings semantically equivalent?
- [ ] Paths stable across versions?

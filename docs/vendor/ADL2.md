


image::https://specifications.openehr.org/images/openEHR_logo_RGB.svg["openEHR logo",align="center"]

# Archetype Definition Language 2 (ADL2)



## Acknowledgements

### Primary Author

* Thomas Beale, Ars Semantica, UK; openEHR International Board.

### Contributors

This specification and its sibling Archetype Definition Language specification have benefited from formal and informal input from the openEHR and wider health informatics community. The openEHR Foundation would like to recognise the following people for their contributions.

* Seref Arikan, MEcon, Ocean Informatics UK, Centre for Health Informatics and Multi-professional Education (CHIME), UCL, UK
* John Arnett, NHS Connecting for Health, UK
* Koray Atalag PhD, University of Auckland, NZ 
* Tony Austin PhD, Centre for Health Informatics and Multi-professional Education (CHIME), UCL, UK
* Silje Ljosland Bakke, RN, Nasjonal IKT HF, Norway
* Pieter Bos, Software Engineer, Nedap, Netherlands
* Eric Browne PhD, HealthBase Australia
* Rong Chen MD, PhD, Cambio Heath Systems, Sweden
* Joey Coyle MD, PhD, Intermountain Healthcare, New York
* Borut Fabjan, Program Manager, Better d.o.o., Slovenia
* Adam Flinton, NHS Connecting for Health, UK
* Matias Forss MSc, Institute of Technology, Linköping University, Sweden
* Sebastian Garde, PhD, Ocean Informatics, Germany
* Andrew Goodchild PhD, Distributed Systems Technology Centre, Australia
* Peter Gummer MSc, Ocean Informatics
* Sam Heard MD, Ocean Informatics
* Mark Kramer, Division Chief Engineer, Health Technology Center, The Mitre Corporation, USA
* Patrick Langford, NeuronSong LLC
* Jose Alberto Maldondo PhD, Universitat Politècnica de València, Spain
* David Moner PhD, Universitat Politècnica de València, Spain
* Isabel Román Martínez PhD, Universitat de Sevilla, Spain
* Ian McNicoll MD, MSc, Ocean Informatics UK
* Claude Nanjo MA African Studies, M Public Health, Cognitive Medical Systems Inc., California
* Andrew Patterson PhD, LLM, Federation Health Software, Australia
* Ognian Pishev PhD, Australia, Ocean Informatics 
* Rahil Qamar Siddiqui PhD, NHS Health & Social Care Information Centre, UK
* Prof Alan Rector MD, PhD, University of Manchester, UK
* Harold Solbrig MSc, Mayo Clinic, Rochester, USA
* Alessandro Torrisi, Code24, Netherlands
* Zar Zar Tun, Distributed Systems Technology Centre, Australia
* Bert Verhees, ROSA Software, The Netherlands.

Thanks to Sebastian Garde, Central Qld University, Australia, for German translations.

### Trademarks

* 'Microsoft' and '.Net' are registered trademarks of the Microsoft Corporation.
* 'Java' is a registered trademark of Oracle Corporation
* 'Linux' is a registered trademark of Linus Torvalds.
* 'openEHR' is a registered trademark of The openEHR Foundation
* 'SNOMED CT' is a registered trademark of IHTSDO

### Supporters

The work reported in this paper has been funded by the following organisations:

* the https://www.openehr.org/community/industry_partners/[openEHR Industry Partners^];
* Ars Semantica, UK;
* UCL (University College London) - Centre for Health Informatics and Multiprofessional Education (CHIME);
* Ocean Informatics, Australia.

Special thanks to Prof David Ingram, founding Director of CHIME, UCL, who provided a vision and collegial working environment ever since the days of GEHR (1992).



# Preface

## Purpose

This document describes the design basis and syntax of the Archetype Definition Language (ADL) 2.x, a new major version of ADL, containing structural changes with respect to the ADL 1.x versions.

It is intended for software developers, technically-oriented domain specialists and subject matter experts (SMEs). ADL is designed as an abstract human-readable and computer-processable syntax. ADL archetypes can be hand-edited using a normal text editor.

The intended audience includes:

* Standards bodies producing health informatics standards;
* Research groups using openEHR, {iso_13606}[ISO 13606^], and other EHR or EHR exchange architectures;
* The open source healthcare community;
* EHR solution vendors;
* Medical informaticians and clinicians interested in health information.

## Related Documents

Prerequisite documents for reading this document include:

* The {openehr_overview}[openEHR Architecture Overview^];
* The {openehr_am_overview}[openEHR Archetype Technical Overview^];

Related documents include:

* The {openehr_am_aom2}[openEHR Archetype Object Model (AOM2)^];
* The {openehr_am_opt2}[openEHR Operational Template Specification^].

## Nomenclature

In this document, the term 'attribute' denotes any stored property of a type defined in an object model, including primitive attributes and any kind of relationship such as an association or aggregation. XML 'attributes' are always referred to explicitly as 'XML attributes'.

We also use the word 'archetype' in a broad sense to designate what are commonly understood to be 'archetypes' (specifications of clinical data groups / data constraints) and 'templates' (data sets based on archetypes, since at a technical level, an ADL/AOM 2 template is in fact just an archetype. Accordingly, statements about 'archetypes' in this specification can be always understood to also apply to templates, unless otherwise indicated.

## Status

This specification is in the STABLE state. The development version of this document can be found at {openehr_am_development_adl2}[{openehr_am_development_adl2}^].

Known omissions or questions are indicated in the text with a 'to be determined' paragraph, as follows:
*TBD*: (example To Be Determined paragraph)

## Feedback

Feedback may be provided on the https://discourse.openehr.org/c/specifications/adl[openEHR ADL forum^].

Issues may be raised on the https://specifications.openehr.org/components/{component}/open_issues[specifications Problem Report tracker^].

To see changes made due to previously reported issues, see the https://specifications.openehr.org/components/{component}/history[{component} component Change Request tracker^].

## Conformance

Conformance of a data or software artifact to an openEHR specification is determined by a formal test of that artifact against the relevant {openehr_its_component}[openEHR Implementation Technology Specification(s) (ITSs)^], such as an IDL interface or an XML-schema. Since ITSs are formal derivations from underlying models, ITS conformance indicates model conformance.

## Tools

Various tools exist for creating and processing archetypes. The {openehr_awb}[ADL Workbench^] is a reference compiler, visualiser and editor. The openEHR ADL/AOM tools can be {modelling_tools}[downloaded from the website^] .
Source projects can be found at the https://github.com/openEHR[openEHR Github project^].

## Changes from Previous Versions

For existing users of ADL or archetype development tools, the following provides a guide to the changes in the syntax.

### dADL (ODIN)

The object syntax used to represent the description, terminology and annotations sections of an ADL archetype has been historically known as 'dADL' (i.e. 'data ADL'). Since this syntax is completely generic and has no specific dependency on either ADL or openEHR, it has been separated out into its own specification known as Object Data Instance Notation (ODIN).

### ADL 2.4

#### Changes

ADL2 was initially released with a new id-coded coding system using id-codes (for nodes), at-codes (for values only) and ac-codes (for value sets).

The primary change in version 2.4 is the introduction of an alternative at-code coding system, identical to that used in ADL1.

Although a conversion algorithm was developed to enable conversion for ADL1 at-codes in archetypes and templates to the new id-codes and coding system, the openEHR implementer community had concerns on the burden and impact and safety risks inherent in converting downstream software artefacts, queries and persisted patient records.

It was decided that the best solution was to allow openEHR-RM based systems and archetypes to continue to use the original ADL1 at-coded coding system instead of the id-coded coding system. This was seen as critical to remove a very significant barrier to transition from ADL1 to ADL2, which in all other respects was widely welcomed by the established openEHR implementer community.

Further information on the choice of coding system is provided at <<_node_identifier_and_coding_systems>>.

NOTE: ADL tools conformant to ADL/AOM 2.3 or earlier will not conform to the at-coded ADL2 archetypes described in ADL 2.4 without additional engineering.

#### Backward Compatibility

When using the at-coded coding system, this ADL 2.4 release is fully backwards compatible with openEHR RM data created based on ADL 1.4 archetypes. But it breaks compatibility with openEHR RM data created using an id-coded coding system, which was the only option in ADL 2.0 - ADL 2.3 archetypes. So id-coded ADL2 systems and tools are expected to require additional engineering in order to gain compatibility with at-coded systems.

### ADL 2.0

#### Changes

The changes in version 2.0 are designed to make archetypes more computable with respect to terminology. The changes with respect to 1.x versions include:

* the internal node identification system has been changed so that at-codes are no longer used to identify nodes; instead, 'id-codes' are used for that purpose;
* all nodes now require an id-code;
* rules for the construction of node identifier codes in specialised archetypes;
* the `ontology` section has been renamed `terminology`;
* value sets are now declared in their own subsection of the terminology section rather than inline in the definition section;
* the `revision_history` section is removed, since the AOM2 uses the openEHR {openehr_resource}[Base Types version of the Resource package^].

#### Backward Compatibility

In its current form, the changes to the internal coding system and value set representation in ADL 2.x and the AOM with respect to ADL/AOM 1.5 constitute syntactically breaking changes, and therefore require conversion of ADL 1.4 archetypes to ADL 2 form. The changes have been carefully designed to allow this conversion to be implementable, and are implemented in the ADL Workbench tool. ADL 1.4 style paths are generatable from ADL 2 archetypes, so that AQL queries can be built for use with ADL 1.4 based data.

### ADL 1.5

#### Changes

The changes in version 1.5 are made to better facilitate the representation of specialised archetypes. The key semantic capability for specialised archetypes is to be able to support a differential representation, i.e. to express a specialised archetype only in terms of the changed or new elements in its definition, rather than including a copy of unchanged elements. Doing the latter is clearly unsustainable in terms of change management. ADL 1.4 already supported differential representation, but somewhat inconveniently.

The changes for ADL 1.5 include:

* optional `generated` marker in the archetype first line;
* the semantics of reference model subtype matching are now described;
* a differential expression form allows specialised archetypes to be expressed efficiently and ensures they are maintainable;
* new keywords for defining the order of specialised object nodes within container attributes;
* an explanation of how to use the negated match operator (`~matches`, or `∉`) to define value set exclusions in specialised archetypes;
* a description of the semantics of 'inheritance-flattened' archetypes;
* optional `annotations` section added to archetypes;
* `declarations` and `invariants` sections merged into `rules` section;
* In the ADL grammar, the language section is now mandatory;
* `.adls` files are introduced as the standard file extension for differential ADL files (`.adl` files are retained for standalone, inheritance-flattened, or 'flat', archetype).

Nearly all the changes occur in <<cADL - Constraint ADL>> or <<Specialisation>>.

### ADL 1.4

A number of small changes were made in this version, along with significant tightening up of the explanatory text and examples.

#### ISO 8601 Date/Time Conformance

All ISO 8601 date, time, date/time and duration values in dADL are now conformant (previously the usage of the 'T' separator was not correct). Constraint patterns in cADL for dates, times and date/times are also corrected, with a new constraint pattern for ISO 8601 durations being added. The latter allows a deviation from the standard to include the 'W' specifier, since durations with a mixture of weeks, days etc is often used in medicine.

#### Non-inclusive Two-sided Intervals

It is now possible to define an interval of any ordered amount (integer, real, date, time, date/time, duration) where one or both of the limits is not included, for example:

```
    |0..<1000|    -- 0 >= x < 1000
    |>0.5..4.0|   -- 0.5 > x <= 4.0
    |>P2d..<P10d| -- 2 days > x < 10 days
```

#### Occurrences for 'use_node' References

Occurrences can now be stated for `use_node` references, overriding the occurrences of the target node.  If no occurrences is stated, the target node occurrences value is used.

#### Quoting Rules

The old quoting rules based on XML/ISO mnemonic patterns (`&ohmgr;` etc) are replaced by specifying ADL to be UTF-8 based, and any exceptions to this requiring ASCII encoding should use the `\Uhhhh` style of quoting unicode used in various programming languages.

### ADL 1.3

The specific changes made in version 1.3 of ADL are as follows.

#### Query syntax replaced by URI data type

In version 1.2 of ADL, it was possible to include an external query, using syntax of the form:

```
    attr_name = <query("some_service", "some_query_string")>
```

This is now replaced by the use of URIs, which can express queries, for example:

```
    attr_name = <http://some.service.org?some%20query%20etc>
```

No assumption is made about the URI; it need not be in the form of a query - it may be any kind of URI.

#### Top-level Invariant Section

In this version, invariants can only be defined in a top level block, in a way similar to object-oriented class definitions, rather than on every block in the definition section, as is the case in version 1.2 of ADL. This simplifies ADL and the Archetype Object Model, and makes an archetype more comprehensible as a `type` definition.

### ADL 1.2

#### ADL Version

The ADL version is now optionally (for the moment) included in the first line of the archetype, as follows.

```
    archetype (adl_version=1.2)
```

It is strongly recommended that all tool implementors include this information when archetypes are saved, enabling archetypes to gradually become imprinted with their correct version, for more reliable later processing. The adl_version indicator is likely to become mandatory in future versions of ADL.

#### dADL (ODIN) Syntax Changes

The dADL (now ODIN) syntax for container attributes has been altered to allow paths and typing to be expressed more clearly, as part of enabling the use of Xpath-style paths. ADL 1.1 dADL had the following appearance:

```
	school_schedule = <
		locations(1) = <...>
		locations(2) = <...>
		locations(3) = <...>
		subjects("philosophy:plato") = <...>
		subjects("philosophy:kant") = <...>
		subjects("art") = <...>
	>
```

This has been changed to look like the following:

```
	school_schedule = <
		locations = <
			[1] = <...>
			[2] = <...>
			[3] = <...>
		>
		subjects = <
			["philosophy:plato"] = <...>
			["philosophy:kant"] = <...>
			["art"] = <...>
		>
	>
```

The new appearance both corresponds more directly to the actual object structure of container types,
and has the property that paths can be constructed by directly reading identifiers down the backbone
of any subtree in the structure. It also allows the optional addition of typing information anywhere in
the structure, as shown in the following example:

```
	school_schedule = SCHEDULE <
		locations = LOCATION <
			[1] = <...>
			[2] = <...>
			[3] = ARTS_PAVILLION <...>
		>
		subjects = <
			["philosophy:plato"] = ELECTIVE_SUBJECT <...>
			["philosophy:kant"] = ELECTIVE_SUBJECT <...>
			["art"] = MANDATORY_SUBJECT <...>
		>
	>
```

These changes will affect the parsing of container structures and keys in the description and terminology parts of the archetype.

#### Revision History Section

Revision history is now recorded in a separate section of the archetype, both to logically separate it from the archetype descriptive details, and to facilitate automatic processing by version control systems in which archetypes may be stored. This section is included at the end of the archetype because it is in general a monotonically growing section.

#### Primary_language and Languages_available Sections

An attribute previously called `_primary_language_` was required in the ontology section of an ADL 1.1 archetype. This is renamed to `_original_language_` and is now moved to a new top level section in the archetype called `language`. Its value is still expressed as a dADL String attribute. The `_languages_available_` attribute previously required in the `ontology` section of the archetype is renamed to `_translations_`, no longer includes the original languages, and is also moved to this new top level section.

# Overview

ADL uses three syntaxes, cADL (constraint form of ADL), ODIN (Object Data Instance Notation), and openEHR Expression Language (EL), to express constraints on data which are instances of an underlying information model, which may be expressed in UML, relational form, or in a programming language.

ADL itself is a very simple 'glue' syntax, which uses two other syntaxes for expressing structured constraints and data, respectively.

The cADL syntax is used to express the archetype `definition` section, while the ODIN syntax is used to express data which appears in the `language`, `description`, and `terminology` sections of an ADL archetype. The top-level structure of an ADL archetype is shown in the figure below.

This main part of this document describes cADL and ADL path syntax, before going on to describe the combined ADL syntax, archetypes, specialisation, terminology integration and templates.

.ADL Archetype Structure
image::{doc_name}/diagrams/adl_text_overview.svg[id=archetype_structure, align="center", width=50%]

## An Example

The following is an example of a very simple archetype, giving a feel for the syntax. The main point to glean from the following is that the notion of 'guitar' is defined in terms of _constraints_ on a _generic_ model of the concept "INSTRUMENT".

The names mentioned down the left-hand side of the definition section (`INSTRUMENT`, `size` etc) are alternately class and attribute names from an object model.

Each block of braces encloses a specification for some particular set of instances that conform to a specific concept, such as 'guitar' or 'neck', defined in terms of constraints on types from a generic class model. The leaf pairs of braces enclose constraints on primitive types such as `Integer`, `String`, `Boolean` and so on.

====
[IMPORTANT]::

ADL 2.4 introduces an option to use the **at-code coding system** of ADL1, as an alternative to the **id-code coding system** introduced in ADL2.

- The **at-code coding system** must be used for systems that need to be conformant to the _openEHR Reference Model (RM)_.
- The **id-code coding system** is recommended for non-openEHR RM information models.

ADL2 syntax examples are provided for both coding systems, as `at-coded ADL2` or `id-coded ADL2`.

Further information on the choice of coding system is provided at <<_node_identifier_and_coding_systems>>.
====

.Simple 'Guitar' archetype ADL2 example
====
at-coded ADL2::
+
```adl
archetype (adl_version=2.4.0; rm_release=1.1.5)
    adl-test-instrument.guitar.v1.0.4

language
    original_language = <[iso_639-1::en]>

definition
    INSTRUMENT[at0000] matches {
        size matches {|60..120|}                    -- size in cm
        date_of_manufacture matches {yyyy-mm-??}    -- year & month ok
        parts matches {
            PART[at0001] matches {                  -- neck
                material matches {[ac1]}            -- timber or nickel alloy
            }
            PART[at0002] matches {                  -- body
                material matches {[at3]}            -- timber
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["at0000"] = <
                text = <"guitar">;
                description = <"stringed instrument">
            >
            ["at0001"] = <
                text = <"neck">;
                description = <"neck of guitar">
            >
            ["at0002"] = <
                text = <"body">;
                description = <"body of guitar">
            >
            ["at0003"] = <
                text = <"timber">;
                description = <"straight, seasoned timber">
            >
            ["at0004"] = <
                text = <"nickel alloy">;
                description = <"frets">
            >
        >
    >

    value_sets = <
        ["ac1"] = <
            id = <"ac1">
                members = <"at0003", "at0004">
            >
        >
    >
```

id-coded ADL2::
+
```adl
archetype (adl_version=2.4.0; rm_release=1.1.5)
    adl-test-instrument.guitar.v1.0.4

language
    original_language = <[iso_639-1::en]>

definition
    INSTRUMENT[id1] matches {
        size matches {|60..120|}                    -- size in cm
        date_of_manufacture matches {yyyy-mm-??}    -- year & month ok
        parts matches {
            PART[id2] matches {                     -- neck
                material matches {[ac1]}            -- timber or nickel alloy
            }
            PART[id3] matches {                     -- body
                material matches {[at3]}            -- timber
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"guitar">;
                description = <"stringed instrument">
            >
            ["id2"] = <
                text = <"neck">;
                description = <"neck of guitar">
            >
            ["id3"] = <
                text = <"body">;
                description = <"body of guitar">
            >
            ["at3"] = <
                text = <"timber">;
                description = <"straight, seasoned timber">
            >
            ["at4"] = <
                text = <"nickel alloy">;
                description = <"frets">
            >
        >
    >

    value_sets = <
        ["ac1"] = <
            id = <"ac1">
                members = <"at3", "at4">
            >
        >
    >
```
====

# File Encoding and Character Quoting

## File Encoding

Because ADL files are inherently likely to contain multiple languages due to internationalised authoring and translation, they must be capable of accommodating characters from any language. ADL files do not explicitly indicate an encoding because they are assumed to be in UTF-8 encoding of unicode.  For ideographic and script-oriented languages, this is a necessity.

There are three places in ADL files where non-ASCII characters can occur:

* in string values, demarcated by double quotes, e.g. "xxxx";
* in regular expression patterns, demarcated by either `//` or `^^`;
* in character values, demarcated by single quotes, e.g. 'x'.

URIs (a data type in ODIN) are assumed to be 'percent-encoded' according to {rfc3986}[IETF RFC 39861] URI syntax, which applies to all characters outside the 'unreserved set'. The unreserved set is:

```
unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
```

In actual fact, ADL files encoded in latin 1 (ISO-8859-1) or another variant of ISO-8859 - both containing accented characters with unicode codes outside the ASCII 0-127 range - may work perfectly well, for various reasons:

* they contain nothing but ASCII, i.e. unicode code-points 0 - 127; this will be the case in English- language authored archetypes containing no foreign words;
* some layer of the operating system is smart enough to do an on-the-fly conversion of characters above 127 into UTF-8, even if the archetype tool being used is designed for pure UTF-8 only;
* the archetype tool (or the string-processing libraries it uses) might support UTF-8 and ISO- 8859 variants.

For situations where binary UTF-8 (and presumably other UTF-* encodings) cannot be supported, ASCII encoding of unicode characters above code-point 127 should only be done using the system supported by many programming languages today, namely `\u` escaped UTF-16. In this system, unicode codepoints are mapped to either:

* `\uHHHH` - 4 hex digits which will be the same (possibly 0-filled on the left) as the unicode code-point number expressed in hexadecimal; this applies to unicode codepoints in the range `U+0000` - `U+FFFF` (the 'base multi-lingual plane', BMP);
* `\uHHHHHHHH` - 8 hex digits to encode unicode code-points in the range `U+10000` through `U+10FFFF` (non-BMP planes); the algorithm is described in {rfc2781}[IETF RFC 2781].

It is not expected that the above approach will be commonly needed, and it may not be needed at all; it is preferable to find ways to ensure that native UTF-8 can be supported, since this reduces the burden for ADL parser and tool implementers. The above guidance is therefore provided only to ensure a standard approach is used for ASCII-encoded unicode, if it becomes unavoidable.

Thus, while *the only officially designated encoding for ADL and its constituent syntaxes is UTF-8*, real software systems may be more tolerant. This document therefore specifies that any tool designed to process ADL files need only support UTF-8; supporting other encodings is an optional extra. This could change in the future, if required by the ADL or openEHR user community.

## Special Character Sequences

In strings and characters, characters not in the lower ASCII (0-127) range should be UTF-8 encoded, with the exception of quoted single and double quotes, and some non-printing characters, for which the following customary quoted forms are allowed (but not required):

* `\r` - carriage return
* `\n` - linefeed
* `\t` - tab
* `\\` - backslash
* `\"` - literal double quote
* `\'` - literal single quote

Any other character combination starting with a backslash is illegal; to get the effect of a literal backslash, the `\\` sequence should always be used.

Typically, in a normal string, including multi-line paragraphs as used in ODIN, only `\\` and `\"` are likely to be necessary, since all of the others can be accommodated in their literal forms; the same goes for single characters - only `\\` and `\'` are likely to commonly occur. However, some authors may prefer to use `\n` and `\t` to make intended formatting clearer, or to allow for text editors that do not react properly to such characters. Parsers should therefore support the above list.

In regular expressions (only used in cADL string constraints), there will typically be backslash-escaped characters from the above list as well as other patterns like `\s` (whitespace) and `\d` (decimal digit), according to the {perl_regex}[PERL regular expression specification]. These should not be treated as anything other than literal strings, since they are processed by a regular expression parser.



# cADL - Constraint ADL
## Overview

cADL is a block-structured syntax which enables constraints on data defined by object-oriented information models to be expressed in archetypes or other knowledge definition formalisms. It is most useful for defining the specific allowable configurations of data whose instances conform to very general object models. The general appearance of cADL is illustrated by the following example:


====
at-coded ADL2::
+
```cadl
    PERSON[at0000] matches {                             -- constraint on a PERSON instance
        name matches {                                   -- constraint on PERSON.name
            TEXT[at0001] matches {/.+/}                  -- any non-empty string
        }
        addresses cardinality matches {1..*} matches {   -- constraint on
            ADDRESS[at0002] matches {                    -- PERSON.addresses
                -- etc --
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    PERSON[id1] matches {                                -- constraint on a PERSON instance
        name matches {                                   -- constraint on PERSON.name
            TEXT[id2] matches {/.+/}                     -- any non-empty string
        }
        addresses cardinality matches {1..*} matches {   -- constraint on
            ADDRESS[id3] matches {                       -- PERSON.addresses
                -- etc --
            }
        }
    }
```
====

Some of the textual keywords in this example can be more efficiently rendered using common mathematical logic symbols. In the following example, the `matches` keyword have been replaced by an equivalent symbol:


====
at-coded ADL2::
+
```cadl
    PERSON[at0000] ∈ {                            -- constraint on a PERSON instance
        name ∈ {                                  -- constraint on PERSON.name
            TEXT[at0001] ∈ {/..*/}                -- any non-empty string
        }
        addresses cardinality ∈ {1..*} ∈ {        -- constraint on
            ADDRESS[at0002] ∈ {                   -- PERSON.addresses
                -- etc --
            }
        }
    }
```
id-coded ADL2::
+
```cadl
    PERSON[id1] ∈ {                            -- constraint on a PERSON instance
        name ∈ {                               -- constraint on PERSON.name
            TEXT[id2] ∈ {/..*/}                -- any non-empty string
        }
        addresses cardinality ∈ {1..*} ∈ {     -- constraint on
            ADDRESS[id3] ∈ {                   -- PERSON.addresses
                -- etc --
            }
        }
    }
```
====



The full set of equivalences appears below. Raw cADL is persisted in the text-based form, to remove any difficulties when authoring cADL text in normal text editors, and to aid reading in English. However, the symbolic form might be more widely used for display purposes and in more sophisticated tools, as it is more succinct and less language-dependent. The use of symbols or text is completely a matter of taste, and no meaning whatsoever is lost by completely ignoring one or other format according to one's personal preference. This document uses both conventions.

In the standard cADL documented in this section, literal leaf values (such as the regular expression `/.+/` in the above example) are always constraints on a set of 'standard' widely-accepted primitive types, as described in the {openehr_odin}[openEHR ODIN syntax specification^].

## Basics

### Keywords

The following keywords are recognised in cADL:

* `matches`, `~matches`, `is_in`, `~is_in`
* `occurrences`, `existence`, `cardinality`
* `ordered`, `unordered`, `unique`
* `use_node, allow_archetype`
* `include`, `exclude`
* `before` , `after`

Symbol equivalents for some of the above are given in the following table.

|=========================================
|Textual +
 Rendering |Symbolic +
 Rendering |Meaning
|matches |∈ |Set membership, "p is in P"
|not, ~ |∼ |Negation, "not p"
|* |∗ |Infinity, 'any number of...'
|=========================================

### Block / Node Structure

cADL constraints are written in a block-structured style, similar to block-structured programming languages like C. A typical block resembles the following (the recurring pattern `/.+/` is a regular expression matching a non-empty string):

====
at-coded ADL2::
+
```cadl
    PERSON[at0000] ∈ {
        name ∈ {
            PERSON_NAME[at0001] ∈ {
                forenames cardinality ∈ {1..*} ∈ {/.+/}
                family_name ∈ {/.+/}
                title ∈ {"Dr", "Miss", "Mrs", "Mr"}
            }
        }
        addresses cardinality ∈ {1..*} ∈ {
            LOCATION_ADDRESS[at0002] ∈ {
                street_number existence ∈ {0..1} ∈ {/.+/}
                street_name ∈ {/.+/}
                locality ∈ {/.+/}
                post_code ∈ {/.+/}
                state ∈ {/.+/}
                country ∈ {/.+/}
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    PERSON[id1] ∈ {
        name ∈ {
            PERSON_NAME[id2] ∈ {
                forenames cardinality ∈ {1..*} ∈ {/.+/}
                family_name ∈ {/.+/}
                title ∈ {"Dr", "Miss", "Mrs", "Mr"}
            }
        }
        addresses cardinality ∈ {1..*} ∈ {
            LOCATION_ADDRESS[id3] ∈ {
                street_number existence ∈ {0..1} ∈ {/.+/}
                street_name ∈ {/.+/}
                locality ∈ {/.+/}
                post_code ∈ {/.+/}
                state ∈ {/.+/}
                country ∈ {/.+/}
            }
        }
    }
```
====

In the above, each block is introduced by an identifier (shown in blue) from an information model. The identifiers alternate between type-names (upper case in this example, or 'camel' case) and type attribute names (lower case). Here, 'type-name' indicates the name of a type, which may be a class name, or may be a derived generic type name. An 'attribute name' is the name of an attribute in the inheritance-flattened form of a type, i.e. may be be defined in an ancestor class of the class to which the type-name most directly corresponds.

Blocks introduced by a type name are known as _object blocks_ or _object nodes_, while those introduced by an attribute name are _attribute blocks_ or _attribute nodes_.

The block identifier is followed by the ∈ operator (equivalent text keyword: `matches` or `is_in` ) followed by an open brace, is the start of a 'block', which continues until the closing matching brace (normally visually indented to match the line at the beginning of the block).

====
at-coded ADL2::
+
```cadl
    PERSON[at0000] ∈ {                  -- OBJECT block 1 ------------+
        name ∈ {                            -- attribute block A ---+ |
            PERSON_NAME[at0001] ∈ { ... }       -- OBJECT block 2   + |
        }                                  -------------------------+ |
    }                                   ------------------------------+
```
id-coded ADL2::
+
```cadl
    PERSON[id1] ∈ {                     -- OBJECT block 1 ------------+
        name ∈ {                            -- attribute block A ---+ |
            PERSON_NAME[id2] ∈ { ... }          -- OBJECT block 2   + |
        }                                  -------------------------+ |
    }                                   ------------------------------+
```
====
An object block or node can be thought of as a constraint matching a set of instances conforming to the type which introduces the block.

The example above expresses a constraint on an instance of the type `PERSON` ; the constraint is expressed by everything inside the `PERSON` block. The two blocks at the next level define constraints on properties of `PERSON` , in this case `_name_` and `_addresses_`. Each of these constraints is expressed in turn by the next level containing constraints on further types, and so on. The general structure is therefore a recursive nesting of constraints on types, followed by constraints on attributes (of that type), followed by types (being the types of the attribute under which it appears) until leaf nodes are reached.

A cADL text is a structure of alternating object and attribute blocks each introduced respectively by type names and attribute names from an underlying information model.

### Comments

In a cADL text, comments are defined as follows:

Comments are indicated by the leader characters '--'. Multi-line comments are achieved using the '--' leader on each line where the comment continues.

### The Underlying Information Model

Identifiers in cADL texts correspond to entities - types and attributes - in an information model. The latter is typically an object-oriented model, but may just as easily be an entity-relationship model or any other typed model of information. A UML model compatible with the example above is shown in <<uml_model_of_person>>. Note that there can be more than one model compatible with a given fragment of cADL syntax, and in particular, there are usually more properties and classes in the reference model than are mentioned in the cADL constraints. In other words, a cADL text includes constraints _only for those parts of a model that are useful or meaningful to constrain_.

.UML Model of Person
image::UML/diagrams/AM-example-demographics.svg[id=uml_model_of_person, align="center"]

Constraints expressed in cADL cannot invalidate those from the information model. For example, the `PERSON._family_name_` attribute is mandatory in the model in the above `PERSON` model, so it is not valid to express a constraint allowing the attribute to be optional. In general, a cADL archetype can only further constrain an existing information model. However, it must be remembered that for very generic models consisting of only a few classes and a lot of optionality, this rule is not so much a limitation as a way of adding meaning to information. Thus, for a demographic information model which has only the types `PARTY` and `PERSON`, one can write cADL which defines the concepts of entities such as `COMPANY` , `EMPLOYEE` , `PROFESSIONAL` , and so on, in terms of constraints on the types available in the information model.

This general approach can be used to express constraints for instances of any information model. The following example shows how to express a constraint on the `_value_` property of an `ELEMENT` class to be a `DV_QUANTITY` with a suitable range for expressing blood pressure.

====

at-coded ADL2::
+
```cadl
    ELEMENT[at0009] matches {          -- diastolic blood pressure
        value matches {
            DV_QUANTITY[at9071] matches {
                magnitude matches {|0..1000|}
                property matches {"pressure"}
                units matches {"mm[Hg]"}
            }
        }
    }
```

id-coded ADL2::
+

```cadl
    ELEMENT[id10] matches {          -- diastolic blood pressure
        value matches {
            DV_QUANTITY[id11] matches {
                magnitude matches {|0..1000|}
                property matches {"pressure"}
                units matches {"mm[Hg]"}
            }
        }
    }
```
====
In this specification, the terms underlying information model and _reference model_ are equivalent and refer to the information model on which a cADL text is based.

#### Information Model Identifiers

Identifiers from the underlying information model are used to introduce all cADL nodes. Identifiers obey the same rules as in ODIN: type names commence with an upper case letter, while attribute and function names commence with a lower case letter. In cADL, names of types and the name of any property (i.e. attribute or parameterless function) can be used.

A *type name* is any identifier with an initial upper case letter, followed by any combination of letters, digits and underscores. A *generic type name* (including nested forms) additionally may include commas, angle brackets and spaces, and must be syntactically correct as per the OMG UML 2.x specification or higher. An *attribute name* is any identifier with an initial lower case letter, followed by any combination of letters, digits and underscores. Any convention that obeys this rule is allowed.

Type identifiers are shown in this document in all uppercase, e.g. `PERSON` , while attribute identifiers are shown in all lowercase, e.g. `home_address` . In both cases, underscores are used to represent word breaks. This convention is used to improve the readability of this document, and other conventions may be used, such as the common programmer's mixed-case convention exemplified by `Person` and `homeAddress`. The convention chosen for any particular cADL document should be based on that used in the underlying information model.

### Node Identifier and Coding Systems

Node identifier codes appear after all type identifiers in a cADL text.

ADL 2.4 introduces support for a choice of node identifier _coding systems_, in order to facilitate transition from ADL1 to ADL2:

- the **at-code coding system**, identical to that used for ADL1, mandatory to be used in _openEHR Reference Model (RM)_ environments.

- the **id-code coding system**, as originally introduced in ADL2.

Each coding system has a different node-naming and numbering convention:

- For **at-coded archetypes**, node identifiers take the form of an _at-code_ in brackets, e.g. `[at0002]`. The at-code of a root object in a structure is always `at0000`, or for specialised archetypes, `at0000.1`, `at0000.1.1` etc.

- For **id-coded archetypes**, node identifiers take the form of an _id-code_ in brackets, e.g. `[id3]`. The id-code of a root object in a structure is always `id1`, or for specialised archetypes, `id1.1`, `id1.1.1` etc.

The rules and use of node identifiers are described in more detail below in the <<_node_identifiers>> and <<_node_identifier_codes>> sections.

### The matches Operator

The `matches` or `is_in` operator deserves special mention, since it is the key operator in cADL. This operator can be understood mathematically as set membership. When it occurs between an identifier and a block delimited by braces, the meaning is: the set of values allowed for the entity referred to by the name (either an object, or parts of an object - attributes) is specified between the braces. What appears between any matching pair of braces can be thought of as a _specification for a set of values_. Since blocks can be nested, this approach to specifying values can be understood in terms of nested sets, or in terms of a value space for instances of a type. Thus, in the following example, the `matches` operator links the name of an entity to a linear value space (i.e. a list), consisting of all words ending in 'ion'.

```cadl
    aaa matches {/\w*ion[\s\n\t ]/} -- the set of words ending in 'ion'
```

The following example links the name of a type `XXX` with a hierarchical value space.

====
at-coded ADL2::
+
```cadl
    XXX[at0001] matches {
        xxx_attr1 matches {
            YYY[at0002] matches {
                yyy_attr1 matches {0..3}
            }
        }
        xxx_attr2 matches {
            ZZZ[at0003] matches {
                zzz_attr1 matches {>1992-12-01}
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    XXX[id2] matches {
        xxx_attr1 matches {
            YYY[id3] matches {
                yyy_attr1 matches {0..3}
            }
        }
        xxx_attr2 matches {
            ZZZ[id4] matches {
                zzz_attr1 matches {>1992-12-01}
            }
        }
    }
```
====
The meaning of the syntax above is: data matching the constraints consists of an instance of type `XXX` , or any subtype allowed by the underlying information model, for which the value of attribute `_aaa_` is of type `YYY` , or any subtype allowed by the underlying information model, and so on, recursively until leaf level constraints are reached.

Occasionally the `matches` operator needs to be used in the negative, usually at a leaf block. Any of the following can be used to constrain the value space of the attribute `aaa` to any number except 5:

```cadl
    aaa ~matches {5}
    aaa ~is_in {5}
    aaa ∉ {5}
```

The choice of whether to use `matches` or `is_in` is a matter of taste and background; those with a mathematical background will probably prefer `is_in` , while those with a data processing background may prefer `matches` .

### Natural Language

cADL is completely independent of all natural languages. The only potential exception is where constraints include literal values from some language, and this is easily and routinely avoided by the use of separate language and terminology definitions, as used in ADL archetypes. However, for the purposes of readability, comments in English have been included in this document to aid the reader. In real cADL documents, comments are generated from the archetype terminology in the language of the locale.


## Constraints on Complex types

This section describes the semantics for constraining objects of complex, i.e. non-primitive types. The semantics apply recursively through a constraint structure until leaf nodes constraining primitive types are reached.

### Attribute Constraints

In any information model, attributes are either single-valued or multiply-valued, i.e. of a generic container type such as `List<Contact>` . Both have `_existence_` , while multiply-valued attributes also have `_cardinality_`.

#### Existence

The existence constraint may be used with any attribute to further constrain the existence defined by the underlying reference model. An existence constraint indicates whether an attribute value is mandatory or optional, and is indicated by "0..1" or "1" markers at line ends in UML diagrams (and often mistakenly referred to as a "cardinality of 1..1"). Attributes defined in the reference model have an effective existence constraint, defined by the invariants (or lack thereof) of the relevant class. For example, the `_protocol_` attribute in the {openehr_rm_ehr}[openEHR EHR IM^] `OBSERVATION` class is defined in the reference model as being optional, i.e. `0..1`. An archetype may redefine this to `{1..1}`, making the attribute mandatory. Existence constraints are expressed in cADL as follows:

====
at-coded ADL2::
+
```cadl
    OBSERVATION[at0000] matches {
        protocol existence matches {1..1} matches {
            -- details
        }
    }
```

id-coded ADL2::
+
```cadl
    OBSERVATION[id1] matches {
        protocol existence matches {1..1} matches {
            -- details
        }
    }
```
====

The meaning of an existence constraint is to indicate whether a value - i.e. an object - is mandatory or optional (i.e. obligatory or not) in runtime data for the attribute in question. The same logic applies whether the attribute is of single or multiple cardinality, i.e. whether it is a container type or not. For container attributes, the existence constraint indicates whether the whole container (usually a list or set) is mandatory or not; a further cardinality constraint (described below) indicates how many members in the container are allowed.

An *existence constraint* may be used directly after any attribute identifier, and indicates whether the object to which the attribute refers is mandatory or optional in the data.

Existence is shown using the same constraint language as the rest of the archetype definition. Existence constraints can take the values `{0}` , `{0..0}` , `{0..1}` , `{1}` , or `{1..1}` . The first two of these constraints may not seem initially obvious, but can be used to indicate that an attribute must not be present in the particular situation modelled by the archetype. This may be reasonable in some cases.

### Single-valued Attributes

A single-valued attribute is an attribute whose type as declared in the underlying class model is of a single object type rather than a container type such as a list or set. Single-valued attributes can be constrained with a single object constraint as shown in the following example.

====
at-coded ADL2::
+
```cadl
    value matches {
        DV_QUANTITY[at9001] matches {
            magnitude matches {|0..55|}
            property matches {"velocity"}
            units matches {"mph"}
        }
    }
```

id-coded ADL2::
+
```cadl
    value matches {
        DV_QUANTITY[id22] matches {
            magnitude matches {|0..55|}
            property matches {"velocity"}
            units matches {"mph"}
        }
    }
```
====

Multiple alternative object constraints can also be defined, using a number of sibling blocks, as shown in the following example. Each block defines an alternative constraint, only one of which needs to be matched by the data.

====
at-coded ADL2::
+
```cadl
    value matches {
        DV_QUANTITY[at9001] matches { -- miles per hour
            magnitude matches {|0..55|}
            property matches {"velocity"}
            units matches {"mph"}
        }
        DV_QUANTITY[at9002] matches { -- km per hour
            magnitude matches {|0..100|}
            property matches {"velocity"}
            units matches {"km/h"}
        }
    }
```

id-coded ADL2::
+
```cadl
    value matches {
        DV_QUANTITY[id22] matches { -- miles per hour
            magnitude matches {|0..55|}
            property matches {"velocity"}
            units matches {"mph"}
        }
        DV_QUANTITY[id23] matches { -- km per hour
            magnitude matches {|0..100|}
            property matches {"velocity"}
            units matches {"km/h"}
        }
    }
```
====

Here the occurrences of both `DV_QUANTITY` constraints is not stated, leading to the result that only one `DV_QUANTITY` instance can appear in runtime data, matching either one of the constraints.

Two or more object constraints introduced by type names appearing after a single-valued attribute (i.e. one for which there is no cardinality constraint) are understood as alternative constraints, only one of which is matched by the data.

### Container Attributes

#### Cardinality

The cardinality of container attributes may be constrained in cADL with the `_cardinality_` constraint. Cardinality indicates limits on the number of instance members of a container types such as lists and sets. Consider the following example:

====
at-coded ADL2::
+
```cadl
    HISTORY[at0001] occurrences ∈ {1} ∈ {
        periodic ∈ {False}
        events cardinality ∈ {*} ∈ {
            EVENT[at0002] occurrences ∈ {0..1} ∈ {    }           -- 1 min sample
            EVENT[at0003] occurrences ∈ {0..1} ∈ {    }           -- 2 min sample
            EVENT[at0004] occurrences ∈ {0..1} ∈ {    }           -- 3 min sample
        }
    }
```

id-coded ADL2::
+
```cadl
    HISTORY[id2] occurrences ∈ {1} ∈ {
        periodic ∈ {False}
        events cardinality ∈ {*} ∈ {
            EVENT[id3] occurrences ∈ {0..1} ∈ {    }           -- 1 min sample
            EVENT[id4] occurrences ∈ {0..1} ∈ {    }           -- 2 min sample
            EVENT[id5] occurrences ∈ {0..1} ∈ {    }           -- 3 min sample
        }
    }
```
====

The `cardinality` keyword implies firstly that the property events must be of a container type, such as `List<T>` , `Set<T>` , `Bag<T>` . The integer range indicates the valid membership of the container; a single '\*' means the range '0..*', i.e. '0 to many'. The type of the container is not explicitly indicated, since it is usually defined by the information model. However, the semantics of a logical set (unique membership, ordering not significant), a logical list (ordered, non-unique membership) or a bag (unordered, non-unique membership) can be constrained using the additional keywords `ordered` , `unordered` , `unique` and `non-unique` within the cardinality constraint, as per the following examples:

```cadl
    events cardinality ∈ {*; ordered} ∈ {                   -- logical list
    events cardinality ∈ {*; unordered; unique} ∈ {         -- logical set
    events cardinality ∈ {*; unordered} ∈ {                 -- logical bag
```

If no numeric or ordering constraint on the cardinality of a container attribute is required, the keyword is used on its own, and simply indicates that the attribute is a container, as in the following example:

```cadl
    events cardinality ∈ { -- indicates 'events' is a container
```

Although this is not strictly necessary for the purpose of expressing valid archetypes if the Reference Model can usually be referred to, it enables early stage parsing to generate the correct type of attributes without referring to a Reference Model schema, which in any case may not always be available. This in turn enables more faithful visualisation at an earlier point in the archetype compilation process.

In theory, no cardinality constraint can be stronger than the semantics of the corresponding container in the relevant part of the reference model. However, in practice, developers often use lists to facilitate data integration, when the actual semantics are intended to be of a set; in such cases, they typically ensure set-like semantics in their own code rather than by using an `Set<T>` type. How such constraints are evaluated in practice may depend somewhat on knowledge of the software system.

A *cardinality constraint* must be used after any Reference Model container attribute name (or after its existence constraint, if there is one) in order to designate it as a container attribute. Additionally, it may constrain the number of member items it may have in the data, and whether it has "list", "set", or "bag" semantics, via the use of the keywords 'ordered', 'unordered', 'unique' and 'non-unique'.

The numeric part of the cardinality constraint can take the values `{0}`, `{0..0}`, `{0..n}`, `{m..n}`, `{0..\*}`, or `{*}`, or a syntactic equivalent. The first two of these constraints are unlikely to be useful, but there is no reason to prevent them. There is no default cardinality, since if none is shown, the relevant attribute is assumed to be single-valued (in the interests of uniformity in archetypes, this holds even for smarter parsers that can access the reference model and determine that the attribute is in fact a container).

Cardinality and existence constraints can co-occur, in order to indicate various combinations on a container type property, e.g. that it is optional, but if present, is a container that may be empty, as in the following:

```cadl
    events existence ∈ {0..1} cardinality ∈ {0..*} ∈ {-- etc --}
```

### Object Constraints

#### Node Identifiers

In cADL, an entity in brackets of the form `[atNNNN]` for at-coded archetypes or `[idN]` for id-coded archetypes following a type name is used to identify an object node, i.e. a node constraint delimiting a set of instances of the type as defined by the reference model. Object nodes always commence with a type name. Although any node identifier format could be supported, the current version of ADL assumes that node identifiers are of the form of an archetype term identifier, i.e. `[atNNNN]` for at-coded archetypes (e.g. `[at0041]`) or `[idN]` for id-coded archetypes (e.g. `[id42]`) . Node identifiers are shown in magenta in this document.

The structural function of node identifiers is to allow the formation of paths:

* enable cADL nodes in an archetype definition to be unambiguously referred to within the same archetype;
* enable data created using a given archetype to be matched at runtime;
* to enable cADL nodes in a parent archetype to be unambiguously referred to from a specialised child archetype;
* to enable unique paths to be formed.

All object nodes require a node identifier, guaranteeing the ability to generate unique paths, and to process specialised archetypes with respect to inheritance parents.

A *Node identifier* is required for every object node in an archetype.

The node identifier can also perform a semantic function, that of giving a design-time meaning to the node, by equating the node identifier to some description. The use of node identifiers in archetypes is the main source of their expressive power. Each node identifier acts as a 'semantic marker' or 'override' on the node. Thus, in the example shown in <<The Underlying Information Model>>, the `ELEMENT` node is identified by the code `[at0009]` (`[id10]`) , which can be designated elsewhere in an archetype as meaning "diastolic blood pressure". In this way rich meaning is given to data constructed from a limited number of object types.

*Not every object node identifier needs to be defined in the archetype terminology*: it is only mandatory for the identifiers of nodes defined under container attributes, and multiple alternative nodes under single-valued attributes. The identifiers of single object nodes defined under single-valued attributes may have terminology definitions, but don't typically need them, since the meaning is obvious from the attribute.

#### Occurrences

A constraint on occurrences is used only with cADL object nodes, to indicate how many times in data an instance conforming to the constraint can occur. It is usually only defined on objects that are children of a container attribute, since by definition, the occurrences of an object that is the value of a single-valued attribute can only be `0..1` or `1..1`, and this is already defined by the attribute's `existence`. However, it may be used in specialised archetypes to exclude a possibility defined in a parent archetype (see <<Attribute Redefinition>>).

In the example below, three `EVENT` constraints are shown; the first one ("1 minute sample") is shown as mandatory, while the other two are optional.

====
at-coded ADL2::
+
```cadl
    events cardinality ∈ {*} ∈ {
        EVENT[at0001] occurrences ∈ {1..1} ∈ {    }          -- 1 minute sample
        EVENT[at0002] occurrences ∈ {0..1} ∈ {    }          -- 2 minute sample
        EVENT[at0003] occurrences ∈ {0..1} ∈ {    }          -- 3 minute sample
    }
```

id-coded ADL2::
+
```cadl
    events cardinality ∈ {*} ∈ {
        EVENT[id2] occurrences ∈ {1..1} ∈ {    }          -- 1 minute sample
        EVENT[id3] occurrences ∈ {0..1} ∈ {    }          -- 2 minute sample
        EVENT[id4] occurrences ∈ {0..1} ∈ {    }          -- 3 minute sample
    }
```
====

The following example expresses a constraint on instances of `GROUP` such that for `GROUPs` representing tribes, clubs and families, there can only be one "head", but there may be many members.

====
at-coded ADL2::
+
```cadl
    GROUP[at0102] ∈ {
        kind ∈ {/tribe|family|club/}
        members cardinality ∈ {*} ∈ {
            PERSON[at0103] occurrences ∈ {1} ∈ {
                title ∈ {"head"}
                -- etc --
            }
            PERSON[at0104] occurrences ∈ {0..*} ∈ {
                title ∈ {"member"}
                -- etc --
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    GROUP[id103] ∈ {
        kind ∈ {/tribe|family|club/}
        members cardinality ∈ {*} ∈ {
            PERSON[id104] occurrences ∈ {1} ∈ {
                title ∈ {"head"}
                -- etc --
            }
            PERSON[id105] occurrences ∈ {0..*} ∈ {
                title ∈ {"member"}
                -- etc --
            }
        }
    }
```
====

The first `occurrences` constraint indicates that a `PERSON` with the title `"head"` is mandatory in the `GROUP` , while the second indicates that at runtime, instances of `PERSON` with the title `"member"` can number from none to many. Occurrences may take the value of any range including `{0..\*}`, meaning that any number of instances of the given type may appear in data, each conforming to the one constraint block in the archetype. A single positive integer, or the infinity indicator, may also be used on its own, thus: `{2}` , `{*}` . A range of `{0..0}` or `{0}` indicates that no occurrences of this object are allowed in this archetype. If no occurrences constraint is stated, the occurrences of the object is define by the underlying reference model.

An *occurrences constraint* may appear directly after the type name of any object constraint within a container attribute, in order to indicate how many times data objects conforming to the block may occur in the data.

Where cardinality constraints are used (remembering that occurrences is always there by default, if not explicitly specified), cardinality and occurrences must always be compatible. The rules for this are formally stated in the Archetype Object Model specification. The key elements of these rules are as follows:

* where a cardinality constraint is stated with a finite upper bound:
** any child object with either stated occurrences with an open upper bound (typically `0..\*` or `1..*`) or else inferred occurrences (`0..*`) is legal, since the occurrences open upper bound is interpreted to mean the maximum value allowed by the cardinality upper bound.
** the sum of all child object occurrences lower bounds must be less than the cardinality upper bound;
* no 'orphans': at least one instance of an optional child object (occurrences lower bound = 0), and one instance of every mandatory child object (occurrences lower bound > 0) must be includable within the cardinality range.

### "Any" Constraints

There are two cases where it is useful to state a completely open, or 'any', constraint. The first is when it is desired to override the existence or cardinality of a property, such as in the following:

====
at-coded ADL2::
+
```cadl
    PERSON[at0001] ∈ {
        name existence ∈ {1}
        -- etc --
    }
```

id-coded ADL2::
+
```cadl
    PERSON[id2] ∈ {
        name existence ∈ {1}
        -- etc --
    }
```
====

In the above, no further `matches {}` part is required in the statement, since no more constraints are to be stated.

The second use of "any" as a constraint value is for types, such as in the following:

====
at-coded ADL2::
+
```cadl
    ELEMENT[at0003] ∈ {          -- speed limit
        value ∈ {
            DV_QUANTITY[at9001]  -- type was 'DATA_VALUE' in RM
        }
    }
```

id-coded ADL2::
+
```cadl
    ELEMENT[id4] ∈ {          -- speed limit
        value ∈ {
            DV_QUANTITY[id5]  -- type was 'DATA_VALUE' in RM
        }
    }
```
====

The meaning of this constraint is that in the data at runtime, the `_value_` property of `ELEMENT` must be of type `DV_QUANTITY` , but can have any value internally. This is most useful for constraining objects to be of a certain type, without further constraining value, and is especially useful where the information model contains subtyping, and there is a need to restrict data to be of certain subtypes in certain contexts.

*Deprecated*: In ADL 1.4, 'any' constraints were represented with an additional `matches {*}` at the end of the statement. This is deprecated. It is recommended that parsers silently accept this form, but output the modern ADL 2 form.

### Reference Model Type Matching

All cADL object constraints state a type name from an underlying reference model. Lexically speaking, this may be an abstract class name, a concrete class name or a generic type name, if the RM in question supports generic (template) types. In the latter case, the type name is constructed from RM class names, according to the standard generic type name syntax used in UML and mainstream languages such as C++, Java, C# and so on, i.e. using the characters `<>`, `,` and space(s). Additionally, matching of type names is case-insensitive, and whitespace is ignored. Thus, `"SECTION"` in the archetype is assumed to match a data instance whose type is `SECTION` or `Section`; `"Interval<Quantity>"` in the archetype is assumed to match a data instance whose RM type is `INTERVAL <QUANTITY>`.

NOTE: direct matching of so-called CamelCase by Snake_case or SCREAMING_SNAKE_CASE and vice-versa is not assumed, but could be enabled by a switch in tools.

In semantic terms, the data item conforming to the archetype constraint can be of any concrete type from the reference model (i.e. class name or derived generic type as above) that _conforms_ to the type mentioned in the constraint, i.e. the same type if it is concrete, or any subtype. Correctly evaluating data/archetype conformance is up to tools to implement, and requires access to a formal description of the reference model.

The precise specification of RM type matching is given in the section {openehr_am_aom2}#_rm_type_name_and_reference_model_type_matching[Rm_type_name and reference model type matching^] of the AOM2 specification.

#### Narrowed Subtype Constraints

One of the consequences of subtype-based type matching is that semantics are needed for when more than one reference model subtype is declared under the same attribute node in cADL. Consider the reference model inheritance structure shown below, in which the abstract `PARTY` class has abstract and concrete descendants including `ACTOR`, `ROLE`, and so on.

.Reference Model Sub-type Hierarchy
image::UML/diagrams/AM-example-demographics-parties.svg[id=ADL-demographics-parties, align="center"]

The following cADL statement defines an instance space that includes instances of any of the concrete subtypes of the `PARTY` class within an instance of the class `XXXX` in the figure (the ellipsis indicates particular constraints not shown here).

====
at-coded ADL2::
+
```cadl
    counter_party ∈ {
        PARTY[at0003] ∈ { ... }
    }
```

id-coded ADL2::
+
```cadl
    counter_party ∈ {
        PARTY[id4] ∈ { ... }
    }
```
====

However, in some circumstances, it may be desirable to define a constraint that will match a particular subtype in a specific way, while other subtypes are matched by the more general rule. Under a single-valued attribute, this can be done as follows:

====
at-coded ADL2::
+
```cadl
    counter_party ∈ {
        PARTY[at0003] ∈ { ... }
        PERSON[at0004] ∈ {
            date_of_birth ∈ { ... }
        }
    }
```

id-coded ADL2::
+
```cadl
    counter_party ∈ {
        PARTY[id4] ∈ { ... }
        PERSON[id5] ∈ {
            date_of_birth ∈ { ... }
        }
    }
```
====

This cADL text says that the instance value of the `_counter_party_` attribute in the data can either be a `PERSON` object matching the `PERSON` block, with a `_date_of_birth_` matching the given range, or else any other kind of `PARTY` object.

Under a multiply-valued attribute, the alternative subtypes are included as identified child members. The following example illustrates a constraint on the `_counter_parties_` attribute of instances of the class `YYYY` in <<ADL-demographics-parties>>.

====
at-coded ADL2::
+
```cadl
    counter_parties ∈ {
        PERSON[at0003] ∈ {
            date_of_birth ∈ { ... }
        }
        ORGANISATION[at0004] ∈ {
            date_of_registration ∈ { ... }
        }
        PARTY[at0005] ∈ { ... }
    }
```

id-coded ADL2::
+
```cadl
    counter_parties ∈ {
        PERSON[id4] ∈ {
            date_of_birth ∈ { ... }
        }
        ORGANISATION[id5] ∈ {
            date_of_registration ∈ { ... }
        }
        PARTY[id6] ∈ { ... }
    }
```
====

The above says that `ORGANISATION` and `PERSON` instances in the data must match, respectively, the `ORGANISATION` and `PERSON` constraints stated above, while an instance of any other subtype of `PARTY` must match the `PARTY` constraint.

#### Remove Specified Subtypes

In some cases it is required to remove some subtypes altogether. This is achieved by stating a constraint on the specific subtypes with `occurrences` limited to zero. The following example matches any `PARTY` instance with the exception of instances of `COMPANY` or `GROUP` subtypes.

====
at-coded ADL2::
+
```cadl
    counter_party ∈ {
        PARTY[at0003] ∈ { ... }
        COMPANY[at0004] occurrences ∈ {0}
        GROUP[at0005] occurrences ∈ {0}
    }
```

id-coded ADL2::
+
```cadl
    counter_party ∈ {
        PARTY[id4] ∈ { ... }
        COMPANY[id5] occurrences ∈ {0}
        GROUP[id6] occurrences ∈ {0}
    }
```
====

### Paths

#### Archetype Path Formation

The use of identified object nodes allows the formation of archetype paths, which can be used to unambiguously reference object nodes within the same archetype or within a specialised child. The syntax of archetype paths is designed to be close to the W3C Xpath syntax, and can be directly converted to it for use in XML.

Archetype paths are paths extracted from the definition section of an archetype, and refer to object nodes within the definition. A path is constructed as a concatenation of '/' characters and attribute names, with the latter including node identifiers as predicates where required for disambiguation.

In the following example, the `PERSON` constraint node is the sole object constraint under the single-valued attribute manager:

====
at-coded ADL2::
+
```cadl
    manager ∈ {
        PERSON[at0103] ∈ {
            title ∈ {"head of finance", "head of engineering"}
        }
    }


```
Two valid paths to the object under the `_title_` attribute are possible:

    manager[at0103]/title
    manager/title

id-coded ADL2::
+
```cadl
    manager ∈ {
        PERSON[id104] ∈ {
            title ∈ {"head of finance", "head of engineering"}
        }
    }
```
Two valid paths to the object under the `_title_` attribute are possible:

    manager[id104]/title
    manager/title
====

Where there is more than one sibling node, node identifiers must be used to ensure unique referencing:

====
at-coded ADL2::
+
```cadl
    employees ∈ {
        PERSON[at0103] ∈ {
            title ∈ {"head"}
        }
        PERSON[at0104] matches {
            title ∈ {"member"}
        }
    }
```
The paths to the respective `_title_` attributes are now:

    employees[at0103]/title
    employees[at0104]/title

id-coded ADL2::
+
```cadl
    employees ∈ {
        PERSON[id104] ∈ {
            title ∈ {"head"}
        }
        PERSON[id105] matches {
            title ∈ {"member"}
        }
    }
```
The paths to the respective `_title_` attributes are now:

    employees[id104]/title
    employees[id105]/title
====

The following provides another example:

====
at-coded ADL2::
+
```cadl
    HISTORY[at0000] occurrences ∈ {1} ∈ {
        periodic ∈ {False}
        events cardinality ∈ {*} ∈ {
            EVENT[at0001] occurrences ∈ {0..1} ∈ {    }           -- 1 min sample
            EVENT[at0002] occurrences ∈ {0..1} ∈ {    }           -- 2 min sample
            EVENT[at0003] occurrences ∈ {0..1} ∈ {    }           -- 3 min sample
        }
    }
```
The following paths can be constructed:

    /                      -- the HISTORY (root) object
    /periodic              -- the HISTORY.periodic attribute
    /events[at0001]        -- the 1 minute event object
    /events[at0002]        -- the 2 minute event object
    /events[at0003]        -- the 3 minute event object

id-coded ADL2::
+
```cadl
    HISTORY[id1] occurrences ∈ {1} ∈ {
        periodic ∈ {False}
        events cardinality ∈ {*} ∈ {
            EVENT[id2] occurrences ∈ {0..1} ∈ {    }           -- 1 min sample
            EVENT[id3] occurrences ∈ {0..1} ∈ {    }           -- 2 min sample
            EVENT[id4] occurrences ∈ {0..1} ∈ {    }           -- 3 min sample
        }
    }
```
The following paths can be constructed:

    /                      -- the HISTORY (root) object
    /periodic              -- the HISTORY.periodic attribute
    /events[id2]           -- the 1 minute event object
    /events[id3]           -- the 2 minute event object
    /events[id4]           -- the 3 minute event object
====

The above paths can all be used to reference the relevant nodes within the archetype in which they are defined, or within any specialised child archetype.

Paths used in cADL are expressed in the ADL path syntax, described in detail in <<ADL Paths>>. ADL paths have the same alternating object/attribute structure implied in the general hierarchical structure of cADL, obeying the pattern `TYPE/attribute/TYPE/attribute/` ... .

The examples above are _physical_ paths because they refer to object nodes using node identifier codes such as 'at0003' ('id4'). Physical paths can be rendered as _logical_ paths by adding the code meanings from the `terminology` section as annotations for node identifiers, if defined. Thus, the following two paths might be equivalent:

====
at-coded ADL2::
+
```
    /events[at0003]                       -- the 3 minute event object
    /events[at0003|3 minute event|]       -- the 3 minute event object
```

id-coded ADL2::
+
```
    /events[id4]                       -- the 3 minute event object
    /events[id4|3 minute event|]       -- the 3 minute event object
```
====

The double-bar ('|xxx|') method of displaying annotations on codes is adopted from the {snomed_ct}[SNOMED CT medical terminology^] and is widely used in the healthcare domain.

#### External Use of Paths

None of the paths shown above are valid outside the cADL text in which they occur, since they do not include an identifier of the enclosing artefact, normally an archetype. To reference a cADL node in an archetype from elsewhere (e.g. another archetype or a template), the identifier of the containing itself must be prefixed to the path, as in the following example:

====
at-coded ADL2::
+
```
    [openehr-ehr-entry.apgar-result.v]/events[at0001]
```

id-coded ADL2::
+
```
    [openehr-ehr-entry.apgar-result.v]/events[id2]
```
====

This kind of path expression is necessary to form the paths that occur when archetypes are composed to form larger structures.

#### Runtime Paths

Paths for use with runtime data based on an archetype can be constructed in the same way as the paths from the archetype, and are the same except for single-valued attributes. Since in data only a single instance can appear as the value of a single-valued attribute, there is never any ambiguity in referencing it, whereas an archetype path to or through the same attribute may require a node identifier due to the possible presence of multiple alternatives. Consider the example from above:

====
at-coded ADL2::
+
```cadl
    items cardinality matches {*} matches {
        ELEMENT[at0003] matches {  -- speed limit
            value matches {
                DV_QUANTITY[at9001] matches {                       -- miles per hour
                    magnitude matches {|0..55|}
                    property matches {"velocity"}
                    units matches {"mph"}
                }
                DV_QUANTITY[at9002] matches {                       -- km per hour
                    magnitude matches {|0..100|}
                    property matches {"velocity"}
                    units matches {"km/h"}
                }
            }
        }
    }
```
+
The following archetype paths can be constructed:
+
    items[at0003]/value[at9001]
    items[at0003]/value[at9002]
+
For instance data created according to this archetype, the following runtime path can be used:
+
    items[at0003]/value               -- since there is only one DV_QUANTITY in the data

id-coded ADL2::
+
```cadl
    items cardinality matches {*} matches {
        ELEMENT[id4] matches {  -- speed limit
            value matches {
                DV_QUANTITY[id22] matches {                       -- miles per hour
                    magnitude matches {|0..55|}
                    property matches {"velocity"}
                    units matches {"mph"}
                }
                DV_QUANTITY[id23] matches {                       -- km per hour
                    magnitude matches {|0..100|}
                    property matches {"velocity"}
                    units matches {"km/h"}
                }
            }
        }
    }
```
+
The following archetype paths can be constructed:
+
    items[id4]/value[id22]
    items[id4]/value[id23]
+
For instance data created according to this archetype, the following runtime path can be used:
+
   items[id4]/value               -- since there is only one DV_QUANTITY in the data
====

A query using this path will match the data regardless of which type of `DV_QUANTITY` object is there. However, in some circumstances, queries may need to be specific, in which case they will use the full archetype path, i.e. `items[at0003]/value[at9001]` (`items[id4]/value[id22]`) or `items[at0003]/value[at9002]` (`items[id4]/value[id23]`) to select only 'miles' or 'kilometres' data. This will only work if the node ids (at/id-codes) are in fact stored in all types of the reference model data.
If for example this was not the case with the `DV_QUANTITY` type (as in openEHR reference model), another facet of the `DV_QUANTITY` objects from the archetype such as 'units = "km/h"' would need to be used in the query to correctly locate only metric `DV_QUANTITY` objects.

### Internal References (Proxy Constraint Objects)

It is possible to define a constraint structure at a certain point to be the same as a structure defined elsewhere in the archetype, rather than copying the desired structure. This is achieved using a proxy constraint object, using the following syntax:

====
at-coded ADL2::
+
```cadl
    use_node TYPE[atNNNN] archetype_path
```

id-coded ADL2::
+

```cadl
    use_node TYPE[idN] archetype_path
```
====

This statement defines a node of type `TYPE`, whose definition is the same as the one found at path `archetype_path`. The type mentioned in the `use_node` reference must always be the same type as the referenced type.

The path must not be in the parent path of the proxy object itself, but may be a sibling of the proxy object. The sibling case is a special case, and the meaning of the proxy constraint is that the target object's children should be re-used, but not the target itself (since that would illegally create two siblings with the same identifier). The general case is that the proxy object and target object locations are different, and the meaning is that the proxy object is logically replaced by a deep copy of the target object. (In theory the sibling case could be banned, and proxies defined one level further down with targets of the children of the originally intended target, but this creates inconvenience for the archetype author, and can easily be dealt with in tools).

Occurrences from the target are also assumed, or may be explicitly overridden:

====
at-coded ADL2::
+
```cadl
    use_node TYPE[at0003] occurrences ∈ {0..1} archetype_path
```

id-coded ADL2::
+

```cadl
    use_node TYPE[id4] occurrences ∈ {0..1} archetype_path
```
====

Proxy objects provide an internal reuse mechanism. Specialised archetypes may redefine structures on such nodes as if they had been defined inline. This is described in more detail in <<Internal Reference (Proxy Object) Redefinition>>.

A proxy constraint object allows object constraints defined elsewhere to be re-used within the same archetype or a specialised child.

The following example shows the definitions of the `ADDRESS` nodes for phone, fax and email for a home `CONTACT` being reused for a work `CONTACT` .

====
at-coded ADL2::
+
```cadl
    PERSON[at0000] ∈ {
        identities ∈ {
            -- etc --
        }
        contacts cardinality ∈ {0..*} ∈ {
            CONTACT[at0001] ∈ {      -- home address
                purpose ∈ {...}
                addresses ∈ {...}
            }
            CONTACT[at0002] ∈ {      -- postal address
                purpose ∈ {...}
                addresses ∈ {...}
            }
            CONTACT[at0003] ∈ {      -- home contact
                purpose ∈ {...}
                addresses cardinality ∈ {0..*} ∈ {
                    ADDRESS[at0004] ∈ {                            -- phone
                        type ∈ {...}
                        details ∈ {...}
                    }
                    ADDRESS[at0005] ∈ {                            -- fax
                        type ∈ {...}
                        details ∈ {...}
                    }
                    ADDRESS[at0006] ∈ {                            -- email
                        type ∈ {...}
                        details ∈ {...}
                    }
                }
            }
            CONTACT[at0007] ∈ {                                    -- work contact
                purpose ∈ {...}
                addresses cardinality ∈ {0..*} ∈ {
                    use_node ADDRESS[at0008] /contacts[at0003]/addresses[at0004]   -- phone
                    use_node ADDRESS[at0009] /contacts[at0003]/addresses[at0005]   -- fax
                    use_node ADDRESS[at0010] /contacts[at0003]/addresses[at0006]   -- email
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    PERSON[id1] ∈ {
        identities ∈ {
            -- etc --
        }
        contacts cardinality ∈ {0..*} ∈ {
            CONTACT[id2] ∈ {      -- home address
                purpose ∈ {...}
                addresses ∈ {...}
            }
            CONTACT[id3] ∈ {      -- postal address
                purpose ∈ {...}
                addresses ∈ {...}
            }
            CONTACT[id4] ∈ {      -- home contact
                purpose ∈ {...}
                addresses cardinality ∈ {0..*} ∈ {
                    ADDRESS[id5] ∈ {                            -- phone
                        type ∈ {...}
                        details ∈ {...}
                    }
                    ADDRESS[id6] ∈ {                            -- fax
                        type ∈ {...}
                        details ∈ {...}
                    }
                    ADDRESS[id7] ∈ {                            -- email
                        type ∈ {...}
                        details ∈ {...}
                    }
                }
            }
            CONTACT[id8] ∈ {                                    -- work contact
                purpose ∈ {...}
                addresses cardinality ∈ {0..*} ∈ {
                    use_node ADDRESS[id9] /contacts[id4]/addresses[id5]    -- phone
                    use_node ADDRESS[id10] /contacts[id4]/addresses[id6]   -- fax
                    use_node ADDRESS[id11] /contacts[id4]/addresses[id7]   -- email
                }
            }
        }
    }
```
====

The following example shows the occurrences being overridden in the referring node, to enable the specification for 'phone' to be re-used, but with a different occurrences constraint.

====
at-coded ADL2::
+
```cadl
    PERSON[at0000] ∈ {
        contacts cardinality ∈ {0..*} ∈ {
            CONTACT[at0003] ∈ {                                  -- home contact
                addresses cardinality ∈ {0..*} ∈ {
                    ADDRESS[at0004] occurrences ∈ {1} ∈ { ...}   -- phone
                }
            }
            CONTACT[at0007] ∈ {                                  -- work contact
                addresses cardinality ∈ {0..*} ∈ {
                    use_node ADDRESS[at0008] occurrences ∈ {0..*} /contacts[at0003]/addresses[at0004]      -- phone
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    PERSON[id1] ∈ {
        contacts cardinality ∈ {0..*} ∈ {
            CONTACT[id4] ∈ {                                  -- home contact
                addresses cardinality ∈ {0..*} ∈ {
                    ADDRESS[id5] occurrences ∈ {1} ∈ { ...}   -- phone
                }
            }
            CONTACT[id8] ∈ {                                  -- work contact
                addresses cardinality ∈ {0..*} ∈ {
                    use_node ADDRESS[id9] occurrences ∈ {0..*} /contacts[id4]/addresses[id5]      -- phone
                }
            }
        }
    }
```
====

#### Paths and Proxy Objects

In forming paths through the proxy and to nodes below the target, two cases can be identified:

* if the proxy object is a sibling of the target object, the proxy object node identifier is used in paths, and the node id of the target object is not;
* otherwise, paths are formed using the identifier from the proxy target object.

### External References

Another kind of reference in an archetype is to another archetype. There are two ways this can be done: using a direct reference, and using an archetype 'slot'. The first is used when the need is to refer to one specific archetype (or to a template from another template), while the second is a constraint that allows for various archetypes matching specified criteria to be used. The slot concept is described in the next section.

An external reference defines a fixed compositional connection between two archetypes.

Direct references, or external references as they will be denoted here occur for two main reasons: re-use and templating. In the first case, an archetype has originally been built using inline constraints when it is discovered that another archetype contains the same or very similar inline constraints at a similar point. As would be normal in software design, a refactoring exercise is conducted that results in the common part being created as its own, new archetype, and both original archetypes 'referring' to it. They do this using an external reference, which has syntax of the form:

====
at-coded ADL2::
+
```
    use_archetype TYPE[atNNNN, archetype_id] <occurrences constraint>
```

id-coded ADL2::
+
```
    use_archetype TYPE[idN, archetype_id] <occurrences constraint>
```
====

In the above, the `archetype_id` is included with the usual archetype node identifier (at-code/id-code). The usual occurrence constraints can be applied at the end.

The following example shows sections of two parent archetypes both referring to the same child archetype. The first section is from an openEHR `INSTRUCTION` archetype to do with a medication order.

====
at-coded ADL2::
+
```cadl
    INSTRUCTION[at0000] ∈ {                                       -- Medication order
        activities cardinality ∈ {0..*; unordered} ∈ {
            ACTIVITY[at0001] ∈ {                                  -- Medication activity
                action_archetype_id ∈ {/openEHR-EHR-ACTION\.medication\.v1/}
                description ∈ {
                    use_archetype ITEM_TREE[at0002, openEHR-EHR-ITEM_TREE.medication.v1]
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    INSTRUCTION[id1] ∈ {                                       -- Medication order
        activities cardinality ∈ {0..*; unordered} ∈ {
            ACTIVITY[id2] ∈ {                                  -- Medication activity
                action_archetype_id ∈ {/openEHR-EHR-ACTION\.medication\.v1/}
                description ∈ {
                    use_archetype ITEM_TREE[id3, openEHR-EHR-ITEM_TREE.medication.v1]
                }
            }
        }
    }
```
====

This section is from an openEHR `ACTION` archetype defining medication administration actions.

====
at-coded ADL2::
+
```cadl
    ACTION[at0000] ∈ {                          -- Medication action
        ism_transition ∈ {
            ISM_TRANSITION[at0001] ∈ { ... }
            -- ...
        }
        description ∈ {
            use_archetype ITEM_TREE[at0002, openEHR-EHR-ITEM_TREE.medication.v1]
        }
    }
```

id-coded ADL2::
+
```cadl
    ACTION[id1] ∈ {                          -- Medication action
        ism_transition ∈ {
            ISM_TRANSITION[id2] ∈ { ... }
            -- ...
        }
        description ∈ {
            use_archetype ITEM_TREE[id3, openEHR-EHR-ITEM_TREE.medication.v1]
        }
    }
```
====

Each of these archetypes refers to the openEHR `ITEM_TREE` archetype `openEHR-EHR-ITEM_TREE.medication.v1` , which is a normal archetype describing medication.

Following the standard object-oriented semantics of type substitutability, and also the ontological subsumption notion, specialisations of the referenced archetype (including templates) are also valid substitutions at design or runtime. At design time, this takes the form of a redefinition, e.g.:

====
at-coded ADL2::
+
```cadl
    description ∈ {
        use_archetype ITEM_TREE[at0002.1, openEHR-EHR-ITEM_TREE.vaccine.v1]
    }
```

id-coded ADL2::
+
```cadl
    description ∈ {
        use_archetype ITEM_TREE[id3.1, openEHR-EHR-ITEM_TREE.vaccine.v1]
    }
```
====

where the 'vaccine' archetype is a specialisation of the 'medication' archetype. Redefinitions of this kind are described in more detail in <<External Reference Redefinition>>.

External references can of course also be defined under container attributes.

The second use of external references is typically in templates, to specify an archetype or sub-template of a template for an attribute where no slot has been defined. This use is described in <<Unconstrained Attributes>>.

#### Paths

Paths that terminate in external reference nodes in source-form archetypes will include only the at-codes (id-codes), as in the following examples:

====
at-coded ADL2::
+
```cadl
    /activities[at0001]/description[at0002]
    /description[at0001]
```

id-coded ADL2::
+
```cadl
    /activities[id2]/description[id3]
    /description[id2]
```
====

However, in flattened archetypes, the corresponding paths will include the archetype identifier(s) rather than the at-codes (id-codes), and may continue down through the structure of the included archetypes, as in the following example.

====
at-coded ADL2::
+
```cadl
    /activities[at0001]/description[openEHR-EHR-ITEM_TREE.medication.v1]/...
    /description[openEHR-EHR-ITEM_TREE.medication.v1]/...
```

id-coded ADL2::
+
```cadl
    /activities[id2]/description[openEHR-EHR-ITEM_TREE.medication.v1]/...
    /description[openEHR-EHR-ITEM_TREE.medication.v1]/...
```
====

### Archetype Slots

At any point in a cADL definition, a constraint can be defined that allows other archetypes to be used, rather than defining the desired constraints inline. This is known as an archetype 'slot', i.e. a connection point whose allowable 'fillers' are constrained by a set of statements, written in the {openehr_expression_language}[openEHR Expression Language^].

An archetype slot defines a constrained compositional chaining point in an archetype at which other archetypes can be inserted, if they are in the set defined by the slot constraint.

An archetype slot is introduced with the keyword `allow_archetype` and defined in terms of two lists of assertion statements defining which archetypes are allowed and/or which are excluded from filling that slot, introduced with the keywords `include` and `exclude` , respectively. The following example illustrates the general form of an archetype slot.

====
at-coded ADL2::
+
```cadl
    allow_archetype SECTION[at0004] occurrences ∈ {0..*} ∈ {
        include
            -- constraints for inclusion
        exclude
            -- constraints for exclusion
    }
```

id-coded ADL2::
+
```cadl
    allow_archetype SECTION[id5] occurrences ∈ {0..*} ∈ {
        include
            -- constraints for inclusion
        exclude
            -- constraints for exclusion
    }
```
====

A slot constraint evaluates to a set of archetype identifiers from whatever is considered in the current model environment to be the total available set of archetypes.

The simplest possible slot has no includes or excludes, and effectively imposes no constraint. However, it is allowed in order to enable authoring tools to create a slot whose actual constraint definition will be defined at a later point in time.

A slot is designed to be 'filled', i.e. to have one of the allowed archetypes chosen for use. This is done in a child archetype, almost always a template. A slot can also be 'closed', meaning no further fillers can be added.

The actual specification of slot fillers, and also the 'closing' of slots is done in specialised archetypes, and is described in <<Slot Filling and Redefinition>>, in the chapter on specialisation.

#### Formal Semantics of include and exclude Constraints

The semantics of the `include` and `exclude` lists are somewhat subtle. They are as follows:

* The meaning of the 'set of all archetypes' in any given environment is evaluable (and evaluated) to a finite set consisting of all archetypes available within the current archetype Library, not some notional virtual / global set of archetypes, or theoretical possible set.
* Either the `include` or `exclude` constraint, but not both, may be 'substantive', i.e. define a particular set of archetypes that would be matched within a given slot, or 'open', i.e. matching all possible archetypes.
* A slot constraint may consist of a single `include` or `exclude` constraint, or of an `include` / `exclude` pair.
* If an `include` or `exclude` constraint is present on its own, it is understood as a recommendation, i.e. it does not constitute a formal constraint for matching or exclusion, but tools and applications may use the recommended match set in an intelligent way. The result set for such an `include` or `exclude` is the whole current archetype set.
* If a substantive `include` or `exclude` constraint is present with a corresponding open `exclude` or `include` , respectively, the substantive constraint is considered formally binding.

The meaning of the slot constraint overall is that only archetypes matching the `include` constraint are allowed, and no others. The same logic applies in the reverse sense when the `exclude` constraint is substantive.

#### Slots based on Lexical Archetype Identifiers

In this kind of slot constraint, the core expression type is of the following form:

```cadl
    archetype_id/value ∈ {/openEHR-EHR-\.SECTION\..*\..*/}
```

where `_archetype_id/value_` stands for the literal String value of the archetype identifier, and the regular expression is recognised as occurring between two slash delimiters (//).

The following example shows how the "Objective" `SECTION` in a problem/SOAP headings archetype defines two slots, indicating which `OBSERVATION` and `SECTION` archetypes are allowed and excluded under the `_items_` property.

====
at-coded ADL2::
+
```cadl
    SECTION [at0000] occurrences ∈ {0..1} ∈ {                      -- objective
        items cardinality ∈ {0..*} ∈ {
            allow_archetype SECTION[at0001] occurrences ∈ {0..*} ∈ {
                include
                    archetype_id/value ∈ {/.*/}
                exclude
                    archetype_id/value ∈ {/openEHR-EHR-SECTION\.patient_details\..+/}
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    SECTION [id1] occurrences ∈ {0..1} ∈ {                      -- objective
        items cardinality ∈ {0..*} ∈ {
            allow_archetype SECTION[id2] occurrences ∈ {0..*} ∈ {
                include
                    archetype_id/value ∈ {/.*/}
                exclude
                    archetype_id/value ∈ {/openEHR-EHR-SECTION\.patient_details\..+/}
            }
        }
    }
```
====

Here, every constraint inside the block starting on an `allow_archetype` line contains constraints that must be met by archetypes in order to fill the slot. In the examples above, the constraints are in the form of regular expressions on archetype identifiers. In cADL, the PERL regular expression syntax is assumed.

There are two ways in which `_archetype_id_` regular expressions patterns can be used:

* as a pattern against which to test a particular archetype identifier being proposed for that slot;
* as a pattern to use against a population of archetypes (e.g. all archetypes in a particular repository) in order to generate a list of all possible archetypes for filling the slot.

Due to the second use, it is required that the regular expression pattern always cover a full archetype identifier rather than only sub-parts. As a consequence, a 'meta-pattern' can be defined to check `_archetype_id_` regular expressions for validity:

```
    ^.+-.+-.+\..*\..+$
```

Because identifier matching is an inherently lexical operation, subtypes of mentioned types are not matched unless explicitly stated. Consider the following example:

====
at-coded ADL2::
+
```cadl
    allow_archetype ENTRY[at0001] ∈ {    -- any kind of ENTRY
        include
            archetype_id/value ∈ {/openEHR-EHR-ENTRY..+\.v1/}
    }
```

id-coded ADL2::
+
```cadl
    allow_archetype ENTRY[id2] ∈ {    -- any kind of ENTRY
        include
            archetype_id/value ∈ {/openEHR-EHR-ENTRY..+\.v1/}
    }
```
====

The intention is to allow any kind of `ENTRY` , but the above constraint won't have the desired effect, because the pattern `openEHR-EHR-ENTRY` is unlikely to match any actual archetypes. Instead the following kind of constraint should be used:

====
at-coded ADL2::
+
```cadl
    allow_archetype ENTRY[at0001] ∈ {    -- any kind of ENTRY
        include
            archetype_id/value ∈ {/openEHR-EHR-EVALUATION\..+\.v1|openEHR-EHR-OBSERVATION\..+\.v1/}
    }
```

id-coded ADL2::
+
```cadl
    allow_archetype ENTRY[id2] ∈ {    -- any kind of ENTRY
        include
            archetype_id/value ∈ {/openEHR-EHR-EVALUATION\..+\.v1|openEHR-EHR-OBSERVATION\..+\.v1/}
    }
```
====

The above would allow any `EVALUATION` and any `OBSERVATION` archetypes to be used in the slot. Note that since no exclude clause was used, the above slot definition constitutes a recommendation. To make it a hard constraint, the following would be needed:

====
at-coded ADL2::
+
```cadl
    allow_archetype ENTRY[at0001] ∈ {    -- any kind of ENTRY
        include
            archetype_id/value ∈ {/openEHR-EHR-EVALUATION\..+\.v1|openEHR-EHR-OBSERVATION\..+\.v1/}
        exclude
            archetype_id/value ∈ {/.*/}
    }
```

id-coded ADL2::
+
```cadl
    allow_archetype ENTRY[id2] ∈ {    -- any kind of ENTRY
        include
            archetype_id/value ∈ {/openEHR-EHR-EVALUATION\..+\.v1|openEHR-EHR-OBSERVATION\..+\.v1/}
        exclude
            archetype_id/value ∈ {/.*/}
    }
```
====

#### Slots based on other Constraints

Other constraints are possible as well, including that the allowed archetype must contain a certain keyword, or a certain path. The latter allows archetypes to be linked together on the basis of content. For example, under a "genetic relatives" heading in a Family History Organiser archetype, the following slot constraint might be used:

====
at-coded ADL2::
+
```cadl
    allow_archetype EVALUATION[at0001] occurrences ∈ {0..*} matches {
        include
            archetype_id ∈ {/openEHR-EHR-EVALUATION.family_history.v1/}
                ∧ ∃ /subject/relationship/defining_code ->
                ∼ ( [openehr::0] ∈ /subject/relationship/defining_code) -- self
    }
```

id-coded ADL2::
+
```cadl
    allow_archetype EVALUATION[id2] occurrences ∈ {0..*} matches {
        include
            archetype_id ∈ {/openEHR-EHR-EVALUATION.family_history.v1/}
                ∧ ∃ /subject/relationship/defining_code ->
                ∼ ( [openehr::0] ∈ /subject/relationship/defining_code) -- self
    }
```
====

This says that the slot allows archetypes on the `EVALUATION` class, which either have as their concept 'family_history' or, if there is a constraint on the subject relationship, then it may not include the code `[openehr::0]` (the openEHR term for "self") - i.e. it must be an archetype designed for family members rather than the subject of care his/herself.

#### Slot-filling

Slots are 'filled' in specialised archetypes or templates by the use of use_archetype statements, i.e. the same construct as for an external reference described above. The typical form of a filled slot is as follows:

====
at-coded ADL2::
+
```cadl
    SECTION[at0000] ∈ {    -- Past history
        /items ∈ {
            use_archetype EVALUATION[id2, org.openehr::openEHR-EHR-EVALUATION.problem.v1]
            use_archetype EVALUATION[id2, org.openehr::openEHR-EHR-EVALUATION.clin_synopsis.v1]
        }
    }
```

id-coded ADL2::
+
```cadl
    SECTION[id1] ∈ {    -- Past history
        /items ∈ {
            use_archetype EVALUATION[id2, org.openehr::openEHR-EHR-EVALUATION.problem.v1]
            use_archetype EVALUATION[id2, org.openehr::openEHR-EHR-EVALUATION.clin_synopsis.v1]
        }
    }
```
====

In ADL, slot-filling is considered a kind of specialisation of a slot, which enables slots to be filled by the same mechanism as any other kind of specialisation found in a child archetype. Slot-filling and other forms of slot redefinition are described in more detail in <<Slot Filling and Redefinition>>.

### Mixed Structures

Four types of structure representing constraints on reference model objects have been presented so far:

complex object structures:: any node introduced by a type name and followed by {} containing constraints on attributes;
internal references:: any node introduced by the keyword `use_node` , followed by a type name; such nodes indicate re-use of a complex object constraint that has already been expressed elsewhere in the archetype;
archetype slots:: any node introduced by the keyword `allow_archetype` , followed by a type name; such nodes indicate a complex object constraint which is expressed in some other archetype;
value set constraints:: any node whose constraint is of the form `[acN]` .

Under any given attribute node, any combination of these object constraint types can co-exist, as in the following example:

====
at-coded ADL2::
+
```cadl
    SECTION[at19999] ∈ {
        items cardinality ∈ {0..*; ordered} ∈ {
            ENTRY[at2000] ∈ {...}
            allow_archetype ENTRY[at2001] ∈ {...}
            use_node ENTRY[at2002] /some_path[at0003]
            ENTRY[at2003] ∈ {...}
            use_node ENTRY[at2004] /some_path[at1011]
            use_node ENTRY[at2005] /some_path[at1051]
            ENTRY[at2006] ∈ {...}
        }
    }
```

id-coded ADL2::
+
```cadl
    SECTION[id2000] ∈ {
        items cardinality ∈ {0..*; ordered} ∈ {
            ENTRY[id2001] ∈ {...}
            allow_archetype ENTRY[id2002] ∈ {...}
            use_node ENTRY[id2003] /some_path[id4]
            ENTRY[id2004] ∈ {...}
            use_node ENTRY[id2005] /some_path[id1012]
            use_node ENTRY[id2006] /some_path[id1052]
            ENTRY[id2007] ∈ {...}
        }
    }
```
====

Here we have a constraint on an attribute called `_items_` (of cardinality `0..*`), expressed as a series of possible constraints on objects of type `ENTRY`. The 1st, 4th and 7th are described inline; the 3rd, 5th and 6th are expressed in terms of internal references to other nodes earlier in the archetype, while the 2nd is an archetype slot, whose constraints are expressed in other archetypes matching the include/exclude constraints appearing between the braces of this node. Note also that the `ordered` keyword on the enclosing `_items_` node has been used to indicate that the list order is intended to be significant.


## Second-order Constraints

### Tuple Constraints

In realistic data, it is not uncommon to need to constrain multiple object properties that co-vary in a specific way. A simple example is the need to state range constraints on a temperature, represented as an openEHR `DV_QUANTITY` type, for both Centigrade and Fahrenheit scales. The default way to do this in ADL is as follows (the `DV_QUANTITY` class has `_property_`, `_units_` and `_magnitude_` attributes):

====
at-coded ADL2::
+
```cadl
    --
    -- basic form of constraint on a Quantity type, allowing unintended combinations
    --
    value ∈ {
        DV_QUANTITY [at9013] ∈ {
            property ∈ {[openehr::151|temperature|]}
            units ∈ {"deg F"}
            magnitude ∈ {|32.0..212.0|}
        }
        DV_QUANTITY [at9014] ∈ {
            property ∈ {[openehr::151|temperature|]}
            units ∈ {"deg C"}
            magnitude ∈ {|0.0..100.0|}
        }
    }
```

id-coded ADL2::
+
```cadl
    --
    -- basic form of constraint on a Quantity type, allowing unintended combinations
    --
    value ∈ {
        DV_QUANTITY [id14] ∈ {
            property ∈ {[openehr::151|temperature|]}
            units ∈ {"deg F"}
            magnitude ∈ {|32.0..212.0|}
        }
        DV_QUANTITY [id15] ∈ {
            property ∈ {[openehr::151|temperature|]}
            units ∈ {"deg C"}
            magnitude ∈ {|0.0..100.0|}
        }
    }
```
====

However, this is verbose, and does not clearly convey the dependence of `_units_` and `_magnitude_` on each other. What we logically want to do is to state a single constraint on a `DV_QUANTITY` that sets the `_magnitude_` range constraint dependent on the `_units_` constraint.

The covarying requirement could be met using assertions like the following in the `rules` section:

```cadl
    .../value/units = "deg F" -> magnitude ∈ {|32.0..212.0|}
    .../value/units = "deg C" -> magnitude ∈ {|0.0..100.0|}
```

However, this seems obscure for what is logically a very simple kind of constraint.

A generic solution that can be used in the main `definition` section involves treating co-varying properties formally as tuples, and providing syntax to express constraints on tuples. The following syntax achieves this:

====
at-coded ADL2::
+
```cadl
    --
    -- Tuple form of constraint on a Quantity type
    --
    value ∈ {
        DV_QUANTITY[at9013] ∈ {
            property ∈ {[openehr::151|temperature|]}
            [units, magnitude] ∈ {
                [{"deg F"}, {|32.0..212.0|}] ,
                [{"deg C"}, {|0.0..100.0|}]
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    --
    -- Tuple form of constraint on a Quantity type
    --
    value ∈ {
        DV_QUANTITY[id14] ∈ {
            property ∈ {[openehr::151|temperature|]}
            [units, magnitude] ∈ {
                [{"deg F"}, {|32.0..212.0|}] ,
                [{"deg C"}, {|0.0..100.0|}]
            }
        }
    }
```
====

The above defines constraints on `_units_` and `_magnitude_` together, as tuples such as `[{"deg F"}, {|32.0..212.0|}]` .

The brackets surrounding each leaf level constraint are needed because although such constraints are typically atomic, as above, they may also take other standard ADL forms such as a list of strings, list of integers etc. In the latter case, the ',' characters from such lists will be conflated with the ',' separator of the distinct constraints in the tuple. Use of `{}` is also logically justified: each such entity is indeed a constraint in the ADL sense, and all ADL constraints are delimited by `{}`.

The tuple form has the advantage of expressing the additional constraint that only _corresponding_ `_units_` and `_magnitude_` leaf level constraints can occur together, while other combinations like `"deg F"` and `|0.0..100.0|` would be illegal.

Another way to attempt to represent the effect of covarying constraints might be as follows, using lists of primitive values as shown below. However, there is nothing in these constraints that forces the correct associations between the `_units_` and `_magnitude_` constraints, preventing wrong combinations.

====
at-coded ADL2::
+
```cadl
    --
    -- List form of constraint on a Quantity type, also allowing unintended combinations
    --
    value ∈ {
        DV_QUANTITY[at9007] ∈ {
            property ∈ {[openehr::151|temperature|]}
            units ∈ {"deg F", "deg C"}
            magnitude ∈ {|32.0..212.0|, |0.0..100.0|}
        }
    }
```

id-coded ADL2::
+
```cadl
    --
    -- List form of constraint on a Quantity type, also allowing unintended combinations
    --
    value ∈ {
        DV_QUANTITY[id14] ∈ {
            property ∈ {[openehr::151|temperature|]}
            units ∈ {"deg F", "deg C"}
            magnitude ∈ {|32.0..212.0|, |0.0..100.0|}
        }
    }
```
====

*Deprecated*: In the openEHR ADL 1.4 Archetype Profile, a custom constrainer type `C_DV_QUANTITY` was used to provide the above constraint. However, this is specific to the Reference Model type, and does not solve similar constraints occurring in other types. This type and also the `C_DV_ORDINAL` type have been removed from ADL 2 altogether.

This same syntax will work for tuples of 3 or more co-varying properties. It does involve some extra work for compiler implementers, but this only needs to be performed once to support any use of tuple constraints, regardless of Reference Model type.

A constraint on the openEHR `DV_ORDINAL` type provides another example of the utility of ADL tuples. First, a typical ordinal constraint (a scale of pass:[+, ++, +++]) with  standard ADL:

====
at-coded ADL2::
+
```cadl
    --
    -- Basic form of constraint on an Ordinal type, allowing unintended combinations
    --
    ordinal_attr ∈ {
        DV_ORDINAL[at9001] ∈ {
            value ∈ {0}
            symbol ∈ {
                DV_CODED_TEXT[id4] ∈ {
                    code ∈ {"at1"}          -- +
                }
            }
        }
        DV_ORDINAL[at9002] ∈ {
            value ∈ {1}
            symbol ∈ {
                DV_CODED_TEXT[id6] ∈ {
                    code ∈ {"at2"}          -- ++
                        }
                    }
                }
            }
        }
        DV_ORDINAL[at9003] ∈ {
            value ∈ {2}
            symbol ∈ {
                DV_CODED_TEXT[id8] ∈ {
                    code ∈ {"at3"}         -- +++
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    --
    -- Basic form of constraint on an Ordinal type, allowing unintended combinations
    --
    ordinal_attr ∈ {
        DV_ORDINAL[id3] ∈ {
            value ∈ {0}
            symbol ∈ {
                DV_CODED_TEXT[id4] ∈ {
                    code ∈ {"at1"}          -- +
                }
            }
        }
        DV_ORDINAL[id5] ∈ {
            value ∈ {1}
            symbol ∈ {
                DV_CODED_TEXT[id6] ∈ {
                    code ∈ {"at2"}          -- ++
                        }
                    }
                }
            }
        }
        DV_ORDINAL[id7] ∈ {
            value ∈ {2}
            symbol ∈ {
                DV_CODED_TEXT[id8] ∈ {
                    code ∈ {"at3"}         -- +++
                }
            }
        }
    }
```
====

By the use of tuple constraint, almost the same thing can be achieved much more efficiently. We can write:

====
at-coded ADL2::
+
```cadl
    --
    -- Tuple form of constraint on an Ordinal type
    --
    ordinal_attr ∈ {
        DV_ORDINAL[at9006] ∈ {
            [value, symbol] ∈ {
                [{0}, {[at1]}],           -- +
                [{1}, {[at2]}],           -- ++
                [{2}, {[at3]}]            -- +++
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    --
    -- Tuple form of constraint on an Ordinal type
    --
    ordinal_attr ∈ {
        DV_ORDINAL[id3] ∈ {
            [value, symbol] ∈ {
                [{0}, {[at1]}],           -- +
                [{1}, {[at2]}],           -- ++
                [{2}, {[at3]}]            -- +++
            }
        }
    }
```
====

Deprecated: in the openEHR profiled version of ADL 1.4, a custom syntax was used, below, which is now replaced by the above generic form:

```
    --
    -- ADL 1.4
    --
    ordinal_attr ∈ {
        0|[local::at1],       -- +
        1|[local::at2],       -- ++
        2|[local::at3]        -- +++
    }
```

This hides the `DV_ORDINAL` type altogether, but as for the `C_DV_QUANTITY` example above, it was a custom solution.

#### Paths in Tuple structures

Unlike the basic form primitive constraint, tuple constraints introduce multiplicity, and as a consequence, paths to their terminal objects are no longer unique. Thus, the paths `value[at9007]/magnitude` (`value[id4]/magnitude`) in the Quantity example and `ordinal_attr[at9003]/value` (`ordinal_attr[id3]/value`) in the ordinal example could each refer to more than one primitive object.

This solved by allowing Xpath-style child numbering predicates in paths starting at 1, as shown below.

====
at-coded ADL2::
+
```cadl
value[9007]/magnitude[1]     -- refer to the constraint {|32.0..212.0|}
value[9007]/magnitude[2]     -- refer to the constraint {|0.0..100.0|}

ordinal_attr[at9006]/value[1]  -- refer to the constraint {0}
ordinal_attr[at9006]/value[2]  -- refer to the constraint {1}
ordinal_attr[at9006]/value[3]  -- refer to the constraint {2}
```

id-coded ADL2::
+
```cadl
value[id4]/magnitude[1]     -- refer to the constraint {|32.0..212.0|}
value[id4]/magnitude[2]     -- refer to the constraint {|0.0..100.0|}

ordinal_attr[id3]/value[1]  -- refer to the constraint {0}
ordinal_attr[id3]/value[2]  -- refer to the constraint {1}
ordinal_attr[id3]/value[3]  -- refer to the constraint {2}
```
====

### Group Constraints

Within a container attribute, any number of object constraints may be defined. The cardinality and occurrences constraints described above show how to control respectively, the overall container contents, and the occurrence of any particular object constraint within data. However, sometimes finer control is needed on repetition and grouping of members within the container. This can be achieved by the `group` construct, which provides an interior block where a subset of the overall container can be treated as a sub-group. The following example shows a typical used of the group construct.

====
at-coded ADL2::
+
```cadl
    ITEM_TREE[at0000] ∈ {
        items matches {
            ELEMENT[at0001] occurrences ∈ {1} ∈ {...}              -- Investigation type
            ELEMENT[at0002] occurrences ∈ {0..1} ∈ {...}           -- reason
            group cardinality ∈ {1} occurrences ∈ {0..1} ∈ {   -- Methodology
                ELEMENT[at0005] occurrences ∈ {0..1} ∈ {...}       -- as Text
                ELEMENT[at0006] occurrences ∈ {0..1} ∈ {...}       -- Coded
                CLUSTER[at0007] occurrences ∈ {0..1} ∈ {...}       -- structured
            }
            ELEMENT[at0010] occurrences ∈ {0..1} ∈ {...}          -- (other details)
            CLUSTER[at0011] occurrences ∈ {0..1} ∈ {...}          -- (other details)
        }
    }
```

id-coded ADL2::
+
```cadl
    ITEM_TREE[id1] ∈ {
        items matches {
            ELEMENT[id2] occurrences ∈ {1} ∈ {...}              -- Investigation type
            ELEMENT[id3] occurrences ∈ {0..1} ∈ {...}           -- reason
            group cardinality ∈ {1} occurrences ∈ {0..1} ∈ {   -- Methodology
                ELEMENT[id6] occurrences ∈ {0..1} ∈ {...}       -- as Text
                ELEMENT[id7] occurrences ∈ {0..1} ∈ {...}       -- Coded
                CLUSTER[id8] occurrences ∈ {0..1} ∈ {...}       -- structured
            }
            ELEMENT[id11] occurrences ∈ {0..1} ∈ {...}          -- (other details)
            CLUSTER[id12] occurrences ∈ {0..1} ∈ {...}          -- (other details)
        }
    }
```
====

NOTE: although block-style indenting is used to express group blocks, the `group` constraint is not itself a structural object node, only a pure grouping mechanism.

In the above, the group is used to state a logical choice of methodology representations, each defined by one of the three constraints within the group. The `group` construct includes both `cardinality` and `occurrences` qualifier constraints. The former indicates the size and ordering of the group, in the same way as a cardinality constraint does for the overall contents of a container attribute. The latter defines the repeatability of the group. If the group `occurrences` upper limit is above 1, it means that the sub-group may repeat, with each repetition respecting the order and size defined by the group cardinality.

A `group` constraint may be used to delimit a subset of objects within the total list of object constraints defined within a container attribute. A cardinality must be stated, defining size, ordering and uniqueness of the subset. An occurrences defining the repeatability of the subset must also be stated. Group constraints can be nested.

The use of group cardinality and occurrences constraints, coupled with the occurrences constraints on each group member provide a means of specifying a number of logical constraint types found in other formalisms, including XML, as follows.

|==========================================================
|Logical constraint         |Group +
                             cardinality            |Group +
                                                     occurrences    |Item +
                                                                     occurrences
|1 of N choice              |1..1                   |upper = 1      |0..1
|1 of N choice, repeating   |1..1                   |upper > 1      |0..1
|N of M choice              |N..N                   |upper = 1      |0..1
|N of M choice, repeating   |N..N                   |upper > 1      |0..1
|sequence, repeating        |upper > 1, ordered     |upper > 1      |any
|sub-group, repeating       |upper > 1, unordered   |upper > 1      |any
|==========================================================

Group blocks can be nested, enabling subsets of subsets to be defined, as illustrated below.

====
at-coded ADL2::
+
```cadl
    items ∈ {
        ELEMENT[at0001] occurrences ∈ {1} ∈ {...}                -- Investigation type
        ELEMENT[at0002] occurrences ∈ {0..1} ∈ {...}             -- Investigation reason
        group cardinality ∈ {2} occurrences ∈ {*} ∈ {         -- pick any 2 & repeat
            ELEMENT[at0005] occurrences ∈ {0..1} ∈ {...}
            ELEMENT[at0006] occurrences ∈ {0..1} ∈ {...}
            CLUSTER[at0007] occurrences ∈ {0..1} ∈ {...}
            group cardinality ∈ {1} occurrences ∈ {0..1} ∈ {  -- at least one
                ELEMENT[at0008] occurrences ∈ {0..1} ∈ {...}
                CLUSTER[at0009] occurrences ∈ {0..1} ∈ {...}
            }
        }
        ELEMENT[at0010] occurrences ∈ {0..1} ∈ {...}            -- (other details)
        CLUSTER[at0011] occurrences ∈ {0..1} ∈ {...}            -- (other details)
    }
```

id-coded ADL2::
+
```cadl
    items ∈ {
        ELEMENT[id2] occurrences ∈ {1} ∈ {...}                -- Investigation type
        ELEMENT[id3] occurrences ∈ {0..1} ∈ {...}             -- Investigation reason
        group cardinality ∈ {2} occurrences ∈ {*} ∈ {         -- pick any 2 & repeat
            ELEMENT[id6] occurrences ∈ {0..1} ∈ {...}
            ELEMENT[id7] occurrences ∈ {0..1} ∈ {...}
            CLUSTER[id8] occurrences ∈ {0..1} ∈ {...}
            group cardinality ∈ {1} occurrences ∈ {0..1} ∈ {  -- at least one
                ELEMENT[id9] occurrences ∈ {0..1} ∈ {...}
                CLUSTER[id10] occurrences ∈ {0..1} ∈ {...}
            }
        }
        ELEMENT[id11] occurrences ∈ {0..1} ∈ {...}            -- (other details)
        CLUSTER[id12] occurrences ∈ {0..1} ∈ {...}            -- (other details)
    }
```
====

For nested groups, the individual object nodes of the sub-group count _individually_ towards the super-group's cardinality, i.e. the group itself is not counted as a node. Thus, in the following example, any three nodes can be chosen from nodes `at0005` - `at0010` (`id6` - `id11`), with one or two of those nodes being from nodes `at0008` - `at0010` (`id9` - `id11`).

====
at-coded ADL2::
+
```cadl
    group cardinality ∈ {3} occurrences ∈ {*} ∈ {         -- pick any 3 from id6-id11 & repeat
        ELEMENT[at0005] occurrences ∈ {0..1} ∈ {...}
        ELEMENT[at0006] occurrences ∈ {0..1} ∈ {...}
        CLUSTER[at0007] occurrences ∈ {0..1} ∈ {...}
            group cardinality ∈ {1} occurrences ∈ {1..2} ∈ {  -- pick 1-2 from id9 - id11
                ELEMENT[at0008] occurrences ∈ {0..1} ∈ {...}
                CLUSTER[at0009] occurrences ∈ {0..1} ∈ {...}
                ELEMENT[at0010] occurrences ∈ {0..1} ∈ {...}
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    group cardinality ∈ {3} occurrences ∈ {*} ∈ {         -- pick any 3 from id6-id11 & repeat
        ELEMENT[id6] occurrences ∈ {0..1} ∈ {...}
        ELEMENT[id7] occurrences ∈ {0..1} ∈ {...}
        CLUSTER[id8] occurrences ∈ {0..1} ∈ {...}
            group cardinality ∈ {1} occurrences ∈ {1..2} ∈ {  -- pick 1-2 from id9 - id11
                ELEMENT[id9] occurrences ∈ {0..1} ∈ {...}
                CLUSTER[id10] occurrences ∈ {0..1} ∈ {...}
                ELEMENT[id11] occurrences ∈ {0..1} ∈ {...}
            }
        }
    }
```
====

#### Slots and Grouping

The group constraint is often useful with a slot definition, in order to control the ordering and occurrences of items defined by other archetypes, within an overall container. Consider the example of data of the general structure: 'any number of problem and diagnosis Entries, followed by one plan and one or more treatment Entries'. An example of data following this structure would be:

* `EVALUATION` : problem #1
* `EVALUATION` : diagnosis #1
* `EVALUATION` : problem #2
* `EVALUATION` : problem #3
* `EVALUATION` : plan
* `INSTRUCTION` : medication #1
* `INSTRUCTION` : therapy #1

It might be expected that the slot constraints needed to define this are as follows:

====
at-coded ADL2::
+
```cadl
    SECTION[at0001] occurrences ∈ {0..1} ∈ {                           -- Subjective
        items cardinality ∈ {0..*; ordered} ∈ {
            allow_archetype EVALUATION[at0005] occurrences ∈ {*} ∈ {   -- Problem
                include
                    archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.problem\.v*/}
            }
            allow_archetype EVALUATION[at0006] occurrences ∈ {*} ∈ {   -- Diagnosis
                include
                    archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.problem-diagnosis\.v*/}
            }
            allow_archetype EVALUATION[at0007] occurrences ∈ {1} ∈ {   -- Plan
                include
                    archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.plan\.v*/}
            }
            allow_archetype INSTRUCTION[at0008] occurrences ∈ {1..*} ∈ {  -- Intervention
                include
                    archetype_id/value ∈ {/openEHR-EHR-INSTRUCTION\.(medication_order|therapy)\.v*/}
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    SECTION[id2] occurrences ∈ {0..1} ∈ {                           -- Subjective
        items cardinality ∈ {0..*; ordered} ∈ {
            allow_archetype EVALUATION[id6] occurrences ∈ {*} ∈ {   -- Problem
                include
                    archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.problem\.v*/}
            }
            allow_archetype EVALUATION[id7] occurrences ∈ {*} ∈ {   -- Diagnosis
                include
                    archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.problem-diagnosis\.v*/}
            }
            allow_archetype EVALUATION[id8] occurrences ∈ {1} ∈ {   -- Plan
                include
                    archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.plan\.v*/}
            }
            allow_archetype INSTRUCTION[id9] occurrences ∈ {1..*} ∈ {  -- Intervention
                include
                    archetype_id/value ∈ {/openEHR-EHR-INSTRUCTION\.(medication_order|therapy)\.v*/}
            }
        }
    }
```
====

The above says that the `SECTION._items_` attribute is an ordered list, and that its contents include multiple `EVALUATION` objects representing problem, diagnosis and plan, and also multiple `INSTRUCTION` objects representing interventions. The problem is now apparent. Each slot definition is set of possibilities, but we do not necessarily want to follow the slot ordering for the ordering of the archetypes chosen to fill the slots. To impose the required ordering and occurrences, we can use the group construct as follows.

====
at-coded ADL2::
+
```cadl
    SECTION[at0001] occurrences ∈ {0..1} ∈ {                             -- Subjective
        items cardinality ∈ {0..*; ordered} ∈ {
            group cardinality ∈ {0..1} occurrences ∈ {0..*} ∈ {
                                    -- sub-group of any number of problems & diagnoses
                allow_archetype EVALUATION[at0005] occurrences ∈ {1} ∈ {  --Problem
                    include
                      archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.problem\.v*/}
                }
                allow_archetype EVALUATION[at0006] occurrences ∈ {1} ∈ {  -- Diagnosis
                    include
                      archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.diagnosis\.v*/}
                }
            }
            allow_archetype EVALUATION[at0007] occurrences ∈ {1} ∈ {      -- Plan
                include
                    archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.plan\.v*/}
            }
            allow_archetype INSTRUCTION[at0008] occurrences ∈ {1..*} ∈ {     -- Intervention
                include
                    archetype_id/value ∈ {/openEHR-EHR-INSTRUCTION\.(medication_order|therapy)\.v*/}
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    SECTION[id2] occurrences ∈ {0..1} ∈ {                             -- Subjective
        items cardinality ∈ {0..*; ordered} ∈ {
            group cardinality ∈ {0..1} occurrences ∈ {0..*} ∈ {
                                    -- sub-group of any number of problems & diagnoses
                allow_archetype EVALUATION[id6] occurrences ∈ {1} ∈ {  --Problem
                    include
                      archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.problem\.v*/}
                }
                allow_archetype EVALUATION[id7] occurrences ∈ {1} ∈ {  -- Diagnosis
                    include
                      archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.diagnosis\.v*/}
                }
            }
            allow_archetype EVALUATION[id8] occurrences ∈ {1} ∈ {      -- Plan
                include
                    archetype_id/value ∈ {/openEHR-EHR-EVALUATION\.plan\.v*/}
            }
            allow_archetype INSTRUCTION[id9] occurrences ∈ {1..*} ∈ {     -- Intervention
                include
                    archetype_id/value ∈ {/openEHR-EHR-INSTRUCTION\.(medication_order|therapy)\.v*/}
            }
        }
    }
```
====

The above has the desired result in data: a group of any number of problems and diagnoses, followed by a plan, followed by one or more medications or other therapies.


## Constraints on Primitive Types

ADL assumes the existence of various primitive types, as described in the {openehr_foundation_types}[openEHR Foundation Types^] specification. These include the usual built-in types of any programming language, as well as dates and times, and lists and intervals of primitive types. The following subsections describe how each of these is constrained.

### General Structure

At the leaf nodes in a cADL text, constraints can be expressed on the following primitive types:

* `Boolean`;
* `Character`, `String`;
* `Integer`, `Real`;
* `Date`, `Time`, `Date_time`, `Duration`;
* `Terminology_code`;
* lists and intervals of some of the above.

Since primitive objects constitute the terminal nodes in an archetype, constraints may constrain type, occurrences (rare), and value.

While constraints on complex types follow the rules described so far, constraints on attributes of primitive types in cADL may be expressed in a shorter form, without type names, and omitting one level of braces, as follows:

```cadl
    some_attr matches {<some_pattern>}
```

rather than:

====
at-coded ADL2::
+
```cadl
    some_attr matches {
        PRIMITIVE_TYPE[at9009] matches {<some_pattern>}
    }
```

id-coded ADL2::
+
```cadl
    some_attr matches {
        PRIMITIVE_TYPE[id3] matches {<some_pattern>}
    }
```
====

This is possible because the syntax patterns of all primitive type constraints are mutually distinguishable, i.e. the type can always be inferred from the syntax alone. Since all leaf attributes of all object models are of primitive types, or lists or sets of them, cADL archetypes using the brief form for primitive types are significantly less verbose overall, as well as being more directly comprehensible to human readers. Because the brief form omits an at-code (id-code), the at-code (id-code) for primitive object nodes is automatically set to a fixed value, defined in the {openehr_am_aom2}#_overview[AOM specification^] as `Primitive_node_id`.

Although for the majority of primitive type constraints, the shortened form is the most convenient, there is one circumstance in which the regular syntax form is needed, which is when only the type is to be constrained, but not the value. This leads to a constraint of the following form:

====
at-coded ADL2::
+
```cadl
    some_attr matches {
        PRIMITIVE_TYPE[at9013]
    }
```

id-coded ADL2::
+
```cadl
    some_attr matches {
        PRIMITIVE_TYPE[id3]
    }
```
====

This may occur because the attribute `_some_attr_` in the reference model is of a more general type, e.g. `Any`. The constraint may thus be to simply require a `String`, `Terminology_code` or other primitive type. In the regular form a valid at-code (id-code) must be supplied; this may be either a standard at-code, e.g. `at9013` (id-code, e.g. `id9`) or the `Primitive_node_id` value. If the former is used, any specialised archetype that adds a value constraint must use the regular form, as in the following example.

====
at-coded ADL2::
+
```cadl
    -- in parent archetype
    some_attr matches {
        String[at9013]
    }

    -- in specialisation child
    some_attr matches {
        String[at9013] matches {"match me"}
    }
```

id-coded ADL2::
+
```cadl
    -- in parent archetype
    some_attr matches {
        String[id3]
    }

    -- in specialisation child
    some_attr matches {
        String[id3] matches {"match me"}
    }
```
====

If the `Primitive_node_id` is used, a specialisation may use the brief form, as in the following.

====
at-coded ADL2::
+
```cadl
    -- in parent archetype
    some_attr matches {
        String[at9017]
    }

    -- in specialisation child
    some_attr matches {"match me"}
```

id-coded ADL2::
+
```cadl
    -- in parent archetype
    some_attr matches {
        String[id9999]
    }

    -- in specialisation child
    some_attr matches {"match me"}
```
====

### Assumed Values

In an archetype containing optional data elements, an ability to define 'assumed' values is useful. For example, an archetype for 'blood pressure measurement' might include an optional data element describing the patient position, with choices 'lying', 'sitting' and 'standing'. Since this element is optional, data could be created according to the archetype that does not contain it. However, a blood pressure cannot be taken without the patient in some position, so clearly there is an implied value.

The archetype allows this to be explicitly stated so that all users/systems know what value to assume when optional items are not included in the data. Assumed values are definable on any primitive type, and are expressed after the constraint expression, by a semi-colon (';') followed by a value of the same type as that implied by the preceding part of the constraint. Example constraints containing assumed values are shown in the sections below.

If no assumed value is stated, no reliable assumption can be made by the receiver of the archetyped data about what the values of removed optional parts might be, from inspecting the archetype. However, this usually corresponds to a situation where the assumed value does not even need to be stated - the same value will be assumed by all users of this data, if its value is not transmitted. In most cases, if an element specified as optional in the archetype, data users only care about the value if it is actually present. The 'assumed value' concept is therefore not likely to be needed in most cases.

### Constraints on Boolean

Boolean runtime values can be constrained to be True, False, or either, as follows:

```cadl
    some_flag matches {True}
    some_flag matches {False}
    some_flag matches {True, False}
    some_flag matches {True, False; False}         -- with assumed value
```

### Constraints on Character

Attribute values of type `Character` can be constrained in two ways: using a list of characters, and using a regular expression.

#### List of Characters

The following examples show how a character value may be constrained using a list of fixed character values. Each character is enclosed in single quotes.

```cadl
    color_name matches {'r'}
    color_name matches {'r', 'g', 'b'}
```

#### Regular Expression

Character values can also be constrained using a single-character regular expression character class, as per the following examples:

```cadl
    color_name matches {/[rgbcmyk]/}
    color_name matches {/[^\s\t\n]/}
```

The only allowed elements of the regular expression syntax in character expressions are the following:

* any item from the Character Classes list above;
* any item from the Special Character Classes list above;
* an alternative expression whose parts are any item types, e.g. `'a'|'b'|[m-z]`

### Constraints on String

The value of an attribute of type `String` is constrained using a list of one or more Strings, each of which may be a fixed String, or a regular expression. In both cases, comparison to the constraint values is case-sensitive.

Although any mixture of fixed Strings and regular expressions may be used, the most common possibilities are a list of fixed Strings and a single regular expression.

#### List of Strings

A String-valued attribute can be constrained by a list of strings (using the ODIN syntax for string lists), including the simple case of a single string. Examples are as follows:

```cadl
    species ∈ {"platypus"}
    species ∈ {"platypus", "kangaroo"}
    species ∈ {"platypus", "kangaroo", "wombat"}
```

The first example constrains the runtime value of the `_species_` attribute of some object to take the value "platypus"; the second constrains it be either "platypus" or "kangaroo", and so on. *In almost all cases, this kind of string constraint should be avoided*, since it usually renders the body of the archetype language-dependent. Exceptions are proper names (e.g. "NHS", "Apgar"), product trade-names (but note even these are typically different in different language locales, even if the different names are not literally translations of each other). The preferred way of constraining string attributes in a language independent way is with value sets of terminology codes. See <<Terminology Constraints>>.

#### Regular Expression

The second way of constraining strings is with regular expressions, a widely used syntax for expressing patterns for matching strings. The regular expression syntax used in cADL is a proper subset of that used in the Perl language (see {perl_regex}[the specification of the regular expression language of Perl^]). It is specified as a constraint using either `//` or `^^` delimiters:

```cadl
    string_attr matches {/regular expression/}
    string_attr matches {^regular expression^}
```

For example, the following two patterns are equivalent:

```cadl
    units ∈ {/km\/h|mi\/h/}
    units ∈ {^km/h|mi/h^}
```

The rules for including special characters within strings are described in <<File Encoding and Character Quoting>>.

TBD: there is an argument for only allowing a single String value rather than a list, where the value is aways a regex since `{"platypus", "kangaroo", "wombat"}` can be expressed as `{/platypus|kangaroo|wombat/}`. See also AOM spec.

The regular expression patterns supported in cADL are as follows.

|==========================================================
3+^h|Character Class

| `.`       |match any single character.                                    |E.g. `...` matches any 3 characters;
| `[xyz]`   |match any of the characters in the set `xyz` (case-sensitive). |E.g. `[0-9]` matches any string containing a single decimal digit;
| `[a-m]`   |match any of the characters in the set of characters formed by the continuous range from `a` to `m` (case-sensitive).  |E.g. `[0-9]` matches any single character string containing a single decimal digit, `[S-Z]` matches any single character in the range `S` - `Z` ;
| `[^a-m]`  |match any character except those in the set of characters formed by the continuous range from `a` to `m` .     |E.g. `[^0-9]` matches any single character string as long as it does not contain a single decimal digit;

3+^h|Grouping

| `(pattern)`   |parentheses are used to group items; any pattern appearing within parentheses is treated as an atomic item for the purposes of the occurrences operators.  |E.g. `([1-9][0-9])` matches any 2-digit number.

3+^h|Occurrences

| `*`      |match 0 or more of the preceding atomic item.              |E.g. `.\*` matches any string; `[a-z][a-z0-9]*` matches any alphanumeric string starting with a letter;
| `+`       |match 1 or more occurrences of the preceding atomic item.  |E.g. `a[^\s]+` matches any string starting with 'a', followed by at least one further non-whitespace character;
| `?`       |match 0 or 1 occurrences of the preceding atomic item.     |E.g. `ab?` matches the strings `"a"` and `"ab"` ;
| `{m,n}`   |match m to n occurrences of the preceding atomic item.     |E.g. `ab{1,3}` matches the strings `"ab"` and `"abb"` and `"abbb"` ; `[a-z]{1,3}` matches all lower-case alphabetic strings of one to three characters in length;
| `{m,}`    |match at least m occurrences of the preceding atomic item; |
| `{,n}`    |match at most n occurrences of the preceding atomic item;  |
| `{m}`     |match exactly m occurrences of the preceding atomic item;  |

3+^h|Special Character Classes

| `\d` , `\D`   |match a decimal digit character; match a non-digit character;      |
| `\s` , `\S`   |match a whitespace character; match a non-whitespace character;    |

3+^h|Alternatives

| `pattern1\|pattern2`   |match either pattern1 or pattern2.     |E.g. `lying\|sitting\|standing` matches any of the words `"lying"` , `"sitting"` and `"standing"` .
|==========================================================

A similar warning as for a list of strings should be noted for the use of regular expressions to constrain strings: they should be limited to non-linguistically dependent patterns, such as proper and scientific names. The use of regular expressions for constraints on normal words will render an archetype linguistically dependent, and potentially unusable by others.

### Constraints on Ordered Types

Of the primitive types defined in the {openehr_foundation_types}[openEHR Foundation Types^], some inherit (at least notionally) from the abstract type `Ordered`, including `Integer`, `Real`, and the Date/Time types. Constraints on all these types follow a constraint type of `List<Interval<T:Ordered>>`, i.e. a `List` of `Intervals`. Since the `Interval<T>` type in openEHR includes a descendant `Point_interval<T>` that can represent a degenerate interval of the form `{N..N}`, i.e. effectively a single value, this constraint type can represent many patterns of constraint, including:

* single value e.g. `{3}`;
* list of values e.g. `{3, 4, 5}`;
* single interval e.g. `{|0..10|}`;
* list of intervals e.g. `{|0..10|, |60..90|, |>500|}`;
* any combination of values and intervals, e.g. `{5, |10..100|, 150, |200..400|, 1000}`.

Additional 'pattern' constraints are available on the Date/Time types.

### Constraints on Integer

The value of an attribute of type `Integer` is constrained using a list of one or more integer values or intervals. The most common possibilities are a list of single integers, and a single interval, but multiple intervals and or single values are possible as well.

#### List of Integers

Lists of integers expressed in the syntax from ODIN can be used as a constraint, e.g.:

```cadl
    length matches {1000}       -- fixed value of 1000
    magnitude matches {0, 5, 8} -- any of 0, 5 or 8
```

The first constraint requires the attribute `_length_` to be 1000, while the second limits the value of `_magnitude_` to be 0, 5, or 8 only. A list may contain a single integer only:

```cadl
    magnitude matches {0} -- matches 0
```

#### Interval of Integer

Integer intervals are expressed using the interval syntax from ODIN (described in the {openehr_odin}[openEHR ODIN specification^]. Examples of 2-sided intervals include:

```cadl
    length matches {|1000|}                       -- point interval of 1000 (=fixed value)
    length matches {|950..1050|}                  -- allow 950 - 1050
    length matches {|0..1000|}                    -- allow 0 - 1000
    length matches {|0..<1000|}                   -- allow 0>= x <1000
    length matches {|>0..<1000|}                  -- allow 0> x <1000
    length matches {|100+/-5|}                    -- allow 100 +/- 5, i.e. 95 - 105
```

Examples of one-sided intervals include:

```cadl
    length matches {|<10|}                        -- allow up to 9
    length matches {|>10|}                        -- allow 11 or more
    length matches {|<=10|}                       -- allow up to 10
    length matches {|>=10|}                       -- allow 10 or more
    length matches {|>=10|;5}                     -- allow 10 or more; assumed value = 5
```

#### More Complex Integer Constraints

There may be applications for which the full possibilities of the Integer value constraint need to be exploited. The following provides an example.

```cadl
    length matches {5, |10..100|, 150, |200..400|, 1000}
```

In such cases, all of the values and ranges should be mutually exclusive.

### Constraints on Real

Constraints on attributes of type `Real` follow the same syntax as for Integers, in both list and interval forms. The only difference is that the real number values used in the constraints are indicated by the use of the decimal point and at least one succeeding digit, which may be 0. Typical examples are:

```cadl
    magnitude ∈ {5.5}                             -- list of one (fixed value)
    magnitude ∈ {|5.5|}                           -- point interval (=fixed value)
    magnitude ∈ {|5.5..6.0|}                      -- interval
    magnitude ∈ {5.5, 6.0, 6.5}                   -- list
    magnitude ∈ {|0.0..<1000.0|}                  -- allow 0>= x <1000.0
    magnitude ∈ {|<10.0|}                         -- allow anything less than 10.0
    magnitude ∈ {|>10.0|}                         -- allow greater than 10.0
    magnitude ∈ {|<=10.0|}                        -- allow up to 10.0
    magnitude ∈ {|>=10.0|}                        -- allow 10.0 or more
    magnitude ∈ {|80.0+/-12.0|}                   -- allow 80 +/- 12
```

### Constraints on Dates, Times and Durations

Attributes of type `Date`, `Time`, `Date_time` and `Duration` (or of differently-named primitive types with the same meaning) may all be constrained in either of two ways:

* in terms of values, using a list of ISO 8601 values or value intervals, in the same manner as for `Integer` and `Real`; and
* using patterns based on the ISO 8601 value syntax.

The first method allows temporal values to be constrained to actual date, time etc values, while the second allows values to be constrained on the basis of which parts of the date, time etc. are present or missing, regardless of value. The pattern method is described first, since patterns can also be used in lists and intervals.

#### Date, Time and Date/Time

##### Patterns

Dates, times, and date/times (i.e. timestamps), can be constrained using patterns based on the {iso_8601}[ISO 8601 date/time syntax^], which indicate which parts of the date or time must be supplied. A constraint pattern is formed from the abstract pattern `yyyy-mm-ddThh:mm:ss` (itself formed by translating each field of an ISO 8601 date/time into a letter representing its type), with either `?` (meaning optional) or `X` (not allowed) characters substituted in appropriate places. Timezone may be indicated as being _required_ by the addition of a patterns such as `+hh:mm`, `+hhmm`, and `-hh`. The `Z` (UTC, i.e. equivalent of `+0000`) timezone modifier can always be used when any such pattern is specified (see [table below](##timezone_constraints)).

NOTE: there is no way to state that timezone information be _prohibited_.

The syntax of legal patterns is given by Antlr4 lexical rules `DATE_CONSTRAINT_PATTERN`, `TIME_CONSTRAINT_PATTERN` and `DATE_TIME_CONSTRAINT_PATTERN` shown below in the [Base Lexer syntax section](#_base_lexer).

All expressions generated by these patterns must also satisfy the validity rules:

* where `??` appears in a field, only `??` or `XX` can appear in fields to the right
* where `XX` appears in a field, only `XX` can appear in fields to the right

The following table shows the valid patterns that can be used, and the types implied by each pattern.

|==================================================================================================
|Implied Type   |Pattern                |Explanation
|Date           |yyyy-mm-dd             |full date must be specified
|Date           |yyyy-mm-??             |optional day; +
 e.g. day in month forgotten
|Date           |yyyy-??-??             |optional month, optional day; +
 i.e. any date allowed; e.g. mental health questionnaires which include well known historical dates
|Date           |yyyy-mm-XX             |mandatory month, no day
|Date           |yyyy-??-XX             |optional month, no day
|               |                       | 
|Time           |hh:mm:ss               |full time must be specified
|Time           |hh:mm:XX               |no seconds; +
 e.g. appointment time
|Time           |hh:??:XX               |optional minutes, no seconds; +
 e.g. normal clock times
|Time           |hh:??:??               |optional minutes, seconds; +
 i.e. any time allowed
|               |                       | 
|Date/Time      |yyyy-mm-ddThh:mm:ss    |full date/time must be specified
|Date/Time      |yyyy-mm-ddThh:mm:??    |optional seconds; +
 e.g. appointment date/time
|Date/Time      |yyyy-mm-ddThh:mm:XX    |no seconds; +
 e.g. appointment date/time
|Date/Time      |yyyy-mm-ddThh:??:XX    |no seconds, minutes optional; +
 e.g. in patient-recollected date/times
|Date/Time      |yyyy-??-??T??:??:??    |minimum valid date/time constraint
|==================================================================================================

In the above patterns, the 'yyyy' etc. match strings can be replaced by literal date/time numbers. For example, `yyyy-??-XX` could be transformed into `1995-??-XX` to mean any partial date in 1995.

Any of the time or date/time (but not date) patterns above may be modified to require a timezone by appending one of the following timezone constraint patterns:

|===================================================================================
|Pattern   |Explanation
|±hh       |hours-only timezone modifier required, commencing with '+' or '-'; 'Z' also allowed
|±hh:mm    .2+|full timezone modifier required, commencing with '+' or '-'; 'Z' also allowed
|±hhmm
|Z         |'Z' required (indicating GMT)
|===================================================================================

It is assumed that any time or date/time datum that includes timezone is correctly constructed to include the effect of summer time.

The absence of a timezone constraint indicates that a timezone modifier is optional.

An assumed value can be used with any of the above using the semi-colon separator, as follows, e.g. `yyyy-??-??; 1970-01-01`. If there is a timezone constraint, the assumed value must include a valid timezone, i.e. `yyyy-mm-dd±hh; 1970-01-01+02`.

##### Intervals

Dates, times and date/times can also be constrained using intervals. Each date, time or date/time in an interval may be a literal value. Examples of such constraints:

```cadl
    |09:30:00|                                     -- exactly 9:30 am
    |< 09:30:00|                                   -- any time before 9:30 am
    |<= 09:30:00|                                  -- any time at or before 9:30 am
    |> 09:30:00|                                   -- any time after 9:30 am
    |> 09:30:00+0200|                              -- any time after 9:30 am in UTC+0200 timezone
    |>= 09:30:00|                                  -- any time at or after 9:30 am
    |2004-05-20..2004-06-02|                       -- a date range
    |2004-05-20T00:00:00..2005-05-19T23:59:59|     -- a date/time range
    |>= 09:30:00|;09:30:00                         -- any time at or after 9:30 am; assume 9:30 am
    |2004-05-20T00:00:00Z..2005-05-19T23:59:59Z|   -- a date/time range with UTC timezone
```

Within any interval containing two literal date/time values (i.e. not one-sided intervals), if a timezone is used on one, it must be used on both, to ensure comparability. The timezones need not be identical.

#### Duration Constraints

##### Patterns

Patterns based on ISO 8601 can be used to constrain durations in the same way as for Date/time types. The Antlr4 lexical rule for the pattern is `DURATION_CONSTRAINT_PATTERN`, shown below in the [Base Lexer syntax section](#_base_lexer).

NOTE: the use of the `W` designator with the other designators is an openEHR deviation from the published ISO 8601 standard (where durations are supposed to take the form of either `PnnW` or `PnnYnnMnnDTnnHnnMnnS`), to support the common healthcare duration of pregnancy as some combination of weeks and days.

The use of this pattern indicates which 'slots' in an ISO duration string may be filled. Where multiple letters are supplied in a given pattern, the meaning is 'or', i.e. any one or more of the slots may be supplied in the data. This syntax allows specifications like the following to be made:

```cadl
    Pd            -- a duration containing days only, e.g. P5d
    Pm            -- a duration containing months only, e.g. P5m
    PTm           -- a duration containing minutes only, e.g. PT5m
    Pwd           -- a duration containing weeks and/or days only, e.g. P4w
    PThm          -- a duration containing hours and/or minutes only, e.g. PT2h30m
```

NOTE: the 's' (seconds) slot covers fractional seconds as well as whole seconds.

Pure pattern constraints are used to constrain negative durations as well as positive durations. Accordingly, any of the above constraints may be used for values such as `'-P5d'` etc.

##### Lists and Intervals

Durations can also be constrained by using absolute ISO 8601 duration values, or ranges of the same (including negative values), e.g.:

```cadl
    PT1m              -- 1 minute
    P1dT8h            -- 1 day 8 hrs
    |PT0m..PT1m30s|   -- Reasonable time offset of first apgar sample
    |-P5M..P1Y|       -- Possible range of infant gestational ages
```

##### Mixed Pattern and Interval

In some cases there is a need to be able to limit the allowed units as well as state a duration interval. This is common in obstetrics, where physicians want to be able to set an interval from say 0-50 weeks and limit the units to only weeks and days. This can be done as follows:

```
    PWD/|P0W..P50W|   -- 0-50 weeks, expressed only using weeks and days
```

The same type of constraint can be used to constrain values that may be negative (usually allowing for zero):

```
    PYMWD/|<=P0Y|     -- negative age, with years/months/weeks/days allowed
```

NOTE: a negative sign (or equivalently, the '\<= 0' construction as above) is only used for specifying interval values; the pattern part is understood as allowing values of either sign.

The general form is a pattern followed by a slash ('/') followed by an interval, as follows:

```antlr-java
duration_constraint: duration_pattern '/' duration_interval ;
```

### Terminology Constraints

Terminology constraints deal with a special category of data values known as 'coded terms' or 'terminology'. Coded data values are both textual (e.g. 'diastolic blood pressure') and semantic, i.e. they may have relationships to each other. The idea is that instead of using text, the possible values are represented in structured vocabularies, terminologies or ontologies that define both the possible text (including translations) and also the relationships, if any, between the terms (sometimes known as 'concepts'). In health, typical examples include 'terminology' resources such as {who_icd}[WHO ICDx^] and {snomed_ct}[SNOMED CT^] terminologies and drug databases.

Coded terms are treated as a primitive type in ADL in order to enable the formalism and tools to work with terminology constraints. Unlike other primitive constraints, terminology constraints may be complex, because they can refer to external resources, either directly or via 'bindings' defined elsewhere in the archetype. This section describes just the syntax representations and relationships between these.

The full description, including binding and resolution is provided in <<Terminology Integration>>. This section describes only the syntax for term constraint in the `definition` section of an archetype.

Terminology constraints come in both the usual 'formal' form, as well as a 'soft' form, designed to allow constraints to be treated as various kinds of preferences. These are described below. The allowed specialisations of terminology constraints are described in <<_primitive_object_redefinition>>.

#### Formal Terminology Constraint

Syntactically, there are two types of terminology constraint expressible in 'source form' ADL, i.e. authored archetypes and templates. The first is expressed with an ac-code which refers to a value set which is either defined in the archetype terminology or externally. The second, for convenience, uses a single at-code, in order to express a single term value without requiring a value-set. For the first case, an assumed value in the form of an at-code can also be stated, and has the same sense as the assumed values of other primitive types already described.

The possibilities are illustrated below.

====
at-coded ADL2::
+
```cadl
    --
    -- fragment of openEHR-EHR-EVALUATION.term_constraint_variations.v0.0.1
    --

    items matches {
        ELEMENT[at0010] occurrences matches {0..1} matches {
            name matches {
                DV_CODED_TEXT[at0007] matches {
                    defining_code matches {[at0004]}		-- set name to 'Substance'
                }
            }
            value matches {
                DV_CODED_TEXT[at0054] matches {
                    defining_code matches {[ac1]}		-- Type of Substance/Agent
                }
            }
        }
        ELEMENT[at0021] occurrences matches {0..1} matches {	-- Certainty
            value matches {
                DV_CODED_TEXT[at0057] matches {
                    defining_code matches {[ac2; at0022]}
                }
            }
        }
        ...
    }
```

id-coded ADL2::
+
```cadl
    --
    -- fragment of openEHR-EHR-EVALUATION.term_constraint_variations.v0.0.1
    --

    items matches {
        ELEMENT[id11] occurrences matches {0..1} matches {
            name matches {
                DV_CODED_TEXT[id8] matches {
                    defining_code matches {[at5]}		-- set name to 'Substance'
                }
            }
            value matches {
                DV_CODED_TEXT[id55] matches {
                    defining_code matches {[ac1]}		-- Type of Substance/Agent
                }
            }
        }
        ELEMENT[id22] occurrences matches {0..1} matches {	-- Certainty
            value matches {
                DV_CODED_TEXT[id58] matches {
                    defining_code matches {[ac2; at23]}
                }
            }
        }
        ...
    }
```
====

In the above, the constraint at the path `items[at0010]/name[at0007]` (`items[id11]/name[id8]`) is on a `DV_CODED_TEXT._defining_code_` representing the `_name_` of the `ELEMENT`. It is constrained to a single at-code value representing 'Substance' (assume this is the preferred name of the institution that created this archetype). The at-code is defined in the terminology part of the archetype, and may have bindings defined there as well. These are described in later sections.

The second variant uses the code `ac1`, which refers to a value set. This is by definition: all ac-codes in ADL refer only to value sets. This is the most common form of terminology constraint - defining possible codes for a codable value in the model. The code and any bindings are also defined in the `terminology` section.

The last variant shows a second value set constraint, this time with an assumed code, where `at0022` (`at23`) must be in the value set referred to by `ac2`.

#### Soft Terminology Constraint

Uniquely in ADL, terminology constraints may be modified to be informal, also known as specifying a 'constraint strength'. Normally constraints in ADL are formal in the sense that they are intended to strictly apply to the instances they constrain. However, in the terminology value domain, the ability to easily constrain allowed 'values' to particular terms or value-sets is complicated by various factors, including:

* unforeseeable changes in thinking in classification and description in the terminology world;
* the lack of available fully developed terminological descriptions of the phenomena being represented;
* practical needs of mapping to specific local or other terminologies.

For these reasons, terminology constraints may be relaxed from the default 'required' status, to three _informal_ constraint statuses, as follows:

* _extensible_: the data instance must conform to the value set _if the intended concept is available within the value-set constraint_; if not, the instance may be any other code;
* _preferred_: the data instance preferably conforms to the value set, but may use any other code, even if the concept is represented by a code within the constraint;
* _example_: the constraint value or value-set is provided as an illustrative example only.

Formally, all three of these statuses are the same as a value constraint specifying only the RM type as being a terminology code (e.g. `DV_CODED_TEXT` from openEHR) and nothing more, which is to say, at the archetype level, validity of the data instance is achieved by supplying _any terminology code_. However, higher levels of semantic validation in tooling may be performed that do take into account any informal constraint status that may be set.

Soft terminology constraints are typically intended to be used alongside a constraint allowing a pure text value as well, i.e. to cope with the case where no terminology code of any kind is available at runtime to express the intended value (this happens every so often in healthcare when a novel virus or pathogen is identified, but not yet incorporated into published terminologies). The ability to construct a coded-text + plain-text constraint pattern is entirely dependent on the types available in the Reference Model on which the archetypes in question are based.

The _recommendation_ is that if a terminology constraint is not `required`, a plain text constraint should be supplied alongside if the RM permits, to allow for the case of unavailability of any coded term.

Soft terminology constraints are specified in ADL using keywords prior to the formal constraint. Taking into account the recommendation for coded-text + text, the typical usage is as shown below. If no keyword is supplied, the meaning is `required`, although this may also be stated using the `required` keyword if desired.

====
at-coded ADL2::
+
```cadl
    items matches {
        ELEMENT[at0010] occurrences matches {0..1} matches {
            name matches {
                DV_CODED_TEXT[at0007] matches {
                    defining_code matches {preferred [at0004]}	-- prefer 'Substance', any code ok
                }
                DV_TEXT[at0008]                                -- or plain text
            }
            value matches {
                DV_CODED_TEXT[at0054] matches {
                    defining_code matches {example [ac1]}	-- ac1 provided as example only
                }
                DV_TEXT[at0055]                               -- or plain text
            }
        }
        ELEMENT[at0021] occurrences matches {0..1} matches {
            value matches {
                DV_CODED_TEXT[at0057] matches {
                    defining_code matches {extensible [ac2]} -- use ac2 value-set if there is a match
                }                                            -- or another code from same terminology
                DV_TEXT[at0058]                                -- or plain text
            }
        }
        ...
    }
```

id-coded ADL2::
+
```cadl
    items matches {
        ELEMENT[id11] occurrences matches {0..1} matches {
            name matches {
                DV_CODED_TEXT[id8] matches {
                    defining_code matches {preferred [at5]}	-- prefer 'Substance', any code ok
                }
                DV_TEXT[id9]                                -- or plain text
            }
            value matches {
                DV_CODED_TEXT[id55] matches {
                    defining_code matches {example [ac1]}	-- ac1 provided as example only
                }
                DV_TEXT[id56]                               -- or plain text
            }
        }
        ELEMENT[id22] occurrences matches {0..1} matches {
            value matches {
                DV_CODED_TEXT[id58] matches {
                    defining_code matches {extensible [ac2]} -- use ac2 value-set if there is a match
                }                                            -- or another code from same terminology
                DV_TEXT[id59]                                -- or plain text
            }
        }
        ...
    }
```
====

#### Operational Binding Constraints

The above sections describe 'source form' constraints, i.e. constraints expressed in terms of internal codes and value-sets. A further constraint possibility exists, for use at the point of operational template generation. As described in <<From Constraints to Concrete Codes in Data>>, the choice may be made that a specific operational template (OPT) should use external codes from the archetype bindings (such as from {snomed_ct}[SNOMED CT^], {who_icd}[ICD10^], etc) as the values of some or all coded nodes, rather than using the internal at-codes.

To express this choice, the OPT's `definition` section contains a modified version of the usual syntax `[at0001]` (`[at2]`) or `[ac1]` in those nodes where an external term from the bindings is to be used. This takes the form `[acN@ttttt]` or `[atNNNN@ttttt]` (`[atN@ttttt]`) where `ttttt` is the namespace identifier of a binding in the `terminology` section of the archetype.

Specifying which codable nodes (including 'all' and 'none' options) should have their values substituted by the external codes is assumed to be part of the OPT generator tool. Different terminology bindings may be specified on different nodes of the same archetype, or none at all, allowing for a mixture of external term substitutions depending on node.

The following example shows the result in an operational template fragment.

====
at-coded ADL2::
+
```cadl
    --
    -- extract of an operational template based on openEHR-EHR-EVALUATION.term_constraint_variations.v0.0.1
    --
    value matches {
        DV_CODED_TEXT[at0054] matches {
            defining_code matches {[ac1@snomed_ct]}        -- use snomed_ct binding for value from ac1 at runtime
        }
    }
```

id-coded ADL2::
+
```cadl
    --
    -- extract of an operational template based on openEHR-EHR-EVALUATION.term_constraint_variations.v0.0.1
    --
    value matches {
        DV_CODED_TEXT[id55] matches {
            defining_code matches {[ac1@snomed_ct]}        -- use snomed_ct binding for value from ac1 at runtime
        }
    }
```
====

See <<Terminology Integration>> for fuller picture of how this works.

### Constraints on Lists of Primitive Types

In some cases, the type in the information model of an attribute to be constrained is a list or set of primitive types, i.e. `List<Integer>`, `Set<String>` etc. Here, the types `List<T>` and `Set<T>` are understood in the standard way in computer science, i.e. as linear containers with respectively, ordering and unique membership.

Any constraint described above for single-valued attributes, which is commensurate with the type of the attribute in question, may be used for this purpose as well. However, for values of type `List<T>`, `Set<T>` etc., the meaning is now that every item in the value list is constrained to be _any one of the values_ specified by the constraint expression. For example:

```cadl
    speed_limits cardinality ∈ {0..*; ordered} ∈ {50, 60, 70, 80, 100, 130}
```

constrains each value in the list corresponding to the value of the attribute `speed_limits` (of type `List<Integer>` ), to be any one of the values `50`, `60`, `70` etc.

### Constraints on Intervals of Ordered Primitive Types

A third variation on primitive types is that of Intervals of Ordered primitive types, i.e. where the attribute type is `Interval<Integer>`, `Interval<Duration>` etc. The type `Interval<T:Ordered>` is understood as defined in the {openehr_foundation_types}#_interval[openEHR Foundation Types^], and corresponds to a similar type in most programming language libraries.

Values of these types may be constrained with the same constraint expressions as for atomic values of the same type, with the most usual pattern being one or more Intervals, e.g.:

```cadl
    speed_range ∈ {|0..60|, |60..90|, |90..110|, |110..130|, |>130|}
```

The meaning of such constraints is interpreted differently for Interval-valued attributes compared to single-valued attributes. Here, each Interval in the constraint is understood as a _possible (Interval) value_ for the constrained attribute, not as providing a range of possible values. The example above thus allows 5 different Interval values for the attribute `speed_range`.

### Constraints on Enumerated Types

Enumeration types in a reference model are assumed to have the semantics defined in UML and mainstream programming languages, i.e. to be a distinct type based on a primitive type, normally Integer or String. Each such type consists of a set of values from the domain of its underlying type, thus, a set of Integer, String or other primitive values. Each of these values is assumed to be named in the manner of a symbolic constant. Although strictly speaking UML doesn't require an enumerated type to be based on an underlying primitive type, programming languages do, hence the assumption here that values from the domain of such a type are involved.

In ADL, constraints on enumerated types are represented by constraints on the underlying primitive values. The following example shows 2 constraints on an attribute of the type `PROPORTION_KIND` from the openEHR Reference Model.

====
at-coded ADL2::
+
```cadl
    ITEM_TREE[at0003] ∈ {
        items ∈ {
            ELEMENT[at0004] occurrences ∈ {0..1} matches {    -- test enum 1
                value ∈ {
                    DV_PROPORTION[at9001] ∈ {
                        numerator ∈ {|0.0..1.0|; 0.0}
                        type ∈ {1}                         -- pk_unitary
                    }
                }
            }
            ELEMENT[at0006] ∈ {                               -- test enum 2
                value ∈ {
                    DV_PROPORTION[at9002] ∈ {
                        numerator ∈ {|0.0..1.0|; 0.0}
                        type ∈ {2, 3}                      -- pk_percent, pk_fraction
                    }
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    ITEM_TREE[id4] ∈ {
        items ∈ {
            ELEMENT[id5] occurrences ∈ {0..1} matches {    -- test enum 1
                value ∈ {
                    DV_PROPORTION[id6] ∈ {
                        numerator ∈ {|0.0..1.0|; 0.0}
                        type ∈ {1}                         -- pk_unitary
                    }
                }
            }
            ELEMENT[id7] ∈ {                               -- test enum 2
                value ∈ {
                    DV_PROPORTION[id8] ∈ {
                        numerator ∈ {|0.0..1.0|; 0.0}
                        type ∈ {2, 3}                      -- pk_percent, pk_fraction
                    }
                }
            }
        }
    }
```
====

`PROPORTION_KIND` is defined as `{pk_ratio = 0; pk_unitary = 1; pk_percent = 2; pk_fraction = 3; pk_integer_fraction = 4}` in its reference model. Modelling tools are relied on to visualise enumeration constraints in a suitable way, by inferring the type based on inspection of the reference model on which the archetype is based.


## Syntax Validity Rules

Various coded syntax rules have been defined for the cADL syntax, for use by parser and compiler authors. These can be found on at the GitHub location https://github.com/openEHR/adl-resources/blob/master/messages/ADL/adl_syntax_errors.txt.

The state of this file at the issue of this document is as follows.

```odin
syntax_errors = <
    ["SUNK"] = <"Syntax error (unknown cause)">
    ["SARID"] = <"Syntax error in artefact identification clause; expecting archetype id (format = model_issuer-package-class.concept.version)">
     
    ["SASID"] = <"Syntax error in 'specialise' clause; expecting parent archetype id (model_issuer-ref_model-model_class.concept.version)">
     
    ["SACO"] = <"Syntax error in 'concept' clause; expecting TERM_CODE reference">
    ["SALA"] = <"Syntax error in language section">
    ["SALAN"] = <"Syntax error no language section found">
    ["SADS"] = <"Syntax error in description section">
    ["SADF"] = <"Syntax error in definition section">
    ["SAIV"] = <"Syntax error in invariant section">
    ["SAON"] = <"Syntax error in terminology section">
    ["SAAN"] = <"Syntax error in annotations section">
     
    ["SDSF"] = <"Syntax error: differential syntax not allowed in top-level archetype">
    ["SDINV"] = <"Syntax error: invalid ODIN section; error: $1">
    ["SCCOG"] = <"Syntax error: expecting a new node definition, primitive node definition, 'use' path, or 'archetype' reference">
    ["SUAID"] = <"Syntax error: expecting [archetype_id] in use_archetype statement">
    ["SUAIDI"] = <"Syntax error: invalid archetype id $1">
    ["SOCCF"] = <"Syntax error: expecting an 'occurrences expression', e.g. 'occurrences matches {n..m}'">
    ["SUNPA"] = <"Syntax error: expecting absolute path in use_node statement">
    ["SCOAT"] = <"Syntax error: expecting attribute definition(s)">
    ["SUAS"] = <"Syntax error: error after 'use_archetype' keyword; expecting Object node definition">
    ["SCAS"] = <"Syntax error: expecting a 'any' node, 'leaf' node, or new node definition">
    ["SINVS"] = <"Syntax error: illegal invariant expression at identifier $1">
    ["SEXPT"] = <"Syntax error: expecting absolute path after exists keyword">
    ["SEXLSG"] = <"Syntax error: existence single value must be 0 or 1">
    ["SEXLU1"] = <"Syntax error: existence upper limit must be 0 or 1 when lower limit is 0">
    ["SEXLU2"] = <"Syntax error: existence upper limit must be 1 when lower limit is 1">
    ["SEXLMG"] = <"Syntax error: existence must be one of 0..0, 0..1, or 1..1">
     
    ["SCIAV"] = <"Syntax error: invalid assumed value; must be an integer">
    ["SCRAV"] = <"Syntax error: invalid assumed value; must be a real number">
    ["SCDAV"] = <"Syntax error: invalid assumed value; must be an ISO8601 date">
    ["SCTAV"] = <"Syntax error: invalid assumed value; must be an ISO8601 time">
    ["SCDTAV"] = <"Syntax error: invalid assumed value; must be an ISO8601 date/time">
    ["SCDUAV"] = <"Syntax error: invalid assumed value; must be an ISO8601 duration">
    ["SCSAV"] = <"Syntax error: invalid assumed value; must be a string">
    ["SCBAV"] = <"Syntax error: invalid assumed value; must be a 'True' or 'False'">
    ["SCOAV"] = <"Syntax error: invalid assumed value; must be an ordinal integer value">
     
    ["SCDPT"] = <"Syntax error: invalid date constraint pattern '$1'; allowed patterns: $2">
    ["SCTPT"] = <"Syntax error: invalid time constraint pattern '$1'; allowed patterns: $2">
    ["SCDTPT"] = <"Syntax error: invalid date/time constraint pattern '$1'; allowed patterns: $2">
    ["SCDUPT"] = <"Syntax error: invalid duration constraint pattern '$1'; legal pattern: P[Y|y][M|m][W|w][D|d][T[H|h][M|m][S|s]] or P[W|w] [/duration_interval]">
     
    ["SCSRE"] = <"Syntax error: regular expression compile error '$1' is not a valid regular expression">
    ["STCCP"] = <"Syntax error: invalid term code constraint pattern '$1': $2">
    ["STCDC"] = <"Syntax error: duplicate code(s) found in code list">
    ["STCAC"] = <"Syntax error: assumed value code $1 not found in code list">
    ["STCNT"] = <"Syntax error: terminology not specified">
>
```


# ADL Paths

## Overview
The notion of paths is integral to ADL, and a common path syntax is used to reference nodes in both ODIN and cADL sections of an archetype. The same path syntax works for both, because both ODIN and cADL have an alternating object/attribute structure. However, the interpretation of path expressions in ODIN and cADL differs slightly; the differences are explained in the ODIN and cADL sections of this document. This section describes only the common syntax and semantics.

The general form of the path syntax is as follows (see syntax section below for full specification):

```antlr-java
    path: '/'? path_segment ( '/' path_segment )+ ;
    path_segment: attr_name ( '[' object_id ']' )? ;
```

Essentially, ADL paths consist of segments separated by slashes (`'/'`), where each segment is an attribute name with optional object identifier predicate, indicated by brackets ('[]').

*ADL Paths* are formed from an alternation of segments made up of an attribute name and optional object node identifier predicate, separated by slash (`'/'`) characters. Node identifiers are delimited by brackets (i.e. `[]`).

Similarly to paths used in file systems, ADL paths are either absolute or relative, with the former being indicated by a leading slash.

Paths are *absolute* or *relative* with respect to the document in which they are mentioned. Absolute paths commence with an initial slash ('/') character.

The ADL path syntax also supports the concept of "movable" path patterns, i.e. paths that can be used to find a section anywhere in a hierarchy that matches the path pattern. Path patterns are indicated with a leading double slash ('//') as in Xpath.

*Path patterns* are absolute or relative with respect to the document in which they are mentioned. Absolute paths commence with an initial slash ('/') character.

### Relationship with W3C Xpath

The ADL path syntax is semantically a subset of the Xpath query language, with a few syntactic shortcuts to reduce the verbosity of the most common cases. Xpath differentiates between "children" and "attributes" sub-items of an object due to the difference in XML between Elements (true sub-objects) and Attributes (tag-embedded primitive values). In ADL, as with any pure object formalism, there is no such distinction, and all sub-parts of any object are referenced in the manner of Xpath children; in particular, in the Xpath abbreviated syntax, the key `child::` does not need to be used.

ADL does not distinguish attributes from children, and also assumes the node_id attribute. Thus, the following expressions are legal for cADL structures:

====
at-coded ADL2::
+
```cadl
    items[1]                            -- the first member of 'items'
    items[systolic]                     -- the member of 'items' with meaning 'systolic'
    items[at0003]                       -- the member of 'items' with node id 'at0003'
```

id-coded ADL2::
+
```cadl
    items[1]                            -- the first member of 'items'
    items[systolic]                     -- the member of 'items' with meaning 'systolic'
    items[id1]                          -- the member of 'items' with node id 'id1'
```
====

The Xpath equivalents are:

====
at-coded ADL2::
+
```xpath
    items[1]                              -- the first member of 'items'
    items[meaning() = 'systolic']         -- the member of 'items' for which the meaning()
                                          -- function evaluates to "systolic"
    items[@archetype_node_id = 'at0003']  -- the member of 'items' with key 'at0003'
```

id-coded ADL2::
+
```xpath
    items[1]                           -- the first member of 'items'
    items[meaning() = 'systolic']      -- the member of 'items' for which the meaning()
                                       -- function evaluates to "systolic"
    items[@archetype_node_id = 'id1']  -- the member of 'items' with key 'id1'
```
====

In the above, `meaning()` is a notional function is defined for Xpath in openEHR, which returns the rubric for the node_id of the current node. Such paths are only for display purposes, and paths used for computing always use the 'at' ('id') codes, e.g. `items[at0003]` (`items[id1]`), for which the Xpath equivalent is `items[@node_id = 'at0003']` (`items[@node_id = 'id1']`).

The ADL movable path pattern is a direct analogue of the Xpath syntax abbreviation for the 'descendant' axis.


# Default Values

## Syntax

In ADL, it is possible to specify a default value for any object node. This is usually limited to locally specialised archetypes and templates, since default values are usually specific to local contexts or use cases. However they may validly be used in any archetype.

Default values are expressed in any regular object instance syntax, including {openehr_odin}[ODIN syntax^] and {json}[JSON^], since they are instances of objects rather than constraints. They are introduced using a pseudo-attribute `_default`, followed by the `'='` symbol, and then a block in the chosen syntax. The following shows the syntax in ODIN.

```cadl
    --
    -- ODIN embedded in ADL
    --
    /path[idN].../value ∈ {
        TYPE ∈ {
            _default = (TYPE) <
                attribute_1 = <value_1>
                attribute_2 = <value_2>
                ...
                attribute_N = <value_N>
            >
        }
    }
```

The JSON equivalent is shown below.

```cadl
    --
    -- JSON embedded in ADL
    --
    /path[idN].../value ∈ {
        TYPE ∈ {
            _default = (json) <#
                {
                    "_type": "TYPE",
                    "attribute_1": value_1,
                    "attribute_2": value_2,
                    ...
                    "attribute_N": value_N
                }
            #>
        }
    }
```

A default value is either of the same type as specified by the corresponding archetype node (i.e. the first occurrence of 'TYPE' in each of the above examples) or any subtype allowed by the reference model. Accordingly, the second occurrence of 'TYPE' in both ODIN and JSON cases above represents either the same type as the first, or a subtype.

## Examples

Within a template, a default value can be defined to support the situation where only one value is possible for a data item due to the specific nature of the template. For example, a blood pressure archetype may allow a number of possible values for 'patient position', such as 'lying', and 'sitting', 'standing'. When used in a hospital, the patient will usually be lying so a default value for this can be set, as shown in the following example:

====
at-coded ADL2::
+
```cadl
    /data[at0001]/events[at0005]/state[at0006]/items[at0007]/value ∈ {
        DV_CODED_TEXT ∈ {
            _default = (DV_CODED_TEXT) <
                defining_code = <[snomed_ct::163033001|lying BP|]>
            >
        }
    }
```

id-coded ADL2::
+
```cadl
    /data[id2]/events[id6]/state[id7]/items[id8]/value ∈ {
        DV_CODED_TEXT ∈ {
            _default = (DV_CODED_TEXT) <
                defining_code = <[snomed_ct::163033001|lying BP|]>
            >
        }
    }
```
====

The example above only sets the default value, but it could have also modified the constraint on the value object as well, as in the following version, where the standing blood pressure possibility from the archetype has been removed:

====
at-coded ADL2::
+
```cadl
    /data[at0001]/events[at0005]/state[at0006]/items[at0007]/value ∈ {
        DV_CODED_TEXT ∈ {
            defining_code ∈ {
                [snomed_ct::163035008|sitting BP|],
                [snomed_ct::163033001|lying BP|]
            }
            _default = (DV_CODED_TEXT) <
                defining_code = <[snomed_ct::163033001|lying BP|]>
            >
        }
    }
```

id-coded ADL2::
+
```cadl
    /data[id2]/events[id6]/state[id7]/items[id8]/value ∈ {
        DV_CODED_TEXT ∈ {
            defining_code ∈ {
                [snomed_ct::163035008|sitting BP|],
                [snomed_ct::163033001|lying BP|]
            }
            _default = (DV_CODED_TEXT) <
                defining_code = <[snomed_ct::163033001|lying BP|]>
            >
        }
    }
```
====

Note that in the above, the standard brief syntax for a `CODE_PHRASE` (also the equivalent class `Terminology_code`) is used. In the JSON format, the default value in the above examples is as follows:

====
at-coded ADL2::
+
```cadl
    /data[at0001]/events[at0005]/state[at0006]/items[at0007]/value ∈ {
        DV_CODED_TEXT ∈ {
            _default = (json) <#
                {
                    "_type": "DV_CODED_TEXT",
                    "defining_code": {
                        "terminology_id": "snomed_ct",
                        "code_string":    "163033001",
                        "value":          "lying BP"
                    }
                }
            #>
        }
    }
```

id-coded ADL2::
+
```cadl
    /data[id2]/events[id6]/state[id7]/items[id8]/value ∈ {
        DV_CODED_TEXT ∈ {
            _default = (json) <#
                {
                    "_type": "DV_CODED_TEXT",
                    "defining_code": {
                        "terminology_id": "snomed_ct",
                        "code_string":    "163033001",
                        "value":          "lying BP"
                    }
                }
            #>
        }
    }
```
====


# ADL - Archetype Definition Language

## Introduction

This section describes whole ADL artefacts. The relationship of the cADL-encoded `definition` section and the ODIN-encoded `terminology` section is discussed in detail.

Some syntax validity rules are defined, but validity in general is defined by the rules stated in the AOM specification, which can be checked by a compiler as soon as an AOM structure is parsed from an ADL document (or other serialisation format).

The general structure of ADL artefacts is as follows (the full definitions are shown in <<Syntax Specification>> below):

```antlr-java
adl_artefact: artefact_type meta_data?
        ARCHETYPE_HRID
    ('specialize' 
        ARCHETYPE_REF)?
    'language'
        odin_text
    'description'
        odin_text
    'definition'
        c_complex_object
    ('rules'
        el_text)?
    ('rm_overlay'
        odin_text)?
    'terminology'
        odin_text
    ('annotations' 
        odin_text)?
    ;
    
artefact_type: 'archetype' | 'template' | 'template_overlay' | 'operational_template' ;

meta_data: '(' meta_data_item  (';' meta_data_item )* ')' ;
```

The syntax for `meta_data_item`, `ARCHETYPE_HRID` and `ARCHETYPE_REF` can be found below in <<_syntax_specification>>.

The 'archetype' artefact type can have any or all of the above sections. The other artefact types are more specific in their form. 

An ADL source template has the following structure.

```antlr-java
adl_template: 'template' meta_data?
        ARCHETYPE_HRID
    'specialize' 
        ARCHETYPE_REF
    'language'
        odin_text
    'description'
        odin_text
    'definition'
        c_complex_object
    ('rules'
        el_text)?
    ('rm_overlay'
        odin_text)?
    'terminology'
        odin_text
    ('annotations' 
        odin_text)?
    ;
```

An ADL template overlay has the structure shown below.

```antlr-java
adl_template_overlay: 'template_overlay'
        ARCHETYPE_HRID
    'specialize' 
        ARCHETYPE_REF
    'definition'
        c_complex_object
    ('rules'
        el_text)?
    ('rm_overlay'
        odin_text)?
    'terminology'
        odin_text
    ;
```

The structure of an operational template is as follows.

```antlr-java
adl_operational_template: 'operational_template' meta_data?
        ARCHETYPE_HRID
    'language'
        odin_text
    'description'
        odin_text
    'definition'
        c_complex_object
    ('rules'
        el_text)?
    ('rm_overlay'
        odin_text)?
    'terminology'
        odin_text
    ('annotations' 
        odin_text)?
    'component_terminologies'
        odin_text
    ;
```


## File-naming Convention

Up until ADL 1.4, archetypes were expressed in 'flat' form ADL and were saved in files with the extension `.adl`. These are now treated as legacy flat format files. Beginning with ADL 2, the source file format of an archetype is the 'differential' form, with the extension `.adls`. The flat format generated by tools now has the extension `.adlf`.

## Artefact Content

For specialised archetypes, differential form follows the object-oriented convention and only includes overridden or new elements but not unchanged inherited elements. Inherited elements are determined by compiling and 'flattening' a differential archetype with respect to the parent archetypes in its _inheritance lineage_ .

For top-level archetypes the full structure is included in the differential file, but internal references, where they exist, are expanded out in the flat form.

## Basics

### Keywords

ADL has a small number of keywords which are reserved for use in archetype declarations, as follows:

* `archetype`, `template`, `template_overlay`, `operational_template`,
* `specialise` / `specialize`,
* `language` ,
* `description` , `definition` , `rules` , `terminology`
* `annotations`

All of these words can safely appear as identifiers in the `definition` and `terminology` sections.

Deprecated keywords include:

* `invariant` -- replaced by `rules`
* `ontology`  -- replaced by `terminology`
* `concept`   -- obsolete

### Artefact declaration

The first word in a source ADL archetype declares the artefact type, and is one of the following keywords:

* `archetype`:        signifies an archetype;
* `template`:         signifies a template;
* `template_overlay`: signifies an overlay component of a template.

The flattened form of any of the above types starts with the keyword 'flat' followed by the artefact type.

A fourth artefact type is also possible.

* `operational_archetype`: signifies an operational archetype, generated by flattening a template.

### Node Identifier Codes

In the `definition` section of an ADL archetype, a specific set of codes is used as node identifiers. Identifier codes always appear in brackets (`[]` ), and begin with the 'at' prefix for at-coded archetypes or 'id' prefix for id-coded archetypes. Specialisations of locally coded concepts have the same root, followed by 'dot' extensions, e.g. `[at0009.2]` (`[id10.2]`). From a terminology point of view, these codes have no implied semantics - the 'dot' structuring is used as an optimisation on node identification.

In ADL 1.4 at-codes were used as node identifiers. For id-coded ADL2 archetypes, these are converted to id-codes by ADL 1.4 to ADL 2 converters.

### Local Term Codes

In the `definition` section of an ADL archetype, a second set of codes is used for terms denoting constraints on coded items. Term codes are either local to the archetype, or from an external lexicon. This means that the archetype description is the same in all languages, and is available in any language that the codes have been translated to. All term codes are shown in brackets (`[]`) and are prefixed with "at", e.g. `at0009` (`at10`) . Codes of any length are acceptable in ADL archetypes. Specialisations of locally coded concepts have the same root, followed by 'dot' extensions, e.g. `at0009.2` (`at10.2`) . From a terminology point of view, these codes have no implied semantics - the 'dot' structuring is used as an optimisation on node identification.

### Local Value Set Codes

A third kind of local code is used to stand for value set constraints on coded text items in the body of the archetype. Because they are language- and/or terminology-sensitive, they are defined in the terminology section, and referenced by codes prefixed by "ac", e.g. `[ac9]`.

*Deprecated*: In ADL 1.4 and transitional forms of ADL 1.5/2, 0-padded 'at' and 'ac' codes were used within top-level archetypes. These are also used in at-coded ADL2.
In id-coded ADL2 however, all such codes are reformatted to remove the 0-padding.

## Archetype Identification Section

This section introduces the archetype with the keyword `archetype`, `template`, `template_overlay` or `operational_archetype`, followed by a number of items of meta-data in parentheses, and on the next line, a human-readable archetype identifier. The following shows an identification section with all possible meta-data items.

```adl
archetype (adl_version=2.4.0; rm_release=1.0.3; provenance_id=15E82D77-7DB7-4F70-8D8E-EED6FF241B2D; build_uid=E163E472-3E90-409C-9803-0668A7DA48CE; generated; controlled)
    openEHR-EHR-OBSERVATION.haematology_result.v0.1.9
```

### ADL Version Indicator

An ADL version identifier is mandatory in all archetypes, and is expressed as a string of the form `adl_version=N.M` , or `N.M.P`, where `N.M[.P]` is the ADL release identifier.

### RM Release Indicator

An RM (Reference Model) Release identifier is mandatory in all archetypes, and is expressed as a string of the form `rm_release=N.M`, or `N.M.P`, where the version number indicates the release of the reference model on which the archetype is based.

### Machine Identifiers

A unique identifier for the archetype in the form of a GUID can be specified using the syntax below:

```adl
archetype (adl_version=2.4.0; rm_release=1.0.3; uid=15E82D77-7DB7-4F70-8D8E-EED6FF241B2D)
```

This identifier is set at initial creation or at any time later, and never subsequently changes. It acts as an identifier for the physical artefact, regardless of what semantics are changed, including changes to the constituent parts of the multi-axial identifier.

A `build_uid` identifier can also be specified, with a GUID value, identifying the current artefact. This identifier changes whenever any change is made to the text of the archetype, and can thus be used to disambiguate subsequent versions.

### Namespaces

A namespaced archetype has an identification section like the following examples:

```adl
archetype (adl_version=2.4.0; rm_release=1.0.2)
    br.gov.saude::openEHR-EHR-OBSERVATION.haematology_result.v1.0.0

template (adl_version=2.4.0; rm_release=1.0.2)
    uk.org.primary_care::openEHR-EHR-OBSERVATION.haematology_result.v1.2.15

archetype (adl_version=2.4.0; rm_release=1.0.2)
    org.openehr::openEHR-EHR-OBSERVATION.haematology_result.v3.22.125-rc.7
```

Namespaces are used to distinguish locally created artefacts representing a given concept (such as 'haematology result') from an artefact created elsewhere intended to represent the same concept.

Once a namespace is attached to an archetype, it is considered a part of the identifier, and never changed, even if the archetype moves to a new publishing organisation. This ensures the constant relationship between archetypes and the data created using them.

### Human Readable Archetype Identifier

The archetype identifier may include a namespace, in the form of a reverse domain name, which denotes the original authoring organisation. The lack of a namespace in the identifier indicates an ad hoc, uncontrolled artefact, not formally associated with any organisation, typical for experimental archetypes, and pre-ADL 1.5 archetypes not yet upgraded to have a namespace. The main part of the identifier is multi-axial concept identifier.

A typical identification section for an ad hoc archetype is as follows:

```adl
archetype (adl_version=2.4.0; rm_release=1.0.2)
    openEHR-EHR-OBSERVATION.haematology_result.v0.1.9
```

*Deprecated*: In ADL 1.4 and transitional forms of ADL 1.5, archetype identifiers included only a single version number, and this typically started at 1. Tools that deal with older archetypes should accept these identifiers, and convert the version part to 'v1.0.0' or any other appropriate identifier, obeying the openEHR Artefact Knowledge Identification specification.

The multi-axial archetype identifier identifies archetypes in a global concept space within a given namespace. It is also known as an 'ontological' identifier, since the concept space can be understood as an ontology of informational concepts on which the archetypes are based. The syntax of the identifier is described in the {openehr_am_id}[openEHR Identification Specification^]. The structure of the concept space is essentially two-level, with the first level being a reference model class (e.g. openEHR `OBSERVATION` class) and the second being a domain concept (e.g. 'haematology result').

Because namespaces are usually treated hierarchically, higher level namespaces (e.g. '.org' domains) are assumed to be includable by more local namespaces, with the result that the concept definition space is inherited as well.

### Specialised Archetype Identification

The archetype identifier of any specialised archetype, including all templates, follows the same rules as for non-specialised archetypes.

*Deprecated*: in previous versions of ADL, the archetype identifier of a specialised archetype had a concept part that consisted of the concept part of the parent followed by '-' and a further specialised concept. For example, `openEHR-EHR-OBSERVATION.haematology-cbc. v1` was a valid child of `openEHR-EHR-OBSERVATION.haematology.v1`. This restriction is no longer the case. The previous style of identifier is still legal, but the '-' no longer has any significance.

### Version Identifiers

ADL 2 Archetypes contain 3-part version identifiers, with optional qualifiers, following the openEHR Artefact Knowledge Identification specification. Examples below:

```adl
    br.ms::openEHR-EHR-OBSERVATION.haematology_result.v1.0.0
    br.ms::openEHR-EHR-OBSERVATION.haematology_result.v1.2.15-alpha.45
    br.ms::openEHR-EHR-OBSERVATION.haematology_result.v3.22.125-rc.7
```

The version identifier variants are summarised as follows:

* `N.M.P`         - 3-part version id with no qualifier indicates major.minor.path version
* `N.M.P-alpha.N` - a `-alpha.N` qualifier indicates uncontrolled changes on `N.M.P` , leading to a new version that is yet to be decided
* `N.M.P-rc.N`    - a `-rc.N` qualifier indicates a release candidate.

### Validity

The following syntax validity rule applies in the identification section:

SARID: archetype identifier validity. the identifier of the artefact must conform to the ARCHETYPE_ID identifier syntax defined in the {openehr_base_types}[openEHR BASE/Base Types Specification].

### Generated Indicator

A flag indicating whether the archetype was generated or authored can be included after the version, as follows:

```adl
archetype (adl_version=2.4.0; rm_release=1.0.2; generated)
    org.openehr::openEHR-EHR-OBSERVATION.haematology.v1.2.0
```

This marker is used to support the migration to differential archetype representation introduced in ADL 1.5, to enable proper representation of specialised archetypes. The 'generated' marker can be used on specialised archetypes - i.e. ADL 1.5 style .adls files - generated from flat archetypes - ADL 1.4 .adl files - and also in flat archetypes generated from differential files, by an inheritance-flattening process.

### Controlled Indicator

A flag indicating whether the archetype is change-controlled or not can be included after the version, as follows:

```adl
archetype (adl_version=2.4.0; rm_release=1.0.2; controlled)
    org.openehr::openEHR-EHR-OBSERVATION.haematology.v1.2.0
```

This flag may have the two values `controlled` and `uncontrolled` only, and is an aid to authoring tools, but has no semantic significance. Tools may treat archetypes with an `uncontrolled` flag as not needing version control, whereas archetypes containing the `controlled` flag should be versioned on every change. This enables archetypes to be repeatedly edited in early development without generating large version histories of little or no value.

## Specialise Section

This optional section indicates that the archetype is a specialisation of some other archetype, whose identity must be given. Only one specialisation parent is allowed, i.e. an archetype cannot 'multiply-inherit' from other archetypes. An example of declaring specialisation is as follows:

```adl
archetype (adl_version=2.4.0; rm_release=1.0.2)
    openEHR-EHR-OBSERVATION.cbc.v1.0.0
specialise 
    openEHR-EHR-OBSERVATION.haematology.v1
```

Here the identifier of the new archetype is derived from that of the parent by adding a new section to its domain concept section. See the `ARCHETYPE_ID` definition in the identification package in the {openehr_rm_support}[openEHR Support IM specification^].

Note that both the US and British English versions of the word "specialise" are valid in ADL.

The following syntax validity rule applies in the specialisation section:

SASID: archetype specialisation parent identifier validity. for specialised artefacts, the identifier of the specialisation parent must conform to the ARCHETYPE_ID identifier syntax defined in the {openehr_rm_support}[openEHR Support IM specification^].

## Language Section

The `language` section includes meta-data describing the original language in which the archetype was authored (essential for evaluating natural language quality), and the total list of languages available in the archetype. There can be only one `original_language` . The `translations` list must be updated every time a translation of the archetype is undertaken. The following shows a typical example.

```adl
language
    original_language = <[iso_639-1::en]>
    translations = <
        ["de"] = <
            language = <[iso_639-1::de]>
            author = <
                ["name"] = <"Frederik Tyler">
                ["email"] = <"freddy@something.somewhere.co.uk">
            >
            accreditation = <"British Medical Translator id 00400595">
        >
        ["ru"] = <
            language = <[iso_639-1::ru]>
            author = <
                ["name"] = <"Nina Alexandrovna">
                ["organisation"] = <"Dostoevsky Media Services">
                ["email"] = <"nina@translation.dms.ru">
            >
            accreditation = <"Russian Translator id 892230-3A">
        >
    >
```

Archetypes must always be translated completely, or not at all, to be valid. This means that when a new translation is made, every language dependent section of the `description` and `terminology` sections has to be translated into the new language, and an appropriate addition made to the `translations` list in the language section.

NOTE: some non-conforming ADL tools in the past created archetypes without a language section, relying on the terminology section to provide the original_language (there called primary_language) and list of languages (`languages_available`). In the interests of backward compatibility, tool builders should consider accepting archetypes of the old form and upgrading them when parsing to the correct form, which should then be used for serialising/saving.


## Description Section

The `description` section of an archetype contains descriptive information, or what some people think of as document "meta-data", i.e. items that can be used in repository indexes and for searching. The ODIN syntax is used for the description, as in the following example.

```adl
description
    original_author = <
        ["name"] = <"Dr J Joyce">
        ["organisation"] = <"NT Health Service">
        ["date"] = <2003-08-03>
    >
    lifecycle_state =  <"initial">
    resource_package_uri =  <"http://www.aihw.org.au/data_sets/diabetic_archetypes.html">

    details = <
        ["en"] = <
            language = <[iso_639-1::en]>
            purpose =  <"archetype for diabetic patient review">
            use = <"used for all hospital or clinic-based diabetic reviews, 
                including first time. Optional sections are removed according to the particular review">
            misuse = <"not appropriate for pre-diagnosis use">
            original_resource_uri = <"http://www.healthdata.org.au/data_sets/diabetic_review_data_set_1.html">
            other_details = <...>
        >
        ["de"] = <
            language = <[iso_639-1::de]>
            purpose =  <"Archetyp für die Untersuchung von Patienten mit Diabetes">
            use = <"wird benutzt für alle Diabetes-Untersuchungen im
                    Krankenhaus, inklusive der ersten Vorstellung. Optionale
                    Abschnitte werden in Abhängigkeit von der speziellen
                    Vorstellung entfernt.">
            misuse = <"nicht geeignet für Benutzung vor Diagnosestellung">
            original_resource_uri = <"http://www.healthdata.org.au/data_sets/diabetic_review_data_set_1.html">
            other_details = <...>
        >
    >
```

A number of details are worth noting here. Firstly, the free hierarchical structuring capability of ODIN is exploited for expressing the 'deep' structure of the `details` section and its subsections. Secondly, the ODIN qualified list form is used to allow multiple translations of the `purpose` and `use` to be shown. Lastly, empty items such as `misuse` (structured if there is data) are shown with just one level of empty brackets. The above example shows meta-data based on the {openehr_am_aom2}[openEHR Archetype Object Model (AOM)^].

The `description` section is technically optional according to the AOM, but in any realistic use of ADL for archetypes, it will be required. A minimal description section satisfying to the AOM is as follows:

```adl
description
    original_author = <
        ["name"] = <"Dr J Joyce">
        ["organisation"] = <"NT Health Service">
        ["date"] = <2003-08-03>
    >
    lifecycle_state = <"initial">
    details = <
        ["en"] = <
            language = <[iso_639-1::en]>
            purpose = <"archetype for diabetic patient review">
        >
    >
```

## Deprecated Sections

### Concept Section

A 'concept' section was required up until ADL 1.4. In ADL 1.5, the concept section is deprecated, but allowed, enabling ADL 1.4 archetypes to be treated as valid. It will be removed in a future version of ADL, since it is completely redundant.

All archetypes represent some real world concept, such as a "patient", a "blood pressure", or an "ante-natal examination". The concept is always coded, ensuring that it can be displayed in any language the archetype has been translated to. A typical `concept` section is as follows:

```
concept [at0000] -- haematology result
```

In this concept definition, the term definition of `[at0000]` is the proper description corresponding to the "haematology-cbc" section of the archetype identifier above.

The following syntax validity rule applies to the concept section, if present, allowing parsers to correctly ignore it:

SACO: archetype concept validity: if a concept section is present, it must consist of the 'concept' keyword and a single local term.
## Definition Section

The `definition` section contains the main formal definition of the archetype, and is written in the Constraint Definition Language (cADL). A typical `definition` section is as follows:

====
at-coded ADL2::
+
```adl
definition
    OBSERVATION[at0000] ∈ {                                              -- blood pressure measurement
        name ∈ {                                                         -- any synonym of BP
            DV_CODED_TEXT[at9000] ∈ {
                defining_code ∈ {
                    CODE_PHRASE[at9001] ∈ {[ac1]}
                }
            }
        }
        data ∈ {
            HISTORY[at0003] ∈ {                                             -- history
                events cardinality ∈ {1..*} ∈ {
                    POINT_EVENT[at0004] occurrences ∈ {0..1} ∈ {            -- baseline
                        name ∈ {
                            DV_CODED_TEXT[at9002] ∈ {
                                defining_code ∈ {
                                    CODE_PHRASE[at9003] ∈ {[ac2]}
                                }
                            }
                        }
                        data ∈ {
                            ITEM_LIST[at0007] ∈ {                              -- systemic arterial BP
                                items cardinality ∈ {2..*} ∈ {
                                    ELEMENT[at0008] ∈ {                        -- systolic BP
                                        name ∈ {                               -- any synonym of 'systolic'
                                            DV_CODED_TEXT[at9004] ∈ {
                                                defining_code ∈ {
                                                    CODE_PHRASE[at9005] ∈ {[ac2]}
                                                }
                                            }
                                        }
                                        value ∈ {
                                            DV_QUANTITY[at9006] ∈ {
                                                magnitude ∈ {|0..1000|}
                                                property ∈ {[properties::944]}  -- "pressure"
                                                units ∈ {[units::387]}          -- "mm[Hg]"
                                            }
                                        }
                                    }
                                    ELEMENT[at0078] ∈ {                          -- diastolic BP
                                        name ∈ {                                 -- any synonym of 'diastolic'
                                            DV_CODED_TEXT[at9007] ∈ {
                                                defining_code ∈ {
                                                    CODE_PHRASE[at9008] ∈ {[ac3]}
                                                }
                                            }
                                        }
                                        value ∈ {
                                            DV_QUANTITY[at9009] ∈ {
                                                magnitude ∈ {|0..1000|}
                                                property ∈ {[properties::944]}   -- "pressure"
                                                units ∈ {[units::387]}           -- "mm[Hg]"
                                            }
                                        }
                                    }
                                    ELEMENT[at0016] occurrences ∈ {0..*} ∈ {*}    -- unknown new item
                                }
                            ...
```

id-coded ADL2::
+
```adl
definition
    OBSERVATION[id1] ∈ {                                                 -- blood pressure measurement
        name ∈ {                                                         -- any synonym of BP
            DV_CODED_TEXT[id2] ∈ {
                defining_code ∈ {
                    CODE_PHRASE[id3] ∈ {[ac1]}
                }
            }
        }
        data ∈ {
            HISTORY[id4] ∈ {                                             -- history
                events cardinality ∈ {1..*} ∈ {
                    POINT_EVENT[id5] occurrences ∈ {0..1} ∈ {            -- baseline
                        name ∈ {
                            DV_CODED_TEXT[id6] ∈ {
                                defining_code ∈ {
                                    CODE_PHRASE[id7] ∈ {[ac2]}
                                }
                            }
                        }
                        data ∈ {
                            ITEM_LIST[id8] ∈ {                              -- systemic arterial BP
                                items cardinality ∈ {2..*} ∈ {
                                    ELEMENT[id9] ∈ {                        -- systolic BP
                                        name ∈ {                            -- any synonym of 'systolic'
                                            DV_CODED_TEXT[id10] ∈ {
                                                defining_code ∈ {
                                                    CODE_PHRASE[id11] ∈ {[ac2]}
                                                }
                                            }
                                        }
                                        value ∈ {
                                            DV_QUANTITY[id12] ∈ {
                                                magnitude ∈ {|0..1000|}
                                                property ∈ {[properties::944]}  -- "pressure"
                                                units ∈ {[units::387]}          -- "mm[Hg]"
                                            }
                                        }
                                    }
                                    ELEMENT[id79] ∈ {                            -- diastolic BP
                                        name ∈ {                                 -- any synonym of 'diastolic'
                                            DV_CODED_TEXT[id14] ∈ {
                                                defining_code ∈ {
                                                    CODE_PHRASE[id15] ∈ {[ac3]}
                                                }
                                            }
                                        }
                                        value ∈ {
                                            DV_QUANTITY[id16] ∈ {
                                                magnitude ∈ {|0..1000|}
                                                property ∈ {[properties::944]}   -- "pressure"
                                                units ∈ {[units::387]}           -- "mm[Hg]"
                                            }
                                        }
                                    }
                                    ELEMENT[id17] occurrences ∈ {0..*} ∈ {*}    -- unknown new item
                                }
                            ...
```
====

This definition expresses constraints on instances of the types `ENTRY` , `HISTORY` , `EVENT` , `ITEM_LIST` , `ELEMENT` , `QUANTITY` , and `CODED_TEXT` so as to allow them to represent a blood pressure measurement, consisting of a history of measurement events, each consisting of at least systolic and diastolic pressures, as well as any number of other items (expressed by the `[id17]` "any" node near the bottom).

### Design-time and Run-time paths

All archetype object constraint nodes require a node identifier. When data are created according to the `definition` section of an archetype, the archetype node identifiers can be written into the data, providing a reliable way of finding data nodes, regardless of what other runtime names might have been chosen by the user for the node in question. There are two reasons for doing this. Firstly, querying cannot rely on runtime names of nodes (e.g. names like "sys BP", "systolic bp", "sys blood press." entered by a doctor are unreliable for querying); secondly, it allows runtime data retrieved from a persistence mechanism to be re-associated with the cADL structure which was used to create it.

An example which shows the difference between design-time meanings associated with node identifiers and runtime names is the following, from a `SECTION` archetype representing the problem/SOAP headings (a simple heading structure commonly used by clinicians to record patient contacts under top-level headings corresponding to the patient's problem(s), and under each problem heading, the headings "subjective", "objective", "assessment", and "plan").

====
at-coded ADL2::
+
```cadl
    SECTION[at0000] matches {                       -- problem
        name matches {
            DV_CODED_TEXT[at9000] matches {
                defining_code matches {[ac1]}       -- any clinical problem type
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    SECTION[id1] matches {                          -- problem
        name matches {
            DV_CODED_TEXT[id2] matches {
                defining_code matches {[ac1]}       -- any clinical problem type
            }
        }
    }
```
====

In the above, the node identifier `[at0000]` (`[id1]`) is assigned a meaning such as "clinical problem" in the archetype terminology section. The subsequent lines express a constraint on the runtime _name_ attribute, using the internal code `[ac1]` . The constraint `[ac1]` is also defined in the archetype terminology section with a formal statement meaning "any clinical problem type", which could clearly evaluate to thousands of possible values, such as "diabetes", "arthritis" and so on. As a result, in the runtime data, the node identifier corresponding to "clinical problem" and the actual problem type chosen at runtime by a user, e.g. "diabetes", can both be found. This enables querying to find all nodes with meaning "problem", or all nodes describing the problem "diabetes". Internal `[acN]` codes are described in <<_local_value_set_codes>>.

## Rules Section

The `rules` section in an ADL archetype contains _statements_ representing assertions and computational expressions that relate to the entire archetype. Assertions in the `rules` section represent constraints that are not possible within the block structure of the `definition` section. Any constraint that references more than one property is in this category, as are constraints or expressions containing mathematical or logical formulae. Archetype rules are a subset of the openEHR Basic Expression Language (BEL), described in the {openehr_basic_expression_language}[openEHR BEL specification^].

### Assertions

Semantically, an assertion is a first order predicate logic statement which can be evaluated to a Boolean result at runtime. Objects and properties are referred to using paths within an assertion.

A reference to an object in data, including a leaf value, is expressed using an archetype path. All such paths are absolute (i.e. contain a leading '/') and are understood to be with respect to the root of the current archetype.

Types of assertions used in archetypes include:

* _arithmetic identities_: constraints involving more than one node in an archetype, such as an assertion stating that the sum of the five 0-2 value scores in an Apgar test (heart-rate, breathing, muscle tone, reflex, colour) is equal to the Apgar total, recorded in a sixth node;
* _mathematical formulae_: constraints involving a mathematical formulae that relate various items together, e.g. the pulse pressure and mean arterial pressure formulae used in cardiology;
* _value-dependent existence_: in some cases optional archetype nodes are intended to be mandatory (or occasionally non-existent) if some other element within the same archetype has a specific value, for example a sub-tree that records details of 'tobacco use' may be considered mandatory if an earlier Boolean node representing 'tobacco user?' has a positive value.

Each of these is described below.

#### Arithmetic Identities

Assertions can be stated that make explicit intended arithmetic identities among value nodes in an archetype. For example, in an archetype representing {wikipedia}Apgar_score[Apgar Score], five values should sum to equal the total. This can be expressed as the following assertions:

====
at-coded ADL2::
+
```
rules
	$respiratory_effort: Integer := /data[at0002]/events[at0003]/data[at0001]/items[at0009]/value[at9001]/value
    $heart_rate: Integer := /data[at0002]/events[at0003]/data[at0001]/items[at0005]/value[at9002]/value
    $muscle_tone: Integer := /data[at0002]/events[at0003]/data[at0001]/items[at0013]/value[at9003]/value
    $reflex_irritability: Integer := /data[at0002]/events[at0003]/data[at0001]/items[at0017]/value[at9004]/value
    $skin_colour: Integer := /data[at0002]/events[at0003]/data[at0001]/items[at0021]/value[at9005]/value
    $apgar_score: Integer := /data[at0002]/events[at0003]/data[at0001]/items[at0025]/value[at9006]/magnitude

    Apgar_total: $apgar_score = $respiratory_effort + $heart_rate + $muscle_tone + $reflex_irritability + $skin_colour
```

id-coded ADL2::
+
```
rules
    $respiratory_effort: Integer := /data[id3]/events[id4]/data[id2]/items[id10]/value[id39]/value
    $heart_rate: Integer := /data[id3]/events[id4]/data[id2]/items[id6]/value[id40]/value
    $muscle_tone: Integer := /data[id3]/events[id4]/data[id2]/items[id14]/value[id41]/value
    $reflex_irritability: Integer := /data[id3]/events[id4]/data[id2]/items[id18]/value[id42]/value
    $skin_colour: Integer := /data[id3]/events[id4]/data[id2]/items[id22]/value[id43]/value
    $apgar_score: Integer := /data[id3]/events[id4]/data[id2]/items[id26]/value[id44]/magnitude

    Apgar_total: $apgar_score = $respiratory_effort + $heart_rate + $muscle_tone + $reflex_irritability + $skin_colour
```
====

#### Mathematical Formulae

The following ADL example shows a `rules` section containing the Blood Pressure MAP and Pulse pressure formulae expressed using references to the relevant input and output values in the archetype.

====
at-coded ADL2::
+
```
rules
    $pulse_pressure: Real := /data[at0001]/events[at0006]/data[at0003]/items[at1007]/value/magnitude
    $mean_arterial_pressure: Real := /data[at0001]/events[at0006]/data[at0003]/items[at1006]/value/magnitude
    $systolic_value: Real := /data[at0001]/events[at0006]/data[at0003]/items[at0004]/value/magnitude
    $diastolic_value: Real := /data[at0001]/events[at0006]/data[at0003]/items[at0005]/value/magnitude

    MAP_valid: $mean_arterial_pressure = $diastolic_value + 0.33 * ($systolic_value - $diastolic_value)

    pulse_pressure: $pulse_pressure = $systolic_value - $diastolic_value
```

id-coded ADL2::
+
```
rules
    $pulse_pressure: Real := /data[id2]/events[id7]/data[id4]/items[id1008]/value/magnitude
    $mean_arterial_pressure: Real := /data[id2]/events[id7]/data[id4]/items[id1007]/value/magnitude
    $systolic_value: Real := /data[id2]/events[id7]/data[id4]/items[id5]/value/magnitude
    $diastolic_value: Real := /data[id2]/events[id7]/data[id4]/items[id6]/value/magnitude

    MAP_valid: $mean_arterial_pressure = $diastolic_value + 0.33 * ($systolic_value - $diastolic_value)

    pulse_pressure: $pulse_pressure = $systolic_value - $diastolic_value
```
====

These assertions can be visualised in tools, e.g. as follows in the {openehr_awb}[ADL Workbench].

.ADL assertion examples
image::{doc_name}/images/assertions_bp_map_pp.png[id=assertions_bp_map_pp.png, align="center", width="70%"]

More complex assertions make use of _variable sub-paths_ and the `for_all` operator to check multiple values in a repeated structure, as in this example.

====
at-coded ADL2::
+
```
    -- ensure that each mean arterial pressure value in a series of blood pressures
    -- has the correct value.
    for_all $event : /data[at0001]/events
        $event/data[at0003]/items[at1006]/value/magnitude =
            $event/data[at0003]/items[at0005]/value/magnitude + 0.33 *
                ($event/data[at0003]/items[at0004]/value/magnitude - $event/data[at0003]/items[at0005]/value/magnitude)
```

id-coded ADL2::
+
```
    -- ensure that each mean arterial pressure value in a series of blood pressures
    -- has the correct value.
    for_all $event : /data[id2]/events
        $event/data[id4]/items[id1007]/value/magnitude =
            $event/data[id4]/items[id6]/value/magnitude + 0.33 *
                ($event/data[id4]/items[id5]/value/magnitude - $event/data[id4]/items[id6]/value/magnitude)
```
====

NOTE: the evolution toward separation of data context paths and expressions will enable this kind of expression to be made more readable in future.

#### Value-dependent Existence

One specific type of logical expression that is commonly required in archetypes is used to state the mandation (or otherwise) of certain data points as conditional on another specific data point. An example is an archetype that documents Tobacco use. This will normally contain a data point representing substance 'use status', which may have values such as 'never used', 'occasional user', 'frequent user', etc.; and another set of data points quantifying the use. Clearly, if the 'use status' is 'never', the latter set of data is not needed; conversely, if 'use status' is any other value, the quantifying data items are needed. To make them mandatory if the 'use status' is any value other than 'never used', rules like the following can be used.

====
at-coded ADL2::
+
```
rules
    $substance_use_status: Boolean := /data[at0001]/items[at0002]/value[at90001]
    $substance_use_data: Object_ref := /data[at0001]/items[at0007|details of use|]

    Substance_use: $substance_use_status /= [at0016|never used|] implies
        exists /data[at0001]/items[at0007|details of use|]
```

id-coded ADL2::
+
```
rules
    $substance_use_status: Boolean := /data[id2]/items[id3]/value[id18]
    $substance_use_data: Object_ref := /data[id2]/items[id8|details of use|]

    Substance_use: $substance_use_status /= [at17|never used|] implies
        exists /data[id2]/items[id8|details of use|]
```
====

### Computational Statements

The `rules` section may also include computational statements that can be used to compute values for specific fields, generally based on some published algorithm, rather than just asserting a relationship between various fields. The following shows a set of statements similar to the example above, but with the field bound to `$mean_arterial_pressure` now having its value set, not just tested. The assignment operator (`:=`) is used to achieve this.

====
at-coded ADL2::
+
```
rules
    $mean_arterial_pressure: Real := /data[at0001]/events[at0006]/data[at0003]/items[at1006]/value/magnitude
    $systolic_value: Real := /data[at0001]/events[at0006]/data[at0003]/items[at0004]/value/magnitude
    $diastolic_value: Real := /data[at0001]/events[at0006]/data[at0003]/items[at0005]/value/magnitude

    $mean_arterial_pressure := $diastolic_value + 0.33 * ($systolic_value - $diastolic_value)
```

id-coded ADL2::
+
```
rules
    $mean_arterial_pressure: Real := /data[id2]/events[id7]/data[id4]/items[id1007]/value/magnitude
    $systolic_value: Real := /data[id2]/events[id7]/data[id4]/items[id5]/value/magnitude
    $diastolic_value: Real := /data[id2]/events[id7]/data[id4]/items[id6]/value/magnitude

    $mean_arterial_pressure := $diastolic_value + 0.33 * ($systolic_value - $diastolic_value)
```
====

## RM Overlay Section

Most content in an archetype consists of constraints expressed as an attribute/object structure based on a Reference Model. However, sometimes related meta-data need to be stated with respect to unconstrained RM attributes and paths. Such statements can be made in the `rm_overlay` section of an archetype, which is designed to be extensible. Specific categories of statement or constraint relating to RM attribute paths can be stated within dedicated sub-sections.

### RM Visibility

One of the basic characteristics of any underlying information model which may be archetyped is that its class attributes are already named, typically in English, if the model is internationally shared or standardised. Archetyping solves effective renaming and language-independence of object nodes, via the mechanism of at-codes (id-codes), but attribute names are by default unchangeable and mono-lingual. Experience in archetype-based modelling has shown that renaming of RM attributes within the context of an archetype is a common need, usually because the attribute name chosen in the original model is not sufficiently specific for the users of a particular archetype. An example is the {openehr_rm_ehr}#\_composition_package[openEHR class `COMPOSITION`^], which has an attribute `__composer__`. For particular archetypes corresponding to specific sub-domains in healthcare, or specific geographies, a preferable name may be `__author__`; additionally, any such name (even the original) may be needed in multiple languages.

In ADL, re-labelling of RM attributes is called _aliasing_, and is achieved by mentioning an RM attribute path in the archetype and associating an alias with it, in the form of an at-code, defined according to the usual rules of specialisation. Aliasing may apply to any valid RM path in the archetype, i.e. any path through RM objects referenced in the archetype. If archetype-specific nodes are referenced in a path, the settings relate to those paths only in the data, but if not, the settings relate to any matching RM path through the data.

A second need, related to the above, is that archetype modellers sometimes need to know what elements are already in an information model, so they don't try to remodel them again as redundant object nodes. In a simple implementation of an archetype authoring tool, attributes not so far archetyped will be all hidden, perhaps with a possibility of showing them all. However, commonly, finer-grained control is needed whereby particular attributes, possibly only on _particular object nodes_ need to be made visible in a modelling tool, in order to indicate they need not be modelled.

For this reason a 'show' marker can be associated with the path of an non-constrained RM attribute, causing it to be made visible in a modelling tool. Taking into account archetype and template specialisation, it should also be possible to add a 'hide' marker, in order to hide an attribute marked as 'show' in a specialisation parent. It has also been found by experience that sometimes a constrained RM attribute from a parent archetype needs to be hidden in a specialisation child. Thus, the general case is that 'hide' and 'show' markers can be associated with any RM attribute path (constrained or unconstrained) in the archetype.

Since both of these needs relate to the visibility of RM attributes in an archetype, and are specified in terms of RM attribute paths, an `rm_overlay` sub-section called `rm_visibility` is used to specify them. The following example illustrates the use of this section to force visibility and aliasing of one attribute, and hiding of another attribute within an archetype.

====
at-coded ADL2::
+
```odin
rm_overlay
    rm_visibility = <
        ["/path/to[at0003]/archetype/node[at0212]/path/to/rm/attribute"] = <
            visibility = <"show">
            alias = <[local::at0011]>
        >
        ["/path/to[at0004]/archetype/node[at0063]/path/to/rm/attribute"] = <
            visibility = <"hide">
        >
    >

terminology
    term_definitions = <
        ["en"] = <
            ["at0011"] = <
                text = <"name in English">
                description = <"description in English">
            >
            ...
        >
        ["de"] = <
            ["at0011"] = <
                text = <"name in German">
                description = <"description in German">
            >
            ...
        >
    >
```

id-coded ADL2::
+
```odin
rm_overlay
    rm_visibility = <
        ["/path/to[id4]/archetype/node[id213]/path/to/rm/attribute"] = <
            visibility = <"show">
            alias = <[local::at12]>
        >
        ["/path/to[id5]/archetype/node[id64]/path/to/rm/attribute"] = <
            visibility = <"hide">
        >
    >

terminology
    term_definitions = <
        ["en"] = <
            ["at12"] = <
                text = <"name in English">
                description = <"description in English">
            >
            ...
        >
        ["de"] = <
            ["at12"] = <
                text = <"name in German">
                description = <"description in German">
            >
            ...
        >
    >
```
====

## Terminology Section

### Overview

This section describes the syntax of the `terminology` section of an archetype. The following section, <<Terminology Integration>> describes the semantics.

The `terminology` section of an archetype is expressed in ODIN, and is where codes representing node identifiers, constraints on coded term values, and bindings to terminologies are defined. Linguistic language translations are added in the form of extra blocks keyed by the relevant language. The following example shows the general layout of this section.

====
at-coded ADL2::
+
```adl
terminology
    term_definitions = <
        ["en"] = <
            ["at0001"] = <...>
            ["at0002"] = <...>
            ["ac1"] = <...>
        >
        ["de"] = <
            ["at0000"] = <...>
            ["at0001"] = <...>
            ["ac1"] = <...>
        >
    >
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at0000", "at0001", "at0002", ...>
        >
    >
    term_bindings = <
        ["snomed_ct"] = <
            ["at0003"] = <...>
            ["ac1"] = <...>
            ...
        >
    >
```

id-coded ADL2::
+
```adl
terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <...>
            ["at1"] = <...>
            ["ac1"] = <...>
        >
        ["de"] = <
            ["id1"] = <...>
            ["at1"] = <...>
            ["ac1"] = <...>
        >
    >
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at1", "at2", "at3", ...>
        >
    >
    term_bindings = <
        ["snomed_ct"] = <
            ["id4"] = <...>
            ["ac1"] = <...>
            ...
        >
    >
```
====


### Term_definitions Sub-section

The `term_definitions` section is mandatory, and must contain definitions for all terms requiring them, in all translations in use in the archetype. Terms requiring definitions include:

====
for at-coded archetypes::
+
** all at-codes
** all ac-codes
for id-coded archetypes::
+
** all id-codes of object nodes under a container attribute or which are multiple alternative siblings under a single-valued attribute
** all at-codes
** all ac-codes
====

The following example shows an extract from the English and German term definitions for the archetype local terms in a problem/SOAP headings archetype. Each term is defined using a structure of name/value pairs, and must at least include the names "text" and "description", which correspond to the usual rubric and full definition found in terminologies like {snomed_ct}[SNOMED CT^]. Each term object is then included in the appropriate language list of term definitions, as shown in the example below.

====
at-coded ADL2::
+
```odin
    term_definitions = <
        ["en"] = <
            ["at0000"] = <
                text = <"problem">
                description = <"The problem experienced by the subject of care to which the contained information relates">
            >
            ["at0001"] = <
                text = <"problem/SOAP headings">
                description = <"SOAP heading structure for multiple problems">
            >
            ...
            ["at0002"] = <
                text = <"plan">
                description = <"The clinician's professional advice">
            >
        >
        ["de"] = <
            ["at0000"] = <
                    text = <"klinisches Problem">
                    description = <"Das Problem des Patienten worauf sich diese Informationen beziehen">
            >
            ["at0001"] = <
                    text = <"Problem/SOAP Schema">
                    description = <"SOAP-Schlagwort-Gruppierungsschema fuer mehrfache Probleme">
            >
            ["at0002"] = <
                    text = <"Plan">
                    description = <"Klinisch-professionelle Beratung des Pflegenden">
            >
        >
    >
```

id-coded ADL2::
+
```odin
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"problem">
                description = <"The problem experienced by the subject of care to which the contained information relates">
            >
            ["id2"] = <
                text = <"problem/SOAP headings">
                description = <"SOAP heading structure for multiple problems">
            >
            ...
            ["id3"] = <
                text = <"plan">
                description = <"The clinician's professional advice">
            >
        >
        ["de"] = <
            ["id1"] = <
                    text = <"klinisches Problem">
                    description = <"Das Problem des Patienten worauf sich diese Informationen beziehen">
            >
            ["id2"] = <
                    text = <"Problem/SOAP Schema">
                    description = <"SOAP-Schlagwort-Gruppierungsschema fuer mehrfache Probleme">
            >
            ["id3"] = <
                    text = <"Plan">
                    description = <"Klinisch-professionelle Beratung des Pflegenden">
            >
        >
    >
```
====


In some cases, term definitions may have been lifted from existing terminologies (only a safe thing to do if the definitions _exactly_ match the need in the archetype). To indicate where definitions come from, a "provenance" tag can be used, as follows:

====
at-coded ADL2::
+
```odin
    term_definitions = <
        ["en"] = <
            ...
            ["at0002"] = <
                text = <"plan">
                description = <"The clinician's professional advice">
                provenance = <"ACME_terminology(v3.9a)">
            >
            ...
        >
    >
```

id-coded ADL2::
+
```odin
    term_definitions = <
        ["en"] = <
            ...
            ["id3"] = <
                text = <"plan">
                description = <"The clinician's professional advice">
                provenance = <"ACME_terminology(v3.9a)">
            >
            ...
        >
    >
```
====

Note that this does not indicate a _binding_ to any term, only the origin of its definition. Bindings are described below.

The `term_definitions` section also includes definitions for archetype-local constraint codes, which are of the form `[acN]` in the `definition` part of an archetype. Each such code refers to a terminology 'value set', i.e. a set of possible terms that could be used as the value of the data item being constrained. These constraints are defined in two parts. First, the `ac` code itself is defined - this names the value set. For example:

```odin
    --- within a specialist diagnosis archetype
    term_definitions = <
        ["en"] = <
            ...
            ["ac1"] = <
                text = <"type of hepatitis">
                description = <"any term which means a kind of viral hepatitis">
            >
            ...
        >
    >

    --- within a blood pressure measurement archetype
    term_definitions = <
        ["en"] = <
            ...
            ["ac3"] = <
                text = <"patient position">
                description = <"patient position for blood pressure measurement">
            >
        >
    >
```

### Value_sets Sub-section

The second part is the value set contents. This can be defined either as an 'internal' value set consisting of at-codes, or else as being a value set defined in an external terminology and referenced via a binding. An internal value set is defined using an entry in the `value_sets` sub-section for the `ac` code, containing a list of at-code member values. Each of those members must have its own definition in the `term_definitions` section. The following shows the structures required.

====
at-coded ADL2::
+
```adl
terminology
    term_definitions = <
        ["en"] = <
            ["ac1"] = <...>
            ["at1"] = <...>
            ["at2"] = <...>
            ["at3"] = <...>
        >
    >
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at0000", "at0001", "at0002", ...>
        >
    >
```

id-coded ADL2::
+
```adl
terminology
    term_definitions = <
        ["en"] = <
            ["ac1"] = <...>
            ["at1"] = <...>
            ["at2"] = <...>
            ["at3"] = <...>
        >
    >
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at1", "at2", "at3", ...>
        >
    >
```
====


### Term_bindings Sub-section

A value set and/or its constituent terms may also have 'bindings' to externally defined terms and values sets. Object node at/id-codes may also have bindings, establishing external codings for the names of elements in an archetype. Binding is achieved in the `term_bindings` sub-section. Bindings are grouped under the target terminology they relate to, and each one consists of a key and a target. There are variations of each.

Keys can be any one of:

====
for at-coded archetypes::
+
** an at-code;
** an object node absolute path terminating in an at-code, e.g. `"/data[at0001]/events[at0002]/data[at0003]/item[at0004]"`;
** an ac-code.
for id-coded archetypes::
+
** for id-coded object nodes:
*** just the id-code, e.g. `id4`;
*** an object node  absolute path terminating in an id-code, e.g. `"/data[id2]/events[id3]/data[id1]/item[id4]"`;
** an at-code;
** an ac-code.
====

Binding targets are expressed as URIs that follow the model for {snomed_uris}[terminology URIs published by IHTSDO] or a similar model, in the case of terminologies other than {snomed_ct}[SNOMED CT^]. Because URIs are native types in ADL/ODIN, they do not need quotes.

Bindings may be defined for a given set of terms for more than one terminology, enabling the different bindings to be used in different contexts, e.g. hospital deployment versus aged care.

The following is an extract from a https://github.com/openEHR/adl-archetypes/blob/master/ADL2-reference/features/terminology/term_bindings/openEHR-EHR-OBSERVATION.term_bindings_paths_use_refs.v1.adls[test archetype^] based on the openEHR Apgar archetype, showing the different types of bindings:

====
at-coded ADL2::
+
```odin
    --
    -- Derived from openEHR-EHR-OBSERVATION.term_bindings_paths_use_refs.v1.adls
    --
    term_definitions = <
        ["en"] = <
            ["at0000"] = <
                text = <"Apgar score">
                description = <"Clinical score derived from assessment of respiratory effort, heart rate, reflex irritability, muscle_tone tone and skin skin_colour.">
            >
            ["at0003"] = <
                text = <"1 minute">
                description = <"Apgar score 1 minute after birth.">
            >
            ["at0005"] = <
                text = <"Heart Rate">
                description = <"Recording of the infant's heart rate.">
            >
            ["at0025"] = <
                text = <"Total">
                description = <"The sum of the 5 ordinal scores for each component parameter.">
            >
            ...
            ["at0026"] = <
                text = <"Absent">
                description = <"No heart beat is seen, felt or heard.">
            >
            ...
        >
    >

    term_bindings = <
        ["snomed_ct"] = <
            ["/data[at0002]/events[at0003]/data[at0001]/items[at0025]"] = <http://snomedct.info/id/169895004> -- Apgar score at 1 minute
            ["at0025"] = <http://snomedct.info/id/249228009> -- Total Apgar score (observable entity)
        >
        ["loinc"] = <
            ["/data[at002]/events[at0003]"] = <http://loinc.org/id/48334-7>   -- 1-minute Apgar panel
            ["/data[at002]/events[at0003]/data[at0001]/items[at0005]"] = <http://loinc.org/id/32407-9> -- 1 minute Apgar Heart rate
            ["at0006"] = <http://loinc.org/id/LA6716-0>  -- No heart rate
            ...
        >
        ["umls"] = <
            ["at0000"] = <http://umls.nlm.edu/id/C124305> -- apgar result
            ["at0005"] = <http://umls.nlm.edu/id/C234305> -- cardiac score
        >
    >
```

id-coded ADL2::
+
```odin
    --
    -- Derived from openEHR-EHR-OBSERVATION.term_bindings_paths_use_refs.v1.adls
    --
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"Apgar score">
                description = <"Clinical score derived from assessment of respiratory effort, heart rate, reflex irritability, muscle_tone tone and skin skin_colour.">
            >
            ["id4"] = <
                text = <"1 minute">
                description = <"Apgar score 1 minute after birth.">
            >
            ["id6"] = <
                text = <"Heart Rate">
                description = <"Recording of the infant's heart rate.">
            >
            ["id26"] = <
                text = <"Total">
                description = <"The sum of the 5 ordinal scores for each component parameter.">
            >
            ...
            ["at7"] = <
                text = <"Absent">
                description = <"No heart beat is seen, felt or heard.">
            >
            ...
        >
    >

    term_bindings = <
        ["snomed_ct"] = <
            ["/data[id3]/events[id4]/data[id2]/items[id26]"] = <http://snomedct.info/id/169895004> -- Apgar score at 1 minute
            ["id26"] = <http://snomedct.info/id/249228009> -- Total Apgar score (observable entity)
        >
        ["loinc"] = <
            ["/data[id3]/events[id4]"] = <http://loinc.org/id/48334-7>   -- 1-minute Apgar panel
            ["/data[id3]/events[id4]/data[id2]/items[id6]"] = <http://loinc.org/id/32407-9> -- 1 minute Apgar Heart rate
            ["at7"] = <http://loinc.org/id/LA6716-0>  -- No heart rate
            ...
        >
        ["umls"] = <
            ["id1"] = <http://umls.nlm.edu/id/C124305> -- apgar result
            ["id6"] = <http://umls.nlm.edu/id/C234305> -- cardiac score
        >
    >
```
====

The reason for code and path keys for at-codes (id-codes) is to enable two types of code bindings. A binding to a simple code such as `at0025|Total|` (`id26|Total|`), above, means that the bound term (referred to by the URI `http://snomedct.info/id/249228009`) has a context-independent correlation to the code. However, a 'pre-coordinated' code such as {snomed_ct}[SNOMED CT^] `169895004|Apgar score at 1 minute|` cannot be bound just to `at0025|Total|` (`id26|Total|`), but rather to the node representing the 1-minute total, i.e. at the path `/data[at0002]/events[at0003|1 minute|]/data[at0001]/items[at0025]` (`/data[id3]/events[id4|1 minute|]/data[id2]/items[id26]`). Such paths can be considered as equivalent to a 'post-coordinated' code, and thus the binding establishes a correspondence between an internal post-coordination and an external pre-coordinated code.

In the example shown below, the `at0003` (`id4`) code identifies a 'temperature' node in an archetype, and the codes `at0002`, `at0004`, `at0005` (`id3`, `id5`, `id6`) etc correspond to various times such as 'any', '1-hour average', '1-hour maximum' and so on. Some terminologies (notably {loinc}[LOINC^], the laboratory terminology in this example) define pre-coordinated codes, such as '1 hour body temperature'; these clearly correspond not to single codes such as `at0003` (`id4`) in the archetype, but to whole paths.

====
at-coded ADL2::
+
```odin
    term_bindings = <
        ["LNC205"] = <   -- LNC205 is a namespace corresponding to LOINC 205
            ["/data[at0001]/events[at0002]/data[at0007]/item[at0003]"] = <http://loinc.org/id/8310-5>
            ["/data[at0001]/events[at0004]/data[at0007]/item[at0003]"] = <http://loinc.org/id/8321-2>
            ["/data[at0001]/events[at0005]/data[at0007]/item[at0003]"] = <http://loinc.org/id/8311-3>
        >
    >
```

id-coded ADL2::
+
```odin
    term_bindings = <
        ["LNC205"] = <   -- LNC205 is a namespace corresponding to LOINC 205
            ["/data[id2]/events[id3]/data[id1]/item[id4]"] = <http://loinc.org/id/8310-5>
            ["/data[id2]/events[id5]/data[id1]/item[id4]"] = <http://loinc.org/id/8321-2>
            ["/data[id2]/events[id6]/data[id1]/item[id4]"] = <http://loinc.org/id/8311-3>
        >
    >
```
====

Bindings to external value sets are also included in the bindings section, also as URIs:

```odin
    term_bindings = <
        ["snomed_ct"]    = <
            ["ac1"] = <http://snomed.info/id/123456789>
            ["ac2"] = <http://snomed.info/id/987654321>
        >
    >
```

In this example, each local constraint code is formally defined to refer to a value set whose identifier is known in the {snomed_ct}[SNOMED CT^] terminology.

The next section describes the semantics of term constraining, value sets and binding in some detail.

### Deprecated Terminology Section Features

#### At-codes as identifiers

In at-coded ADL2 archetypes at-codes are used as code values as well as node identifiers. In id-coded ADL2 archetypes at-codes are used only as code values, not node identifiers. Id-codes are used for the latter purpose, providing a clearer separation between node 'names' and node 'values', for the kind of nodes whose values are coded terms.

#### Terminologies_available sub-section

In ADL 1.4, a `terminologies_available` header statement was required to identify all terminologies for which `term_bindings` sections have been written. For example:

```
    terminologies_available = <"snomed_ct", "loinc">
```

This is no longer required. In archetypes that have it, it is ignored, and should not be included in ADL 2 or later syntax output serialisation.

#### Separated definitions and bindings sub-sections

In ADL 1.4, there were two separate definitions sections, `term_definitions` and `constraint_definitions`, used to defined `at` and `ac` codes respectively. In ADL 2, these are merged into one `term_definitions` section, containing the definitions for `id`, `at` and `ac` codes. Similarly there were bindings sections, `term_bindings ` and `constraint_bindings`. These have been merged into one `term_bindings` section.

#### Term_definitions Structure

The following shows the structure of the terminology section used in ADL 1.4 archetypes. The extra `items` attribute notes are removed by ADL 2 tools, and should be considered deprecated.

```odin
    term_definitions = <
        ["en"] = <
            items = <
                ["at0001"] = <...>
                ["at0002"] = <...>
            >
        >
    >
```

## Annotations Section

The `annotations` section of an archetype or template provides a place for ad hoc node-level meta-data to be added. This can be used during the design phase to track dependencies, design decisions, and specific resource references.

Annotations are divided into major named groups. Currently a `documentation` group is defined, intended for documentary (i.e. human-readable text) annotations. Other groups are likely to be defined in the future for various kinds of processing, where the annotations may be formal expressions or code fragments.

Each annotation is keyed by a path, and may have any number of tagged elements. The path key can either be:

* the path of the archetype node being annotated, or
* a pure RM path

The usual case is the first, since annotations mainly relate to nodes in an archetype. However, it may be the case that within the context of the archetype, there is a need to refer to a part of the Reference Model type on which the archetype is based (`OBSERVATION`, `EVALUATION` etc) that _is not_ constrained within the archetype, in order to indicate how it is to be understood within that archetyped structure (remember that an archetype does not need to constrain all possible paths of an information model class, but that such structures may nevertheless be instantiated).

A typical `annotations` section looks as follows (https://github.com/openEHR/adl-archetypes/blob/master/ADL2-reference/features/description/annotations/openEHR-EHR-EVALUATION.annotations_1st_child.v1.adls[archetype source^]). The `/subject` path is a non-constrained 'RM path'.

====
at-coded ADL2::
+
```adl
--
-- Extract from test archetype openEHR-EHR-EVALUATION.annotations_1st_child.v1.0.0
--
definition
    EVALUATION[at0000.1] matches {    -- Exclusion statement - Adverse Reaction
        /data[at0001]/items matches {
            ...
            ELEMENT[at0.8] occurrences matches {0..1} matches {    -- No known allergic reaction to
                value matches {
                    DV_TEXT[at9000.6]
                }
            }
            ...
            ELEMENT[at0.10] occurrences matches {0..1} matches {    -- No known intolerance to
                value matches {
                    DV_TEXT[at9000.8]     -- No known allergic reaction to
                }
            }
        }
    }

terminology
    ...

annotations
    documentation = <
        ["en"] = <
            ["/subject"] = <
                ["design note"] = <"xxxxxx">
            >
            ["/data[at0001]/items[at0.8]"] = <
                ["design note"] = <"this is a design note on allergic reaction">
                ["requirements note"] = <"this is a requirements note on allergic reaction">
                ["medline ref"] = <"this is a medline ref on allergic reaction">
            >
            ["/data[at0001]/items[at0.10]"] = <
                ["design note"] = <"this is a design note on intolerance">
                ["requirements note"] = <"this is a requirements note on intolerance">
                ["national data dictionary"] = <"NDD ref for intolerance">
            >
        >
    >
```

id-coded ADL2::
+
```adl
--
-- Extract from test archetype openEHR-EHR-EVALUATION.annotations_1st_child.v1.0.0
--
definition
    EVALUATION[id1.1] matches {    -- Exclusion statement - Adverse Reaction
        /data[id2]/items matches {
            ...
            ELEMENT[id0.8] occurrences matches {0..1} matches {    -- No known allergic reaction to
                value matches {
                    DV_TEXT[id0.6]
                }
            }
            ...
            ELEMENT[id0.10] occurrences matches {0..1} matches {    -- No known intolerance to
                value matches {
                    DV_TEXT[id0.8]     -- No known allergic reaction to
                }
            }
        }
    }

terminology
    ...

annotations
    documentation = <
        ["en"] = <
            ["/subject"] = <
                ["design note"] = <"xxxxxx">
            >
            ["/data[id2]/items[id0.8]"] = <
                ["design note"] = <"this is a design note on allergic reaction">
                ["requirements note"] = <"this is a requirements note on allergic reaction">
                ["medline ref"] = <"this is a medline ref on allergic reaction">
            >
            ["/data[id2]/items[id0.10]"] = <
                ["design note"] = <"this is a design note on intelerance">
                ["requirements note"] = <"this is a requirements note on intolerance">
                ["national data dictionary"] = <"NDD ref for intolerance">
            >
        >
    >
```
====

Because annotations are defined as a separate section, they can be easily removed in production versions of an archetype or template, and ignored in the generation of digital signatures.


# Terminology Integration

Previous sections have provided the syntax possibilities for expressing terminological constraints, definitions, value sets and bindings in an archetype. This section describes the semantics of constraints on terminological entities, and how these constraints are resolved to concrete sets of terms.

## Requirements

The semantic needs of archetypes with respect to terminology are as follows:

* to identify, i.e. 'name', nodes;
* to define possible values for nodes whose value is coded;
* to define the relationship of coded elements in an archetype to external terminologies.

Achieving these in a mechanical sense is easy enough, however there are various sources of complexity that complicate things. The first most basic point is the one which motivated the separation of internal and external codes in the original design of ADL: no terminology can be relied on to provide all or even most coded entities within a given archetype. The main reason is not so much that terminologies are limited (major terminologies such as {snomed_ct}[SNOMED CT^], {loinc}[LOINC^], {who_icd}[ICD11^] are quite extensive) but that archetypes are used to create pragmatic, often variable, pattern structures for information; and that such patterns can easily be too variable and/or detailed to have anything but patchy coverage by published terminologies and ontologies (e.g. the OBO ontologies such as {ogms}[OGMS^]).

Although some terminology aficionados like to think that one day every element of an information model can be identified using codes from an external terminology, the reality is that it is unlikely. Information structures are fractal, because the things they report on (entities and processes) are fractal - someone always wants to record more details that are not defined in any terminology. A deeper reason is that the relationship between information elements and terminology and ontology entities is (or should be) primarily based on the 'is-about' relation, and this is clearly an irreflexive N:1 relationship, not an equivalence.

Another aspect of the messy reality of terminologies is the patchy availability and correctness (particularly for specific use contexts) of value sets that can be used as data values for codable data points. The major terminologies in healthcare do provide good quality hierarchies (and thus, in theory, value sets) for many core concepts such as disease, finding, procedure, lab result, medication and so on. These hierarchies (and usually any derived value set) may contain very large numbers of terms (consider the number of drug types, types of infectious disease etc), and terminologies such as {who_icd}[ICD10AM^] or {snomed_ct}[SNOMED CT^], {loinc}[LOINC^], {who_icpc}[ICPC^] and others are the only realistic way to express such large value sets. Unfortunately, there is a very large number of 'small', pragmatic value sets needed in healthcare as well, for things like:

* patient position when measuring blood pressure;
* types of BP measuring cuff;
* possible value sets for data points in 'scores' such as Apgar, Barthel, Waterlow etc;
* numerous small value sets to do with physical examinations, hearing and eye tests;
* numerous small value sets classifying results statuses, reporting status and so on;
* most multiple-value fields on forms other than key items such as 'presenting condition'.

This category corresponds to value sets that are a) small enough to be easily created in an archetype; b) typically not available in external terminologies; c) typically very specific to the archetype topic or use. These value sets are more numerous by orders of magnitude than the 'large' kind, and are only sparsely represented in published terminologies.

The next source of complexity is that terminologies may contain errors, some which are only known by some users, or even if recognised by the authors, cannot be easily addressed without major structural changes, and therefore won't be corrected quickly. This implies that solution systems have to be able to employ workarounds.

A final complication is to do with commercial licensing of terminology. Archetypes cannot (at least currently) be developed on the assumption that all, or even most, users of an archetype have legal and technical access to a given terminology. This means that the archetype formalism and tools need to enable archetypes to work in either situation.

In sum, external terminologies address certain types of information very well, and many other elements only weakly or variably. The problem is that a good deal of the domain information modelled by archetypes is outside the areas of strength of external terminologies.

Taken together, these issues necessitate a design strategy that doesn't rely in the first instance on external terminologies to provide either identifiers (names of things), values (taken individually) or explicit value sets. Instead, archetypes rely on internal coding of all identifiable elements (nodes with at-codes/id-codes), as well as the availability of a mechanism for defining at least the 'small' value sets - the ac- and at-codes.

Connection with external terminology is managed using in the `term_binding` section described earlier, and also via transformation from archetypes and template to the deployable operational template. The sections below describe various use cases for terminology constraint, binding and deployment.

## Term Constraint Basics

Expressing terminology constraints in cADL was briefly described in <<cADL_Terminology_Constraints>>. Constraints in the `definition` section of an archetype are only a small part of the picture. The targets of the at- and ac- codes are defined in the archetype `terminology` section, potentially with bindings to external terminology. In order to illustrate the approach clearly, the cADL example from earlier is repeated here, minus the node containing the assumed value, and this time with an extract from the terminology section.

====
at-coded ADL2::
+
```adl
--
-- extract of openehr-ehr-EVALUATION.term_constraint_variations.v0.0.1
--
definition
    ...
        items matches {
            ELEMENT[at0010] occurrences matches {0..1} matches {
                name matches {
                    DV_CODED_TEXT[at9000] matches {
                        defining_code matches {[at0004]}        -- set name to 'Substance'
                    }
                }
                value matches {
                    DV_CODED_TEXT[at9001] matches {
                        defining_code matches {[ac1]}        -- Type of Substance/Agent
                    }
                }
            }
            ...
        }
    ...

terminology
    term_definitions = <
        ["en"] = <
            ["at0010"] = <
                text = <"Specific Substance/Agent">
                description = <"Specific identification of the actual Substance/Agent considered to be responsible for the Adverse Reaction event.">
            >
            ["at0004"] = <
                text = <"Substance">
                description = <"Physical substance.">
            >
            ["ac1"] = <
                text = <"Type of substance">
                description = <"Type of substance that was the cause of the Adverse Reaction">
            >
            ["at0009"] = <
                text = <"Pollen">
                description = <"Pollen">
            >
            ["at0010"] = <
                text = <"Insect allergen">
                description = <"Insect allergen">
            >
            ["at0011"] = <
                text = <"Animal protein">
                description = <"Animal protein.">
            >
            ["at0012"] = <
                text = <"Plant material">
                description = <"Plant material.">
            >
            ["at0013"] = <
                text = <"Dust">
                description = <"Dust.">
            >
        >
    >
```

id-coded ADL2::
+
```adl
--
-- extract of openehr-ehr-EVALUATION.term_constraint_variations.v0.0.1
--
definition
    ...
        items matches {
            ELEMENT[id11] occurrences matches {0..1} matches {
                name matches {
                    DV_CODED_TEXT[id8] matches {
                        defining_code matches {[at5]}        -- set name to 'Substance'
                    }
                }
                value matches {
                    DV_CODED_TEXT[id55] matches {
                        defining_code matches {[ac1]}        -- Type of Substance/Agent
                    }
                }
            }
            ...
        }
    ...

terminology
    term_definitions = <
        ["en"] = <
            ["id11"] = <
                text = <"Specific Substance/Agent">
                description = <"Specific identification of the actual Substance/Agent considered to be responsible for the Adverse Reaction event.">
            >
            ["at5"] = <
                text = <"Substance">
                description = <"Physical substance.">
            >
            ["ac1"] = <
                text = <"Type of substance">
                description = <"Type of substance that was the cause of the Adverse Reaction">
            >
            ["at10"] = <
                text = <"Pollen">
                description = <"Pollen">
            >
            ["at11"] = <
                text = <"Insect allergen">
                description = <"Insect allergen">
            >
            ["at12"] = <
                text = <"Animal protein">
                description = <"Animal protein.">
            >
            ["at13"] = <
                text = <"Plant material">
                description = <"Plant material.">
            >
            ["at14"] = <
                text = <"Dust">
                description = <"Dust.">
            >
        >
    >
```
====

The at- and ac- codes (and id-codes for id-coded archetypes) in the above are defined in the archetype terminology in the normal way (noting that codes `at9000` and `at9001` (`id8` and `id55`) do not need local terminology definitions, following the rules described earlier<<_node_identifiers_2>>), with various possibilities for defining and binding the value set denoted by the code `ac1`. Below is shown the first alternative: local value-set definition.

====
at-coded ADL2::
+
```adl
terminology
    term_definitions = <
        ...
    >

    --
    -- alternative #1: purely local definition
    --
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at0009", "at0010", "at0011", "at0012", "at0013">
        >
    >
```

id-coded ADL2::
+
```adl
terminology
    term_definitions = <
        ...
    >

    --
    -- alternative #1: purely local definition
    --
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at10", "at11", "at12", "at13", "at14">
        >
    >
```
====

The `value_sets` sub-section shows the definition of the `ac1` value set as containing the five codes `at0009` - `at0013` (`at10` - `at14`) (note: this does not attempt to be clinically complete). A local value set definition is part of the archetype, and has no reliance on external terminology. For many value sets, definition in the archetype is the only option available either due to their arbitrary contents, specificity (to the archetype) or the simple practical fact that no-one has done the work to create them elsewhere.

The next variation is that bindings are found for the at-codes from a terminology such as SNOMED CT. This would enable the code chosen at runtime in the system using the archetype to be mapped to a SNOMED CT code.

CAUTION: it is quite common that only _some_ of the local at-codes have equivalents in the external terminology, especially if the archetype has a more fine-grained coding of the concept in question. In general, the availability of any external codes for a given internal code doesn't imply that the value set has full coverage by the terminology.

====
at-coded ADL2::
+
```adl
terminology
    term_definitions = <
         ...
    >

    --
    -- alternative #2: add individual bindings to member terms
    --
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at0009", "at0010", "at0011", "at0012", "at0013">
        >
    >
    term_bindings = <
        ["snomed_ct"] = <
            ["at0009"] = <http://snomed.info/id/406464007> -- Pollen allergen (substance)
            ["at0010"] = <http://snomed.info/id/406470001> -- Insect allergen (substance)
            ["at0011"] = <http://snomed.info/id/406472009> -- Animal protein and epidermal allergen (substance)
            ["at0012"] = <http://snomed.info/id/410981007> -- Plant extract and epidermal allergen (substance)
            ["at0013"] = <http://snomed.info/id/410980008> -- Dust allergen (substance)
        >
    >
```

id-coded ADL2::
+
```adl
terminology
    term_definitions = <
         ...
    >

    --
    -- alternative #2: add individual bindings to member terms
    --
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at10", "at11", "at12", "at13", "at14">
        >
    >
    term_bindings = <
        ["snomed_ct"] = <
            ["at10"] = <http://snomed.info/id/406464007> -- Pollen allergen (substance)
            ["at11"] = <http://snomed.info/id/406470001> -- Insect allergen (substance)
            ["at12"] = <http://snomed.info/id/406472009> -- Animal protein and epidermal allergen (substance)
            ["at13"] = <http://snomed.info/id/410981007> -- Plant extract and epidermal allergen (substance)
            ["at14"] = <http://snomed.info/id/410980008> -- Dust allergen (substance)
        >
    >
```
====

Note that the bindings are only usable if SNOMED CT is available in the execution environment. A very general clinical archetype such as for allergic reaction is likely to be deployed in all kinds of environments, including those with no SNOMED CT, so a local definition has utility in at least some locations.

Clearly, some value sets, including the one above for allergen substances, are likely to be more widely applicable than a single archetype, and may require proper analysis and maintenance to be correct (for one thing, we are likely to discover new types of allergen). Additionally, the total value sets for things like allergens, disease types and so on are likely to be _structured hierarchies_, such as may be found in the SNOMED CT terminology, not simple flat lists.

This provides the basis for the next variant. Assuming that an external value set is explicitly created, in this case within SNOMED CT or one of its extensions, the archetype may now include a binding to the value set. Remembering that some archetype users may have no access to the terminology, the local definition may be left intact. The external value set may of course be richer than the internal one, typically containing a deeper hierarchy, but as long as the local definition contains the top-level terms, this approach can be made reasonably reliable if maintained properly (it can be made clinically safe by enabling a plain text option in case the local codes are insufficient in some circumstances).

It will be up to applications or infrastructure in the execution environment to determine if the required external terminology is available and should be used; if so, the local value set definition and at-code bindings can be ignored.

====
at-coded ADL2::
+
```adl
terminology
    term_definitions = <
         ...
    >

    --
    -- alternative #3: add a binding for the value set itself
    --
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members =  <"at0009", "at0010", "at0011", "at0012", "at0013">
        >
    >
    term_bindings = <
        ["snomed_ct"] = <
            ["ac1"] = <http://snomed.info/id/900000000000123456> -- value set binding
            ["at0009"] = <http://snomed.info/id/406464007> -- Pollen allergen (substance)
            ["at0010"] = <http://snomed.info/id/406470001> -- Insect allergen (substance)
            ["at0011"] = <http://snomed.info/id/406472009> -- Animal protein and epidermal allergen (substance)
            ["at0012"] = <http://snomed.info/id/410981007> -- Plant extract and epidermal allergen (substance)
            ["at0013"] = <http://snomed.info/id/410980008> -- Dust allergen (substance)
        >
    >
```

id-coded ADL2::
+
```adl
terminology
    term_definitions = <
         ...
    >

    --
    -- alternative #3: add a binding for the value set itself
    --
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at10", "at11", "at12", "at13", "at14">
        >
    >
    term_bindings = <
        ["snomed_ct"] = <
            ["ac1"] = <http://snomed.info/id/900000000000123456> -- value set binding
            ["at10"] = <http://snomed.info/id/406464007> -- Pollen allergen (substance)
            ["at11"] = <http://snomed.info/id/406470001> -- Insect allergen (substance)
            ["at12"] = <http://snomed.info/id/406472009> -- Animal protein and epidermal allergen (substance)
            ["at13"] = <http://snomed.info/id/410981007> -- Plant extract and epidermal allergen (substance)
            ["at14"] = <http://snomed.info/id/410980008> -- Dust allergen (substance)
        >
    >
```
====


In the above, the value set binding target is a URI to a value set definition in the target terminology, in this case SNOMED CT. No assumption is made within the archetype about how this is done - it could be a static list, or a so-called 'intensional reference set', meaning a value set whose contents are described by a query that when executed against the terminology, will generate the correct value set.

As an example of an intensional ref-set, consider the value set logically defined as "any bacterial infection of the lung". The possible values would be codes from a target terminology, corresponding to numerous strains of pneumococcus, staphylococcus and so on, but not including species that are never found in the lung. The value set may be defined as a ref-set query such as `is-a bacteria and has-site lung`. All of the syntax and machinery to achieve this is assumed to be outside the archetype. The attraction of binding to an intensional ref-set is that its contents can change over time (e.g. as 'type of hepatitis' has changed over the last 15 years), with no dependence on the archetype. Another is that intensional ref-sets can be used to tailor the value set to a desired level of detail and to remove known errors.

The final variation is to assume that the local value set definition is removed, either because it is unreliable or difficult to maintain, or because universal access to the terminology is now available. In this case, the bindings to the individual at-codes are no longer needed. A new archetype designed on this basis would not even need the at-code definitions (a new revision of a legacy archetype would, however). The result would look as follows.

```adl
terminology
    term_definitions = <
         ...
    >

    --
    -- alternative #4: external value set only
    --
    term_bindings = <
        ["snomed_ct"] = <
            ["ac1"] = <http://snomedct.info/id/900000000000123456> -- value set binding
        >
    >
```

## From Constraints to Concrete Codes in Data

A key question not answered by the above is: what codes ultimately find their way into data created via archetypes used in conjunction with terminology? With the exception of alternative #4 above, there are two ways of recording values of coded terms in data. One is to use the at-codes chosen by the user (or software component) at execution time, and the other is to store the target of the term binding, i.e. a SNOMED CT, LOINC or other external code. Which strategy to use depends on a number of factors, mostly not determinable at archetype development time.

There are two dimensions that are relevant to determining a storage approach. One is to distinguish data representation within the internal environment from data formats used for sharing. Within the internal environment, if archetypes are actively used by the system, then local at-codes can be stored, since they can always be converted via the archetypes to whichever bindings are available. The second is the distinction between 'large' and 'small' value sets mentioned earlier. Large value-sets are those which are always modelled by terminology, and even if not available today, terminology will be the only practical approach of implementing them.

In this case, the value stored in the data will always be an external terminology code, or else if not available, plain text.

The picture for 'small' value sets is less clear. The openEHR.org archetypes for example contain hundreds (possibly thousands) of small value sets within only a few hundred archetypes, all designed by clinical specialists. These value sets could technically have been represented within external terminologies (some undoubtedly will be in the future). There is however a danger in doing this. Value sets within an archetype apply only to that archetype and there is no implication of use outside it. There is no equivalent encapsulation when the same value set is created within say SNOMED CT - specificity usually has to be achieved with either pre- or post-coordination. Nevertheless, creating a 'small' value set inside terminology is perfectly doable and in some cases will be desirable. This means that there are two choices for storing coded values in data: internal at-codes or bound external codes.

Various arguments point to the utility of using the former:

* there may be no bindings at all available today, so at-codes must be stored;
* there may be bindings that only partially cover the at-codes in the model;
* there may be more than one binding, used for different purposes e.g. hospital versus and general practice;
* bindings in place today may be found to be incorrect in the future, and may be changed.

It would appear that the most reliable thing to do is to store the archetype local codes for values for use within the main computing environment.

When it comes to sharing data with external data partners, there may be a requirement to use external terminology codes for some data fields, where they are available. An example is laboratory analytes, which may be coded using archetype internal codes, but for which the extensive LOINC terminology, and many extant country-level lab code systems could also be used. One strategy is to use at-codes in the internal environment and to always generate messages on the fly containing the codes required for sharing.

The upshot of these considerations is that the choice of which kind of term to use (internal or external) in a given deployment or situation is deferrable to a later stage than archetype authoring. The approach ADL takes is that 'source form' archetypes and templates always use internal coding and optionally binding, and that if external codes are to be directly substituted for the internal codes for some deployment situation for certain fields in an archetype or template, this is specified as an option at the point of operational template generation.

As described in <<cADL_Terminology_Constraints>>, constraints of the form `[acN]` and `[atN]` are replaced by `[acN@ttttt]` and `[atN@ttttt]`. A generated operational template that includes the above archetype, with the choice to use the `snomed_ct` binding's external terms made on some nodes, could include the following content.

====
at-coded ADL2::
+
```cadl
    --
    -- extract of operational template based on openehr-ehr-EVALUATION.term_constraint_variations.v0.0.1
    --
    ELEMENT[at0010] occurrences matches {0..1} matches {
        name matches {
            DV_CODED_TEXT[at9000] matches {
                defining_code matches {[at0004@snomed_ct]}        -- set name to 'Substance'
            }
        }
        value matches {
            DV_CODED_TEXT[at9001] matches {
                defining_code matches {[ac1@snomed_ct]}        -- Type of Substance/Agent
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    --
    -- extract of operational template based on openehr-ehr-EVALUATION.term_constraint_variations.v0.0.1
    --
    ELEMENT[id11] occurrences matches {0..1} matches {
        name matches {
            DV_CODED_TEXT[id8] matches {
                defining_code matches {[at5@snomed_ct]}        -- set name to 'Substance'
            }
        }
        value matches {
            DV_CODED_TEXT[id55] matches {
                defining_code matches {[ac1@snomed_ct]}        -- Type of Substance/Agent
            }
        }
    }
```
====



# Specialisation

## Overview

Archetypes can be specialised in a similar way to classes in object-oriented programming languages. Common to both situations is the use of a differential style of declaration, i.e. the contents of a specialised artefact are expressed as differences with respect to the parent artefact - previously defined elements from the parent that are not changed are not repeated in the descendant. Two extra constructs are included in the ADL syntax to support redefinition in specialised archetypes or templates.

The basic test that must be satisfied by a specialised archetype is as follows:

* All possible data instance arrangements that conform to the specialised archetype must also conform to all of its parents, recursively to the ultimate parent.

This condition ensures that data created by a specialised archetype that is not itself shared by two systems can be processed by the use of a more general parent that is shared.

The semantics that allow this are similar to the {wikipedia_cov_contra}[covariant redefinition^] notion used in some object-oriented programming languages, and can be summarised as follows.

* A non-specialised (i.e. top-level) archetype defines an instance space that is a subset of the space defined by the class in the reference information model on which the archetype is based.
* A specialised archetype can specialise only one parent archetype, i.e. single inheritance.
* A specialised archetype specifies an instance space defined by the following elements:
** unchanged object and attribute constraints inherited from the parent archetype;
** and one or more redefinitions, additions and removals.
* All elements defined in a parent archetype are either inherited unchanged or redefined in a specialised child.
* Specialised archetypes are expressed differentially with respect to the parent, i.e. they do not mention purely inherited elements, only redefinitions and extensions.
* Extensions always define an additional subset of the instance space defined by the reference model element being extended (i.e. to which the 'new' objects belong). The extension capability allows archetypes to remain extensible without having to know in advance how or if they will be extended.

To understand specialisation properly, the object-oriented notion of flattening is required. This term refers to the operation of overlaying the (differential) definition of a specialised archetype on its 'flat parent', which is a flattened archetype obtained by a previous invocation of this process. The first invocation creates a flat archetype from overlaying a specialised archetype on a 'top-level' non-specialised archetype.

The contents of the definition of any specialised archetype are therefore understood as differences with respect to the _flat parent_, not the differential parent. This is exactly how object-oriented programming languages work.

The following sections describe the details of specialisation. The term 'object' is used synonymously with 'object constraint' since all elements in ADL are constraints unless otherwise indicated.

## Specialisation Concepts

### Differential and Flat Forms

Specialised archetypes in their authored form are represented in 'differential' form. The syntax is the same as for non-specialised archetypes, with two additions: specialisation paths (see <<Specialisation Paths>>) and ordering indicators (see <<Ordering of Sibling Nodes>>). For a specialised archetype therefore, the lineage of archetypes back to the ultimate parent must be taken into account in order to obtain its complete semantics.

Differential form means that the only attributes or objects mentioned are those that redefine corresponding elements in the parent and those that introduce new elements. The differential approach to representation of specialised archetypes give rise to the need for a _flat form_ of a specialised archetype: the equivalent archetype defined by the sum of the (differential) child and its parent, as if the child archetype had been defined standalone. The flat form of archetypes is used for building templates, and subsequently at runtime. It is generated by 'compressing' the effects of inheritance of the parent to the specialised child into a single archetype, and applies recursively all the way up an archetype lineage to the ultimate parent, which must be a top-level (non-specialised) archetype. For a top-level archetype, the flat-form is the same as its differential form (i.e. in a top-level archetype, every node is considered to be an extension node).

### Specialisation Levels

In order to talk about archetypes at different levels of specialisation, a standard way of identifying the levels of specialisation is used, as follows:

* level 0: top-level, non-specialised archetypes
* level 1: specialisations of level 0 archetypes
* level 2: specialisations of level 1 archetypes
* etc.

For nodes carrying a node identifier, the specialisation level is always equal to the number of '.' characters found in the identifier.

### Specialisation Paths

Because ADL is a block-structured language, the redefinition of nodes deep in the parent structure normally requires descending into the structure. Since it is common to want to further constrain only nodes deep within a structure in specialised archetype, a more convenient way is provided in ADL to do this using a _specialisation path_, illustrated by the following example:

====
at-coded ADL2::
+
```cadl
    OBSERVATION[at0000.1] ∈ {                                   -- Thyroid function tests
        /data[at0001]/events[at0002]/data[at0003]/items ∈ {
                ELEMENT[at0078.2] occurrences ∈ {0..1} ∈ {    -- TSH
                    value ∈ {
                        DV_QUANTITY[at9000.7] ∈ { ... }
                    }
                }
                ELEMENT[at0078.7] occurrences ∈ {0..1} ∈ {...} -- Free T3
                ...
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    OBSERVATION[id1.1] ∈ {                                   -- Thyroid function tests
        /data[id2]/events[id3]/data[id4]/items ∈ {
                ELEMENT[id79.2] occurrences ∈ {0..1} ∈ {    -- TSH
                    value ∈ {
                        DV_QUANTITY[id0.7] ∈ { ... }
                    }
                }
                ELEMENT[id79.7] occurrences ∈ {0..1} ∈ {...} -- Free T3
                ...
            }
        }
    }
```
====

In this fragment, a path is used rather than an attribute name. A path can be used in this manner only if no further constraints are required 'on the way' into the deep structure, with the exception of at-code (id-code) overrides (since these can be syntactically accommodated within the path).

The rules for specialisation paths are as follows.

* A specialisation path is constructed down to the first attribute having any child objects to be further constrained in the present archetype.
* All path segments must carry an at-code (id-code) predicate.
* The shortest useful path that can be used is `/` followed by an attribute name from the top level class being constrained by the archetype.

### Path Congruence

Any node in an archetype can unambiguously be located by its archetype path. For example, the text value of the 'problem' node of the `openEHR-EHR-EVALUATION.problem.v1` archetype shown at the top of the example in <<Redefinition for Specialisation>> is:

====
at-coded ADL2::
+
```cadl
    /data[at0001]/items[at0002]/value
```

id-coded ADL2::
+
```cadl
    /data[id2]/items[id3]/value
```
====

Similarly the path to the redefined version of the same node in the `openEHR-EHR-EVALUATION.problem-diagnosis.v1` archetype at the bottom of the same figure is:

====
at-coded ADL2::
+
```cadl
    /data[at0001]/items[at0002.1]/value
```

id-coded ADL2::
+
```cadl
    /data[id2]/items[id3.1]/value
```
====

By inspection, it can be seen that this path is a variant of the corresponding path in the parent archetype, where a particular object node identifier has been specialised.

In general, the path of every redefined node in a specialised archetype will have a direct equivalent in the parent archetype, which can be determined by removing one level of specialisation from any node identifiers within the specialised path that are at the level of specialisation of the specialised archetype (i.e. node identifiers corresponding to higher specialisation levels are not changed). In this way, the nodes in a specialised archetype source can be connected to their counterparts in parent archetypes, for purposes of validation and flattening.

Conversely, any given path in an archetype that has children will have congruent paths in the children wherever nodes have been specialised.

### Redefinition Concepts

A specialised archetype definition at any level consists of a set of changes with respect to its flat parent. The technically available changes are categorised as follows.

|===
|Logical Intention|Physical Redefinition|Criteria

3+^|*Attribute node constraints*

|MANDATE an existing node.
|Differential attribute node refines existence to 1.
|Differential node has same attribute name as a node at the same path location in the flat parent.

|EXCLUDE an existing node.
|Differential attribute node refines existence to 0.
|Differential node has same attribute name as a node at the same path location in the flat parent.

|REFINE an existing node.
|Differential attribute node refines cardinality of attribute at corresponding location in flat parent.
|Differential node has same attribute name as a node at the same path location in the flat parent.

|ADD a new node.
|Differential attribute node will be added to parent object node at corresponding location in flat parent.
|Differential node does not exist in the flat parent, only in the Reference Model.

3+^|*Object node constraints*

|REFINE an existing node.
|Differential object node and sub-elements will OVERRIDE corresponding node, and some / all of its sub-elements from the flat parent
|Differential node has a specialised node identifier, and corresponding node in flat parent has max occurrences = 1 or else differential node is sole replacement and has max occurrences = 1.

|SPECIALISE an existing node.
|Differential object node(s) and sub-elements will OVERRIDE a CLONE of the corresponding node, and some / all of its sub-elements from the flat parent
|Differential node has a specialised node identifier, and corresponding node in flat parent has max occurrences > 1.

|ADD a new node.
|Differential object node(s) and sub-elements will be ADDed to container or single-valued attribute. In the case of a container, ordering can be controlled with the before/after constraint.
|Differential node has a specialised node identifier, and corresponding node in flat parent has max occurrences > 1.

|EXCLUDE an existing node.
|Differential object node DELETEs existing node which has min occurrences = 0 (i.e. can't delete a mandatory node).
|Differential node has same node identifier as corresponding node in parent, and occurrences = 0..0.

|FILL a slot.
|External reference node will be added as slot filler next to corresponding slot from flat parent.
|Differential node is an external reference node, has specialised node identifier of a slot in the flat parent.

|CLOSE a slot.
|Archetype slot node causes corresponding slot from flat parent to be closed to further filling.
|Differential node is an archetype slot node, with same node identifier as a slot in the flat parent, and has the 'closed' flag set.

|===

In the ADL syntax, objects can be specified in two places: under single-value attributes and under multiply-valued (container) attributes.

Within an archetype, multiple object constraint nodes may appear under a single-valued attribute. Each such node defines an _alternative_ that may be used to constrain data at that attribute position. An example is the `OBSERVATION._protocol_` attribute from the openEHR reference model: if multiple objects appear under this attribute, only one can be used at runtime to constrain data. When a single object node is refined by one or more alternatives in a child archetype, any redefined occurrences of the child must conform in the expected way to that of the parent node, i.e. be a narrowed interval.

Within a container attribute, the meaning of multiple objects is that each child object defines constraints on one or more members of the container in the data. The `occurrences` constraint on each one determines how many objects in the data match a given object constraint under the attribute. Valid occurrences intervals for each specialised child in this case are determined _collectively_, that is to say, by considering the occurrences of all the specialised children of a given parent node. As a consequence, for any child node in such a set that specialises the occurrences of the parent node, the occurrences of each such node need only _intersect_ the occurrences interval of the parent node. This is because it may be assumed (indeed, necessary) for the data to contain instances matching _more than one_ of the set. To correctly determine the effective occurrences of any node in a specialised group, the cardinality of the owning attribute must also be taken into account. For this reason, a particular concrete consequence of collective occurrences is that any given child node occurrences may have an unbounded upper limit (i.e. `*`) even if the upper bound of the cardinality of the owning attribute is finite.

The rules for redefinition of occurrences on object nodes is formally defined in the {openehr_am_aom2}#VSONCO[VSONCO validity rule^] in the AOM2 specification.

Object constraints can be specialised under both types of attributes by redefinition, refinement and exclusion. Addition can also be used under either kind of attribute: in both cases, it corresponds to an alternative. The actual semantics are described in terms of object node identification, type redefinition, and structural constraints (existence, cardinality and occurrences), and are the same for objects under single- and multiply-valued attributes. The following sections describe the details.


## Examples

The examples below provide a basis for understanding most of the semantics discussed in the subsequent sections.

### Redefinition for Refinement

The example shown below is from an older version of the openEHR 'Problem' archetype and illustrates the use of redefinition and extension. The first text is the definition section of the top-level 'Problem' archetype, and shows one `ELEMENT` node in expanded form, with the remaining nodes in an elided form.

====
at-coded ADL2::
+
```cadl
    -- openEHR-EHR-EVALUATION.problem.v1 --

    EVALUATION[at0000] ∈ {                                              -- Problem
        data ∈ {
            ITEM_TREE[at0001] ∈ {
                items cardinality ∈ {0..*; ordered} ∈ {
                    ELEMENT[at0002] occurrences ∈ {1} ∈ {
                        value ∈ {
                            DV_TEXT[at9000]                             -- *** NODE A
                        }
                    }
                    ELEMENT[at0004] occurrences ∈ {0..1} ∈ {...}       -- Date of initial onset
                    ELEMENT[at0005] occurrences ∈ {0..1} ∈ {...}       -- Age at initial onset
                    ELEMENT[at0006] occurrences ∈ {0..1} ∈ {...}       -- Severity
                    ELEMENT[at0007] occurrences ∈ {0..1} ∈ {...}       -- Clinical description
                    ELEMENT[at0009] occurrences ∈ {0..1} ∈ {...}      -- Date clinically received
                    CLUSTER[at0010] occurrences ∈ {0..1} ∈ {...}      -- Location
                    CLUSTER[at0013] occurrences ∈ {0..1} ∈ {...}      -- Aetiology
                    -- etc
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    -- openEHR-EHR-EVALUATION.problem.v1 --

    EVALUATION[id1] ∈ {                                              -- Problem
        data ∈ {
            ITEM_TREE[id2] ∈ {
                items cardinality ∈ {0..*; ordered} ∈ {
                    ELEMENT[id3] occurrences ∈ {1} ∈ {
                        value ∈ {
                            DV_TEXT[id4]                             -- *** NODE A
                        }
                    }
                    ELEMENT[id5] occurrences ∈ {0..1} ∈ {...}       -- Date of initial onset
                    ELEMENT[id6] occurrences ∈ {0..1} ∈ {...}       -- Age at initial onset
                    ELEMENT[id7] occurrences ∈ {0..1} ∈ {...}       -- Severity
                    ELEMENT[id8] occurrences ∈ {0..1} ∈ {...}       -- Clinical description
                    ELEMENT[id10] occurrences ∈ {0..1} ∈ {...}      -- Date clinically received
                    CLUSTER[id11] occurrences ∈ {0..1} ∈ {...}      -- Location
                    CLUSTER[id14] occurrences ∈ {0..1} ∈ {...}      -- Aetiology
                    -- etc
                }
            }
        }
    }
```
====

The second text below is from the 'problem-diagnosis' archetype, i.e. a 'diagnosis' specialisation of the general notion of 'problem'. In this situation, the node `[at0001]` (`[id2]`), with occurrences of 1, i.e. mandatory non-multiple, has its meaning narrowed to `[at0001.1]` (`[id2.1]`) 'diagnosis' (diagnosed problems are seen as a subset of all problems in medicine), while new sibling nodes are added to the items attribute to define details particular to recording a diagnosis. The extension nodes are identified by the codes `[at0.32]` , `[at0.35]` and `[at0.37]` (`[id0.32]` , `[id0.35]` and `[id0.37]`), with the latter two shown in elided form.

====
at-coded ADL2::
+
```cadl
    -- openEHR-EHR-EVALUATION.problem-diagnosis.v1 --   -- specialises openEHR-EHR-EVALUATION.problem.v1

    EVALUATION[at0000.1] ∈ {                               -- Recording of diagnosis
        /data[at0001.1]/items[at0002]/value ∈ {            -- redefine at0001 to at0001.1 (in terminology section)
            DV_CODED_TEXT[at9000] ∈ {                      -- << This node redefines 'NODE A' above
                defining_code ∈ {[ac0.1]}
            }
        }
        /data[at0001.1]/items cardinality ∈ {0..*; ordered} ∈ {
            before [at0004]
            ELEMENT[at0.32] occurrences ∈ {0..1} ∈ {    -- Status    ++ This node added
                value ∈ {
                    DV_CODED_TEXT[at9000.33] ∈ {
                        defining_code ∈ {
                            [local::at0.33, at0.34]      -- provisional
                        }
                    }
                }
            }
            after [at0031]
            CLUSTER[at0.35] occurrences ∈ {0..1} ∈ {...}  -- Diag. criteria  ++ This node added
            CLUSTER[at0.37] occurrences ∈ {0..1} ∈ {...}  -- Clin. staging   ++ This node added
        }
    }
```

id-coded ADL2::
+
```cadl
    -- openEHR-EHR-EVALUATION.problem-diagnosis.v1 --   -- specialises openEHR-EHR-EVALUATION.problem.v1

    EVALUATION[id1.1] ∈ {                               -- Recording of diagnosis
        /data[id2.1]/items[id3]/value ∈ {               -- redefine id2 to id2.1 (in terminology section)
            DV_CODED_TEXT[id4] ∈ {                      -- << This node redefines 'NODE A' above
                defining_code ∈ {[ac0.1]}
            }
        }
        /data[id2.1]/items cardinality ∈ {0..*; ordered} ∈ {
            before [id5]
            ELEMENT[id0.32] occurrences ∈ {0..1} ∈ {    -- Status    ++ This node added
                value ∈ {
                    DV_CODED_TEXT[id0.33] ∈ {
                        defining_code ∈ {
                            [local::at0.33, at0.34]      -- provisional
                        }
                    }
                }
            }
            after [id31]
            CLUSTER[id0.35] occurrences ∈ {0..1} ∈ {...}  -- Diag. criteria  ++ This node added
            CLUSTER[id0.37] occurrences ∈ {0..1} ∈ {...}  -- Clin. staging   ++ This node added
        }
    }
```
====


### Redefinition for Specialisation

The example shown below illustrates redefinition in a specialised archetype. The first text is taken from the definition section of the 'laboratory result' `OBSERVATION` archetype (available at {openehr_CKM}[openEHR CKM^]), and contains an `ELEMENT` node whose identifier is `[at0078]` (`[id79]`) , defined as 'panel item' in the archetype terminology (sibling nodes are not shown here). The intention is that the `[at0078]` (`[id79]`) node be specialised into particular 'panel items' or analytes according to particular types of test result. Accordingly, the `[at0078]` (`[id79]`) node has occurrences of `0..*` and its value is not constrained with respect to the reference model, meaning that the type of the `_value_` attribute can be any descendant of `DATA_VALUE` .

====
at-coded ADL2::
+
```cadl
    ------ openEHR-EHR-OBSERVATION.laboratory.v1 ------
    OBSERVATION[at0000] ∈ {                                                       -- Laboratory Result
        data ∈ {
            HISTORY[at0001] ∈ {
                events ∈ {
                    EVENT[at0002] ∈ {                                             -- Any event
                        data ∈ {
                            ITEM_TREE[at0003] ∈ {
                                items cardinality ∈ {0..*; unordered} ∈ {
                                    CLUSTER[at0004] occurrences ∈ {1} ∈ {...}      -- Specimen
                                    ELEMENT[at0007] occurrences ∈ {0..1} ∈ {...}   -- Diagnostic services
                                    CLUSTER[at0010] occurrences ∈ {0..*} ∈ {...}  -- level 1
                                    ELEMENT[at0078] occurrences ∈ {0..*}          -- panel item
                                    ELEMENT[at0016] occurrences ∈ {0..1} ∈ {...}  -- Overall Comment
                                    CLUSTER[at0017] occurrences ∈ {0..1} ∈ {...}  -- Quality
                                    ELEMENT[at0036] occurrences ∈ {0..1} ∈ {...}  -- Multimedia rep.
                                }
                            }
                        }
                    }
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    ------ openEHR-EHR-OBSERVATION.laboratory.v1 ------
    OBSERVATION[id1] ∈ {                                                       -- Laboratory Result
        data ∈ {
            HISTORY[id2] ∈ {
                events ∈ {
                    EVENT[id3] ∈ {                                             -- Any event
                        data ∈ {
                            ITEM_TREE[id4] ∈ {
                                items cardinality ∈ {0..*; unordered} ∈ {
                                    CLUSTER[id5] occurrences ∈ {1} ∈ {...}      -- Specimen
                                    ELEMENT[id8] occurrences ∈ {0..1} ∈ {...}   -- Diagnostic services
                                    CLUSTER[id11] occurrences ∈ {0..*} ∈ {...}  -- level 1
                                    ELEMENT[id79] occurrences ∈ {0..*}          -- panel item
                                    ELEMENT[id17] occurrences ∈ {0..1} ∈ {...}  -- Overall Comment
                                    CLUSTER[id18] occurrences ∈ {0..1} ∈ {...}  -- Quality
                                    ELEMENT[id37] occurrences ∈ {0..1} ∈ {...}  -- Multimedia rep.
                                }
                            }
                        }
                    }
                }
            }
        }
    }
```
====

The second text, below, is a specialised version of the laboratory result archetype, defining 'thyroid function test result'.

====
at-coded ADL2::
+
```cadl
    ------ openEHR-EHR-OBSERVATION.laboratory-thyroid.v1 ------
    OBSERVATION[at0000.1] -- Thyroid function tests
        /data[at0001]/events[at0002]/data[at0003]/items ∈ {
            ELEMENT[at0078.1] occurrences ∈ {0..1} ∈ {        -- TSH
                value ∈ {
                    DV_QUANTITY[at9001.7] ∈ {
                        property ∈ {[at9000]}
                        magnitude ∈ {|0.0..100.0|}
                        units ∈ {"mIU/l"}
                    }
                }
            }
            ELEMENT[at0078.2] occurrences ∈ {0..1} ∈ {...}    -- Free Triiodothyronine (Free T3)
            ELEMENT[at0078.3] occurrences ∈ {0..1} ∈ {...}    -- Total Triiodothyronine (Total T3)
            ELEMENT[at0078.4] occurrences ∈ {0..1} ∈ {...}    -- Free thyroxine (Free T4)
            ELEMENT[at0078.5] occurrences ∈ {0..1} ∈ {...}    -- Total Thyroxine (Total T4)
            ELEMENT[at0078.6] occurrences ∈ {0..1} ∈ {...}    -- T4 loaded uptake
            ELEMENT[at0078.7] occurrences ∈ {0..1} ∈ {...}    -- Free Triiodothyronine index (Free T3 index)
            ELEMENT[at0078.8] occurrences ∈ {0..1} ∈ {...}    -- Free thyroxine index (FTI)
        }
    }
```

id-coded ADL2::
+
```cadl
    ------ openEHR-EHR-OBSERVATION.laboratory-thyroid.v1 ------
    OBSERVATION[id1.1] -- Thyroid function tests
        /data[id2]/events[id3]/data[id4]/items ∈ {
            ELEMENT[id79.1] occurrences ∈ {0..1} ∈ {        -- TSH
                value ∈ {
                    DV_QUANTITY[id0.7] ∈ {
                        property ∈ {[at15]}
                        magnitude ∈ {|0.0..100.0|}
                        units ∈ {"mIU/l"}
                    }
                }
            }
            ELEMENT[id79.2] occurrences ∈ {0..1} ∈ {...}    -- Free Triiodothyronine (Free T3)
            ELEMENT[id79.3] occurrences ∈ {0..1} ∈ {...}    -- Total Triiodothyronine (Total T3)
            ELEMENT[id79.4] occurrences ∈ {0..1} ∈ {...}    -- Free thyroxine (Free T4)
            ELEMENT[id79.5] occurrences ∈ {0..1} ∈ {...}    -- Total Thyroxine (Total T4)
            ELEMENT[id79.6] occurrences ∈ {0..1} ∈ {...}    -- T4 loaded uptake
            ELEMENT[id79.7] occurrences ∈ {0..1} ∈ {...}    -- Free Triiodothyronine index (Free T3 index)
            ELEMENT[id79.8] occurrences ∈ {0..1} ∈ {...}    -- Free thyroxine index (FTI)
        }
    }
```
====

The redefinitions include:

* a redefinition of the top-level object node identifier `[at0000]` (`[id1]`), with the specialised node identifier `[at0000.1]` (`[id1.1]`);
* eight nodes redefining the `[at0078]` (`[id79]`) node are shown, with overridden node identifiers `[at0078.1]` - `[at0078.8]` (`[id79.1]` - `[id79.8]`);
* reduced occurrences (`0..1` in each case);
* redefinition of the `_value_` attribute of each `ELEMENT` type to `DV_QUANTITY`, shown in expanded form for node `[at0078.1]` (`[id79.1]`).

Note that the original `ELEMENT[at0078]` (`ELEMENT[id79]`) node with `occurrences` of `0..*` remains a valid constraint node: the fact of specialisation does not remove it. If the intention is that the specialised nodes constitute an _exhaustive_ redefinition of the original node, the latter can be effectively removed, as described in <<_exhaustive_and_non_exhaustive_redefinition>>.

This archetype is typical of a class of specialisations that use only redefinition, due to the fact that all objects in the redefined part of the specialised version are semantically specific kinds of a general object, in this case, 'panel item'.

#### Specialisation with Cloning

In the previous example, each of the nodes with identifiers of the form `at0078.N` (`id79.N`) would be effectively copied to the flat output, since the node being redefined `at0078` (`id79`) has no sub-structure, i.e. it is a 'matches any' node. However, the general case is that the node in the parent has its own structure, typically some boilerplate nodes that would be used by any specialisation. In that case, an archetype containing nodes that specialise a node with existing structure cause a 'clone and overlay' operation. That is, to generate the flat output of the specialised archetype, the parent node is first cloned from the flat parent to the new flat output, and then the specialised node is overlaid on the cloned structure. The following example shows a parent archetype that defines a 'laboratory result' structure as a `CLUSTER` containing a number of `ELEMENT` objects, defining things like Result value, Reference range guidance and so on. The `at0001` (`id2`) Result value node is intended to be specialised.

Parent archetype:

====
at-coded ADL2::
+
```cadl
    CLUSTER[at0000] ∈ {                                         -- Laboratory test panel
        items ∈ {
            CLUSTER[at0002] ∈ {                                 -- Laboratory Result
                items ∈ {
                    ELEMENT[at0001] occurrences ∈ {0..1}        -- Result Value
                    ELEMENT[at0003] ∈ {                         -- Result Comment
                        value ∈ {
                            DV_TEXT[at9000]
                        }
                    }
                    ELEMENT[at0004] occurrences ∈ {0..1} ∈ {   -- Ref. Range Guidance
                        value ∈ {
                            DV_TEXT[at9001]
                        }
                    }
                    ELEMENT[at0005] occurrences ∈ {0..1} ∈ {   -- Result Value Status
                        value ∈ {
                            DV_CODED_TEXT[at9002] ∈ {
                                defining_code ∈ {[ac1]}
                            }
                        }
                    }
                    ELEMENT[at0006] occurrences ∈ {0..1} ∈ {   -- D/T Result Val Status
                        value ∈ {
                            DV_DATE_TIME[at9003]
                        }
                    }
                }
            }
            allow_archetype CLUSTER[at0013] ∈ {                -- Other Detail
                include
                    archetype_id/value ∈ {/.*/}
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    CLUSTER[id1] ∈ {                                         -- Laboratory test panel
        items ∈ {
            CLUSTER[id3] ∈ {                                 -- Laboratory Result
                items ∈ {
                    ELEMENT[id2] occurrences ∈ {0..1}        -- Result Value
                    ELEMENT[id4] ∈ {                         -- Result Comment
                        value ∈ {
                            DV_TEXT[id15]
                        }
                    }
                    ELEMENT[id5] occurrences ∈ {0..1} ∈ {   -- Ref. Range Guidance
                        value ∈ {
                            DV_TEXT[id16]
                        }
                    }
                    ELEMENT[id6] occurrences ∈ {0..1} ∈ {   -- Result Value Status
                        value ∈ {
                            DV_CODED_TEXT[id17] ∈ {
                                defining_code ∈ {[ac1]}
                            }
                        }
                    }
                    ELEMENT[id7] occurrences ∈ {0..1} ∈ {   -- D/T Result Val Status
                        value ∈ {
                            DV_DATE_TIME[id18]
                        }
                    }
                }
            }
            allow_archetype CLUSTER[id14] ∈ {                -- Other Detail
                include
                    archetype_id/value ∈ {/.*/}
            }
        }
    }
```
====

Specialised child archetype:

====
at-coded ADL2::
+
```cadl
    CLUSTER[at0000.1] ∈ {    -- Lipid studies panel
        /items ∈ {
            CLUSTER[at0002.1] ∈ {    -- LDL Cholesterol Result
                items ∈ {
                    ELEMENT[at0001.1] ∈ {    -- LDL Cholesterol
                        value ∈ {
                            DV_QUANTITY[at9000.1] ∈ {
                                property ∈ {[at0.1]}
                                magnitude ∈ {|>=0.0|}
                                units ∈ {"mmol/l"}
                            }
                        }
                    }
                }
            }
            CLUSTER[at0002.2] ∈ {    -- HDL Cholesterol Result
                items ∈ {
                    ELEMENT[at0001.2] ∈ {    -- HDL Cholesterol
                        value ∈ {
                            DV_QUANTITY[at9000.2] ∈ {
                                property ∈ {[at0.1]}
                                magnitude ∈ {|>=0.0|}
                                units ∈ {"mmol/l"}
                            }
                        }
                    }
                }
            }
            CLUSTER[at0002.3] ∈ {...}    -- Ratio Result
            CLUSTER[at0002.4] ∈ {...}    -- Triglyceride Result
            CLUSTER[at0002.5] ∈ {        -- Total Result
                items ∈ {
                    ELEMENT[at0001.5] ∈ {    -- Total cholesterol
                        value ∈ {
                            DV_QUANTITY[at9000.5] ∈ {
                                property ∈ {[at0.1]}
                                magnitude ∈ {|>=0.0|}
                                units ∈ {"mosmol/l"}
                            }
                        }
                    }
                }
            }
            CLUSTER[at0005.6]     -- ! - Laboratory Result
        }
    }
```

id-coded ADL2::
+
```cadl
    CLUSTER[id1.1] ∈ {    -- Lipid studies panel
        /items ∈ {
            CLUSTER[id3.1] ∈ {    -- LDL Cholesterol Result
                items ∈ {
                    ELEMENT[id2.1] ∈ {    -- LDL Cholesterol
                        value ∈ {
                            DV_QUANTITY[id0.1] ∈ {
                                property ∈ {[at0.1]}
                                magnitude ∈ {|>=0.0|}
                                units ∈ {"mmol/l"}
                            }
                        }
                    }
                }
            }
            CLUSTER[id3.2] ∈ {    -- HDL Cholesterol Result
                items ∈ {
                    ELEMENT[id2.2] ∈ {    -- HDL Cholesterol
                        value ∈ {
                            DV_QUANTITY[id0.2] ∈ {
                                property ∈ {[at0.1]}
                                magnitude ∈ {|>=0.0|}
                                units ∈ {"mmol/l"}
                            }
                        }
                    }
                }
            }
            CLUSTER[id3.3] ∈ {...}    -- Ratio Result
            CLUSTER[id3.4] ∈ {...}    -- Triglyceride Result
            CLUSTER[id3.5] ∈ {        -- Total Result
                items ∈ {
                    ELEMENT[id2.5] ∈ {    -- Total cholesterol
                        value ∈ {
                            DV_QUANTITY[id0.5] ∈ {
                                property ∈ {[at0.1]}
                                magnitude ∈ {|>=0.0|}
                                units ∈ {"mosmol/l"}
                            }
                        }
                    }
                }
            }
            CLUSTER[id3.6]     -- ! - Laboratory Result
        }
    }
```
====

The flattened result consists of a number of repetitions of the entire `CLUSTER[at0002]` (`CLUSTER[id3]`) structure from the parent, corresponding to the specialisations in the child. The ADL source form is too large to show here, but the {openehr_awb}[ADL Workbench^] provides a visualisation in <<specialisation_with_cloning>>. In this figure we can see that the `CLUSTER` / `ELEMENT` overlays from the child archetype have been overlaid on clones of the `CLUSTER[id3]` structure from the parent, preserving the `at0003` , `at0004` (`id4` , `id5`) etc nodes. Elements shown in light blue are inherited; where they appear under the nodes `[at0002.1]`, `[at0002.2]` (`[id3.1]`, `[id3.2]`) etc, they are cloned from the corresponding nodes under `[at0002]` (`[id3]`).

.Specialisation with Cloning
image::{doc_name}/images/specialisation_with_cloning.png[id=specialisation_with_cloning, align="center", width="75%"]

It can also be seen that the original `[at0002]` (`[id3]`) sub-tree remains. This can be removed if required, as described in <<_exhaustive_and_non_exhaustive_redefinition>>.


## Attribute Redefinition

A small number of things can be redefined on attributes, including existence and cardinality. A basic rule of redefinition is that a specialised archetype cannot change the multiplicity type of an attribute.

### Existence Redefinition: Mandation and Exclusion

All attributes mentioned in an archetype have an _existence_ constraint, indicating whether a value is required or not. The constraint is either stated explicitly - typically done for single-valued attributes - or it is the value from the reference model - typical for multiply-valued attributes. In both cases, the existence of an attribute in a parent archetype can be redefined in a specialised archetype using the standard cADL syntax. In the following example, an implicit existence constraint picked up from the reference model of `{0..1}` is redefined in a child archetype to `{1}` , i.e. mandatory.

Parent archetype:

====
at-coded ADL2::
+
```cadl
    OBSERVATION[at0000] ∈ {                -- blood pressure measurement
        protocol ∈ {                    -- existence not changed from reference model
            -- etc
        }
    }
```

id-coded ADL2::
+
```cadl
    OBSERVATION[id1] ∈ {                -- blood pressure measurement
        protocol ∈ {                    -- existence not changed from reference model
            -- etc
        }
    }
```
====

Child archetype:

====
at-coded ADL2::
+
```cadl
    OBSERVATION[at0000.1] ∈ {              -- paediatric blood pressure measurement
        /protocol existence ∈ {1} ∈ {
            -- etc
        }
    }
```

id-coded ADL2::
+
```cadl
    OBSERVATION[id1.1] ∈ {              -- paediatric blood pressure measurement
        /protocol existence ∈ {1} ∈ {
            -- etc
        }
    }
```
====

Redefinition of existence to `{0}` by this method denotes exclusion, i.e. removal of the entire attribute (including all sub-structure) from the resulting structure. In an archetype, it is likely to indicate poor design, given that the decision to remove optional attributes is much more likely to be local, and therefore more appropriate in templates rather than archetypes; within a template it would be perfectly normal. The following example shows the protocol attribute in the above `OBSERVATION` archetype being excluded in this way:

====
at-coded ADL2::
+
```cadl
   OBSERVATION[at0000] ∈ {                -- paediatric blood pressure measurement
        /protocol existence ∈ {0}
    }
```

id-coded ADL2::
+
```cadl
   OBSERVATION[id1] ∈ {                -- paediatric blood pressure measurement
        /protocol existence ∈ {0}
    }
```
====

Note that in the above, the '/' is used to denote '/protocol' as a differential path. Without the slash, the 'protocol' attribute would be considered to be trying to constrain a hitherto unconstrained attribute called 'protocol', rather than redefine a constraint already present in a parent archetype.

### Multiply-valued (Container) Attributes

The following sub-sections describe specialisation semantics specific to container attributes.

#### Cardinality

The _cardinality_ constraint defines how many object instances can be in the container within the data (not the archetype). In a specialised archetype, cardinality can be redefined to be a narrower range than in the parent, further limiting the valid ranges of items in the data that may occur within the container. This would normally only make sense if refinements were made to the occurrences of the contained items, i.e.:

* narrowing the occurrences range of an object;
* excluding an object by setting its occurrences to `{0}`;
* adding new objects, which themselves will have occurrences constraints;
* setting some object occurrences to mandatory, and the enclosing cardinality lower limit to some non-zero value.

As long as the relationship between the enclosing attribute's cardinality constraint and the occurrences constraints defined on all the contained items (including those inherited unchanged, and therefore not mentioned in the specialised archetype) is respected (see {openehr_am_aom2}#VACMCU[VACMCU, VACMCO validity rules, AOM2 specification^]), any of the above specialisations can occur.

The following provides an example of cardinality redefinition.

Parent archetype:

====
at-coded ADL2::
+
```cadl
    ITEM_LIST[at0002] ∈ {                                      -- general check list
        items cardinality ∈ {0..*} ∈ {                      -- any number of items
            ELEMENT[at0011] occurrences ∈ {0..*} ∈ {...}      -- generic checklist item
        }
    }
```

id-coded ADL2::
+
```cadl
    ITEM_LIST[id3] ∈ {                                      -- general check list
        items cardinality ∈ {0..*} ∈ {                      -- any number of items
            ELEMENT[id12] occurrences ∈ {0..*} ∈ {...}      -- generic checklist item
        }
    }
```
====

Child archetype:

====
at-coded ADL2::
+
```cadl
    ITEM_LIST[at0002] ∈ {                                      -- pre-operative check list
        /items cardinality ∈ {3..10} ∈ {                    -- at least 3 mandatory items
            ELEMENT[at0011.1] occurrences ∈ {1} ∈ {...}       -- item #1
            ELEMENT[at0011.2] occurrences ∈ {1} ∈ {...}       -- item #2
            ELEMENT[at0011.3] occurrences ∈ {1} ∈ {...}       -- item #3
            ELEMENT[at0011.4] occurrences ∈ {0..1} ∈ {...}    -- item #4
            ...
            ELEMENT[at0011.10] occurrences ∈ {0..1} ∈ {...}   -- item #10
        }
    }
```

id-coded ADL2::
+
```cadl
    ITEM_LIST[id3] ∈ {                                      -- pre-operative check list
        /items cardinality ∈ {3..10} ∈ {                    -- at least 3 mandatory items
            ELEMENT[id12.1] occurrences ∈ {1} ∈ {...}       -- item #1
            ELEMENT[id12.2] occurrences ∈ {1} ∈ {...}       -- item #2
            ELEMENT[id12.3] occurrences ∈ {1} ∈ {...}       -- item #3
            ELEMENT[id12.4] occurrences ∈ {0..1} ∈ {...}    -- item #4
            ...
            ELEMENT[id12.10] occurrences ∈ {0..1} ∈ {...}   -- item #10
        }
    }
```
====

#### Ordering of Sibling Nodes

Within container attributes, the order of objects may be significant from the point of view of domain users, i.e. the container may be considered as an ordered list. This is easy to achieve in top-level archetype, using the 'ordered' qualifier on a cardinality constraint. However, when particular node(s) are redefined into multiple specialised nodes, or new nodes added by extension, the desired order of the new nodes may be such that they should occur interspersed at particular locations among nodes defined in the parent archetype. The following text is a slightly summarised view of the items attribute from the problem archetype shown in <<redefinition_for_specialisation>>:

====
at-coded ADL2::
+
```cadl
    items cardinality ∈ {0..*; ordered} ∈ {
        ELEMENT[at0001] occurrences ∈ {1} ∈ {...}              -- Problem
        ELEMENT[at0002] occurrences ∈ {0..1} ∈ {...}           -- Date of initial onset
        ELEMENT[at0003] occurrences ∈ {0..1} ∈ {...}           -- Age at initial onset
        ELEMENT[at0004] occurrences ∈ {0..1} ∈ {...}           -- Severity
        ELEMENT[at0008] occurrences ∈ {0..1} ∈ {...}           -- Clinical description
        ELEMENT[at0009] occurrences ∈ {0..1} ∈ {...}           -- Date clinically received
        CLUSTER[at0010] occurrences ∈ {0..*} ∈ {...}           -- Location
        CLUSTER[at0013] occurrences ∈ {0..1} ∈ {...}           -- Aetiology
        CLUSTER[at0017] occurrences ∈ {0..1} ∈ {...}           -- Occurrences or exacerb'ns
        CLUSTER[at0025] occurrences ∈ {0..1} ∈ {...}           -- Related problems
        ELEMENT[at0029] occurrences ∈ {0..1} ∈ {...}           -- Date of resolution
        ELEMENT[at0030] occurrences ∈ {0..1} ∈ {...}           -- Age at resolution
    }
```

id-coded ADL2::
+
```cadl
    items cardinality ∈ {0..*; ordered} ∈ {
        ELEMENT[id2] occurrences ∈ {1} ∈ {...}               -- Problem
        ELEMENT[id3] occurrences ∈ {0..1} ∈ {...}            -- Date of initial onset
        ELEMENT[id4] occurrences ∈ {0..1} ∈ {...}            -- Age at initial onset
        ELEMENT[id5] occurrences ∈ {0..1} ∈ {...}            -- Severity
        ELEMENT[id9] occurrences ∈ {0..1} ∈ {...}            -- Clinical description
        ELEMENT[id10] occurrences ∈ {0..1} ∈ {...}           -- Date clinically received
        CLUSTER[id11] occurrences ∈ {0..*} ∈ {...}           -- Location
        CLUSTER[id14] occurrences ∈ {0..1} ∈ {...}           -- Aetiology
        CLUSTER[id18] occurrences ∈ {0..1} ∈ {...}           -- Occurrences or exacerb'ns
        CLUSTER[id26] occurrences ∈ {0..1} ∈ {...}           -- Related problems
        ELEMENT[id30] occurrences ∈ {0..1} ∈ {...}           -- Date of resolution
        ELEMENT[id31] occurrences ∈ {0..1} ∈ {...}           -- Age at resolution
    }
```
====

To indicate significant ordering in the specialised problem-diagnosis archetype, the keywords ` before` and ` after` can be used, as follows:

====
at-coded ADL2::
+
```cadl
    /data[at0002]/items ∈ {
        before [at0002]
        ELEMENT[at0001.1] ∈ {...}                             -- Diagnosis
        ELEMENT[at0.32] occurrences ∈ {0..1} ∈ {...}          -- Status
        after [at0025]
        CLUSTER[at0.35] occurrences ∈ {0..1} ∈ {...}          -- Diagnostic criteria
        CLUSTER[at0.37] occurrences ∈ {0..1} ∈ {...}          -- Clinical Staging
    }
```

id-coded ADL2::
+
```cadl
    /data[id3]/items ∈ {
        before [id3]
        ELEMENT[id2.1] ∈ {...}                                -- Diagnosis
        ELEMENT[id0.32] occurrences ∈ {0..1} ∈ {...}          -- Status
        after [id26]
        CLUSTER[id0.35] occurrences ∈ {0..1} ∈ {...}          -- Diagnostic criteria
        CLUSTER[id0.37] occurrences ∈ {0..1} ∈ {...}          -- Clinical Staging
    }
```
====

These keywords are followed by a node identifier reference, and act to anchor the location of the node definitions immediately following until the next sibling order marker or the end of the list. The following visual rendition is equivalent, but arguably less readable:

====
at-coded ADL2::
+
```cadl
    after [at0025] CLUSTER[at0.35] occurrences ∈ {0..1} ∈ {...}  -- etc
```

id-coded ADL2::
+
```cadl
    after [id26] CLUSTER[id0.35] occurrences ∈ {0..1} ∈ {...}  -- etc
```
====

The rules for specifying ordering are as follows.

* Ordering is only applicable to object nodes defined within a multiply-valued (i.e. container) attribute whose cardinality includes the `ordered` constraint;
* Any `before` or `after` statement can use as its anchor the node identifier of any sibling node from the same container attribute in the flat form of the parent archetype, or a redefined version of the same, local to the current archetype;
* If no sibling order markers are used, redefined nodes should appear in the same position as the nodes they replace, while extension nodes appear at the end.

If ordering indicators are used in an archetype that is itself further specialised, the following rules apply:

* If the referenced identifier becomes unavailable due to being redefined in the new archetype, it must be redefined to refer to an available sibling identifier as per the rules above.
* If this does not occur, a `before` reference will default to the first sibling node identifier currently available conforming to the original identifier, while an `after` reference will default to the _last_ such identifier available in the current flat archetype.

If, due to multiple levels of redefinition, there is more than one candidate to go before (or after) a given node, the compiler should output a warning. The problem would be resolved by the choice of one of the candidates being changed to indicate that it is to be ordered before (after) another of the candidates rather than the originally stated node.


## Object Redefinition

Object redefinition can occur for any object constraint in the parent archetype, and can include redefinition of node identifier, occurrences, reference model type. For certain kinds of object constraints, specific kinds of redefinition are possible.

### Node Identifiers

In an archetype, node identifiers ('at-codes' / 'id-codes') are mandatory on all object constraint nodes. The identifiers of those object nodes defined as children of a multiply-valued attribute and multiple alternative children of single-valued attributes (see <<Node Identifiers>>) require definitions in the archetype terminology. Definitions are optional on other single child constraints of single-valued attributes. This rule applies in specialised as well as top-level archetypes.

A key question is: when does a node identifier need to be redefined? There are three possible situations:

* when the node is the root node of an archetype, the meaning is always considered to be redefined;
* it can be redefined for purely semantic purposes on other nodes, e.g. to redefine 'heart rate' to 'fetal heart rate';
* a node identifier must be redefined if the node is being redefined into multiple child nodes, either under a multiply-valued attribute, or as alternatives under a single-valued attribute.

Redefinition of an object node identifier for purely semantic purposes, unaccompanied by any other kind of constraint change is done as shown in the following example.

Parent archetype:

====
at-coded ADL2::
+
```cadl
    EVALUATION[at0000] ∈ {                                      -- Medical Certificate
        data ∈ {
            ITEM_TREE[at0001] ∈ {
                items ∈ {
                    ELEMENT[at0004] occurrences ∈ {0..1} ∈ {   -- Description
                        value ∈ {
                            DV_TEXT[at9000]
                        }
                    }
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    EVALUATION[id1] ∈ {                                      -- Medical Certificate
        data ∈ {
            ITEM_TREE[id2] ∈ {
                items ∈ {
                    ELEMENT[id5] occurrences ∈ {0..1} ∈ {   -- Description
                        value ∈ {
                            DV_TEXT[id7]
                        }
                    }
                }
            }
        }
    }
```
====

Child archetype:

====
at-coded ADL2::
+
```cadl
    EVALUATION[at0000.1] ∈ {                              -- Singapore Medical Certificate
        /data[at0001]/items ∈ {
            ELEMENT[at0004.1]                             -- Summary
        }
    }
```

id-coded ADL2::
+
```cadl
    EVALUATION[id1.1] ∈ {                              -- Singapore Medical Certificate
        /data[id2]/items ∈ {
            ELEMENT[id5.1]                             -- Summary
        }
    }
```
====

Here the `at0004` (`id5`) ('Description') node is refined in meaning to `at0004.1` (`id5.1`) ('Summary'). Since there is no other constraint to be stated, no further `matches` block is required.

An example of the 3rd case above of redefinition is shown in the first archetype in <<redefinition_for_specialisation>>, where the node `[at0078]` (`[id79]`) is redefined into a number of more specialised nodes `[at0078.2]` - `[at0078.9]` (`[id79.2]` - `[id79.9]`), while in the second, the identifier `[at0001]` (`[id2]`) is redefined to a single node `[at0001.1]` (`[id2.1]`).

The syntactic form of the identifier of a redefined node is a copy of the original followed by a dot ('.'), optionally intervening instances of the pattern '0.' and then a further non-zero number, i.e.:

* at-coded archetypes: `atNNNN {.0}* .N`
* id-coded archetypes: `idN {.0}* .N`

This permits node identifiers from a given level to be redefined not just at the next level, but at multiple levels below.

The following are examples of redefined node identifiers:

* at-coded archetypes:
** `at0001.1`: redefinition of `at0001` at level 1 specialisation;
** `at0001.0.1`: redefinition of `at0001` node in level 2 specialisation archetype;
** `at0001.1.1`: redefinition of `at0001.1` in level 2 specialisation archetype.
* id-coded archetypes:
** `id2.1`: redefinition of `id2` at level 1 specialisation;
** `id2.0.1`: redefinition of `id2` node in level 2 specialisation archetype;
** `id2.1.1`: redefinition of `id2.1` in level 2 specialisation archetype.

The digits '1' and '2' here should not be confused with levels 1 and 2. The above identifiers based on an `at0005` (`id6`) node might easily be:

* at-coded archetypes:
** `at0005.7`: redefinition of `at0005` in a level 1 specialisation archetype;
** `at0005.0.8`: redefinition of `at0005` node in a level 2 specialisation archetype;
** `at0005.7.8`: redefinition of `at0005.7` in a level 2 specialisation archetype.
* id-coded archetypes:
** `id6.7`: redefinition of `id6` in a level 1 specialisation archetype;
** `id6.0.8`: redefinition of `id6` node in a level 2 specialisation archetype;
** `id6.7.8`: redefinition of `id6.7` in a level 2 specialisation archetype.

#### Adding Nodes

Added object constraint nodes carry identifiers according to the rule mentioned above. The second example includes the new node identifiers `at0.32` , `at0.35` and `at0.37` (`id0.32` , `id0.35` and `id0.37`), whose codes start with a '0'. indicating that they have no equivalent code in the parent archetype.

The node identifier syntax of an extension node commences with at least one instance of the pattern '0.'. The structure of node identifiers for both kinds of node thus always indicates at what level the identifier was introduced, given by the number of dots.

Examples of added node identifiers:

* at-coded archetypes:
** `at0.1`  : identifier of extension node introduced at level 1;
** `at0.0.1`: identifier of extension node introduced at level 2.
* id-coded archetypes:
** `id0.1`  : identifier of extension node introduced at level 1;
** `id0.0.1`: identifier of extension node introduced at level 2.

When a flat form is created, the level at which any given node was introduced or redefined is clear due to the identifier coding system.

### Occurrences Redefinition

The `occurrences` constraint on an object node indicates how many instances within the data may conform to that constraint (see <<Container Attributes>>). Occurrences may be redefined for various reasons, including:

* mandation of specific specialised objects;
* exclusion of certain objects from the parent;
* controlling occurrences of a specialised object to a specific range.

A basic distinction should be understood prior to considering these specific cases, which is a difference between redefinition of occurrences on a single-occurrence node versus a multiple-occurrence node.

A single-occurrence node is one whose effective occurrences has an upper limit of 1, i.e. it can occur either 0..1 or 1 times in data. This is the case for any object node under a single-valued attribute, as well as any object node under a container attribute, that has occurrences set to either 0..1 or 1. The occurrences of such a node can only be redefined in very limited ways, i.e. mandation or exclusion of 0..1.

The situation is different for object nodes with multiple occurrences, i.e. whose effective occurrences upper limit is greater than one. The example provided above in <<Redefinition for Specialisation>> in which node `at0078|panel item|` (`id79|panel item|`) in the parent archetype is specialised into multiple nodes `at0078.1`, `at0078.2` (`id79.1`, `id79.2`) etc, illustrates the standard pattern. When a parent object (the `at0078` (`id79`) node in the parent archetype) has multiple occurrences, it defines a potential _multiplicity_ of data objects that may conform to it. When such a node is redefined into multiple specialised child nodes in a child archetype (each typically having its own occurrences constraint), the latter _specialisation set_ acts as a more precise restatement of the original multiplicity of objects. For this reason, the _collective occurrences_ of the specialised children is used to determine their validity, rather than any individual comparison of the occurrences of one specialised child to that of the parent.

The formal definition of validity for occurrences in both cases is given by the VSONCO rule in the {openehr_am_aom2}#_validity_rules_3[openEHR AOM2 specification^].

#### Mandation

Within container attributes, `occurrences` is usually redefined in order to make a given object mandatory rather than optional. In the following example, the occurrences of the `at0003` (`id4`) node is redefined from `{0..1}` i.e. optional, to `{1}` , i.e. mandatory.

Parent (`openEHR-EHR-EVALUATION.problem.v1.0.3`):

====
at-coded ADL2::
+
```cadl
    EVALUATION[at0000] ∈ { -- Problem
        data ∈ {
            ITEM_TREE[at0001] ∈ {
                items cardinality ∈ {0..*; ordered} ∈ {
                    ELEMENT[at0002] occurrences ∈ {1} ∈ {...}       -- Problem
                    ELEMENT[at0003] occurrences ∈ {0..1} ∈ {...}    -- Date of initial onset
                    -- etc
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    EVALUATION[id1] ∈ { -- Problem
        data ∈ {
            ITEM_TREE[id2] ∈ {
                items cardinality ∈ {0..*; ordered} ∈ {
                    ELEMENT[id3] occurrences ∈ {1} ∈ {...}       -- Problem
                    ELEMENT[id4] occurrences ∈ {0..1} ∈ {...}    -- Date of initial onset
                    -- etc
                }
            }
        }
    }
```
====

Child (`openEHR-EHR-EVALUATION.problem-diagnosis.v1`):

====
at-coded ADL2::
+
```cadl
    /data[at0001]/items ∈ {
        ELEMENT[at0003] occurrences ∈ {1}  -- Date of initial onset
    }
```

id-coded ADL2::
+
```cadl
    /data[id2]/items ∈ {
        ELEMENT[id4] occurrences ∈ {1}  -- Date of initial onset
    }
```
====

In the above we can see that if the only change in the redefinition is to occurrences, the remainder of the block from the parent is not repeated in the child.

#### Exclusion

Occurrences is most commonly constrained on child objects of container attributes, but can be set on objects of any attribute to effect exclusion of part of the instance space. This can be useful in archetypes where a number of alternatives for a single-valued attribute have been stated, and the need is to remove some alternatives in a specialised child archetype. For example, an archetype might have the following constraint:

====
at-coded ADL2::
+
```cadl
    ELEMENT[at0002] ∈ {
        value ∈ {
            DV_QUANTITY[at9000] ∈ {...}
            DV_INTERVAL<DV_QUANTITY>[at9001] ∈ {...}
            DV_COUNT[at9002] ∈ {...}
            DV_INTERVAL<DV_COUNT>[at9003] ∈ {...}
        }
    }
```

id-coded ADL2::
+
```cadl
    ELEMENT[id3] ∈ {
        value ∈ {
            DV_QUANTITY[id4] ∈ {...}
            DV_INTERVAL<DV_QUANTITY>[id5] ∈ {...}
            DV_COUNT[id6] ∈ {...}
            DV_INTERVAL<DV_COUNT>[id7] ∈ {...}
        }
    }
```
====

and the intention is to remove the `DV_INTERVAL<*>` alternatives. This is achieved by redefining the enclosing object to remove the relevant types:

====
at-coded ADL2::
+
```cadl
    ELEMENT[at0002] ∈ {
        value ∈ {
            DV_INTERVAL<DV_QUANTITY>[at9000] occurrences ∈ {0}
            DV_INTERVAL<DV_COUNT>[at9003] occurrences ∈ {0}
        }
    }
```

id-coded ADL2::
+
```cadl
    ELEMENT[id3] ∈ {
        value ∈ {
            DV_INTERVAL<DV_QUANTITY>[id4] occurrences ∈ {0}
            DV_INTERVAL<DV_COUNT>[id7] occurrences ∈ {0}
        }
    }
```
====

Exclusion by setting occurrences to `{0}` is also common in templates, and is used to remove specific child objects of container attributes, as in the following example:

====
at-coded ADL2::
+
```cadl
    /data[at0001]/items ∈ {
        CLUSTER[at0025] occurrences ∈ {0}     -- remove 'Related problems'
        ELEMENT[at0030] occurrences ∈ {0}     -- remove 'Age at resolution'
    }
```

id-coded ADL2::
+
```cadl
    /data[id2]/items ∈ {
        CLUSTER[id26] occurrences ∈ {0}     -- remove 'Related problems'
        ELEMENT[id31] occurrences ∈ {0}     -- remove 'Age at resolution'
    }
```
====

If the whole attribute is to be removed, this can be done by redefining existence to `{0}`, as described in <<Existence Redefinition: Mandation and Exclusion>>.

### Single and Multiple Specialisation - When does Cloning Occur?

In the [examples shown above](#Examples) there are two types of redefinition occurring. The first shows a single node in the parent archetype redefined by a single node, both identified by `at0003` (`id4`). The second shows a single node in the parent redefined by multiple children. In the first example, the result of flattening is _in-place overlaying_, while in the second, it is _cloning with overlaying_. The consequence of the second type of redefinition is that the original parent node survives in its original form in the child archetype, whereas in the first, it is replaced. The reasoning behind this is that redefinition to multiple children is taken to mean that later redefinition to multiple children may occur in deeper child archetypes, and for this to occur, the original parent needs to be left intact. Conversely, the single-parent / single-child redefinition is taken to mean a logical refinement of an existing node, which should therefore be logically replaced.

The formal rule for whether cloning occurs or not is as follows:

```
    clone not needed = max effective_occurrences of object node in parent archetype = 1 OR
        object node in child differential archetype is sole child of its parent, and has max occurrences = 1
```

The first case corresponds to the situation where the 'effective occurrences' of any child of an attribute can be inferred to be maximum 1, i.e. either the attribute is single-valued, or it is a container with a cardinality constraint with maximum 1. The second is where the object in the child archetype has an explicit occurrences constraint of max 1. In the above, the `_effective_occurrences_` function is defined in the {openehr_am_aom2}#_occurrences_inferencing_rules[AOM2 specification].

### Exhaustive and Non-Exhaustive Redefinition

In any multiple specialisation situation, there is a question of whether the original node being specialised (e.g. `at0078` (`id79`) and `at0001` (`id2`) in the examples above) remains available for further redefinition in subsequent child archetypes, or do the redefinition children _exhaustively_ define the instance space for the given parent node?

Should these children be considered exhaustive? One point of view says so, since all subsequently discovered varieties of hepatitis (C, D, E, etc) would now become children of 'hepatitis non-A non-B'. However, this is likely to be sub-optimal, since now the category 'hepatitis non-A non-B' probably exists solely because of the order in which the various hepatitis virus tests were perfected. Therefore an alternative argument would say that the categories 'hepatitis C', 'hepatitis D' etc should be defined directly below 'hepatitis', as if 'hepatitis non-A non-B' had never existed. Under this argument, the children would not be declared, even when they are theoretically exhaustive.

This kind of argument comes up time and again, and the need for catch-all categories (archetype nodes) and the possibility of future discoveries cannot be predicted. Even in situations such as a lab result (e.g. cholesterol), where the list of analytes seem to be known and fixed, experience of clinical modellers has shown that there is nevertheless no guarantee of not needing another data point, perhaps for something other than an analyte.

The default situation is that child redefinition nodes do not exhaustively replace the parent unless explicitly stated otherwise. This may be done by excluding the parent node in the normal way, i.e. using `occurrences matches {0}`. *If an exclusion node is included, it must come last* in the set of siblings that specialise the parent node, otherwise a deletion will occur, leaving no node to specialise. The first example would then become:

Parent archetype:

====
at-coded ADL2::
+
```cadl
    items cardinality ∈ {0..*; unordered} ∈ {
        CLUSTER[at0003] occurrences ∈ {1} ∈ {...}                          -- Specimen
        CLUSTER[at0010] occurrences ∈ {0..*} ∈ {...}                      -- level 1
        ELEMENT[at0078] occurrences ∈ {0..*} ∈ {                          -- panel item
            value ∈ {*}
        }
        ELEMENT[at0016] occurrences ∈ {0..1} ∈ {...}                      -- Overall Comment
        ELEMENT[at0036] occurrences ∈ {0..1} ∈ {...}                      -- Multimedia rep.
    }
```

id-coded ADL2::
+
```cadl
    items cardinality ∈ {0..*; unordered} ∈ {
        CLUSTER[id4] occurrences ∈ {1} ∈ {...}                          -- Specimen
        CLUSTER[id11] occurrences ∈ {0..*} ∈ {...}                      -- level 1
        ELEMENT[id79] occurrences ∈ {0..*} ∈ {                          -- panel item
            value ∈ {*}
        }
        ELEMENT[id17] occurrences ∈ {0..1} ∈ {...}                      -- Overall Comment
        ELEMENT[id37] occurrences ∈ {0..1} ∈ {...}                      -- Multimedia rep.
        }
    }
```
====

Child archetype:

====
at-coded ADL2::
+
```cadl
    /data/events[at0001]/data/items ∈ {
        ELEMENT[at0078.1] occurrences ∈ {0..1} ∈ {...}                    -- TSH
        ELEMENT[at0078.2] occurrences ∈ {0..1} ∈ {...}                    -- Free Triiodothyronine
        ELEMENT[at0078.3] occurrences ∈ {0..1} ∈ {...}                    -- Total Triiodothyronine
        ELEMENT[at0078.4] occurrences ∈ {0..1} ∈ {...}                    -- Free thyroxine (Free T4)
        ELEMENT[at0078.5] occurrences ∈ {0..1} ∈ {...}                    -- Total Thyroxine (Total T4)
        ELEMENT[at0078.6] occurrences ∈ {0..1} ∈ {...}                    -- T4 loaded uptake
        ELEMENT[at0078.7] occurrences ∈ {0..1} ∈ {...}                    -- Free Triiodothyronine index
        ELEMENT[at0078.8] occurrences ∈ {0..1} ∈ {...}                    -- Free thyroxine index (FTI)
        ELEMENT[at0078] occurrences ∈ {0}                                  -- MUST COME LAST!
    }
```

id-coded ADL2::
+
```cadl
    /data/events[id2]/data/items ∈ {
        ELEMENT[id79.1] occurrences ∈ {0..1} ∈ {...}                    -- TSH
        ELEMENT[id79.2] occurrences ∈ {0..1} ∈ {...}                    -- Free Triiodothyronine
        ELEMENT[id79.3] occurrences ∈ {0..1} ∈ {...}                    -- Total Triiodothyronine
        ELEMENT[id79.4] occurrences ∈ {0..1} ∈ {...}                    -- Free thyroxine (Free T4)
        ELEMENT[id79.5] occurrences ∈ {0..1} ∈ {...}                    -- Total Thyroxine (Total T4)
        ELEMENT[id79.6] occurrences ∈ {0..1} ∈ {...}                    -- T4 loaded uptake
        ELEMENT[id79.7] occurrences ∈ {0..1} ∈ {...}                    -- Free Triiodothyronine index
        ELEMENT[id79.8] occurrences ∈ {0..1} ∈ {...}                    -- Free thyroxine index (FTI)
        ELEMENT[id79] occurrences ∈ {0}                                  -- MUST COME LAST!
    }
```
====

Without the above specification, a deeper child archetype could then redefine both the original `at0078` (`id79`) node (e.g. into `at0078.0.1` , `at0078.0.2` (`id79.0.1` , `id79.0.2`)), and any of the `at0078.x` (`id79.x`) nodes (e.g. `at0078.1.1` , `at0078.1.2` (`id79.1.1` , `id79.1.2`)); with it, only the latter is possible. The `at0078` (`id79`) node can thus be considered to be logically 'frozen', in a similar way to frozen class methods in some programming languages.

### Reference Model Type Refinement

The type of an object may be redefined to one of its subtypes as defined by the reference model. A typical example of where this occurs in archetypes based on the openEHR reference model is when `ELEMENT._value_` is constrained to `*` in a parent archetype, meaning 'no further constraint on its RM type of `DATA_VALUE`, but is then constrained in a specialised archetype to subtypes of `DATA_VALUE`, e.g. `DV_QUANTITY` or `DV_PROPORTION` (see {openehr_rm_data_types}[openEHR Data Types^]). The following figure contains a simplified extract of the data values part of the openEHR reference model, and is the basis for the examples below.

.Example Reference Model type structure
image::{doc_name}/diagrams/RM-data_types-overview.svg[id=rm_type_structure, align="center", width=50%]

The most basic form of type refinement is shown in the following example:

Parent archetype:

```cadl
    value ∈ {*} -- any subtype of DATA_VALUE, from the ref model
```

Specialised archetype:

====
at-coded ADL2::
+
```cadl
    .../value ∈ {
        DV_QUANTITY[at9000] -- now limit to the DV_QUANTITY subtype
    }
```

id-coded ADL2::
+
```cadl
    .../value ∈ {
        DV_QUANTITY[id8] -- now limit to the DV_QUANTITY subtype
    }
```
====

The meaning of the above is that instance data constrained by the specialised archetype at the value node must match the `DV_QUANTITY` constraint only - no other subtype of `DATA_VALUE` is allowed.

When a type in an archetype is redefined into one of its subtypes, any existing constraints on the original type in the parent archetype are respected. In the following example, a `DV_AMOUNT` constraint that required _accuracy_ to be present and in the range +/-5% is refined into a `DV_QUANTITY` in which two attributes of the subtype are constrained. The original _accuracy_ attribute is inherited without change.

Parent archetype:

====
at-coded ADL2::
+
```cadl
    value ∈ {
        DV_AMOUNT[at9000] ∈ {
            accuracy ∈ {|-0.05..0.05|}
        }
    }
```

id-coded ADL2::
+
```cadl
    value ∈ {
        DV_AMOUNT[id4] ∈ {
            accuracy ∈ {|-0.05..0.05|}
        }
    }
```
====

Specialised archetype:

====
at-coded ADL2::
+
```cadl
    .../value ∈ {
        DV_QUANTITY[at9000] ∈ {
            magnitude ∈ {|2.0..10.0|}
            units ∈ {"mmol/ml"}
        }
    }
```

id-coded ADL2::
+
```cadl
    .../value ∈ {
        DV_QUANTITY[id4] ∈ {
            magnitude ∈ {|2.0..10.0|}
            units ∈ {"mmol/ml"}
        }
    }
```
====

In the same manner, an object node can be specialised into more than one subtype, where each such constraint selects a mutually exclusive subset of the instance space. The following example shows a specialisation of the `DV_AMOUNT` constraint above into two sub-typed constraints.

====
at-coded ADL2::
+
```cadl
    .../value ∈ {
        DV_QUANTITY[at9000.1] ∈ {
            magnitude ∈ {|2.0..10.0|}
            units ∈ {"mmol/ml"}
        }
        DV_PROPORTION[at9000.2] ∈ {
            numerator ∈ {|2.0..10.0|}
            type ∈ {1} -- pk_unitary
        }
    }
```

id-coded ADL2::
+
```cadl
    .../value ∈ {
        DV_QUANTITY[id4.1] ∈ {
            magnitude ∈ {|2.0..10.0|}
            units ∈ {"mmol/ml"}
        }
        DV_PROPORTION[id4.2] ∈ {
            numerator ∈ {|2.0..10.0|}
            type ∈ {1} -- pk_unitary
        }
    }
```
====

Here, instance data may only be of type `DV_QUANTITY` or `DV_PROPORTION`, and must satisfy the respective constraints for those types.

A final variant of subtyping is when the intention is to constraint the data to a supertype with exceptions for particular subtypes. In this case, constraints based on subtypes are matched first, with the constraint based on the parent type being used to constrain all other subtypes. The following example constrains data at the _value_ node to be:

* an instance of `DV_QUANTITY` with _magnitude_ within the given range etc;
* an instance of `DV_PROPORTION` with _numerator_ in the given range etc;
* an instance of any other subtype of `DV_AMOUNT`, with _accuracy_ in the given range.

====
at-coded ADL2::
+
```cadl
    .../value ∈ {
        DV_QUANTITY[at9000] ∈ {
            magnitude ∈ {|2.0..10.0|}
            units ∈ {"mmol/ml"}
        }
        DV_PROPORTION[at9001] ∈ {
            numerator ∈ {|2.0..10.0|}
            type ∈ {pk_unitary}
        }
        DV_AMOUNT[at9002] ∈ {
            accuracy ∈ {|-0.05..0.05|}
        }
    }
```

id-coded ADL2::
+
```cadl
    .../value ∈ {
        DV_QUANTITY[id4] ∈ {
            magnitude ∈ {|2.0..10.0|}
            units ∈ {"mmol/ml"}
        }
        DV_PROPORTION[id5] ∈ {
            numerator ∈ {|2.0..10.0|}
            type ∈ {pk_unitary}
        }
        DV_AMOUNT[id6] ∈ {
            accuracy ∈ {|-0.05..0.05|}
        }
    }
```
====

A typical use of this kind of refinement in openEHR would be to add an alternative for a `DV_CODED_TEXT` constraint for a specific terminology to an existing `DV_TEXT` constraint in a `_name_` attribute, as follows:

====
at-coded ADL2::
+
```adl
definition
    ...
        name ∈ {
            DV_CODED_TEXT[at0078] ∈ {
                defining_code ∈ {[ac1]}
            }
            DV_TEXT[at0013] ∈ {
                value ∈ {/.+/} -- non-empty string
            }
        }
    ...

terminology
    ...
    term_bindings = <
        ["snomed_ct"]    = <
            ["ac1"] = <http://snomed.info/123456789> -- any SNOMED CT code
        >
    >
```

id-coded ADL2::
+
```adl
definition
    ...
        name ∈ {
            DV_CODED_TEXT[id79] ∈ {
                defining_code ∈ {[ac1]}
            }
            DV_TEXT[id14] ∈ {
                value ∈ {/.+/} -- non-empty string
            }
        }
    ...

terminology
    ...
    term_bindings = <
        ["snomed_ct"]    = <
            ["ac1"] = <http://snomed.info/123456789> -- any SNOMED CT code
        >
    >
```
====

All of the above specialisations based on reference model subtypes can be applied in the same way to identified object constraints.

### Internal Reference (Proxy Object) Redefinition

An archetype proxy object, or `use_node` constraint is used to refer to an object constraint from a point elsewhere in the archetype. These references can be redefined in two ways, as follows.

* Target redefinition: the target constraint of reference may be itself redefined. The meaning for this is that all internal references now assume the redefined form.
* Reference redefinition: specialised archetypes can redefine a use_node object into a normal inline concrete constraint that a) replaces the reference, and b) must be completely conformant to the structure which is the target of the original reference.

Note that if the intention is to redefine a structure referred to by `use_node` constraints, but to leave the constraints at the reference source points in form to which the reference points in the parent level, each `use_node` reference needs to be manually redefined as a copy of the target structure originally pointed to.

The second type of redefinition above is the most common, and is shown in the following example.

Parent archetype:

====
at-coded ADL2::
+
```cadl
    ENTRY[at0000]∈ {
        data ∈ {
            CLUSTER[at0001] ∈ {
                items ∈ {
                    -- etc --
                }
            }
            use_node CLUSTER[at0002] /data[at0001]
        }
    }
```

id-coded ADL2::
+
```cadl
    ENTRY[id1]∈ {
        data ∈ {
            CLUSTER[id2] ∈ {
                items ∈ {
                    -- etc --
                }
            }
            use_node CLUSTER[id3] /data[id2]
        }
    }
```
====

Child archetype:

====
at-coded ADL2::
+
```cadl
    ENTRY [at0000.1]∈ {
        /data[at0002]/items ∈ {
            ELEMENT [at0.1] ∈ {
                -- etc --
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    ENTRY [id1.1]∈ {
        /data[id3]/items ∈ {
            ELEMENT [id0.1] ∈ {
                -- etc --
            }
        }
    }
```
====

Remembering that the parent archetype is essentially just definition two sibling object structures with the identifiers `at0000` and `at0001` (`id1` and `id2`) (defined by the use_node reference), the child is redefining the `at0001` (`id2`) node (it could have redefined the `at0000` (`id1`) node as well). The result of this in the flattened output is as follows:

====
at-coded ADL2::
+
```cadl
    ENTRY [at0000.1] ∈ {
        data ∈ {
            CLUSTER[at0001] ∈ {
                items ∈ {
                    -- etc --
                }
            }
            CLUSTER[at0002] ∈ {
                items ∈ {
                    ELEMENT[at0.1] ∈ {
                        -- etc --
                    }
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    ENTRY [id1.1] ∈ {
        data ∈ {
            CLUSTER[id2] ∈ {
                items ∈ {
                    -- etc --
                }
            }
            CLUSTER[id3] ∈ {
                items ∈ {
                    ELEMENT[id0.1] ∈ {
                        -- etc --
                    }
                }
            }
        }
    }
```
====

There is one subtlety to do with redefinition of occurrences of a use_node target: if it is redefined to have occurrences matches `{0}` (normally only in a template), then the effect of this is the same on any use_node reference definitions, unless they define occurrences locally at the reference point. The chance of this actually occurring appears vanishingly small, since by the time 'exclusion' occurrence redefinition is being done in templates, use_node object definitions are most likely to have been locally overridden anyway.

Lastly, one further type of redefinition appears technically possible, but seems of no utility, and is therefore not part of ADL:

* Reference re-targeting: an internal reference could potentially be redefined into a reference to a different target whose structure conforms to the original target.

### External Reference Redefinition

External reference nodes can be redefined by another external reference node, in the following ways:

* exclusion - using the occurrences matches `{0}` method;
* semantic refinement of the node identifier in the normal way;
* redefinition of the reference to another archetype which is a specialisation of the one from the corresponding reference node in the flat parent.

### Slot Filling and Redefinition

Slots and slot-filling is a special kind of 'redefinition' in ADL, normally only used in templates. Logically, an archetype slot constraint is understood to consist of a) its definition (what archetypes are allowed to fill it) and b) current filler list. At the point of definition, the current fillers is invariably empty. More specialised descendants can progressively add or replace fillers for a slot. Thus, the appearance of an object node whose identifier is the specialisation of a slot node in the flat parent is always understood as a partial specialisation for it.

In other words, a slot within an archetype can be specialised by any combination of the following:

* one or more slot-fillers;
* a redefinition of the slot itself, either to narrow the set of archetypes it matches, or to close it to filling in either further specialisations, or at runtime, or to remove it.

Both types of redefinition are generally used by templates rather than published archetypes, since the business of filling slots is mostly related to local use-case specific uses of archetypes rather than part of the initial design.

The following example shows a slot from a `SECTION` archetype for the 'history_medical_surgical' archetype.

====
at-coded ADL2::
+
```cadl
    SECTION[at0000] ∈ {    -- Past history
        items ∈ {
            allow_archetype EVALUATION[at0001] ∈ { -- Past problems
                include
                    archetype_id/value ∈ {
                        /openEHR-EHR-EVALUATION\.clinical_synopsis\.v1
                            |openEHR-EHR-EVALUATION\.excluded(-[a-z0-9_]+)*\.v1
                            |openEHR-EHR-EVALUATION\.injury\.v1
                            |openEHR-EHR-EVALUATION\.problem(-[a-z0-9_]+)*\.v1/}
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    SECTION[id1] ∈ {    -- Past history
        items ∈ {
            allow_archetype EVALUATION[id2] ∈ { -- Past problems
                include
                    archetype_id/value ∈ {
                        /openEHR-EHR-EVALUATION\.clinical_synopsis\.v1
                            |openEHR-EHR-EVALUATION\.excluded(-[a-z0-9_]+)*\.v1
                            |openEHR-EHR-EVALUATION\.injury\.v1
                            |openEHR-EHR-EVALUATION\.problem(-[a-z0-9_]+)*\.v1/}
            }
        }
    }
```
====

This slot specification allows `EVALUATION` archetypes for the concepts 'clinical synopsis', various kinds of 'exclusions' and 'problems', and 'injury' to be used, and no others. The following fragment of ADL shows how the slot is filled in a template, using the keyword `use_archetype`. In this syntax, the node identification is a variation on the normal archetype at-codes (id-codes). Within the template, the identifier of the used archetype is also the identifier of that node. However, the original at-code (if defined) must also be mentioned, to indicate which slot the used archetype is filling. Templates may also be used to fill slots in the same way. Thus, in the following example, two archetypes and a template are designated to fill the `at0001` (`id2`) slot defined in the above fragment of ADL. The slot definition is not mentioned, so it remains unchanged, i.e. 'open'.

====
at-coded ADL2::
+
```cadl
    SECTION[at0000] ∈ {    -- Past history
        /items ∈ {
            use_archetype EVALUATION[at0001, org.openehr::openEHR-EHR-EVALUATION.problem.v1]
            use_archetype EVALUATION[at0001, uk.nhs.cfh::openEHR-EHR-EVALUATION.t_ed_diagnosis.v1]
            use_archetype EVALUATION[at0001, org.openehr::openEHR-EHR-EVALUATION.clin_synopsis.v1]
        }
    }
```

id-coded ADL2::
+
```cadl
    SECTION[id1] ∈ {    -- Past history
        /items ∈ {
            use_archetype EVALUATION[id2, org.openehr::openEHR-EHR-EVALUATION.problem.v1]
            use_archetype EVALUATION[id2, uk.nhs.cfh::openEHR-EHR-EVALUATION.t_ed_diagnosis.v1]
            use_archetype EVALUATION[id2, org.openehr::openEHR-EHR-EVALUATION.clin_synopsis.v1]
        }
    }
```
====

Slots can be recursively filled in the above fashion, according to the possibilities offered by the chosen archetypes or templates. The following ADL fragment shows two levels of slot-filling:

====
at-coded ADL2::
+
```cadl
    use_archetype COMPOSITION[openEHR-EHR-COMPOSITION.xxx.v1] ∈ {
        /content ∈ {
            use_archetype SECTION[at0000, org.openehr::openEHR-EHR-SECTION.yyy.v1] ∈ {
                /items ∈ {
                    use_archetype EVALUATION[at0001, uk.nhs.cfh::openEHR-EHR-EVALUATION.t_xx.v1]
                    use_archetype EVALUATION[at0001, org.openehr::openEHR-EHR-EVALUATION.xx.v1]
                    use_archetype EVALUATION[at0002, org.openehr::openEHR-EHR-EVALUATION.xx.v1]
                }
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    use_archetype COMPOSITION[openEHR-EHR-COMPOSITION.xxx.v1] ∈ {
        /content ∈ {
            use_archetype SECTION[id1, org.openehr::openEHR-EHR-SECTION.yyy.v1] ∈ {
                /items ∈ {
                    use_archetype EVALUATION[id2, uk.nhs.cfh::openEHR-EHR-EVALUATION.t_xx.v1]
                    use_archetype EVALUATION[id2, org.openehr::openEHR-EHR-EVALUATION.xx.v1]
                    use_archetype EVALUATION[id3, org.openehr::openEHR-EHR-EVALUATION.xx.v1]
                }
            }
        }
    }
```
====

Note that in the above the archetype fillers are specified as published archetypes, but in reality, it is far more likely that template-specific specialisations of these archetypes would be used. The identification and organisation of such archetypes is described in the openEHR Templates document.

In addition to or instead of specifying slot fillers, it is possible in a slot specialisation to narrow the slot definition, or to close it. If fillers are specified, closing the slot as well is typical. The latter is done by including an overridden version of the archetype slot object itself, with the 'closed' constraint set, as in the following example:

====
at-coded ADL2::
+
```cadl
    use_archetype SECTION[org.openehr::openEHR-EHR-SECTION.history_medical_surgical.v1] ∈ {
        /items ∈ {
            use_archetype EVALUATION[at0001, openEHR-EHR-EVALUATION.problem.v1]
            allow_archetype EVALUATION[at0001] closed
        }
    }
```

id-coded ADL2::
+
```cadl
    use_archetype SECTION[org.openehr::openEHR-EHR-SECTION.history_medical_surgical.v1] ∈ {
        /items ∈ {
            use_archetype EVALUATION[id2, openEHR-EHR-EVALUATION.problem.v1]
            allow_archetype EVALUATION[id2] closed
        }
    }
```
====

Narrowing the slot is done with a replacement ` allow_archetype` statement containing a narrowed set of match criteria.

### Unconstrained Attributes

The `use_archetype` keyword can be used to specify child object constraints under any attribute in the reference model that is so far unconstrained by the flat parent of an archetype or template. Technically this could occur in any kind of archetype but would normally be in a specialised archetype or template. This is no more than the standard use of an 'external reference' (see <<_external_references>>).

Any reference specified will have no slot, and is instead validity-checked against the appropriate part of the underlying reference model.

The following example from the openEHR reference model is typical.

====
at-coded ADL2::
+
```cadl
    COMPOSITION[at0000] matches {               -- Referral document
        category matches {...}
        context matches {
            EVENT_CONTEXT[at0001] matches {
                participations matches {...}
                other_context matches {...}
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    COMPOSITION[id1] matches {               -- Referral document
        category matches {...}
        context matches {
            EVENT_CONTEXT[id2] matches {
                participations matches {...}
                other_context matches {...}
            }
        }
    }
```
====

The above cADL block partially specifies a `COMPOSITION` object, via constraints (often including slot definitions) on the _category_ and _context_ attributes defined on that class in the reference model. However, the attribute of most interest in a `COMPOSITION` object is usually the _content_ attribute, which is not constrained at all here. The reference model defines it to be of type `List<CONTENT_ITEM>` .

Using an external reference in an unarchetyped part of the RM structure is almost always done in specialised archetypes or templates, but is valid in a top-level archetype.

The following example shows the use of `use_archetype` within a specialised archetype.

====
at-coded ADL2::
+
```cadl
    COMPOSITION[at0000.1] matches {        -- Referral document (specialisation)
        content matches {
            use_archetype SECTION[at0001, openEHR-EHR-SECTION.history_medical_surgical.v1]
        }
    }
```

id-coded ADL2::
+
```cadl
    COMPOSITION[id1.1] matches {        -- Referral document (specialisation)
        content matches {
            use_archetype SECTION[id2, openEHR-EHR-SECTION.history_medical_surgical.v1]
        }
    }
```
====

## Primitive Object Redefinition

For terminal objects (i.e. elements of the type `C_PRIMITIVE_OBJECT`) redefinition consists of:

* addition of value constraints for nodes which in the parent are constrained solely to a primitive type (described in <<cADL_Constraints_Primitive_Types>>);
* redefined value ranges or sets using a narrower value range or set;
* exclusions on the previously defined value ranges or sets which have the effect of narrowing the original range or set.

### Numeric Primitive Redefinition

The following example shows a redefined real value range.

Parent archetype:

====
at-coded ADL2::
+
```cadl
    value ∈ {
        DV_QUANTITY[at9000] ∈ {
            magnitude ∈ {|2.0..10.0|}
            units ∈ {"mmol/ml"}
        }
    }
```

id-coded ADL2::
+
```cadl
    value ∈ {
        DV_QUANTITY[id3] ∈ {
            magnitude ∈ {|2.0..10.0|}
            units ∈ {"mmol/ml"}
        }
    }
```
====

Specialised archetype:

====
at-coded ADL2::
+
```cadl
    .../value ∈ {
        DV_QUANTITY[at9000] ∈ {
            magnitude ∈ {|4.0..6.5|}
        }
    }
```

id-coded ADL2::
+
```cadl
    .../value ∈ {
        DV_QUANTITY[id3] ∈ {
            magnitude ∈ {|4.0..6.5|}
        }
    }
```
====

### Terminology Constraint Redefinition

Redefinition of a terminology constraint follows the golden rule that redefinitions may only narrow constraints, not widen them, to preserve the instance / archetype validity relation up the specialisation lineage. The golden rule holds only for formal constraints, and is modified by the possibility of [non-binding constraint strengths](#_soft_terminology_constraint).

#### Constrain Previously Unconstrained Node

The simplest form of terminology constraint specialisation is when a term constraint is used as a redefinition of a previously _unconstrained node_. This might simply be to require that a data item be of the appropriate reference model type, with no further constraint:

====
at-coded ADL2::
+
```cadl
    /data[at0001]/events[at0002]/data[at0003]/items[at0021]/value ∈ {  -- cuff size
        DV_CODED_TEXT[at9000]  -- force a term of some kind
    }
```

id-coded ADL2::
+
```cadl
    /data[id2]/events[id3]/data[id4]/items[id22]/value ∈ {  -- cuff size
        DV_CODED_TEXT[id14]  -- force a term of some kind
    }
```
====

Alternatively, it may impose a value set, as follows:

====
at-coded ADL2::
+
```cadl
    /data[at0001]/events[at0002]/data[at0003]/items[at0021]/value ∈ {  -- cuff size
        DV_CODED_TEXT[at9000] matches {[ac0.1]}
    }
```

id-coded ADL2::
+
```cadl
    /data[id2]/events[id3]/data[id4]/items[id22]/value ∈ {  -- cuff size
        DV_CODED_TEXT[id14] matches {[ac0.1]}
    }
```
====

#### Terminology Internal Value Set Redefinition

The more typical redefinition case is when the parent node already states a terminology constraint with a value set, and the specialisation child redefines is, as per the following example.

Parent archetype:

====
at-coded ADL2::
+
```adl
definition
    ...
        ELEMENT[at0006] occurrences ∈ {0..*} ∈ {   -- System
            name ∈ {
                DV_CODED_TEXT[at9000] ∈ {
                    defining_code ∈ {[ac1]}
                }
            }
        }
    ...

terminology
    ...
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <
                "at0007",   -- Cardiovascular system
                "at0008",   -- Respiratory system
                "at0009",   -- Gastro-intestinal system
                "at0010",   -- Reticulo-Endothelial system
                "at0011",   -- Genito-urinary system
                "at0012",   -- Endocrine System
                "at0013",   -- Central nervous system
                "at0014"    -- Musculoskeletal system
            >
        >
    >
```

id-coded ADL2::
+
```adl
definition
    ...
        ELEMENT[id7] occurrences ∈ {0..*} ∈ {   -- System
            name ∈ {
                DV_CODED_TEXT[id14] ∈ {
                    defining_code ∈ {[ac1]}
                }
            }
        }
    ...

terminology
    ...
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <
                "at8",    -- Cardiovascular system
                "at9",    -- Respiratory system
                "at10",   -- Gastro-intestinal system
                "at11",   -- Reticulo-Endothelial system
                "at12",   -- Genito-urinary system
                "at13",   -- Endocrine System
                "at14",   -- Central nervous system
                "at15"    -- Musculoskeletal system
            >
        >
    >
```
====

Specialised archetype:

====
at-coded ADL2::
+
```adl
definition
    .../name[at0013]/defining_code ∈ {[ac1.1]}

terminology
    ...
    value_sets = <
        ["ac1.1"] = <
            id = <"ac1.1">
            members = <
                "at0009",   -- Gastro-intestinal system
                "at0010",   -- Reticulo-Endothelial system
                "at0011",   -- Genito-urinary system
                "at0012",   -- Endocrine System
                "at0013",   -- Central nervous system
                "at0014"    -- Musculoskeletal system
            >
        >
    >
```

id-coded ADL2::
+
```adl
definition
    .../name[id14]/defining_code ∈ {[ac1.1]}

terminology
    ...
    value_sets = <
        ["ac1.1"] = <
            id = <"ac1.1">
            members = <
                "at10",   -- Gastro-intestinal system
                "at11",   -- Reticulo-Endothelial system
                "at12",   -- Genito-urinary system
                "at13",   -- Endocrine System
                "at15"    -- Musculoskeletal system
            >
        >
    >
```
====

#### Terminology External Subset Redefinition

A terminology external subset constraint is used to set the value set of a coded term to be one defined externally in a terminology, specified in the `term_definitions` sub-section of the `terminology` section, as shown in the following example.

====
at-coded ADL2::
+
```adl
definition
    ELEMENT [at0078] ∈ { -- cuff size
        value ∈ {
            DV_CODED_TEXT[at9000] ∈ {
                defining_code ∈ {[ac1]}
            }
        }
    }

terminology
    term_bindings = <
        ["snomed_ct"]    = <
            ["ac1"] = <http://terminology.org/id/12000001>
        >
    >
```

id-coded ADL2::
+
```adl
definition
    ELEMENT [id79] ∈ { -- cuff size
        value ∈ {
            DV_CODED_TEXT[id4] ∈ {
                defining_code ∈ {[ac1]}
            }
        }
    }

terminology
    term_bindings = <
        ["snomed_ct"]    = <
            ["ac1"] = <http://terminology.org/id/12000001>
        >
    >
```
====

In a specialisation of the archetype, the value set reference can be redefined in two different ways. The first is by redefinition of the constraint to a narrower one. This is a achieved by redefining the constraint code, and adding a new definition in the terminology of the specialised archetype, as follows.

====
at-coded ADL2::
+
```adl
definition
    ELEMENT [at0078] ∈ {               -- cuff size
        value ∈ {
            DV_CODED_TEXT[at9000] ∈ {
                defining_code ∈ {[ac1.1]}
            }
        }
    }

terminology
    term_bindings = <
        ["snomed_ct"]    = <
            ["ac1.1"] = <http://terminology.org/id/12000002>
        >
    >
```

id-coded ADL2::
+
```adl
definition
    ELEMENT [id79] ∈ {               -- cuff size
        value ∈ {
            DV_CODED_TEXT[id14] ∈ {
                defining_code ∈ {[ac1.1]}
            }
        }
    }

terminology
    term_bindings = <
        ["snomed_ct"]    = <
            ["ac1.1"] = <http://terminology.org/id/12000002>
        >
    >
```
====

The second kind of redefinition is by an internal value set, as follows.

====
at-coded ADL2::
+
```adl
terminology
    ...
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at0021",   -- child cuff
                       "at0022">   -- infant cuff
        >
    >
```

id-coded ADL2::
+
```adl
terminology
    ...
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = "<at22",   -- child cuff
                      "at23">    -- infant cuff
        >
    >
```
====

These redefinitions are assumed to be valid, although they are not directly validatable unless the terminology subset is available to the tooling.

#### Constraint Strength Redefinition

Regardless of any changes to the value constraint, narrowing must also be respected for the constraint strength. Concretely, this means that a redefined terminology constraint may narrow the constraint strength by redefining any strength declared in a parent to any 'higher' strength, where the following order holds, from lowest to highest: `example` -> `preferred` -> `exensible` -> `required`. Thus, the following redefinition from `preferred` to `required` may be made:

====
at-coded ADL2::
+
```cadl
    -- parent archetype
    name matches {
        DV_CODED_TEXT[at9000] matches {
            defining_code matches {preferred [ac1]}
        }
    }

    -- child archetype
    name matches {
        DV_CODED_TEXT[at9000.1] matches {
            defining_code matches {[ac1]}  -- i.e. required
        }
    }
```

id-coded ADL2::
+
```cadl
    -- parent archetype
    name matches {
        DV_CODED_TEXT[id13] matches {
            defining_code matches {preferred [ac1]}
        }
    }

    -- child archetype
    name matches {
        DV_CODED_TEXT[id13.1] matches {
            defining_code matches {[ac1]}  -- i.e. required
        }
    }
```
====

A constraint with `required` strength cannot be redefined to any other strength in a specialised archetype.

NOTE: Although the standard form `defining_code matches {[ac1]}` may always be used to represent 'required' strength, it is strongly recommended that the explicit form `defining_code matches {required [ac1]}` be used in specialised archetypes, _where the constraint strength is being redefined_ (i.e. not for redefinition of a nodes where constraint strength is never mentioned).

It must be kept in mind that a constraint strength other than `required` is formally equivalent to _no constraint_ - i.e. it is only a guide for tooling and human authors. The following two fragments are therefore completely equivalent.

====
at-coded ADL2::
+
```cadl
    -- non-required constraint strength
    name matches {
        DV_CODED_TEXT[at9000] matches {
            defining_code matches {preferred [ac1]}
        }
    }

    -- ... is the same as no constraint, other than RM type
    name matches {
        DV_CODED_TEXT[at9000]
    }
```

id-coded ADL2::
+
```cadl
    -- non-required constraint strength
    name matches {
        DV_CODED_TEXT[id13] matches {
            defining_code matches {preferred [ac1]}
        }
    }

    -- ... is the same as no constraint, other than RM type
    name matches {
        DV_CODED_TEXT[id13]
    }
```
====

This means that redefinition of a node containing a non-required constraint strength is formally speaking a redefinition of a node with no constraint on terminology code values. _The specialised node may therefore state any value set, regardless of what value set was stated in the parent_. This is true regardless of whether the constraint strength itself is redefined. For example, in the following a `preferred` strength node with value set `ac1` is redefined by another `preferred` node using a non-conforming value set `ac0.4`.

====
at-coded ADL2::
+
```cadl
    -- parent archetype
    name matches {
        DV_CODED_TEXT[at9000] matches {
            defining_code matches {preferred [ac1]}
        }
    }

    -- child archetype
    name matches {
        DV_CODED_TEXT[at9000.1] matches {
            defining_code matches {preferred [ac0.4]}
        }
    }
```

id-coded ADL2::
+
```cadl
    -- parent archetype
    name matches {
        DV_CODED_TEXT[id13] matches {
            defining_code matches {preferred [ac1]}
        }
    }

    -- child archetype
    name matches {
        DV_CODED_TEXT[id13.1] matches {
            defining_code matches {preferred [ac0.4]}
        }
    }
```
====

### Tuple Redefinition

Tuple constraints can be redefined by narrowing, as for other primitive constraints. A typical example is as follows.

Parent archetype:

====
at-coded ADL2::
+
```cadl
    DV_QUANTITY[at9000] ∈ {
        property ∈ {[at9001]}
        [magnitude, units] ∈ {
            [{|>=50.0|}, {"mm[Hg]"}],
            [{|>=68.0|}, {"cm[H20]"}]
        }
    }
```

id-coded ADL2::
+
```cadl
    DV_QUANTITY[id42] ∈ {
        property ∈ {[at29]}
        [magnitude, units] ∈ {
            [{|>=50.0|}, {"mm[Hg]"}],
            [{|>=68.0|}, {"cm[H20]"}]
        }
    }
```
====

Child archetype:

====
at-coded ADL2::
+
```cadl
    DV_QUANTITY[at9000] ∈ {
        property ∈ {[at9001]}
        [magnitude, units] ∈ {
            [{|>=50.0|}, {"mm[Hg]"}]
        }
    }
```

id-coded ADL2::
+
```cadl
    DV_QUANTITY[id42] ∈ {
        property ∈ {[at29]}
        [magnitude, units] ∈ {
            [{|>=50.0|}, {"mm[Hg]"}]
        }
    }
```
====


## Rules

The `rules` section in an archetype consists of definitions and assertion statements. Assertions in archetypes have the effect of further reducing the instance space that conforms to an archetype by specifying relationships between values that must hold. For example the main part of an archetype may specify that the existence of a subtree, containing data points related to 'tobacco use' for example, is dependent on the value of another data point representing 'smoker?' being True.

In specialised archetypes, further invariants can be added, but existing ones cannot be changed. New invariants cannot logically contradict existing invariants and are considered to be logically related to invariants from the flat parent by the logical semi-strict operator 'and then'.


## Languages

A specialised archetype or template is only required to have one language in common with its flat precursor, enabling a flat output containing this language. This supports the common situation in which an international standard archetype with numerous translations is used as a basis for further specialisation in a particular country or project. Clearly, the latter has no need of, and quite probably no capability for including all the original translations in the specialisation.

However, if the specialised archetype language is not present at all in the parent flat, it will need to be added to the archetypes in the specialisation lineage first.

The languages present in the flat output will therefore be those languages available in both the flat parent (implying all previous archetypes / templates in the specialisation lineage) and the new specialisation. Any new languages introduced in the latter not available in the flat parent will be discarded.

Locale-specific overrides can be introduced for any linguistic element in an archetype, including the terminology. Such an override has a language code conforming to a subset of the {rfc5646}[IETF RFC 5646 language tag standard^], namely the common 2-part language-region tag exemplified by 'en-GB' (British English), 'pt-BR' (Brazilian Portuguese), and so on. The tags are case-insensitive, but tools that create tags should follow the recommendation from the standard, which is that:

* language tag is lowercase;
* region tags are uppercase.


## Description Section

The `description` section of a specialised archetype or template always replaces that of the parent in the flattened result. The obvious alternative would be automatic inclusion of the corresponding `description` section elements from  precursor archetypes back up the specialisation lineage. The replacement approach is justified by the thinking that the documentary view of a specialised archetype, and particular a template, in their flattened form is likely to be most useful if it consists of the descriptions created by the developers of those specialised artefacts, rather than an accumulation of copies of the documentation elements down the lineage, since tools or special visualisations could provide views of each part of the description back up the specialisation hierarchy if required.

*TBD*: A third alternative, used in some programming languages the enable comments to be inherited might be to optionally include the test of a descriptive element of a parent archetype within the corresponding element of the child, for example by including a special string like `<<precursor>>` somewhere in the text. The flattener would search for this, and if found, include the text from the parent. To have the effect of inclusion of all parent text elements, something like `<<all_precursors>>` could be used.


## Terminology Section

Specialisation in the `terminology` section manifests in terms of specialised and added terms in the `term_definitions` sub-section.

Value sets can be specialised, which has the effect in the flattened form of replacing the original rather than adding to it, as shown in the following example.

Parent archetype:

====
at-coded ADL2::
+
```adl
archetype (adl_version=2.4.0; generated)
    openEHR-EHR-EVALUATION.code_list_parent.v1.0.0

language
    original_language = <[ISO_639-1::en]>

description
    ...

definition
    EVALUATION[at0000] matches {   -- General statement of exclusions or states
        data matches {
            ITEM_TREE[at0001] matches {
                items cardinality matches {1..*; unordered} matches {
                    ELEMENT[at0002] occurrences matches {1..*} matches {   -- Statement
                        value matches {
                            DV_CODED_TEXT[at9000] matches {
                                defining_code matches {[ac1]}       -- Statement
                            }
                        }
                    }
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["at0000"] = <
                text = <"General statement of exclusions or states">
                description = <"A category of ... have been excluded">
            >
            ["at0002"] = <
                text = <"Statement">
                description = <"The statement about what is excluded">
            >
            ["at0003"] = <
                text = <"No significant illness">
                description = <"The person ... condition">
            >
            ["at0004"] = <
                text = <"No significant past history">
                description = <"The person has no ... history">
            >
            ...
            ["at0012"] = <
                text = <"No relevant family history">
                description = <"No family history ... situation">
            >
            ["at0013"] = <
                text = <"No known allergies">
                description = <"No allergies known to any ... or substances">
            >
            ["ac1"] = <
                text = <"Statement">
                description = <"The statement about what is excluded">
            >
        >
    >
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at0003", "at0004", "at0005", "at0006", "at0009", "at0012", "at0013", "at0010", "at0011", "at0007", "at0008">
        >
    >
```

id-coded ADL2::
+
```adl
archetype (adl_version=2.4.0; generated)
    openEHR-EHR-EVALUATION.code_list_parent.v1.0.0

language
    original_language = <[ISO_639-1::en]>

description
    ...

definition
    EVALUATION[id1] matches {   -- General statement of exclusions or states
        data matches {
            ITEM_TREE[id2] matches {
                items cardinality matches {1..*; unordered} matches {
                    ELEMENT[id3] occurrences matches {1..*} matches {   -- Statement
                        value matches {
                            DV_CODED_TEXT[id4] matches {
                                defining_code matches {[ac1]}       -- Statement
                            }
                        }
                    }
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"General statement of exclusions or states">
                description = <"A category of ... have been excluded">
            >
            ["id3"] = <
                text = <"Statement">
                description = <"The statement about what is excluded">
            >
            ["at4"] = <
                text = <"No significant illness">
                description = <"The person ... condition">
            >
            ["at5"] = <
                text = <"No significant past history">
                description = <"The person has no ... history">
            >
            ...
            ["at13"] = <
                text = <"No relevant family history">
                description = <"No family history ... situation">
            >
            ["at14"] = <
                text = <"No known allergies">
                description = <"No allergies known to any ... or substances">
            >
            ["ac1"] = <
                text = <"Statement">
                description = <"The statement about what is excluded">
            >
        >
    >
    value_sets = <
        ["ac1"] = <
            id = <"ac1">
            members = <"at4", "at5", "at6", "at7", "at10", "at13", "at14", "at11", "at12", "at8", "at9">
        >
    >
```
====

Flattened child archetype:

====
at-coded ADL2::
+
```adl
archetype (adl_version=2.4.0; generated)
    openEHR-EHR-EVALUATION.code_list_constrained.v1.0.0

    -- ...

terminology
    term_definitions = <
        ["en"] = <
            ["at0000"] = <
                text = <"General statement of exclusions or states">
                description = <"A category of ...have been excluded">
            >
            ["at0002"] = <
                text = <"Statement">
                description = <"The statement about what is excluded">
            >
            ...
            ["at0012"] = <
                text = <"No relevant family history">
                description = <"No family history relevant .. situation">
            >
            ["ac1"] = <
                text = <"Statement">
                description = <"The statement about what is excluded">
            >
            ["ac1.1"] = <
                text = <"(added by post-parse processor)">
                description = <"(added by post-parse processor)">
            >
            ["id0000.1"] = <
                text = <"Adverse reaction exclusions">
                description = <"A category of ... of adverse reaction">
            >
        >
    >
    value_sets = <
        ["ac1.1"] = <
            id = <"ac1.1">
            members = <"at0005", "at0006", "at0009", "at0012">
        >
    >
```

id-coded ADL2::
+
```adl
archetype (adl_version=2.4.0; generated)
    openEHR-EHR-EVALUATION.code_list_constrained.v1.0.0

    -- ...

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"General statement of exclusions or states">
                description = <"A category of ...have been excluded">
            >
            ["id3"] = <
                text = <"Statement">
                description = <"The statement about what is excluded">
            >
            ...
            ["at13"] = <
                text = <"No relevant family history">
                description = <"No family history relevant .. situation">
            >
            ["ac1"] = <
                text = <"Statement">
                description = <"The statement about what is excluded">
            >
            ["ac1.1"] = <
                text = <"(added by post-parse processor)">
                description = <"(added by post-parse processor)">
            >
            ["id1.1"] = <
                text = <"Adverse reaction exclusions">
                description = <"A category of ... of adverse reaction">
            >
        >
    >
    value_sets = <
        ["ac1.1"] = <
            id = <"ac1.1">
            members = <"at6", "at7", "at10", "at13">
        >
    >
```
====

The flattened result always includes the sum of term definitions from the parent.


## Bindings

Bindings in a specialised archetype can include a binding to an at-code or ac-code defined in the current archetype or any parent archetype. A binding may be defined that overrides one from the flat parent, in which case the binding target - a term (at-code binding) or value set (ac-code binding) should be a proper specialised concept or subset respectively of the binding they replace. Since the binding target is an external code or subset, authoring tools need a connection to an appropriate terminology service to validate the relationship.


# Templates

## Overview

In ADL2, a template is a kind of specialised archetype that uses one feature of ADL in particular to express composition of archetypes: the ability to state 'slot fillers'. This is achieved by redefinition of a slot node, where the latter alters the slot by specifying one or more filler archetypes that match the slot specification.

It is worth emphasising this point, since 'slot-filling' is usually thought of as a compositional relationship (joining archetypes), rather than a specialisation relationship. However, ADL considers a filled or partly filled slot as a kind of slot, i.e. a specialisation of an initially empty slot. The consequence of this is that no special relationship or operation is required to achieve slot-filling in ADL - normal node redefinition is sufficient.

All of the other constraints used in templates typically occur in normal archetypes, with one exception: multiplicity reduction to `{0}` of existences, cardinalities and occurrences. This particular constraint can be used in archetypes, but is generally only useful in templates, since one of the main functions of a template is to select specific data items from archetypes composed in a structure.

ADL provides one other special feature specific to templates: the ability to define 'overlays'. An overlay is just a specialised archetype that is local to the template, rather than being a self-standing archetype. It is used to enable a template to fill a slot not only with an available normal archetype, but with a locally constrained version of an archetype. This feature enables a template to express constraints on a filler archetype without need to create new independent archetype.

## Example

By way of illustrating ADL's template-related ADL features, an example is useful. The following is the openEHR archetype `openEHR-EHR-COMPOSITION.discharge.v1` for the generic concept 'discharge summary' followed by a template representing a full patient clinical information discharge summary, consisting of `COMPOSITION`, `SECTION` and various `ENTRY` archetypes.

====
at-coded ADL2::
+
```adl
archetype (adl_version=2.4.0; rm_release=1.0.3)
    openEHR-EHR-COMPOSITION.discharge.v1.0.0

language
    original_language = <[ISO_639-1::en]>

description
    lifecycle_state = <"unmanaged">
    original_author = <
        ["name"] = <"Heather Leslie">
        ["organisation"] = <"Ocean Informatics">
        ["email"] = <"heather.leslie@oceaninformatics.com">
        ["date"] = <"14/11/2007">
    >
    details = <
        ["en"] = <
            language = <[ISO_639-1::en]>
            purpose = <"For communication at the time of discharge from an episode of care or an institution.">
        >
    >

definition
    COMPOSITION[at0000] matches {    -- Discharge
        category matches {
            DV_CODED_TEXT[at9000] matches {
                defining_code matches {[at0009]}
            }
        }
        content matches {
            allow_archetype CONTENT_ITEM[at0001] matches {
                include
                    archetype_id/value ∈ {/openEHR-EHR-(SECTION|EVALUATION)/}
            }
        }
        context matches {
            EVENT_CONTEXT[at0029] matches {
                other_context matches {
                    ...
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["at0000"] = <
                text = <"Discharge">
                description = <"A summarising communication about at the time of discharge from an institution or an episode of care">
            >
            ["at0001"] = <
                text = <"Cinical discharge notes">
                description = <"*">
            >
        >
    >
```

id-coded ADL2::
+
```adl
archetype (adl_version=2.4.0; rm_release=1.0.2)
    openEHR-EHR-COMPOSITION.discharge.v1.0.0

language
    original_language = <[ISO_639-1::en]>

description
    lifecycle_state = <"unmanaged">
    original_author = <
        ["name"] = <"Heather Leslie">
        ["organisation"] = <"Ocean Informatics">
        ["email"] = <"heather.leslie@oceaninformatics.com">
        ["date"] = <"14/11/2007">
    >
    details = <
        ["en"] = <
            language = <[ISO_639-1::en]>
            purpose = <"For communication at the time of discharge from an episode of care or an institution.">
        >
    >

definition
    COMPOSITION[id1] matches {    -- Discharge
        category matches {
            DV_CODED_TEXT[id29] matches {
                defining_code matches {[at10]}
            }
        }
        content matches {
            allow_archetype CONTENT_ITEM[id2] matches {
                include
                    archetype_id/value ∈ {/openEHR-EHR-(SECTION|EVALUATION)/}
            }
        }
        context matches {
            EVENT_CONTEXT[id30] matches {
                other_context matches {
                    ...
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <
                text = <"Discharge">
                description = <"A summarising communication about at the time of discharge from an institution or an episode of care">
            >
            ["id2"] = <
                text = <"Cinical discharge notes">
                description = <"*">
            >
        >
    >
```
====

Below is the template definition. The root artefact is a self-standing template `openEHR-EHR-COMPOSITION.t_clinical_info_ds_sf.v1.0.0` that specialises the archetype . The declaration of being a 'template' is primarily to signal to tools the intended use of the artefact - it doesn't have any formal implications. The job of the template is to define the specific clinical information required in a discharge summary (note that not all the usual items are included, in order to reduce the size of the template as shown here - clinical synopsis and medications list are left out).

In the root template, the `definition` section contains a number of `use_archetype` statements that specify archetypes to be used as fillers for the `at0001` (`id2`) slot of the parent archetype. Each of the slot-fillers is a template overlay, rather than being an independent archetype or template. As a result, each overlay includes no descriptive meta-data of its own, and appears within the template artefact, separated by a long comment line. This simple mechanism enables the overlays, which are in all other respects formal archetypes, to be treated as local additions to the template, not visible externally. The template, if saved as a file, contains all its overlays in one file.

Each of the filler archetypes can have its occurrences individually constrained in the normal way.

Each overlay can be seen to be a specialisation of an archetype (it could also have been a template). The overlays also do not include any `languages` or `description` sections, since as parts of the parent template, they inherit these sections from the root template.

Additionally, some overlays contain element removal constraints (`occurrences matches {0}`), used to reduce the data set to the intended final result for the purpose of this template. Clearly other templates could make quite different selections of data items from the same archetypes.

====
at-coded ADL2::
+
```adl
template (adl_version=2.4.0; rm_release=1.0.3)
    openEHR-EHR-COMPOSITION.t_clinical_info_ds_sf.v1.0.0

specialize
    openEHR-EHR-COMPOSITION.discharge.v1

language
    original_language = <[ISO_639-1::en]>

description
    lifecycle_state = <"unmanaged">
    original_author = <
        ["name"] = <"Ian McNicoll">
        ["organisation"] = <"openEHR Foundation">
        ["email"] = <"ian.mcnicoll@openehr.org">
        ["date"] = <"01/04/2011">
    >
    copyright = <"copyright (c) 2011 openEHR Foundation">
    details = <
        ["en"] = <
            language = <[ISO_639-1::en]>
            purpose = <"Templated clinical COMPOSITION for Simple discharge summary">
        >
    >

definition
    COMPOSITION[at0000.1] ∈ {    -- Clinical detail
        context existence ∈ {0}
        content ∈ {
            use_archetype SECTION[at0000.1, openEHR-EHR-SECTION.t_patient_event_info_ds_sf.v1] occurrences ∈ {1}
            use_archetype EVALUATION[at0000.2, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-1.v1] occurrences ∈ {0..1}
            use_archetype EVALUATION[at0000.3, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-2.v1]
            use_archetype EVALUATION[at0000.5, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-4.v1] occurrences ∈ {1..*}
            use_archetype EVALUATION[at0000.6, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-5.v1] occurrences ∈ {0..1}
            use_archetype EVALUATION[at0000.8, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-7.v1] occurrences ∈ {0..*}
            use_archetype EVALUATION[at0000.9, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-8.v1]
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["at0000.1"] = <
                text = <"Clinical detail">
                description = <"Clinical detail of Simple discharge summary">
            >
            ["at0.1"] = <
                text = <"Event data">
                description = <"Event data">
            >
            ["at0.2"] = <
                text = <"Allergies & adverse reactions">
                description = <"Allergies & adverse reactions">
            >
            ["at0.3"] = <
                text = <"Alerts">
                description = <"Alerts">
            >
            ["at0.5"] = <
                text = <"Diagnosis">
                description = <"Diagnosis">
            >
            ["at0.6"] = <
                text = <"Investigations">
                description = <"Investigations">
            >
            ["at0.8"] = <
                text = <"Procedures">
                description = <"Procedures">
            >
            ["at0.9"] = <
                text = <"Medical certificate">
                description = <"Medical certificate">
            >
        >
    >
```
template_overlay
    openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-1.v1.0.0

specialize
    openEHR-EHR-EVALUATION.adverse.v1

definition
    EVALUATION[at0000.1] ∈ {    -- Adverse reaction details for episode of care
        /data[at0002]/items ∈ {
            ELEMENT[at0010] occurrences ∈ {0}
        }
        /data[at0002]/items[at0019]/items ∈ {
            ELEMENT[at0032] occurrences ∈ {0}
            ELEMENT[at0015] occurrences ∈ {0}
            ELEMENT[at0004] occurrences ∈ {0}
            ELEMENT[at0020] occurrences ∈ {0}
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["at0000.1"] = <
                text = <"Adverse reaction details for episode of care">
                description = <"Adverse reaction details for episode of care">
            >
        >
    >
-------------- etc ------------------------------------------

```
template_overlay
    openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-8.v1.0.0

specialize
    openEHR-EHR-EVALUATION.medical_certificate.v1


definition
    EVALUATION[at0000.1] ∈ {    -- Simple Discharge Summary Medical Certificate
        /data[at0001]/items ∈ {
            ELEMENT[at0002] occurrences ∈ {0}
            ELEMENT[at0003] occurrences ∈ {0}
            ELEMENT[at0004] occurrences ∈ {0}
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["at0000.1"] = <
                text = <"Simple Discharge Summary Medical Certificate">
                description = <"Only used for Discharge Summary Document">
            >
        >
    >
```

id-coded ADL2::
+
```adl
template (adl_version=2.4.0; rm_release=1.0.2)
    openEHR-EHR-COMPOSITION.t_clinical_info_ds_sf.v1.0.0

specialize
    openEHR-EHR-COMPOSITION.discharge.v1

language
    original_language = <[ISO_639-1::en]>

description
    lifecycle_state = <"unmanaged">
    original_author = <
        ["name"] = <"Ian McNicoll">
        ["organisation"] = <"openEHR Foundation">
        ["email"] = <"ian.mcnicoll@openehr.org">
        ["date"] = <"01/04/2011">
    >
    copyright = <"copyright (c) 2011 openEHR Foundation">
    details = <
        ["en"] = <
            language = <[ISO_639-1::en]>
            purpose = <"Templated clinical COMPOSITION for Simple discharge summary">
        >
    >

definition
    COMPOSITION[id1.1] ∈ {    -- Clinical detail
        context existence ∈ {0}
        content ∈ {
            use_archetype SECTION[id0.1, openEHR-EHR-SECTION.t_patient_event_info_ds_sf.v1] occurrences ∈ {1}
            use_archetype EVALUATION[id0.2, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-1.v1] occurrences ∈ {0..1}
            use_archetype EVALUATION[id0.3, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-2.v1]
            use_archetype EVALUATION[id0.5, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-4.v1] occurrences ∈ {1..*}
            use_archetype EVALUATION[id0.6, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-5.v1] occurrences ∈ {0..1}
            use_archetype EVALUATION[id0.8, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-7.v1] occurrences ∈ {0..*}
            use_archetype EVALUATION[id0.9, openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-8.v1]
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1.1"] = <
                text = <"Clinical detail">
                description = <"Clinical detail of Simple discharge summary">
            >
            ["id0.1"] = <
                text = <"Event data">
                description = <"Event data">
            >
            ["id0.2"] = <
                text = <"Allergies & adverse reactions">
                description = <"Allergies & adverse reactions">
            >
            ["id0.3"] = <
                text = <"Alerts">
                description = <"Alerts">
            >
            ["id0.5"] = <
                text = <"Diagnosis">
                description = <"Diagnosis">
            >
            ["id0.6"] = <
                text = <"Investigations">
                description = <"Investigations">
            >
            ["id0.8"] = <
                text = <"Procedures">
                description = <"Procedures">
            >
            ["id0.9"] = <
                text = <"Medical certificate">
                description = <"Medical certificate">
            >
        >
    >
```
template_overlay
    openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-1.v1.0.0

specialize
    openEHR-EHR-EVALUATION.adverse.v1

definition
    EVALUATION[id1.1] ∈ {    -- Adverse reaction details for episode of care
        /data[id3]/items ∈ {
            ELEMENT[id11] occurrences ∈ {0}
        }
        /data[id3]/items[id20]/items ∈ {
            ELEMENT[id33] occurrences ∈ {0}
            ELEMENT[id16] occurrences ∈ {0}
            ELEMENT[id5] occurrences ∈ {0}
            ELEMENT[id21] occurrences ∈ {0}
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1.1"] = <
                text = <"Adverse reaction details for episode of care">
                description = <"Adverse reaction details for episode of care">
            >
        >
    >
-------------- etc ------------------------------------------

```
template_overlay
    openEHR-EHR-EVALUATION.t_clinical_info_ds_sf-8.v1.0.0

specialize
    openEHR-EHR-EVALUATION.medical_certificate.v1


definition
    EVALUATION[id1.1] ∈ {    -- Simple Discharge Summary Medical Certificate
        /data[id2]/items ∈ {
            ELEMENT[id3] occurrences ∈ {0}
            ELEMENT[id4] occurrences ∈ {0}
            ELEMENT[id5] occurrences ∈ {0}
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1.1"] = <
                text = <"Simple Discharge Summary Medical Certificate">
                description = <"Only used for Discharge Summary Document">
            >
        >
    >
```
====

When the above is flattened, with all overlays, slot fillers and external references being inlined, a single operational template results, as shown below. Note the `component_terminologies` section at the end, which contains the terminology of every constituent overlay and archetype.

====
at-coded ADL2::
+
```adl
operational_template (adl_version=2.4.0; rm_release=1.0.3; generated)
	openEHR-EHR-COMPOSITION.t_clinical_info_ds_sf.v1.0.0

specialize
	openEHR-EHR-COMPOSITION.discharge.v1

language
	original_language = <[ISO_639-1::en]>

description
	lifecycle_state = <"unmanaged">
	original_author = <
		["name"] = <"Ian McNicoll">
		["organisation"] = <"Ocean Informatics">
		["email"] = <"ian.mcnicoll@oceaninformatics.com">
		["date"] = <"01/04/2011">
	>
	copyright = <"copyright (c) 2011 openEHR Foundation">
	details = <
		["en"] = <
			language = <[ISO_639-1::en]>
			purpose = <"Templated clinical COMPOSITION for Simple discharge summary">
		>
	>

definition
	COMPOSITION[at0000.1] matches {	-- Clinical detail
		category matches {
			DV_CODED_TEXT[at0028] matches {
				defining_code matches {[at0009]}
			}
		}
		context existence matches {0}
		content matches {
			SECTION[at0.1, openEHR-EHR-SECTION.t_patient_event_info_ds_sf.v1.0.0] occurrences matches {1} matches {	-- Event start
				items matches {
					ADMIN_ENTRY[at0.1, openEHR-EHR-ADMIN_ENTRY.t_patient_event_info_ds_sf-1.v1.0.0] occurrences matches {1} matches {
						other_participations existence matches {0}
                    }
                    --- etc ---
                }
            }
            --- etc ---
        }
    }

terminology
	term_definitions = <
		["en"] = <
			["at0000"] = <
				text = <"Discharge">
				description = <"A summarising communication about at the time of discharge from an institution or an episode of care">
			>
			["at0003"] = <
				text = <"Report identifier">
				description = <"Identification information about the report">
			>
            ------- etc ---------
        >
    >
	term_bindings = <
		["openehr"] = <
			["at0009"] = <http://openehr.org/id/433>
		>
	>
	value_sets = <
		["ac1"] = <
			id = <"ac1">
			members = <"at0005", "at0006", "at0007", "at0008">
		>
	>

component_terminologies
	["openEHR-EHR-SECTION.t_patient_event_info_ds_sf.v1.0.0"] = <
		term_definitions = <
			["en"] = <
				["at0000"] = <
					text = <"Adhoc heading">
					description = <"A generic section header.">
				>
                ------- etc ---------
			>
		>
	>
	["openEHR-EHR-ADMIN_ENTRY.t_patient_event_info_ds_sf-1.v1.0.0"] = <
		term_definitions = <
			["en"] = <
				["at0000"] = <
					text = <"Admission Short Singapore">
					description = <"Administrative information for the admission of a patient to the care of a hospital/institution">
				>
                ------- etc ---------
			>
		>
	>

```

id-coded ADL2::
+
```adl
operational_template (adl_version=2.4.0; rm_release=1.0.2; generated)
	openEHR-EHR-COMPOSITION.t_clinical_info_ds_sf.v1.0.0

specialize
	openEHR-EHR-COMPOSITION.discharge.v1

language
	original_language = <[ISO_639-1::en]>

description
	lifecycle_state = <"unmanaged">
	original_author = <
		["name"] = <"Ian McNicoll">
		["organisation"] = <"Ocean Informatics">
		["email"] = <"ian.mcnicoll@oceaninformatics.com">
		["date"] = <"01/04/2011">
	>
	copyright = <"copyright (c) 2011 openEHR Foundation">
	details = <
		["en"] = <
			language = <[ISO_639-1::en]>
			purpose = <"Templated clinical COMPOSITION for Simple discharge summary">
		>
	>

definition
	COMPOSITION[id1.1] matches {	-- Clinical detail
		category matches {
			DV_CODED_TEXT[id29] matches {
				defining_code matches {[at10]}
			}
		}
		context existence matches {0}
		content matches {
			SECTION[id0.1, openEHR-EHR-SECTION.t_patient_event_info_ds_sf.v1.0.0] occurrences matches {1} matches {	-- Event start
				items matches {
					ADMIN_ENTRY[id0.1, openEHR-EHR-ADMIN_ENTRY.t_patient_event_info_ds_sf-1.v1.0.0] occurrences matches {1} matches {
						other_participations existence matches {0}
                    }
                    --- etc ---
                }
            }
            --- etc ---
        }
    }

terminology
	term_definitions = <
		["en"] = <
			["id1"] = <
				text = <"Discharge">
				description = <"A summarising communication about at the time of discharge from an institution or an episode of care">
			>
			["id4"] = <
				text = <"Report identifier">
				description = <"Identification information about the report">
			>
            ------- etc ---------
        >
    >
	term_bindings = <
		["openehr"] = <
			["at10"] = <http://openehr.org/id/433>
		>
	>
	value_sets = <
		["ac1"] = <
			id = <"ac1">
			members = <"at6", "at7", "at8", "at9">
		>
	>

component_terminologies
	["openEHR-EHR-SECTION.t_patient_event_info_ds_sf.v1.0.0"] = <
		term_definitions = <
			["en"] = <
				["id1"] = <
					text = <"Adhoc heading">
					description = <"A generic section header.">
				>
                ------- etc ---------
			>
		>
	>
	["openEHR-EHR-ADMIN_ENTRY.t_patient_event_info_ds_sf-1.v1.0.0"] = <
		term_definitions = <
			["en"] = <
				["id1"] = <
					text = <"Admission Short Singapore">
					description = <"Administrative information for the admission of a patient to the care of a hospital/institution">
				>
                ------- etc ---------
			>
		>
	>
```
====

# Relationship of ADL to Other Formalisms

## Overview

Whenever a new formalism is defined, it is reasonable to ask the question: are there not existing formalisms which would do the same job? Research to date has shown that in fact, no other formalism has been designed for the same use, and none easily express ADL's semantics. During ADL's initial development, it was felt that there was great value in analysing the problem space very carefully, and constructing an abstract syntax exactly matched to the solution, rather than attempting to use some other formalism - undoubtedly designed for a different purpose - to try and express the semantics of archetypes, or worse, to start with an XML-based exchange format, which often leads to the conflation of abstract and concrete representational semantics. Instead, the approach used has paid off, in that the resulting syntax is very simple and powerful, and in fact has allowed mappings to other formalisms to be more correctly defined and understood. The following sections compare ADL to other formalisms and show how it is different.

## Constraint Syntaxes

### OMG OCL (Object Constraint Language)

The OMG's Object Constraint Language (OCL) appears at first glance to be an obvious contender for writing archetypes. However, its designed use is to write constraints on object models, rather than on data, which is what archetypes are about. As a concrete example, OCL can be used to make statements about the actors attribute of a class Company - e.g. that actors must exist and contain the Actor who is the lead of Company. However, if used in the normal way to write constraints on a class model, it cannot describe the notion that for a particular kind of (acting) company, such as 'itinerant jugglers', there must be at least four actors, each of whom have among their capabilities 'advanced juggling', plus an Actor who has skill 'musician'. This is because doing so would constrain all instances of the class Company to conform to the specific configuration of instances corresponding to actors and jugglers, when what is intended is to allow a myriad of possibilities. ADL provides the ability to create numerous archetypes, each describing in detail a concrete configuration of instances of type Company.  OCL's constraint types include function pre- and post-conditions, and class invariants. There is no structural character to the syntax - all statements are essentially first-order predicate logic statements about elements in models expressed in UML, and are related to parts of a model by 'context' statements.  This makes it impossible to use OCL to express an archetype in a structural way which is natural to domain experts. OCL also has some flaws, described by citenp:[Beale2003].  However, OCL is in fact relevant to ADL. ADL archetypes include invariants (and one day, might include pre- and post-conditions). Currently these are expressed in a syntax very similar to OCL, with minor differences. The exact definition of the ADL invariant syntax in the future will depend somewhat on the progress of OCL through the OMG standards process.

## Ontology Formalisms

### OWL (Web Ontology Language)

The {w3c_owl}[W3C Web Ontology Language (OWL)^] is a W3C initiative for defining Web-enabled ontologies which aim to allow the building of the "Semantic Web". OWL has an abstract syntax, developed at the University of Manchester, UK, and an exchange syntax, which is an extension of the XML-based syntax known as RDF (Resource Description Framework). We discuss OWL only in terms of its abstract syntax, since this is a semantic representation of the language unencumbered by XML or RDF details (there are tools which convert between abstract OWL and various exchange syntaxes).

OWL is a general purpose description logic (DL), and is primarily used to describe 'classes' of things in such a way as to support subsumptive inferencing within the ontology, and by extension, on data which are instances of ontology classes. There is no general assumption that the data itself were built based on any particular class model - they might be audio-visual objects in an archive, technical documentation for an aircraft or the Web pages of a company. OWL's class definitions are therefore usually constraint statements on an _implied_ model on which data _appear_ to be based. However, the semantics of an information model can themselves be represented in OWL. Restrictions are the primary way of defining subclasses.

In intention, OWL is aimed at representing some 'reality' and then making inferences about it; for example in a medical ontology, it can infer that a particular patient is at risk of ischemic heart disease due to smoking and high cholesterol, if the knowledge that 'ischemic heart disease has-risk-factor smoking' and 'ischemic heart disease has-risk-factor high cholesterol' are in the ontology, along with a representation of the patient details themselves. OWL's inferencing works by subsumption, which is to say, asserting either that an 'individual' (OWL's equivalent of an object-oriented instance or a type) conforms to a 'class', or that a particular 'class' 'is-a' (subtype of another) 'class'; this approach can also be understood as category-based reasoning or set-containment.

ADL can also be thought of as being aimed at describing a 'reality', and allowing inferences to be made. However, the reality it describes is in terms of constraints on information structures (based on an underlying information model), and the inferencing is between data and the constraints. Some of the differences between ADL and OWL are as follows.

* ADL syntax is predicated on the existence of existing object-oriented reference models, expressed in UML or some similar formalism, and the constraints in an ADL archetype are in relation to types and attributes from such a model. In contrast, OWL is far more general, and requires the explicit expression of a reference model in OWL, before archetype-like constraints can be expressed.
* Because information structures are in general hierarchical compositions of nodes and elements, and may be quite deep, ADL enables constraints to be expressed in a structural, nested way, mimicking the tree-like nature of the data it constrains. OWL does not provide a native way to do this, and although it is possible to express approximately the same constraints in OWL, it is fairly inconvenient, and would probably only be made easy by machine conversion from a visual format more or less like ADL.
* As a natural consequence of dealing with heavily nested structures in a natural way, ADL also provides a path syntax, based on {w3c_xpath}[W3C Xpath^], enabling any node in an archetype to be referenced by a path or path pattern. OWL does not provide an inbuilt path mechanism; Xpath can presumably be used with the RDF representation, although it is not yet clear how meaningful the paths would be with respect to the named categories within an OWL ontology.
* ADL also natively takes care of disengaging natural language and terminology issues from constraint statements by having a separate ontology per archetype, which contains 'bindings' and language-specific translations. OWL has no inbuilt syntax for this, requiring such semantics to be represented from first principles.
* ADL provides a rich set of constraints on primitive types, including dates and times. OWL 1.0 (c 2005) did not provide any equivalents; OWL 1.1 (c 2007) look as though it provides some.

Research to date shows that the semantics of an archetype are likely to be representable inside OWL, assuming expected changes to improve its primitive constraint types occur. To do so would require the following steps:

* express the relevant reference models in OWL (this has been shown to be possible);
* express the relevant terminologies in OWL (research on this is ongoing);
* be able to represent concepts (i.e. constraints) independently of natural language (status unknown);
* convert the cADL part of an archetype to OWL; assuming the problem of primitive type constraints is solved, research to date shows that this should in principle be possible.

To use the archetype on data, the data themselves would have to be converted to OWL, i.e. be expressed as 'individuals'. In conclusion, we can say that mathematical equivalence between OWL and ADL is probably provable. However, it is clear that OWL is far from a convenient formalism to express archetypes, or to use them for modelling or reasoning against data. The ADL approach makes use of existing UML semantics and existing terminologies, and adds a convenient syntax for expressing the required constraints. It also appears fairly clear that even if all of the above conversions were achieved, using OWL-expressed archetypes to validate data (which would require massive amounts of data to be converted to OWL statements) is unlikely to be anywhere near as efficient as doing it with archetypes expressed in ADL or one of its concrete expressions.

Nevertheless, OWL provides a very powerful generic reasoning framework, and offers a great deal of inferencing power of far wider scope than the specific kind of 'reasoning' provided by archetypes. It appears that it could be useful for the following archetype-related purposes:

* providing access to ontological resources while authoring archetypes, including terminologies, pure domain-specific ontologies, etc;
* providing a semantic 'indexing' mechanism allowing archetype authors to find archetypes relating to specific subjects (which might not be mentioned literally within the archetypes);
* providing inferencing on archetypes in order to determine if a given archetype is subsumed within another archetype which it does not specialise (in the ADL sense);
* providing access to archetypes from within a semantic Web environment, such as an ebXML server or similar.

### KIF (Knowledge Interchange Format)

The Knowledge Interchange Format (KIF) is a knowledge representation language whose goal is to be able to describe formal semantics which would be sharable among software entities, such as information systems in an airline and a travel agency. An example of KIF (taken from cite:[Genesereth_Fikes_Gruber1992]) used to describe the simple concept of 'units' in a class is as follows:

```lisp
(defrelation BASIC-UNIT
    (=> (BASIC-UNIT ?u) ; basic units are distinguished units of measure
        (unit-of-measure ?u)))

(deffunction UNIT*
        ; Unit* maps all pairs of units to units
    (=> (and (unit-of-measure ?u1) (unit-of-measure ?u2))
        (and (defined (UNIT* ?u1 ?u2)) (unit-of-measure (UNIT* ?u1 ?u2))))
            
        ; It is commutative
    (= (UNIT* ?u1 ?u2) (UNIT* ?u2 ?u1))
    
        ; It is associative
    (= (UNIT* ?u1 (UNIT* ?u2 ?u3))
        (UNIT* (UNIT* ?u1 ?u2) ?u3))
)

(deffunction UNIT^
        ; Unit^ maps all units and reals to units
    (=> (and (unit-of-measure ?u)
        (real-number ?r))
        (and (defined (UNIT^ ?u ?r)) (unit-of-measure (UNIT^ ?u ?r))))
        
        ; It has the algebraic properties of exponentiation
    (= (UNIT^ ?u 1) ?u)
    (= (unit* (UNIT^ ?u ?r1) (UNIT^ ?u ?r2)) (UNIT^ ?u (+ ?r1 ?r2)))
    (= (UNIT^ (unit* ?u1 ?u2) ?r)
    (unit* (UNIT^ ?u1 ?r) (UNIT^ ?u2 ?r)))
)
```

It should be clear from the above that KIF is a definitional language - it defines all the concepts it mentions. However, the most common situation in which we find ourselves is that information models already exist, and may even have been deployed as software. Thus, to use KIF for expressing archetypes, the existing information model and relevant terminologies would have to be converted to KIF statements, before archetypes themselves could be expressed. This is essentially the same process as for expressing archetypes in OWL.

It should also be realised that KIF is intended as a knowledge exchange format, rather than a knowledge representation format, which is to say that it can (in theory) represent the semantics of any other knowledge representation language, such as OWL. This distinction today seems fine, since Web-enabled languages like OWL probably don't need an exchange format other than their XML equivalents to be shared. The relationship and relative strengths and deficiencies is explored by e.g. citenp:[Martin2003].

## XML-based Formalisms

### XML-schema
Previously, archetypes have been expressed as XML instance documents conforming to W3C XML schemas, for example in the Good Electronic Health Record project (see citenp:[GeHR_AUS]). The schemas used in those projects correspond technically to the XML expressions of information model-dependent object models shown in The Archetypes: Technical Overview specification. XML archetypes are accordingly equivalent to serialised instances of the parse tree, i.e. particular ADL archetypes serialised from objects into XML instance.

# Syntax Specification

The normative specification of the ADL2 syntax is expressed in Antlr4 as a series of component grammars, shown below. This has been tested with the Antlr 4.9 implementation available from http://www.antlr.org[Antlr.org^]. The source files are available on GitHub - {openehr_adl_antlr}/tree/master/src/main/antlr/adl[adl-antlr repository^]. The ODIN grammar used in parts of an ADL archetype is not shown below, it can be found in the {openehr_odin}[openEHR ODIN specification^].

## ADL Outer Syntax

The following grammar expresses the outer syntax of ADL, i.e. the top-level structure of section keywords and initial identification lines in an ADL text.

```antlr-java
```

## cADL Syntax

The following grammar expresses the syntax of cADL composite types, i.e. the language of the `definition` section of an archetype.

```antlr-java
```

## cADL Primitives Syntax

The following grammar defines the syntax of cADL primitives, which are used by cADL composites and also by ADL rules.

```antlr-java
```

## Rules Syntax

The following expression grammar defines the syntax that may appear in the `rules` section of an archetype and also the assertions in Archetype slots.

```antlr-java
```

## Value types

The following grammar defines the syntax for the terminal types in ADL, which are derived from ODIN.

```antlr-java
```

## Base Lexer

The following grammar defines lexer patterns of generic lexical tokens.

```antlr-java
```


:sectnums!:

:sectnums!:
## References

bibliography::[]




image::https://specifications.openehr.org/images/openEHR_logo_RGB.svg["openEHR logo",align="center"]

# Simplified Formats for openEHR Data




## Acknowledgements

### Primary Author

This specification builds upon the Web Template serialization format that originated as part of the Better Platform EHR Server implementation by *Better d.o.o.* (formerly Marand, Slovenia).
The serialization format was further documented in the *EHRbase* implementation under the name "Simplified Data Template", which provided additional foundation for this specification.

### Contributors

This specification has benefited from formal and informal input from the openEHR and wider health informatics community. The openEHR Foundation would like to recognise the following for their contributions.

* Thomas Beale, Ars Semantica (UK); openEHR Foundation Management Board.
* Christian Chevalley, Architect, EtherCIS, Thailand
* Borut Fabjan, Program Manager, Better, Slovenia
* Bostjan Lah, CTO, Better, Slovenia
* Ian McNicoll MD, FreshEHR, UK
* Bjørn Næss, DIPS, Norway
* Matija Polajnar, Tech Lead, Better, Slovenia
* Birger Haarbrandt, PhD, vitagroup, Germany
* Alex Vidrean, vitagroup, Germany
* Severin Kohler, Berlin Institute of Health (BIH) at Charite, Germany
* Sebastian Iancu, Architect, Code24, Netherlands

A significant part of the design ideas and content of this specification was adapted from:

* the EHRbase official documentation;
* the Marand 'Web Templates' specification, kindly provided by Better d.o.o.;
* the EtherCIS ECISFLAT format by the EtherCIS community;
* the XSD-based Template Data Schema (TDS) format developed by Ocean Health Systems.

### Trademarks

* 'openEHR' is a registered trademark of the openEHR Foundation


# Preface

## Purpose

This document specifies the *Simplified Formats* as a JSON representation for openEHR data instances.
It provides a simplified, developer-friendly alternative to *canonical* openEHR JSON and XML serializations by using human-readable field identifiers rather than archetype paths.

These formats are designed to lower the barrier to entry for working with openEHR data by providing a more accessible way to create and manipulate content (e.g. Compositions) compared to the canonical formats, making it easier for developers who are new to openEHR.

## Status

This specification is in the STABLE state. The development version of this document can be found at {openehr_simplified_formats}[{openehr_simplified_formats}^].

Known omissions or questions are indicated in the text with a 'to be determined' paragraph, as follows:
*TBD*: (example To Be Determined paragraph)

## Feedback

Feedback may be provided on the {openehr_technical_list}/its[openEHR ITS forum^].

Issues may be raised on the https://specifications.openehr.org/components/{component}/open_issues[specifications Problem Report tracker^].

To see changes made due to previously reported issues, see the https://specifications.openehr.org/components/{component}/history[{component} component Change Request tracker^].

## Conformance

When used with openEHR-REST API, the available calls to be conformance tested are the same as for other openEHR serialisation formats (canonical JSON etc), with a different representation format indicated by setting the appropriate `Content-Type` HTTP header.
Conformance of a data or software artefact to an openEHR specification is determined by a formal test of that artefact against the relevant openEHR Implementation Technology Specification(s) (ITSs).

# Overview

## Introduction

The serialization format based on *Web Template (WT)* is a JSON representation of openEHR data instances that uses simplified field identifiers instead of canonical archetype paths.
The format was originally developed by _Better d.o.o._ and later adopted and extended by the _EHRbase_ open-source community.
In this specification we refer to these as *Simplified Formats*.

Although historically different names have been used (e.g. Web Template serialization and the former “Simplified Data Template” term), in the context of this document they represent the same idea.

NOTE: Prior to Release 1.1.0, the openEHR specification used the name "Simplified Data Template (SDT) specification".
This has been superseded by the current "Simplified Formats specification".

The Simplified Formats have two structural variants:

* **Flat** - colloquially known as the "flat format"
* **Structured** - colloquially known as the "structured format"

Key characteristics include:

* __Human-readable field identifiers__: Uses friendly names like `temperature|magnitude` instead of archetype paths like `/content[openEHR-EHR-OBSERVATION.body_temperature.v1]/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value|magnitude`
* __JSON-based__: a form of JSON representation of openEHR data
* __Context data separation__: Clinical data separated from context metadata (usually under a `ctx/` prefix)
* __Template-specific__: Field identifiers are specific to each operational template
* __Element-value simplification__: In Flat format, there is no distinction between an ELEMENT and its value


## Scope

This specification covers:

* The structure and syntax of the *Flat* and *Structured* formats
* Field identifier generation rules
* Context data representation
* RM attributes handling (underscore-prefixed attributes)
* Mapping between the Simplified Formats and canonical openEHR RM
* Serialization and deserialization requirements

This specification does not cover:

* Web Template itself as a resource
* Archetype technology and associated constraints
* Storage or indexing strategies


## MIME Types

Two MIME types are defined for the Simplified Formats serialization:

* __Flat__ format: `application/openehr.wt.flat+json`
* __Structured__ format: `application/openehr.wt.structured+json`


## Relationship to Other Specifications

The format relates to other openEHR specifications as follows:

* __openEHR Reference Model__: serialized instances represent valid RM structures (e.g. COMPOSITION)
* __Operational Templates (OPT)__: field identifiers are generated from OPT definitions
* __AQL__: serialized instances include AQL paths to enable query integration
* __Canonical JSON/XML__: the Simplified Formats are an alternative serialization, convertible to canonical formats


# Design Rationale

## Background

The information models of openEHR are structured in multiple layers, with the primary distinction being between an information model layer (the 'Reference Model' or RM), and domain-level models expressed in archetypes and templates, that latter of which expresses particular data sets. Each such data set is defined in terms of an {openehr_am_opt2}[openEHR Operational Template (OPT)^], derived from a source template, and ultimately particular archetypes, which are themselves constraint models based on the RM, i.e. the 'canonical model'.

The openEHR RM and supporting models (BASE component) are designed with two computational goals in mind:

1. **Self-standing data instances**: Healthcare data instances are fully defined and self-standing when shared with a data partner that does not use openEHR. All necessary context, structure, and semantics are embedded within the data itself.
2. **Regular, predictable software behaviour**: Software that implements the model works in regular, expected ways across all use cases. For example, the structure of the openEHR `OBSERVATION`, `HISTORY`, and `EVENT` classes will generically represent any observation, from a single weight measurement to 100,000 samples of complex vital signs data.

The model is accordingly rigorous and comprehensive, ensuring that:

* All clinical contexts are properly captured
* Data can be queried consistently
* Information models remain stable over time
* Systems can validate data against formal definitions


## Canonical Format

In the context of openEHR serialization, **"canonical"** means any fully expressed instance data in which:

* the containment structure follows that of the RM;
* all RM mandatory fields are present;
* all attributes are named as per the RM, and
* all cardinalities respect the RM.

The default serialised data representations for openEHR content are canonical XML, based on the {openehr_its_xml_releases}[openEHR RM XSDs^], canonical JSON, described by the {openehr_its_json_releases}[openEHR JSON schemas^], and potentially any other canonical serial format based on the underlying Reference Model (e.g. YAML).

The canonical formats are routinely used by all openEHR implementations implementing the {openehr_ehr_rest_api}[openEHR REST API specification^], and in other ways (e.g., for database dump/load implementation, ETL operations, system integration, etc.).

### Canonical JSON Example

The following example shows a simple body temperature observation in canonical openEHR JSON format:

```json
{
  "_type": "COMPOSITION",
  "name": {
    "_type": "DV_TEXT",
    "value": "Blood_Pressure_Demo.v0"
  },
  "archetype_details": {
    "archetype_id": {
      "value": "openEHR-EHR-COMPOSITION.encounter.v1"
    },
    "template_id": {
      "value": "Blood_Pressure_Demo.v0"
    },
    "rm_version": "1.0.4"
  },
  "language": {
    "_type": "CODE_PHRASE",
    "terminology_id": {
      "_type": "TERMINOLOGY_ID",
      "value": "ISO_639-1"
    },
    "code_string": "en"
  },
  "territory": {
    "_type": "CODE_PHRASE",
    "terminology_id": {
      "_type": "TERMINOLOGY_ID",
      "value": "ISO_3166-1"
    },
    "code_string": "DE"
  },
  "category": {
    "_type": "DV_CODED_TEXT",
    "value": "event",
    "defining_code": {
      "_type": "CODE_PHRASE",
      "terminology_id": {
        "_type": "TERMINOLOGY_ID",
        "value": "openehr"
      },
      "code_string": "433"
    }
  },
  "composer": {
    "_type": "PARTY_IDENTIFIED",
    "name": "Max Mustermann"
  },
  "context": {
    "_type": "EVENT_CONTEXT",
    "start_time": {
      "_type": "DV_DATE_TIME",
      "value": "2022-02-03T04:05:06"
    },
    "end_time": {
      "_type": "DV_DATE_TIME",
      "value": "2022-02-03T04:25:41"
    },
    "setting": {
      "_type": "DV_CODED_TEXT",
      "value": "home",
      "defining_code": {
        "_type": "CODE_PHRASE",
        "terminology_id": {
          "_type": "TERMINOLOGY_ID",
          "value": "openehr"
        },
        "code_string": "225"
      }
    }
  },
  "content": [ {
    "_type": "OBSERVATION",
    "name": {
      "_type": "DV_TEXT",
      "value": "Blood pressure"
    },
    "archetype_details": {
      "archetype_id": {
        "value": "openEHR-EHR-OBSERVATION.blood_pressure.v2"
      },
      "rm_version": "1.0.4"
    },
    "language": {
      "_type": "CODE_PHRASE",
      "terminology_id": {
        "_type": "TERMINOLOGY_ID",
        "value": "ISO_639-1"
      },
      "code_string": "en"
    },
    "encoding": {
      "_type": "CODE_PHRASE",
      "terminology_id": {
        "_type": "TERMINOLOGY_ID",
        "value": "IANA_character-sets"
      },
      "code_string": "UTF-8"
    },
    "subject": {
      "_type": "PARTY_SELF"
    },
    "protocol": {
      "_type": "ITEM_TREE",
      "name": {
        "_type": "DV_TEXT",
        "value": "Tree"
      },
      "items": [ {
        "_type": "ELEMENT",
        "name": {
          "_type": "DV_TEXT",
          "value": "Method"
        },
        "value": {
          "_type": "DV_CODED_TEXT",
          "value": "Auscultation",
          "defining_code": {
            "_type": "CODE_PHRASE",
            "terminology_id": {
              "_type": "TERMINOLOGY_ID",
              "value": "local"
            },
            "code_string": "at1036"
          }
        },
        "archetype_node_id": "at1035"
      } ],
      "archetype_node_id": "at0011"
    },
    "data": {
      "name": {
        "_type": "DV_TEXT",
        "value": "History"
      },
      "origin": {
        "_type": "DV_DATE_TIME",
        "value": "2022-02-03T04:05:06"
      },
      "events": [ {
        "_type": "POINT_EVENT",
        "name": {
          "_type": "DV_TEXT",
          "value": "Any event"
        },
        "time": {
          "_type": "DV_DATE_TIME",
          "value": "2022-02-03T04:05:06"
        },
        "state": {
          "_type": "ITEM_TREE",
          "name": {
            "_type": "DV_TEXT",
            "value": "state structure"
          },
          "items": [ {
            "_type": "ELEMENT",
            "name": {
              "_type": "DV_TEXT",
              "value": "Position"
            },
            "value": {
              "_type": "DV_CODED_TEXT",
              "value": "Standing",
              "defining_code": {
                "_type": "CODE_PHRASE",
                "terminology_id": {
                  "_type": "TERMINOLOGY_ID",
                  "value": "local"
                },
                "code_string": "at1000"
              }
            },
            "archetype_node_id": "at0008"
          } ],
          "archetype_node_id": "at0007"
        },
        "data": {
          "_type": "ITEM_TREE",
          "name": {
            "_type": "DV_TEXT",
            "value": "blood pressure"
          },
          "items": [ {
            "_type": "ELEMENT",
            "name": {
              "_type": "DV_TEXT",
              "value": "Systolic"
            },
            "value": {
              "_type": "DV_QUANTITY",
              "units": "mm[Hg]",
              "magnitude": 154.0
            },
            "archetype_node_id": "at0004"
          }, {
            "_type": "ELEMENT",
            "name": {
              "_type": "DV_TEXT",
              "value": "Diastolic"
            },
            "value": {
              "_type": "DV_QUANTITY",
              "units": "mm[Hg]",
              "magnitude": 98.0
            },
            "archetype_node_id": "at0005"
          }, {
            "_type": "ELEMENT",
            "name": {
              "_type": "DV_TEXT",
              "value": "Clinical interpretation"
            },
            "value": {
              "_type": "DV_TEXT",
              "value": "Stage 2 Hypertension: Blood pressure is significantly elevated with systolic pressure of 154 mmHg and diastolic pressure of 98 mmHg, indicating stage 2 hypertension according to current guidelines."
            },
            "archetype_node_id": "at1059"
          } ],
          "archetype_node_id": "at0003"
        },
        "archetype_node_id": "at0006"
      }, {
        "_type": "POINT_EVENT",
        "name": {
          "_type": "DV_TEXT",
          "value": "Any event"
        },
        "time": {
          "_type": "DV_DATE_TIME",
          "value": "2022-02-03T04:25:41"
        },
        "state": {
          "_type": "ITEM_TREE",
          "name": {
            "_type": "DV_TEXT",
            "value": "state structure"
          },
          "items": [ {
            "_type": "ELEMENT",
            "name": {
              "_type": "DV_TEXT",
              "value": "Position"
            },
            "value": {
              "_type": "DV_CODED_TEXT",
              "value": "Standing",
              "defining_code": {
                "_type": "CODE_PHRASE",
                "terminology_id": {
                  "_type": "TERMINOLOGY_ID",
                  "value": "local"
                },
                "code_string": "at1000"
              }
            },
            "archetype_node_id": "at0008"
          } ],
          "archetype_node_id": "at0007"
        },
        "data": {
          "_type": "ITEM_TREE",
          "name": {
            "_type": "DV_TEXT",
            "value": "blood pressure"
          },
          "items": [ {
            "_type": "ELEMENT",
            "name": {
              "_type": "DV_TEXT",
              "value": "Systolic"
            },
            "value": {
              "_type": "DV_QUANTITY",
              "units": "mm[Hg]",
              "magnitude": 144.0
            },
            "archetype_node_id": "at0004"
          }, {
            "_type": "ELEMENT",
            "name": {
              "_type": "DV_TEXT",
              "value": "Diastolic"
            },
            "value": {
              "_type": "DV_QUANTITY",
              "units": "mm[Hg]",
              "magnitude": 80.0
            },
            "archetype_node_id": "at0005"
          }, {
            "_type": "ELEMENT",
            "name": {
              "_type": "DV_TEXT",
              "value": "Clinical interpretation"
            },
            "value": {
              "_type": "DV_TEXT",
              "value": "Stage 2 Hypertension: Blood pressure remains elevated with systolic pressure of 144 mmHg. Diastolic pressure has improved to 80 mmHg, but systolic pressure still indicates stage 2 hypertension."
            },
            "archetype_node_id": "at1059"
          } ],
          "archetype_node_id": "at0003"
        },
        "archetype_node_id": "at0006"
      } ],
      "archetype_node_id": "at0001"
    },
    "archetype_node_id": "openEHR-EHR-OBSERVATION.blood_pressure.v2"
  } ],
  "archetype_node_id": "openEHR-EHR-COMPOSITION.encounter.v1",
  "uid": {
    "_type": "OBJECT_VERSION_ID",
    "value": "8073f453-8095-44e6-8077-798609b32a2f::local.ehrbase.org::1"
  }
}
```


### The Challenge

While canonical formats ensure data integrity and semantic interoperability, they present significant challenges:

1. __Steep learning curve__: Developers must understand the full openEHR Reference Model hierarchy, including classes like `HISTORY`, `ITEM_TREE`, `EVENT_CONTEXT`, etc.
2. __Verbose structures__: Even simple data requires extensive JSON/XML structure with many nested objects and mandatory fields.
3. __Type specifications__: Every object requires `_type` declarations, which adds to verbosity.
4. __Boilerplate repetition__: Many fields (like `name`, `language`, `encoding`) must be repeated throughout the structure even when they don't vary.

These challenges are particularly acute for developers working on:

* __Form-based applications__: Where templates define a fixed structure
* __Limited use cases__: Applications targeting specific clinical scenarios (vital signs, lab results, medication lists)
* __Integration projects__: Where external systems need to submit data to openEHR repositories

The starting point for defining a developer-friendly format is to recognise that the great majority of applications are typically targeted to one or a few specific data sets (e.g. vital signs monitoring, diabetic care management, pregnancy care plans). These applications don't need the full generality of the canonical format for every transaction.


## Historical Formats

Creating canonical data instances is not always straightforward, and various alternatives have been used in the past to simplify the job of content creation and committal for application developers. Template-specificity provides a route to simplification: each openEHR template can be used to define one or more reasonably simple commit formats.

The [Template Data Schema (TDS)](#tds) format was originally devised by Ocean Health Systems as an XSD-based format. An XSLT script transformed `.oet` template source files and archetypes into a single XML Schema (XSD) for any given template. The transformation flattened various RM structures to make them simpler to understand and also converted archetype node codes (at-codes of Object nodes) to XSD tag names, e.g. 'serum_sodium'. This enabled developers to easily identify the XML Element for each data item they needed to populate to create a TDS instance document, known as a Template Data Document (TDD).

The [ECISFLAT](#ecisflat) format was developed for the EtherCIS project as a JSON-based alternative. It uses AQL-style paths based on natural language-independent codes (like `at0001`) and, apart from simplification of `DV_XXX` and `PARTY_PROXY` types, largely retains the openEHR RM structure.

The [Web Template (WT)](#better-web-template) serialisation format was developed by Better (formerly Marand). It represents a more radical simplification of the openEHR RM and BASE models, using programmer-friendly, natural language-based paths. The serialisation format was originally based on the TDS, with a concrete expression in JSON and using paths, rather than sparse XML.

EHRbase adopted and extended WT serialisation as [Simplified Data Template (SDT)](#ehrbase-sdt) format.


## Simplified JSON Formats

These Simplified Formats represent a more radical simplification of the openEHR RM and BASE models, using programmer-friendly, natural language-based paths. The approach was originally based on TDS concepts but with:

* Concrete expression in JSON
* Human-readable path elements (e.g., `body_temperature`, `serum_sodium`)
* Two variants: **Flat** and **Structured**

Key innovations:

* Node IDs generated from human-readable names in any language
* Separation of context data (`ctx/` prefix)
* Elimination of intermediate RM structures (`ITEM_TREE`, `HISTORY`, etc.)
* Direct element-to-value mapping
* Optional RM attributes with an underscore prefix

Advantages:

* Highly readable, language-agnostic paths
* Minimal learning curve for developers
* Suitable for form-based applications
* Both flat and hierarchical representations are available

The format with its two variants is the basis for the current specification.

### Flat format

The Flat format represents data in a flattened key-value structure where paths are used as keys, making it particularly suitable for form-based data entry and simple data structures.
All nested objects are flattened into a single level using path separators.

```json
{
  "blood_pressure_demo.v0/category|value": "event",
  "blood_pressure_demo.v0/category|code": "433",
  "blood_pressure_demo.v0/category|terminology": "openehr",
  "blood_pressure_demo.v0/context/start_time": "2022-02-03T04:05:06",
  "blood_pressure_demo.v0/context/setting|terminology": "openehr",
  "blood_pressure_demo.v0/context/setting|code": "225",
  "blood_pressure_demo.v0/context/setting|value": "home",
  "blood_pressure_demo.v0/context/_end_time": "2022-02-03T04:25:41",
  "blood_pressure_demo.v0/blood_pressure/any_event:0/systolic|unit": "mm[Hg]",
  "blood_pressure_demo.v0/blood_pressure/any_event:0/systolic|magnitude": 154.0,
  "blood_pressure_demo.v0/blood_pressure/any_event:0/diastolic|unit": "mm[Hg]",
  "blood_pressure_demo.v0/blood_pressure/any_event:0/diastolic|magnitude": 98.0,
  "blood_pressure_demo.v0/blood_pressure/any_event:0/clinical_interpretation": "Stage 2 Hypertension: Blood pressure is significantly elevated with systolic pressure of 154 mmHg and diastolic pressure of 98 mmHg, indicating stage 2 hypertension according to current guidelines.",
  "blood_pressure_demo.v0/blood_pressure/any_event:0/position|terminology": "local",
  "blood_pressure_demo.v0/blood_pressure/any_event:0/position|value": "Standing",
  "blood_pressure_demo.v0/blood_pressure/any_event:0/position|code": "at1000",
  "blood_pressure_demo.v0/blood_pressure/any_event:0/time": "2022-02-03T04:05:06",
  "blood_pressure_demo.v0/blood_pressure/any_event:1/systolic|unit": "mm[Hg]",
  "blood_pressure_demo.v0/blood_pressure/any_event:1/systolic|magnitude": 144.0,
  "blood_pressure_demo.v0/blood_pressure/any_event:1/diastolic|magnitude": 80.0,
  "blood_pressure_demo.v0/blood_pressure/any_event:1/diastolic|unit": "mm[Hg]",
  "blood_pressure_demo.v0/blood_pressure/any_event:1/clinical_interpretation": "Stage 2 Hypertension: Blood pressure remains elevated with systolic pressure of 144 mmHg. Diastolic pressure has improved to 80 mmHg, but systolic pressure still indicates stage 2 hypertension.",
  "blood_pressure_demo.v0/blood_pressure/any_event:1/position|code": "at1000",
  "blood_pressure_demo.v0/blood_pressure/any_event:1/position|terminology": "local",
  "blood_pressure_demo.v0/blood_pressure/any_event:1/position|value": "Standing",
  "blood_pressure_demo.v0/blood_pressure/any_event:1/time": "2022-02-03T04:25:41",
  "blood_pressure_demo.v0/blood_pressure/method|code": "at1036",
  "blood_pressure_demo.v0/blood_pressure/method|value": "Auscultation",
  "blood_pressure_demo.v0/blood_pressure/method|terminology": "local",
  "blood_pressure_demo.v0/blood_pressure/language|code": "en",
  "blood_pressure_demo.v0/blood_pressure/language|terminology": "ISO_639-1",
  "blood_pressure_demo.v0/blood_pressure/encoding|terminology": "IANA_character-sets",
  "blood_pressure_demo.v0/blood_pressure/encoding|code": "UTF-8",
  "blood_pressure_demo.v0/language|terminology": "ISO_639-1",
  "blood_pressure_demo.v0/language|code": "en",
  "blood_pressure_demo.v0/territory|terminology": "ISO_3166-1",
  "blood_pressure_demo.v0/territory|code": "DE",
  "blood_pressure_demo.v0/composer|name": "Max Mustermann",
  "blood_pressure_demo.v0/_uid": "8073f453-8095-44e6-8077-798609b32a2f::local.ehrbase.org::1"
}
```

### Structured format

Another variant for this simplification is the Structured format, with the difference that data is represented in JSON structures based on paths from the associated Web Template, rather than flattening them as a key-value list.
An example is shown below.

```json
{
  "blood_pressure_demo.v0": {
    "category": [ {
      "|value": "event",
      "|code": "433",
      "|terminology": "openehr"
    } ],
    "context": [ {
      "start_time": [ "2022-02-03T04:05:06" ],
      "setting": [ {
        "|terminology": "openehr",
        "|code": "225",
        "|value": "home"
      } ],
      "_end_time": [ "2022-02-03T04:25:41" ]
    } ],
    "blood_pressure": [ {
      "any_event": [ {
        "systolic": [ {
          "|unit": "mm[Hg]",
          "|magnitude": 154.0
        } ],
        "diastolic": [ {
          "|unit": "mm[Hg]",
          "|magnitude": 98.0
        } ],
        "clinical_interpretation": [ "Stage 2 Hypertension: Blood pressure is significantly elevated with systolic pressure of 154 mmHg and diastolic pressure of 98 mmHg, indicating stage 2 hypertension according to current guidelines." ],
        "position": [ {
          "|terminology": "local",
          "|value": "Standing",
          "|code": "at1000"
        } ],
        "time": [ "2022-02-03T04:05:06" ]
      }, {
        "systolic": [ {
          "|unit": "mm[Hg]",
          "|magnitude": 144.0
        } ],
        "diastolic": [ {
          "|magnitude": 80.0,
          "|unit": "mm[Hg]"
        } ],
        "clinical_interpretation": [ "Stage 2 Hypertension: Blood pressure remains elevated with systolic pressure of 144 mmHg. Diastolic pressure has improved to 80 mmHg, but systolic pressure still indicates stage 2 hypertension." ],
        "position": [ {
          "|code": "at1000",
          "|terminology": "local",
          "|value": "Standing"
        } ],
        "time": [ "2022-02-03T04:25:41" ]
      } ],
      "method": [ {
        "|code": "at1036",
        "|value": "Auscultation",
        "|terminology": "local"
      } ],
      "language": [ {
        "|code": "en",
        "|terminology": "ISO_639-1"
      } ],
      "encoding": [ {
        "|terminology": "IANA_character-sets",
        "|code": "UTF-8"
      } ]
    } ],
    "language": [ {
      "|terminology": "ISO_639-1",
      "|code": "en"
    } ],
    "territory": [ {
      "|terminology": "ISO_3166-1",
      "|code": "DE"
    } ],
    "composer": [ {
      "|name": "Max Mustermann"
    } ],
    "_uid": [ "8073f453-8095-44e6-8077-798609b32a2f::local.ehrbase.org::1" ]
  }
}
```


### Requirements

To make any simplified format viable, the following requirements must be met:

1. **Abstraction capability**: The format makes it possible to abstract away rigorous structural complexity of the canonical model where appropriate, mainly by making the data less self-standing and relying more on a schema (the template).

2. **Machine generability**: The format definition for any given commit data can be completely and routinely machine-generated from its canonical definition (i.e. from an openEHR Operational Template).

3. **Bidirectional conversion**: Data instances of the simplified format can be routinely machine-converted to canonical format at execution time, and vice versa, but requires information from the underlying Operational Template.

4. **Template specificity**: Field identifiers and structure are derived from and validated against a specific operational template.

5. **Preservation of semantics**: Despite simplification, all clinical semantics from the original archetype and template constraints are preserved.

These requirements ensure that the simplified format serves as a practical interface layer while maintaining the full rigour of openEHR at the persistence and interoperability layers.

NOTE: Developers using the simplified formats in example-based use cases do not need to understand the detailed conversion algorithms. Platforms based on openEHR typically provide services that generate example instances from templates and handle conversion transparently. The conversion details are primarily relevant for developers creating and maintaining openEHR platforms or dealing with complex integration scenarios.

# Basic Concepts

## Web Template Metadata

A Web Template is a processed-representation of an openEHR Operational Template that includes:

* Simplified node identifiers
* AQL paths for all elements
* Input type definitions for data entry
* Localized labels and descriptions
* Multiplicity constraints

Web Template is used to generate and validate data instances. Specification of Web Template metadata is separate from the data serialization format described in this specification.

Example of a Web Template:
```json
{
  "templateId": "Blood_Pressure_Demo.v0",
  "semVer": "0.2.0",
  "version": "2.3",
  "defaultLanguage": "en",
  "languages": [ "en" ],
  "tree": {
    "id": "blood_pressure_demo.v0",
    "name": "Blood_Pressure_Demo.v0",
    "localizedName": "Blood_Pressure_Demo.v0",
    "rmType": "COMPOSITION",
    "nodeId": "openEHR-EHR-COMPOSITION.encounter.v1",
    "min": 1,
    "max": 1,
    "localizedNames": {
      "en": "Blood_Pressure_Demo.v0"
    },
    "localizedDescriptions": {
      "en": "Interaction, contact or care event between a subject of care and healthcare provider(s)."
    },
    "aqlPath": "",
    "children": [ {
      "id": "context",
      "rmType": "EVENT_CONTEXT",
      "nodeId": "",
      "min": 1,
      "max": 1,
      "aqlPath": "/context",
      "children": [ {
        "id": "start_time",
        "name": "Start_time",
        "rmType": "DV_DATE_TIME",
        "min": 1,
        "max": 1,
        "aqlPath": "/context/start_time",
        "inputs": [ {
          "type": "DATETIME"
        } ],
        "inContext": true
      }, {
        "id": "setting",
        "name": "Setting",
        "rmType": "DV_CODED_TEXT",
        "min": 1,
        "max": 1,
        "aqlPath": "/context/setting",
        "inputs": [ {
          "suffix": "code",
          "type": "TEXT"
        }, {
          "suffix": "value",
          "type": "TEXT"
        } ],
        "inContext": true
      } ]
    }, {
      "id": "blood_pressure",
      "name": "Blood pressure",
      "localizedName": "Blood pressure",
      "rmType": "OBSERVATION",
      "nodeId": "openEHR-EHR-OBSERVATION.blood_pressure.v2",
      "min": 0,
      "max": 1,
      "localizedNames": {
        "en": "Blood pressure"
      },
      "localizedDescriptions": {
        "en": "The local measurement of arterial blood pressure which is a surrogate for arterial pressure in the systemic circulation."
      },
      "annotations": {
        "comment": "Most commonly, use of the term 'blood pressure' refers to measurement of brachial artery pressure in the upper arm."
      },
      "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]",
      "children": [ {
        "id": "any_event",
        "name": "Any event",
        "localizedName": "Any event",
        "rmType": "EVENT",
        "nodeId": "at0006",
        "min": 0,
        "max": -1,
        "localizedNames": {
          "en": "Any event"
        },
        "localizedDescriptions": {
          "en": "Default, unspecified point in time or interval event which may be explicitly defined in a template or at run-time."
        },
        "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0006]",
        "children": [ {
          "id": "systolic",
          "name": "Systolic",
          "localizedName": "Systolic",
          "rmType": "DV_QUANTITY",
          "nodeId": "at0004",
          "min": 0,
          "max": 1,
          "localizedNames": {
            "en": "Systolic"
          },
          "localizedDescriptions": {
            "en": "Peak systemic arterial blood pressure  - measured in systolic or contraction phase of the heart cycle."
          },
          "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0006]/data[at0003]/items[at0004]/value",
          "inputs": [ {
            "suffix": "magnitude",
            "type": "DECIMAL",
            "validation": {
              "range": {
                "minOp": ">=",
                "min": 0.0,
                "maxOp": "<",
                "max": 1000.0
              },
              "precision": {
                "minOp": ">=",
                "min": 0,
                "maxOp": "<=",
                "max": 0
              }
            }
          }, {
            "suffix": "unit",
            "type": "CODED_TEXT",
            "list": [ {
              "value": "mm[Hg]",
              "label": "mm[Hg]",
              "localizedLabels": {
                "en": "mmHg"
              },
              "validation": {
                "range": {
                  "minOp": ">=",
                  "min": 0.0,
                  "maxOp": "<",
                  "max": 1000.0
                },
                "precision": {
                  "minOp": ">=",
                  "min": 0,
                  "maxOp": "<=",
                  "max": 0
                }
              }
            } ]
          } ],
          "termBindings": {
            "SNOMED-CT": {
              "value": "[SNOMED-CT(2003)::271649006]",
              "terminologyId": "SNOMED-CT"
            }
          }
        }, {
          "id": "diastolic",
          "name": "Diastolic",
          "localizedName": "Diastolic",
          "rmType": "DV_QUANTITY",
          "nodeId": "at0005",
          "min": 0,
          "max": 1,
          "localizedNames": {
            "en": "Diastolic"
          },
          "localizedDescriptions": {
            "en": "Minimum systemic arterial blood pressure - measured in the diastolic or relaxation phase of the heart cycle."
          },
          "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0006]/data[at0003]/items[at0005]/value",
          "inputs": [ {
            "suffix": "magnitude",
            "type": "DECIMAL",
            "validation": {
              "range": {
                "minOp": ">=",
                "min": 0.0,
                "maxOp": "<",
                "max": 1000.0
              },
              "precision": {
                "minOp": ">=",
                "min": 0,
                "maxOp": "<=",
                "max": 0
              }
            }
          }, {
            "suffix": "unit",
            "type": "CODED_TEXT",
            "list": [ {
              "value": "mm[Hg]",
              "label": "mm[Hg]",
              "localizedLabels": {
                "en": "mmHg"
              },
              "validation": {
                "range": {
                  "minOp": ">=",
                  "min": 0.0,
                  "maxOp": "<",
                  "max": 1000.0
                },
                "precision": {
                  "minOp": ">=",
                  "min": 0,
                  "maxOp": "<=",
                  "max": 0
                }
              }
            } ]
          } ],
          "termBindings": {
            "SNOMED-CT": {
              "value": "[SNOMED-CT(2003)::271650006]",
              "terminologyId": "SNOMED-CT"
            }
          }
        }, {
          "id": "clinical_interpretation",
          "name": "Clinical interpretation",
          "localizedName": "Clinical interpretation",
          "rmType": "DV_TEXT",
          "nodeId": "at1059",
          "min": 0,
          "max": 1,
          "localizedNames": {
            "en": "Clinical interpretation"
          },
          "localizedDescriptions": {
            "en": "Single word, phrase or brief description that represents the clinical meaning and significance of the blood pressure measurement."
          },
          "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0006]/data[at0003]/items[at1059]/value",
          "inputs": [ {
            "type": "TEXT"
          } ]
        }, {
          "id": "position",
          "name": "Position",
          "localizedName": "Position",
          "rmType": "DV_CODED_TEXT",
          "nodeId": "at0008",
          "min": 0,
          "max": 1,
          "dependsOn": [ "systolic", "diastolic", "clinical_interpretation" ],
          "localizedNames": {
            "en": "Position"
          },
          "localizedDescriptions": {
            "en": "The position of the individual at the time of measurement."
          },
          "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0006]/state[at0007]/items[at0008]/value",
          "inputs": [ {
            "suffix": "code",
            "type": "CODED_TEXT",
            "list": [ {
              "value": "at1000",
              "label": "Standing",
              "localizedLabels": {
                "en": "Standing"
              },
              "localizedDescriptions": {
                "en": "Standing at the time of blood pressure measurement."
              }
            }, {
              "value": "at1001",
              "label": "Sitting",
              "localizedLabels": {
                "en": "Sitting"
              },
              "localizedDescriptions": {
                "en": "Sitting (for example on bed or chair) at the time of blood pressure measurement."
              }
            }, {
              "value": "at1002",
              "label": "Reclining",
              "localizedLabels": {
                "en": "Reclining"
              },
              "localizedDescriptions": {
                "en": "Reclining at the time of blood pressure measurement."
              }
            }, {
              "value": "at1003",
              "label": "Lying",
              "localizedLabels": {
                "en": "Lying"
              },
              "localizedDescriptions": {
                "en": "Lying flat at the time of blood pressure measurement."
              }
            }, {
              "value": "at1014",
              "label": "Lying with tilt to left",
              "localizedLabels": {
                "en": "Lying with tilt to left"
              },
              "localizedDescriptions": {
                "en": "Lying flat with some lateral tilt, usually angled towards the left side.   Commonly required in the last trimester of pregnancy to relieve aortocaval compression."
              }
            } ]
          } ]
        }, {
          "id": "time",
          "name": "Time",
          "rmType": "DV_DATE_TIME",
          "min": 1,
          "max": 1,
          "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0006]/time",
          "inputs": [ {
            "type": "DATETIME"
          } ],
          "inContext": true
        } ]
      }, {
        "id": "method",
        "name": "Method",
        "localizedName": "Method",
        "rmType": "DV_CODED_TEXT",
        "nodeId": "at1035",
        "min": 0,
        "max": 1,
        "dependsOn": [ "any_event" ],
        "localizedNames": {
          "en": "Method"
        },
        "localizedDescriptions": {
          "en": "Method of measurement of blood pressure."
        },
        "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/protocol[at0011]/items[at1035]/value",
        "inputs": [ {
          "suffix": "code",
          "type": "CODED_TEXT",
          "list": [ {
            "value": "at1036",
            "label": "Auscultation",
            "localizedLabels": {
              "en": "Auscultation"
            },
            "localizedDescriptions": {
              "en": "Method of measuring blood pressure externally, using a stethoscope and Korotkoff sounds."
            }
          }, {
            "value": "at1037",
            "label": "Palpation",
            "localizedLabels": {
              "en": "Palpation"
            },
            "localizedDescriptions": {
              "en": "Method of measuring blood pressure externally, using palpation (usually of the brachial or radial arteries)."
            }
          }, {
            "value": "at1039",
            "label": "Machine",
            "localizedLabels": {
              "en": "Machine"
            },
            "localizedDescriptions": {
              "en": "Method of measuring blood pressure externally, using a blood pressure machine."
            }
          }, {
            "value": "at1040",
            "label": "Invasive",
            "localizedLabels": {
              "en": "Invasive"
            },
            "localizedDescriptions": {
              "en": "Method of measuring blood pressure internally ie involving penetration of the skin and measuring inside blood vessels."
            }
          } ]
        } ]
      }, {
        "id": "language",
        "name": "Language",
        "rmType": "CODE_PHRASE",
        "min": 1,
        "max": 1,
        "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/language",
        "inContext": true
      }, {
        "id": "encoding",
        "name": "Encoding",
        "rmType": "CODE_PHRASE",
        "min": 1,
        "max": 1,
        "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/encoding",
        "inContext": true
      }, {
        "id": "subject",
        "name": "Subject",
        "rmType": "PARTY_PROXY",
        "min": 1,
        "max": 1,
        "aqlPath": "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/subject",
        "inputs": [ {
          "suffix": "id",
          "type": "TEXT"
        }, {
          "suffix": "id_scheme",
          "type": "TEXT"
        }, {
          "suffix": "id_namespace",
          "type": "TEXT"
        }, {
          "suffix": "name",
          "type": "TEXT"
        } ],
        "inContext": true
      } ],
      "termBindings": {
        "SNOMED-CT": {
          "value": "[SNOMED-CT(2003)::364090009]",
          "terminologyId": "SNOMED-CT"
        }
      }
    }, {
      "id": "category",
      "rmType": "DV_CODED_TEXT",
      "nodeId": "",
      "min": 1,
      "max": 1,
      "aqlPath": "/category",
      "inputs": [ {
        "suffix": "code",
        "type": "CODED_TEXT",
        "list": [ {
          "value": "433",
          "label": "event",
          "localizedLabels": {
            "en": "event"
          }
        } ],
        "terminology": "openehr"
      } ],
      "inContext": true
    }, {
      "id": "language",
      "name": "Language",
      "rmType": "CODE_PHRASE",
      "min": 1,
      "max": 1,
      "aqlPath": "/language",
      "inContext": true
    }, {
      "id": "territory",
      "name": "Territory",
      "rmType": "CODE_PHRASE",
      "min": 1,
      "max": 1,
      "aqlPath": "/territory",
      "inContext": true
    }, {
      "id": "composer",
      "name": "Composer",
      "rmType": "PARTY_PROXY",
      "min": 1,
      "max": 1,
      "aqlPath": "/composer",
      "inputs": [ {
        "suffix": "id",
        "type": "TEXT"
      }, {
        "suffix": "id_scheme",
        "type": "TEXT"
      }, {
        "suffix": "id_namespace",
        "type": "TEXT"
      }, {
        "suffix": "name",
        "type": "TEXT"
      } ],
      "inContext": true
    } ]
  }
}
```


## Field Identifiers

The Simplified Formats use hierarchical field identifiers composed of:

1. **Node IDs**: Generated from archetype node names
2. **Path separators**: Forward slash (`/`) between hierarchy levels
3. **Instance indicators**: Colon notation (`:0`, `:1`, etc.) for repeating elements
4. **Attribute suffixes**: Pipe notation (`|magnitude`, `|unit`, etc.) for RM attributes
5. **RM attribute prefix**: Underscore (`_`) for optional RM attributes not in template
6. **Raw canonical JSON**: Use of `|raw` attribute to embed openEHR canonical JSON


Example identifier structure:
```
vital_signs/body_temperature:0/any_event:0/temperature|magnitude
vital_signs/body_temperature:0/any_event:0/temperature/_normal_range/lower|magnitude
```


### Node ID Generation Rules

Node IDs are generated from archetype node names using the following algorithm:

1. __Character normalisation__: Replace any character that is not:
* A Unicode alphabetic character (`\p{IsAlphabetic}`)
* A digit (`0-9`)
* An underscore (`_`)
* A dot (`.`)
* A dash (`-`)
+
with an underscore (`_`)

2. __Underscore consolidation__: Replace multiple consecutive underscores with a single underscore

3. __Case normalisation__: Convert to lowercase

4. __Trim underscores__: Remove leading and trailing underscores

5. __Empty ID handling__: If result is empty, use "id" as the identifier

6. __Numeric prefix handling__: If result starts with a digit, prepend "a"

7. __Uniqueness__: Append a numeric suffix if needed to ensure uniqueness among siblings

Examples:

|===
|Original Name |Generated ID

|Body temperature
|body_temperature

|Problem/diagnosis
|problem_diagnosis

|Tests (1, 2, 3)
|tests_1_2_3

|1st visit
|a1st_visit

|Blood Pressure
|blood_pressure

|Blood Pressure _(duplicate)_
|blood_pressure_1

|===


### Path Construction

Full paths are constructed by concatenating parent node IDs with forward slashes:

```
composition_id/section_id/observation_id/element_id
```


### Instance Indexing

When a node can occur multiple times (max > 1 or max = -1), instances are indexed using colon notation:

```
node_id:0  # First instance
node_id:1  # Second instance
node_id:2  # Third instance
```

The index is appended after the node ID and before the next path separator.

Indexing examples:

Multiple events in an observation:
```
vital_signs/body_temperature:0/any_event:0/temperature|magnitude
vital_signs/body_temperature:0/any_event:1/temperature|magnitude
```

Multiple observations in a composition:
```
vital_signs/body_temperature:0/any_event:0/temperature|magnitude
vital_signs/body_temperature:1/any_event:0/temperature|magnitude
```

### Attribute Suffixes

RM attributes are indicated by pipe-separated suffixes.

Example of such attributes:

|===
|RM Type |Suffix |Description
|[DV_QUANTITY](#DV_QUANTITY)           |`\|magnitude`      |Numeric value
|[DV_QUANTITY](#DV_QUANTITY)           |`\|unit`           |Unit of measure
|[DV_CODED_TEXT](#DV_CODED_TEXT)       |`\|code`           |Terminology code
|[DV_CODED_TEXT](#DV_CODED_TEXT)       |`\|value`          |Display term
|[DV_CODED_TEXT](#DV_CODED_TEXT)       |`\|terminology`    |Terminology identifier
|[PARTY_IDENTIFIED](#PARTY_IDENTIFIED) |`\|id`             |The ID value
|[PARTY_IDENTIFIED](#PARTY_IDENTIFIED) |`\|id_namespace`   |The namespace of the ID value
|===


### RM Attributes prefix

Some attributes are defined by the openEHR Reference Model but are optional and may not be explicitly constrained in the template.
To access these RM attributes, an underscore prefix (i.e. '_') is used in the path: `_attributeName`.

This convention allows applications to populate optional RM attributes that provide additional metadata, audit information, or structural details beyond what is defined in the template.

Examples:
```json
{
  "conformance/observation:0/_uid": "9fcc1c70-9349-444d-b9cb-8fa817697f5e"
}
```
```json
{
  "path/observation:0/_link:0|type": "problem",
  "path/observation:0/_link:0|target": "ehr://problem-123",
  "path/observation:0/_link:0|meaning|code": "related_to",
  "path/observation:0/_link:0|meaning|value": "Related to"
}
```
```json
{
  "vital_signs/temperature:0/value|magnitude": 37.5,
  "vital_signs/temperature:0/value|unit": "°C",
  "vital_signs/temperature:0/value/_normal_range/lower|magnitude": 36.0,
  "vital_signs/temperature:0/value/_normal_range/lower|unit": "°C",
  "vital_signs/temperature:0/value/_normal_range/upper|magnitude": 37.8,
  "vital_signs/temperature:0/value/_normal_range/upper|unit": "°C"
}
```

### Raw canonical JSON 

The `|raw` attribute is a special bypass mechanism that enables direct embedding of pre-serialized openEHR canonical JSON into flat or structured format inputs.
This feature allows incorporating fully-formed openEHR Reference Model (RM) objects without decomposing them into individual attributes.

```json
{
  "ctx/language": "en",
  "ctx/territory": "US",
  "ctx/composer_name": "Dr. Smith",
  "ctx/time": "2024-01-15T10:30:00Z",
  "vital_signs/blood_pressure:0/any_event:0/systolic|raw": {
    "_type": "DV_QUANTITY",
    "magnitude": 120,
    "unit": "mm[Hg]"
  }
}
```

This feature proves particularly valuable when:

* Working with pre-existing openEHR canonical JSON data
* Handling complex RM structures that are cumbersome to express in simplified formats
* Integrating data from systems that natively produce canonical JSON

The raw JSON value must include the `_type` property indicating the openEHR type, and should conform to the openEHR Reference Model.


## Context

Context information represents composition-level metadata and is prefixed with `ctx/`.

This includes:

* Mandatory: language, territory
* Optional: composer, time, setting, participations, facility information, workflow identifiers

Context data is typically not entered by users but provided by the application.
The `ctx/time` field, if not explicitly set, defaults to the current server time (`now()`).

See below <<_context_information>> for more details.


## Format variants

### Flat format

In the Flat format, all data elements are represented as key-value pairs at a single level in JSON where:

* Keys are full WT paths (with instance indices and attribute suffixes)
* Values are primitive types (string, number, boolean), or simple objects
* There is no distinction between ELEMENT and its value - elements ARE their values

Syntax Rules:

1. All paths MUST be fully qualified from the data instance root
2. Context fields MUST use `ctx/` prefix
3. Instance indices MUST be zero-based
4. Attribute suffixes MUST be separated by pipe (`|`)
5. RM attribute paths MUST use underscore prefix (`_`)
6. Path segments MUST be separated by forward slash (`/`)

Example:
```json
{
  "ctx/language": "en",
  "ctx/territory": "US",
  "ctx/composer_name": "Dr. Smith",
  "ctx/time": "2024-01-15T10:30:00Z",
  "vital_signs/body_temperature:0/any_event:0/temperature|magnitude": 37.5,
  "vital_signs/body_temperature:0/any_event:0/temperature|unit": "°C",
  "vital_signs/body_temperature:0/any_event:0/temperature/_normal_range/lower|magnitude": 36.0,
  "vital_signs/body_temperature:0/any_event:0/temperature/_normal_range/lower|unit": "°C",
  "vital_signs/body_temperature:0/any_event:0/temperature/_normal_range/upper|magnitude": 37.8,
  "vital_signs/body_temperature:0/any_event:0/temperature/_normal_range/upper|unit": "°C",
  "vital_signs/body_temperature:0/any_event:0/time": "2024-01-15T10:30:00Z",
  "vital_signs/blood_pressure:0/any_event:0/systolic|magnitude": 120,
  "vital_signs/blood_pressure:0/any_event:0/systolic|unit": "mm[Hg]",
  "vital_signs/blood_pressure:0/any_event:0/diastolic|magnitude": 80,
  "vital_signs/blood_pressure:0/any_event:0/diastolic|unit": "mm[Hg]",
  "vital_signs/blood_pressure:0/any_event:0/time": "2024-01-15T10:30:00Z"
}
```


### Structured format

In the Structured format, the hierarchy is preserved as nested JSON objects where:

* Each path segment becomes a property in a nested object
* Instance indices remain in property names (e.g., `body_temperature`)
* Attribute suffixes become properties prefixed with pipe (e.g., `|magnitude`)
* Context data is grouped under `ctx` object
* Arrays are used throughout, even for single-cardinality elements

Syntax Rules:

1. Hierarchy MUST be represented by nested objects
2. Instance indices MUST remain in property names
3. Attribute suffixes MUST use pipe prefix
4. Context data MUST be grouped under `ctx` property
5. Arrays MUST be used for data values, even when cardinality is `0..1` or `1..1`
6. Empty objects SHOULD be omitted

```json
{
  "ctx": {
    "language": "en",
    "territory": "US",
    "composer_name": "Dr. Smith",
    "time": "2024-01-15T10:30:00Z"
  },
  "vital_signs": {
    "body_temperature": [
      {
        "any_event": [
          {
            "temperature": [
              {
                "|magnitude": 37.5,
                "|unit": "°C"
              }
            ],
            "time": [
              "2024-01-15T10:30:00Z"
            ]
          }
        ]
      }
    ],
    "blood_pressure": [
      {
        "any_event": [
          {
            "systolic": [
              {
                "|magnitude": 120,
                "|unit": "mm[Hg]"
              }
            ],
            "diastolic": [
              {
                "|magnitude": 80,
                "|unit": "mm[Hg]"
              }
            ],
            "time": [
              "2024-01-15T10:30:00Z"
            ]
          }
        ]
      }
    ]
  }
}
```


## Conversion Between Formats

### Flat to Structured

Algorithm for converting flat format to structured:

1. Parse each flat key into path segments
2. Separate context fields (`ctx/`) from composition fields
3. For each path:
    a. Split on forward slash (`/`)
    b. Create nested objects for each segment
    c. For the final segment, check for attribute suffix (|)
    d. If attribute suffix exists, create an array containing an object with suffix as property
    e. Handle RM attributes (underscore prefix) appropriately
4. Merge all nested structures
5. Add context object

### Structured to Flat

Algorithm for converting structured format to flat:

1. Recursively traverse the nested object structure
2. Build path by concatenating property names with forward slash
3. For properties with a pipe prefix, append to a parent path with pipe
4. Unwrap arrays (Structured uses arrays throughout)
5. Flatten context object with `ctx/` prefix
6. Preserve instance indices in property names
7. Preserve RM attribute underscore prefixes


## Level Removal

Paths in Flat and Structured formats omit two distinct kinds of segments relative to the canonical RM path:

1. *Container attribute names* of `LOCATABLE`-to-`LOCATABLE` relationships are never present as path segments -- the parent connects directly to the child via the child's archetype node-id alias.
2. In addition, certain *wrapper node types* are themselves collapsed -- their archetype node-id is also dropped -- because they act only as structural slots and carry no clinically meaningful identity at that level.

### Container Attributes Elided from Paths

The following RM attribute names are universally absent from paths:

* `COMPOSITION.content`
* `SECTION.items`
* `OBSERVATION.data`, `OBSERVATION.state`, `OBSERVATION.protocol`
* `EVALUATION.data`, `EVALUATION.protocol`
* `INSTRUCTION.activities`, `INSTRUCTION.protocol`
* `ACTION.description`, `ACTION.protocol`
* `ADMIN_ENTRY.data`
* `ACTIVITY.description`
* `HISTORY.events`
* `EVENT.data`, `EVENT.state`
* `ITEM_TREE.items`, `ITEM_LIST.items`, `ITEM_SINGLE.item`, `ITEM_TABLE.rows`
* `CLUSTER.items`

### Always Collapsed Wrapper Types

In addition to the attribute elision above, the following wrapper node types are themselves collapsed -- their archetype node-id is also dropped, so the parent connects directly to the wrapper's contents:

* `ITEM_STRUCTURE` (abstract) and its concrete subtypes:
** `ITEM_TREE`
** `ITEM_LIST`
** `ITEM_SINGLE`
** `ITEM_TABLE`
* `HISTORY`

These types act as fixed structural slots in their parent (`ENTRY` for the `ITEM_STRUCTURE` family; `OBSERVATION` for `HISTORY`) and have no archetype node-id distinct from that slot.

### Conditionally Collapsed Wrapper Types

An `EVENT` node is collapsed when both of the following hold:

1. Its maximum occurrence is 1 (i.e., `max = 1`), AND
2. No sibling `EVENT` nodes (of any concrete event type) exist in the same parent `HISTORY`.

`EVENT` nodes are retained when:

* Multiple `EVENT` types exist in the same parent `HISTORY` (e.g., a `POINT_EVENT` alongside an `INTERVAL_EVENT`), or
* The `EVENT` can occur multiple times (`max > 1`).

### Example

Take a single measurement magnitude inside a laboratory result panel. The canonical RM path is:

```
/content[openEHR-EHR-OBSERVATION.laboratory_test_result.v1]
  /data[at0001]
  /events[at0002]
  /data[at0003]
  /items[openEHR-EHR-CLUSTER.laboratory_test_panel.v1]
  /items[openEHR-EHR-CLUSTER.laboratory_test_analyte.v1]
  /items[at0001]
  /value
```

The same field in Flat form:

```
laboratory_test_report/laboratory_test/laboratory_test_panel/laboratory_result:0/result_value|magnitude
```

Differences:

* Container attribute names (`content`, `data`, `events`, `items`, `value`) are elided wherever they appear.
* The `HISTORY` (`at0001`) and `ITEM_TREE` (`at0003`) wrapper nodes are collapsed; the `EVENT` (`at0002`) is conditionally collapsed (here `max=1`, single event type).
* The `OBSERVATION` and the two `CLUSTER` nodes are retained under their archetype-id aliases (`laboratory_test`, `laboratory_test_panel`, `laboratory_result`); the inner `CLUSTER` repeats, hence the `:0` instance index.
* `ELEMENT.value` is replaced by the `|magnitude` attribute suffix.


## Open Value-Sets and the `|other` Suffix

When an archetype constrains a leaf to `DV_CODED_TEXT` with an _open_ value-set -- the bound terminology lists recommended codes but the constraint also accepts values outside the list (`listOpen: true` in the web template; non-`limit-to-list` in ADL) -- the same leaf may at runtime carry either a `DV_CODED_TEXT` (chosen from the list) or a `DV_TEXT` (free-text value).

Many archetypes deliberately combine a recommended coded list with free-text fallback (e.g. `state_of_dress`, `confounding_factors`, `overall_test_status`). Without a dedicated FLAT-level discriminator the `DV_CODED_TEXT` vs `DV_TEXT` branch would have to be inferred from value patterns, which is fragile and ambiguous. The `|other` suffix makes the branch explicit at the FLAT level and removes the need for receivers to reason about it.

* On *write*: clients supply the free-text value via `<path>|other: "<text>"`. The server persists the leaf as a `DV_TEXT` in the canonical RM (not as a `DV_CODED_TEXT` with empty `defining_code`).
* On *read*: when the leaf carries a `DV_TEXT` whose archetype constraint is `DV_CODED_TEXT` with `listOpen: true`, the server SHOULD emit it via `<path>|other: "<text>"` so that round-trip equality holds at the FLAT level.
* `|other` is mutually exclusive with `|code`, `|value` and `|terminology` on the same leaf path; servers MUST reject combinations.
* `|other` MUST be rejected when the constraint is closed (`listOpen: false`).

The per-suffix table is in the <<DV_CODED_TEXT>> class section.


## Validation

Implementations SHOULD validate:

* Get the WT for the target template and map input fields to the identifiers
* Check the final segment for the pipe to identify attribute suffix
* Mandatory context fields (language, territory) are present
* Field identifiers match WT metadata structure
* Data types match expected types from the Operational Template
* Cardinality constraints are satisfied
* Terminology bindings are valid
* RM attribute paths (underscore-prefixed) are valid
# RM Mappings

## COMPOSITION

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class[COMPOSITION] class.

```json
{
  "conformance-ehrbase.de.v0/language|code": "en",
  "conformance-ehrbase.de.v0/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/territory|code": "US",
  "conformance-ehrbase.de.v0/territory|terminology": "ISO_3166-1",
  "conformance-ehrbase.de.v0/category|code": "433",
  "conformance-ehrbase.de.v0/category|value": "event",
  "conformance-ehrbase.de.v0/category|terminology": "openehr",
  "conformance-ehrbase.de.v0/context/start_time": "2021-12-21T14:19:31.649613+01:00",
  "conformance-ehrbase.de.v0/context/setting|code": "238",
  "conformance-ehrbase.de.v0/context/setting|value": "other care",
  "conformance-ehrbase.de.v0/context/setting|terminology": "openehr",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude": 65.9,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/time": "2021-12-21T16:02:58.0094262+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/encoding|terminology": "IANA_character-sets",
  "conformance-ehrbase.de.v0/composer|name": "Silvia Blake"
}
```

```json
{
  "conformance-ehrbase.de.v0/_uid": "6e3a9506-b81c-4d74-a37f-1464fb7106b2::ehrbase.org::1",
  "conformance-ehrbase.de.v0/language|code": "en",
  "conformance-ehrbase.de.v0/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/territory|code": "US",
  "conformance-ehrbase.de.v0/territory|terminology": "ISO_3166-1",
  "conformance-ehrbase.de.v0/category|code": "433",
  "conformance-ehrbase.de.v0/category|value": "event",
  "conformance-ehrbase.de.v0/category|terminology": "openehr",
  "conformance-ehrbase.de.v0/context/_health_care_facility|id": "9091",
  "conformance-ehrbase.de.v0/context/_health_care_facility|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/context/_health_care_facility|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/context/_health_care_facility|name": "Hospital",
  "conformance-ehrbase.de.v0/context/_participation:0|function": "requester",
  "conformance-ehrbase.de.v0/context/_participation:0|mode": "face-to-face communication",
  "conformance-ehrbase.de.v0/context/_participation:0|name": "Dr. Marcus Johnson",
  "conformance-ehrbase.de.v0/context/_participation:0|id": "199",
  "conformance-ehrbase.de.v0/context/_participation:0|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/context/_participation:0|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/context/start_time": "2021-12-21T14:19:31.649613+01:00",
  "conformance-ehrbase.de.v0/context/_end_time": "2021-12-21T15:19:31.649613+01:00",
  "conformance-ehrbase.de.v0/context/_location": "microbiology lab 2",
  "conformance-ehrbase.de.v0/context/setting|code": "238",
  "conformance-ehrbase.de.v0/context/setting|value": "other care",
  "conformance-ehrbase.de.v0/context/setting|terminology": "openehr",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude": 65.9,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/time": "2021-12-21T16:02:58.0094262+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/encoding|terminology": "IANA_character-sets",
  "conformance-ehrbase.de.v0/_link:0|type": "problem",
  "conformance-ehrbase.de.v0/_link:0|meaning": "problem related note",
  "conformance-ehrbase.de.v0/_link:0|target": "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e",
  "conformance-ehrbase.de.v0/composer|name": "Silvia Blake",
  "conformance-ehrbase.de.v0/composer|id": "1234-5678",
  "conformance-ehrbase.de.v0/composer|id_scheme": "UUID",
  "conformance-ehrbase.de.v0/composer|id_namespace": "EHR.NETWORK"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/language`
| [CODE_PHRASE](#CODE_PHRASE)
| language
| Yes
|

| `/territory`
| [CODE_PHRASE](#CODE_PHRASE)
| territory
| Yes
|

| `/category`
| [DV_CODED_TEXT](#DV_CODED_TEXT)
| category
| yes
|

| `/composer`
| [PARTY_PROXY](#PARTY_PROXY)
| composer
| yes
| add ctx/composer_self:true to set composer to PARTY_SELF

| `/context`
| [EVENT_CONTEXT](#EVENT_CONTEXT)
| context
| yes
|

| `/_link:i`
| [LINK](#LINK)
| links
| no
|

| `/_feeder_audit`
| [FEEDER_AUDIT](#FEEDER_AUDIT)
| feeder_audit
| no
|

| `/_uid`
| STRING
| uid.value
| no
|
|===

## ADMIN_ENTRY

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_admin_entry_class[ADMIN_ENTRY] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/dv_text": "DV_TEXT 56",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/encoding|terminology": "IANA_character-sets"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/dv_text": "DV_TEXT 56",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/encoding|terminology": "IANA_character-sets",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:0|function": "requester",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:0|mode": "face-to-face communication",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:0|name": "Dr. Marcus Johnson",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:0|id": "199",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:0|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:0|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:1|function": "performer",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:1|mode": "not specified",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:1|name": "Lara Markham",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:1|id": "198",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:1|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_other_participation:1|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_work_flow_id|type": "WORKFLOW",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_work_flow_id|namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_work_flow_id|id": "335645",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_work_flow_id|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_uid":"9fcc1c70-9349-444d-b9cb-8fa817697f5e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_link:0|type": "problem",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_link:0|meaning": "problem related note",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_link:0|target": "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_feeder_audit/originating_system_audit|version_id": "final",
  "conformance-ehrbase.de.v0/conformance_section/conformance_admin_entry/_feeder_audit/originating_system_audit|system_id": "orig"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/language`
| [CODE_PHRASE](#CODE_PHRASE)
| language
| Yes
|

| `/territory`
| [CODE_PHRASE](#CODE_PHRASE)
| territory
| Yes
|

| `/subject`
| [PARTY_PROXY](#PARTY_PROXY)
| subject
| no
| will be set to PARTY_SELF if not explicitly set

| `/_work_flow_id`
| [OBJECT_REF](#OBJECT_REF)
| workflow_id
| no
|

| `/_link:i`
| [LINK](#LINK)
| links
| no
|

| `/_feeder_audit`
| [FEEDER_AUDIT](#FEEDER_AUDIT)
| feeder_audit
| no
|

| `/_uid`
| STRING
| uid.value
| no
|
|===

## INSTRUCTION

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_instruction_class[INSTRUCTION] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/dv_text": "DV_TEXT 45",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/timing": "R4/2022-01-31T10:00:00+01:00/P3M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/timing|formalism": "timing",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/dv_text": "DV_TEXT 91",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/expiry_time": "2022-01-31T10:33:28.724259+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/narrative": "Human readable instruction narrative",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/encoding|terminology": "IANA_character-sets"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/dv_text": "DV_TEXT 45",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/timing": "R4/2022-01-31T10:00:00+01:00/P3M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/timing|formalism": "timing",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/action_archetype_id": "/openEHR-EHR-CLUSTER.conformance_action.v0/",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/dv_text": "DV_TEXT 91",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/expiry_time": "2022-01-31T10:33:28.724259+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/narrative": "Human readable instruction narrative",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_wf_definition|value": "wf_definition",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_wf_definition|formalism": "formalism",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/encoding|terminology": "IANA_character-sets",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:0|function": "requester",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:0|mode": "face-to-face communication",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:0|name": "Dr. Marcus Johnson",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:0|id": "199",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:0|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:0|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:1|function": "performer",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:1|mode": "not specified",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:1|name": "Lara Markham",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:1|id": "198",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:1|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_other_participation:1|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_guideline_id|type": "GUIDELINE",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_guideline_id|namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_guideline_id|id": "3445",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_guideline_id|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_work_flow_id|type": "WORKFLOW",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_work_flow_id|namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_work_flow_id|id": "335645",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_work_flow_id|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_uid":"9fcc1c70-9349-444d-b9cb-8fa817697f5e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_link:0|type": "problem",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_link:0|meaning": "problem related note",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_link:0|target": "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_feeder_audit/originating_system_audit|version_id": "final",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_feeder_audit/originating_system_audit|system_id": "orig"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/language`
| [CODE_PHRASE](#CODE_PHRASE)
| language
| Yes
|

| `/territory`
| [CODE_PHRASE](#CODE_PHRASE)
| territory
| Yes
|

| `/narrative`
| [DV_TEXT](#DV_TEXT)
| narrative
| yes
|

| `/_expiry_time`
| [DV_DATE_TIME](#DV_DATE_TIME)
| expiry_time
| Yes
|

| `/_wf_definition`
| [DV_PARSABLE](#DV_PARSABLE)
| wf_definition
| no
|

| `/subject`
| [PARTY_PROXY](#PARTY_PROXY)
| subject
| no
| will be set to PARTY_SELF if not explicitly set

| `/_guideline_id`
| [OBJECT_REF](#OBJECT_REF)
| guideline_id
| no
|

| `/_work_flow_id`
| [OBJECT_REF](#OBJECT_REF)
| workflow_id
| no
|

| `/_link:i`
| [LINK](#LINK)
| links
| no
|

| `/_feeder_audit`
| [FEEDER_AUDIT](#FEEDER_AUDIT)
| feeder_audit
| no
|

| `/_uid`
| STRING
| uid.value
| no
|
|===

## ACTION

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_evaluation_class[EVALUATION] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/dv_text": "dv_text in description",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/dv_text2": "dv_text in protocol",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|code": "532",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|value": "completed",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|terminology": "openehr",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/time": "2022-01-31T10:33:28.72414+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/encoding|terminology": "IANA_character-sets"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/dv_text": "dv_text in description",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/dv_text2": "dv_text in protocol",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|code": "532",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|value": "completed",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|terminology": "openehr",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_instruction_details|path": "/content[openEHR-EHR-SECTION.conformance_section.v0]/items[openEHR-EHR-INSTRUCTION.conformance_instruction.v0]",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_instruction_details|composition_uid": "4cdc3017-d8c5-4cd3-9900-f3bb7171d006",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_instruction_details|activity_id": "activities[at0001]",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/time": "2022-01-31T10:33:28.72414+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/encoding|terminology": "IANA_character-sets",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:0|function": "requester",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:0|mode": "face-to-face communication",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:0|name": "Dr. Marcus Johnson",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:0|id": "199",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:0|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:0|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:1|function": "performer",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:1|mode": "not specified",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:1|name": "Lara Markham",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:1|id": "198",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:1|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_other_participation:1|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_guideline_id|type": "GUIDELINE",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_guideline_id|namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_guideline_id|id": "3445",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_guideline_id|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_work_flow_id|type": "WORKFLOW",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_work_flow_id|namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_work_flow_id|id": "335645",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_work_flow_id|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_uid":"9fcc1c70-9349-444d-b9cb-8fa817697f5e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_link:0|type": "problem",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_link:0|meaning": "problem related note",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_link:0|target": "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_feeder_audit/originating_system_audit|version_id": "final",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_feeder_audit/originating_system_audit|system_id": "orig"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/language`
| [CODE_PHRASE](#CODE_PHRASE)
| language
| Yes
|

| `/territory`
| [CODE_PHRASE](#CODE_PHRASE)
| territory
| Yes
|

| `/time`
| [DV_DATE_TIME](#DV_DATE_TIME)
| time
| YES
|

| `/ism_transition`
| [ISM_TRANSITION](#ISM_TRANSITION)
| ism_transition
| Yes
|

| `/_instruction_details`
| [INSTRUCTION_DETAILS](#INSTRUCTION_DETAILS)
| instruction_details
| no
|

| `/subject`
| [PARTY_PROXY](#PARTY_PROXY)
| subject
| no
| will be set to PARTY_SELF if not explicitly set

| `/_guideline_id`
| [OBJECT_REF](#OBJECT_REF)
| guideline_id
| no
|

| `/_work_flow_id`
| [OBJECT_REF](#OBJECT_REF)
| workflow_id
| no
|

| `/_link:i`
| [LINK](#LINK)
| links
| no
|

| `/_feeder_audit`
| [FEEDER_AUDIT](#FEEDER_AUDIT)
| feeder_audit
| no
|

| `/_uid`
| STRING
| uid.value
| no
|
|===

## EVALUATION

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_evaluation_class[EVALUATION] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/dv_text": "dv_text in data",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/dv_text2": "dv_text in protocol",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/encoding|terminology": "IANA_character-sets"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/dv_text": "dv_text in data",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/dv_text2": "dv_text in protocol",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/encoding|terminology": "IANA_character-sets",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:0|function": "requester",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:0|mode": "face-to-face communication",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:0|name": "Dr. Marcus Johnson",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:0|id": "199",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:0|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:0|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:1|function": "performer",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:1|mode": "not specified",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:1|name": "Lara Markham",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:1|id": "198",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:1|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_other_participation:1|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_guideline_id|type": "GUIDELINE",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_guideline_id|namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_guideline_id|id": "3445",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_guideline_id|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_work_flow_id|type": "WORKFLOW",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_work_flow_id|namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_work_flow_id|id": "335645",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_work_flow_id|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_uid":"9fcc1c70-9349-444d-b9cb-8fa817697f5e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_link:0|type": "problem",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_link:0|meaning": "problem related note",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_link:0|target": "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_feeder_audit/originating_system_audit|version_id": "final",
  "conformance-ehrbase.de.v0/conformance_section/conformance_evaluation/_feeder_audit/originating_system_audit|system_id": "orig"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/language`
| [CODE_PHRASE](#CODE_PHRASE)
| language
| Yes
|

| `/territory`
| [CODE_PHRASE](#CODE_PHRASE)
| territory
| Yes
|

| `/subject`
| [PARTY_PROXY](#PARTY_PROXY)
| subject
| no
| will be set to PARTY_SELF if not explicitly set

| `/_guideline_id`
| [OBJECT_REF](#OBJECT_REF)
| guideline_id
| no
|

| `/_work_flow_id`
| [OBJECT_REF](#OBJECT_REF)
| workflow_id
| no
|

| `/_link:i`
| [LINK](#LINK)
| links
| no
|

| `/_feeder_audit`
| [FEEDER_AUDIT](#FEEDER_AUDIT)
| feeder_audit
| no
|

| `/_uid`
| STRING
| uid.value
| no
|
|===

## OBSERVATION

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class[COMPOSITION] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude": 65.9,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text_state": "DV_TEXT in State",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/dv_text": "dv_text in protocol",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/time": "2021-12-21T16:02:58.0094262+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/encoding|terminology": "IANA_character-sets"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude": 65.9,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text_state": "DV_TEXT in State",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/dv_text": "dv_text in protocol",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/time": "2021-12-21T16:02:58.0094262+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/history_origin": "2021-12-20T16:02:58.0094262+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/encoding|terminology": "IANA_character-sets",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/subject|id": "1234-5678",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/subject|id_scheme": "UUID",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/subject|id_namespace": "EHR.NETWORK",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/subject|name": "Silvia Blake",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/subject/_identifier:0|id": "122",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/subject/_identifier:0|issuer": "issuer",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/subject/_identifier:0|assigner": "assigner",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/subject/_identifier:0|type": "type",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/subject/relationship|code": "10",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/subject/relationship|value": "mother",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_provider|name": "Dr. Marcus Johnson",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:0|function": "requester",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:0|mode": "face-to-face communication",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:0|name": "Dr. Marcus Johnson",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:0|id": "199",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:0|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:0|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:1|function": "performer",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:1|mode": "not specified",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:1|name": "Lara Markham",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:1|id": "198",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:1|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_other_participation:1|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_guideline_id|type": "GUIDELINE",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_guideline_id|namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_guideline_id|id": "3445",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_guideline_id|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_work_flow_id|type": "WORKFLOW",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_work_flow_id|namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_work_flow_id|id": "335645",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_work_flow_id|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_uid":"9fcc1c70-9349-444d-b9cb-8fa817697f5e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_link:0|type": "problem",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_link:0|meaning": "problem related note",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_link:0|target": "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/originating_system_audit|version_id": "final",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/originating_system_audit|system_id": "orig",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/original_content": "Hello world!",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/original_content|formalism": "text/plain"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/language`
| [CODE_PHRASE](#CODE_PHRASE)
| language
| Yes
|

| `/territory`
| [CODE_PHRASE](#CODE_PHRASE)
| territory
| Yes
|

| `/history_origin`
| [DV_DATE_TIME](#DV_DATE_TIME)
| history.origin
| no
| will be set to the time of the earliest event if not explicitly set

| `/subject`
| [PARTY_PROXY](#PARTY_PROXY)
| subject
| no
| will be set to PARTY_SELF if not explicitly set

| `/_guideline_id`
| [OBJECT_REF](#OBJECT_REF)
| guideline_id
| no
|

| `/_work_flow_id`
| [OBJECT_REF](#OBJECT_REF)
| workflow_id
| no
|

| `/_link:i`
| [LINK](#LINK)
| links
| no
|

| `/_feeder_audit`
| [FEEDER_AUDIT](#FEEDER_AUDIT)
| feeder_audit
| no
|

| `/_uid`
| STRING
| uid.value
| no
|
|===

## ELEMENT

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_structures.html#_element_class[ELEMENT] class.

====
Using FLAT format there is no difference between an ELEMENT and its value.
====

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude": 65.9,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|unit": "unit"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude": 65.9,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_uid":"9fcc1c70-9349-444d-b9cb-8fa817697f5e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_link:0|type": "problem",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_link:0|meaning": "problem related note",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_link:0|target": "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_feeder_audit/originating_system_audit|version_id": "final",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_feeder_audit/originating_system_audit|system_id": "orig"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_null_flavour|code": "253",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_null_flavour|value": "unknown",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_null_flavour|terminology": "openehr",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_null_reason": "sample reason"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/_null_flavour`
| [DV_CODED_TEXT](#DV_CODED_TEXT)
| null_flavour
| no
|

| `/_null_reason`
| [DV_TEXT](#DV_TEXT)
| null_reason
| no
|

| `/_link:i`
| [LINK](#LINK)
| links
| no
|

| `/_feeder_audit`
| [FEEDER_AUDIT](#FEEDER_AUDIT)
| feeder_audit
| no
|

| `/_uid`
| STRING
| uid.value
| no
|
|===

## CLUSTER

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_structures.html#_cluster_class[CLUSTER] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/conformance_cluster/labresult/text_value": "labresult 4"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/conformance_cluster/labresult/text_value": "labresult 4",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/conformance_cluster/_feeder_audit/originating_system_audit|version_id": "final",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/conformance_cluster/_feeder_audit/originating_system_audit|system_id": "orig",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/conformance_cluster/_uid":"9fcc1c70-9349-444d-b9cb-8fa817697f5e",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/conformance_cluster/_link:0|type": "problem",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/conformance_cluster/_link:0|meaning": "problem related note",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/conformance_cluster/_link:0|target": "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/_link:i`
| [LINK](#LINK)
| links
| no
|

| `/_feeder_audit`
| [FEEDER_AUDIT](#FEEDER_AUDIT)
| feeder_audit
| no
|

| `/_uid`
| STRING
| uid.value
| no
|
|===

## LINK

See RM specification of the https://specifications.openehr.org/releases/RM/latest/common.html#_link_class[LINK] class.

```json
{
  "conformance-ehrbase.de.v0/_link:0|type": "problem",
  "conformance-ehrbase.de.v0/_link:0|meaning": "problem related note",
  "conformance-ehrbase.de.v0/_link:0|target": "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|type`
| STRING
| type.value
| yes
|

| `\|meaning`
| STRING
| meaning.value
| yes
|

| `\|target`
| STRING
| target.value
| yes
|
|===

## FEEDER_AUDIT

See RM specification of the https://specifications.openehr.org/releases/RM/latest/common.html#_feeder_audit_class[FEEDER_AUDIT] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit|system_id": "orig"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit|version_id": "final",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit|system_id": "orig",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/location|id": "12342341",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/location|id_namespace": "uk.org.nmc",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/location|id_scheme": "NMC",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/location|name": "Org 1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/subject|id": "456",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/subject|id_namespace": "uk.org.nmc",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/subject|id_scheme": "NMC",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/subject|name": "Per 1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/provider|id": "456",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/provider|id_namespace": "uk.org.nmc",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/provider|id_scheme": "NMC",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit/provider|name": "Per 1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_audit|time": "2021-12-21T16:02:58.0094262+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_item_id:0|id": "id1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_item_id:0|issuer": "issuer1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_item_id:0|assigner": "assigner1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_item_id:0|type": "PERSON",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_item_id:1|id": "id2",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_item_id:1|issuer": "issuer2",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_item_id:1|assigner": "assigner2",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/originating_system_item_id:1|type": "PERSON",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/original_content": "Hello world!",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/original_content|formalism": "text/plain",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_item_id:0|id": "id1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_item_id:0|issuer": "issuer1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_item_id:0|assigner": "assigner1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_item_id:0|type": "PERSON",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_item_id:1|id": "id2",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_item_id:1|issuer": "issuer2",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_item_id:1|assigner": "assigner2",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_item_id:1|type": "PERSON",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit|version_id": "final",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit|system_id": "orig",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/location|id": "12342341",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/location|id_namespace": "uk.org.nmc",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/location|id_scheme": "NMC",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/location|name": "Org 1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/subject|id": "456",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/subject|id_namespace": "uk.org.nmc",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/subject|id_scheme": "NMC",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/subject|name": "Per 1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/provider|id": "456",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/provider|id_namespace": "uk.org.nmc",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/provider|id_scheme": "NMC",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit/provider|name": "Per 1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/_feeder_audit/feeder_system_audit|time": "2021-12-21T16:02:58.0094262+01:00"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/originating_system_item_id:i`
| [DV_IDENTIFIER](#DV_IDENTIFIER)
| originating_system_item_ids
| no
|

| `/feeder_system_item_id:i`
| [DV_IDENTIFIER](#DV_IDENTIFIER)
| feeder_system_item_ids
| no
|

| `/original_content`
| [DV_PARSABLE](#DV_PARSABLE)
| original_content
| no
| one one of original_content and original_content_multimedia can be set

| `/original_content_multimedia`
| [DV_MULTIMEDIA](#DV_MULTIMEDIA)
| original_content
| no
| one one of original_content and original_content_multimedia can be set

| `/originating_system_audit`
| [PARTY_IDENTIFIED](#PARTY_IDENTIFIED)
| originating_system_audit
| yes
|

| `/feeder_system_audit`
| [FEEDER_AUDIT_DETAILS](#FEEDER_AUDIT_DETAILS)
| feeder_system_audit
| no
|
|===

## FEEDER_AUDIT_DETAILS

See RM specification of the https://specifications.openehr.org/releases/RM/latest/common.html#_feeder_audit_details_class[FEEDER_AUDIT_DETAILS] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit|system_id": "orig"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/subject|id": "1234-5678",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/subject|id_scheme": "UUID",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/subject|id_namespace": "EHR.NETWORK",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/subject|name": "Silvia Blake",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/subject/_identifier:0|id": "122",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/subject/_identifier:0|issuer": "issuer",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/subject/_identifier:0|assigner": "assigner",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/subject/_identifier:0|type": "type",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/provider|id": "1234-5678",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/provider|id_scheme": "UUID",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/provider|id_namespace": "EHR.NETWORK",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/provider|name": "Silvia Blake",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/provider/_identifier:0|id": "122",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/provider/_identifier:0|issuer": "issuer",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/provider/_identifier:0|assigner": "assigner",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/provider/_identifier:0|type": "type",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/location|id": "12342341",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/location|id_scheme": "NMC",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/location|id_namespace": "uk.org.nmc",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit/location|name": "Org 1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit|system_id": "orig",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit|version_id": "final",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/_feeder_audit/feeder_system_audit|time": "2021-12-21T16:02:58.0094262+01:00"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|system_id`
| String
| system_id
| yes
|

| `\|version_id`
| String
| version_id
| no
|

| `\|time`
| String
| time.value
| no
|

| `/subject`
| [PARTY_PROXY](#PARTY_PROXY)
| subject
| no
| add /subject\|_type:"PARTY_SELF" to set this to PARTY_SELF

| `/provider`
| [PARTY_IDENTIFIED](#PARTY_IDENTIFIED)
| provider
| no
|

| `/location`
| [PARTY_IDENTIFIED](#PARTY_IDENTIFIED)
| location
| no
|
|===

## ACTIVITY

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_activity_class[ACTIVITY] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/dv_text": "DV_TEXT 45",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/timing": "R4/2022-01-31T10:00:00+01:00/P3M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/timing|formalism": "timing"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/dv_text": "DV_TEXT 45",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/timing": "R4/2022-01-31T10:00:00+01:00/P3M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/timing|formalism": "timing",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/current_activity/action_archetype_id": "/openEHR-EHR-CLUSTER.conformance_action.v0/"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/timing`
| [DV_PARSABLE](#DV_PARSABLE)
| timing
| no
|

| `/action_archetype_id`
| STRING
| action_archetype_id
| no
| Will be set to /.*/ if not set explicit.
|===

## ISM_TRANSITION

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_activity_class[ACTIVITY] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|code": "532",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|value": "completed",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|terminology": "openehr"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|code": "532",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|value": "completed",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/current_state|terminology": "openehr",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/transition|code": "548",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/transition|value": "finish",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/transition|terminology": "openehr",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/careflow_step|code": "at0006",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/careflow_step|value": "transition",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/careflow_step|terminology": "local",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/ism_transition/_reason:0": "reason 1"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/current_state`
| [DV_CODED_TEXT](#DV_CODED_TEXT)
| current_state
| yes
|

| `/transition`
| [DV_CODED_TEXT](#DV_CODED_TEXT)
| transition
| no
|

| `/careflow_step`
| [DV_CODED_TEXT](#DV_CODED_TEXT)
| careflow_step
| no
|

| `/_reason:i`
| [DV_TEXT](#DV_TEXT)
| reason
| no
|
|===

## INSTRUCTION_DETAILS

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_instruction_details_class[INSTRUCTION_DETAILS] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_instruction_details|path": "/content[openEHR-EHR-SECTION.conformance_section.v0]/items[openEHR-EHR-INSTRUCTION.conformance_instruction.v0]",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_instruction_details|composition_uid": "4cdc3017-d8c5-4cd3-9900-f3bb7171d006",
  "conformance-ehrbase.de.v0/conformance_section/conformance_action/_instruction_details|activity_id": "activities[at0001]"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|path`
| STRING
| instruction_id.path
| yes
|

| `\|composition_uid`
| STRING
| instruction_id.id
| yes
|

| `\|activity_id`
| STRING
| activity_id
| yes
|
|===

## EVENT_CONTEXT

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_event_context_class[EVENT_CONTEXT] class.

```json
{
  "conformance-ehrbase.de.v0/context/start_time": "2021-12-21T14:19:31.649613+01:00",
  "conformance-ehrbase.de.v0/context/setting|code": "238",
  "conformance-ehrbase.de.v0/context/setting|value": "other care",
  "conformance-ehrbase.de.v0/context/setting|terminology": "openehr"
}
```

```json
{
  "conformance-ehrbase.de.v0/context/_health_care_facility|id": "9091",
  "conformance-ehrbase.de.v0/context/_health_care_facility|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/context/_health_care_facility|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/context/_health_care_facility|name": "Hospital",
  "conformance-ehrbase.de.v0/context/_participation:0|function": "requester",
  "conformance-ehrbase.de.v0/context/_participation:0|mode": "face-to-face communication",
  "conformance-ehrbase.de.v0/context/_participation:0|name": "Dr. Marcus Johnson",
  "conformance-ehrbase.de.v0/context/_participation:0|id": "199",
  "conformance-ehrbase.de.v0/context/_participation:0|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/context/_participation:0|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/context/start_time": "2021-12-21T14:19:31.649613+01:00",
  "conformance-ehrbase.de.v0/context/_end_time": "2021-12-21T15:19:31.649613+01:00",
  "conformance-ehrbase.de.v0/context/_location": "Ward A3, Room 12",
  "conformance-ehrbase.de.v0/context/setting|code": "238",
  "conformance-ehrbase.de.v0/context/setting|value": "other care",
  "conformance-ehrbase.de.v0/context/setting|terminology": "openehr"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/start_time`
| [DV_DATE_TIME](#DV_DATE_TIME)
| start_time
| yes
|

| `/setting`
| [DV_CODED_TEXT](#DV_CODED_TEXT)
| setting
| yes
| ValueSet (openEHR `setting` group)

| `/_end_time`
| [DV_DATE_TIME](#DV_DATE_TIME)
| end_time
| no
|

| `/_location`
| String
| location
| no
| Free-text label (e.g. "Ward A3"); not a date-time.

| `/_health_care_facility`
| [PARTY_IDENTIFIED](#PARTY_IDENTIFIED)
| health_care_facility
| no
|

| `/_participation:i`
| [PARTICIPATION](#PARTICIPATION)
| participations
| no
|
|===

NOTE: The `other_context` (RM `ITEM_STRUCTURE`) attribute is not represented as a leaf in this table; archetyped context content is flattened to sit directly under `/context/<node-name>/...`, where `<node-name>` is the identifier derived from the contained archetype (e.g. `/context/organisation/...` for an `openEHR-EHR-CLUSTER.organisation.v0` slot inside `other_context`). The underlying AQL path retains `/context/other_context[at0001]/items[...]`. The leading underscore on `_end_time`, `_location`, `_health_care_facility` and `_participation:i` marks them as optional RM-level attributes (see <<RM Attributes prefix>>).

## PARTICIPATION

See RM specification of the https://specifications.openehr.org/releases/RM/latest/common.html#_participation_class[PARTICIPATION] class.

The `performer` (`PARTY_IDENTIFIED`) is inlined: its attributes are emitted at the same level as `function` and `mode`, rather than nested under `/performer`.

```json
{
  "conformance-ehrbase.de.v0/context/_participation:0|function": "requester",
  "conformance-ehrbase.de.v0/context/_participation:0|mode": "face-to-face communication",
  "conformance-ehrbase.de.v0/context/_participation:0|name": "Dr. Marcus Johnson",
  "conformance-ehrbase.de.v0/context/_participation:0|id": "199",
  "conformance-ehrbase.de.v0/context/_participation:0|id_scheme": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/context/_participation:0|id_namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/context/_participation:0|identifiers_id:0": "122",
  "conformance-ehrbase.de.v0/context/_participation:0|identifiers_issuer:0": "issuer",
  "conformance-ehrbase.de.v0/context/_participation:0|identifiers_assigner:0": "assigner",
  "conformance-ehrbase.de.v0/context/_participation:0|identifiers_type:0": "type"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|function`
| String
| function.value
| yes
|

| `\|mode`
| String
| mode.value
| no
| ValueSet (openEHR `participation mode` group)

| `\|name`
| String
| performer.name
| no
|

| `\|id`
| String
| performer.external_ref.id.value
| no
|

| `\|id_scheme`
| String
| performer.external_ref.id.scheme
| no
|

| `\|id_namespace`
| String
| performer.external_ref.namespace
| (yes)
| required if `\|id` is set. (RM `OBJECT_REF` has `namespace` directly on the reference, not nested under `id`.)

| `\|identifiers_id:i`
| String
| performer.identifiers[i].id
| no
|

| `\|identifiers_issuer:i`
| String
| performer.identifiers[i].issuer
| no
|

| `\|identifiers_assigner:i`
| String
| performer.identifiers[i].assigner
| no
|

| `\|identifiers_type:i`
| String
| performer.identifiers[i].type
| no
|
|===

NOTE: PARTICIPATION's `time` (RM `DV_INTERVAL<DV_DATE_TIME>`) is not currently emitted by FLAT mappings. Entries with a constrained participation `time` interval require the canonical RM JSON form.

### PARTY_RELATED performer

When the `performer` is a `PARTY_RELATED` (a sub-type of `PARTY_IDENTIFIED` that carries a `relationship: DV_CODED_TEXT`), the `relationship` attribute is emitted as a sub-path under the participation, with the standard [DV_CODED_TEXT](#DV_CODED_TEXT) suffixes (`\|code`, `\|value`, `\|terminology`):

```json
{
  "conformance-ehrbase.de.v0/context/_participation:0|function": "next of kin",
  "conformance-ehrbase.de.v0/context/_participation:0|name": "Susan Doe",
  "conformance-ehrbase.de.v0/context/_participation:0/relationship|code": "10",
  "conformance-ehrbase.de.v0/context/_participation:0/relationship|value": "mother",
  "conformance-ehrbase.de.v0/context/_participation:0/relationship|terminology": "openehr"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/relationship`
| [DV_CODED_TEXT](#DV_CODED_TEXT)
| relationship (when `performer` is `PARTY_RELATED`)
| (yes)
| Required when `performer` is a `PARTY_RELATED`; not present otherwise.
|===

NOTE: Implementation status — EHRbase reads and writes this path (`PartyRelatedStdConfig.addRelationship`); Better's `ParticipationToFlatMapper` currently treats the performer as `PARTY_IDENTIFIED` only and does not emit `relationship`. Producers that need cross-implementation portability for a `PARTY_RELATED` performer should either fall back to canonical RM JSON or limit usage to EHRbase-side flows until parity is established.

## OBJECT_REF

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_event_context_class[EVENT_CONTEXT] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_guideline_id|type": "GUIDELINE",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_guideline_id|namespace": "HOSPITAL-NS",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_guideline_id|id": "3445",
  "conformance-ehrbase.de.v0/conformance_section/conformance_instruction/_guideline_id|id_scheme": "HOSPITAL-NS"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|type`
| String
| type
| yes
|

| `\|id`
| String
| id.value
| yes
|

| `\|scheme`
| String
| id.scheme
| yes
|

| `\|namespace`
| String
| namespace
| yes
|
|===

## INTERVAL_EVENT

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_structures.html#_interval_event_class[INTERVAL_EVENT] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude": 65.9,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/width": "P30D",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/math_function|code": "146",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/math_function|value": "mean",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/math_function|terminology": "openehr"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude": 65.9,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0|sample_count": 5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/width": "P30D",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/math_function|code": "146",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/math_function|value": "mean",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/math_function|terminology": "openehr"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/width`
| [DV_DURATION](#DV_DURATION)
| width
| yes
|

| `/math_function`
| [DV_CODED_TEXT](#DV_CODED_TEXT)
| math_function
| yes
|

| `\|sample_count`
| INTEGER
| sample_count
| no
|
|===

## POINT_EVENT

See RM specification of the https://specifications.openehr.org/releases/RM/latest/ehr.html#_event_context_class[EVENT_CONTEXT] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text": "DV_TEXT value",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/time": "2021-12-21T16:02:58.0094262+01:00"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/time`
| [DV_DATE_TIME](#DV_DATE_TIME)
| time
| yes
|
|===

## PARTY_PROXY

See RM specification of the https://specifications.openehr.org/releases/RM/latest/common.html#_party_proxy_class[PARTY_PROXY] class.

See [PARTY_SELF](#PARTY_SELF), [PARTY_IDENTIFIED](#PARTY_IDENTIFIED) and [PARTY_RELATED](#PARTY_RELATED).

## PARTY_SELF

See RM specification of the https://specifications.openehr.org/releases/RM/latest/common.html#_party_self_class[PARTY_SELF] class.

```json
{
  "ctx/composer_self": true,
  "conformance-ehrbase.de.v0/composer|id": "1234-5678",
  "conformance-ehrbase.de.v0/composer|id_scheme": "UUID",
  "conformance-ehrbase.de.v0/composer|id_namespace": "EHR.NETWORK"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|id`
| String
| external_ref.id.value
| no
|

| `\|id_scheme`
| Integer
| external_ref.id.scheme
| no
|

| `\|id_namespace`
| String
| external_ref.namespace
| (yes)
| required if id is set
|===

## PARTY_IDENTIFIED

See RM specification of the https://specifications.openehr.org/releases/RM/latest/common.html#_party_identified_class[PARTY_IDENTIFIED] class.

```json
{
  "conformance-ehrbase.de.v0/composer|name": "Silvia Blake"
}
```

```json
{
  "conformance-ehrbase.de.v0/composer|name": "Silvia Blake",
  "conformance-ehrbase.de.v0/composer|id": "1234-5678",
  "conformance-ehrbase.de.v0/composer|id_scheme": "UUID",
  "conformance-ehrbase.de.v0/composer|id_namespace": "EHR.NETWORK",
  "conformance-ehrbase.de.v0/composer/_identifier:0|id": "122",
  "conformance-ehrbase.de.v0/composer/_identifier:0|issuer": "issuer",
  "conformance-ehrbase.de.v0/composer/_identifier:0|assigner": "assigner",
  "conformance-ehrbase.de.v0/composer/_identifier:0|type": "type"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|name`
| String
| name
| no
|

| `\|id`
| String
| external_ref.id.value
| no
|

| `\|id_scheme`
| Integer
| external_ref.id.scheme
| no
|

| `\|id_namespace`
| String
| external_ref.namespace
| (yes)
| required if id is set

| `/_identifier:i`
| [DV_IDENTIFIER](#DV_IDENTIFIER)
| identifiers
| no
|
|===

## PARTY_RELATED

See RM specification of the https://specifications.openehr.org/releases/RM/latest/common.html#_party_related_class[PARTY_RELATED] class.

```json
{
  "conformance-ehrbase.de.v0/composer|name": "Silvia Blake",
  "conformance-ehrbase.de.v0/composer/relationship|code": "10",
  "conformance-ehrbase.de.v0/composer/relationship|value": "mother",
  "conformance-ehrbase.de.v0/composer/relationship|terminology": "openehr"
}
```

```json
{
  "conformance-ehrbase.de.v0/composer|name": "Silvia Blake",
  "conformance-ehrbase.de.v0/composer|id": "1234-5678",
  "conformance-ehrbase.de.v0/composer|id_scheme": "UUID",
  "conformance-ehrbase.de.v0/composer|id_namespace": "EHR.NETWORK",
  "conformance-ehrbase.de.v0/composer/relationship|code": "10",
  "conformance-ehrbase.de.v0/composer/relationship|value": "mother",
  "conformance-ehrbase.de.v0/composer/relationship|terminology": "openehr",
  "conformance-ehrbase.de.v0/composer/_identifier:0|id": "122",
  "conformance-ehrbase.de.v0/composer/_identifier:0|issuer": "issuer",
  "conformance-ehrbase.de.v0/composer/_identifier:0|assigner": "assigner",
  "conformance-ehrbase.de.v0/composer/_identifier:0|type": "type"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|name`
| String
| name
| no
|

| `\|id`
| String
| external_ref.id.value
| no
|

| `\|id_scheme`
| Integer
| external_ref.id.scheme
| no
|

| `\|id_namespace`
| String
| external_ref.namespace
| (yes)
| required if id is set

| `/_identifier:i`
| [DV_IDENTIFIER](#DV_IDENTIFIER)
| identifiers
| no
|

| `/_relationship`
| [DV_CODED_TEXT](#DV_CODED_TEXT)
| relationship
| (yes)
|
|===

## DV_TEXT

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_text_class[DV_TEXT] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text": "DV_TEXT value"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text": "DV_TEXT value",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text|formatting": "plain",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_language|preferred_term": "English",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_encoding|terminology": "IANA_character-sets",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0|match": "=",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/target|terminology": "SNOMED-CT",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/target|code": "21794005",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/purpose|terminology": "openehr",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/purpose|code": "671",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/purpose|value": "research study"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|value`
| String
| value
| yes
|

| `\|formatting`
| String
| formatting
| no
|

| `/_language`
| [CODE_PHRASE](#CODE_PHRASE)
| language
| no
|

| `/_encoding`
| [CODE_PHRASE](#CODE_PHRASE)
| encoding
| no
|

| `/_mapping:i`
| [TERM_MAPPING](#TERM_MAPPING)
| mappings
| no
|
|===

## CODE_PHRASE

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_code_phrase_class[CODE_PHRASE] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_language|terminology": "ISO_639-1"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_language|preferred_term": "English"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|code`
| String
| code_string
| yes
|

| `\|terminology`
| String
| terminology_id.value
| yes
|

| `\|preferred_term`
| String
| preferred_term
| no
|
|===

## TERM_MAPPING

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_term_mapping_class[TERM_MAPPING] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0|match": "=",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/target|terminology": "SNOMED-CT",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/target|code": "21794005"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0|match": "=",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/target|terminology": "SNOMED-CT",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/target|code": "21794005",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/purpose|terminology": "openehr",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/purpose|code": "671",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_text/_mapping:0/purpose|value": "research study"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|match`
| String
| match
| yes
|

| `/target`
| [CODE_PHRASE](#CODE_PHRASE)
| target
| yes
|

| `/purpose`
| [DV_CODED_TEXT](#DV_CODED_TEXT)
| purpose
| no
|
|===

## DV_CODED_TEXT

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_coded_text_class[DV_CODED_TEXT] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text|value": "term1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text|code": "at0006",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text|terminology": "local"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text|value": "term1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text|code": "at0006",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text|terminology": "local",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text|preferred_term": "Term One",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text|formatting": "plain",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_language|preferred_term": "English",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_encoding|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_encoding|terminology": "IANA_character-sets",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_mapping:0|match": "=",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_mapping:0/target|terminology": "SNOMED-CT",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_mapping:0/target|code": "21794005",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_mapping:0/purpose|terminology": "openehr",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_mapping:0/purpose|code": "671",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text/_mapping:0/purpose|value": "research study"
}
```

Free-text value when the archetype constraint allows an open value-set (`listOpen: true` in the web template):

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_coded_text|other": "free-text value not in the coded list"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|code`
| String
| defining_code.code_string
| yes
|

| `\|value`
| String
| value
| (yes)
| only required for external terminologies

| `\|terminology`
| String
| defining_code.terminology_id.value
| (yes)
| only required for external terminologies

| `\|preferred_term`
| String
| defining_code.preferred_term
| no
| Optional preferred display rubric for the `defining_code`. See the `\|preferred_term` row of [CODE_PHRASE](#CODE_PHRASE) for the analogous mapping on a bare `CODE_PHRASE`.

| `\|other`
| String
| _value_ (as `[DV_TEXT](#DV_TEXT)`)
| no
| Free-text value used when the constraint allows an open value-set (`listOpen: true` in the web template). When `\|other` is set, `\|code`, `\|value`, `\|terminology` and `\|preferred_term` MUST NOT be set; the leaf is serialised in the canonical RM as a `DV_TEXT` rather than a `DV_CODED_TEXT`.

| `\|formatting`
| String
| formatting
| no
|

| `/_language`
| [CODE_PHRASE](#CODE_PHRASE)
| language
| no
|

| `/_encoding`
| [CODE_PHRASE](#CODE_PHRASE)
| encoding
| no
|

| `/_mapping:i`
| [TERM_MAPPING](#TERM_MAPPING)
| mappings
| no
|
|===

### When a `DV_CODED_TEXT` becomes a `DV_TEXT`

Where the archetype constraint allows an open value-set (`listOpen: true` in the web template; non-`limit-to-list` in ADL), a leaf bound to `DV_CODED_TEXT` may be populated with a free-text value via the `\|other` suffix. In that case:

* the canonical RM serialisation of the leaf is a [DV_TEXT](#DV_TEXT), not a `DV_CODED_TEXT` with empty `defining_code`;
* `\|other` is mutually exclusive with `\|code`, `\|value`, `\|terminology` and `\|preferred_term` on the same leaf;
* on a closed list (`listOpen: false`), `\|other` MUST be rejected.

See <<open_value_sets>> for the cross-cutting rule and rationale.

## DV_ORDINAL

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ordinal_class[DV_ORDINAL] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal|code": "at0015",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal|value": "value1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal|ordinal": 1
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal|code": "at0015",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal|value": "value1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal|ordinal": 1,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_normal_range/lower|code": "at0015",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_normal_range/lower|value": "value1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_normal_range/lower|ordinal": 1,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_normal_range/upper|code": "at0015",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_normal_range/upper|value": "value1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_normal_range/upper|ordinal": 1,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_other_reference_ranges:0/lower|code": "at0016",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_other_reference_ranges:0/lower|value": "value2",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_other_reference_ranges:0/lower|ordinal": 2,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_other_reference_ranges:0|upper_unbounded": true,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_other_reference_ranges:0|upper_included": false,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ordinal/_other_reference_ranges:0/meaning": "high"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|code`
| String
| symbol.defining_code.code_string
| Yes
|

| `\|value`
| String
| symbol.value
| (Yes)
| my be left out if symbol is defined in template

| `\|ordinal`
| Integer
| value
| (Yes)
| my be left out if symbol is defined in template

| `/_normal_range`
| [DV_INTERVAL](#DV_INTERVAL) <DV_ORDINAL>
| normal_range
| no
|

| `/_other_reference_ranges:i`
| [REFERENCE_RANGE](#REFERENCE_RANGE) <DV_ORDINAL>
| `_other_reference_ranges`
| no
|
|===

## DV_BOOLEAN

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_boolean_class[DV_BOOLEAN] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_boolean": true
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

|
| Boolean
| value
| Yes
|
|===

## DV_URI

See RM specification of the https://specifications.openehr.org/releases/RM/Release-1.0.4/data_types.html#_dv_uri_class[DV_URI] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_uri": "https://www.google.com/"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

|
| String
| value
| Yes
|
|===

## DV_EHR_URI

See RM specification of the https://specifications.openehr.org/releases/RM/Release-1.0.4/data_types.html#_dv_ehr_uri_class[DV_EHR_URI] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_ehr_uri": "ehr://766b3873-0762-4921-91e2-838c8546d47f"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

|
| String
| value
| Yes
|
|===

## DV_IDENTIFIER

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_quantity_class[DV_QUANTITY] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_identifier|id": "A123"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_identifier|id": "A123",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_identifier|issuer": "Issuer",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_identifier|assigner": "Assigner",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_identifier|type": "Prescription"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|id`
| String
| id
| Yes
| For the input \|id might be left out.

| `\|issuer`
| String
| issuer
| no
|

| `\|assigner`
| String
| assigner
| no
|

| `\|type`
| String
| type
| no
|
|===

## DV_QUANTITY

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_quantity_class[DV_QUANTITY] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude": 65.9,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|unit": "unit"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude": 65.9,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|magnitude_status": "~",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|normal_status": "N",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|accuracy": 50.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|accuracy_is_percent": true,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|precision": 1,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|units_system": "units_system",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity|units_display_name": "units_display_name",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_normal_range/lower|magnitude": 20.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_normal_range/lower|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_normal_range/upper|magnitude": 66.6,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_normal_range/upper|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/lower|magnitude": 70.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/lower|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/upper|magnitude": 77.6,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/upper|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/meaning|value": "very high",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/meaning|code": "260360000",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/meaning|terminology": "SNOMED-CT"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|magnitude`
| String
| magnitude
| yes
|

| `\|unit`
| Real
| unit
| yes
|

| `\|magnitude_status`
| String
| magnitude_status
| no
| ValueSet (=,>,>=,<,\<=,~)

| `\|normal_status`
| String
| normal_status.code_string
| no
| ValueSet `normal_statuses` (codes `HHH`, `HH`, `H`, `N`, `L`, `LL`, `LLL`). The FLAT carries only the `code_string`; the underlying `CODE_PHRASE` terminology is implicitly `openehr`.

| `\|accuracy`
| Real
| accuracy
| no
|

| `\|accuracy_is_percent`
| Boolean
| accuracy_is_percent
| no
|

| `/_normal_range`
| [DV_INTERVAL](#DV_INTERVAL) <DV_QUANTITY>
| normal_range
| no
|

| `/_other_reference_ranges:i`
| [REFERENCE_RANGE](#REFERENCE_RANGE) <DV_QUANTITY>
| `_other_reference_ranges`
| no
|
|===

## DV_PROPORTION

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_proportion_class[DV_PROPORTION] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|numerator": 20.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|denominator": 12.4,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|type": 0
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|numerator": 20.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|denominator": 12.4,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|type": 0,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion": 1.6532258064516128,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|magnitude_status": "~",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|normal_status": "N",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|accuracy": 50.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|accuracy_is_percent": true,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion|precision": 1,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_normal_range/lower|numerator": 20.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_normal_range/lower|denominator": 12.4,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_normal_range/lower|type": 0,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_normal_range/lower": 1.6532258064516128,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_normal_range/upper|numerator": 25.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_normal_range/upper|denominator": 12.4,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_normal_range/upper|type": 0,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_normal_range/upper": 2.0564516129032255,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_other_reference_ranges:0/lower|numerator": 20.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_other_reference_ranges:0/lower|denominator": 18.4,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_other_reference_ranges:0/lower|type": 0,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_other_reference_ranges:0/lower": 1.1141304347826089,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_other_reference_ranges:0/upper|numerator": 25.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_other_reference_ranges:0/upper|denominator": 12.4,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_other_reference_ranges:0/upper|type": 0,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_other_reference_ranges:0/upper": 2.0564516129032255,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_proportion/_other_reference_ranges:0/meaning": "high"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|numerator`
| Real
| numerator
| yes
|

| `\|denominator`
| Real
| denominator
| yes
|

| `\|type`
| Integer
| type
| yes
| ValueSet proportion_kind

| `\|precision`
| Integer
| precision
| no
| Number of decimal places to which `\|numerator` and `\|denominator` are expressed. Value `0` implies integral; `-1` implies no limit.

|
| Real
| magnitude
| no
| calculated on output

| `\|magnitude_status`
| String
| magnitude_status
| no
| ValueSet (=,>,>=,<,\<=,~)

| `\|accuracy`
| Real
| accuracy
| no
| Half-range accuracy of measurement. Interpretation depends on `\|accuracy_is_percent`. A value of `0` means accuracy is 100% (no error).

| `\|accuracy_is_percent`
| Boolean
| accuracy_is_percent
| no
| When `true`, `\|accuracy` is a percentage (0–100); when `false` or absent, `\|accuracy` is an absolute quantity in the same units as the value.

| `\|normal_status`
| String
| normal_status.code_string
| no
| ValueSet `normal_statuses` (codes `HHH`, `HH`, `H`, `N`, `L`, `LL`, `LLL`). The FLAT carries only the `code_string`; the underlying `CODE_PHRASE` terminology is implicitly `openehr`.

| `/_normal_range`
| [DV_INTERVAL](#DV_INTERVAL) <DV_PROPORTION>
| normal_range
| no
|

| `/_other_reference_ranges:i`
| [REFERENCE_RANGE](#REFERENCE_RANGE) <DV_PROPORTION>
| `_other_reference_ranges`
| no
|
|===

## DV_COUNT

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_count_class[DV_COUNT] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count": 7
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count": 7,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count|magnitude_status": "~",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count|normal_status": "N",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count|accuracy": 50.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count|accuracy_is_percent": true,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count/_normal_range/lower": 1,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count/_normal_range/upper": 8,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count/_other_reference_ranges:0/lower": 8,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count/_other_reference_ranges:0/upper": 10,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_count/_other_reference_ranges:0/meaning": "high"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

|
| Integer
| magnitude
| Yes
|

| `\|magnitude_status`
| String
| magnitude_status
| no
| ValueSet (=,>,>=,<,\<=,~)

| `\|normal_status`
| String
| normal_status.code_string
| no
| ValueSet `normal_statuses` (codes `HHH`, `HH`, `H`, `N`, `L`, `LL`, `LLL`). The FLAT carries only the `code_string`; the underlying `CODE_PHRASE` terminology is implicitly `openehr`.

| `\|accuracy`
| Real
| accuracy
| no
| Half-range accuracy of measurement. Interpretation depends on `\|accuracy_is_percent`. A value of `0` means accuracy is 100% (no error).

| `\|accuracy_is_percent`
| Boolean
| accuracy_is_percent
| no
| When `true`, `\|accuracy` is a percentage (0–100); when `false` or absent, `\|accuracy` is an absolute quantity in the same units as the value.

| `/_normal_range`
| [DV_INTERVAL](#DV_INTERVAL) <DV_COUNT>
| normal_range
| no
|

| `/_other_reference_ranges:i`
| [REFERENCE_RANGE](#REFERENCE_RANGE) <DV_COUNT>
| `_other_reference_ranges`
| no
|
|===

## DV_DATE

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_date_class[DV_DATE] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date": "2022-01-12"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date": "2022-01-12",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date|magnitude_status": "~",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date|normal_status": "N",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date/_accuracy": "P2D",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date/_normal_range/lower": "2022-01-12",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date/_normal_range/upper": "2022-02-12",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date/_other_reference_ranges:0/lower": "2022-02-12",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date/_other_reference_ranges:0/upper": "2022-03-12",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date/_other_reference_ranges:0/meaning": "high"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

|
| String
| value
| Yes
| ISO8601 date

| `/_accuracy`
| [DV_DURATION](#DV_DURATION)
| accuracy
| no
|

| `\|magnitude_status`
| String
| magnitude_status
| no
| ValueSet (=,>,>=,<,\<=,~)

| `\|normal_status`
| String
| normal_status.code_string
| no
| ValueSet `normal_statuses` (codes `HHH`, `HH`, `H`, `N`, `L`, `LL`, `LLL`). The FLAT carries only the `code_string`; the underlying `CODE_PHRASE` terminology is implicitly `openehr`.

| `/_normal_range`
| [DV_INTERVAL](#DV_INTERVAL) <DV_DATE>
| normal_range
| no
|

| `/_other_reference_ranges:i`
| [REFERENCE_RANGE](#REFERENCE_RANGE) <DV_DATE>
| `_other_reference_ranges`
| no
|
|===

## DV_DATE_TIME

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_date_time_class[DV_DATE_TIME] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date_time": "2022-01-12T13:22:34.000868+01:00"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date_time": "2022-01-12T13:22:34.000868+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date_time|magnitude_status": "~",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date_time|normal_status": "N",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date_time/_accuracy": "P2DT9H52M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date_time/_normal_range/lower": "2022-01-12T13:22:34.000868+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date_time/_normal_range/upper": "2022-02-12T13:22:34.000868+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date_time/_other_reference_ranges:0/lower": "2022-02-12T13:22:34.000868+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date_time/_other_reference_ranges:0/upper": "2022-03-12T13:22:34.000868+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_date_time/_other_reference_ranges:0/meaning": "high"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

|
| String
| value
| Yes
| ISO8601 date-time

| `/_accuracy`
| [DV_DURATION](#DV_DURATION)
| accuracy
| no
|

| `\|magnitude_status`
| String
| magnitude_status
| no
| ValueSet (=,>,>=,<,\<=,~)

| `\|normal_status`
| String
| normal_status.code_string
| no
| ValueSet `normal_statuses` (codes `HHH`, `HH`, `H`, `N`, `L`, `LL`, `LLL`). The FLAT carries only the `code_string`; the underlying `CODE_PHRASE` terminology is implicitly `openehr`.

| `/_normal_range`
| [DV_INTERVAL](#DV_INTERVAL) <DV_DATE_TIME>
| normal_range
| no
|

| `/_other_reference_ranges:i`
| [REFERENCE_RANGE](#REFERENCE_RANGE) <DV_DATE_TIME>
| `_other_reference_ranges`
| no
|
|===

## DV_TIME

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_time_class[DV_TIME] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_time": "13:22:34.000868+01:00"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_time": "13:22:34.000868+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_time|magnitude_status": "~",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_time|normal_status": "N",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_time/_accuracy": "PT9H52M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_time/_normal_range/lower": "13:22:34.000868+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_time/_normal_range/upper": "14:22:34.000868+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_time/_other_reference_ranges:0/lower": "14:10:34.000868+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_time/_other_reference_ranges:0/upper": "15:22:34.000868+01:00",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_time/_other_reference_ranges:0/meaning": "high"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

|
| String
| value
| Yes
| ISO8601 time

| `/_accuracy`
| [DV_DURATION](#DV_DURATION)
| accuracy
| no
|

| `\|magnitude_status`
| String
| magnitude_status
| no
| ValueSet (=,>,>=,<,\<=,~)

| `\|normal_status`
| String
| normal_status.code_string
| no
| ValueSet `normal_statuses` (codes `HHH`, `HH`, `H`, `N`, `L`, `LL`, `LLL`). The FLAT carries only the `code_string`; the underlying `CODE_PHRASE` terminology is implicitly `openehr`.

| `/_normal_range`
| [DV_INTERVAL](#DV_INTERVAL) <DV_TIME>
| normal_range
| no
|

| `/_other_reference_ranges:i`
| [REFERENCE_RANGE](#REFERENCE_RANGE) <DV_TIME>
| `_other_reference_ranges`
| no
|
|===

## DV_DURATION

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_duration_class[DV_DURATION] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration": "P2DT11H33M"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration": "P2DT11H33M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration|magnitude_status": "~",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration|normal_status": "N",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration|accuracy": 50.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration|accuracy_is_percent": true,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration/_normal_range/lower": "P2DT11H33M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration/_normal_range/upper": "P2DT12H33M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration/_other_reference_ranges:0/lower": "P2DT11H33M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration/_other_reference_ranges:0/upper": "P2DT15H33M",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_duration/_other_reference_ranges:0/meaning": "high"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

|
| String
| value
| Yes
| ISO8601 duration

| `\|accuracy`
| Real
| accuracy
| no
|

| `\|accuracy_is_percent`
| Boolean
| accuracy_is_percent
| no
|

| `\|magnitude_status`
| String
| magnitude_status
| no
| ValueSet (=,>,>=,<,\<=,~)

| `\|normal_status`
| String
| normal_status.code_string
| no
| ValueSet `normal_statuses` (codes `HHH`, `HH`, `H`, `N`, `L`, `LL`, `LLL`). The FLAT carries only the `code_string`; the underlying `CODE_PHRASE` terminology is implicitly `openehr`.

| `/_normal_range`
| [DV_INTERVAL](#DV_INTERVAL) <DV_DURATION>
| normal_range
| no
|

| `/_other_reference_ranges:i`
| [REFERENCE_RANGE](#REFERENCE_RANGE) <DV_DURATION>
| `_other_reference_ranges`
| no
|
|===

## REFERENCE_RANGE

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_reference_range_class[REFERENCE_RANGE] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/lower|magnitude": 70.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/lower|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/upper|magnitude": 77.6,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/upper|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/meaning|value": "high"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/lower|magnitude": 70.5,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/lower|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0|upper_unbounded": true,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0|upper_included": false,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/meaning|value": "very high",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/meaning|code": "260360000",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:0/meaning|terminology": "SNOMED-CT",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:1|lower_unbounded": true,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:1|lower_included": false,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:1/upper|magnitude": 77.6,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:1/upper|unit": "unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:1/meaning|value": "very high",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:1/meaning|code": "260360000",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_quantity/_other_reference_ranges:1/meaning|terminology": "SNOMED-CT"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/lower`
| T
| range.lower
| no
|

| `/upper`
| T
| range.upper
| no
|

| `\|lower_unbounded`
| Boolean
| range.lower_unbounded
| no
| defaults to false

| `\|upper_unbounded`
| Boolean
| range.upper_unbounded
| no
| defaults to false

| `\|lower_included`
| Boolean
| range.lower_included
| no
| defaults to true

| `\|upper_included`
| Boolean
| range.upper_included
| no
| defaults to true

| \meaning
| [DV_TEXT](#DV_TEXT)
| meaning
| yes
|
|===

## DV_PARSABLE

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_parsable_class[DV_PARSABLE] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_parsable": "Formal instructions on carrying out the procedure...",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_parsable|formalism": "GLIF 1.0"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_parsable": "Formal instructions on carrying out the procedure...",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_parsable|formalism": "GLIF 1.0",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_parsable/_language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_parsable/_language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_parsable/_charset|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_parsable/_charset|terminology": "IANA_character-sets"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `\|value`
| String
| value
| Yes
|

| `\|formalism`
| String
| formalism
| Yes
|

| `/_charset`
| [CODE_PHRASE](#CODE_PHRASE)
| charset
| no
|

| `/_language`
| [CODE_PHRASE](#CODE_PHRASE)
| language
| no
|
|===

## DV_MULTIMEDIA

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_multimedia_class[DV_MULTIMEDIA] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia": "http://med.tube.com/sample",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia|mediatype": "video/H261",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia|size": 504903212
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia": "http://med.tube.com/sample",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia|mediatype": "video/H261",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia|size": 504903212,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia|compression_algorithm": "zlib",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia|alternatetext": "alternate text",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia|integrity_check": "b90360558e5420cef47015b1afbd70a156f940afa470b0515f95eacc2edcef6a",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia|integrity_check_algorithm": "SHA-256",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia/_thumbnail|data": "Z2hnZ2pnamdnag==",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia/_thumbnail|mediatype": "image/png",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia/_thumbnail|size": 504,
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia/_language|code": "en",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia/_language|terminology": "ISO_639-1",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia/_charset|code": "UTF-8",
  "conformance-ehrbase.de.v0/conformance_section/conformance_observation/any_event:0/dv_multimedia/_charset|terminology": "IANA_character-sets"
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

|
| String
| uri.value
| no
|

| `\|mediatype`
| String
| media_type.code_string
| Yes
| ValueSet (IANA_media-types)

| `\|size`
| Integer
| size
| Yes
|

| `\|alternatetext`
| String
| alternate_text
| no
|

| `\|compression_algorithm`
| String
| compression_algorithm.code_string
| no
| ValueSet (openehr_compression_algorithms)

| `\|integrity_check_algorithm`
| String
| integrity_check_algorithm
| no
| ValueSet (openehr_integrity_check_algorithms)

| `\|integrity_check`
| String
| integrity_check
| no
|

| `\|data`
| String
| dta
| no
|

| `/_thumbnail`
| [DV_MULTIMEDIA](#DV_MULTIMEDIA)
| thumbnail
| no
|

| `/_charset`
| [CODE_PHRASE](#CODE_PHRASE)
| charset
| no
|

| `/_language`
| [CODE_PHRASE](#CODE_PHRASE)
| language
| no
|
|===

## DV_INTERVAL

See RM specification of the https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_interval_class[DV_INTERVAL] class.

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_interval/any_event:0/interval_dv_quantity/lower|magnitude": 72.83,
  "conformance-ehrbase.de.v0/conformance_section/conformance_interval/any_event:0/interval_dv_quantity/lower|unit": "Unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_interval/any_event:0/interval_dv_quantity/upper|magnitude": 80.83,
  "conformance-ehrbase.de.v0/conformance_section/conformance_interval/any_event:0/interval_dv_quantity/upper|unit": "Unit"
}
```

```json
{
  "conformance-ehrbase.de.v0/conformance_section/conformance_interval/any_event:0/interval_dv_quantity/lower|magnitude": 72.83,
  "conformance-ehrbase.de.v0/conformance_section/conformance_interval/any_event:0/interval_dv_quantity/lower|unit": "Unit",
  "conformance-ehrbase.de.v0/conformance_section/conformance_interval/any_event:0/interval_dv_quantity|lower_included": false,
  "conformance-ehrbase.de.v0/conformance_section/conformance_interval/any_event:0/interval_dv_quantity|upper_unbounded": true,
  "conformance-ehrbase.de.v0/conformance_section/conformance_interval/any_event:0/interval_dv_quantity|upper_included": false
}
```

|===
| Flat Path
| Flat type
| RM Path
| Required
| Note

| `/lower`
| T
| lower
| no
|

| `/upper`
| T
| upper
| no
|

| `\|lower_unbounded`
| BOOLEAN
| `\|lower_unbounded`
| no
| defaults to false. only in output if true

| `\|upper_unbounded`
| BOOLEAN
| upper_unbounded
| no
| defaults to false, only in output if true

| `\|lower_included`
| BOOLEAN
| lower_included
| no
| defaults to true. only in output if false

| `\|upper_included`
| BOOLEAN
| upper_included
| no
| defaults to true. only in output if false
|===
# Context Information

To simplify the input, the flat formate offers the option to set context values which set default values in the rm-tree.

```json
{
  "ctx/language": "de",
  "ctx/territory": "US",
  "ctx/time": "2021-04-01T12:40:31.418954+02:00",
  "ctx/composer_name": "Silvia Blake",
  "ctx/composer_id": "123",
  "ctx/id_namespace": "HOSPITAL-NS",
  "ctx/id_scheme": "HOSPITAL-NS",
  "ctx/work_flow_id|id": "567",
  "ctx/work_flow_id|id_scheme": "HOSPITAL-NS",
  "ctx/work_flow_id|namespace": "HOSPITAL-NS",
  "ctx/work_flow_id|type": "ORGANISATION",
  "ctx/participation_name:0": "Dr. Marcus Johnson",
  "ctx/participation_function:0": "requester",
  "ctx/participation_mode:0": "face-to-face communication",
  "ctx/participation_id:0": "199",
  "ctx/participation_identifiers:0": "issuer1::assigner1::id1::PERSON;issuer2::assigner2::id2::PERSON",
  "ctx/participation_name:1": "Lara Markham",
  "ctx/participation_function:1": "performer",
  "ctx/participation_id:1": "198",
  "ctx/participation_identifiers:1|issuer:0": "issuer3",
  "ctx/participation_identifiers:1|assigner:0": "assigner3",
  "ctx/participation_identifiers:1|id:0": "id3",
  "ctx/participation_identifiers:1|type:0": "PERSON",
  "ctx/participation_identifiers:1|issuer:1": "issuer4",
  "ctx/participation_identifiers:1|assigner:1": "assigner4",
  "ctx/participation_identifiers:1|id:1": "id4",
  "ctx/participation_identifiers:1|type:1": "PERSON",
  "ctx/health_care_facility|name": "Hospital",
  "ctx/health_care_facility|id": "9091"
}
```

## Composer

```json
{
  "ctx/composer_name": "Silvia Blake",
  "ctx/composer_id": "123",
  "ctx/id_namespace": "HOSPITAL-NS",
  "ctx/id_scheme": "HOSPITAL-NS"
}
```

```json
{
  "ctx/composer_self": true,
  "ctx/composer_id": "123",
  "ctx/id_namespace": "HOSPITAL-NS",
  "ctx/id_scheme": "HOSPITAL-NS"
}
```

* `composer_name`: sets composer to party identified and sets the name
* `composer_self`: sets composer to party_self
* `composer_id`: sets composer `external_ref.id.value` and sets it to party identified unless composer_self is set to true

## ID Namespace and Scheme

```json
{
  "ctx/composer_id": "123",
  "ctx/id_namespace": "HOSPITAL-NS",
  "ctx/id_scheme": "HOSPITAL-NS"
}
```

* `id_namespace`: default namespace for external references: `OBJECT_REF.namespace`
* `id_scheme`: default scheme for external references: `OBJECT_REF.id.scheme`

## Language and Territory

```json
{
  "ctx/language": "de",
  "ctx/territory": "US"
}
```

* `language`: set the default language for `ENTRY.language` && `COMPOSITION.language`
* `territory`: set the default territory for `COMPOSITION.territory`

## Workflow ID

```json
{
  "ctx/work_flow_id|id": "567",
  "ctx/work_flow_id|id_scheme": "HOSPITAL-NS",
  "ctx/work_flow_id|namespace": "HOSPITAL-NS",
  "ctx/work_flow_id|type": "ORGANISATION"
}
```

* set the default for `ENTRY.workflow_id`
* `work_flow_id|id_scheme` can be left out if `ctx/id_scheme` is set
* `work_flow_id|namespace` can be left out if `ctx/namespace` is set

## Participation

```json
{
  "ctx/participation_name:0": "Dr. Marcus Johnson",
  "ctx/participation_function:0": "requester",
  "ctx/participation_mode:0": "face-to-face communication",
  "ctx/participation_id:0": "199",
  "ctx/participation_identifiers:0": "issuer1::assigner1::id1::PERSON;issuer2::assigner2::id2::PERSON",

  "ctx/participation_name:1": "Lara Markham",
  "ctx/participation_function:1": "performer",
  "ctx/participation_id:1": "198",
  "ctx/participation_identifiers:1|issuer:0": "issuer3",
  "ctx/participation_identifiers:1|assigner:0": "assigner3",
  "ctx/participation_identifiers:1|id:0": "id3",
  "ctx/participation_identifiers:1|type:0": "PERSON",
  "ctx/participation_identifiers:1|issuer:1": "issuer4",
  "ctx/participation_identifiers:1|assigner:1": "assigner4",
  "ctx/participation_identifiers:1|id:1": "id4",
  "ctx/participation_identifiers:1|type:1": "PERSON"
}
```

* sets the default for `EVENT_CONTEXT.participations` and `ENTRY.other_participations`
* `participation_identifiers` can be set in a compact or non compat form.

## health_care_facility

```json
{
  "ctx/health_care_facility|name": "Hospital",
  "ctx/health_care_facility|id": "9091",
  "ctx/id_namespace": "HOSPITAL-NS",
  "ctx/id_scheme": "HOSPITAL-NS"
}
```

set the default for `COMPOSITION.context.health_care_facility`

## time

```json
{
  "ctx/time": "2021-04-01T12:40:31.418954+02:00"
}
```

* set the default time for `ACTION.time`, `COMPOSITION.context.start_time`, `OBSERVATION.history.origin`
* `EVENT.time` will be set to history.origin (plus offset if set to a minimum in the template)
* `ctx/time` will be set to `now()` if not set explicitly

## end_time

```json
{
  "ctx/end_time": "2021-05-01T12:40:31.418954+02:00"
}
```

* set the default time `COMPOSITION.context.end_time`

## history_origin

```json
{
  "ctx/history_origin": "2021-05-01T12:40:31.418954+02:00"
}
```

* set the default time for `OBSERVATION.history.origin`
* `EVENT.time` will be set to history.origin (plus offset if set to a minimum in the template)

## action_time

```json
{
  "ctx/action_time": "2021-05-01T12:40:31.418954+02:00"
}
```

* set the default time for `ACTION.time`

## activity_timing

```json
{
  "ctx/activity_timing": "R4/2022-01-31T10:00:00+01:00/P3M"
}
```

* set the default for `ACTIVITY.timing`

## provider

```json
{
  "ctx/provider_name": "Silvia Blake",
  "ctx/provider_id": "123",
  "ctx/id_namespace": "HOSPITAL-NS",
  "ctx/id_scheme": "HOSPITAL-NS"
}
```

* set the default `PARTY_IDENTIFIED` for `ENTRY.provider`

## action_ism_transition_current_state

```json
{
  "ctx/action_ism_transition_current_state": "completed"
}
```

```json
{
  "ctx/action_ism_transition_current_state": "532"
}
```

* set the default for `ACTION.ism_transition.current_state`
* either value or code is accepted

## instruction_narrative

```json
{
  "ctx/instruction_narrative": "Human readable instruction narrative"
}
```

* set the default for `INSTRUCTION.narrative`

## location

```json
{
  "ctx/location": "Lab B2"
}
```

* set the default for `COMPOSITION.context.location`

## setting

```json
{
  "ctx/setting": "other care"
}
```

```json
{
  "ctx/setting": "238"
}
```

* set the default for `COMPOSITION.context.setting`
* either value or code is accepted
* `ctx/setting` will be set to "other care" if not set explicitly

## link

```json
{
  "ctx/link:0|type": "problem",
  "ctx/link:0|meaning": "problem related note",
  "ctx/link:0|target": "ehr://ehr.network/347a5490-55ee-4da9-b91a-9bba710f730e"
}
```

* set the default for `LOCATABLE.links`


:sectnums!:


:sectnums!:
## References

. [[[better-web-template]]]
  *Better web-template* on GitHub.
  https://github.com/better-care/web-template[better-care/web-template].
. [[[better-web-template-tests]]]
  *Better web-template test suite* on GitHub.
  https://github.com/better-care/web-template[better-care/web-template-tests].
. [[[ehrbase-sdt]]]
  *EHRbase SDT documentation*.
  https://docs.ehrbase.org/docs/category/simplified-data-template-sdt.
. [[[ehrbase-sdk-test]]]
  *EHRbase SDK test resources* on GitHub.
  https://github.com/ehrbase/openEHR_SDK/tree/master/test-data/src/main/resources[ehrbase/openEHR_SDK].
. [[[ecisflat]]]
  *ECISFLAT JSON format* on GitHub.
  https://github.com/ethercis/ethercis/blob/master/doc/flat%20json.md[ethercis/ethercis].
. [[[tds]]]
  *Ocean Health Systems TDS/TDD*.
  https://openehr.atlassian.net/wiki/spaces/spec/pages/30408770/Template+Data+Schema+TDS+Specification+and+associated+Template+Data+Document+TDD[TDS/TDD on openEHR wiki].

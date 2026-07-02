


image::https://specifications.openehr.org/images/openEHR_logo_RGB.svg["openEHR logo",align="center"]

# Archetype Object Model 2 (AOM2)



## Acknowledgements

### Primary Author

* Thomas Beale, Ars Semantica, UK; openEHR International Board.

### Contributors

This specification and its sibling Archetype Definition Language specification have benefited from wide formal and informal input from the openEHR and wider health informatics community. The openEHR Foundation would like to recognise the following people for their contributions.

* Koray Atalag, MD, PhD, Sen. Researcher, National Institute for Health Innovation (NIHI), New Zealand
* Silje Ljosland Bakke, RN, Nasjonal IKT HF, Norway
* Linda Bird PhD, IHTSDO, Australia
* Pieter Bos, Senior Software Engineer, Nedap, Netherlands
* Diego Boscá, IBIME, Technical University Valencia, VeraTech for Health, Spain
* Rong Chen MD, PhD, Cambio Healthcare Systems, Sweden
* Joey Coyle MD, PhD, Intermountain Healthcare, New York
* Borut Fabjan, Program Manager, Better d.o.o., Slovenia
* Sebastian Garde PhD, Ocean Informatics, UK
* Peter Gummer, Ocean Informatics, Australia
* Sam Heard MD, Ocean Informatics, Australia
* Stan Huff MD, Intermountain Healthcare, UT, USA
* David Ingram PhD, Emeritus Professor of Health Informatics, UCL, UK
* Dipak Kalra MD, PhD, Professor Health Informatics, CHIME, UCL, UK
* Shinji Kobayashi PhD, Kyoto University EHR research unit, Japan
* Bostjan Lah, Architect, Better d.o.o., Slovenia
* Patrick Langford, NeuronSong LLC, Utah, USA
* David Lloyd, CHIME, UCL (ret), UK
* Chunlan Ma PhD, MD, Ocean Informatics, Australia
* Ian McNicoll MD, FreshEHR, UK
* David Moner, IBIME, Technical University Valencia, VeraTech for Health, Spain
* Claude Nanjo MA African Studies., MPH, Cognitive Medical Systems Inc., California
* Pablo Pazos Gutierrez, Tarmac IT, CaboLabs, Uruguay
* Harold Solbrig, Mayo Clinic, Rochester, USA
* Erik Sundvall PhD, Linkoping University, Sweden
* Alessandro Torrisi, Code24, The Netherlands
* Bert Verhees, ROSA Software, The Netherlands
* Jelte Zeilstra, Software Engineer, Nedap, Netherlands

### Supporters

The work reported in this paper has been funded by the following organisations:

* the https://www.openehr.org/community/industry_partners/[openEHR Industry Partners^];
* Ars Semantica, UK;
* UCL (University College London) - Centre for Health Informatics and Multiprofessional Education (CHIME);
* Ocean Informatics, Australia.

Special thanks to David Ingram, Emeritus Professor of Health Informatics at UCL, who provided a vision and collegial working environment ever since the days of GEHR (1992).

### Trademarks

* 'openEHR' is a trademark of the openEHR Foundation
* 'Java' is a registered trademark of Oracle Corporation
* 'Microsoft' is a trademark of the Microsoft Corporation





ifdef::package_qualifiers[]
endif::[]

# Preface

## Purpose

This document contains the normative description of openEHR Archetype and Template semantics (originally described in citenp:[Beale2000] and citenp:[Beale2002]), in the form of an object model. The model presented here can be used as a basis for building software that represents archetypes and templates, independent of their persistent representation. Equally, it can be used to develop the output side of parsers that process archetypes in a linguistic format, such as the {openehr_am_adl2}[openEHR Archetype Definition Language (ADL)^] , XML and so on.

It is recommended in any case that the ADL specification be read in conjunction with this document, since it contains a detailed explanation of the semantics of archetypes, and many of the examples are more obvious in ADL, regardless of whether ADL is actually used with the object model presented here or not.

The release of AOM described in this specification corresponds to the 2.x version of the archetype formalism.

The intended audience includes:

* Standards bodies producing health informatics standards;
* Research groups using openEHR, {iso_13606}[ISO 13606], and other EHR or EHR exchange architectures;
* The open source healthcare community;
* EHR solution vendors;
* Medical informaticians and clinicians interested in health information.

## Related Documents

Prerequisite documents for reading this document include:

* The {openehr_overview}[openEHR Architecture Overview^];
* The {openehr_am_overview}[openEHR Archetypes Technical Overview^].
* The {openehr_base_types}[openEHR Base Types Specification^].

Related documents include:

* The {openehr_am_adl2}[openEHR Archetype Definition Language 2 Specification^];
* The {openehr_am_opt2}[openEHR Operational Template Specification^].

## Nomenclature

In this document, the term 'attribute' denotes any stored property of a type defined in an object model, including primitive attributes and any kind of relationship such as an association or aggregation. XML 'attributes' are always referred to explicitly as 'XML attributes'.

We also use the word 'archetype' in a broad sense to designate what are commonly understood to be 'archetypes' (specifications of clinical data groups / data constraints) and 'templates' (data sets based on archetypes, since at a technical level, an ADL/AOM 2 template is in fact just an archetype. Accordingly, statements about 'archetypes' in this specification can be always understood to also apply to templates, unless otherwise indicated.

## Status

This specification is in the STABLE state. The development version of this document can be found at {openehr_am_development_aom2}[{openehr_am_development_aom2}^].

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

### Release 2.3 to 2.4 (Document version 2.4.0 - ???)

The changes are as follows.

* ADL2 was initially released with code system using id-codes, at-codes and ac-codes. As this proved to hinder its widespread use in the openEHR community (due to its impact on existing openEHR RM data) a code system matching the one used in ADL 1.4 was introduced as openEHR primary code system.
* Additional attribute `title` was added to the `RESOURCE_DESCRIPTION` class. It is recommended in ADL 1.4 → ADL 2.4 conversion to populate this new attribute with the "Template ID" (or similar) of ADL 1.4 templates.
For Ocean .oet this can be copied from `templateName` and for Better Archetype Designer native Json `templateId` attribute should be used.
* ADL 2.4 requires {openehr_base_release_130}[BASE Release-1.3.0^] or newer to work.

### Release 1.5 to 2.0 (Document version 2.1.2 - 2.3.0)

The changes in release 2 of the ADL/AOM formalism are designed to make the formalism more computable with respect to terminology, and enable more rigorous validation and flattening operations.

The changes are as follows.

* Introduction of *new internal coding scheme*, consisting of id-codes, at-codes and ac-codes;
* Replace string archetype identifier with multi-part, *namespaced identifier*;
* Addition of *explicit value-sets* in terminology section, replacing in-line value sets in the `definition` section;
* Renaming archetype `ontology` section to `terminology`;
* Expression of all external *term bindings as URIs* following IHTSDO format;
* Introduction of *'tuple' constraints* to replace openEHR custom constrainer types for co-varying attributes within Quantity, Ordinal structures;
* Re-engineering of all primitive constrainer types, i.e. `C_STRING` , `C_DATE` etc.;
* Removal of the openEHR Archetype Profile specification.

### Release 1.4 to 1.5 (Document version 2.0 to 2.1.1)

The changes in release 1.5 are made to better facilitate the representation of specialised archetypes. The key semantic capability for specialised archetypes is to be able to support a differential representation, i.e. to express a specialised archetype only in terms of the changed or new elements in its definition, rather than including a copy of unchanged elements. Doing the latter is clearly unsustainable in terms of change management.

The changes are as follows.

* Full *specialisation support*: the addition of an attribute to the `C_ATTRIBUTE` class, allowing the inclusion of a path that enables specialised archetype redefinitions deep within a structure;
* Addition of *node-level annotations*;
* Structural simplification of archetype ontology section;
* The name of the `invariant` section has been changed to `rules`, to better reflect its purpose.
* A template is now just an archetype.

### Release 0.6 to 1.4

Changes made from Release 1.3 to 1.4:

* added a new attribute `_adl_version_` : `String` to the `ARCHETYPE` class;
* changed name of `ARCHETYPE` . `_concept_code_` attribute to `_concept_` .

# Model Overview

The model described here is a pure object-oriented model that can be used with archetype parsers and software that manipulates archetypes and templates in memory. It is typically the output of a parser of any serialised form of archetypes.

## Used BASE Component Packages

The AOM is dependent on various packages from the openEHR BASE component. The first of these is the `base.foundation_types` package, which defines the various 'leaf' types assumed by the AOM as well as other utility types and basic data structures, such as the `Interval<T>` type. These types are documented in the {openehr_foundation_types}[openEHR Foundation Types specification^] and reproduced below for convenience.

.`base.foundation_types` - 'leaf' types
image::{openehr_base_uml_diagrams}/BASE-foundation_types-leaf_types.svg[id=base_types_leaf_types, align="center"]

.`base.foundation_types.interval` Package
image::{openehr_base_uml_diagrams}/BASE-foundation_types.interval.svg[id=base_types_structure_types, align="center"]

NOTE: the above types do not constitute a formal part of this specification. Any implementation of the AOM will typically have to use concrete versions of these types found within languages and/or libraries.

In addition, various definitions from the `base.base_types.definitions` package are reused, which are shown below.

.`base.base_types.definitions` Package
image::{openehr_base_uml_diagrams}/BASE-base_types.definitions.svg[id=base_types_definitions, align="center"]

The enumeration type `VALIDITY_KIND` is provided in order to define standard values representing `mandatory`, `optional`, or `prohibited` in any model. It is used in this model in classes such as `C_DATE` , `C_TIME` and `C_DATE_TIME`. The `VERSION_STATUS` enumeration type serves a similar function within various AOM types.

Other classes used from the BASE Component include the `base.resource` package, which includes the class `AUTHORED_RESOURCE` and subordinate classes. These are shown by inclusion in the AOM Archetype package diagram below.

Finally, classes from the BASE Component `base.expressions` package is used by the rules part of the AOM. This is documented in the relevant section below.

## AOM2 Package Structure

The Archetype Object Model is defined by the package `am.aom2` and subordinate packages, as illustrated in <<aom2_package_overview>>.

.Package Overview
image::UML/diagrams/AM-aom2-packages.svg[id=aom2_package_overview, align="center"]

## Definition and Utility Classes

### Overview

Various definitional constants are used in the AOM. These are defined in the `aom2.definitions` package from the AM component and are shown below.

.Definition Package
image::UML/diagrams/AM-aom2.definitions.svg[id=definition_package, align="center"]

### Class Definitions


#### Utility Algorithms

Useful utility algorithms from the above class, referenced elsewhere in this specification are shown below. 

```eiffel
    codes_conformant (a_child_code, a_parent_code: String): Boolean
            -- True if `a_child_code' conforms to `a_parent_code' in the sense of specialisation, i.e.
            -- is `a_child_code' the same as or more specialised than `a_parent_code'
        do
            Result := is_valid_code (a_child_code) and then a_child_code.starts_with (a_parent_code) and then
                (a_child_code.count = a_parent_code.count or else
                a_child_code.item (a_parent_code.count + 1) = Specialisation_separator)
        end
```
# The Archetype Package

## Overview

The top-level model of archetypes and templates (all variant forms) is illustrated in the Figure [below](#archetype_package). The model defines a standard structural representation of an archetype. Archetypes authored as independent entities are instances of the class `AUTHORED_ARCHETYPE` which is a descendant of `AUTHORED_RESOURCE` and `ARCHETYPE`. The first of the two parent classes provides a standardised model of descriptive meta-data, language information, and annotations for any resource, and is documented in the {openehr_resource}[openEHR Resource Model^]. The resource classes are shown included in the diagram below. The second parent class defines the core structure of any kind of archetype, including definition, terminology, optional rules part, along with a 'semantic identifier' (`ARCHETYPE._archetype_id_`).

.`am.aom2.archetype` Package
image::UML/diagrams/AM-aom2.archetype.svg[id=archetype_package, align="center"]

The `AUTHORED_ARCHETYPE` class adds identifying attributes, flags and descriptive meta-data, and is the ancestor type for two further specialisations - `TEMPLATE` and `OPERATIONAL_TEMPLATE` . The `TEMPLATE` class defines the notion of a 'templated' archetype, i.e. an archetype containing fillers/references (ADL's `use_archetype` statements), typically designed to represent a data set. To enable this, it may contain 'overlays', private archetypes that specialise one or more of the referenced / filler archetypes it uses. Overlays are instances of the `TEMPLATE_OVERLAY` class, have no meta-data of their own, but are otherwise computationally just like any other archetype. 

The `OPERATIONAL_TEMPLATE` class represents the fully flattened form of a template, i.e. with all fillers and references substituted and overlays processed, to form what is in practical terms, a single custom-made 'operational' artefact, ready for transformation to downstream artefacts. Because an operational template includes one or more other archetype structures inline, it also includes their terminologies, enabling it to be treated as a self-standing artefact.

## Archetype Identification

### Human-Readable Identifier (HRID)

All archetype variants based on `ARCHETYPE` have a human-readable, structured identifier defined by the `ARCHETYPE_HRID` class. This identifier places the artefact in a multi-dimensional space based on a namespace, its reference model class and its informational concept. This class defines an atomised representation of the identifier, enabling variant forms to be used as needed. Its various parts can be understood from the following diagram, which also shows the computed `_semantic_id_` and `_physical_id_` forms.

.Archetype HRID Structure
image::{doc_name}/diagrams/archetype_hrid_structure.svg[id=archetype_hrid_structure, align="center",width="80%"]

For specialised archetypes, the `_parent_archetype_id_` is also required. This is a string `_reference_` to an archetype, and is normally the 'interface' form of the id, i.e. down to the major version only. In some circumstances, it is useful to include the minor and patch version numbers as well.

An important aspect of identification relates to the rules governing when the HRID namespace changes or is retained, with respect to when 'moves' or 'forks' occur. Its value is always the same as one of the `_original_namespace_` and `_custodian_namespace_` properties inherited from `AUTHORED_RESOURCE._description_` (or both, in the case where they are the same). A full explanation of the identification system and rules is given in the openEHR {openehr_am_id}[Archetype Identification specification^].

### Machine Identifiers

Two machine identifiers are defined for archetypes. The `ARCHETYPE._uid_` attribute defines a machine identifier equivalent to the human readable `ARCHETYPE._archetype_id_._semantic_id_` , i.e. `ARCHETYPE_HRID` up to its major version, and changes whenever the latter does. It is defined as optional but to be practically useful would need to be mandatory for all archetypes within a custodian organisation where this identifier was in use. It could in principle be synthesised at any time for a custodian that decided to implement it.

The `ARCHETYPE._build_uid_` attribute is also optional, and if used, is intended to provide a unique identifier that corresponds to any change in version of the artefact. At a minimum, this means generating a new UUID for each change to:

* `ARCHETYPE._archetype_id_._release_version_`;
* `ARCHETYPE._archetype_id_._build_count_`;
* `ARCHETYPE._description_._lifecycle_state_`.

For every change made to an archetype inside a controlled repository (for example, addition or update of meta-data fields), this field should be updated with a new UUID value, generated in the normal way.

## Top-level Meta-data

The following items correspond to syntax elements that may appear in parentheses in the first line of an ADL archetype.

### ADL Version

The `ARCHETYPE._adl_version_` attribute in ADL 1.4 was used to indicate the ADL release used in the archetype source file from which the AOM structure was created (the version number comes from the amendment record of the {openehr_am_adl2}#_amendment_record[ADL2 specification^]. In the current and future AOM and ADL specifications, the meaning of this attribute is generalised to mean 'the version of the archetype formalism' in which the current archetype is expressed. For reasons of convenience, the version number is still taken from the ADL specification, but now refers to all archetype-related specifications together, since they are always updated in a synchronised fashion.

### Reference Model Release

The `ARCHETYPE._rm_release_` attribute designates the release of the reference model on which the archetype is based, in the archetype's current version. This means `_rm_release_` can change with new versions of the archetype, where re-versioning includes upgrading the archetype to a later RM release. However, such upgrading still has to obey the basic rule of archetype compatibility: later minor, patch versions and builds cannot create data that is not valid with respect to the prior version.

This should be in the same semver.org 3-part form as the `ARCHETYPE_HRID._release_version_` property, e.g. "1.0.2". This property does not indicate conformance to any particular reference model version(s) other than the named one, since most archetypes can easily conform to more than one. More minimal archetypes are likely to technically conform to more old and future releases than more complex archetypes.

### Generated Flag

The `ARCHETYPE._is_generated_` flag is used to indicate that an archetype has been machine-generated from another artefact, e.g. an older ADL version (say 1.4), or a non-archetype artefact. If true, it indicates to tools that the current archetype can potentially be overwritten, and that some other artefact is considered the primary source. If manual authoring occurs, this attribute should be set to False.

## Governance Meta-data

Various meta-data elements are inherited from the `AUTHORED_RESOURCE` class, and provide the natural language description of the archetype, authoring and translation details, use, misuse, keywords and so on. There are three distinct parts of the meta-data: governance, authorship, and descriptive details.

### Governance Meta-data Items

Governance meta-data is visible primarily in the `RESOURCE_DESCRIPTION` class, inherited via `AUTHORED_RESOURCE`, and consists of items relating to management and intellectual property status of the artefact. A typical form of these is shown in the screenshot in <<metadata_governance>>.

.Governance Meta-data
image::{doc_name}/images/metadata_governance.png[id=metadata_governance, align="center", width="80%"]

#### Package

The optional `_resource_package_uri_` property enables the recording of a reference to a package of archetypes or other resources, to which this archetype is considered to below. Its value may be in the form of `"text <URL>"`.

#### Lifecycle_state

The `_description_._lifecycle_state_` is an important property of an archetype, which is used to record its state in a defined lifecycle. The lifecycle state machine and versioning rules are explained fully in the openEHR {openehr_am_id}[Archetype Identification specification^]. Here we simply note that the value of the property is a coded term corresponding to one of the macro-state names on the diagram, i.e. 'unmanaged', 'in_development', and so on.

#### Original_namespace and Original_publisher

These two optional properties indicate the original publishing organisation, and its namespace, i.e. the original publishing environment where the artefact was first imported or created. The `_original_namespace_` property is normally the same value as `_archetype_id.namespace_`,unless the artefact has been forked into its current custodian, in which case `_archetype_id.namespace_` will be the same as `_custodian_namespace_`.

#### Custodian_namespace and Custodian_organisation

These two optional properties state a formal namespace, and a human-readable organisation identifier corresponding to the current custodian, i.e. maintainer and publisher of the artefact, if there is one.

#### Intellectual Property Items

There are three properties in the class that `RESOURCE_DESCRIPTION` relate to intellectual property (IP). Licence is a String field for recording of the licence (US: 'license') under which the artefact can be used. The recommended format is as follows:

```
licence name <reliable URL to licence statement>
```

The copyright property records the copyright applying to the artefact, and is normally in the standard form '(c) name' or '(c) year name'. The special character © may also be used (UTF-8 0xC2A9).

### Authorship Meta-data

Authorship meta-data consists of items such as author name, contributors, and translator information, and is visualised in the figure below.

.Authoring Meta-data
image::{doc_name}/images/metadata_authoring.png[id=metadata_authoring, align="center", width="90%"]

#### Original Author

The `RESOURCE_DESCRIPTION._original_author_` property defines a simple list of name/value pairs via which the original author can be documented. Typical key values include `"name"`, `"organi[zs]ation"`, `"email"` and `"date"`".

#### Contributors

The `RESOURCE_DESCRIPTION._other_contributors_` property is a simple list of strings, one for each contributor. The recommended format of the string is one of:

```
first names last name, organisation
first names last name, organisation <contributor email address>
first names last name, organisation <organisation email address>
```

#### Languages and Translation

The `AUTHORED_RESOURCE._original_language_` and `TRANSLATION_DETAILS` class enable the original language of authoring and information relating to subsequent translations to be expressed. `TRANSLATION_DETAILS._author_` allows each translator to be represented in the same way as the `_original_author_` , i.e. a list of name/values. 

#### Version_last_translated

The `_version_last_translated_` property is used to record a copy of the `_archetype_id.physical_id_` for each language, when the translation was carried out. This enables maintainers to know when new translations are needed for some or all languages. This String property records the full version identifier (i.e. `ARCHETYPE._archetype_id.version_id_`) at the time of last translation, enabling tools to determine if and when translations may be out of date.

### Descriptive Meta-data

Various descriptive meta-data may be provided for an archetype in multiple translations in the `RESOURCE_DESCRIPTION_ITEM` class, using one instance for each translation language, as shown in the figure below.

.Descriptive Meta-data
image::{doc_name}/images/metadata_details.png[id=metadata_descriptive, align="center"]

#### Purpose

The `_purpose_` item is a String property for recording the intended design concept of the artefact.

#### Use and Misuse

The `_use_` and `_misuse_` properties enable specific uses and misuses to be documented. The latter normally relate to common errors of use, or apparently reasonable but wrong assumptions about use.

#### Keywords

The `_keywords_` property is a list of Strings designed to record search keywords for the artefact.

#### Resources

The `_original_resource_uri_` property is used to record one or more references to resources in each particular language.

*TBD*: This property does not appear to have ever been used, and it may not be useful, since 'resources' are not typically available for each language.

## Structural Definition

### Common Structural Parts

The archetype definition is the main definitional part of an archetype and is an instance of a `C_COMPLEX_OBJECT` . This means that the root of the constraint structure of an archetype always takes the form of a constraint on a non-primitive object type.

The terminology section of an archetype is represented by its own classes, and is what allows archetypes to be natural language- and terminology-neutral. It is described in detail in <<_terminology_package>>.

An archetype may include one or more rules. Rules are statements expressed in a subset of predicate logic, which can be used to state constraints on multiple parts of an object. They are not needed to constrain single attributes or objects (since this can be done with an appropriate `C_ATTRIBUTE` or `C_OBJECT` ), but are necessary for constraints referring to more than one attribute, such as a constraint that 'systolic pressure should be >= diastolic pressure' in a blood pressure measurement archetype. They can also be used to declare variables, including external data query results, and make other constraints dependent on a variable value, e.g. the gender of the record subject.

Lastly, the annotations section, inherited from the `AUTHORED_RESOURCE` class, can be included as required. This section is of particular relevance to archetypes and templates, and is used to document individual nodes within an archetype or template, and/or nodes in reference model data, that may not be constrained in the archetype, but whose specific use in the archetyped data needs to be documented. In the former case, the annotations are keyed by an archetype path, while in the latter case, by a reference model path.

### Structural Variants

The model in <<archetype_package>> defines the structures of a number of variants of the 'archetype' idea. All concrete instances are instances of one of the concrete descendants of `ARCHETYPE`. <<source_archetype_structure>> illustrates the typical object structure of a source archetype - the form of archetype created by an authoring tool - represented by a `DIFFERENTIAL_ARCHETYPE` instance. Mandatory parts are shown in bold.

.Source Archetype Structure
image::UML/diagrams/AM-source_archetype_structure.svg[id=source_archetype_structure, align="center", width="60%"]

Source archetypes can be specialised, in which case their definition structure is a partial overlay on the flat parent, or 'top-level', in which case the definition structure is complete. `C_ARCHETYPE_ROOT` instances may only occur representing direct references to other archetypes - 'external references'.

A flat archetype is generated from one or more source archetypes via the flattening process described in the next chapter of this specification, (also in the ADL specification). This generates a `FLAT_ARCHETYPE` from a `DIFFERENTIAL_ARCHETYPE` instance. The main two changes that occur in this operation are a) specialised archetype overlays are applied to the flat parent structure, resulting in a full archetype structure, and b) internal references (use_nodes) are replaced by their expanded form, i.e. a copy of the subtrees to which they point.

.Source Template Structure
image::UML/diagrams/AM-source_template_structure.svg[id=source_template_structure, align="center", width="80%"]

This form is used to represent the full 'operational' structure of a specialised archetype, and has two uses. The first is to generate backwards compatible ADL 1.4 legacy archetypes (always in flat form); the second is during the template flattening process, when the flat forms of all referenced archetypes and templates are ultimately combined into a single operational template.

<<source_template_structure>> illustrates the structure of a source template, i.e instances of `TEMPLATE`. A source template is an archetype containing `C_ARCHETYPE_ROOT` objects representing slot fillers - each referring to an external archetype or template, or potentially an overlay archetype.

Another archetype variant, also shown in <<source_template_structure>> is the template overlay, i.e. an instance of `TEMPLATE_OVERLAY`. These are purely local components of templates, and include only the definition and terminology. The definition structure is always a specialised overlay on something else, and may not contain any slot fillers or external references, i.e. no `C_ARCHETYPE_ROOT` objects. No identifier, adl_version, languages or description are required, as they are considered to be propagated from the owning root template. Accordingly, template overlays act like a simplified specialised archetype. Template overlays can be thought of as being similar to 'anonymous' or 'inner' classes in some object-oriented programming languages.

<<operational_template_structure>> illustrates the resulting operational template, or compiled form of a template. This is created by building the composition of referenced archetypes and/or templates and/or template overlays, in their flattened form, to generate a single 'giant' archetype. The root node of this archetype, along with every archetype/template root node within, is represented using a `C_ARCHETYPE_ROOT` object. An operational template also has a `component_terminologies` property containing the ontologies from every constituent archetype, template and overlay.

.Operational Template Structure
image::UML/diagrams/AM-operational_template_structure.svg[id=operational_template_structure, align="center", width="80%"]

More details of template development, representation and semantics are described in the next section.

## Class Descriptions


## Validity Rules

The following validity rules apply to all varieties of `ARCHETYPE` object:

*VARAV*: ADL version validity. The `_adl_version_` top-level meta-data item must exist and consist of a valid 3-part version identifier.

*VARRV*: RM release validity. The `_rm_release_` top-level meta-data item must exist and consist of a valid 3-part version identifier.

*VARCN*: archetype concept validity. For *at-coded definitions*: the `_node_id_` of the root object of the archetype must be of the form `at0000{.1}*`, where the number of `.1` components equals the specialisation depth, and must be defined in the terminology.
For *id-coded definitions*: the `_node_id_` of the root object of the archetype must be of the form `id1{.1}*`, where the number of `.1` components equals the specalisation depth, and must be defined in the terminology.

*VATDF*: value code validity. Each value code (at-code) used in a term constraint in the archetype definition must be defined in the `term_definitions` part of the terminology of the flattened form of the current archetype.

*VACDF*: constraint code validity. Each value set code (ac-code) used in a term constraint in the archetype definition must be defined in the term_definitions part of the terminology of the current archetype.

*VATDA*: value set assumed value code validity. Each value code (at-code) used as an assumed_value for a value set in a term constraint in the archetype definition must exist in the value set definition in the terminology for the identified value set.

*VETDF*: external term validity. Each external term used within the archetype definition must exist in the relevant terminology (subject to tool accessibility; codes for inaccessible terminologies should be flagged with a warning indicating that no verification was possible).

*VOTM*: terminology translations validity. Translations must exist for `term_definitions` and `constraint_definitions` sections for all languages defined in the `description` / `translations` sections.

*VOKU*: object key unique. Within any keyed list in an archetype, including the `desription`, `terminology`, and `annotations` sections, each item must have a unique key with respect to its siblings.

*VARDT*: archetype definition typename validity. The typename mentioned in the outer block of the archetype definition section must match the type mentioned in the first segment of the archetype id.

*VRANP*: annotation path valid. Each path mentioned in an annotation within the `annotations` section must either be a valid archetype path, or a 'reference model' path, i.e. a path that is valid for the root class of the archetype.

*VRRLP*: rule path valid. Each path mentioned in a rule in the `rules` section must be found within the archetype, or be an RM-valid extension of a path found within the archetype.

The following validity rules apply to instances of `ARCHETYPE` and subtypes other than `TEMPLATE_OVERLAY`:

*VARID*: archetype identifier validity. The archetype must have an identifier that conforms to the openEHR specification for archetype identifiers.

*VDEOL*: original language specified. An `original_language` section containing the meta-data of the original authoring language must exist.

*VARD*: description specified. A `description` section containing the main meta-data of the archetype must exist.

The following rules apply to specialised archetypes, for which `ARCHETYPE._is_specialised_` returns `True`.

*VASID*: archetype specialisation parent identifier validity. The archetype identifier stated in the `specialise` clause must be the identifier of the immediate specialisation parent archetype.

*VALC*: archetype language conformance. The languages defined in a specialised archetype must be the same as or a subset of those defined in the flat parent.

*VACSD*: archetype concept specialisation depth. The specialisation depth of the archetypes must be one greater than the specialisation depth of the parent archetype.

*VATCD*: archetype code specialisation level validity. Each archetype term ('at' code) and constraint code ('ac' code) used in the archetype `definition` section must have a specialisation level no greater than the specialisation level of the archetype.

The following validity rules apply to instances of `TEMPLATE`:

*VTPL*: template and filler language consistency. All fillers of slots and external reference archetypes (i.e. 'use_archetype' inclusions) must contain the `_original_language_` of the root template in their languages, in order for template flattening to be successful.



# Constraint Model Package

## Overview

<<constraint_model>> and <<constraint_model_primitive>> illustrate the object model of constraints used in an archetype definition. This model is completely generic, and is designed to express the semantics of constraints on instances of classes which are themselves described in any orthodox object-oriented formalism, such as UML. Accordingly, the major abstractions in this model correspond to major abstractions in object-oriented formalisms, including several variations of the notion of 'object' and the notion of 'attribute'. The notion of 'object' rather than 'class' or 'type' is used because archetypes are about constraints on data (i.e. 'instances', or 'objects') rather than models, which are constructed from 'classes'. In this document, the word 'attribute' refers to any data property of a class, regardless of whether regarded as a 'relationship' (i.e. association, aggregation, or composition) or 'primitive' (i.e. value) attribute in an object model.

.`am.aom2.constraint_model` Package
image::UML/diagrams/AM-aom2.constraint_model.svg[id=constraint_model, align="center"]

The definition part of an archetype is an instance of a `C_COMPLEX_OBJECT` and consists of alternate layers of object and attribute constrainer nodes, each containing the next level of nodes. At the leaves are primitive object constrainer nodes constraining primitive types such as `String` , `Integer` etc. There are also nodes that represent internal references to other nodes, constraint reference nodes that refer to a text constraint in the constraint binding part of the archetype terminology, and archetype constraint nodes, which represent constraints on other archetypes allowed to appear at a given point. The full list of concrete node types is as follows:

* `C_COMPLEX_OBJECT` : any interior node representing a constraint on instances of some non-primitive type, e.g. `OBSERVATION`, `SECTION` ;
* `C_ATTRIBUTE` : a node representing a constraint on an attribute (i.e. UML 'relationship' or 'primitive attribute') in an object type;
* `C_PRIMITIVE_OBJECT` : a node representing a constraint on a primitive (built-in) object type;
* `C_COMPLEX_OBJECT_PROXY` : a node that refers to a previously defined `C_COMPLEX_OBJECT` node in the same archetype. The reference is made using a path;
* `ARCHETYPE_SLOT` : a node whose statements define a constraint that determines which other archetypes can appear at that point in the current archetype. It can be thought of as a keyhole, into which few or many keys might fit, depending on how specific its shape is. Logically it has the same semantics as a `C_COMPLEX_OBJECT`, except that the constraints are expressed in another archetype, not the current one.
* `C_ARCHETYPE_ROOT` : stands for the root node of an archetype; enables another archetype to be referenced from the present one. Used in both archetypes and templates.

The constraints define which configurations of reference model class instances are considered to conform to the archetype. For example, certain configurations of the classes `PARTY`, `ADDRESS`, `CLUSTER` and `ELEMENT` might be defined by a Person archetype as allowable structures for 'people with identity, contacts, and addresses'. Because the constraints allow optionality, cardinality and other choices, a given archetype usually corresponds to a set of similar configurations of objects.

.`am.aom2.constraint_model.primitive` Package
image::UML/diagrams/AM-aom2.constraint_model.primitive.svg[id=constraint_model_primitive, align="center"]

<<constraint_model_primitive_implem>> below shows the detailed temporal constraint definitions, used by the `C_TEMPORAL` class and descendants in the `primitive` package above.

.`am.aom2.constraint_model.primitive-implem` Package
image::UML/diagrams/AM-aom2.constraint_model.primitive-implem.svg[id=constraint_model_primitive_implem, align="center"]

The type-name nomenclature `C_XXX` used here is intended to be read as 'constraint on objects of type `XXXX` ', i.e. a `C_COMPLEX_OBJECT` is a 'constraint on a complex object (defined by a complex reference model type)'. These type names are used below in the formal model.

## Semantics

The effect of the model is to create archetype definition structures that are a hierarchical alternation of object and attribute constraints. This structure can be seen by inspecting an ADL archetype, or by viewing an archetype in an AOM-based tool such as the openEHR {openehr_awb}[ADL workbench^], and is a direct consequence of the object-oriented principle that classes consist of properties, which in turn have types that are classes. (To be completely correct, types do not always correspond to classes in an object model, but it does not make any difference here). The repeated object/attribute hierarchical structure of an archetype provides the basis for using paths to reference any node in an archetype. Archetype paths follow a syntax that is a directly convertible in and out of the W3C Xpath syntax.

### All Node Types

Some properties are defined for all node types, described in the following sections.

#### Path Functions

The path feature computes the path to the current node from the root of the archetype, while the has_path function indicates whether a given path can be found in an archetype.

#### Conformance Functions

All node types include two functions that formalise the notion of conformance of a specialised archetype to a parent archetype. Both functions take an argument which must be a corresponding node in a parent archetype, not necessarily the immediate parent. A 'corresponding' node is one found at the same or a congruent path. A congruent path is one in which one or more at-codes have been redefined in the specialised archetype.

The `_c_conforms_to_` function returns True if the node on which it is called is a valid specialisation of the 'other' node. The `_c_congruent_to_` function returns True if the node on which it is called is the same as the other node, with the possible exception of a redefined at-code. The latter may happen due to the need to restrict the domain meaning of node to a meaning narrower than that of the same node in the parent. The formal semantics of both functions are given in the class definitions, <<_class_definitions_>>.

#### Any_allowed

The `_any_allowed_` function defined on some node types indicates that any value permitted by the reference model for the attribute or type in question is allowed by the archetype; its use permits the logical idea of a completely "open" constraint to be simply expressed, avoiding the need for any further substructure.

### Attribute Nodes

Constraints on reference model attributes, including computed attributes (represented by functions with no arguments in most programming languages), are represented by instances of `C_ATTRIBUTE`. The expressible constraints include:

* `_is_multiple_`: a flag that indicates whether the `C_ATTRIBUTE` is constraining a multiply-valued (i.e. container) RM attribute or a single-valued one;
* `_existence_`: whether the corresponding instance (defined by the `_rm_attribute_name_` attribute) must exist;
* child objects: representing allowable values of the object value(s) of the attribute.

In the case of single-valued attributes (such as Person.date_of_birth) the children represent one or more alternative object constraints for the attribute value.

For multiply-valued attributes (such as `Person`.`_contacts_`: `List<Contact>`), a cardinality constraint on the container can be defined. The constraint on child objects is essentially the same except that more than one of the alternatives can co-exist in the data. <<c_attributes>> illustrates the two possibilities.

The appearance of both `_existence_` and `_cardinality_` constraints in `C_ATTRIBUTE` deserves some explanation, especially as the meanings of these notions are often confused in object-oriented literature. An existence constraint indicates whether an object will be found in a given attribute field, while a cardinality constraint indicates what the valid membership of a container object is. `_Cardinality_` is only required for container objects such as `List<T>` , `Set<T>` and so on, whereas `_existence_` is always possible. If both are used, the meaning is as follows: the existence constraint says whether the container object will be there (at all), while the cardinality constraint says how many items must be in the container, and whether it acts logically as a list, set or bag. Both existence and cardinality are optional in the model, since they are only needed to override the settings from the reference model.

.C_ATTRIBUTE variants
image::{doc_name}/diagrams/c_attributes.png[id=c_attributes, align="center", width="70%"]

### Object Node Types

The following sections apply to all object nodes in an archetype, i.e. instances of any descendant of `C_OBJECT`.

#### Rm_type_name and Reference Model Type Matching

Every object node has an `_rm_type_name_` attribute that states the RM type to be matched by that node in the archetype. The value of `_rm_type_name_` is understood as a constraint on the dynamic type of data _instances_ of the stated Reference Model type. It is either a class name from the RM, or a generic type constructed from RM class names, as described in the {openehr_am_adl2}#_reference_model_type_matching[Reference model type matching^] section of the ADL2 specification.

The RM type stated in an archetype object node is understood to be a _static_ type constraint. Accordingly, it will match an instance of any RM _subtype_ of the stated type, as long as the inheritance relationship is stated in the RM definition. This holds both for sub-classes, and subtypes of generic types, in a covariant fashion. The following matching will thus succeed:

* `_rm_type_name_` = `"PARTY"` matches `PERSON`, where `PERSON` inherits from `PARTY` in the relevant RM;
* `_rm_type_name_` = `"Interval<Ordered>"` matches a dynamic type of data items of `Interval<Quantity>`, `SimpleInterval<Ordered>` and `SimpleInterval<Quantity>` where `Quantity` inherits from `Ordered` and `SimpleInterval` inherits from `Interval` in the relevant RM.

There are some special rules that apply to primitive type matching that enable 'logical' primitive type names in archetypes to match multiple 'concrete' variants that occur in some reference models and programming type systems. These are described in detail below.

#### Node_id and Paths

The `_node_id_` attribute in the class `C_OBJECT`, inherited by all subtypes, is of key importance in the archetype constraint model. It has two functions:

* it allows archetype object constraint nodes to be individually identified, and in particular, guarantees sibling node unique identification;
* it provides a code to which a human-understanding terminology definition can be attached, as well as potentially a terminology binding.

The existence of `_node_ids_` in an archetype allows archetype paths to be created, which refer to each node. Every node in the archetype needs a `_node_id_` , but only `_node_ids_` for nodes under container attributes must have a terminology definition. For nodes under single-valued attributes, the terminology definition is optional (and typically not supplied), since the meaning is given by the reference model attribute definition.

Note that instances of `C_PRIMITIVE_OBJECT` have a constant `_node_id_` (see below) and thus do not require node identifiers to be supplied in syntax or serial forms that are converted to AOM structural form.

#### Sibling Ordering

Within a specialised archetype, redefined or added object nodes may be defined under a container attribute. Since specialised archetypes are in differential form, i.e. only redefined or added nodes are expressed, not nodes inherited unchanged, the relative ordering of siblings can't be stated simply by the ordering of such items within the relevant list within the differential form of the archetype. An explicit ordering indicator is required if indeed order is specific. The `C_OBJECT._sibling_order_` attribute provides this capability. It can only be set on a `C_OBJECT` descendant within a multiply-valued attribute, i.e. an instance of `C_ATTRIBUTE` for which the `_cardinality_` is ordered.

#### Node Deprecation

It is possible to mark an instance of any defined node type as deprecated, meaning that by preference it should not be used, and that there is an alternative solution for recording the same information. Rules or recommendations for how deprecation should be handled are outside the scope of the archetype proper, and should be provided by the governance framework under which the archetype is managed.

### Reference Objects

Two subtypes of `C_OBJECT`, namely `ARCHETYPE_SLOT` and `C_COMPLEX_OBJECT_PROXY` are used to express constraints in the form of references to other constraints, rather than directly.

An `ARCHETYPE_SLOT` defines a 'slot' specifying other archetypes that can be plugged in at that point, in terms of constraints on archetype identifiers. These are expressed as instances of the `ARCHETYPE_ID_CONSTRAINT` class, a specialised version of the ELOM `EL_CONSTRAINT_EXPRESSION` class.

The type `C_COMPLEX_OBJECT_PROXY` represents a reference to another part of the current archetype that expresses exactly the same constraints needed at the  point where the proxy appears.

### Defined Object Nodes (C_DEFINED_OBJECT)

The `C_DEFINED_OBJECT` subtype corresponds to the category of `C_OBJECTs` that are defined in an archetype by value, i.e. by inline definition. Four properties characterise `C_DEFINED_OBJECTs` as follows.

#### Valid_value

The `_valid_value_` function tests a reference model object for conformance to the archetype. It is designed for recursive implementation in which a call to the function at the top of the archetype definition would cause a cascade of calls down the tree. This function is the key function of an 'archetype-enabled kernel' component that can perform runtime data validation based on an archetype definition.

#### Prototype_value

This function is used to generate a reasonable default value of the reference object being constrained by a given node. This allows archetype-based software to build a 'prototype' object from an archetype which can serve as the initial version of the object being constrained, assuming it is being created new by user activity (e.g. via a GUI application). Implementation of this function will usually involve use of reflection libraries or similar.

#### Default_value

This attribute allows a user-specified default value to be defined within an archetype. The `_default_value_` object must be of the same type as defined by the `_prototype_value_` function, pass the `_valid_value_` test. Where defined, the `_prototype_value_` function would return this value instead of a synthesised value.

### Complex Objects (C_COMPLEX_OBJECT)

Along with `C_ATTRIBUTE`, `C_COMPLEX_OBJECT` is the key structuring type of the `constraint_model` package, and consists of attributes of type `C_ATTRIBUTE`, which are constraints on the attributes (i.e. any property, including relationships) of the reference model type. Accordingly, each `C_ATTRIBUTE` records the name of the constrained attribute (in `_rm_attr_name_`) , the existence and cardinality expressed by the constraint (depending on whether the attribute it constrains is a multiple or single relationship), and the constraint on the object to which this `C_ATTRIBUTE` refers via its `_children_` attribute (according to its reference model) in the form of further `C_OBJECTs`.

### Primitive Types (C_PRIMITIVE_OBJECT descendants)

Constraints on primitive types are defined by the descendants of `C_PRIMITIVE_OBJECT`, i.e. `C_STRING` , `C_INTEGER` and so on. The primitive constraint types are represented in such a way as to accommodate both 'tuple' constraints and logically unary constraints, using a tuple array (`C_PRIMITIVE_TUPLE._members_`) whose members are each a primitive constraint corresponding to each primitive type in the tuple. Tuple constraints are second order constraints, described below, enabling co-varying constraints to be stated. In the unary case, the constraint is the first member of a tuple array.

`C_PRIMITIVE_OBJECT` instances represented in {openehr_am_adl2}[ADL 'short' form^] are created with a fixed at-code (id-code) `ADL_CODE_DEFINITIONS._primitive_node_id_` as the value of `_node_id_` (see <<ADL_CODE_DEFINITIONS Class>>). For regularly structured `C_PRIMITIVE_OBJECT` instances, a normal node identifier is required.

The primitive constraint for each primitive type may itself be complex. Its formal type is the type of the `_constraint_` accessor in each `C_PRIMITIVE_OBJECT` descendant. The use of constrainer types for each assumed primitive RM type is summarised in the following table.

|===========
|RM Primitive type    |AOM type                |AOM Primitive constrainer type |Constraint description
|`Boolean`            |`C_BOOLEAN`             |`List <Boolean>`               |One or two Boolean values, enabling the logical constraints 
                                                                                'true', 'false' and 'true or false' to be expressed.
|`String`             |`C_STRING`              |`List <String>`                |A list of possible string values, which may include regular expressions, 
                                                                                which are delimited by '/' characters.
|`Terminology_code`   |`C_TERMINOLOGY_CODE`    |Terminology constraint - +
                                                `[acN]` or `[atN]`             |A string containing either a single at-code or a single ac-code. In the 
                                                                                latter case, the constraint refers to either a locally defined value set 
                                                                                or (via a binding) an external value set.
|Descendants of +
 `Ordered`            |`C_ORDERED`             |`List <Interval<T:Ordered>>`  |A single value (which is a point interval), a list of values 
                                                                                (list of point intervals), a list of intervals, which may be mixed proper 
                                                                                and point intervals.
|`Integer`            |`C_INTEGER`             |`List <Interval<Integer>>`     |As for Ordered type, with T = `Integer`
|`Real`               |`C_REAL`                |`List <Interval<Real>>`        |As for Ordered type, with T = `Real`
|Descendants of + 
`Temporal`            |`C_TEMPORAL`            |`List <Interval<T:Temporal>>` +
                                                OR +
                                                `String` (ADL pattern)         |As for ordered types, with T being an sub-type type of `Temporal`, an 
                                                                                ancestor of the assumed Date/time primitive types., with the addition of a 
                                                                                second type constraint -                                                                                                                             {openehr_am_adl2}#_constraints_on_dates_times_and_durations[a pattern based on ISO 8601 syntax^].

|`Date`               |`C_DATE`                |`List <Interval<Date>>` +
                                                OR +
                                                `String` (ADL pattern)           |As for Temporal types with T = `Date`
|`Time`               |`C_TIME`                |`List <Interval<Time>>` +
                                                OR +
                                                `String` (ADL pattern)           |As for Temporal types with T = `Time`
|`Date_time`          |`C_DATE_TIME`           |`List <Interval<Date_time>>` +
                                                OR +
                                                 `String` (ADL pattern)          |As for Temporal types with T = `Date_time`
|`Duration`           |`C_DURATION`            |`List <Interval<Duration>>` +
                                                OR +
                                                `String` (ADL pattern)           |As for Temporal types with T = `Duration`
                                                
|`List<T>`            |`C_PRIMITIVE_OBJECT` +
                       descendant appropriate +
                       to RM type               |`List<T>` or `List<Interval<T>>` +
                                                for Ordered types                |Members of List value match any value in constraint list

|`Interval<T:Ordered>`|`C_PRIMITIVE_ORDERED` +
                       descendant appropriate +
                       to RM type              |`List<Interval<T>>`              |Interval value matches any (Interval) value in constraint list
                                                
|===========

The RM primitive types listed above are assumed to exist (possibly with different names) within any RM used as the basis for creating archetypes. Where any do not exist - e.g. if there are no date/time types in a particular RM - no archetype constraints can be defined for such nodes. Where the types have different names, name mapping can be performed as described in <<RM Primitive Type Equivalences>> below.

This facility can be used to effect the following mappings from `C_PRIMITIVE_OBJECT` descendants (`C_STRING`, `C_INTEGER` etc) to the types found in any particular RM.

* `String` variants: in addition to matching `String`, `C_STRING` should match `StringN` and `String_N` instances, to accommodate RM types such as `String8`, `String_32` etc;
* `Integer` variants: in addition to matching `Integer`, `C_INTEGER` should match `IntegerN` and `Integer_N`, to accommodate RM types such as `Integer_16`, `Integer64` etc;
* `Real` variants: in addition to matching `Real`, `C_REAL` should match `RealN` and `Real_N` and `Double`, to accommodate RM types such as `Real_32`, `Real64` and `Double`;
* `Date_time` variants: typical names for `Date_time` such as `DateTime`, `TimeStamp` etc should be mapped to `C_DATE`.

#### Assumed_value

The `_assumed_value_` attribute is useful for archetypes containing any optional constraint. and provides an ability to define a value that can be assumed for a data item for which no data is found at execution time. If populated, it can contain a single at-code that must be in the local value set referred to by the ac-code in the `_constraint_` attribute.

For example, an archetype for the concept 'blood pressure measurement' might contain an optional protocol section containing a data point for patient position, with choices 'lying', 'sitting' and 'standing'. Since the section is optional, data could be created according to the archetype which does not contain the protocol section. However, a blood pressure cannot be taken without the patient in some position, so clearly there is an implied value for patient position. Amongst clinicians, basic assumptions are nearly always made for such things: in general practice, the position could always safely be assumed to be 'sitting' if not otherwise stated; in the hospital setting, 'lying' would be the normal assumption. The `_assumed_value_` feature of archetypes allows such assumptions to be explicitly stated so that all users/systems know what value to assume when optional items are not included in the data.

Note that the notion of assumed values is distinct from that of 'default values'. The latter notion is that of a default 'pre-filled' value that is provided (normally in a local context by a template) for a data item that is to be filled in by the user, but which is typically the same in many cases. Default values are thus simply an efficiency mechanism for users. As a result, default values do appear in data, while assumed values don't.

### Terminology Constraints

#### Formal Definition

The `C_TERMINOLOGY_CODE` type entails some complexity and merits further explanation. This is the only constrainer type whose constraint semantics are not self-contained, but located in the archetype terminology and/or in external terminologies.

A `C_TERMINOLOGY_CODE` instance in an archetype is structurally simple: it can only be one of the following constraints:

* a single ac-code, referring to either a value-set defined in the archetype terminology or bound to an external value set or ref set;
** in this case, an additional at-code may be included as an assumed value; the at-code must come from the locally defined value set;
* a single at-code, representing a single possible value.

NOTE: The second case in theory could be done using an ac-code referring to a value set containing a single value, but there seems little value in this extra verbiage, and little cost in providing the single-member value set short cut.

#### Constraint Strengths

Uniquely in the AOM, a Terminology code constraint may not be required, and may instead be considered informal. This is achieved via the attribute `_constraint_status_` which indicates either that the constraint is `required (0)` (i.e. the data item must formally conform to the constraint), or three levels of informal constraint, namely `extensible (1) | preferred (2) | example (3)`. This particular model of constraint 'strength' follows the {hl7_fhir_binding_strengths}[HL7 FHIR 'binding strengths' model^]. The convenience function `_constraint_required_()` can be used to determine if the constraint is formal, i.e. if `_constraint_status_` has the value `required (0)` or else is not set.

The informal constraint feature in `C_TERMINOLOGY_CODE` is provided to address the common real-world mismatch between local terminology use and more centrally defined archetypes. The enumeration values of 0 - 3 are designed such that the `required` constraint status (value = 0) is considered the default. Additionally, the `_constraint_status_` attribute is optional, and will not be present in archetypes authored with tools not including this feature. Accordingly, the `_constraint_required_()` function returns `True` if `_constraint_status_` is Void. This means that in all archetypes containing `C_TERMINOLOGY_CODE` nodes with no `_constraint_status_`, such nodes are considered to express a formally required constraint.

For the non-required settings of `_constraint_status_`, a data instance value may be a non-matching terminology code, including from another terminology. It might also be a plain text (i.e. not coded), in which case it will not be matched by a `C_TERMINOLOGY_CODE` archetype node, but an archetype node corresponding to the relevant RM type. In openEHR, this would usually be `DV_TEXT`. To allow for coded text or text matching therefore, at least 2 sibling archetype nodes are required, with one containing the appropriately configured `C_TERMINOLOGY_CODE`, and another representing a text-only constraint.

With respect to redefinition in specialised archetypes, the constraint strength may be redefined to be stronger, i.e. the enumeration value must be lower. Thus, a term constraint with strength of `preferred (2)` can be redefined to a strength of `required (0)`.

#### Terminology Code Resolution

When an archetype is deployed in the form of an operational template, the internally defined value sets, and any bindings are processed in stages in order to obtain the final terminology codes from which the user should choose. The `C_TERMINOLOGY_CODE` class provides a number of functions to formalise this as follows.

* `_value_set_expanded_: List<String>`: this function converts an ac-code to its corresponding set of at-codes, as defined in the `value_sets` section of the archetype.
* `_value_set_substituted_: List<URI>`: where bindings exist to he value set at-codes, this function converts each code to its corresponding binding target, i.e. a URI.
* `_value_set_resolved_: List<TERMINOLOGY_CODE>`: this function converts the list of URIs to final terms, including with textual rubrics, i.e. a list of `TERMINOLOGY_CODEs`.

These functions would normally be implemented as 'lambdas' or 'agents', in order to obtain access to the target terminologies.

NOTE: Since an archetype might not contain external terminology bindings for all (or even any) of its terminological constraints, a 'resolved' archetype will usually contain at-codes in its cADL definition. These at-codes would be treated as real coded terms in any implementation that was creating data, and as a consequence, archetype at-codes could occur in real data, as described in the Terminology Integration section of the ADL specification.

### Date/Time Constraints

The openEHR architecture assumes that primitive types representing 'date', 'time' and 'date_time' exist within every development environment, however such types or classes may be named. Within openEHR, these primitive types are named `Iso8601_date` etc., and are defined in the {openehr_base_latest_foundation_types}[openEHR Foundation Types Specification^].

As described in the {openehr_am_adl2}#_constraints_on_dates_times_and_durations[openEHR ADL2 specification^], these types are constrained using either value intervals or patterns. Both kinds of constraint are formally represented by the classes [`C_DATE`](#_c_date_class), [`C_TIME`](#_c_time_class) and [`C_DATE_TIME`](#_c_date_time_class). (A fourth time-related type, 'Duration' is constrained somewhat differently by the AOM class `C_DURATION`).

ADL2 value range constraints, such as the date range `|2004-05-20..2005-05-19|` are represented in the relevant constrainer meta-class (in this case `C_DATE`) by an attribute of the form `constraint: List<Interval<Iso8601_date>>`. Similarly, an ADL2 date/time range constraint such as `|<2005-05-19T23:59:59|` is represented by `C_DATE_TIME.constraint` of type `List<Interval<Iso8601_date_time>>`. The `List<>` structure allows such constraints to include more than one disjoint range.

The other means of expressing constraints in ADL2 is via patterns based on the {iso_8601}[ISO 8601^] extended syntax form (i.e. the form that uses '-' and ':' characters in dates and times, respectively). These allow partial dates and times to be stated. Thus, the time constraint `hh:??:XX` means: any time consisting of hours, optional minutes, and no seconds. A full table of such constraint patterns is provided in the {openehr_am_adl2}#_patterns[ADL2 specification^].

Pattern constraints are represented within the AOM classes `C_DATE` etc. via the attribute `pattern_constraint: String`, inherited from the abstract class `C_TEMPORAL`. Validity may be checked using features defined on the class [`C_TEMPORAL_DEFINITIONS`](#_c_temporal_definitions_class), such as `valid_date_constraint_patterns`, and also `valid_date_constraint_replacements`, for checking redefinitions within specialised archetypes.

Date/time pattern constraints are computationally represented via functions like `month_validity(): VALIDITY_KIND`, defined on [`C_DATE`](#_c_date_class), [`C_TIME`](#_c_time_class) and [`C_DATE_TIME`](#_c_date_time_class), where `VALIDITY_KIND` is an enumeration type defined in the {openehr_base_latest_base_types}[openEHR Base Types^]. The lexical elements of the patterns are mapped to the values of `VALIDITY_KIND` as follows:

* `yyyy` , `mm`, `dd` -> `VALIDITY_KIND.mandatory`
* `hh` , `mm`, `ss` -> `VALIDITY_KIND.mandatory`
* `??` -> `VALIDITY_KIND.optional`
* `XX` -> `VALIDITY_KIND.prohibited`

Accordingly, the '??' within the date constrainer pattern `yyyy-??-XX` maps to the result `optional` of the function `C_DATE.month_validity()`.

### Duration Constraints

Duration constraints follow the same general approach as Date/time constraints, such that the [`C_DURATION`](#_c_duration_class) meta-class provides a range constraint attribute `constraint: List<Interval<Iso8601_duration>>` as well as the inherited attribute `pattern_constraint: String` to represent pattern constraints. These are described in {openehr_am_adl2}#_duration_constraints[openEHR ADL2 specification^].

However, the pattern constraints are of a simpler form, and do not use the `??` or `XX` lexical elements. The pattern interpretation functions defined on [`C_DURATION`](#_c_duration_class) are therefore of the form `years_allowed: (): Boolean`, `months_allowed: (): Boolean`. Validity of duration pattern constraints may be checked using relevant functions defined on [`C_TEMPORAL_DEFINITIONS`](#_c_temporal_definitions_class).

### Constraints on Enumeration Types

Enumeration types in the reference model are assumed to have semantics expected in UML, and mainstream programming languages, i.e. to be a distinct type based on a primitive type, normally Integer or String. Each such type consists of a set of values from the domain of its underlying type, thus, a set of Integer, String or other primitive values. Each of these values is assumed to be named in the manner of a symbolic constant. Although strictly speaking UML doesn't require an enumerated type to be based on an underlying primitive type, programming languages do, hence the assumption here that values from the domain of such a type are involved.

A constraint on an enumerated type therefore consists of an AOM instance of a `C_PRIMITIVE` descendant, almost always `C_INTEGER` or `C_STRING` . The flag `_is_enumerated_type_constraint_` defined on `C_PRIMITIVE` indicates that a given `C_PRIMITIVE` is a constrainer for an enumerated type.

Since `C_PRIMITIVEs` don't have type names in ADL, the type name is inferred by any parser or compiler tool that deserialises an archetype from ADL, and stored in the `_rm_type_` attribute inherited from `C_OBJECT` . An example is shown below of a type enumeration.

.Enumerated Constraint
image::{doc_name}/diagrams/enumerated_type_constraint.png[id=enumerated_constraint, align="center", width="70%"]

A parser that deserialises from an object dump format such as ODIN, JSON or XML will not need to do this.

The form of the constraint itself is simply a series of Integer, String or other primitive values, or an equivalent range or ranges. In the above example, the ADL equivalent of the pk_percent, pk_fraction constraint on a field of type `PROPORTION_KIND` is in fact just __\{2, 3}__, and it is visualised by lookup to show the relevant symbolic names.


## Second Order Constraints

All the constraint semantics described above can be considered 'first order' in the sense that they define how specific object/attribute/object hierarchies are defined in the instance possibility space of some part of a reference model.

Some constraints however do not fit directly within the object/attribute/object hierarchy scheme, and are considered 'second order constraints' in the archetype formalism. The 'rule' constraints ('invariants' in ADL/AOM 1.4) constitute one such group. These constraints are defined in terms of first order predicate logic statements that can refer to any number of constraint nodes within the main hierarchy. These are described in <<rules_package>>.

Another type of second order constraint can be 'attached' to the object/attribute/object hierarchy in order to further limit structural possibilities. Although these constraints could also theoretically be expressed as rules, they are supported by direct additions to the main constraint model since they can be easily and intuitively represented inline in ADL and corresponding AOM structures.

### Tuple Constraints

Tuple constraints are designed to account for the very common need to constrain the values of more than one RM class attribute together. This effectively treats the attributes in question as a tuple, and the corresponding object constraints are accordingly modelled as tuples as well. A detailed explanation of tuples can be found in the ADL2 specification's {openehr_am_adl2}#_second_order_constraints[section on second order constraints^]. Additions to the main constraint model to support tuples are shown below.

.Tuple Constraint Model
image::UML/diagrams/AM-aom2.constraint_model-tuple.svg[id=tuple_constraint_model, align="center"]

In this model, the type `C_ATTRIBUTE_TUPLE` groups the co-constrained `C_ATTRIBUTEs` under a `C_COMPLEX_OBJECT`. Currently, the concrete type is limited to being `C_PRIMITIVE_OBJECT` to reduce complexity, and since it caters for all known examples of tuple constraints. In principle, any `C_DEFINED_OBJECT` could be allowed, and this may change in the future.

The tuple constraint type replaces all domain-specific constraint types defined in {openehr_am_adl14}[ADL/AOM 1.4^], including `C_DV_QUANTITY` and `C_DV_ORDINAL`.

These additions allow standard constraint structures (i.e. `C_ATTRIBUTE` / `C_COMPLEX_OBJECT` / `C_PRIMITIVE_OBJECT` hierarchies) to be 'annotated', while leaving the first order structure intact. The following example shows an archetype instance structure in which a notional `ORDINAL` type is constrained. The logical requirement is to constrain a `ORDINAL` to one of three instance possibilities, each of which consists of a pair of values for the attributes value and symbol, of type Integer and `TERMINOLOGY_CODE` respectively. Each of these three instance constraints should be understood as an alternative for the single valued owning attribute, `ELEMENT` .value. Tuple constraints achieve the requirement to express the constraints as pairs not just as allowable alternatives at the final leaf level, which would incorrectly allowing any mixing of the Integer and code values.

.Tuple Constraint Example AOM Instances
image::UML/diagrams/AM-ordinal_tuple_example.svg[id=ordinal_tuple_example, align="center"]

.Tuple Constraint Example Data
image::{doc_name}/diagrams/tuple_example_data.svg[id=tuple_constraint_example_data, align="center"]

### Assertions

Assertions are used in `ARCHETYPE_SLOTs`, in order to express the 'included' and 'excluded' archetypes for the slot. In this case, each assertion is an expression that refers to parts of other archetypes, such as its identifier (e.g. 'include archetypes with `_short_concept_name_` matching `xxxx` '). Assertions are modelled here as a generic expression tree of unary prefix and binary infix operators. Examples of archetype slots in ADL syntax are given in the openEHR {openehr_am_adl2}[ADL2 specification^].


## AOM Type Substitutions

The `C_OBJECT` types defined in <<_object_node_types>> are reproduced below, with concrete types that may actually occur in archetypes shown in dark yellow / non-italic.

.C_Object Substitutions
image::{doc_name}/diagrams/c_object_substitutions.svg[id=c_object_substitutions, align="center"]

Within a specialised archetype, nodes that redefine corresponding nodes in the parent are normally of the same `C_OBJECT` type (we can think of this as a 'meta-type', since the RM type is the 'type' in the information model sense), but in some cases may also be of different `C_OBJECT` types.

The rules for meta-type redefinition are as follows:

* A node of each meta-type can be redefined by a node of the same meta-type, with narrowed / added constraints;
* `ARCHETYPE_SLOT` can be redefined by:
** one or more `C_ARCHETYPE_ROOT` nodes taken together, considered to define a 'filled' version of the slot;
** an `ARCHETYPE_SLOT` , in order to close the slot.
* A `C_ARCHETYPE_ROOT` node can be redefined by:
** A `C_ARCHETYPE_ROOT` , where the archetype_ref of the redefining node is a specialisation of that mentioned in the parent node.
* A 'terminal' `C_COMPLEX_OBJECT` node containing no constraint other than RM type, `_node_id_` and possibly occurrences (i.e. having no substructure), can be redefined by a constraint of any other AOM type other than `C_PRMITIVE_OBJECT`.

The 'terminal' `C_COMPLEX_OBJECT` can be understood as a placeholder node primarily defined for the purpose of stating RM type and meaning (at-code/id-code).


## Class Definitions



#### Conformance Semantics: C_ATTRIBUTE

The following functions formally define the conformance interfaces of any `ARCHETYPE_CONSTRAINT` node in a specialised archetype to the corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path.

```eiffel
c_conforms_to (other: ARCHETYPE_CONSTRAINT; rmcc: FUNCTION<<a_type, other_type: String>, Boolean>): Boolean
        -- True if this node on its own (ignoring any subparts) expresses the same or narrower 
        -- constraints as `other`.
        -- Returns False if any of the following is incompatible:
        --	 * cardinality
        --	 * existence
    require
        other /= Void
        rmcc /= Void
    deferred
    end
        
c_congruent_to (other: ARCHETYPE_CONSTRAINT): Boolean
        -- True if this node on its own (ignoring any subparts) expresses no additional 
        -- constraints than `other`.
    require
        other /= Void
    deferred
    end
```

The following effected functions defined in `C_ATTRIBUTE` define the conformance of an attribute node in a specialised archetype to the corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path.

```eiffel
c_conforms_to (other: C_ATTRIBUTE; rmcc: FUNCTION<<a_type, other_type: String>, Boolean>): Boolean
        -- True if this node on its own (ignoring any subparts) expresses the same or narrower 
        -- constraints as `other'.
        -- Returns False if any of the following is incompatible:
        --	 * cardinality
        --	 * existence
    do
        Result := existence_conforms_to (other) and 
            ((is_single and other.is_single) or else
            (is_multiple and cardinality_conforms_to (other)))
    end
        
c_congruent_to (other: C_ATTRIBUTE): Boolean
		-- True if this node on its own (ignoring any subparts) expresses no additional 
        -- constraints than `other'.
    do
        Result := existence = Void and ((is_single and other.is_single) or
                (is_multiple and other.is_multiple and cardinality = Void))
    end

existence_conforms_to (other: C_ATTRIBUTE): Boolean
		-- True if the existence of this node conforms to other.existence
    require
        other /= Void
    do
        if existence /= Void and other.existence /= Void then
            Result := other.existence.contains (existence)
        else
            Result := True
        end
    end

cardinality_conforms_to (other: C_ATTRIBUTE): Boolean
		-- True if the cardinality of this node conforms to other.cardinality, if it exists
    require
        other /= Void
    do
        if cardinality /= Void and other.cardinality /= Void then
            Result := other.cardinality.contains (cardinality)
        else
            Result := True
        end
    end

collective_occurrences_of (parent_object: C_OBJECT;
            rm_prop_mult: FUNCTION <<rm_type_name, rm_property_path: String>, Multiplicity_interval>): Multiplicity_interval
        -- compute collective occurrences according to VSONCO, of all object nodes under this 
        -- attribute node that redefine `parent_object`, which is assumed to be an object node 
        -- within `other`, the specialisation parent of this C_ATTRIBUTE
    require
        parent_object /= Void
        other.is_multiple
    do
        -- make a 0..0 interval
        create Result.make_prohibited
        
        children.do_all (
            agent (child_co, parent_co: C_OBJECT;
                    rm_prop_mult: FUNCTION <<rm_type_name, rm_property_path: String>, Multiplicity_interval>;
                    interval: Multiplicity_interval)
                local
                    child_occ: Multiplicity_interval
                do
                    if child_co.node_id_conforms_to (parent_co) then
                        -- child object node may have no occurrences
                        child_occ := child_obj.effective_occurrences (rm_prop_mult)

                        interval.set_lower (interval.lower + child_occ.lower)
                        if child_occ.upper_unbounded then
                            interval.set_upper_unbounded
                        elseif not interval.upper_unbounded then
                            interval.set_upper (interval.upper + child_occ.upper)
                        end
                    end
                end (?, a_parent_co, rm_prop_mult, Result)
        )
                
        if cardinality /= Void and then not cardinality.upper_unbounded then
            Result.set_upper (if Result.upper_unbounded then cardinality.upper else Result.upper.min (cardinality.upper) end)
        end
    end
```

#### Validity Rules: C_ATTRIBUTE

The validity rules are as follows:

*VCARM*: attribute name reference model validity: an attribute name introducing an attribute constraint block must be defined in the underlying information model as an attribute (stored or computed) of the type which introduces the enclosing object block.

*VCAEX*: archetype attribute reference model existence conformance: the existence of an attribute, if set, must conform, i.e. be the same or narrower, to the existence of the corresponding attribute in the underlying information model.

*VCAM*: archetype attribute reference model multiplicity conformance: the multiplicity, i.e. whether an attribute is multiply- or single-valued, of an attribute must conform to that of the corresponding attribute in the underlying information model.

*VDIFV*: archetype attribute differential path validity: an archetype may only have a differential path if it is specialised..

The following validity rule applies to redefinition in a specialised archetype:

*VDIFP*: specialised archetype attribute differential path validity: if an attribute constraint has a differential path, the path must exist in the flat parent, and also be valid with respect to the reference model, i.e. in the sense that it corresponds to a legal potential construction of objects.

*VSANCE*: specialised archetype attribute node existence conformance: the existence of a redefined attribute node in a specialised archetype, if stated, must conform to the existence of the corresponding node in the flat parent archetype, by having an identical range, or a range wholly contained by the latter.

*VSAM*: specialised archetype attribute multiplicity conformance: the multiplicity, i.e. whether an attribute is multiply- or single-valued, of a redefined attribute must conform to that of the corresponding attribute in the parent archetype.

The following validity rules apply to single-valued attributes, i.e when `C_ATTRIBUTE._is_multiple_` is False:

*VACSO*: single-valued attribute child object occurrences validity: the occurrences of a child object of a single-valued attribute cannot have an upper limit greater than 1.

The following validity rules apply to container attributes, i.e when `C_ATTRIBUTE._is_multiple_` is True:

*VACMCU*: cardinality/occurrences upper bound validity: where a cardinality with a finite upper bound is stated on an attribute, for all immediate child objects for which an occurrences constraint is stated, the occurrences must either have an open upper bound (i.e. `n..*`) which is interpreted as the maximum value allowed within the cardinality, or else a finite upper bound which is \<= the cardinality upper bound.

*VACMCO*: cardinality/occurrences orphans: it must be possible for at least one instance of one optional child object (i.e. an object for which the occurrences lower bound is 0) and one instance of every mandatory child object (i.e. object constraints for which the occurrences lower bound is >= 1) to be included within the cardinality range.

*VCACA*: archetype attribute reference model cardinality conformance: the cardinality of an attribute must conform, i.e. be the same or narrower, to the cardinality of the corresponding attribute in the underlying information model.

The following validity warnings apply to container attributes, i.e when `C_ATTRIBUTE._is_multiple_` is True:

*WACMCL*: cardinality/occurrences lower bound validity: where a cardinality with a finite upper bound is stated on an attribute, for all immediate child objects for which an occurrences constraint is stated, the sum of occurrences lower bounds should be lower than the cardinality upper limit.

The following validity rule applies to cardinality redefinition in a specialised archetype:

*VSANCC*: specialised archetype attribute node cardinality conformance: the cardinality of a redefined (multiply-valued) attribute node in a specialised archetype, if stated, must conform to the cardinality of the corresponding node in the flat parent archetype by either being identical, or being wholly contained by the latter.


#### Occurrences inferencing rules

The notion of 'occurrences' does not exist in an object model that might be used as the reference model on which archetypes are based, because it is a class model. However, archetypes commonly constrain the occurrences of object nodes under a container attribute, indicating how many objects conforming to a specific object constraint node might exist.

There are various circumstances where it is useful to know the effective occurrences of an archetype object node. One is in validation, in order to determine validity of occurrences constraints; another is in archetype editor tools. Similarly, in an {openehr_am_opt2}[Operational Template^], an occurrences constraint is required on all child object nodes of container attributes. Most such constraints come from the source template(s) and archetypes, but often there will be nodes with no occurrences set. In these cases, the occurrences constraint is inferred from the archetype and the reference model according to the following algorithm, where `c_object` represents any object node in an archetype.

```eiffel
effective_occurrences (rm_prop_mult: FUNCTION <<rm_type_name, rm_property_path: String>, Multiplicity_interval>): Multiplicity_interval
        -- Compute effective occurrences, where no local occurrences constraint set. If the owning 
        -- `C_ATTRIBUTE._cardinality_` is set, use its upper value, else use RM multiplicity of the 
        -- owning attribute. 
        -- `rm_attr_prop_mult` is a function that knows how to compute effective object multiplicity
        -- by looking at the owning RM property.
        -- If local `occurrences` not set, always assume 0 as the lower bound.
    do
        if occurrences /= Void then
            Result := occurrences

        elseif parent /= Void then
            if parent.cardinality /= Void then
                if parent.cardinality.interval.upper_unbounded then
                    create Result.make_open
                else
                    create Result.make_bounded (0, parent.cardinality.interval.upper)
                end
            elseif parent.parent /= Void then
                Result := rm_prop_mult (parent.parent.rm_type_name, parent.parent.rm_attribute_path)
                Result.set_lower (0)
            else
                create Result.make_open
            end
        else
            create Result.make_open
        end
    end
```

In the above, `_rm_prop_mult_` is a reference to a function within an RM schema representation, which has the following logic:

```eiffel
object_multiplicity (rm_type_name, rm_property_path: String): Multiplicity_interval
        -- compute the effective object multiplicity of objects at rm_property_path within type rm_type_name
        -- from the Reference Model
    require
        rm_type_name /= Void
        rm_property_path /= Void
    do
        rm_property_def := get_rm_property_def (rm_type_name, rm_property_path)
        if rm_property_def.is_container then
            if rm_property_def.cardinality.upper_unbounded then
                create Result.make_upper_unbounded (0)
            else
                create Result.make_bounded (0, rm_property_def.cardinality.upper)
            end
        else
            Result := rm_property_def.existence
        end
    end
```

How this is concretely implemented depends on the modelling environment. One possible RM model implementation is described in the {openehr_bmm}[openEHR Basic meta-model (BMM) specification^].

#### Conformance Semantics: C_OBJECT

The following functions, which implement the precursors from `ARCHETYPE_CONSTRAINT` formally define the conformance of a `C_OBJECT` node in a specialised archetype to the corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path. Note that the pre-conditions from the precursors are understood as inherited.

```eiffel
c_conforms_to (other: C_OBJECT; rmcc: FUNCTION<<a_type, other_type: String>, Boolean>): Boolean
        -- True if this node on its own (ignoring any subparts) expresses strictly narrower constraints 
        -- as `other'. 
        -- `other' is typically from the flat parent archetype.
        -- `rmcc' is an agent (lambda) that can test an RM type's conformance to another RM type
        -- Returns True when the following is True:
        --  * rm_type_name is the same or a subtype of rm_type_name of other;
        --  * node_id is the same, or redefined to a legal code at the level of the owning archetype
        --  * is_root or else
        --    parent.is_multiple or else -- we do the real check from the parent C_ATTRIBUTE
        --    parent.is_single and
        --    occurrences is same (= Void) or a sub-interval
        --
    do
        Result := node_id_conforms_to (other) and
            (rm_type_name.is_case_insensitive_equal (other.rm_type_name) or else
            rmcc (rm_type_name, other.rm_type_name)) and
            (is_root or else parent.is_multiple or else parent.is_single and occurrences_conforms_to (other))
    end

c_congruent_to (other: C_OBJECT): Boolean
        -- True if this node on its own (ignoring any subparts) expresses no constraints in addition 
        -- to `other', other than possible redefinition of the node id, which doesn't matter, since 
        -- this won't get lost in a compressed path.
        -- Current and `other' are typically from flat archetypes being compared to generate a diff.
        -- Used to determine if path segments can be compressed.
        -- Returns True if:
        --	 * rm_type_name is identical
        --	 * occurrences is Void or else identical to other.occurrences
        -- 	 * sibling_order is Void or else identical to other.sibling_order
        --	 * node_id is identical or else is the only child that overlays the parent node
    do
        Result := rm_type_name.is_case_insensitive_equal (other.rm_type_name) and
            (occurrences = Void or else (other.occurrences /= Void and then 
                occurrences.is_equal (other.occurrences))) and
            (sibling_order = Void or else (other.sibling_order /= Void and then 
                sibling_order.is_equal (other.sibling_order))) and
            node_reuse_congruent (other)
    end

occurrences_conforms_to (other: C_OBJECT): Boolean
        -- True if this node's occurrences conforms to other.occurrences;
        -- `other' is assumed to be in a flat archetype.
        -- only redefinitions of single-occurrence nodes can be dealt with here;
        -- redefinitions of multiply-occurrences nodes
        -- must be evaluated at the owning attribute, according to VSONCO.
    do
        if occurrences /= Void and other.occurrences.upper = 1 then
            Result := other.occurrences.contains (occurrences)
        else
            Result := True
        end
    end

node_id_conforms_to (other: C_OBJECT): Boolean
    require
        other /= Void
    do
        Result := codes_conformant (node_id, other.node_id)
    end

node_reuse_congruent (other: C_OBJECT): Boolean
        -- True if this node is the sole re-using node of the corresponding node in the flat
    require
        other /= Void
    do
        Result := node_id_conforms_to (other) and
            (is_root or else
            attached parent and then parent.child_reuse_count (other.node_id) = 1)
    end

```

#### Validity Rules: C_OBJECT

The validity rules for all `C_OBJECTs` are as follows:

*VCORM* object constraint type name existence: a type name introducing an object constraint block must be defined in the underlying information model.

*VCORMT* object constraint type validity: a type name introducing an object constraint block must be the same as or conform to the type stated in the underlying information model of its owning attribute.

*VCOCD* object constraint definition validity: an object constraint block consists of one of the following (depending on subtype): an 'any' constraint; a reference; an inline definition of sub-constraints, or nothing, in the case where occurrences is set to `{0}`.

*VCOID* object node identifier validity: every object node must have a node identifier.

*VCOSU* object node identifier validity: every object node must be unique within the archetype.

The following validity rules govern `C_OBJECTs` in specialised archetypes.

*VSONT* specialised archetype object node meta-type conformance: the meta-type of a redefined object node (i.e. the AOM node type such as `C_COMPLEX_OBJECT` etc) in a specialised archetype must be the same as that of the corresponding node in the flat parent, with the following exceptions: a `C_COMPLEX_OBJECT` with no child attributes may be redefined by a node of any AOM type except `C_PRIMITIVE_OBJECT`; a `C_COMPLEX_OBJECT_PROXY`, may be redefined by a `C_COMPLEX_OBJECT`; an `ARCHETYPE_SLOT` may be redefined by `C_ARCHETYPE_ROOT` (i.e. 'slot-filling'). See also validity rules VDSSID and VARXID.

*VSONCT* specialised archetype object node reference type conformance: the reference model type of a redefined object node in a specialised archetype must conform to the reference model type in the corresponding node in the flat parent archetype by either being identical, or conforming via an inheritance relationship in the relevant reference model.

_Deprecated_: *VSONIR* specialised archetype redefined object node identifier condition: the node identifier of an object node in a specialised archetype that is a redefinition of a node in the flat parent must be redefined if any of reference model type, node identifier definition in the terminology, or occurrences of the immediate object constraint is redefined, with the exception of occurrences being redefined to \{0}, i.e. exclusion.

_Deprecated_: *VSONI* specialised archetype redefined object node identifier validity: if an object node in a specialised archetype is a redefinition of a node in the flat parent according to VSONIR, and the parent node carries a node identifier, it must carry a node identifier specialised at the level of the child archetype. Otherwise it must carry the same node identifier (or none) as the corresponding parent node.

*VSONIN* specialised archetype new object node identifier validity: if an object node in a specialised archetype is a new node with respect to the flat parent, and it carries a node identifier, the identifier must be a 'new' node identifier, specialised at the level of the child archetype.

*VSONIF* specialised archetype object node identifier validity in flat siblings: the identification (or not) of an object node in a specialised archetype must be valid with respect to any sibling object nodes in the flattened parent (see VACMI).

*VSONCO* specialised archetype object node occurrences redefinition validity:

For object node(s) redefining a single-occurrences node in the specialisation flat parent (i.e. a node having occurrences upper bound = 1), the child node(s) occurrences interval(s) must be wholly contained within that of the parent, i.e. narrower. If there are multiple such nodes, each is an alternative, and only one can be applied at runtime.

For nodes specialising a multiple-occurrences parent node (which will always be within a container attribute), any or all such nodes might apply to data at runtime. Consequently, it is the collective occurrences of all such nodes, that must be compared to the occurrences of the parent - no assumption is made that the occurrences of any specific redefining node on its own need conform to that of the redefined node.

Formally, the _collective occurrences_ interval of all nodes in a _specialised node set_ must _intersect_ with the flattened occurrences interval of the corresponding parent node, for each object in the set to be valid. If there is no intersection, the occurrences of all members of the set is considered invalid.

A _specialised node set_ is the set of nodes in a flat child archetype that specializes a multiple-occurrences parent node, which may include the parent node itself if it appears in the flattened archetype.

The _collective occurrences_ of a specialised node set is computed as the interval consisting of:

* lower bound = the sum of the lower bounds of the occurrences of the members of the specialised node set;
* upper bound = minimum of:
** sum of upper bounds of the occurrences of the members of the specialised node set; where any of the upper bounds is unbounded, the sum is unbounded;
** upper bound of the flattened cardinality of the containing attribute.

For any member of the specialised node set that does not have a local occurrences override, the occurrences is that of the redefined parent node.

A consequence of the intersection rule and the priority of the cardinality of the owning attribute is that the occurrences of any node in a specialisation set may have an unbounded upper limit (i.e. `*`) even if the upper bound of the cardinality of the owning attribute is finite.

*VSONPT* specialised archetype prohibited object node AOM type validity: the occurrences of a redefined object node in a specialised archetype, may only be prohibited (i.e. \{0}) if the matching node in the parent is of the same AOM type.

*VSONPI* specialised archetype prohibited object node AOM node id validity: a redefined object node in a specialised archetype with occurrences matching \{0} must have exactly the same `_node_id_` as the node in the flat parent being redefined.

*VSONPO* specialised archetype object node prohibited occurrences validity: the occurrences of a new (i.e. having no corresponding node in the parent flat) object node in a specialised archetype, if stated, may not be 'prohibited', i.e. \{0}, since prohibition only makes sense for an existing node.

*VSSM* specialised archetype sibling order validity: the sibling order node at-code (id-code) used in a sibling marker in a specialised archetype must refer to a node found within the same container in the flat parent archetype, or a specialised version of any such node, redefined in the current archetype.


#### Validity Rules: C_COMPLEX_OBJECT

The validity rules for `C_COMPLEX_OBJECTs` are as follows:

*VCATU* attribute uniqueness: sibling attributes occurring within an object node must be uniquely named with respect to each other, in the same way as for class definitions in an object reference model.


#### Validity Rules: C_ARCHETYPE_ROOT

The following validity rules apply to `C_ARCHETYPE_ROOT` objects:

*VARXNC* external reference node identifier validity: if the external reference object is a redefinition of either a slot node, or another external reference node, the `_node_id_` of the object must conform to (i.e. be the same or a child of) the `_node_id_` of the corresponding parent node.

*VARXAV* external reference node archetype reference validity: if the reference object is a redefinition of another external reference node, the `_archetype_ref_` of the object must match a real archetype that has as an ancestor the archetype matched by the archetype reference mentioned in the corresponding parent node.

*VARXTV* external reference type validity: the reference model type of the reference object archetype identifier must be identical, or conform to the type of the slot, if there is one, in the parent archetype, or else to the reference model type of the attribute in the flat parent under which the reference object appears in the child archetype.

*VARXR* external reference refers to resolvable artefact: the archetype reference must refer to an artefact that can be found in the current repository.

The following validity rules apply to a `C_ARCHETYPE_ROOT` that specialises a `ARCHETYPE_SLOT` in the flat parent archetype:

*VARXS* external reference slot conformance: where an archetype reference redefines an archetype slot in the flat parent, it must conform to the archetype slot node by being of a reference model type from the same reference model as the current archetype.

*VARXID* external reference slot filling id validity: an external reference node defined as a filler for a slot in the parent archetype must have a node id that is a specialisation of that of the slot.


#### Validity Rules: ARCHETYPE_SLOT

The validity rules for `ARCHETYPE_SLOTs` are as follows:

*VDFAI* archetype identifier validity in definition. Any archetype identifier mentioned in an archetype slot in the definition section must conform to the published openEHR specification for archetype identifiers.

*VDSIV* archetype slot 'include' constraint validity. The 'include' constraint in an archetype slot must conform to the slot constraint validity rules.

*VDSEV* archetype slot 'exclude' constraint validity. The 'exclude' constraint in an archetype slot must conform to the slot constraint validity rules.

The slot constraint validity rules are as follows:

```eiffel
if includes not empty and = any then
    not (excludes empty or /= any) ==> VDSEV Error
elseif includes not empty and /= any then
    not (excludes empty or = any) ==> VDSEV Error
elseif excludes not empty and = any then
    not (includes empty or /= any) ==> VDSIV Error
elseif excludes not empty and /= any then
    not (includes empty or = any) ==> VDSIV Error
end
```

The following validity rules apply to `ARCHETYPE_SLOTs` defined as the specialisation of a slot in the parent archetype:

*VDSSID* slot redefinition child node id: a slot node in a specialised archetype that redefines a slot node in the flat parent must have an identical node id.

*VDSSM* specialised archetype slot definition match validity. The set of archetypes matched from a library of archetypes by a specialised archetype slot definition must be a proper subset of the set matched from the same library by the parent slot definition.

*VDSSP* specialised archetype slot definition parent validity. The flat parent of the specialisation of an archetype slot must be not be closed (is_closed = False).

*VDSSC* specialised archetype slot definition closed validity. In the specialisation of an archetype slot, either the slot can be specified to be closed (is_closed = True) or the slot can be narrowed, but not both.


#### Validity Rules: C_COMPLEX_OBJECT_PROXY

The following validity rules applies to internal references:

*VUNT* `use_node` reference model type validity: the reference model type mentioned in an `C_COMPLEX_OBJECT_PROXY` node must be the same as or a super-type (according to the reference model) of the reference model type of the node referred to.

*VUNP* `use_node` path validity: the path mentioned in a use_node statement must refer to an object node defined elsewhere in the same archetype or any of its specialisation parent archetypes, that is not itself an internal reference node, and which carries a node identifier if one is needed at the reference point.

The following validity rule applies to the redefinition of an internal reference in a specialised archetype:

*VSUNT* use_node specialisation parent validity: a `C_COMPLEX_OBJECT_PROXY` node may be redefined in a specialised archetype by another `C_COMPLEX_OBJECT_PROXY` (e.g. in order to redefine occurrences), or by a `C_COMPLEX_OBJECT` structure that legally redefines the target `C_COMPLEX_OBJECT` node referred to by the reference.


#### Validity Rules: C_PRIMITIVE_OBJECT

Validity rules applying to all `C_PRIMITIVE_OBJECT` types are as follows:

*VOBAV* object node assumed value validity: the value of an assumed value must fall within the value space defined by the constraint to which it is attached.

#### Conformance Semantics: C_PRIMITIVE_OBJECT

The following functions redefine those of the same names from `C_OBJECT`, and formally define the conformance of a node of a `C_PRIMITIVE_OBJECT` descendant type in a specialised archetype to a corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path and of the same AOM type.

```eiffel
c_conforms_to (other: C_PRIMITIVE_OBJECT; rmcc: FUNCTION<<a_type, other_type: String>, Boolean>): Boolean
        -- True if this node on its own (ignoring any subparts) expresses the same or narrower 
        -- constraints 
        -- as `other'. Returns True only when the following is True:
        --   * occurrences conforms
        --   * `rm_type_name' is identical to that in `other'
        -- `rmcc' is an agent (lambda) that can test an RM type's conformance to another RM type
    do
        Result := precursor (other, rmcc) and c_value_conforms_to (other)
    end

c_value_conforms_to (other: like Current): Boolean
        -- True if this node expresses a value constraint that conforms to that of `other'
    deferred
    end

c_congruent_to (other: C_PRIMITIVE_OBJECT): Boolean
        -- True if this node on its own (ignoring any subparts) expresses no constraints in 
        -- addition to `other'
    do
		Result := constrained_typename.is_case_insensitive_equal (other.constrained_typename) and
            c_value_congruent_to (other)
    end

c_value_congruent_to (other: C_PRIMITIVE_OBJECT): Boolean
        -- True if this node's value constraint is the same as that of `other'
    deferred
    end
    
constrained_typename: String
        -- the same as the C_XX clas name with the "C_" removed, but for some types e.g. Date/time types
        -- it is not true.
    do
        Result := generating_type.name
        Result.remove_head (2)
    end
```


#### Conformance semantics: C_BOOLEAN

The following functions formally define the conformance of a `C_BOOLEAN` node in a specialised archetype to a corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path and of the same AOM type.

```eiffel
c_value_conforms_to (other: C_BOOLEAN): Boolean
        -- True if this node is a strict subset of `other'
    do
        Result := other.any_allowed or
            constraint.count < other.constraint.count and
            for all c in constraint | other.constraint.has (c)
    end

c_value_congruent_to (other: C_BOOLEAN): Boolean
        -- True if this node's value constraint is the same as that of `other'
    do
        Result := constraint.count = other.constraint.count and
            for all c in constraint | other.constraint.has (c)
    end

```


#### Conformance semantics: C_STRING

The following functions formally define the conformance of a `C_STRING` node in a specialised archetype to a corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path and of the same AOM type.

```eiffel
c_value_conforms_to (other: C_STRING): Boolean
        -- True if `constraint' is a strict subset of other.constraint
    do
        Result := other.any_allowed or
            constraint.count < other.constraint.count and
            for all c in constraint | other.constraint.has (c)
    end

c_value_congruent_to (other: C_STRING): Boolean
        -- True if this node's value constraint is the same as that of `other'
    do
        Result := constraint.count = other.constraint.count and then
            across constraint as str_csr all
                other.constraint.i_th (str_csr.cursor_index).is_equal (str_csr.item)
            end
    end
```


#### Conformance semantics: C_ORDERED

The following functions implement those of the same names in `C_PRIMITIVE_OBJECT` and formally define the conformance of a node of a `C_ORDERED` descendant type in a specialised archetype to a corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path and of the same AOM type.

```eiffel
c_value_conforms_to (other: C_ORDERED): Boolean
        -- True if this node is a strict subset of `other`
    do
        Result := other.any_allowed or
            for_all c:constraint |
                there_exists oc:other.constraint | oc.contains (c)
            end
    end

c_value_congruent_to (C_ORDERED): Boolean
        -- True if this node is the same as `other`
    do
        Result := constraint.count = other.constraint.count and
            for_all c:constraint |
                c.is_equal (other.constraint.i_th (constraint.index_of(c)))
            end
    end
```


#### Conformance semantics: C_TEMPORAL

The following functions redefine those of the same names in `C_ORDERED` and formally define the conformance of a node of a `C_TEMPORAL` descendant type in a specialised archetype to a corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path and of the same AOM type.

```eiffel
c_value_conforms_to (other: C_TEMPORAL): Boolean
        -- True if this node is a strict subset of `other`
    do
        Result := precursor (other) and
            other.pattern_constraint.is_empty or
                not pattern_constraint.is_empty and then
                valid_pattern_constraint_replacement (pattern_constraint, other.pattern_constraint)
    end

c_value_congruent_to (other: C_TEMPORAL): Boolean
        -- True if this node's value constraint is the same as that of `other`
    do
        Result := precursor (other) and
            pattern_constraint ~ other.pattern_constraint
    end

```


#### Conformance semantics: C_TERMINOLOGY_NODE

The following functions implement those of the same names in `C_PRIMITIVE_OBJECT` and formally define the conformance of a `C_TERMINOLOGY_CODE` node in a specialised archetype to a corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path and of the same AOM type.

```eiffel
c_value_conforms_to (other: C_TERMINOLOGY_CODE): Boolean
        -- True if this node expresses a value constraint that conforms to that of `other'
    local
        this_vset, other_vset: List<String>
    do
        if other.any_allowed then
            Result := True
            
        -- check that constraint_status is valid. The following order hold down the specialisation
        -- lineage, from lowest to highest: example (3) → preferred (2) → exensible (1) → required (0); 
        -- numerically, specialisation child must be <= parent
        elseif effective_constraint_status > other.effective_constraint_status then
            Result := False
        
        -- if parent's constraint status is not 'required', then child automatically conforms
        elseif other.effective_constraint_status > 0 then
            Result := True
        
        -- if we get here, we know that parent and child terminology constraint strengths are both `required`
        -- so perform the value-set conformance check
        elseif is_valid_value_set_code (constraint) and is_valid_value_set_code (other.constraint) then
            -- firstly, check if the other value-set is empty, which means there is no value-set, 
            -- i.e. no constraint, which means that this object's value set automatically conforms.
            other_vset := other.value_set_expanded
            if not other_vset.is_empty then
                this_vset := value_set_expanded
                Result := codes_conformant (constraint, other.constraint) and then
                    for_all v: this_vset | other_vset.has (v)
            else
                Result := True
            end
            
        -- otherwise it's at-codes, so we just check lexical conformance
        else
            Result := codes_conformant (constraint, other.constraint)
        end
    end

c_value_congruent_to (other: C_TERMINOLOGY_CODE): Boolean
        -- True if this node's value constraint is the same as that of `other'
    local
        this_vset, other_vset: List<String>
    do
        -- if both constraints are ac-codes, compare the value-set expansions
        if is_valid_value_set_code (constraint) and is_valid_value_set_code (other.constraint) then
            this_vset := value_set_expanded
            other_vset := other.value_set_expanded
            Result := constraint.is_equal (other.constraint) and then
                this_vset.count = other_vset.count and then
                    for_all v: this_vset | other_vset.has (v)

        -- otherwise it's at-codes, so we just compare them literally
        else
            Result := constraint.is_equal (other.constraint)
        end
        
        -- make sure constraint status is identical
        Result := Result and effective_constraint_status = other.effective_constraint_status
    end

```


#### Conformance semantics: C_SECOND_ORDER

The following functions formally define the conformance interfaces of any `C_SECOND_ORDER` node in a specialised archetype to the corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path.

```eiffel
c_conforms_to (other: C_SECOND_ORDER; rmcc: FUNCTION<<a_type, other_type: String>, Boolean>): Boolean
        -- True if this node on its own (ignoring any subparts) expresses the same or narrower 
        -- constraints as `other`.
        -- Returns False if any of the following is incompatible:
        --	 * cardinality
        --	 * existence
    require
        other /= Void
        rmcc /= Void
    deferred
    end
        
c_congruent_to (other: C_SECOND_ORDER): Boolean
        -- True if this node on its own (ignoring any subparts) expresses no additional 
        -- constraints than `other`.
    require
        other /= Void
    deferred
    end
```

The following functions implement those of the same names from `C_SECOND_ORDER`, and formally define the conformance interfaces of any `C_ATTRIBUTE_TUPLE` node in a specialised archetype to the corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path.

```eiffel
c_conforms_to (other: C_ATTRIBUTE_TUPLE; rmcc: FUNCTION<<a_type, other_type: String>, Boolean>): BOOLEAN
        -- True if this node is a subset of, or the same as `other'
    do
        Result :=
            for_all t: tuples |
                there_exists ot: other.tuples | t.c_conforms_to (ot, rmcc)
            or else tuples.count < other.tuples.count and
                for_all t: tuples |
                    there_exists ot: other.tuples | t.c_congruent_to (ot)
    end

c_congruent_to (other: C_ATTRIBUTE_TUPLE): BOOLEAN
        -- True if Current adds no further constraints with respect to `other'
    do
        Result := for_all t: tuples |
            there_exists ot: other.tuples | t.c_congruent_to (ot)
    end
```

The following functions implement those of the same names from `C_SECOND_ORDER`, and formally define the conformance interfaces of any `C_PRIMITIVE_TUPLE` node in a specialised archetype to the corresponding node in a parent archetype, where 'corresponding' means a node found at the same or a congruent path.

```eiffel
c_conforms_to (other: C_PRIMITIVE_TUPLE; rmcc: FUNCTION<<a_type, other_type: String>, Boolean>): BOOLEAN
        -- True if this node is a subset of, or the same as `other'
    do
        if count = other.count then
            Result := across members as cpo_csr all
                cpo_csr.item.same_type (other.members.i_th (cpo_csr.cursor_index)) and then
                    cpo_csr.item.c_conforms_to (other.members.i_th (cpo_csr.cursor_index), rmcc)
            end
        end
    end

c_congruent_to (other: C_PRIMITIVE_TUPLE): BOOLEAN
        -- True if Current and `other' are semantically the same
    do
        if count = other.count then
            Result := across members as cpo_csr all
                cpo_csr.item.same_type (other.members.i_th (cpo_csr.cursor_index)) and then
                    cpo_csr.item.c_congruent_to (other.members.i_th (cpo_csr.cursor_index))
            end
        end
    end
```


# The Rules Package

The AOM `rules` package makes use of the `org.openehr.lang.beom` package described in the {openehr_basic_expression_language}[openEHR Basic Expression Language (BEL) specification^] and adds a small number of other classes to support two needs in the AOM:

* representation of the assertions within `ARCHETYPE_SLOT` (i.e. the 'includes' and 'excludes'), which are concretely regex pattern matchers for Archetype Ids;
* representation of statements within the `rules` section of an archetype.

The AOM `rules` package is illustrated below.

.am.aom2.rules Package
image::UML/diagrams/AM-aom2.rules.svg[id=rules_package, align="center"]

## Archetype Slot Assertions

The `ARCHETYPE_SLOT` class  contains `_includes_` and `_excludes_` attributes, which are constraints on archetypes allowed to populate the slot location at run-time. These are represented by `ASSERTIONs` containing expressions of the form: 

```
archetype_path matches Archetype-id-regex-matcher
```

These are represented by the structure `EXPR_ARCHETYPE_REF matches EXPR_ARCHETYPE_ID_CONSTRAINT`.

## Archetype Rules

The `rules` section of an archetype may contain various kinds of statements that may be used to express constraints ranging across multiple nodes, i.e. constraints that can't be expressed inline within the main `definition` section structure. The Basic Expression Language enables the representation of the following kinds of statements in an archetype:

* _declarations_ of variables;
* _assignments_ of expression results to variables;
* _assertions_ of values.

Expressions (i.e. evaluable value-returning operations, function calls etc) appear within assignments and assertions. Within these expressions, two kinds of entity are needed that are not directly supported by the expression meta-types defined in the `lang.beom` package, as follows:

* instances of `EXPR_ARCHETYPE_REF` to express archetype paths as proxies for runtime value references, and;
* `C_PRIMITIVE_OBJECT` constraints as Boolean-valued sub-expressions.

The first of these allows a path reference to a leaf in an archetype (e.g. systolic blood pressure) to be used as a special kind of variable whose value can be replaced at runtime by all instances that are found at that archetype path in the data.

The second allows typical archetype constraints of the form `value matches value_constraint` to be used inline in expressions. This facilitates the representation of common expressions of this form within larger rules, e.g. `/path/to/systolic/pressure matches {|140..160|}`.

## Class Descriptions

# The RM Overlay Package

## Overview

Classes in the `aom2.rm_overlay` package are used to support definition of settings relating to unconstrained RM attributes of constrained object nodes (including the top-level object) within the archetype. The UML model is shown below.

.`am.aom2.rm_overlay` package
image::UML/diagrams/AM-aom2.rm_overlay.svg[id=rm_overlay_package, align="center"]

## Semantics

### RM Attribute Visibility

Currently, the only RM overlay settings are for RM attribute visibility, which relates to RM attributes within the context of an archetype. This is described in more detail in the {openehr_am_adl2}#_rm_overlay_section[ADL2 specification^].

The visibility settings consist of a list of per-RM attribute settings, in the form of instances of the class `RM_ATTRIBUTE_VISIBILITY`, each keyed by the RM path to the node(s) to which they apply. The path is formed of an object node path within the archetype followed by a path to an RM attribute, which may be on an already-constrained path, or may be a path not already included in the archetype structure. The former part is one of:

* the root path, `/`;
* an object path within the archetyped structure e.g. `/items[at0019]` (`/items[id20]`).

The latter part is a path containing no object identifiers (at-codes / id-codes), of one or mode RM attribute names from the Reference Model. The terminal attribute name will almost always be a single-valued attribute, since the visibility of container attributes will almost always be defined in terms of specifically constrained child objects, i.e. part of the archetyped structure.

Two types of RM visibility can be specified. First, in terms of attribute visibility within modelling tools, using the values `show` and `hide`. A non-archetyped RM attribute is by default not visible within an archetype modelling tool visualisation, since it is not part of the archetyped structure. Without visibility settings, the only means of displaying such an attribute is to display all non-archetyped RM attributes in some generic fashion. Setting the visibility on a particular RM attribute path to `show` indicates to the tool that this RM attribute should be displayed, along with the archetyped structure - preferably in a visually distinct way. This enables modellers to see specific model attributes that are built into the RM, and do not need to be modelled as archetype objects.

The `hide` setting is to allow two possibilities:

* to reverse the `show` setting for an attribute's visibility in a specialisation parent in the current archetype; and
* to hide an already-archetyped RM attribute in a specialisation child archetype.

The visibility setting for an RM attribute with respect to the specialisation lineage (aka inheritance hierarchy) is just the most recent setting, i.e. the setting from the deepest child.

A second visibility setting is an optional _alias_, which is specified in the form of an at-code whose definition is found in the `terminology` section of the archetype, in the usual fashion. An alias can be associated with any RM path in the archetype, including non-archetyped RM attributes reachable from the root RM type of the archetype. Definition of an alias enables an RM attribute node to be multi-lingually renamed from its default RM name. 

#### Validity

The RM overlay validity rules are as follows:

*VRMVP*: RM-visibility path validity. The path stated in an `rm_visbility` entry must be valid, meaning it must be valid against the RM, and if it references archetype-specific nodes, be valid against the archetype as well. 

*VRMVAV*: RM-visibility alias validity. If the `_alias_` attribute is set, it must refer to an at-code defined in the terminology. 

## Class Descriptions




# Terminology Package

## Overview

All local terminology as well as terminological and terminology binding elements of an archetype are represented in the terminology section of an archetype, whose semantics are defined by the `aom2.terminology` package, shown below.

.`am.aom2.terminology` Package
image::UML/diagrams/AM-aom2.terminology.svg[id=terminology_package, align="center"]

An archetype terminology consists of the following elements.

* `_term_definitions_`: a mandatory structure consisting of lists of term definitions defined local to the archetype, one list for each language of translation, as well as the original language of definition. The entries in this table include:
** For at-coded archetypes: Some or all at-codes. One of these is a code of the form 'at0000', 'at0000.1', 'at0000.1.1' etc, denoting the concept of the archetype as a whole. This particular code is recorded in the `_concept_code_` attribute and is used as the at-code on the root node in the archetype definition. Not all at-codes are required to be in the term_definitions structure - for nodes that are children of single-valued attribute, a term definition is optional (and not typically defined).
** For id-coded archetypes: Some or all id-codes. One of these is a code of the form 'id1', 'id1.1', 'id1.1.1' etc, denoting the concept of the archetype as a whole. This particular code is recorded in the `_concept_code_` attribute and is used as the id-code on the root node in the archetype definition. Not all id-codes are required to be in the term_definitions structure - for nodes that are children of single-valued attribute, a term definition is optional (and not typically defined).
** at-codes used to define value terms and inline value sets/ All at-codes will appear within a `C_TERMINOLOGY_CODE` constraint object within the archetype. All at-codes must have a definition in the term_definitions.
** ac-codes used to define external value set references. All ac-codes must have a definition in the term_definitions.
* `_term_bindings_`: an optional structure consisting of list of terms and bindings, one list for each external terminology (i.e. the terminology or ontology being 'bound to'). Each 'binding' is a URI to a target. For a binding of an id-code or an at-code, the target will be a single term, and for an ac-code, it will designate a ref-set or value set.
* `_value_sets_`: optional structure defining value-set relationships for locally defined value sets. Each value set is identified by an ac-code and has as members one or more at-codes.
* `_terminology_extracts_`: an optional structure containing extracts from external terminologies such as {snomed_ct}[SNOMED CT^], {who_icd}[ICDx^], or any local terminology. These extracts include the codes and preferred term rubrics, enabling the terms to be used for both display purposes. This structure is normally only used for templates, enabling small value sets for which no external reference set or subset is defined to be captured locally in the template.

Depending on whether the archetype is in differential or flat form, an instance of the `ARCHETYPE_TERMINOLOGY` class contains terms, constraints, bindings and terminology extracts that were respectively either introduced in the owning archetype, or all codes and bindings obtained by compressing an archetype lineage through inheritance. A typical instance structure of `ARCHETYPE_TERMINOLOGY` is illustrated in <<terminology_instance>>.

.Terminology Instance Structure
image::{doc_name}/diagrams/terminology_instance_structure.svg[id=terminology_instance, align="center"]

## Semantics

### Specialisation Depth

Any given archetype occurs at some point in a lineage of archetypes related by specialisation, where the depth is reflected by the `_specialisation_depth_` function. An archetype which is not a specialisation of another has a specialisation_depth of 0. Term and constraint codes introduced in the terminology of specialised archetypes (i.e. which did not exist in the terminology of the parent archetype) are defined in a strict way, using '.' (period) markers. For example, an archetype of specialisation depth 2 will use term definition codes like the following:

====
for at-coded archetypes::
+
** `at0.0.1` - a new term introduced in this archetype, which is not a specialisation of any previous term in any of the parent archetypes;
** `at0004.0.1` - a term which specialises the `at0004` term from the top parent. An intervening `.0` is required to show that the new term is at depth 2, not depth 1;
** `at0025.1.1` - a term which specialises the term `at0025.1` from the immediate parent, which itself specialises the term `at0025` from the top parent.
for id-coded archetypes::
+
** `id0.0.1` - a new term introduced in this archetype, which is not a specialisation of any previous term in any of the parent archetypes;
** `id4.0.1` - a term which specialises the `id4` term from the top parent. An intervening `.0` is required to show that the new term is at depth 2, not depth 1;
** `id25.1.1` - a term which specialises the term `id25.1` from the immediate parent, which itself specialises the term `id25` from the top parent.
====

This systematic definition of codes enables software to use the structure of the codes to more quickly and accurately make inferences about term definitions up and down specialisation hierarchies. Constraint codes on the other hand do not follow these rules, and exist in a flat code space instead.

## Class Descriptions


#### Validity Rules

The following validity rules apply to instances of this class in an archetype:

*VTVSID*: value-set id defined. The identifying code of a value set must be defined in the term definitions of the terminology of the current archetype.

*VTVSMD*: value-set members defined. The member codes of a value set must be defined in the term definitions of the terminology of the flattened form of the current archetype.

*VTVSUQ*: value-set members unique. The member codes of a value set must be unique within the value set.

*VTSD* specialisation level of codes. Term or constraint code defined in archetype terminology must be of the same specialisation level as the archetype (differential archetypes), or the same or a less specialised level (flat archetypes).

*VTLC*: language consistency. Languages consistent: all term codes and constraint codes exist in all languages.

*VTTBK*: terminology term binding key valid. Every term binding must be to either a defined archetype term ('at-code') or to a path that is valid in the flat archetype.

*VTCBK*: terminology constraint binding key valid. Every constraint binding must be to a defined archetype constraint code ('ac-code').


# Validation and Transformation Semantics

This section provides a guide for validation, flattening and diffing, based on the ADL workbench reference compiler. The sequence of processing a given archetype A in the Workbench is as follows:

* evaluate specialisation lineage of A
** process each parent in order from the top
* evaluate supplier archetypes of A (those related by `use_archetype` statements)
** process suppliers, recursively
* parse A
* AOM phase 1 validation - standalone validation
* if passed, and A is specialised:
** AOM phase 2 validation - validate against flat parent
** flatten A against flat parent
** AOM phase 3 validation - validation performed on flat form of A.

## Validation

Validation is best implemented in a multi-pass fashion, with more basic kinds of errors being checked first. The ADL Workbench implements three validation phases as described below.

### Phase 1 - Basic Integrity

The following validation can be performed on an archetype mostly without reference to its parent, if it is specialised.

#### Basic checks

* check match of root RM type with RM type mentioned in identifier (VARDT);
* valid root at code (id code) for specialisation level (VARCN);
* any missing mandatory parts, e.g. `terminology` section (STCNT);
* check that specialisation depth is one greater than specialisation depth of parent (VACSD);

#### AUTHORED_ARCHETYPE meta-data checks

* check original language in main part of archetype is available in `terminology` section (VOLT);
* check `adl_version` and `rm_release` version id formats (VARAV, VARRV);
* check that languages defined in translations section are in the archetype terminology (VOTM);

#### Definition Structure Validation

* check that differential paths only found in specialised archetypes (VDIFV);
* check that differential paths in specialised archetypes exist in flat parent (VDIFP);

#### Basic Terminology Validation

* validate terminology code formats and specialisation depths (VATCV, VTSD);
* validate terminology languages - check all at-codes and ac-codes found in all languages (VTLC);
* validate terminology bindings - check that all terms and paths mentioned in bindings exist in terminology and definition (VTTBK, VTCBK, VETDF);
* validate terminology value-sets - check that every code in terminology value set definitions is in the terminology, with no duplications (VTVSID, VTVSMD, VTVSUQ);

#### Various Structure Validation

* check slot definition validity (VDSEV);
* check `C_ARCHETYPE_ROOT` validity (VARXRA, VARXTV);

#### Code Validation

* check that all codes mentioned in `definition` are defined in terminology (VTSD, VATID);
* validate `C_TERMINOLOGY_CODE` objects (VATCD, VATDF, VACDF, VATDA);

#### Validate Annotations

* for each language, ensure that annotations paths are valida (VRANP);
* ensure that annotations are proper translations of each other.

### Phase 2 - Validation of Specialised Archetype Against Flat Parent

#### Validate Against Reference Model

The following checks require a computational representation of the reference model to be available.

* check that type and attribute names exist in RM (VCORM, VCARM);
* check that enumeration type constraints use valid literal values (VCORMENV, VCORMENU, VCORMEN);
* validate any allowed type substitutions (VCORMT);
* check that `existence` in `C_ATTRIBUTE` is valid with respect to RM (VCAEX);
* check that `cardinality` in `C_ATTRIBUTE` is valid with respect to RM (VCACA);
* check mismatch of -arity of `C_ATTRIBUTE` in archetype and RM (VCAM).

#### Validate Specialised Definition

The following checks are made on a specialised `definition` with respect to its flat parent.

* check that node differential path can and does exist in parent (VSONPT, VSONIN);
* check that `SIBLING_ORDER` is valid in flat parent (VSSM);
* on `C_ATTRIBUTE` nodes
** check conformance of `existence` to flat parent (VSANCE);
** check conformance of `cardinality` to flat parent (VSANCC);
* on `C_ARCHETYPE_ROOT`:
** check that `archetype_ref` archetype ID matches parent slot constraint (VARXS);
** check that `archetype_ref` archetype ID exists in current library of archetypes (VARXR);
** filler id specialisation depth is wrong (VARXID);
* ensure `ARCHETYPE_SLOT` in child redefines only `ARCHETYPE_SLOT` in parent (VDSSID);
* for node `C_COMPLEX_OBJECT_PROXY` in parent, check that proxy path exists (VSUNT);
* otherwise, AOM types of child and parent node must be identical (VSONT).

For passing nodes, check:

* evaluate `c_conforms_to()` function:
** RM type non-conformance (VSONCT);
** occurrences non-conformance (VSONCO);
** node id non-conformance value mismatch (VSONI);
** invalid leaf object value redefinition (VPOV, VUNK);
** tuple validation against parent node (VTPNC, VTPIN).

#### Validate Rules

* ensure RM types and paths mentioned in rules are valid against flat parent archetype and RM (VRRLPRM, VRRLPAR).

### Phase 3 - Validation of Flat Form

These validations are carried out after successful generation of the flat form of the current archetype.

* ensure `C_COMPLEX_OBJECT_PROXY` paths actually exist in current flat form (VUNP);
* ensure object node `occurrences` valid with respect to enclosing `cardinality` (VACMCO).

## Flattening

Flattening is conceptually a simple operation - the overlaying of a differential child archetype onto a flat parent . Concretely, it is a somewhat sophisticated operation, since it has to take into account a number of specifics allowed by ADL and the AOM, including:

* differential paths, including ones that contain overridden at-codes (id-codes);
* nodes in the child can override nodes of different AOM types in the parent in specific circumstances;
* sibling ordering markers;
* overlays with cloning: where more than one child specialisation node exists for a single parent complex structure, the parent structure will be cloned before each overlay;
* deletions (`existence matches {0}`, `occurrences matches {0}`).
* proxy reference targets are expanded inline if the child archetype overrides them.    

The algorithm used in the ADL Workbench provide a reasonable template for achieving proper flattening of AOM archetypes and templates.

## Diffing

Diffing is the reverse of flattening, and is primarily used to support editing operations. The basis of visual editing of an archetype is the flat form of the parent, with the user permitted to make modifications that are conformant with the flat parent. The Diffing operation is used to extract the resulting differential form archetype from the final state of visual editing.

The algorithm used in the ADL Workbench provides a reasonable template for achieving diffing of AOM archetypes.

# Serialisation Model

## Overview

This section describes an adjusted version of the AOM that is used for serialising archetypes to formats other than ADL. The classes in this model are nearly 1:1 with AOM classes, but with names prefixed with `P_`, for 'persistent'. Without using this model, an archetype can be serialised to an 'object dump' format such as ODIN, JSON, YAML, XML etc., but the output will be voluminous. The effect of this model is to reduce the size of the output, potentially by a factor of two or more. Human readability is also greatly improved, which is of increasing importance with the direct use of XML and JSON by programmers.

Size reduction and readability is achieved mainly by mapping repetitive structural items to shorter string forms that are more readable, but still machine-processable.

The `am.aom2.persistence` package is shown below, in two parts.

.`am.aom2.persistence` Package - Serialisation AOM (upper)
image::UML/diagrams/AM-aom2.persistence-upper.svg[id=P_AOM_upper, align="center"]

.`am.aom2.persistence` Package - Serialisation AOM (lower)
image::UML/diagrams/AM-aom2.persistence-lower.svg[id=P_AOM_lower, align="center"]

## Model Transformation Description

The translations from the AOM effected by the `P_` classes are as follows:

* all multiplicities, including existence, cardinality, and occurrences are converted to the standard UML string form such as '0..1', '0..*' etc., rather than the 8 or so lines of output that would occur in direct machine serialisation;
* codes are converted from structured form (`TERMINOLOGY_CODE` class) to string form;
* UID identifiers are converted from structured form to string form.


# Templates

## Overview

Within the Archetype formalism, a template is used to aggregate and refine archetypes, to produce a structure corresponding to a particular data set. Templates thus provide a way to use archetypes for specific purposes, while the archetypes contain _possible_ data items, not linked to specific purposes. See the {openehr_am_adl2}#_templates[ADL2 specification, Templates section^] for a detailed description of template semantics.

Templates are formally defined as specialised archetypes, via the `TEMPLATE` and `TEMPLATE_OVERLAY` classes shown in <<archetype_package>>. This means that all the formal characteristics of a template are defined by the openEHR Archetype Object Model (AOM) and Archetype Definition Language (ADL) specifications apply to templates. This includes the meta-data (inherited from the `AUTHORED_RESOURCE` class), specialisation semantics (templates can be specialised into other templates), `terminology` section (allowing multi-lingual local term definitions and external terminology bindings) as well as the `rules` and `annotations` sections.

Since a template is a specialised archetype, it cannot change the semantics of archetypes it specialises, and it consequently obeys the same rules as any other specialised archetype. Accordingly, all data created due to the use of templates are guaranteed to conform to the referenced archetypes, as well as the underlying reference model.

However, the mode of use of the AOM and ADL in a template is slightly different from the typical archetype. Firstly, the following features are commonly used in templates but not generally in archetypes:

* slot-filling - achieved by specialisation, as described in the {openehr_am_adl2}#_slot_filling_and_redefinition[ADL2 specification^];
* specifying `{0..0}` constraints to remove elements not needed from the referenced archetypes;
* specifying `{1..1}` constraints to mandate elements from the referenced archetypes;
* setting default values;
* addition of terminology bindings to specific terminology ref-sets.

Secondly, specialisation in templates is usually only of existing nodes defined in the flat parent, i.e. no new nodes are added. If new data nodes are required in the template context, appropriate specialised archetypes should be created to define them, prior to use in the final template.

These variations are not formally required by the ADL/AOM formalism, but are intended to be realised instead by tooling that recognises archetypes and templates via the leading ADL keyword (ADL files) or serialisation type marker (other serialisation types). This approach simplifies life for tool builders, since a single standardised compiler will always compile any archetype or template.

Because a template generally refers to a number of archetypes due to slot-filling - i.e. the root archetype plus component archetypes mentioned as slot-fillers - and also usually defines further constraints on the root and component archetypes, the referenced entities end up being of three types:

* a published archetype, used as is;
* a published template, used as is;
* a private template-local template overlay.

The first two of these are explicitly identified and published artefacts, and can usually be obtained as files in any of the available serialisation syntaxes. The template overlay is somewhat like the 'private' or anonymous class definition available in some programming languages, and is obtainable either as a separate file associated with the root template, or within the template source file.

## An Example

In order to better explain the template artefact structure, an example is described below. Assume the logical structure required is as shown below. This shows three archetypes of specific RM types, that should be chained together by slot-filling at specific paths, to form a final template. The template also adds further constraints via overlays.

====
at-coded archetypes structure::
+
* `org.openehr::openEHR-EHR-COMPOSITION.encounter_report.v1 / content[at0004]`
** `org.openehr::openEHR-EHR-SECTION.vital_signs_headings.v1 / items [at0001]`
*** `org.openehr::openEHR-EHR-EVALUATION.problem_description.v1`

id-coded archetypes structure::
+
* `org.openehr::openEHR-EHR-COMPOSITION.encounter_report.v1 / content[id5]`
** `org.openehr::openEHR-EHR-SECTION.vital_signs_headings.v1 / items [id2]`
*** `org.openehr::openEHR-EHR-EVALUATION.problem_description.v1`
====

The actual template structure needed to achieve this is shown below. The archetype `org.openehr::openEHR-EHR-COMPOSITION.encounter_report.v1` is shown at the top right. This is templated (i.e. specialised) by the template `uk.nhs.clinical::openEHR-EHR-COMPOSITION.t_encounter_report.v1` at the top left. The template performs the job of filling the `at0004` (`id5`) slot in the root archetype by specialising the slot. The specialised version adds a filler object (designated with the `C_ARCHETYPE_ROOT` instance) and also overrides the original `ARCHETYPE_SLOT` instance to close the slot to any further filling, either by further templating or at runtime.

.Template source structure example
image::UML/diagrams/AM-template_example_1.svg[id=AOM-template_example_1, align="center"]

The filler object specifies in its `_archetype_ref_` attribute the artefact being used to fill the slot (shown on the diagram as an ellipsis, for brevity). Here it is not simply the archetype `org.openehr::openEHR-EHR-SECTION.vital_signs_headings.v1`, but a specialised form of this archetype, defined as a local template overlay, whose identifier is `uk.nhs.clinical::openEHR-EHR-SECTION.t_encounter_report-vital_signs_headings-0001.v1`.

The same kind of redefinition occurs within this `SECTION` template overlay. The `at0006` (`id7`) slot node from the original archetype (`org.openehr::openEHR-EHR-SECTION.vital_signs_headings.v1`) is redefined by the `C_ARCHETYPE_ROOT` node in the template overlay. The overlay would normally add other constraints of its own - typically removing unwanted items and mandating other items from the specialisation parent archetypes - not shown here.

The source template is thus constructed of two artefacts, namely:

* the 'template', i.e. the template root;
* an internal 'template overlay' component.

These are connected together in the flattening operation as part of Operational Template generation; at that point, the `C_COMPLEX_OBJECT` root node of the template overlay (lower left) is overlaid on the `at0004.1` (`id5.1`) `C_ARCHETYPE_ROOT` node of the template, forming a single large archetype structure.

It is not always the case that the components of a template must be internal. Within the template environment, lower level reference model classes may be templated in their own right, and such templates simply reused in the new template being constructed. In this case, the outer template may contain both its own internal template components, and other templates.

## Template Identifiers

Templates are identified using normal ADL multi-axial identifiers and GUIDs, just as for archetypes. However, to make them easier for tools and humans to see, some simple conventions are suggested for the concept part of the identifier, as follows.

* `template`: use a concept identifier based on the archetype prepended with `t_`;
* `template_overlay`: use a concept identifier consisting of the concatenation of:
** the root template identifier (including the '`t_`');
** the concept identifier of the specialisation parent archetype of the overlay;
** a final `_N`, where 'N' is an integer.

The following are examples.

```adl
uk.nhs.clinical::openEHR-EHR-COMPOSITION.t_encounter_report.v1.0.0  -- root template

uk.nhs.clinical::openEHR-EHR-EVALUATION.t_encounter_report-problem_description_1.v1.0.0   -- overlay
uk.nhs.clinical::openEHR-EHR-EVALUATION.t_encounter_report-medications_2.v1.0.0           -- overlay
uk.nhs.clinical::openEHR-EHR-EVALUATION.t_encounter_report-care_plan_3.v1.0.0             -- overlay
```

This approach defines a short concept identifier which obeys the formal rule that concept identifiers   must be unique within a namespace and RM type, is human-readable, and most importantly, is tool-generatable.


# Reference Model Adaptation

## Overview

So far ADL has been presented as an abstract formal language that defines legal information structures based on a reference model (RM). In real world applications, we need to consider where reference models come from, and the question of harmonising or otherwise integrating archetypes based on different but related RMs.

One of the common problems in most domains is that competing reference models exist, typically defined by standards bodies such as ISO, CEN, ASTM, and/or other open standards bodies such as W3C and OASIS. For a given topic, e.g. 'cancer study trials' or 'Electronic Health Record' there can often be multiple information models that could be used as a basis for archetyping. Due to political pressures, national requirements or preferences and variety of other non-technical factors, it is quite likely that archetypes will be authored within a domain based on multiple competing reference models that are reasonably similar without being easily machine inter-convertible.

Since archetypes are generally authored by domain experts, the entities they represent tend to come from a homogeneous model space, with reference models being a technical detail that may not even be visible to the archetype author. Nevertheless, due to the above-mentioned factors, authors in different localities or jurisdictions may have no choice but to model the same entity, for example 'complete blood count' based on two or more different reference models.

This creates a potential problem of competing libraries of archetypes trying to model the same information entities in slightly different but incompatible ways. This tends to needlessly split groups of domain modellers into disparate communities, when in fact they are modelling the same things.

In order to alleviate some problems caused by this situation, some measures described below, which are outside the AOM proper, can be applied to enable archetypes and RMs treated to be treated more uniformly.

## AOM Profile Configuration

These adaptations can be formalised in a configuration object that is an instance of the class `AOM_PROFILE`, shown below. This is only one way such information can be represented, and alternatives could be used.

.`aom2.profile` Package
image::UML/diagrams/AM-aom2.profile.svg[id=aom_profile, align="center"]

### Class Definitions


### Configuration File

Instances of the above classes can be expressed in an ODIN format file, as a convenient way of defining configuration for tools. Examples of such files used for the {openehr_awb}[openEHR ADL Workbench^] tool can be found in the {openehr_awb_profiles}[Github project for the tool^].

## Mapping RM Entities to AOM Entities

One adjustment that can be made is to indicate equivalences between RM entities and AOM built-in types. This can be illustrated by a common situation in health, where multiple RMs have concretely different models of the 'coded term' notion. Semantically, these are all the same, and correspond to the AOM built-in type `TERMINOLOGY_CODE`. However, there is nothing that can be stated in an ADL archetype that can indicate this relationship, with the result that ADL tools can't infer that a certain type, e.g. openEHR's `CODE_PHRASE` or ISO 13606's `CODED_TEXT` are equivalents of the `TERMINOLOGY_CODE` type in the AOM.

The mapping is achieved by using the `_aom_rm_type_mappings_` property of the `AOM_PROFILE` type, which enables equivalences between complex classes and properties to be described.

The following example shows parts of two AOM profile files, illustrating two different mappings of RM types for 'coded text' to the AOM `TERMINOLOGY_CODE` class. The following extract is from the openEHR AOM profile file for the ADL Workbench.

```odin
--
-- mappings from AOM built-in types used for openEHR RM types
--
aom_rm_type_mappings = <
	["TERMINOLOGY_CODE"] = <
		source_class_name = <"TERMINOLOGY_CODE">
		target_class_name = <"CODE_PHRASE">
		property_mappings = <
			["terminology_id"] = <
				source_property_name = <"terminology_id">
				target_property_name = <"terminology_id">
			>
			["code_string"] = <
				source_property_name = <"code_string">
				target_property_name = <"code_string">
			>
		>
	>
>
```

The following extract is from the {hl7_cimi}[HL7 CIMI^] AOM profile file for the ADL Workbench. This defines a mapping from the CIMI RM class `CODED_TEXT` to the AOM class `TERMINOLOGY_CODE`.

```odin
--
-- mappings from AOM built-in types used for CIMI RM types
--

aom_rm_type_mappings = <
	["TERMINOLOGY_CODE"] = <
		source_class_name = <"TERMINOLOGY_CODE">
		target_class_name = <"CODED_TEXT">
		property_mappings = <
			["terminology_id"] = <
				source_property_name = <"terminology_id">
				target_property_name = <"terminology_id">
			>
			["code_string"] = <
				source_property_name = <"code_string">
				target_property_name = <"code">
			>
		>
	>
>
```

The value of creating these mappings is that they inform tooling that constraints on the types `CODE_PHRASE` in openEHR archetypes, and `CODED_TEXT` in CIMI archetypes are to be understood as equivalent to constraints on the primitive AOM type `TERMINOLOGY_CODE`. This can be detected by the tool, and computed with, for example, with specific visualisation. Without this configuration, the archetype constraints are still correct, but the ADL tooling doesn't treat them as different from any other RM complex type.

Using class and property mappings can enable more sophisticated archetype comparison and potentially even harmonisation, as well as more intelligent data comparison.

## RM Primitive Type Equivalences

The primitive constrainer types of the AOM, i.e. descendants of `C_PRIMITIVE_OBJECT` correspond to a small abstract set of primitive types, as shown in the table <<Primitive Types>>. The implied list of RM abstract primitive types is `Boolean`, `Integer`, `Real`, `Date`, `Date_time`, `Time`, `Duration`, `String`, and `Terminology_code`. However, real reference models may be based on typical programming languages, and therefore include types like `Double`, `Integer64`, and even numerous variants on `String`, `Integer` etc, such as `String_8`, `String32` and so on.

In order to prevent a similar explosion of AOM primitive types, the AOM profile enables equivalences between these latter types (which typically differ for each RM) and the abstract set to be stated, using the `_rm_primitive_type_equivalences_` property of `AOM_PROFILE`. An example is shown below.

```odin
rm_primitive_type_equivalences = <
	["Double"] = <"Real">                      -- treat RM type Double as if it where Real
	["Integer64"] = <"Integer">                -- treat RM type Integer64 as if it were Integer
	["ISO8601_DATE"] = <"Date">                -- treat RM type ISO8601_Date as if it were Date
	["ISO8601_DATE_TIME"] = <"Date_time">
	["ISO8601_TIME"] = <"Time">
	["ISO8601_DURATION"] = <"Duration">
>
```

The following CADL fragment provides an example.


====
at-coded ADL2::
+
```cadl
    ELEMENT[at0004] occurrences matches {0..1} matches {	-- Systolic
        value matches {
            DV_QUANTITY[at9054] matches {
                property matches {[at9055]}
                magnitude matches {|0.0..<1000.0|}  --  parses as AOM C_REAL, but is Double in RM
                precision matches {0}
                units matches {"mm[Hg]"}
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    ELEMENT[id5] occurrences matches {0..1} matches {	-- Systolic
        value matches {
            DV_QUANTITY[id1054] matches {
                property matches {[at1055]}
                magnitude matches {|0.0..<1000.0|}  --  parses as AOM C_REAL, but is Double in RM
                precision matches {0}
                units matches {"mm[Hg]"}
            }
        }
    }
```
====

## RM Type Substitutions

Occasionally there are type mismatches between the RM type and the AOM type we would like to use, or has been used in an archetype. For example, the RM may have a `String` attribute in some class that represents an ISO 8601 date. It is possible to use the AOM constrainer type `C_DATE` instead of `C_STRING`, to obtain a more meaningful constraint.

Another use is where the archetype has been written with an integer constraint (i.e. a `C_INTEGER`) but the RM has a `Real` or `Double` type in the corresponding place. This can also be accommodated.

These differences can be corrected by using the `_aom_type_substitutions_` configuration table defined in the `AOM_PROFILE` class. The following is an example of using this facility to enable primitive type matching for openEHR archetypes.

```odin
--
-- allowed substitutions from AOM built-in primitive types to openEHR RM types
--

aom_rm_type_substitutions = <
	["ISO8601_DATE"] = <"String">
	["ISO8601_DATE_TIME"] = <"String">
	["ISO8601_TIME"] = <"String">
	["ISO8601_DURATION"] = <"String">
	["INTEGER"] = <"Double">
>
```

The effect of these mappings is that literal values in an archetype that parse as the left-hand side type (`ISO8601_DATE` etc.) will be silently mapped to the right hand RM type (`String` etc). The following example shows a native ISO Duration field that is mapped to an RM String value.

====
at-coded ADL2::
+
```cadl
    INTERVAL_EVENT[at1042] occurrences matches {0..1} matches {	-- 24 hour average
        width matches {
            DV_DURATION[at9064] matches {
                value matches {PT24H}  --  parses as AOM ISO8601_DURATION, but is String in RM
            }
        }
    }
```

id-coded ADL2::
+
```cadl
    INTERVAL_EVENT[id1043] occurrences matches {0..1} matches {	-- 24 hour average
        width matches {
            DV_DURATION[id1064] matches {
                value matches {PT24H}  --  parses as AOM ISO8601_DURATION, but is String in RM
            }
        }
    }
```
====

## AOM Lifecycle State Mappings

Another kind of useful mapping adjustment that can help to make tools process archetypes in a more homogeneous way is to do with the AOM life-cycle states, which are standardised in the {openehr_am_id}[openEHR Archetype Identification specification^]. These states denote the state of a whole archetype in its authoring life cycle. Historically however there were no standard names, with the consequence that various archetype tools implement their own local lifecycle state names. To adjust for this the `_aom_lifecycle_mappings_` property in the `AOM_PROFILE` class can be used. These mappings have the effect of replacing the current value of the `_lifecycle_state_` property of the `RESOURCE_DESCRIPTION` instance of a parsed archetype with an openEHR standard state name. A typical example of the `description` section of an archetype with a local lifecycle state name is below.

```odin
description
    original_author = <
        ["name"] = <"Dr J Joyce">
        ["organisation"] = <"NT Health Service">
        ["date"] = <2003-08-03>
    >
    lifecycle_state =  <"AuthorDraft"> --  should be 'unmanaged'
    resource_package_uri =  <".....">
```

The following example shows typical mappings of customs lifecycle state names to the openEHR standard state names.

```odin
-- allowed substitutions from source RM lifecycle states to AOM lifecycle states
-- States on the value side (right hand side) must be the AOM states:
--
--	"unmanaged"
--	"in_development"
--		"draft"
--		"in_review"
--		"suspended"
--	"release_candidate"
--	"published"
--	"deprecated"
--		"obsolete"
--		"superseded"

--

aom_lifecycle_mappings = <
	["AuthorDraft"] = <"unmanaged">
	["Draft"] = <"in_development">
	["TeamReview"] = <"in_development">
	["Team Review"] = <"in_development">
	["ReviewSuspended"] = <"in_development">
	["Review Suspended"] = <"in_development">
	["Reassess"] = <"published">
	["Published"] = <"published">
	["Rejected"] = <"rejected">
>
```

Normally this kind of change should be written into the archetype, so that it is upgraded to the standard form. Tools should offer this possibility, including in batch/bulk mode.

## Facilities for RM Visualisation

Various meta-attributes may be added to an AOM profile in order to affect the behaviour of archetyping tools and processing. These are not required for correct functioning of tools, but are typically needed to make models comprehensible. Without them, there will be no difference between primitive types such as `Any`, `Integer` etc., business types (e.g. things like `Person`, etc.), and business-level data types (e.g. `CodedText`, `Quantity` etc).

```odin
```
-- archetyping
-- override archetype parent class from included schema
```
archetype_parent_class = <"CLASS_NAME">
archetype_data_value_parent_class = <"CLASS_NAME">
archetype_visualise_descendants_of = <"CLASS_NAME">
```

### archetype_parent_class

The `archetype_parent_class` attribute defines a base class from the Reference Model that provides archetyping capability in RM data structures. It is optional, and there need be no such class in the RM. In the openEHR and ISO 13606 Reference Models, this class exists, (`LOCATABLE`, and `RECORD_COMPONENT` respectively). Defining it here has the effect in tools that the class tree under which archetypes are arranged contains only RM classes inheriting from this class, e.g. `LOCATABLE` classes in the case of openEHR. If nothing is set here, all classes in the RM are assumed as candidates for archetypes.

### archetype_data_value_parent_class

The `archetype_data_value_parent_class` attribute defines a base class from the Reference Model whose descendants are considered to be 'logical data types' (i.e. of some higher level than the built-in primitive types `String`, `Integer` etc). This attribute is optional, even if the RM does have such a class, and is only used to help tooling to provide more intelligent display, e.g. in statistical reports.

### archetype_visualise_descendants_of

If `archetype_parent_class` is not set, designate a class whose descendants should be made visible in tree and grid renderings of the archetype definition. For openEHR and CEN this class is normally the same as the `archetype_parent_class`, i.e. `LOCATABLE` and `RECORD_COMPONENT` respectively. It is typically set for CEN, because `archetype_parent_class` may not be stated, due to demographic types not inheriting from it.

The effect of this attribute in visualisation is to generate the most natural tree or grid-based view of an archetype definition, from the semantic viewpoint.

### archetype_namespace

The attribute `archetype_namespace` defines the package or packages that are considered the archetyping namespace used in archetype multi-axial ids. For example, in openEHR, an archetype is identified by an id of the form:

```
  openEHR-EHR-OBSERVATION.some_obs.vN
```

The 'EHR' in the above is an 'RM package closure', i.e. the name of an RM package whose class closure by reachability provides the set of classes that may be archetyped in the 'EHR' namespace. The reason for this is somewhat subtle: consider that if you want archetypes based on classes defined directly within a package P, and you also define these archetypes that re-use other archetypes based on more basic types like openEHR's `CLUSTER` or similar (typically not defined in the head package), then you will inevitably have archetypes based on `CLUSTER` only for use with EHR archetypes e.g. archetypes based on `OBSERVATION`. However, you may well create archetypes based on `CLUSTER` only for use with e.g. top-level archetypes from the demographic package. The archetype_namespace setting is used to define the root id namespaces  for archetypes, allowing low-level archetypes to be designated for use with one or other high-level archetype. E.g. `openEHR-EHR-CLUSTER.bp_position.v1` would be used only with `openEHR-EHR-OBSERVATION.bp_measurement.vX`, or similar, and most likely not with any `openEHR-DEMOGRAPHIC-XXXX.yyyy.vN` archetype. Note that in openEHR, there is nothing to prevent such cross-namespace reuse - it is just a design guideline.



:sectnums!:

:sectnums!:
## References

bibliography::[]

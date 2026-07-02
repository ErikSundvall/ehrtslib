


image::https://specifications.openehr.org/images/openEHR_logo_RGB.svg["openEHR logo",align="center"]

# Archetype Object Model 1.4 (AOM1.4)



## Acknowledgements

### Primary Author

* Thomas Beale, Ars Semantica, UK

### Supporters

The work reported in this paper has been funded by the following organisations:

* UCL (University College London) - Centre for Health Informatics and Multiprofessional Education (CHIME);
* Ocean Informatics.

Special thanks to Prof David Ingram, founding Director of CHIME, UCL, who provided a vision and collegial working environment ever since the days of GEHR (1992).

### Trademarks

* 'openEHR' is a trademark of the openEHR Foundation
* 'Java' is a registered trademark of Oracle Corporation
* 'Microsoft' is a trademark of the Microsoft Corporation





ifdef::package_qualifiers[]
endif::[]

# Preface

## Purpose

This document contains the definitive statement of archetype semantics, in the form of an object model for archetypes. The model presented here can be used as a basis for building software that processes archetypes, independent of their persistent representation; equally, it can be used to develop the output side of parsers that process archetypes in a linguistic format, such as the {openehr_am_adl14}[openEHR Archetype Definition Language (ADL)^], XML-instance and so on. As a specification, it can be treated as an API for archetypes.

It is recommended that the {openehr_am_adl14}[openEHR ADL document^] be read in conjunction with this document, since it contains a detailed explanation of the semantics of archetypes, and many of the examples are more obvious in ADL, regardless of whether ADL is actually used with the object model presented here or not.

## Related Documents

Prerequisite documents for reading this document include:

* The {openehr_overview}[openEHR Architecture Overview^];
* The {openehr_am_overview}[openEHR Archetypes Technical Overview^].

Related documents include:

* The {openehr_am_adl14}[openEHR Definition Language^];
* The {openehr_am_oap}[openEHR Archetype Profile^].

## Nomenclature

In this document, the term 'attribute' denotes any stored property of a type defined in an object model, including primitive attributes and any kind of relationship such as an association or aggregation. XML 'attributes' are always referred to explicitly as 'XML attributes'.

## Status

This specification is in the STABLE state. The development version of this document can be found at {openehr_am_development_aom14}[{openehr_am_development_aom14}^].

Known omissions or questions are indicated in the text with a 'to be determined' paragraph, as follows:
*TBD*: (example To Be Determined paragraph)

NOTE: this specification is a re-formatted issue of the {openehr_am_aom14_pdf}[original AOM 1.4 Specification from openEHR Release 1.0.2^]. There are slight changes in formatting, citations and other references, corrections to typographical errors and changed syntax colourisation due to the use of more modern language-based syntax colourisers in the publishing tools.

NOTE: for users requiring the most recent form of ADL and archetype technology in general, the {openehr_am_aom2}[Archetype Definition Language 2 (ADL2) specifications should be used^]. In particular, the {openehr_am_overview}[Archetype Technology Overview^] should be referred to for the most current state of Archetype Technology.

## Feedback

Feedback may be provided on the https://discourse.openehr.org/c/specifications/adl[openEHR ADL forum^].

Issues may be raised on the https://specifications.openehr.org/components/{component}/open_issues[specifications Problem Report tracker^].

To see changes made due to previously reported issues, see the https://specifications.openehr.org/components/{component}/history[{component} component Change Request tracker^].

## Conformance

Conformance of a data or software artifact to an openEHR specification is determined by a formal test of that artifact against the relevant {openehr_its_component}[openEHR Implementation Technology Specification(s) (ITSs)^], such as an IDL interface or an XML-schema. Since ITSs are formal derivations from underlying models, ITS conformance indicates model conformance.

## Background

### What is an Archetype?

Archetypes are constraint-based models of domain entities, or what some might call "structured business rules". Each archetype describes configurations of data instances whose classes are described in a reference model; the instance configurations are considered to be valid exemplars of a particular domain concept. Thus, in medicine, an archetype might be designed to constrain configurations of instances of a simple node/arc information model, that express a "microbiology test result" or a "physical examination". Archetypes can be composed, specialised, and templated for local use. The archetype concept has been described in detail by citenp:[Beale2000], citenp:[Beale2002]. Most of the detailed formal semantics are described in the {openehr_am_adl14}[openEHR Archetype Definition Language^]. The openEHR archetype framework is described in the {openehr_am_overview}[openEHR Archetypes Technical Overview^].

### Context

The object model described in this document relates to linguistic forms of archetypes as shown in the figure below. The model (upper right in the figure) is the object-oriented semantic equivalent of the ADL the Archetype Definition Language BNF language definition, and, by extension, any formal transformation of it. Instances of the model (lower right on the figure) are themselves archetypes, and correspond one-to-one with archetype documents expressed in ADL or a related language.

.Relationship of Archetype Object Model to Archetype Languages
image::{doc_name}/diagrams/syntax_model_relationship.png[id=syntax_model_relationship, align="center", width=80%]

## Tools

Various tools exist for creating and processing archetypes. The {openehr_awb}[ADL Workbench^] is a reference compiler, visualiser and editor. The openEHR tools can be {modelling_tools}[downloaded from the website^] .
Source projects can be found at the https://github.com/openEHR[openEHR Github project^].

## Changes from Previous Versions

### Version 0.6 to 2.0

As part of the changes carried out to ADL version 1.3, the archetype object model specified here is revised, also to version 2.0, to indicate that ADL and the AOM can be regarded as 100% synchronised specifications.

* added a new attribute `_adl_version_ : String` to the `ARCHETYPE` class;
* changed name of `ARCHETYPE._concept_code_` attribute to `_concept_`.


# The Archetype Object Model

## Design Background

An underpinning principle of openEHR is the use of archetypes and templates, which are formal models of domain content, and are used to control data structure and content during creation, modification and querying. The elements of this architecture are twofold.

* The openEHR Reference Model (RM), defining the structure and semantics of information in terms of information models (IMs). The RM models correspond to the ISO RM/ODP information viewpoint, and define the data of openEHR EHR systems. The information model is designed to be invariant in the long term, to minimise the need for software and schema updates.
* The openEHR Archetype Model (AM), defining the structure and semantics of archetypes and templates. The AM consists of the archetype language definition language (ADL), the Archetype Object Model (AOM) and the openEHR Archetype profile (oAP).

The purpose of ADL is to provide an abstract syntax for textually expressing archetypes and templates. The AOM defines the object model equivalent, in terms of a UML model. It is a generic model, meaning that it can be used to express archetypes for any reference model in a standard way. ADL and the AOM are brought together in an ADL parser: a tool which can read ADL archetype texts, and whose parse-tree (resulting in-memory object representation) is instances of the AOM. The TOM defines the object model of templates, which are themselves used to put archetypes together into local information structures, usually corresponding to screen forms.

The purpose of the openEHR Archetype Profile is to define which classes and attributes of the openEHR RM can be sensibly archetyped, and to provide custom archetype classes.

## Package Structure

The openEHR Archetype Object Model is defined as the package `am.archetype`, as illustrated below. It is shown in the context of the openEHR `am.archetype` packages.

.Package Overview
image::UML/diagrams/AM-aom14-packages.svg[id=package_overview, align="center", width="40%"]

## Model Overview

The model described here is a pure object-oriented model that can be used with archetype parsers and software that manipulates archetypes. It is independent of any particular linguistic expression of an archetype, such as ADL or OWL, and can therefore be used with any kind of parser. 

It is dependent on the {openehr_rm_103_support}[openEHR Release 1.0.3 Support IM^] (`assumed_types` and `identifiers` packages), a small number of the openEHR Data Types ({openehr_rm_103_data_types}[openEHR Release 1.0.3 Data Types IM^]), and the `resource` package from the {openehr_rm_103_common}[openEHR Release 1.0.3 Common IM^]. These dependencies are shown for convenience in the <<Reference Model Dependencies>> appendix.

### Archetypes as Objects

The following figure illustrates various processes that can be responsible for creating an archetype object structure, including parsing, database retrieval and GUI editing. A parsing process that would typically turn a syntax expression of an archetype (ADL, XML, OWL) into an object one. The input file is converted by a parser into an object parse tree, shown on the right of the figure, whose types are specified in this document. Database retrieval will cause the reconstruction of an archetype in memory from a structured data representation, such as relational data, object data or XML. Direct in-memory editing by a user with a GUI archetype editor application will cause on-the-fly creation and destruction of parts of an archetype during the editing session, which would eventually cause the archetype to be stored in some form when the user decides to commit it.

After initial parsing, the in-memory representation is then validated by the semantic checker of the ADL parser, which can verify numerous things, such as that term codes referenced in the definition section are defined in the ontology section. It can also validate the classes and attributes mentioned in the archetype against a specification for the relevant information model (e.g. in XMI or some equivalent).

.Archetype Parsing Process
image::{doc_name}/diagrams/archetype_parsing_process.png[id=archetype_parsing_process, align="center", width="70%"]

As shown in the figure, the definition part of the in-memory archetype consists of alternate layers of object and attribute constrainer nodes, each containing the next level of nodes. In this document, the word 'attribute' refers to any data property of a class, regardless of whether regarded as a 'relationship' (i.e. association, aggregation, or composition) or 'primitive' (i.e. value) attribute in an object model. At the leaves are primitive object constrainer nodes constraining primitive types such as `String`, `Integer` etc. There are also nodes that represent internal references to other nodes, constraint reference nodes that refer to a text constraint in the constraint binding part of the archetype ontology, and archetype constraint nodes, which represent constraints on other archetypes allowed to appear at a given point. The full list of concrete node types is as follows:

`C_COMPLEX_OBJECT`:: any interior node representing a constraint on instances of some non-primitive type, e.g. `ENTRY`, `SECTION`;
`C_ATTRIBUTE`:: a node representing a constraint on an attribute (i.e. UML 'relationship' or 'primitive attribute') in an object type;
`C_PRIMITIVE_OBJECT`:: a node representing a constraint on a primitive (built-in) object type;
`ARCHETYPE_INTERNAL_REF`:: a node that refers to a previously defined object node in the same archetype. The reference is made using a path;
`CONSTRAINT_REF`:: a node that refers to a constraint on (usually) a text or coded term entity, which appears in the ontology section of the archetype, and in ADL, is referred to with an "acNNNN" code. The constraint is expressed in terms of a query on an external entity, usually a terminology or ontology;
`ARCHETYPE_SLOT`:: a node whose statements define a constraint that determines which other archetypes can appear at that point in the current archetype. It can be thought of like a keyhole, into which few or many keys might fit, depending on how specific its shape is. Logically it has the same semantics as a `C_COMPLEX_OBJECT`, except that the constraints are expressed in another archetype, not the current one.

The typename nomenclature "C_COMPLEX_OBJECT", "C_PRIMITIVE_OBJECT", "C_ATTRIBUTE" used here is intended to be read as "constraint on xxxx", i.e. a "C_COMPLEX_OBJECT" is a "constraint on a complex object (defined by a complex reference model type)". These type-names are used below in the formal model.

### The Archetype Ontology

There are no linguistic entities at all in the `definition` part of an archetype, with the possible exception of constraints on text items which might have been defined in terms of regular expression patterns or fixed strings. All linguistic entities are defined in the `ontology` part of the archetype, in such a way as to allow them to be translated into other languages in convenient blocks. As described in the openEHR ADL document, there are four major parts in an archetype `ontology` section: term definitions, constraint definitions, term bindings and constraint bindings. The former two define the meanings of various terms and textual constraints which occur in the archetype; they are indexed with unique identifiers which are used within the archetype definition body. The latter two ontology sections describe the mappings of terms used internally to external terminologies. Due to the well-known problems with terminologies (described in some detail in the {openehr_am_adl14}[openEHR ADL 1.4 specification^], and also by e.g. citenp:[Rector1999] and others), mappings may be partial, incomplete, approximate, and occasionally, exact.

### Archetype Specialisation

Archetypes can be specialised. The formal rules of specialisation are described in the openEHR Archetype Semantics document (forthcoming), but in essence are easy to understand. Briefly, an archetype is considered a specialisation of another archetype if it mentions that archetype as its parent, and only makes changes to its definition such that its constraints are 'narrower' than those of the parent. Any data created via the use of the specialised archetype is thus conformant both to it and its parent. This notion of specialisation corresponds to the idea of 'substitutability', applied to data.

Every archetype has a 'specialisation depth'. Archetypes with no specialisation parent have depth 0, and specialised archetypes add one level to their depth for each step down a hierarchy required to reach them.

### Archetype Composition

In the interests of re-use and clarity of modelling, archetypes can be composed to form larger structures semantically equivalent to a single large archetype. Composition allows two things to occur: for archetypes to be defined according to natural 'levels' or encapsulations of information, and for the reuse of smaller archetypes by a multitude of others. Archetype slots are the means of composition, and are themselves defined in terms of constraints.


# The Archetype Package

## Overview

The model of an archetype, illustrated in the following figure, is straightforward at an abstract level, mimicking the structure of an archetype document as defined in the openEHR Archetype Definition Language (ADL) document. An archetype is modelled as a particular kind of `AUTHORED_RESOURCE`, and as such, includes descriptive meta-data, language information and revision history. The `ARCHETYPE` class adds identifying information, a `definition` - expressed in terms of constraints on instances of an object model, and an `ontology`. The archetype `definition`, the 'main' part of an archetype, is an instance of a `C_COMPLEX_OBJECT`, which is to say, the root of the constraint structure of an archetype always takes the form of a constraint on a non-primitive object type. The last section of an archetype, the `ontology`, is represented by its own class, and is what allows the archetypes to be natural language- and terminology-neutral.

.am.aom14.archetype Package
image::UML/diagrams/AM-aom14.archetype.svg[id=archetype_package, align="center"]

## Class Descriptions

# Constraint Model Package

## Overview

The figure below illustrates the class model of an archetype definition. This model is completely generic, and is designed to express the semantics of constraints on instances of classes which are themselves described in UML (or a similar object-oriented meta-model). Accordingly, the major abstractions in this model correspond to major abstractions in object-oriented formalisms, including several variations of the notion of 'object' and the notion of 'attribute'. The notion of 'object' rather than 'class' or 'type' is used because archetypes are about constraints on data (i.e. 'instances', or 'objects') rather than models, which are constructed from 'classes'.

An informal way of understanding the model is as follows. An archetype definition is an instance of a `C_COMPLEX_OBJECT`, which can be thought of as expressing constraints on an object that is of some particular reference model type (recorded in the attribute rm_type_name), and which is larger than a simple instance of a primitive type such as `String` or `Integer`. The constraints define what configurations of reference model class instances are considered to conform to the archetype. For example, certain configurations of the classes `PARTY`, `ADDRESS`, `CLUSTER` and `ELEMENT` might be defined by a `Person` archetype as allowable structures for 'people with identity, contacts, and addresses'. Because the constraints allow optionality, cardinality and other choices, a given archetype usually corresponds to a set of similar configurations of objects. At the leaf nodes of an archetype definition are `C_PRIMITIVE_OBJECT` nodes, defining the constraints on leaf values of objects, i.e. `Integers`, `Strings` etc.

.aom14.archetype.constraint_model Package
image::UML/diagrams/AM-aom14.archetype.constraint_model.svg[id=constraint_model_package, align="center"]

## Semantics

The effect of the model is to create archetype description structures that are a hierarchical alternation of object and attribute constraints, as shown in <<archetype_parsing_process>>. This structure can be seen by inspecting an ADL archetype, or by viewing an archetype in {openehr_awb}[openEHR ADL Workbench^], and is a direct consequence of the object-oriented principle that classes consist of properties, which in turn have types that are classes. (To be completely correct, types do not always correspond to classes in an object model, but it does not make any difference here). The repeated object/attribute hierarchical structure of an archetype provides the basis for using paths to reference any node in an archetype. Archetype paths follow a syntax that is a subset of the W3C Xpath syntax.

### All Node Types

A small number of properties are defined for all node types. The path feature computes the path to the current node from the root of the archetype, while the has_path function indicates whether a given path can be found in an archetype. The is_valid function indicates whether the current node and all sub-nodes are internally valid according to the semantics of this archetype model. The is_subset_of function is used for comparison between corresponding nodes from different archetypes, in order to asert specialisation.

### Attribute Node Types

Constraints on attributes are represented by instances of the two subtypes of `C_ATTRIBUTE`: `C_SINGLE_ATTRIBUTE` and `C_MULTIPLE_ATTRIBUTE`. For both subtypes, the common constraint is whether the corresponding instance (defined by the `_rm_attribute_name_` attribute) must exist. Both subtypes have a list of children, representing constraints on the object value(s) of the attribute.

Single-valued attributes (such as `Person._date_of_birth_: Date`) are constrained by instances of the type `C_SINGLE_ATTRIBUTE`, which uses the children to represent multiple alternative object constraints for the attribute value.

Multiply-valued attributes (such as `Person._contacts_: List<Contact>`) are constrained by an instance of `C_MULTIPLE_ATTRIBUTE`, which allows multiple co-existing member objects of the container value of the attribute to be constrained, along with a cardinality constraint, describing ordering and uniqueness of the container. The following figure illustrates the two possibilities.

.Single and Multiple-valued C_ATTRIBUTEs
image::{doc_name}/diagrams/c_attributes_single_multiple.png[id=c_attributes_single_multiple, align="center", width="70%"]

The need for both `_existence_` and `_cardinality_` constraints in the `C_MULTIPLE_ATTRIBUTE` class deserves some explanation, especially as the meanings of these notions are often confused in object-oriented literature. An `_existence_` constraint indicates whether an object will be found in a given attribute field, while a `_cardinality_` constraint indicates what the valid membership of a container object is. Cardinality is only required for container objects such as `List<T>`, `Set<T>` and so on, whereas existence is always required. If both are used, the meaning is as follows: the `_existence_` constraint says whether the container object will be there (at all), while the `_cardinality_` constraint says how many items must be in the container, and whether it acts logically as a list, set or bag.

### Object Node Types

#### Node_id and Paths

The `_node_id_` attribute in the class `C_OBJECT`, inherited by all subtypes, is of great importance in the archetype constraint model. It has two functions:

* it allows archetype object constraint nodes to be individually identified, and in particular, guarantees sibling node unique identification;
* it is the main link between the archetype definition (i.e. the constraints) and the archetype ontology, because each `_node_id_` is a 'term code' in the `_ontology_` section.

The existence of `_node_ids_` in an archetype allows archetype paths to be created, which refer to each node. Not every node in the archetype needs a `_node_id_`, if it does not need to be addressed using a path; any leaf or near-leaf node which has no sibling nodes from the same attribute can safely have no `_node_id_`.

#### Defined Object Nodes (C_DEFINED_OBJECT)

The `C_DEFINED_OBJECT` subtype corresponds to the category of `C_OBJECTs` that are defined in an archetype by value, i.e. by inline definition. Four properties characterise `C_DEFINED_OBJECTs` as follows.

##### Any_allowed

The `_any_allowed_` function of a node indicates that any value permitted by the reference model for the attribute or type in question is allowed by the archetype; its use permits the logical idea of a completely "open" constraint to be simply expressed, avoiding the need for any further substructure. `_Any_allowed_` is effected in subtypes to indicate in concrete terms when it is True, usually related to Void attribute values.

##### Assumed_value

When archetypes are defined to have optional parts, an ability to define 'assumed' values is useful. For example, an archetype for the concept 'blood pressure measurement' might contain an optional protocol section describing the patient position, with choices 'lying', 'sitting' and 'standing'. Since the section is optional, data could be created according to the archetype which does not contain the protocol section. However, a blood pressure cannot be taken without the patient in some position, so clearly there could be an implied value for patient position. Amongst clinicians, basic assumptions are nearly always made for such things: in general practice, the position could always safely be assumed to be "sitting" if not otherwise stated; in the hospital setting, "lying" would be the normal assumption. The assumed values feature of archetypes allows such assumptions to be explicitly stated so that all users/systems know what value to assume when optional items are not included in the data. Assumed values are definable at the leaf level only, which appears to be adequate for all purposes described to date; accordingly, they appear in descendants of `C_PRIMITIVE` and also `C_DOMAIN_TYPE`.

The notion of assumed values is distinct from that of 'default values'. The latter is a local requirement, and as such is stated in templates; default values do appear in data, while assumed values don't.

##### Valid_value

The `_valid_value_` function tests a reference model object for conformance to the archetype. It is designed for recursive implementation in which a call to the function at the top of the archetype definition would cause a cascade of calls down the tree. This function is the key function of an 'archetype-enabled kernel' component that can perform runtime data validation based on an archetype definition.

##### Default_value

This function is used to generate a reasonable default value of the reference object being constrained by a given node. This allows archetype-based software to build a 'prototype' object from an archetype which can serve as the initial version of the object being constrained, assuming it is being created new by user activity (e.g. via a GUI application). Implementation of this function will usually involve use of reflection libraries or similar.

#### Complex Objects (C_COMPLEX_OBJECT)

Along with `C_ATTRIBUTE`, `C_COMPLEX_OBJECT` is the key structuring type of the constraint_model package, and consists of attributes of type `C_ATTRIBUTE`, which are constraints on the attributes (i.e. any property, including relationships) of the reference model type. Accordingly, each `C_ATTRIBUTE` records the name of the constrained attribute (in `_rm_attr_name_`), the existence and cardinality expressed by the constraint (depending on whether the attribute it constrains is a multiple or single relationship), and the constraint on the object to which this `C_ATTRIBUTE` refers via its children attribute (according to its reference model) in the form of further `C_OBJECTs`.

#### Primitive Types

Constraints on primitive types are defined by the classes inheriting from `C_PRIMITIVE`, namely `C_STRING`, `C_INTEGER` and so on. These types do not inherit from `ARCHETYPE_CONSTRAINT`, but rather are related by association, in order to allow them to have the simplest possible definitions, independent even from the rest of ADL, in the hope of acceptance in heath standardisation organisations. Technically, avoiding inheritance from `ARCHETYPE_CONSTRAINT` / `C_PRIMITIVE_OBJECT` into these base types (in other words, coalescing the classes `C_PRIMITIVE_OBJECT` and `C_PRIMITIVE`) does not pose a problem, but could be effected at a later date if desired.

#### Domain-specific Extensions (C_DOMAIN_TYPE)

The main part of the archetype constraint model allows any type in a reference model to be archetyped - i.e. constrained - in a standard way, which is to say, by a regular cascade of `C_COMPLEX_OBJECT` / `C_ATTRIBUTE` / `C_PRIMITIVE_OBJECT` objects. This generally works well, especially for 'outer' container types in models. However, it occurs reasonably often that lower level logical 'leaf' types need special constraint semantics that are not conveniently achieved with the standard approach. To enable such classes to be integrated into the generic constraint model, the class `C_DOMAIN_TYPE` is included. This enables the creation of specific `C_` classes, inheriting from
`C_DOMAIN_TYPE`, which represent custom semantics for particular reference model types. For example, a class called `C_QUANTITY` might be created which has different constraint semantics from the default effect of a `C_COMPLEX_OBJECT` / `C_ATTRIBUTE` cascade representing such constraints in the generic way (i.e. systematically based on the reference model). An example of domain-specific extension classes is shown in the section <<Domain-specific Extension Example>>.

#### Reference Objects (C_REFERENCE_OBJECT)

The subtypes of `C_REFERENCE_OBJECT`, namely, `ARCHETYPE_SLOT`, `ARCHETYPE_INTERNAL_REF` and `CONSTRAINT_REF` are used to express, respectively, a 'slot' where further archetypes can be used to continue describing constraints; a reference to a part of the current archetype that expresses exactly the same constraints needed at another point; and a reference to a constraint on a constraint defined in the archetype ontology, which in turn points to an external knowledge resource, such as a terminology.

A `CONSTRAINT_REF` is really a proxy for a set of constraints on an object that would normally occur at a particular point in the archetype as a `C_COMPLEX_OBJECT`, but where the actual definition of the constraints is outside the archetype definition proper, and is instead expressed in the binding of the constraint reference (e.g. 'ac0004') to a query or expression into an external service (e.g. a terminology service). The result of the query could be something like:

* a set of allowed `CODED_TERMs` e.g. the types of hepatitis
* an `INTERVAL<QUANTITY>` forming a reference range
* a set of units or properties or other numerical item

See {openehr_am_adl14}#_placeholder_constraints[Placeholder constraints] in the ADL specification for a fuller explanation.

### Assertions

The `C_ATTRIBUTE` and subtypes of `C_OBJECT` enable constraints to be expressed in a structural fashion such that any constraint concerning a single attribute may be expressed, including recursively. In addition to this, any instance of a `C_COMPLEX_OBJECT` may include one or more invariants. Invariants are statements in a form of predicate logic, which can also be used to state constraints on parts of an object. They are not needed to constrain single attributes (since this can be done with an appropriate `C_ATTRIBUTE`), but are necessary for constraints referring to more than one attribute, such as a constraint that 'systolic pressure should be >= diastolic pressure' in a blood pressure measurement archetype. Invariants are expressed using a syntax derived from the OMG's OCL syntax (adapted for use with objects rather than classes).

Assertions are also used in `ARCHETYPE_SLOTs`, in order to express the 'included' and 'excluded' archetypes for the slot. In this case, each assertion is an expression that refers to parts of other archetypes, such as its identifier (e.g. 'include archetypes with short_concept_name matching xxxx'). Assertions are modelled here as a generic expression tree of unary prefix and binary infix operators. Examples of archetype slots in ADL syntax are given in the openEHR ADL document.

## Class Definitions




# The Assertion Package

## Overview

Assertions are expressed in archetypes in typed first-order predicate logic (FOL). They are used in two places: to express archetype slot constraints, and to express rules in complex object constraints. In both of these places, their role is to constrain something _inside_ the archetype. Constraints on external resources such as terminologies are expressed in the constraint binding part of the archetype `ontology`, described in <<_terminology_package>>. The `assertion` package is illustrated below.

.aom14.archetype.assertion Package
image::UML/diagrams/AM-aom14.archetype.assertion.svg[id=assertion_package, align="center"]

## Semantics

Archetype assertions are statements which contain the following elements:

* variables, which are inbuilt, archetype path-based, or external query results;
* manifest constants of any primitive type, including the date/time types
* arithmetic operators: `+`, `*`, `-`, `/`, `^` (exponent), `%` (modulo division)
* relational operators: `>`, `<`, `>=`, `\<=`, `=`, `!=`, `matches`
* boolean operators: `not`, `and`, `or`, `xor`
* quantifiers applied to container variables: `for_all`, `exists`

The written syntax of assertions is defined in the openEHR ADL document. The package described here is currently designed to allow the representation of a general-purpose binary expression tree, as would be generated by a parser. This may be replaced in the future by a more specific model, if needed.

This relatively simple model of expressions is sufficiently powerful for representing FOL expressions on archetype structures, although it could clearly be more heavily subtyped.

## Class Descriptions



# Primitive Package

## Overview

Ultimately any archetype definition will devolve down to leaf node constraints on instances of primitive types. The `primitive` package, illustrated in the following figure, defines the semantics of constraint on such types.

.aom14.archetype.constraint_model.primitive Package
image::UML/diagrams/AM-aom14.archetype.constraint_model.primitive.svg[id=constraint_model.primitive_package, align="center"]

Most of the types provide at least two alternative ways to represent the constraint; for example the `C_DATE` type allows the constraint to be expressed in the form of a pattern (defined in the ADL specification) or an `Interval<Date>`. Note that the interval form of dates is probably only useful for historical date checking (e.g. the date of an antique or a particular batch of vaccine), rather than constraints on future date/times.

## Class Descriptions


# Terminology Package

## Overview

All linguistic and terminological entities in an archetype are represented in the `ontology` part of an archetype, whose semantics are given in the `ontology` package, shown below.

.aom14.archetype.ontology Package
image::UML/diagrams/AM-aom14.archetype.ontology.svg[id=ontology_package, align="center"]

An archetype ontology consists of the following things.

* A list of terms defined local to the archetype. These are identified by 'atNNNN' codes, and perform the function of archetype node identifiers from which paths are created. There is one such list for each natural language in the archetype. A term 'at0001' defined in English as 'blood group' is an example.
* A list of external constraint definitions, identified by 'acNNNN' codes, for constraints defined external to the archetype, and referenced using an instance of a `CONSTRAINT_REF`. There is one such list for each natural language in the archetype. A term 'ac0001' corresponding to 'any term which is-a blood group', which can be evaluated against some external terminology service.
* Optionally, a set of one or more bindings of term definitions to term codes from external terminologies.
* Optionally, a set of one or more bindings of the external constraint definitions to external resources such as terminologies.

## Semantics

### Specialisation Depth

Any given archetype occurs at some point in a lineage of archetypes related by specialisation, where the depth is reflected by the `_specialisation_depth_` attribute. An archetype which is not a specialisation of another has a specialisation_depth of 0. Term and constraint codes _introduced_ in the terminology of specialised archetypes (i.e. which did not exist in the terminology of the parent archetype) are defined in a strict way, using '.' (period) markers. For example, an archetype of specialisation depth 2 will use term definition codes like the following:

* `at0.0.1` - a new term introduced in this archetype, which is not a specialisation of any previous term in any of the parent archetypes;
* `at0001.0.1` - a term which specialises the 'at0001' term from the top parent. An intervening '.0' is required to show that the new term is at depth 2, not depth 1;
* `at0001.1.1` - a term which specialises the term 'at0001.1' from the immediate parent, which itself specialises the term 'at0001' from the top parent.

This systematic definition of codes enables software to use the structure of the codes to more quickly and accurately make inferences about term definitions up and down specialisation hierarchies. Constraint codes on the other hand do not follow these rules, and exist in a flat code space instead.

### Term and Constraint Definitions

Local term and constraint definitions are modelled as instances of the class `ARCHETYPE_TERM`, which is a code associated with a list of name/value pairs. For any term or constraint definition, this list must at least include the name/value pairs for the names "text" and "description". It might also include such things as "provenance", which would be used to indicate that a term was sourced from an external terminology. The attribute `_term_attribute_names_` in `ARCHETYPE_ONTOLOGY` provides a list of attribute names used in term and constraint definitions in the archetype, including "text" and "description", as well as any others which are used in various places.

## Class Descriptions




# Domain-specific Extension Example

## Overview

Domain-specific classes can be added to the archetype constraint model by inheriting from the class `C_DOMAIN_TYPE`. This section provides an example of how domain-specific constraint classes are added to the archetype model. Actual additions to the AOM for openEHR are documented in the openEHR Archetype Profile (oAP) specification.

## Scientific/Clinical Computing Types

The following figure shows the general approach, used to add constraint classes for commonly used concepts in scientific and clinical computing, such as 'ordinal' (used heavily in medicine, particularly in pathology testing), 'coded term' (also heavily used in clinical computing) and 'quantity', a general scientific measurement concept. The constraint types shown are `C_ORDINAL`, `C_CODED_TEXT` and `C_QUANTITY` which can optionally be used in archetypes to replace the default constraint semantics represented by the use of instances of `C_OBJECT` / `C_ATTRIBUTE` to constrain ordinals, coded terms and quantities. The following model is intended only as an example, and does not try to define any normative semantics of the particular constraint types shown.

.aom14.openehr_archetype_profile package
image::UML/diagrams/AM-aom14.openehr_archetype_profile.svg[id=example_domain_package, align="center"]


## Class Descriptions

# Using Archetypes with Diverse Reference Models

## Overview

The archetype model described in this document can be used with any reference model which is expressed in UML or a similar object-oriented formalism. It can also be used with E/R models. The following section describes is use a number of reference models used in clinical computing.

## Clinical Computing Use

*To Be Continued*:

* data types
* class naming
* domain archetype semantics versus LCD semantics of exchange models
* mapping from `C_DOMAIN_TYPE` subtypes into various RMs



:sectnums!:

:sectnums!:
## References

bibliography::[]

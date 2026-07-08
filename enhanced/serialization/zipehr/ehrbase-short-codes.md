This file was generated as a response to a question to deepwiki: https://deepwiki.com/search/ehrbase-has-a-way-of-in-databa_e38179dc-2a99-4485-beba-dc7e2fa78d17 and is used as inspiration fro one of the serialisation formats.

I found the authoritative converter code that maps openEHR classes to two-letter codes. The mapping is defined in two main files in the `rm-db-format` module.

## Authoritative Source Files

### 1. StructureRmType.java - Structure Type Codes
The `StructureRmType` enum defines two-letter codes for openEHR structure types in its enum constants: [1](#1-0) 

```java
COMPOSITION("CO", StructureRoot.COMPOSITION, Composition.class, false),
FOLDER("F", StructureRoot.FOLDER, Folder.class, true),
EHR_STATUS("ES", StructureRoot.EHR_STATUS, EhrStatus.class, false),
EVENT_CONTEXT("EC", StructureRoot.COMPOSITION, EventContext.class, true, false, COMPOSITION),
SECTION("SE", StructureRoot.COMPOSITION, Section.class, true, true, COMPOSITION),
ADMIN_ENTRY("AE", StructureRoot.COMPOSITION, AdminEntry.class, true, false, COMPOSITION, SECTION),
OBSERVATION("OB", StructureRoot.COMPOSITION, Observation.class, true, false, COMPOSITION, SECTION),
INSTRUCTION("IN", StructureRoot.COMPOSITION, Instruction.class, true, false, COMPOSITION, SECTION),
ACTION("AN", StructureRoot.COMPOSITION, Action.class, true, false, COMPOSITION, SECTION),
EVALUATION("EV", StructureRoot.COMPOSITION, Evaluation.class, true, false, COMPOSITION, SECTION),
ACTIVITY("AY", StructureRoot.COMPOSITION, Activity.class, true, false, INSTRUCTION),
HISTORY("HI", StructureRoot.COMPOSITION, History.class, true, false, OBSERVATION),
POINT_EVENT("PE", StructureRoot.COMPOSITION, PointEvent.class, true, false, HISTORY),
INTERVAL_EVENT("IE", StructureRoot.COMPOSITION, IntervalEvent.class, true, false, HISTORY),
FEEDER_AUDIT("FA", null, FeederAudit.class, true, false, COMPOSITION, FOLDER, EHR_STATUS, ...),
ITEM_LIST("IL", null, ItemList.class, true, false, FOLDER, EHR_STATUS, ...),
ITEM_SINGLE("IS", null, ItemSingle.class, true, false, FOLDER, EHR_STATUS, ...),
ITEM_TABLE("TA", null, ItemTable.class, true, false, FOLDER, EHR_STATUS, ...),
ITEM_TREE("TR", null, ItemTree.class, true, false, FOLDER, EHR_STATUS, ...),
CLUSTER("CL", null, Cluster.class, true, true, ITEM_TABLE, ITEM_TREE),
```

### 2. RmTypeAlias.java - Unified Alias System
The `RmTypeAlias` record provides a unified interface for all RM type aliases, including both structure types and data value types: [2](#1-1) 

```java
public record RmTypeAlias(String type, String alias, boolean structureAlias) {
    static final List<RmTypeAlias> values = List.of(
        structureAlias(StructureRmType.COMPOSITION),
        structureAlias(StructureRmType.FOLDER),
        // ... other structure types
        alias("ARCHETYPED", "AR"),
        alias("DV_BOOLEAN", "b"),
        alias("DV_CODED_TEXT", "c"),
        alias("DV_COUNT", "co"),
        alias("DV_DATE", "d"),
        alias("DV_DATE_TIME", "dt"),
        alias("DV_DURATION", "du"),
        alias("DV_TEXT", "x"),
        // ... many more data value types
    );
}
```

## How the Conversion Works

The conversion happens through the `RmTypeAlias` class which provides lookup methods. The `AslRmTypeAndConcept` class shows how this is used in practice when parsing archetype node IDs: [3](#1-2) 

```java
public static AslRmTypeAndConcept fromArchetypeNodeId(String archetypeNodeId) {
    if (archetypeNodeId.startsWith(ARCHETYPE_PREFIX)) {
        int pos = archetypeNodeId.indexOf('.', ARCHETYPE_PREFIX.length());
        String alias = RmTypeAlias.optionalAlias(archetypeNodeId.substring(ARCHETYPE_PREFIX.length(), pos))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Archetype id for unsupported/unknown RM type: " + archetypeNodeId));
        String concept = archetypeNodeId.substring(pos);
        return new AslRmTypeAndConcept(alias, concept);
    }
    // ...
}
```

This method extracts the RM type from an archetype ID like "openEHR-EHR-COMPOSITION.health_summary.v1", looks up "COMPOSITION" to get the alias "CO", and returns the aliased type.

## Complete Mapping Table

| Code | openEHR Class | Type |
|------|---------------|------|
| CO | COMPOSITION | Structure |
| F | FOLDER | Structure |
| ES | EHR_STATUS | Structure |
| EC | EVENT_CONTEXT | Structure |
| SE | SECTION | Structure |
| GE | GENERIC_ENTRY | Structure |
| AE | ADMIN_ENTRY | Structure |
| OB | OBSERVATION | Structure |
| IN | INSTRUCTION | Structure |
| AN | ACTION | Structure |
| EV | EVALUATION | Structure |
| ID | INSTRUCTION_DETAILS | Structure |
| AY | ACTIVITY | Structure |
| HI | HISTORY | Structure |
| PE | POINT_EVENT | Structure |
| IE | INTERVAL_EVENT | Structure |
| FA | FEEDER_AUDIT | Structure |
| FD | FEEDER_AUDIT_DETAILS | Structure |
| IL | ITEM_LIST | Structure |
| IS | ITEM_SINGLE | Structure |
| TA | ITEM_TABLE | Structure |
| TR | ITEM_TREE | Structure |
| CL | CLUSTER | Structure |
| E | ELEMENT | Structure |
| AR | ARCHETYPED | Data Value |
| AX | ARCHETYPE_ID | Data Value |
| C | CODE_PHRASE | Data Value |
| b | DV_BOOLEAN | Data Value |
| c | DV_CODED_TEXT | Data Value |
| co | DV_COUNT | Data Value |
| d | DV_DATE | Data Value |
| dt | DV_DATE_TIME | Data Value |
| du | DV_DURATION | Data Value |
| eu | DV_EHR_URI | Data Value |
| id | DV_IDENTIFIER | Data Value |
| iv | DV_INTERVAL | Data Value |
| mu | DV_MULTIMEDIA | Data Value |
| o | DV_ORDINAL | Data Value |
| pa | DV_PARSABLE | Data Value |
| pr | DV_PROPORTION | Data Value |
| q | DV_QUANTITY | Data Value |
| x | DV_TEXT | Data Value |
| t | DV_TIME | Data Value |
| u | DV_URI | Data Value |

## Notes

The two-letter code system is implemented through a combination of enum-based mapping for structure types (`StructureRmType`) and a unified alias system for all RM types (`RmTypeAlias`). The conversion is used extensively in the database format layer to optimize storage and in the AQL engine to parse archetype references. The codes appear in the `rm_entity` database column and in the "T" field of JSON serialized data.

Wiki pages you might want to explore:
- [Data Layer (ehrbase/ehrbase)](/wiki/ehrbase/ehrbase#2.2)
- [API Layer (ehrbase/ehrbase)](/wiki/ehrbase/ehrbase#2.4)

### Citations

**File:** rm-db-format/src/main/java/org/ehrbase/openehr/dbformat/StructureRmType.java (L59-214)
```java
public enum StructureRmType {
    COMPOSITION("CO", StructureRoot.COMPOSITION, Composition.class, false), // , "content", "context"),
    FOLDER("F", StructureRoot.FOLDER, Folder.class, true),
    EHR_STATUS("ES", StructureRoot.EHR_STATUS, EhrStatus.class, false),

    EVENT_CONTEXT("EC", StructureRoot.COMPOSITION, EventContext.class, true, false, COMPOSITION), // , "otherContext"),

    SECTION("SE", StructureRoot.COMPOSITION, Section.class, true, true, COMPOSITION), // , "items"),
    GENERIC_ENTRY("GE", StructureRoot.COMPOSITION, GenericEntry.class, true, false, COMPOSITION, SECTION), // ,"data"),
    ADMIN_ENTRY("AE", StructureRoot.COMPOSITION, AdminEntry.class, true, false, COMPOSITION, SECTION), // ,"data"),
    OBSERVATION(
            "OB",
            StructureRoot.COMPOSITION,
            Observation.class,
            true,
            false,
            COMPOSITION,
            SECTION), // ,"data", "state", "protocol"),
    INSTRUCTION(
            "IN",
            StructureRoot.COMPOSITION,
            Instruction.class,
            true,
            false,
            COMPOSITION,
            SECTION), // ,"activities", "protocol"),
    ACTION(
            "AN",
            StructureRoot.COMPOSITION,
            Action.class,
            true,
            false,
            COMPOSITION,
            SECTION), // ,"description", "instructionDetails", "protocol"),
    EVALUATION(
            "EV",
            StructureRoot.COMPOSITION,
            Evaluation.class,
            true,
            false,
            COMPOSITION,
            SECTION), // ,"data", "protocol"),

    INSTRUCTION_DETAILS(
            "ID", StructureRoot.COMPOSITION, InstructionDetails.class, false, false, ACTION), // , "wf_details"),
    ACTIVITY("AY", StructureRoot.COMPOSITION, Activity.class, true, false, INSTRUCTION), // , "description"),

    HISTORY("HI", StructureRoot.COMPOSITION, History.class, true, false, OBSERVATION), // , "events", "summary"),
    POINT_EVENT("PE", StructureRoot.COMPOSITION, PointEvent.class, true, false, HISTORY), // , "data", "state"),
    INTERVAL_EVENT("IE", StructureRoot.COMPOSITION, IntervalEvent.class, true, false, HISTORY), // , "data", "state"),

    FEEDER_AUDIT(
            "FA",
            null,
            FeederAudit.class,
            true,
            false,
            COMPOSITION,
            FOLDER,
            EHR_STATUS,
            SECTION,
            GENERIC_ENTRY,
            ADMIN_ENTRY,
            OBSERVATION,
            INSTRUCTION,
            ACTION,
            EVALUATION,
            ACTIVITY,
            HISTORY,
            POINT_EVENT,
            INTERVAL_EVENT), // Locatable.feederAudit
    FEEDER_AUDIT_DETAILS("FD", null, FeederAuditDetails.class, false, false, FEEDER_AUDIT),

    ITEM_LIST(
            "IL",
            null,
            ItemList.class,
            true,
            false,
            FOLDER,
            EHR_STATUS,
            FEEDER_AUDIT_DETAILS,
            EVENT_CONTEXT,
            ADMIN_ENTRY,
            OBSERVATION,
            INSTRUCTION,
            ACTION,
            EVALUATION,
            INSTRUCTION_DETAILS,
            ACTIVITY,
            HISTORY,
            POINT_EVENT,
            INTERVAL_EVENT), // , "items"),

    ITEM_SINGLE(
            "IS",
            null,
            ItemSingle.class,
            true,
            false,
            FOLDER,
            EHR_STATUS,
            FEEDER_AUDIT_DETAILS,
            EVENT_CONTEXT,
            ADMIN_ENTRY,
            OBSERVATION,
            INSTRUCTION,
            ACTION,
            EVALUATION,
            INSTRUCTION_DETAILS,
            ACTIVITY,
            HISTORY,
            POINT_EVENT,
            INTERVAL_EVENT), // , "item"),
    ITEM_TABLE(
            "TA",
            null,
            ItemTable.class,
            true,
            false,
            FOLDER,
            EHR_STATUS,
            FEEDER_AUDIT_DETAILS,
            EVENT_CONTEXT,
            ADMIN_ENTRY,
            OBSERVATION,
            INSTRUCTION,
            ACTION,
            EVALUATION,
            INSTRUCTION_DETAILS,
            ACTIVITY,
            HISTORY,
            POINT_EVENT,
            INTERVAL_EVENT), // , "rows"),
    ITEM_TREE(
            "TR",
            null,
            ItemTree.class,
            true,
            false,
            FOLDER,
            EHR_STATUS,
            FEEDER_AUDIT_DETAILS,
            EVENT_CONTEXT,
            GENERIC_ENTRY,
            ADMIN_ENTRY,
            OBSERVATION,
            INSTRUCTION,
            ACTION,
            EVALUATION,
            INSTRUCTION_DETAILS,
            ACTIVITY,
            HISTORY,
            POINT_EVENT,
            INTERVAL_EVENT), // , "items"),
    CLUSTER("CL", null, Cluster.class, true, true, ITEM_TABLE, ITEM_TREE), // , "items"),
```

**File:** rm-db-format/src/main/java/org/ehrbase/openehr/dbformat/RmTypeAlias.java (L28-98)
```java
public record RmTypeAlias(String type, String alias, boolean structureAlias) {

    static final List<RmTypeAlias> values = List.of(
            structureAlias(StructureRmType.COMPOSITION),
            structureAlias(StructureRmType.FOLDER),
            structureAlias(StructureRmType.EHR_STATUS),
            structureAlias(StructureRmType.FEEDER_AUDIT),
            structureAlias(StructureRmType.FEEDER_AUDIT_DETAILS),
            structureAlias(StructureRmType.EVENT_CONTEXT),
            structureAlias(StructureRmType.SECTION),
            structureAlias(StructureRmType.GENERIC_ENTRY),
            structureAlias(StructureRmType.ADMIN_ENTRY),
            structureAlias(StructureRmType.OBSERVATION),
            structureAlias(StructureRmType.INSTRUCTION),
            structureAlias(StructureRmType.ACTION),
            structureAlias(StructureRmType.EVALUATION),
            structureAlias(StructureRmType.INSTRUCTION_DETAILS),
            structureAlias(StructureRmType.ACTIVITY),
            structureAlias(StructureRmType.HISTORY),
            structureAlias(StructureRmType.POINT_EVENT),
            structureAlias(StructureRmType.INTERVAL_EVENT),
            structureAlias(StructureRmType.ITEM_LIST),
            structureAlias(StructureRmType.ITEM_SINGLE),
            structureAlias(StructureRmType.ITEM_TABLE),
            structureAlias(StructureRmType.ITEM_TREE),
            structureAlias(StructureRmType.CLUSTER),
            structureAlias(StructureRmType.ELEMENT),
            alias("ARCHETYPED", "AR"),
            alias("ARCHETYPE_ID", "AX"),
            alias("ATTESTATION", "AT"),
            alias("AUDIT_DETAILS", "AD"),
            alias("CODE_PHRASE", "C"),
            alias("DV_BOOLEAN", "b"),
            alias("DV_CODED_TEXT", "c"),
            alias("DV_COUNT", "co"),
            alias("DV_DATE", "d"),
            alias("DV_DATE_TIME", "dt"),
            alias("DV_DURATION", "du"),
            alias("DV_EHR_URI", "eu"),
            alias("DV_IDENTIFIER", "id"),
            alias("DV_INTERVAL", "iv"),
            alias("DV_MULTIMEDIA", "mu"),
            alias("DV_ORDINAL", "o"),
            alias("DV_PARAGRAPH", "p"),
            alias("DV_PARSABLE", "pa"),
            alias("DV_PROPORTION", "pr"),
            alias("DV_QUANTITY", "q"),
            alias("DV_SCALE", "sc"),
            alias("DV_STATE", "st"),
            alias("DV_TEXT", "x"),
            alias("DV_TIME", "t"),
            alias("DV_URI", "u"),
            alias("GENERIC_ID", "GX"),
            alias("HIER_OBJECT_ID", "HX"),
            alias("INTERNET_ID", "IX"),
            alias("INTERVAL", "IV"),
            alias("ISM_TRANSITION", "IT"),
            alias("LINK", "LK"),
            alias("LOCATABLE_REF", "LR"),
            alias("OBJECT_REF", "OR"),
            alias("OBJECT_VERSION_ID", "OV"),
            alias("PARTICIPATION", "PA"),
            alias("PARTY_IDENTIFIED", "PI"),
            alias("PARTY_REF", "PF"),
            alias("PARTY_RELATED", "PR"),
            alias("PARTY_SELF", "PS"),
            alias("REFERENCE_RANGE", "RR"),
            alias("TEMPLATE_ID", "TP"),
            alias("TERMINOLOGY_ID", "T"),
            alias("TERM_MAPPING", "TM"),
            alias("UUID", "U"));
```

**File:** aql-engine/src/main/java/org/ehrbase/openehr/aqlengine/asl/model/AslRmTypeAndConcept.java (L32-46)
```java
    public static AslRmTypeAndConcept fromArchetypeNodeId(String archetypeNodeId) {
        if (archetypeNodeId == null) {
            return null;
        }

        if (archetypeNodeId.startsWith(ARCHETYPE_PREFIX)) {
            int pos = archetypeNodeId.indexOf('.', ARCHETYPE_PREFIX.length());
            if (pos < 0) {
                throw new IllegalArgumentException("Archetype id is not valid: " + archetypeNodeId);
            }
            String alias = RmTypeAlias.optionalAlias(archetypeNodeId.substring(ARCHETYPE_PREFIX.length(), pos))
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Archetype id for unsupported/unknown RM type: " + archetypeNodeId));
            String concept = archetypeNodeId.substring(pos);
            return new AslRmTypeAndConcept(alias, concept);
```

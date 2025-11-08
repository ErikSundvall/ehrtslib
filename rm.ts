// Type definitions for openEHR RM 1.2.0
// Project: https://specifications.openehr.org/releases/RM/Release-1.2.0
// Definitions by: Jules <https://www.jules.ai>

import {
    Any,
    UID_BASED_ID,
    LOCATABLE,
    OBJECT_REF,
    HIER_OBJECT_ID,
    Integer,
    Boolean,
    String,
    CODE_PHRASE,
    PARTY_PROXY,
    OBJECT_VERSION_ID,
    TERMINOLOGY_ID,
    Ordered,
    Real,
    TEMPLATE_ID,
    ARCHETYPE_ID,
    PARTY_SELF,
    Interval,
    Octet,
    Character,
    Integer64
} from "./base";

//
// rm.data_types
//

export abstract class DATA_VALUE extends Any {
}

export class DV_DATE_TIME extends DATA_VALUE {
    value: string;
    constructor(value: string) {
        super();
        this.value = value;
    }
}

export class DV_CODED_TEXT extends DATA_VALUE {
    value: String;
    defining_code: CODE_PHRASE;
    constructor(value: String, defining_code: CODE_PHRASE) {
        super();
        this.value = value;
        this.defining_code = defining_code;
    }
}

export class DV_PARSABLE extends DATA_VALUE {
    value: String;
    formalism: String;
    constructor(value: String, formalism: String) {
        super();
        this.value = value;
        this.formalism = formalism;
    }
}

export abstract class ITEM_STRUCTURE extends DATA_VALUE {
}

export class DV_DURATION extends DATA_VALUE {
    value: string;
    constructor(value: string) {
        super();
        this.value = value;
    }
}

export class AUDIT_DETAILS extends Any {
    system_id: String;
    time_committed: DV_DATE_TIME;
    change_type: DV_CODED_TEXT;
    description?: DV_TEXT;
    committer: PARTY_PROXY;
    constructor(
        system_id: String,
        time_committed: DV_DATE_TIME,
        change_type: DV_CODED_TEXT,
        committer: PARTY_PROXY,
        description?: DV_TEXT
    ) {
        super();
        this.system_id = system_id;
        this.time_committed = time_committed;
        this.change_type = change_type;
        this.description = description;
        this.committer = committer;
    }
}

export abstract class VERSION<T> extends Any {
    contribution: OBJECT_REF;
    commit_audit: AUDIT_DETAILS;
    signature?: String;
    constructor(contribution: OBJECT_REF, commit_audit: AUDIT_DETAILS, signature?: String) {
        super();
        this.contribution = contribution;
        this.commit_audit = commit_audit;
        this.signature = signature;
    }
}

export class DV_TEXT extends DATA_VALUE {
    value: String;
    constructor(value: String) {
        super();
        this.value = value;
    }
}

export class DV_URI extends DATA_VALUE {
    value: String;
    constructor(value: String) {
        super();
        this.value = value;
    }
}

export class DV_IDENTIFIER extends DATA_VALUE {
    issuer?: String;
    id: String;
    type?: String;
    assigner?: String;
    constructor(id: String, issuer?: String, type?: String, assigner?: String) {
        super();
        this.issuer = issuer;
        this.id = id;
        this.type = type;
        this.assigner = assigner;
    }
}

export class DV_MULTIMEDIA extends DATA_VALUE {
    alternate_text?: String;
    uri?: DV_URI;
    data?: Octet[];
    media_type: CODE_PHRASE;
    compression_algorithm?: CODE_PHRASE;
    integrity_check?: Octet[];
    integrity_check_algorithm?: CODE_PHRASE;
    thumbnail?: DV_MULTIMEDIA;
    size: Integer;
    constructor(
        media_type: CODE_PHRASE,
        size: Integer,
        alternate_text?: String,
        uri?: DV_URI,
        data?: Octet[],
        compression_algorithm?: CODE_PHRASE,
        integrity_check?: Octet[],
        integrity_check_algorithm?: CODE_PHRASE,
        thumbnail?: DV_MULTIMEDIA
    ) {
        super();
        this.alternate_text = alternate_text;
        this.uri = uri;
        this.data = data;
        this.media_type = media_type;
        this.compression_algorithm = compression_algorithm;
        this.integrity_check = integrity_check;
        this.integrity_check_algorithm = integrity_check_algorithm;
        this.thumbnail = thumbnail;
        this.size = size;
    }
}

export class DV_EHR_URI extends DV_URI {
}


//
// rm.ehr_extract
//

export class EXTRACT extends LOCATABLE {
    request_id?: HIER_OBJECT_ID;
    time_created: DV_DATE_TIME;
    system_id: HIER_OBJECT_ID;
    sequence_nr: Integer;
    specification?: EXTRACT_SPEC;
    chapters?: EXTRACT_CHAPTER[];
    participations?: EXTRACT_PARTICIPATION[];
    constructor(
        time_created: DV_DATE_TIME,
        system_id: HIER_OBJECT_ID,
        sequence_nr: Integer,
        request_id?: HIER_OBJECT_ID,
        specification?: EXTRACT_SPEC,
        chapters?: EXTRACT_CHAPTER[],
        participations?: EXTRACT_PARTICIPATION[]
    ) {
        super();
        this.request_id = request_id;
        this.time_created = time_created;
        this.system_id = system_id;
        this.sequence_nr = sequence_nr;
        this.specification = specification;
        this.chapters = chapters;
        this.participations = participations;
    }
}

export class EXTRACT_SPEC extends Any {
    extract_type: DV_CODED_TEXT;
    include_multimedia: Boolean;
    priority: Integer;
    link_depth: Integer;
    criteria?: DV_PARSABLE[];
    manifest: EXTRACT_MANIFEST;
    version_spec?: EXTRACT_VERSION_SPEC;
    other_details?: ITEM_STRUCTURE;
    constructor(
        extract_type: DV_CODED_TEXT,
        include_multimedia: Boolean,
        priority: Integer,
        link_depth: Integer,
        manifest: EXTRACT_MANIFEST,
        criteria?: DV_PARSABLE[],
        version_spec?: EXTRACT_VERSION_SPEC,
        other_details?: ITEM_STRUCTURE
    ) {
        super();
        this.extract_type = extract_type;
        this.include_multimedia = include_multimedia;
        this.priority = priority;
        this.link_depth = link_depth;
        this.criteria = criteria;
        this.manifest = manifest;
        this.version_spec = version_spec;
        this.other_details = other_details;
    }
}

export class EXTRACT_MANIFEST extends Any {
    entities: EXTRACT_ENTITY_MANIFEST[];
    constructor(entities: EXTRACT_ENTITY_MANIFEST[]) {
        super();
        this.entities = entities;
    }
}

export class EXTRACT_ENTITY_MANIFEST extends Any {
    extract_id_key: String;
    ehr_id?: String;
    subject_id?: String;
    other_ids?: String[];
    item_list?: OBJECT_REF[];
    constructor(
        extract_id_key: String,
        ehr_id?: String,
        subject_id?: String,
        other_ids?: String[],
        item_list?: OBJECT_REF[]
    ) {
        super();
        this.extract_id_key = extract_id_key;
        this.ehr_id = ehr_id;
        this.subject_id = subject_id;
        this.other_ids = other_ids;
        this.item_list = item_list;
    }
}

export class EXTRACT_VERSION_SPEC extends Any {
    include_all_versions: Boolean;
    commit_time_interval?: DV_INTERVAL<DV_DATE_TIME>;
    include_revision_history: Boolean;
    include_data: Boolean;
    constructor(
        include_all_versions: Boolean,
        include_revision_history: Boolean,
        include_data: Boolean,
        commit_time_interval?: DV_INTERVAL<DV_DATE_TIME>
    ) {
        super();
        this.include_all_versions = include_all_versions;
        this.commit_time_interval = commit_time_interval;
        this.include_revision_history = include_revision_history;
        this.include_data = include_data;
    }
}

export class EXTRACT_CHAPTER extends LOCATABLE {
    items?: EXTRACT_ITEM[];
    constructor(items?: EXTRACT_ITEM[]) {
        super();
        this.items = items;
    }
}

export class EXTRACT_ENTITY_CHAPTER extends EXTRACT_CHAPTER {
    extract_id_key: String;
    constructor(extract_id_key: String, items?: EXTRACT_ITEM[]) {
        super(items);
        this.extract_id_key = extract_id_key;
    }
}

export abstract class EXTRACT_ITEM extends LOCATABLE {
}

export class EXTRACT_FOLDER extends EXTRACT_ITEM {
    items?: EXTRACT_ITEM[];
    constructor(items?: EXTRACT_ITEM[]) {
        super();
        this.items = items;
    }
}

export abstract class EXTRACT_CONTENT_ITEM extends EXTRACT_ITEM {
    is_primary: Boolean;
    is_changed?: Boolean;
    is_masked?: Boolean;
    item?: Any;
    constructor(is_primary: Boolean, is_changed?: Boolean, is_masked?: Boolean, item?: Any) {
        super();
        this.is_primary = is_primary;
        this.is_changed = is_changed;
        this.is_masked = is_masked;
        this.item = item;
    }
}

export class EXTRACT_REQUEST extends LOCATABLE {
    uid: HIER_OBJECT_ID;
    extract_spec: EXTRACT_SPEC;
    update_spec?: EXTRACT_UPDATE_SPEC;
    constructor(uid: HIER_OBJECT_ID, extract_spec: EXTRACT_SPEC, update_spec?: EXTRACT_UPDATE_SPEC) {
        super();
        this.uid = uid;
        this.extract_spec = extract_spec;
        this.update_spec = update_spec;
    }
}

export class EXTRACT_UPDATE_SPEC extends Any {
    persist_in_server: Boolean;
    trigger_events: DV_CODED_TEXT[];
    repeat_period?: DV_DURATION;
    update_method: CODE_PHRASE;
    constructor(
        persist_in_server: Boolean,
        trigger_events: DV_CODED_TEXT[],
        update_method: CODE_PHRASE,
        repeat_period?: DV_DURATION
    ) {
        super();
        this.persist_in_server = persist_in_server;
        this.trigger_events = trigger_events;
        this.repeat_period = repeat_period;
        this.update_method = update_method;
    }
}

export class EXTRACT_ACTION_REQUEST extends LOCATABLE {
    request_id: OBJECT_REF;
    uid: HIER_OBJECT_ID;
    action: DV_CODED_TEXT;
    constructor(request_id: OBJECT_REF, uid: HIER_OBJECT_ID, action: DV_CODED_TEXT) {
        super();
        this.request_id = request_id;
        this.uid = uid;
        this.action = action;
    }
}

export class GENERIC_CONTENT_ITEM extends EXTRACT_CONTENT_ITEM {
    item_type?: DV_CODED_TEXT;
    item_type_version?: String;
    author?: String;
    creation_time?: Iso8601_date_time;
    authoriser?: String;
    authorisation_time?: Iso8601_date_time;
    item_status?: DV_CODED_TEXT;
    version_id?: String;
    version_set_id?: String;
    system_id?: String;
    other_details?: Map<string, String>;
    item?: LOCATABLE;
    constructor(
        is_primary: Boolean,
        is_changed?: Boolean,
        is_masked?: Boolean,
        item_type?: DV_CODED_TEXT,
        item_type_version?: String,
        author?: String,
        creation_time?: Iso8601_date_time,
        authoriser?: String,
        authorisation_time?: Iso8601_date_time,
        item_status?: DV_CODED_TEXT,
        version_id?: String,
        version_set_id?: String,
        system_id?: String,
        other_details?: Map<string, String>,
        item?: LOCATABLE
    ) {
        super(is_primary, is_changed, is_masked, item);
        this.item_type = item_type;
        this.item_type_version = item_type_version;
        this.author = author;
        this.creation_time = creation_time;
        this.authoriser = authoriser;
        this.authorisation_time = authorisation_time;
        this.item_status = item_status;
        this.version_id = version_id;
        this.version_set_id = version_set_id;
        this.system_id = system_id;
        this.other_details = other_details;
        this.item = item;
    }
}

export class OPENEHR_CONTENT_ITEM extends EXTRACT_CONTENT_ITEM {
    item?: X_VERSIONED_OBJECT<LOCATABLE>;
    constructor(
        is_primary: Boolean,
        is_changed?: Boolean,
        is_masked?: Boolean,
        item?: X_VERSIONED_OBJECT<LOCATABLE>
    ) {
        super(is_primary, is_changed, is_masked, item);
        this.item = item;
    }
}

export class X_VERSIONED_OBJECT<T extends LOCATABLE> extends Any {
    uid: HIER_OBJECT_ID;
    owner_id: OBJECT_REF;
    time_created: DV_DATE_TIME;
    total_version_count: Integer;
    extract_version_count: Integer;
    revision_history?: REVISION_HISTORY;
    versions?: ORIGINAL_VERSION<T>[];
    constructor(
        uid: HIER_OBJECT_ID,
        owner_id: OBJECT_REF,
        time_created: DV_DATE_TIME,
        total_version_count: Integer,
        extract_version_count: Integer,
        revision_history?: REVISION_HISTORY,
        versions?: ORIGINAL_VERSION<T>[]
    ) {
        super();
        this.uid = uid;
        this.owner_id = owner_id;
        this.time_created = time_created;
        this.total_version_count = total_version_count;
        this.extract_version_count = extract_version_count;
        this.revision_history = revision_history;
        this.versions = versions;
    }
}

export class EXTRACT_PARTICIPATION extends Any {
    performer: String;
    function: DV_TEXT;
    mode?: DV_CODED_TEXT;
    time?: DV_INTERVAL<DV_DATE_TIME>;
    constructor(
        performer: String,
        function: DV_TEXT,
        mode?: DV_CODED_TEXT,
        time?: DV_INTERVAL<DV_DATE_TIME>
    ) {
        super();
        this.performer = performer;
        this.function = function;
        this.mode = mode;
        this.time = time;
    }
}

export class X_VERSIONED_EHR_ACCESS extends X_VERSIONED_OBJECT<EHR_ACCESS> {
}

export class X_VERSIONED_EHR_STATUS extends X_VERSIONED_OBJECT<EHR_STATUS> {
}

export class X_VERSIONED_COMPOSITION extends X_VERSIONED_OBJECT<COMPOSITION> {
}

export class X_VERSIONED_FOLDER extends X_VERSIONED_OBJECT<FOLDER> {
}

export class X_VERSIONED_PARTY extends X_VERSIONED_OBJECT<PARTY> {
}

export class SYNC_EXTRACT_REQUEST extends MESSAGE_CONTENT {
    specification: SYNC_EXTRACT_SPEC;
    constructor(specification: SYNC_EXTRACT_SPEC) {
        super();
        this.specification = specification;
    }
}

export class SYNC_EXTRACT extends MESSAGE_CONTENT {
    specification: SYNC_EXTRACT_SPEC;
    items?: X_CONTRIBUTION[];
    constructor(specification: SYNC_EXTRACT_SPEC, items?: X_CONTRIBUTION[]) {
        super();
        this.specification = specification;
        this.items = items;
    }
}

export class SYNC_EXTRACT_SPEC extends Any {
    includes_versions: Boolean;
    contribution_list?: HIER_OBJECT_ID[];
    contributions_since?: DV_DATE_TIME;
    all_contributions?: Boolean;
    constructor(
        includes_versions: Boolean,
        contribution_list?: HIER_OBJECT_ID[],
        contributions_since?: DV_DATE_TIME,
        all_contributions?: Boolean
    ) {
        super();
        this.includes_versions = includes_versions;
        this.contribution_list = contribution_list;
        this.contributions_since = contributions_since;
        this.all_contributions = all_contributions;
    }
}

export class X_CONTRIBUTION extends Any {
    uid: HIER_OBJECT_ID;
    audit: AUDIT_DETAILS;
    versions?: VERSION<LOCATABLE>[];
    constructor(uid: HIER_OBJECT_ID, audit: AUDIT_DETAILS, versions?: VERSION<LOCATABLE>[]) {
        super();
        this.uid = uid;
        this.audit = audit;
        this.versions = versions;
    }
}

export class ADDRESSED_MESSAGE extends Any {
    sender: String;
    sender_reference: String;
    addressees?: String[];
    urgency?: Integer;
    message?: MESSAGE;
    constructor(
        sender: String,
        sender_reference: String,
        addressees?: String[],
        urgency?: Integer,
        message?: MESSAGE
    ) {
        super();
        this.sender = sender;
        this.sender_reference = sender_reference;
        this.addressees = addressees;
        this.urgency = urgency;
        this.message = message;
    }
}

export class MESSAGE extends Any {
    author: PARTY_PROXY;
    audit: AUDIT_DETAILS;
    content: MESSAGE_CONTENT;
    signature?: String;
    constructor(author: PARTY_PROXY, audit: AUDIT_DETAILS, content: MESSAGE_CONTENT, signature?: String) {
        super();
        this.author = author;
        this.audit = audit;
        this.content = content;
        this.signature = signature;
    }
}

export abstract class MESSAGE_CONTENT extends LOCATABLE {
}

//
// rm.ehr
//

export class EHR {
    system_id: HIER_OBJECT_ID;
    ehr_id: HIER_OBJECT_ID;
    time_created: DV_DATE_TIME;
    ehr_access: OBJECT_REF;
    ehr_status: OBJECT_REF;
    directory?: OBJECT_REF;
    folders?: OBJECT_REF[];
    compositions?: OBJECT_REF[];
    contributions: OBJECT_REF[];
    most_recent_composition?: COMPOSITION;
    constructor(
        system_id: HIER_OBJECT_ID,
        ehr_id: HIER_OBJECT_ID,
        time_created: DV_DATE_TIME,
        ehr_access: OBJECT_REF,
        ehr_status: OBJECT_REF,
        contributions: OBJECT_REF[],
        directory?: OBJECT_REF,
        folders?: OBJECT_REF[],
        compositions?: OBJECT_REF[],
        most_recent_composition?: COMPOSITION
    ) {
        this.system_id = system_id;
        this.ehr_id = ehr_id;
        this.time_created = time_created;
        this.ehr_access = ehr_access;
        this.ehr_status = ehr_status;
        this.directory = directory;
        this.folders = folders;
        this.compositions = compositions;
        this.contributions = contributions;
        this.most_recent_composition = most_recent_composition;
    }
}

export class EHR_ACCESS extends LOCATABLE {
    settings?: ACCESS_CONTROL_SETTINGS;
    constructor(settings?: ACCESS_CONTROL_SETTINGS) {
        super();
        this.settings = settings;
    }
}

export abstract class ACCESS_CONTROL_SETTINGS extends Any {
}

export class EHR_STATUS extends LOCATABLE {
    subject: PARTY_SELF;
    is_queryable: Boolean;
    is_modifiable: Boolean;
    other_details?: ITEM_STRUCTURE;
    constructor(
        subject: PARTY_SELF,
        is_queryable: Boolean,
        is_modifiable: Boolean,
        other_details?: ITEM_STRUCTURE
    ) {
        super();
        this.subject = subject;
        this.is_queryable = is_queryable;
        this.is_modifiable = is_modifiable;
        this.other_details = other_details;
    }
}

export class COMPOSITION extends LOCATABLE {
    language: CODE_PHRASE;
    territory: CODE_PHRASE;
    category: DV_CODED_TEXT;
    composer: PARTY_PROXY;
    context?: EVENT_CONTEXT;
    content: CONTENT_ITEM[];
    constructor(
        language: CODE_PHRASE,
        territory: CODE_PHRASE,
        category: DV_CODED_TEXT,
        composer: PARTY_PROXY,
        content: CONTENT_ITEM[],
        context?: EVENT_CONTEXT
    ) {
        super();
        this.language = language;
        this.territory = territory;
        this.category = category;
        this.composer = composer;
        this.context = context;
        this.content = content;
    }
}

export class EVENT_CONTEXT extends PATHABLE {
    health_care_facility?: PARTY_IDENTIFIED;
    start_time: DV_DATE_TIME;
    end_time?: DV_DATE_TIME;
    participations: PARTICIPATION[];
    location?: String;
    setting: DV_CODED_TEXT;
    other_context?: ITEM_STRUCTURE;
    constructor(
        start_time: DV_DATE_TIME,
        participations: PARTICIPATION[],
        setting: DV_CODED_TEXT,
        health_care_facility?: PARTY_IDENTIFIED,
        end_time?: DV_DATE_TIME,
        location?: String,
        other_context?: ITEM_STRUCTURE
    ) {
        super();
        this.health_care_facility = health_care_facility;
        this.start_time = start_time;
        this.end_time = end_time;
        this.participations = participations;
        this.location = location;
        this.setting = setting;
        this.other_context = other_context;
    }
}

export abstract class CONTENT_ITEM extends LOCATABLE {
}

export class SECTION extends CONTENT_ITEM {
    items: CONTENT_ITEM[];
    constructor(items: CONTENT_ITEM[]) {
        super();
        this.items = items;
    }
}

export abstract class ENTRY extends CONTENT_ITEM {
    language: CODE_PHRASE;
    encoding: CODE_PHRASE;
    subject: PARTY_PROXY;
    provider?: PARTY_PROXY;
    other_participations?: PARTICIPATION[];
    workflow_id?: OBJECT_REF;
    constructor(
        language: CODE_PHRASE,
        encoding: CODE_PHRASE,
        subject: PARTY_PROXY,
        provider?: PARTY_PROXY,
        other_participations?: PARTICIPATION[],
        workflow_id?: OBJECT_REF
    ) {
        super();
        this.language = language;
        this.encoding = encoding;
        this.subject = subject;
        this.provider = provider;
        this.other_participations = other_participations;
        this.workflow_id = workflow_id;
    }
}

export class ADMIN_ENTRY extends ENTRY {
    data: ITEM_STRUCTURE;
    constructor(
        language: CODE_PHRASE,
        encoding: CODE_PHRASE,
        subject: PARTY_PROXY,
        data: ITEM_STRUCTURE,
        provider?: PARTY_PROXY,
        other_participations?: PARTICIPATION[],
        workflow_id?: OBJECT_REF
    ) {
        super(language, encoding, subject, provider, other_participations, workflow_id);
        this.data = data;
    }
}

export abstract class CARE_ENTRY extends ENTRY {
    protocol?: ITEM_STRUCTURE;
    guideline_id?: OBJECT_REF;
    constructor(
        language: CODE_PHRASE,
        encoding: CODE_PHRASE,
        subject: PARTY_PROXY,
        protocol?: ITEM_STRUCTURE,
        guideline_id?: OBJECT_REF,
        provider?: PARTY_PROXY,
        other_participations?: PARTICIPATION[],
        workflow_id?: OBJECT_REF
    ) {
        super(language, encoding, subject, provider, other_participations, workflow_id);
        this.protocol = protocol;
        this.guideline_id = guideline_id;
    }
}

export class OBSERVATION extends CARE_ENTRY {
    data: HISTORY<ITEM_STRUCTURE>;
    state?: HISTORY<ITEM_STRUCTURE>;
    constructor(
        language: CODE_PHRASE,
        encoding: CODE_PHRASE,
        subject: PARTY_PROXY,
        data: HISTORY<ITEM_STRUCTURE>,
        state?: HISTORY<ITEM_STRUCTURE>,
        protocol?: ITEM_STRUCTURE,
        guideline_id?: OBJECT_REF,
        provider?: PARTY_PROXY,
        other_participations?: PARTICIPATION[],
        workflow_id?: OBJECT_REF
    ) {
        super(language, encoding, subject, protocol, guideline_id, provider, other_participations, workflow_id);
        this.data = data;
        this.state = state;
    }
}

export class EVALUATION extends CARE_ENTRY {
    data: ITEM_STRUCTURE;
    constructor(
        language: CODE_PHRASE,
        encoding: CODE_PHRASE,
        subject: PARTY_PROXY,
        data: ITEM_STRUCTURE,
        protocol?: ITEM_STRUCTURE,
        guideline_id?: OBJECT_REF,
        provider?: PARTY_PROXY,
        other_participations?: PARTICIPATION[],
        workflow_id?: OBJECT_REF
    ) {
        super(language, encoding, subject, protocol, guideline_id, provider, other_participations, workflow_id);
        this.data = data;
    }
}

export class INSTRUCTION extends CARE_ENTRY {
    narrative: DV_TEXT;
    expiry_time?: DV_DATE_TIME;
    wf_definition?: DV_PARSABLE;
    activities: ACTIVITY[];
    constructor(
        language: CODE_PHRASE,
        encoding: CODE_PHRASE,
        subject: PARTY_PROXY,
        narrative: DV_TEXT,
        activities: ACTIVITY[],
        expiry_time?: DV_DATE_TIME,
        wf_definition?: DV_PARSABLE,
        protocol?: ITEM_STRUCTURE,
        guideline_id?: OBJECT_REF,
        provider?: PARTY_PROXY,
        other_participations?: PARTICIPATION[],
        workflow_id?: OBJECT_REF
    ) {
        super(language, encoding, subject, protocol, guideline_id, provider, other_participations, workflow_id);
        this.narrative = narrative;
        this.expiry_time = expiry_time;
        this.wf_definition = wf_definition;
        this.activities = activities;
    }
}

export class ACTIVITY extends LOCATABLE {
    description: ITEM_STRUCTURE;
    timing?: DV_PARSABLE;
    action_archetype_id: String;
    constructor(description: ITEM_STRUCTURE, action_archetype_id: String, timing?: DV_PARSABLE) {
        super();
        this.description = description;
        this.timing = timing;
        this.action_archetype_id = action_archetype_id;
    }
}

export class ACTION extends CARE_ENTRY {
    time: DV_DATE_TIME;
    description: ITEM_STRUCTURE;
    ism_transition: ISM_TRANSITION;
    instruction_details?: INSTRUCTION_DETAILS;
    constructor(
        language: CODE_PHRASE,
        encoding: CODE_PHRASE,
        subject: PARTY_PROXY,
        time: DV_DATE_TIME,
        description: ITEM_STRUCTURE,
        ism_transition: ISM_TRANSITION,
        instruction_details?: INSTRUCTION_DETAILS,
        protocol?: ITEM_STRUCTURE,
        guideline_id?: OBJECT_REF,
        provider?: PARTY_PROXY,
        other_participations?: PARTICIPATION[],
        workflow_id?: OBJECT_REF
    ) {
        super(language, encoding, subject, protocol, guideline_id, provider, other_participations, workflow_id);
        this.time = time;
        this.description = description;
        this.ism_transition = ism_transition;
        this.instruction_details = instruction_details;
    }
}

export class INSTRUCTION_DETAILS extends PATHABLE {
    instruction_id: LOCATABLE_REF;
    wf_details?: ITEM_STRUCTURE;
    activity_id: String;
    constructor(instruction_id: LOCATABLE_REF, activity_id: String, wf_details?: ITEM_STRUCTURE) {
        super();
        this.instruction_id = instruction_id;
        this.wf_details = wf_details;
        this.activity_id = activity_id;
    }
}

export class ISM_TRANSITION extends PATHABLE {
    current_state: DV_CODED_TEXT;
    transition?: DV_CODED_TEXT;
    careflow_step?: DV_CODED_TEXT;
    reason?: DV_TEXT[];
    constructor(
        current_state: DV_CODED_TEXT,
        transition?: DV_CODED_TEXT,
        careflow_step?: DV_CODED_TEXT,
        reason?: DV_TEXT[]
    ) {
        super();
        this.current_state = current_state;
        this.transition = transition;
        this.careflow_step = careflow_step;
        this.reason = reason;
    }
}

export class GENERIC_ENTRY extends CONTENT_ITEM {
    data: ITEM_TREE;
    constructor(data: ITEM_TREE) {
        super();
        this.data = data;
    }
}

//
// rm.data_structures
//

export abstract class DATA_STRUCTURE extends LOCATABLE {
}

export class ITEM_SINGLE extends ITEM_STRUCTURE {
    item: ELEMENT;
    constructor(item: ELEMENT) {
        super();
        this.item = item;
    }
}

export class ITEM_LIST extends ITEM_STRUCTURE {
    items?: ELEMENT[];
    constructor(items?: ELEMENT[]) {
        super();
        this.items = items;
    }
}

export class ITEM_TABLE extends ITEM_STRUCTURE {
    rows?: CLUSTER[];
    constructor(rows?: CLUSTER[]) {
        super();
        this.rows = rows;
    }
}

export class ITEM_TREE extends ITEM_STRUCTURE {
    items?: ITEM[];
    constructor(items?: ITEM[]) {
        super();
        this.items = items;
    }
}

export abstract class ITEM extends LOCATABLE {
}

export class CLUSTER extends ITEM {
    items: ITEM[];
    constructor(items: ITEM[]) {
        super();
        this.items = items;
    }
}

export class ELEMENT extends ITEM {
    null_flavour?: DV_CODED_TEXT;
    value?: DATA_VALUE;
    null_reason?: DV_TEXT;
    constructor(null_flavour?: DV_CODED_TEXT, value?: DATA_VALUE, null_reason?: DV_TEXT) {
        super();
        this.null_flavour = null_flavour;
        this.value = value;
        this.null_reason = null_reason;
    }
}

export class HISTORY<T extends ITEM_STRUCTURE> extends DATA_STRUCTURE {
    origin: DV_DATE_TIME;
    period?: DV_DURATION;
    duration?: DV_DURATION;
    summary?: ITEM_STRUCTURE;
    events: EVENT<T>[];
    constructor(origin: DV_DATE_TIME, events: EVENT<T>[], period?: DV_DURATION, duration?: DV_DURATION, summary?: ITEM_STRUCTURE) {
        super();
        this.origin = origin;
        this.period = period;
        this.duration = duration;
        this.summary = summary;
        this.events = events;
    }
}

export abstract class EVENT<T extends ITEM_STRUCTURE> extends LOCATABLE {
    time: DV_DATE_TIME;
    state?: ITEM_STRUCTURE;
    data: T;
    offset?: DV_DURATION;
    constructor(time: DV_DATE_TIME, data: T, state?: ITEM_STRUCTURE, offset?: DV_DURATION) {
        super();
        this.time = time;
        this.state = state;
        this.data = data;
        this.offset = offset;
    }
}

export class POINT_EVENT<T extends ITEM_STRUCTURE> extends EVENT<T> {
}

export class INTERVAL_EVENT<T extends ITEM_STRUCTURE> extends EVENT<T> {
    width: DV_DURATION;
    sample_count?: Integer;
    math_function: DV_CODED_TEXT;
    constructor(
        time: DV_DATE_TIME,
        data: T,
        width: DV_DURATION,
        math_function: DV_CODED_TEXT,
        state?: ITEM_STRUCTURE,
        offset?: DV_DURATION,
        sample_count?: Integer
    ) {
        super(time, data, state, offset);
        this.width = width;
        this.sample_count = sample_count;
        this.math_function = math_function;
    }
}

//
// rm.common
//

export class REVISION_HISTORY extends Any {
    items: REVISION_HISTORY_ITEM[];
    constructor(items: REVISION_HISTORY_ITEM[]) {
        super();
        this.items = items;
    }
}

export class REVISION_HISTORY_ITEM extends Any {
    version_id: OBJECT_VERSION_ID;
    audits: AUDIT_DETAILS[];
    constructor(version_id: OBJECT_VERSION_ID, audits: AUDIT_DETAILS[]) {
        super();
        this.version_id = version_id;
        this.audits = audits;
    }
}

export class ATTESTATION extends AUDIT_DETAILS {
    attested_view?: DV_MULTIMEDIA;
    proof?: String;
    items?: DV_EHR_URI[];
    reason: DV_TEXT;
    is_pending: Boolean;
    constructor(
        system_id: String,
        time_committed: DV_DATE_TIME,
        change_type: DV_CODED_TEXT,
        committer: PARTY_PROXY,
        reason: DV_TEXT,
        is_pending: Boolean,
        description?: DV_TEXT,
        attested_view?: DV_MULTIMEDIA,
        proof?: String,
        items?: DV_EHR_URI[]
    ) {
        super(system_id, time_committed, change_type, committer, description);
        this.attested_view = attested_view;
        this.proof = proof;
        this.items = items;
        this.reason = reason;
        this.is_pending = is_pending;
    }
}

export class PARTICIPATION extends Any {
    function: DV_TEXT;
    time?: DV_INTERVAL<DV_DATE_TIME>;
    mode?: DV_CODED_TEXT;
    performer: PARTY_PROXY;
    constructor(function: DV_TEXT, performer: PARTY_PROXY, time?: DV_INTERVAL<DV_DATE_TIME>, mode?: DV_CODED_TEXT) {
        super();
        this.function = function;
        this.time = time;
        this.mode = mode;
        this.performer = performer;
    }
}

export class PARTY_IDENTIFIED extends PARTY_PROXY {
    name?: String;
    identifiers: DV_IDENTIFIER[];
    constructor(identifiers: DV_IDENTIFIER[], external_ref?: PARTY_REF, name?: String) {
        super(external_ref);
        this.name = name;
        this.identifiers = identifiers;
    }
}

export class PARTY_RELATED extends PARTY_IDENTIFIED {
    relationship: DV_CODED_TEXT;
    constructor(
        identifiers: DV_IDENTIFIER[],
        relationship: DV_CODED_TEXT,
        external_ref?: PARTY_REF,
        name?: String
    ) {
        super(identifiers, external_ref, name);
        this.relationship = relationship;
    }
}

export abstract class PATHABLE extends Any {
}

export class LINK extends Any {
    meaning: DV_TEXT;
    type: DV_TEXT;
    target: DV_EHR_URI;
    constructor(meaning: DV_TEXT, type: DV_TEXT, target: DV_EHR_URI) {
        super();
        this.meaning = meaning;
        this.type = type;
        this.target = target;
    }
}

export class ARCHETYPED extends Any {
    archetype_id: ARCHETYPE_ID;
    template_id?: TEMPLATE_ID;
    rm_version: String;
    constructor(archetype_id: ARCHETYPE_ID, rm_version: String, template_id?: TEMPLATE_ID) {
        super();
        this.archetype_id = archetype_id;
        this.template_id = template_id;
        this.rm_version = rm_version;
    }
}

export class FEEDER_AUDIT extends Any {
    originating_system_item_ids?: DV_IDENTIFIER[];
    feeder_system_item_ids?: DV_IDENTIFIER[];
    original_content?: DV_ENCAPSULATED;
    originating_system_audit: FEEDER_AUDIT_DETAILS;
    feeder_system_audit?: FEEDER_AUDIT_DETAILS;
    constructor(
        originating_system_audit: FEEDER_AUDIT_DETAILS,
        originating_system_item_ids?: DV_IDENTIFIER[],
        feeder_system_item_ids?: DV_IDENTIFIER[],
        original_content?: DV_ENCAPSULATED,
        feeder_system_audit?: FEEDER_AUDIT_DETAILS
    ) {
        super();
        this.originating_system_item_ids = originating_system_item_ids;
        this.feeder_system_item_ids = feeder_system_item_ids;
        this.original_content = original_content;
        this.originating_system_audit = originating_system_audit;
        this.feeder_system_audit = feeder_system_audit;
    }
}

export class FEEDER_AUDIT_DETAILS extends Any {
    system_id: String;
    location?: PARTY_IDENTIFIED;
    provider?: PARTY_IDENTIFIED;
    subject?: PARTY_PROXY;
    time?: DV_DATE_TIME;
    version_id?: String;
    other_details?: ITEM_STRUCTURE;
    constructor(
        system_id: String,
        location?: PARTY_IDENTIFIED,
        provider?: PARTY_IDENTIFIED,
        subject?: PARTY_PROXY,
        time?: DV_DATE_TIME,
        version_id?: String,
        other_details?: ITEM_STRUCTURE
    ) {
        super();
        this.system_id = system_id;
        this.location = location;
        this.provider = provider;
        this.subject = subject;
        this.time = time;
        this.version_id = version_id;
        this.other_details = other_details;
    }
}

export class FOLDER extends LOCATABLE {
    folders?: FOLDER[];
    items?: OBJECT_REF[];
    details?: ITEM_STRUCTURE;
    constructor(
        archetype_node_id: String,
        name: DV_TEXT,
        uid?: UID_BASED_ID,
        archetype_details?: ARCHETYPED,
        feeder_audit?: FEEDER_AUDIT,
        links?: LINK[],
        folders?: FOLDER[],
        items?: OBJECT_REF[],
        details?: ITEM_STRUCTURE
    ) {
        super(archetype_node_id, name, uid, archetype_details, feeder_audit, links);
        this.folders = folders;
        this.items = items;
        this.details = details;
    }
}

export class CONTRIBUTION extends Any {
    uid: HIER_OBJECT_ID;
    audit: AUDIT_DETAILS;
    versions: OBJECT_REF[];
    constructor(uid: HIER_OBJECT_ID, audit: AUDIT_DETAILS, versions: OBJECT_REF[]) {
        super();
        this.uid = uid;
        this.audit = audit;
        this.versions = versions;
    }
}

export class VERSIONED_OBJECT<T> extends Any {
    uid: HIER_OBJECT_ID;
    owner_id: OBJECT_REF;
    time_created: DV_DATE_TIME;
    constructor(uid: HIER_OBJECT_ID, owner_id: OBJECT_REF, time_created: DV_DATE_TIME) {
        super();
        this.uid = uid;
        this.owner_id = owner_id;
        this.time_created = time_created;
    }
}

export class ORIGINAL_VERSION<T> extends VERSION<T> {
    uid: OBJECT_VERSION_ID;
    preceding_version_uid?: OBJECT_VERSION_ID;
    other_input_version_uids?: OBJECT_VERSION_ID[];
    attestations?: ATTESTATION[];
    lifecycle_state: DV_CODED_TEXT;
    data?: T;
    constructor(
        contribution: OBJECT_REF,
        commit_audit: AUDIT_DETAILS,
        uid: OBJECT_VERSION_ID,
        lifecycle_state: DV_CODED_TEXT,
        signature?: String,
        preceding_version_uid?: OBJECT_VERSION_ID,
        other_input_version_uids?: OBJECT_VERSION_ID[],
        attestations?: ATTESTATION[],
        data?: T
    ) {
        super(contribution, commit_audit, signature);
        this.uid = uid;
        this.preceding_version_uid = preceding_version_uid;
        this.other_input_version_uids = other_input_version_uids;
        this.attestations = attestations;
        this.lifecycle_state = lifecycle_state;
        this.data = data;
    }
}

export class IMPORTED_VERSION<T> extends VERSION<T> {
    item: ORIGINAL_VERSION<T>;
    constructor(contribution: OBJECT_REF, commit_audit: AUDIT_DETAILS, item: ORIGINAL_VERSION<T>, signature?: String) {
        super(contribution, commit_audit, signature);
        this.item = item;
    }
}

export class DV_BOOLEAN extends DATA_VALUE {
    value: Boolean;
    constructor(value: Boolean) {
        super();
        this.value = value;
    }
}

export class DV_STATE extends DATA_VALUE {
    value: DV_CODED_TEXT;
    is_terminal: Boolean;
    constructor(value: DV_CODED_TEXT, is_terminal: Boolean) {
        super();
        this.value = value;
        this.is_terminal = is_terminal;
    }
}

export class TERM_MAPPING {
    match: Character;
    purpose?: DV_CODED_TEXT;
    target: CODE_PHRASE;
    constructor(match: Character, target: CODE_PHRASE, purpose?: DV_CODED_TEXT) {
        this.match = match;
        this.purpose = purpose;
        this.target = target;
    }
}

export class DV_PARAGRAPH extends DATA_VALUE {
    items: DV_TEXT[];
    constructor(items: DV_TEXT[]) {
        super();
        this.items = items;
    }
}

export class DV_INTERVAL<T extends DV_ORDERED> extends DATA_VALUE {
    lower?: T;
    upper?: T;
    lower_unbounded: Boolean;
    upper_unbounded: Boolean;
    lower_included: Boolean;
    upper_included: Boolean;
    constructor(
        lower_unbounded: Boolean,
        upper_unbounded: Boolean,
        lower_included: Boolean,
        upper_included: Boolean,
        lower?: T,
        upper?: T
    ) {
        super();
        this.lower = lower;
        this.upper = upper;
        this.lower_unbounded = lower_unbounded;
        this.upper_unbounded = upper_unbounded;
        this.lower_included = lower_included;
        this.upper_included = upper_included;
    }
}

export class REFERENCE_RANGE<T extends DV_ORDERED> extends Any {
    range: DV_INTERVAL<T>;
    meaning: DV_TEXT;
    constructor(range: DV_INTERVAL<T>, meaning: DV_TEXT) {
        super();
        this.range = range;
        this.meaning = meaning;
    }
}

export abstract class DV_ORDERED extends DATA_VALUE {
    normal_status?: CODE_PHRASE;
    normal_range?: DV_INTERVAL<DV_ORDERED>;
    other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[];
    constructor(
        normal_status?: CODE_PHRASE,
        normal_range?: DV_INTERVAL<DV_ORDERED>,
        other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[]
    ) {
        super();
        this.normal_status = normal_status;
        this.normal_range = normal_range;
        this.other_reference_ranges = other_reference_ranges;
    }
}

export abstract class DV_QUANTIFIED<T extends Ordered> extends DV_ORDERED {
    magnitude_status?: String;
    accuracy?: T;
    constructor(
        normal_status?: CODE_PHRASE,
        normal_range?: DV_INTERVAL<DV_ORDERED>,
        other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[],
        magnitude_status?: String,
        accuracy?: T
    ) {
        super(normal_status, normal_range, other_reference_ranges);
        this.magnitude_status = magnitude_status;
        this.accuracy = accuracy;
    }
}

export class DV_ORDINAL extends DV_ORDERED {
    value: Integer;
    symbol: DV_CODED_TEXT;
    constructor(
        value: Integer,
        symbol: DV_CODED_TEXT,
        normal_status?: CODE_PHRASE,
        normal_range?: DV_INTERVAL<DV_ORDERED>,
        other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[]
    ) {
        super(normal_status, normal_range, other_reference_ranges);
        this.value = value;
        this.symbol = symbol;
    }
}

export class DV_SCALE extends DV_ORDERED {
    value: Real;
    symbol: DV_CODED_TEXT;
    constructor(
        value: Real,
        symbol: DV_CODED_TEXT,
        normal_status?: CODE_PHRASE,
        normal_range?: DV_INTERVAL<DV_ORDERED>,
        other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[]
    ) {
        super(normal_status, normal_range, other_reference_ranges);
        this.value = value;
        this.symbol = symbol;
    }
}

export abstract class DV_AMOUNT extends DV_QUANTIFIED<Real> {
    accuracy_is_percent?: Boolean;
    constructor(
        normal_status?: CODE_PHRASE,
        normal_range?: DV_INTERVAL<DV_ORDERED>,
        other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[],
        magnitude_status?: String,
        accuracy?: Real,
        accuracy_is_percent?: Boolean
    ) {
        super(normal_status, normal_range, other_reference_ranges, magnitude_status, accuracy);
        this.accuracy_is_percent = accuracy_is_percent;
    }
}

export abstract class DV_ABSOLUTE_QUANTITY<T extends DV_AMOUNT> extends DV_QUANTIFIED<T> {
}

export class DV_QUANTITY extends DV_AMOUNT {
    magnitude: Real;
    property?: CODE_PHRASE;
    units: String;
    units_system?: String;
    units_display_name?: String;
    precision?: Integer;
    normal_range?: DV_INTERVAL<DV_QUANTITY>;
    other_reference_ranges?: REFERENCE_RANGE<DV_QUANTITY>[];
    constructor(
        magnitude: Real,
        units: String,
        normal_status?: CODE_PHRASE,
        other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[],
        magnitude_status?: String,
        accuracy?: Real,
        accuracy_is_percent?: Boolean,
        property?: CODE_PHRASE,
        units_system?: String,
        units_display_name?: String,
        precision?: Integer,
        normal_range?: DV_INTERVAL<DV_QUANTITY>
    ) {
        super(normal_status, normal_range, other_reference_ranges, magnitude_status, accuracy, accuracy_is_percent);
        this.magnitude = magnitude;
        this.property = property;
        this.units = units;
        this.units_system = units_system;
        this.units_display_name = units_display_name;
        this.precision = precision;
        this.normal_range = normal_range;
        this.other_reference_ranges = other_reference_ranges;
    }
}

export class DV_COUNT extends DV_AMOUNT {
    magnitude: Integer64;
    normal_range?: DV_INTERVAL<DV_COUNT>;
    other_reference_ranges?: REFERENCE_RANGE<DV_COUNT>[];
    constructor(
        magnitude: Integer64,
        normal_status?: CODE_PHRASE,
        other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[],
        magnitude_status?: String,
        accuracy?: Real,
        accuracy_is_percent?: Boolean,
        normal_range?: DV_INTERVAL<DV_COUNT>
    ) {
        super(normal_status, normal_range, other_reference_ranges, magnitude_status, accuracy, accuracy_is_percent);
        this.magnitude = magnitude;
        this.normal_range = normal_range;
        this.other_reference_ranges = other_reference_ranges;
    }
}

export class DV_PROPORTION extends DV_AMOUNT {
    numerator: Real;
    denominator: Real;
    type: PROPORTION_KIND;
    precision?: Integer;
    is_integral?: Boolean;
    normal_range?: DV_INTERVAL<DV_PROPORTION>;
    other_reference_ranges?: REFERENCE_RANGE<DV_PROPORTION>[];
    constructor(
        numerator: Real,
        denominator: Real,
        type: PROPORTION_KIND,
        normal_status?: CODE_PHRASE,
        other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[],
        magnitude_status?: String,
        accuracy?: Real,
        accuracy_is_percent?: Boolean,
        precision?: Integer,
        is_integral?: Boolean,
        normal_range?: DV_INTERVAL<DV_PROPORTION>
    ) {
        super(normal_status, normal_range, other_reference_ranges, magnitude_status, accuracy, accuracy_is_percent);
        this.numerator = numerator;
        this.denominator = denominator;
        this.type = type;
        this.precision = precision;
        this.is_integral = is_integral;
        this.normal_range = normal_range;
        this.other_reference_ranges = other_reference_ranges;
    }
}

export enum PROPORTION_KIND {
    PK_RATIO,
    PK_UNITARY,
    PK_PERCENT,
    PK_FRACTION,
    PK_INTEGER_FRACTION,
}

export abstract class DV_TEMPORAL extends DV_ABSOLUTE_QUANTITY<DV_DURATION> {
}

export class DV_DATE extends DV_TEMPORAL {
    value: String;
    constructor(
        value: String,
        normal_status?: CODE_PHRASE,
        normal_range?: DV_INTERVAL<DV_ORDERED>,
        other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[],
        magnitude_status?: String,
        accuracy?: DV_DURATION
    ) {
        super(normal_status, normal_range, other_reference_ranges, magnitude_status, accuracy);
        this.value = value;
    }
}

export class DV_TIME extends DV_TEMPORAL {
    value: String;
    constructor(
        value: String,
        normal_status?: CODE_PHRASE,
        normal_range?: DV_INTERVAL<DV_ORDERED>,
        other_reference_ranges?: REFERENCE_RANGE<DV_ORDERED>[],
        magnitude_status?: String,
        accuracy?: DV_DURATION
    ) {
        super(normal_status, normal_range, other_reference_ranges, magnitude_status, accuracy);
        this.value = value;
    }
}

export abstract class DV_ENCAPSULATED extends DATA_VALUE {
    charset?: CODE_PHRASE;
    language?: CODE_PHRASE;
    constructor(charset?: CODE_PHRASE, language?: CODE_PHRASE) {
        super();
        this.charset = charset;
        this.language = language;
    }
}

export abstract class DV_TIME_SPECIFICATION extends DATA_VALUE {
    value: DV_PARSABLE;
    constructor(value: DV_PARSABLE) {
        super();
        this.value = value;
    }
}

export class DV_PERIODIC_TIME_SPECIFICATION extends DV_TIME_SPECIFICATION {
}

export class DV_GENERAL_TIME_SPECIFICATION extends DV_TIME_SPECIFICATION {
}

//
// rm.demographic
//

export abstract class PARTY extends LOCATABLE {
    uid: UID_BASED_ID;
    details?: ITEM_STRUCTURE;
    identities: PARTY_IDENTITY[];
    contacts?: CONTACT[];
    relationships?: PARTY_RELATIONSHIP[];
    reverse_relationships?: LOCATABLE_REF[];
    type?: DV_TEXT;
    constructor(
        archetype_node_id: String,
        name: DV_TEXT,
        uid: UID_BASED_ID,
        identities: PARTY_IDENTITY[],
        details?: ITEM_STRUCTURE,
        contacts?: CONTACT[],
        relationships?: PARTY_RELATIONSHIP[],
        reverse_relationships?: LOCATABLE_REF[],
        type?: DV_TEXT
    ) {
        super(archetype_node_id, name, uid);
        this.uid = uid;
        this.details = details;
        this.identities = identities;
        this.contacts = contacts;
        this.relationships = relationships;
        this.reverse_relationships = reverse_relationships;
        this.type = type;
    }
}

export class PARTY_IDENTITY extends LOCATABLE {
    details: ITEM_STRUCTURE;
    purpose?: DV_TEXT;
    constructor(
        archetype_node_id: String,
        name: DV_TEXT,
        details: ITEM_STRUCTURE,
        uid?: UID_BASED_ID,
        purpose?: DV_TEXT
    ) {
        super(archetype_node_id, name, uid);
        this.details = details;
        this.purpose = purpose;
    }
}

export class CONTACT extends LOCATABLE {
    time_validity?: DV_INTERVAL<DV_DATE>;
    addresses?: ADDRESS[];
    purpose?: DV_TEXT;
    constructor(
        archetype_node_id: String,
        name: DV_TEXT,
        uid?: UID_BASED_ID,
        time_validity?: DV_INTERVAL<DV_DATE>,
        addresses?: ADDRESS[],
        purpose?: DV_TEXT
    ) {
        super(archetype_node_id, name, uid);
        this.time_validity = time_validity;
        this.addresses = addresses;
        this.purpose = purpose;
    }
}

export class ADDRESS extends LOCATABLE {
    details: ITEM_STRUCTURE;
    type?: DV_TEXT;
    constructor(
        archetype_node_id: String,
        name: DV_TEXT,
        details: ITEM_STRUCTURE,
        uid?: UID_BASED_ID,
        type?: DV_TEXT
    ) {
        super(archetype_node_id, name, uid);
        this.details = details;
        this.type = type;
    }
}

export abstract class ACTOR extends PARTY {
    roles?: PARTY_REF[];
    languages?: DV_TEXT[];
    constructor(
        archetype_node_id: String,
        name: DV_TEXT,
        uid: UID_BASED_ID,
        identities: PARTY_IDENTITY[],
        details?: ITEM_STRUCTURE,
        contacts?: CONTACT[],
        relationships?: PARTY_RELATIONSHIP[],
        reverse_relationships?: LOCATABLE_REF[],
        type?: DV_TEXT,
        roles?: PARTY_REF[],
        languages?: DV_TEXT[]
    ) {
        super(
            archetype_node_id,
            name,
            uid,
            identities,
            details,
            contacts,
            relationships,
            reverse_relationships,
            type
        );
        this.roles = roles;
        this.languages = languages;
    }
}

export class PERSON extends ACTOR {
}

export class ORGANISATION extends ACTOR {
}

export class GROUP extends ACTOR {
}

export class AGENT extends ACTOR {
}

export class ROLE extends PARTY {
    performer: PARTY_REF;
    capabilities?: CAPABILITY[];
    time_validity?: DV_INTERVAL<DV_DATE>;
    constructor(
        archetype_node_id: String,
        name: DV_TEXT,
        uid: UID_BASED_ID,
        identities: PARTY_IDENTITY[],
        performer: PARTY_REF,
        details?: ITEM_STRUCTURE,
        contacts?: CONTACT[],
        relationships?: PARTY_RELATIONSHIP[],
        reverse_relationships?: LOCATABLE_REF[],
        type?: DV_TEXT,
        capabilities?: CAPABILITY[],
        time_validity?: DV_INTERVAL<DV_DATE>
    ) {
        super(
            archetype_node_id,
            name,
            uid,
            identities,
            details,
            contacts,
            relationships,
            reverse_relationships,
            type
        );
        this.performer = performer;
        this.capabilities = capabilities;
        this.time_validity = time_validity;
    }
}

export class CAPABILITY extends LOCATABLE {
    credentials: ITEM_STRUCTURE;
    time_validity?: DV_INTERVAL<DV_DATE>;
    constructor(
        archetype_node_id: String,
        name: DV_TEXT,
        credentials: ITEM_STRUCTURE,
        uid?: UID_BASED_ID,
        time_validity?: DV_INTERVAL<DV_DATE>
    ) {
        super(archetype_node_id, name, uid);
        this.credentials = credentials;
        this.time_validity = time_validity;
    }
}

export class PARTY_RELATIONSHIP extends LOCATABLE {
    source: PARTY_REF;
    target: PARTY_REF;
    details?: ITEM_STRUCTURE;
    time_validity?: DV_INTERVAL<DV_DATE>;
    constructor(
        archetype_node_id: String,
        name: DV_TEXT,
        source: PARTY_REF,
        target: PARTY_REF,
        uid?: UID_BASED_ID,
        details?: ITEM_STRUCTURE,
        time_validity?: DV_INTERVAL<DV_DATE>
    ) {
        super(archetype_node_id, name, uid);
        this.source = source;
        this.target = target;
        this.details = details;
        this.time_validity = time_validity;
    }
}

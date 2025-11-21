// Enhanced implementation based on BMM schema: rm v1.2.0
// BMM Version: 2.4
// Schema Revision: 1.2.0.2
// Description: openEHR Reference Model
// Source: https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_rm_1.2.0.bmm.json
// Last synced with BMM: 2025-11-14
//
// ✅ ENHANCED IMPLEMENTATION
// This file contains fully implemented methods and additional functionality beyond the BMM specification.
// It is safe to edit this file - your changes will not be overwritten by the generator.
//
// The generator outputs to /generated directory. To update this file for a new BMM version:
// 1. Run generator to update /generated/openehr_rm.ts
// 2. Compare changes using: deno run --allow-read tasks/compare_bmm_versions.ts
// 3. Manually merge relevant changes into this file
//
// For more information about openEHR specifications, visit: https://specifications.openehr.org/

import * as openehr_base from "./openehr_base.ts";

// Unknown types - defined as 'any' for now
type T = any;

/**
 * The \`PATHABLE\` class defines the pathing capabilities used by nearly all classes in the openEHR reference model, mostly via inheritance of \`LOCATABLE\`. The defining characteristics of \`PATHABLE\` objects are that they can locate child objects using paths, and they know their parent object in a compositional hierarchy. The parent feature is defined as abstract in the model, and may be implemented in any way convenient.
 */
export abstract class PATHABLE extends openehr_base.Any {
  /**
   * Parent of this node in a compositional hierarchy.
   *
   * @returns Result value
   */
  parent(): PATHABLE {
    // TODO: Implement parent behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method parent not yet implemented.");
  }

  /**
   * The item at a path (relative to this item); only valid for unique paths, i.e. paths that resolve to a single item.
   * @param a_path - Parameter
   * @returns Result value
   */
  item_at_path(a_path: openehr_base.String): openehr_base.Any {
    // TODO: Implement item_at_path behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method item_at_path not yet implemented.");
  }

  /**
   * List of items corresponding to a non-unique path.
   * @param a_path - Parameter
   * @returns Result value
   */
  items_at_path(a_path: openehr_base.String): openehr_base.Any {
    // TODO: Implement items_at_path behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method items_at_path not yet implemented.");
  }

  /**
   * True if the path exists in the data with respect to the current item.
   * @param a_path - Parameter
   * @returns Result value
   */
  path_exists(a_path: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement path_exists behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method path_exists not yet implemented.");
  }

  /**
   * True if the path corresponds to a single item in the data.
   * @param a_path - Parameter
   * @returns Result value
   */
  path_unique(a_path: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement path_unique behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method path_unique not yet implemented.");
  }

  /**
   * The path to an item relative to the root of this archetyped structure.
   * @param a_loc - Parameter
   * @returns Result value
   */
  path_of_item(a_loc: PATHABLE): openehr_base.String {
    // TODO: Implement path_of_item behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method path_of_item not yet implemented.");
  }

  /**
   * Default value equality comparison for PATHABLE subclasses.
   * Compares constructor names as a basic implementation.
   * Subclasses should override this for more specific comparisons.
   * @param other - The other object to compare with
   * @returns Boolean wrapper indicating equality
   */
  is_equal(other: any): openehr_base.Boolean {
    if (!(other instanceof PATHABLE)) {
      return openehr_base.Boolean.from(false);
    }
    // Basic implementation: compare constructor names
    // Subclasses should override for property-level comparison
    return openehr_base.Boolean.from(this.constructor.name === other.constructor.name);
  }
}

/**
 * The \`LINK\` type defines a logical relationship between two items, such as two \`ENTRYs\` or an \`ENTRY\` and a \`COMPOSITION\`. Links can be used across compositions, and across EHRs. Links can potentially be used between interior (i.e. non archetype root) nodes, although this probably should be prevented in archetypes. Multiple \`LINKs\` can be attached to the root object of any archetyped structure to give the effect of a 1->N link.
 *
 * 1:1 and 1:N relationships between archetyped content elements (e.g. \`ENTRYs\`) can be expressed by using one, or more than one, respectively, \`LINKs\`. Chains of links can be used to see  problem threads  or other logical groupings of items.
 *
 * Links should be between archetyped structures only, i.e. between objects representing complete domain concepts because relationships between sub-elements of whole concepts are not necessarily meaningful, and may be downright confusing. Sensible links only exist between whole \`ENTRYs\`, \`SECTIONs\`, \`COMPOSITIONs\` and so on.
 */
export class LINK {
  /**
   * Used to describe the relationship, usually in clinical terms, such as  in response to  (the relationship between test results and an order),  follow-up to  and so on. Such relationships can represent any clinically meaningful connection between pieces of information. Values for meaning include those described in Annex C, ENV 13606 pt 2 under the categories of  generic ,  documenting and reporting ,  organisational ,  clinical ,  circumstancial , and  view management .
   */
  meaning?: DV_TEXT;
  /**
   * The type attribute is used to indicate a clinical or domain-level meaning for the kind of link, for example  problem  or  issue . If type values are designed appropriately, they can be used by the requestor of EHR extracts to categorise links which must be followed and which can be broken when the extract is created.
   */
  type?: DV_TEXT;
  /**
   * The logical  to  object in the link relation, as per the linguistic sense of the meaning attribute.
   */
  target?: DV_EHR_URI;
}

/**
 * Root class of all information model classes that can be archetyped. Most classes in the openEHR reference model inherit from the \`LOCATABLE\` class, which defines the idea of  locatability in an archetyped structure. \`LOCATABLE\` defines a runtime name and an \`_archetype_node_id_\`.
 */
export abstract class LOCATABLE extends PATHABLE {
  /**
   * Runtime name of this fragment, used to build runtime paths. This is the term provided via a clinical application or batch process to name this EHR construct: its retention in the EHR faithfully preserves the original label by which this entry was known to end users.
   */
  name?: DV_TEXT;
  /**
   * Internal storage for archetype_node_id
   * @protected
   */
  protected _archetype_node_id?: openehr_base.String;

  /**
   * Design-time archetype identifier of this node taken from its generating archetype; used to build archetype paths. Always in the form of an at-code, e.g.  \`at0005\`. This value enables a 'standardised' name for this node to be generated, by referring to the generating archetype local terminology.
   *
   * At an archetype root point, the value of this attribute is always the stringified form of the \`_archetype_id_\` found in the \`_archetype_details_\` object.
   */
  get archetype_node_id(): string | undefined {
    return this._archetype_node_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for archetype_node_id.
   * Use this to access openehr_base.String methods.
   */
  get $archetype_node_id(): openehr_base.String | undefined {
    return this._archetype_node_id;
  }

  /**
   * Sets archetype_node_id from either a primitive value or openehr_base.String wrapper.
   */
  set archetype_node_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._archetype_node_id = undefined;
    } else if (typeof val === "string") {
      this._archetype_node_id = openehr_base.String.from(val);
    } else {
      this._archetype_node_id = val;
    }
  }

  /**
   * Optional globally unique object identifier for root points of archetyped structures.
   */
  uid?: openehr_base.UID_BASED_ID;
  /**
   * Links to other archetyped structures (data whose root object inherits from \`ARCHETYPED\`, such as \`ENTRY\`, \`SECTION\` and so on). Links may be to structures in other compositions.
   */
  links?: undefined;
  /**
   * Details of archetyping used on this node.
   */
  archetype_details?: ARCHETYPED;
  /**
   * Audit trail from non-openEHR system of original commit of information forming the content of this node, or from a conversion gateway which has synthesised this node.
   */
  feeder_audit?: FEEDER_AUDIT;
  /**
   * Clinical concept of the archetype as a whole (= derived from the archetype_node_id' of the root node)
   * @returns Result value
   */
  concept(): DV_TEXT {
    // Return the name property as the concept
    // Per openEHR specs, name is mandatory for LOCATABLE, but TypeScript allows undefined
    if (!this.name) {
      throw new Error("LOCATABLE name is required but not set");
    }
    return this.name;
  }

  /**
   * True if this node is the root of an archetyped structure.
   * @returns Result value
   */
  is_archetype_root(): openehr_base.Boolean {
    // A LOCATABLE is an archetype root if it has archetype_details
    return openehr_base.Boolean.from(this.archetype_details !== undefined);
  }
}

/**
 * Archetypes act as the configuration basis for the particular structures of instances defined by the reference model. To enable archetypes to be used to create valid data, key classes in the reference model act as  root  points for archetyping; accordingly, these classes have the \`_archetype_details_\` attribute set.
 *
 * An instance of the class \`ARCHETYPED\` contains the relevant archetype identification information, allowing generating archetypes to be matched up with data instances.
 */
export class ARCHETYPED {
  /**
   * Globally unique archetype identifier.
   */
  archetype_id?: openehr_base.ARCHETYPE_ID;
  /**
   * Globally unique template identifier, if a template was active at this point in the structure. Normally, a template would only be used at the top of a top-level structure, but the possibility exists for templates at lower levels.
   */
  template_id?: openehr_base.TEMPLATE_ID;
  /**
   * Internal storage for rm_version
   * @protected
   */
  protected _rm_version?: openehr_base.String;

  /**
   * Version of the openEHR reference model used to create this object. Expressed in terms of the release version string, e.g.  1.0 ,  1.2.4 .
   */
  get rm_version(): string | undefined {
    return this._rm_version?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for rm_version.
   * Use this to access openehr_base.String methods.
   */
  get $rm_version(): openehr_base.String | undefined {
    return this._rm_version;
  }

  /**
   * Sets rm_version from either a primitive value or openehr_base.String wrapper.
   */
  set rm_version(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._rm_version = undefined;
    } else if (typeof val === "string") {
      this._rm_version = openehr_base.String.from(val);
    } else {
      this._rm_version = val;
    }
  }
}

/**
 * The \`FEEDER_AUDIT\` class defines the semantics of an audit trail which is constructed to describe the origin of data that have been transformed into openEHR form and committed to the system.
 */
export class FEEDER_AUDIT {
  /**
   * Identifiers used for the item in the originating system, e.g. filler and placer ids.
   */
  originating_system_item_ids?: undefined;
  /**
   * Identifiers used for the item in the feeder system, where the feeder system is distinct from the originating system.
   */
  feeder_system_item_ids?: undefined;
  /**
   * Optional inline inclusion of or reference to original content corresponding to the openEHR content at this node. Typically a URI reference to a document or message in a persistent store associated with the EHR.
   */
  original_content?: DV_ENCAPSULATED;
  /**
   * Any audit information for the information item from the originating system.
   */
  originating_system_audit?: FEEDER_AUDIT_DETAILS;
  /**
   * Any audit information for the information item from the feeder system, if different from the originating system.
   */
  feeder_system_audit?: FEEDER_AUDIT_DETAILS;
}

/**
 * Audit details for any system in a feeder system chain. Audit details here means the general notion of who/where/when the information item to which the audit is attached was created. None of the attributes is defined as mandatory, however, in different scenarios, various combinations of attributes will usually be mandatory. This can be controlled by specifying feeder audit details in legacy archetypes.
 */
export class FEEDER_AUDIT_DETAILS {
  /**
   * Internal storage for system_id
   * @protected
   */
  protected _system_id?: openehr_base.String;

  /**
   * Identifier of the system which handled the information item. This is the IT system owned by the organisation legally responsible for handling the data, and at which the data were previously created or passed by an earlier system.
   */
  get system_id(): string | undefined {
    return this._system_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for system_id.
   * Use this to access openehr_base.String methods.
   */
  get $system_id(): openehr_base.String | undefined {
    return this._system_id;
  }

  /**
   * Sets system_id from either a primitive value or openehr_base.String wrapper.
   */
  set system_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._system_id = undefined;
    } else if (typeof val === "string") {
      this._system_id = openehr_base.String.from(val);
    } else {
      this._system_id = val;
    }
  }

  /**
   * Identifier of the particular site/facility within an organisation which handled the item. For computability, this identifier needs to be e.g. a PKI identifier which can be included in the identifier list of the \`PARTY_IDENTIFIED\` object.
   */
  location?: PARTY_IDENTIFIED;
  /**
   * Identifiers for subject of the received information item.
   */
  subject?: PARTY_PROXY;
  /**
   * Optional provider(s) who created, committed, forwarded or otherwise handled the item.
   */
  provider?: PARTY_IDENTIFIED;
  /**
   * Time of handling the item. For an originating system, this will be time of creation, for an intermediate feeder system, this will be a time of accession or other time of handling, where available.
   */
  time?: DV_DATE_TIME;
  /**
   * Internal storage for version_id
   * @protected
   */
  protected _version_id?: openehr_base.String;

  /**
   * Any identifier used in the system such as  "interim" ,  "final" , or numeric versions if available.
   */
  get version_id(): string | undefined {
    return this._version_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for version_id.
   * Use this to access openehr_base.String methods.
   */
  get $version_id(): openehr_base.String | undefined {
    return this._version_id;
  }

  /**
   * Sets version_id from either a primitive value or openehr_base.String wrapper.
   */
  set version_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._version_id = undefined;
    } else if (typeof val === "string") {
      this._version_id = openehr_base.String.from(val);
    } else {
      this._version_id = val;
    }
  }

  /**
   * Optional attribute to carry any custom meta-data. May be archetyped.
   */
  other_details?: ITEM_STRUCTURE;
}

/**
 * Version control abstraction, defining semantics for versioning one complex object.
 */
export class VERSIONED_OBJECT<T> {
  /**
   * Unique identifier of this version container in the form of a UID with no extension. This id will be the same in all instances of the same container in a distributed environment, meaning that it can be understood as the uid of the  virtual version tree.
   */
  uid?: openehr_base.HIER_OBJECT_ID;
  /**
   * Reference to object to which this version container belongs, e.g. the id of the containing EHR or other relevant owning entity.
   */
  owner_id?: openehr_base.OBJECT_REF;
  /**
   * Time of initial creation of this versioned object.
   */
  time_created?: DV_DATE_TIME;
  /**
   * Return the total number of versions in this object.
   * @returns Result value
   */
  version_count(): openehr_base.Integer {
    // TODO: Implement version_count behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method version_count not yet implemented.");
  }

  /**
   * Return a list of ids of all versions in this object.
   * @returns Result value
   */
  all_version_ids(): openehr_base.OBJECT_VERSION_ID {
    // TODO: Implement all_version_ids behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method all_version_ids not yet implemented.");
  }

  /**
   * Return a list of all versions in this object.
   * @returns Result value
   */
  all_versions(): undefined {
    // TODO: Implement all_versions behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method all_versions not yet implemented.");
  }

  /**
   * True if a version for time  \`_a_time_\` exists.
   * @param a_time - Parameter
   * @returns Result value
   */
  has_version_at_time(a_time: DV_DATE_TIME): openehr_base.Boolean {
    // TODO: Implement has_version_at_time behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_version_at_time not yet implemented.");
  }

  /**
   * True if a version with \`_a_version_uid_\` exists.
   * @param a_version_uid - Parameter
   * @returns Result value
   */
  has_version_id(
    a_version_uid: openehr_base.OBJECT_VERSION_ID,
  ): openehr_base.Boolean {
    // TODO: Implement has_version_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_version_id not yet implemented.");
  }

  /**
   * Return the version with \`_uid_\` =  \`_a_version_uid_\`.
   *
   * @param a_version_uid - Parameter
   * @returns Result value
   */
  version_with_id(a_version_uid: openehr_base.OBJECT_VERSION_ID): VERSION {
    // TODO: Implement version_with_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method version_with_id not yet implemented.");
  }

  /**
   * True if version with \`_a_version_uid_\` is an \`ORIGINAL_VERSION\`.
   * @param a_version_uid - Parameter
   * @returns Result value
   */
  is_original_version(
    a_version_uid: openehr_base.OBJECT_VERSION_ID,
  ): openehr_base.Boolean {
    // TODO: Implement is_original_version behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_original_version not yet implemented.");
  }

  /**
   * Return the version for time  \`_a_time_\`.
   * @param a_time - Parameter
   * @returns Result value
   */
  version_at_time(a_time: DV_DATE_TIME): VERSION {
    // TODO: Implement version_at_time behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method version_at_time not yet implemented.");
  }

  /**
   * History of all audits and attestations in this versioned repository.
   * @returns Result value
   */
  revision_history(): REVISION_HISTORY {
    // TODO: Implement revision_history behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method revision_history not yet implemented.");
  }

  /**
   * Return the most recently added version (i.e. on trunk or any branch).
   * @returns Result value
   */
  latest_version(): VERSION {
    // TODO: Implement latest_version behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method latest_version not yet implemented.");
  }

  /**
   * Return the most recently added trunk version.
   * @returns Result value
   */
  latest_trunk_version(): VERSION {
    // TODO: Implement latest_trunk_version behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method latest_trunk_version not yet implemented.");
  }

  /**
   * Return the lifecycle state from the latest trunk version. Useful for determining if the version container is logically deleted.
   * @returns Result value
   */
  trunk_lifecycle_state(): DV_CODED_TEXT {
    // TODO: Implement trunk_lifecycle_state behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method trunk_lifecycle_state not yet implemented.");
  }

  /**
   * Add a new original version.
   * @param a_contribution - Parameter
   * @param a_new_version_uid - Parameter
   * @param a_preceding_version_id - Parameter
   * @param an_audit - Parameter
   * @param a_lifecycle_state - Parameter
   * @param a_data - Parameter
   * @param signing_key - Parameter
   * @returns Result value
   */
  commit_original_version(
    a_contribution: openehr_base.OBJECT_REF,
    a_new_version_uid: openehr_base.OBJECT_VERSION_ID,
    a_preceding_version_id: openehr_base.OBJECT_VERSION_ID,
    an_audit: AUDIT_DETAILS,
    a_lifecycle_state: DV_CODED_TEXT,
    a_data: T,
    signing_key: openehr_base.String,
  ): void {
    // TODO: Implement commit_original_version behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method commit_original_version not yet implemented.");
  }

  /**
   * Add a new original merged version. This commit function adds a parameter containing the ids of other versions merged into the current one.
   * @param a_contribution - Parameter
   * @param a_new_version_uid - Parameter
   * @param a_preceding_version_id - Parameter
   * @param an_audit - Parameter
   * @param a_lifecycle_state - Parameter
   * @param a_data - Parameter
   * @param an_other_input_uids - Parameter
   * @param signing_key - Parameter
   * @returns Result value
   */
  commit_original_merged_version(
    a_contribution: openehr_base.OBJECT_REF,
    a_new_version_uid: openehr_base.OBJECT_VERSION_ID,
    a_preceding_version_id: openehr_base.OBJECT_VERSION_ID,
    an_audit: AUDIT_DETAILS,
    a_lifecycle_state: DV_CODED_TEXT,
    a_data: T,
    an_other_input_uids: undefined,
    signing_key: openehr_base.String,
  ): void {
    // TODO: Implement commit_original_merged_version behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error(
      "Method commit_original_merged_version not yet implemented.",
    );
  }

  /**
   * Add a new imported version. Details of version id etc come from the \`ORIGINAL_VERSION\` being committed.
   * @param a_contribution - Parameter
   * @param an_audit - Parameter
   * @param a_version - Parameter
   * @returns Result value
   */
  commit_imported_version(
    a_contribution: openehr_base.OBJECT_REF,
    an_audit: AUDIT_DETAILS,
    a_version: ORIGINAL_VERSION,
  ): void {
    // TODO: Implement commit_imported_version behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method commit_imported_version not yet implemented.");
  }

  /**
   * Add a new attestation to a specified original version. Attestations can only be added to Original versions.
   * @param an_attestation - Parameter
   * @param a_ver_id - Parameter
   * @param signing_key - Parameter
   * @returns Result value
   */
  commit_attestation(
    an_attestation: ATTESTATION,
    a_ver_id: openehr_base.OBJECT_VERSION_ID,
    signing_key: openehr_base.String,
  ): void {
    // TODO: Implement commit_attestation behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method commit_attestation not yet implemented.");
  }
}

/**
 * Documents a Contribution (change set) of one or more versions added to a change-controlled repository.
 */
export class CONTRIBUTION {
  /**
   * Unique identifier for this Contribution.
   */
  uid?: openehr_base.HIER_OBJECT_ID;
  /**
   * Set of references to Versions causing changes to this EHR. Each contribution contains a list of versions, which may include paths pointing to any number of versionable items, i.e. items of types such as \`COMPOSITION\` and \`FOLDER\`.
   */
  versions?: undefined;
  /**
   * Audit trail corresponding to the committal of this Contribution.
   */
  audit?: AUDIT_DETAILS;
}

/**
 * Abstract model of one Version within a Version container, containing data, commit audit trail, and the identifier of its Contribution.
 */
export abstract class VERSION<T> {
  /**
   * Contribution in which this version was added.
   */
  contribution?: openehr_base.OBJECT_REF;
  /**
   * Internal storage for signature
   * @protected
   */
  protected _signature?: openehr_base.String;

  /**
   * OpenPGP digital signature or digest of content committed in this Version.
   */
  get signature(): string | undefined {
    return this._signature?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for signature.
   * Use this to access openehr_base.String methods.
   */
  get $signature(): openehr_base.String | undefined {
    return this._signature;
  }

  /**
   * Sets signature from either a primitive value or openehr_base.String wrapper.
   */
  set signature(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._signature = undefined;
    } else if (typeof val === "string") {
      this._signature = openehr_base.String.from(val);
    } else {
      this._signature = val;
    }
  }

  /**
   * Audit trail corresponding to the committal of this version to the \`VERSIONED_OBJECT\`.
   */
  commit_audit?: AUDIT_DETAILS;
  /**
   * Unique identifier of this \`VERSION\`, in the form of an \`{object_id, a version_tree_id, creating_system_id}\` triple, where the \`_object_id_\` has the same value as the containing \`VERSIONED_OBJECT _uid_\`.
   * @returns Result value
   */
  abstract uid(): openehr_base.OBJECT_VERSION_ID;

  /**
   * Unique identifier of the version of which this version is a modification; Void if this is the first version.
   * @returns Result value
   */
  abstract preceding_version_uid(): openehr_base.OBJECT_VERSION_ID;

  /**
   * The data of this Version.
   * @returns Result value
   */
  abstract data(): T;

  /**
   * Lifecycle state of this version; coded by openEHR vocabulary \`version lifecycle state\`.
   * @returns Result value
   */
  abstract lifecycle_state(): DV_CODED_TEXT;

  /**
   * A canonical serial form of this Version, suitable for generating reliable hashes and signatures.
   * @returns Result value
   */
  canonical_form(): openehr_base.String {
    // TODO: Implement canonical_form behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method canonical_form not yet implemented.");
  }

  /**
   * Copy of the owning \`VERSIONED_OBJECT._uid_\` value; extracted from the local \`_uid_\` property's \`_object_id_\`.
   * @returns Result value
   */
  owner_id(): openehr_base.HIER_OBJECT_ID {
    // TODO: Implement owner_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method owner_id not yet implemented.");
  }

  /**
   * True if this Version represents a branch. Derived from \`_uid_\` attribute.
   * @returns Result value
   */
  is_branch(): openehr_base.Boolean {
    // TODO: Implement is_branch behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_branch not yet implemented.");
  }
}

/**
 * Versions whose content is an \`ORIGINAL_VERSION\` copied from another location; this class inherits \`_commit_audit_\` and \`_contribution_\` from \`VERSION<T>\`, providing imported versions with their own audit trail and Contribution, distinct from those of the imported \`ORIGINAL_VERSION\`.
 */
export class IMPORTED_VERSION<T> extends VERSION<T> {
  /**
   * The \`ORIGINAL_VERSION\` object that was imported.
   */
  item?: ORIGINAL_VERSION;
  /**
   * Computed version of inheritance precursor, derived as \`_item.uid_\`.
   * @returns Result value
   */
  uid(): openehr_base.OBJECT_VERSION_ID {
    // TODO: Implement uid behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method uid not yet implemented.");
  }

  /**
   * Computed version of inheritance precursor, derived as \`_item.preceding_version_uid_\`.
   * @returns Result value
   */
  preceding_version_uid(): openehr_base.OBJECT_VERSION_ID {
    // TODO: Implement preceding_version_uid behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method preceding_version_uid not yet implemented.");
  }

  /**
   * Lifecycle state of the content item in wrapped \`ORIGINAL_VERSION\`, derived as \`_item.lifecycle_state_\`; coded by openEHR vocabulary \`version lifecycle state\`.
   * @returns Result value
   */
  lifecycle_state(): DV_CODED_TEXT {
    // TODO: Implement lifecycle_state behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method lifecycle_state not yet implemented.");
  }

  /**
   * Original content of this Version.
   *
   * @returns Result value
   */
  data(): T {
    // TODO: Implement data behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method data not yet implemented.");
  }
}

/**
 * A Version containing locally created content and optional attestations.
 */
export class ORIGINAL_VERSION<T> extends VERSION<T> {
  /**
   * Stored version of inheritance precursor.
   */
  uid?: openehr_base.OBJECT_VERSION_ID;
  /**
   * Stored version of inheritance precursor.
   */
  preceding_version_uid?: openehr_base.OBJECT_VERSION_ID;
  /**
   * Identifiers of other versions whose content was merged into this version, if any.
   */
  other_input_version_uids?: undefined;
  /**
   * Lifecycle state of the content item in this version; coded by openEHR vocabulary \`version lifecycle state\`.
   */
  lifecycle_state?: DV_CODED_TEXT;
  /**
   * Set of attestations relating to this version.
   */
  attestations?: undefined;
  /**
   * Data content of this Version.
   */
  data?: T;
  /**
   * True if this Version was created from more than just the preceding (checked out) version.
   * @returns Result value
   */
  is_merged(): openehr_base.Boolean {
    // TODO: Implement is_merged behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_merged not yet implemented.");
  }
}

/**
 * An entry in a revision history, corresponding to a version from a versioned container. Consists of \`AUDIT_DETAILS\` instances with revision identifier of the revision to which the \`AUDIT_DETAILS\` instance belongs.
 */
export class REVISION_HISTORY_ITEM {
  /**
   * Version identifier for this revision.
   */
  version_id?: openehr_base.OBJECT_VERSION_ID;
  /**
   * The audits for this revision; there will always be at least one commit audit (which may itself be an \`ATTESTATION\`), there may also be further attestations.
   */
  audits?: undefined;
}

/**
 * The set of attributes required to document the committal of an information item to a repository.
 */
export class AUDIT_DETAILS {
  /**
   * Internal storage for system_id
   * @protected
   */
  protected _system_id?: openehr_base.String;

  /**
   * Identifier of the logical EHR system where the change was committed. This is almost always owned by the organisation legally responsible for the EHR, and is distinct from any application, or any hosting infrastructure.
   */
  get system_id(): string | undefined {
    return this._system_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for system_id.
   * Use this to access openehr_base.String methods.
   */
  get $system_id(): openehr_base.String | undefined {
    return this._system_id;
  }

  /**
   * Sets system_id from either a primitive value or openehr_base.String wrapper.
   */
  set system_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._system_id = undefined;
    } else if (typeof val === "string") {
      this._system_id = openehr_base.String.from(val);
    } else {
      this._system_id = val;
    }
  }

  /**
   * Time of committal of the item.
   */
  time_committed?: DV_DATE_TIME;
  /**
   * Type of change. Coded using the openEHR Terminology  audit change type  group.
   */
  change_type?: DV_CODED_TEXT;
  /**
   * Reason for committal. This may be used to qualify the value in the \`_change_type_\` field. For example, if the change affects only the EHR directory, this field might be used to indicate 'Folder "episode 2018-02-16" added' or similar.
   */
  description?: DV_TEXT;
  /**
   * Identity and optional reference into identity management service, of user who committed the item.
   */
  committer?: PARTY_PROXY;
}

/**
 * Record an attestation of a party (the committer) to item(s) of record content. An attestation is an explicit signing by one healthcare agent of particular content for various particular purposes, including:
 *
 * * for authorisation of a controlled substance or procedure (e.g. sectioning of patient under mental health act);
 * * witnessing of content by senior clinical professional;
 * * indicating acknowledgement of content by intended recipient, e.g. GP who ordered a test result.
 */
export class ATTESTATION extends AUDIT_DETAILS {
  /**
   * Optional visual representation of content attested e.g. screen image.
   */
  attested_view?: DV_MULTIMEDIA;
  /**
   * Internal storage for proof
   * @protected
   */
  protected _proof?: openehr_base.String;

  /**
   * Proof of attestation.
   */
  get proof(): string | undefined {
    return this._proof?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for proof.
   * Use this to access openehr_base.String methods.
   */
  get $proof(): openehr_base.String | undefined {
    return this._proof;
  }

  /**
   * Sets proof from either a primitive value or openehr_base.String wrapper.
   */
  set proof(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._proof = undefined;
    } else if (typeof val === "string") {
      this._proof = openehr_base.String.from(val);
    } else {
      this._proof = val;
    }
  }

  /**
   * Items attested, expressed as fully qualified runtime paths to the items in question. Although not recommended, these may include fine-grained items which have been attested in some other system. Otherwise it is assumed to be for the entire VERSION with which it is associated.
   */
  items?: undefined;
  /**
   * Reason of this attestation. Optionally coded by the openEHR Terminology group  attestation reason ; includes values like  authorisation ,  witness  etc.
   */
  reason?: DV_TEXT;
  /**
   * Internal storage for is_pending
   * @protected
   */
  protected _is_pending?: openehr_base.Boolean;

  /**
   * True if this attestation is outstanding; False means it has been completed.
   */
  get is_pending(): boolean | undefined {
    return this._is_pending?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_pending.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_pending(): openehr_base.Boolean | undefined {
    return this._is_pending;
  }

  /**
   * Sets is_pending from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_pending(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_pending = undefined;
    } else if (typeof val === "boolean") {
      this._is_pending = openehr_base.Boolean.from(val);
    } else {
      this._is_pending = val;
    }
  }
}

/**
 * Model of a participation of a Party (any Actor or Role) in an activity.  Used to represent any participation of a Party in some activity, which is not  explicitly in the model, e.g. assisting nurse. Can be used to record past or  future participations.
 *
 * Should not be used in place of more permanent relationships between demographic entities.
 */
export class PARTICIPATION {
  /**
   * The function of the Party in this participation (note that a given party might participate in more than one way in a particular activity). This attribute should be coded, but cannot be limited to the HL7v3:ParticipationFunction vocabulary, since it is too limited and hospital-oriented.
   */
  function?: DV_TEXT;
  /**
   * Optional field for recording the 'mode' of the performer / activity interaction, e.g. present, by telephone, by email etc.
   */
  mode?: DV_CODED_TEXT;
  /**
   * The id and possibly demographic system link of the party participating in the activity.
   */
  performer?: PARTY_PROXY;
  /**
   * The time interval during which the participation took place, if it is used in an observational context (i.e. recording facts about the past); or the intended time interval of the participation when used in future contexts, such as EHR Instructions.
   */
  time?: undefined;
}

/**
 * Abstract concept of a proxy description of a party, including an optional link to data for this party in a demographic or other identity management system. Sub- typed into \`PARTY_IDENTIFIED\` and \`PARTY_SELF\`.
 */
export abstract class PARTY_PROXY {
  /**
   * Optional reference to more detailed demographic or identification information for this party, in an external system.
   */
  external_ref?: openehr_base.PARTY_REF;
}

/**
 * Proxy data for an identified party other than the subject of the record, minimally consisting of human-readable identifier(s), such as name, formal (and possibly computable) identifiers such as NHS number, and an optional link to external data. There must be at least one of name, identifier or external_ref present.
 *
 * Used to describe parties where only identifiers may be known, and there is no entry at all in the demographic system (or even no demographic system). Typically for health care providers, e.g. name and provider number of an institution.
 *
 * Should not be used to include patient identifying information.
 */
export class PARTY_IDENTIFIED extends PARTY_PROXY {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Optional human-readable name (in String form).
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * One or more formal identifiers (possibly computable).
   */
  identifiers?: undefined;
}

/**
 * Party proxy representing the subject of the record. Used to indicate that the party is the owner of the record. May or may not have \`_external_ref_\` set.
 */
export class PARTY_SELF extends PARTY_PROXY {
}

/**
 * Proxy type for identifying a party and its relationship to the subject of the record. Use where the relationship between the party and the subject of the record must be known.
 */
export class PARTY_RELATED extends PARTY_IDENTIFIED {
  /**
   * Relationship of subject of this ENTRY to the subject of the record. May be coded. If it is the patient, coded as  self.
   */
  relationship?: DV_CODED_TEXT;
}

/**
 * Purpose Defines the notion of a revision history of audit items, each associated with the version for which that audit was committed. The list is in most-recent-first order.
 */
export class REVISION_HISTORY {
  /**
   * The items in this history in most-recent-last order.
   */
  items?: undefined;
  /**
   * The version id of the most recent item, as a String.
   * @returns Result value
   */
  most_recent_version(): openehr_base.String {
    // TODO: Implement most_recent_version behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method most_recent_version not yet implemented.");
  }

  /**
   * The commit date/time of the most recent item, as a String.
   * @returns Result value
   */
  most_recent_version_time_committed(): openehr_base.String {
    // TODO: Implement most_recent_version_time_committed behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error(
      "Method most_recent_version_time_committed not yet implemented.",
    );
  }
}

/**
 * A version-controlled hierarchy of \`FOLDERs\` giving the effect of a directory.
 */
export class VERSIONED_FOLDER extends VERSIONED_OBJECT<T> {
}

/**
 * The concept of a named folder.
 *
 * NOTE: It is strongly recommended that the inherited attribute \`_uid_\` be populated in _top-level_ (i.e. tree-root) \`FOLDER\` objects, using the UID copied from the \`_object_id()_\` of the \`_uid_\` field of the enclosing \`VERSION\` object. +
 * For example, the \`ORIGINAL_VERSION.uid\` \`87284370-2D4B-4e3d-A3F3-F303D2F4F34B::uk.nhs.ehr1::2\`  would be copied to the \`_uid_\` field of the top \`FOLDER\` object.
 */
export class FOLDER extends LOCATABLE {
  /**
   * The list of references to other (usually) versioned objects logically in this folder.
   */
  items?: undefined;
  /**
   * Sub-folders of this \`FOLDER\`.
   */
  folders?: undefined;
  /**
   * Archetypable meta-data for \`FOLDER\`.
   */
  details?: ITEM_STRUCTURE;
}

/**
 * Abstract idea of an online resource created by a human author.
 */
export abstract class AUTHORED_RESOURCE {
  /**
   * Language in which this resource was initially authored. Although there is no language primacy of resources overall, the language of original authoring is required to ensure natural language translations can preserve quality. Language is relevant in both the description and ontology sections.
   */
  original_language?: CODE_PHRASE;
  /**
   * Internal storage for is_controlled
   * @protected
   */
  protected _is_controlled?: openehr_base.Boolean;

  /**
   * True if this resource is under any kind of change control (even file copying), in which case revision history is created.
   */
  get is_controlled(): boolean | undefined {
    return this._is_controlled?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_controlled.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_controlled(): openehr_base.Boolean | undefined {
    return this._is_controlled;
  }

  /**
   * Sets is_controlled from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_controlled(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_controlled = undefined;
    } else if (typeof val === "boolean") {
      this._is_controlled = openehr_base.Boolean.from(val);
    } else {
      this._is_controlled = val;
    }
  }

  /**
   * List of details for each natural-language translation made of this resource, keyed by language. For each translation listed here, there must be corresponding sections in all language-dependent parts of the resource. The \`_original_language_\` does not appear in this list.
   */
  translations?: undefined;
  /**
   * Description and lifecycle information of the resource.
   */
  description?: RESOURCE_DESCRIPTION;
  /**
   * The revision history of the resource. Only required if \`_is_controlled_ = True\` (avoids large revision histories for informal or private editing situations).
   */
  revision_history?: REVISION_HISTORY;
  /**
   * Most recent revision in \`_revision_history_\` if \`_is_controlled_\` else  (uncontrolled) .
   * @returns Result value
   */
  current_revision(): openehr_base.String {
    // TODO: Implement current_revision behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method current_revision not yet implemented.");
  }

  /**
   * Total list of languages available in this resource, derived from \`_original_language_\` and \`_translations_\`.
   *
   * @returns Result value
   */
  languages_available(): openehr_base.String {
    // TODO: Implement languages_available behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method languages_available not yet implemented.");
  }
}

/**
 * Defines the descriptive meta-data of a resource.
 */
export class RESOURCE_DESCRIPTION {
  /**
   * Original author of this resource, with all relevant details, including organisation.
   */
  original_author?: undefined;
  /**
   * Other contributors to the resource, probably listed in  \`'name <email>'\`  form.
   */
  other_contributors?: undefined;
  /**
   * Internal storage for lifecycle_state
   * @protected
   */
  protected _lifecycle_state?: openehr_base.String;

  /**
   * Lifecycle state of the resource, typically including states such as: \`initial | submitted | experimental | awaiting_approval | approved | superseded | obsolete\`.
   */
  get lifecycle_state(): string | undefined {
    return this._lifecycle_state?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for lifecycle_state.
   * Use this to access openehr_base.String methods.
   */
  get $lifecycle_state(): openehr_base.String | undefined {
    return this._lifecycle_state;
  }

  /**
   * Sets lifecycle_state from either a primitive value or openehr_base.String wrapper.
   */
  set lifecycle_state(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._lifecycle_state = undefined;
    } else if (typeof val === "string") {
      this._lifecycle_state = openehr_base.String.from(val);
    } else {
      this._lifecycle_state = val;
    }
  }

  /**
   * Internal storage for resource_package_uri
   * @protected
   */
  protected _resource_package_uri?: openehr_base.String;

  /**
   * URI of package to which this resource belongs.
   */
  get resource_package_uri(): string | undefined {
    return this._resource_package_uri?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for resource_package_uri.
   * Use this to access openehr_base.String methods.
   */
  get $resource_package_uri(): openehr_base.String | undefined {
    return this._resource_package_uri;
  }

  /**
   * Sets resource_package_uri from either a primitive value or openehr_base.String wrapper.
   */
  set resource_package_uri(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._resource_package_uri = undefined;
    } else if (typeof val === "string") {
      this._resource_package_uri = openehr_base.String.from(val);
    } else {
      this._resource_package_uri = val;
    }
  }

  /**
   * Additional non language-senstive resource meta-data, as a list of name/value pairs.
   */
  other_details?: undefined;
  /**
   * Reference to owning resource.
   */
  parent_resource?: AUTHORED_RESOURCE;
  /**
   * Details of all parts of resource description that are natural language-dependent, keyed by language code.
   */
  details?: undefined;
}

/**
 * Class providing details of a natural language translation.
 */
export class TRANSLATION_DETAILS {
  /**
   * Language of the translation.
   */
  language?: CODE_PHRASE;
  /**
   * Translator name and other demographic details.
   */
  author?: undefined;
  /**
   * Internal storage for accreditaton
   * @protected
   */
  protected _accreditaton?: openehr_base.String;

  /**
   * Accreditation of translator, usually a national translator's registration or association membership id.
   */
  get accreditaton(): string | undefined {
    return this._accreditaton?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for accreditaton.
   * Use this to access openehr_base.String methods.
   */
  get $accreditaton(): openehr_base.String | undefined {
    return this._accreditaton;
  }

  /**
   * Sets accreditaton from either a primitive value or openehr_base.String wrapper.
   */
  set accreditaton(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._accreditaton = undefined;
    } else if (typeof val === "string") {
      this._accreditaton = openehr_base.String.from(val);
    } else {
      this._accreditaton = val;
    }
  }

  /**
   * Any other meta-data.
   */
  other_details?: undefined;
}

/**
 * Language-specific detail of resource description. When a resource is translated for use in another language environment, each \`RESOURCE_DESCRIPTION_ITEM\` needs to be copied and translated into the new language.
 */
export class RESOURCE_DESCRIPTION_ITEM {
  /**
   * The localised language in which the items in this description item are written. Coded from openEHR code set \`languages\`.
   */
  language?: CODE_PHRASE;
  /**
   * Internal storage for purpose
   * @protected
   */
  protected _purpose?: openehr_base.String;

  /**
   * Purpose of the resource.
   */
  get purpose(): string | undefined {
    return this._purpose?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for purpose.
   * Use this to access openehr_base.String methods.
   */
  get $purpose(): openehr_base.String | undefined {
    return this._purpose;
  }

  /**
   * Sets purpose from either a primitive value or openehr_base.String wrapper.
   */
  set purpose(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._purpose = undefined;
    } else if (typeof val === "string") {
      this._purpose = openehr_base.String.from(val);
    } else {
      this._purpose = val;
    }
  }

  /**
   * Keywords which characterise this resource, used e.g. for indexing and searching.
   */
  keywords?: undefined;
  /**
   * Internal storage for use
   * @protected
   */
  protected _use?: openehr_base.String;

  /**
   * Description of the uses of the resource, i.e. contexts in which it could be used.
   */
  get use(): string | undefined {
    return this._use?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for use.
   * Use this to access openehr_base.String methods.
   */
  get $use(): openehr_base.String | undefined {
    return this._use;
  }

  /**
   * Sets use from either a primitive value or openehr_base.String wrapper.
   */
  set use(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._use = undefined;
    } else if (typeof val === "string") {
      this._use = openehr_base.String.from(val);
    } else {
      this._use = val;
    }
  }

  /**
   * Internal storage for misuse
   * @protected
   */
  protected _misuse?: openehr_base.String;

  /**
   * Description of any misuses of the resource, i.e. contexts in which it should not be used.
   */
  get misuse(): string | undefined {
    return this._misuse?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for misuse.
   * Use this to access openehr_base.String methods.
   */
  get $misuse(): openehr_base.String | undefined {
    return this._misuse;
  }

  /**
   * Sets misuse from either a primitive value or openehr_base.String wrapper.
   */
  set misuse(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._misuse = undefined;
    } else if (typeof val === "string") {
      this._misuse = openehr_base.String.from(val);
    } else {
      this._misuse = val;
    }
  }

  /**
   * Internal storage for copyright
   * @protected
   */
  protected _copyright?: openehr_base.String;

  /**
   * Optional copyright statement for the resource as a knowledge resource.
   */
  get copyright(): string | undefined {
    return this._copyright?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for copyright.
   * Use this to access openehr_base.String methods.
   */
  get $copyright(): openehr_base.String | undefined {
    return this._copyright;
  }

  /**
   * Sets copyright from either a primitive value or openehr_base.String wrapper.
   */
  set copyright(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._copyright = undefined;
    } else if (typeof val === "string") {
      this._copyright = openehr_base.String.from(val);
    } else {
      this._copyright = val;
    }
  }

  /**
   * URIs of original clinical document(s) or description of which resource is a formalisation, in the language of this description item; keyed by meaning.
   */
  original_resource_uri?: undefined;
  /**
   * Additional language-senstive resource metadata, as a list of name/value pairs.
   */
  other_details?: undefined;
}

/**
 * A tag with optional value that is associated with a target information entity identified by a UID.
 */
export class ITEM_TAG {
  /**
   * Internal storage for key
   * @protected
   */
  protected _key?: openehr_base.String;

  /**
   * The tag key. May not be empty or contain leading or trailing whitespace.
   */
  get key(): string | undefined {
    return this._key?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for key.
   * Use this to access openehr_base.String methods.
   */
  get $key(): openehr_base.String | undefined {
    return this._key;
  }

  /**
   * Sets key from either a primitive value or openehr_base.String wrapper.
   */
  set key(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._key = undefined;
    } else if (typeof val === "string") {
      this._key = openehr_base.String.from(val);
    } else {
      this._key = val;
    }
  }

  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: openehr_base.String;

  /**
   * The value. If set, may not be empty.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value.
   * Use this to access openehr_base.String methods.
   */
  get $value(): openehr_base.String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.String wrapper.
   */
  set value(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = openehr_base.String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * Identifier of target, which may be a \`VERSIONED_OBJECT<T>\` or a \`VERSION<T>\`.
   */
  target?: openehr_base.UID_BASED_ID;
  /**
   * Internal storage for target_path
   * @protected
   */
  protected _target_path?: openehr_base.String;

  /**
   * Optional archetype (i.e. AQL) or RM path within \`_target_\`, used to tag a fine-grained element.
   */
  get target_path(): string | undefined {
    return this._target_path?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for target_path.
   * Use this to access openehr_base.String methods.
   */
  get $target_path(): openehr_base.String | undefined {
    return this._target_path;
  }

  /**
   * Sets target_path from either a primitive value or openehr_base.String wrapper.
   */
  set target_path(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._target_path = undefined;
    } else if (typeof val === "string") {
      this._target_path = openehr_base.String.from(val);
    } else {
      this._target_path = val;
    }
  }

  /**
   * Identifier of owner object, such as EHR.
   */
  owner_id?: openehr_base.OBJECT_REF;
}

/**
 * Abstract parent class of all data structure types. Includes the \`_as_hierarchy_\` function which can generate the equivalent CEN EN13606 single hierarchy for each subtype's physical representation. For example, the physical representation of an \`ITEM_LIST\` is \`List<ELEMENT>\`; its implementation of \`_as_hierarchy_\` will generate a \`CLUSTER\` containing the set of \`ELEMENT\` nodes from the list.
 */
export abstract class DATA_STRUCTURE extends LOCATABLE {
  /**
   * Hierarchical equivalent of the physical representation of each subtype, compatible with CEN EN 13606 structures.
   * @returns Result value
   */
  as_hierarchy(): ITEM {
    // TODO: Implement as_hierarchy behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method as_hierarchy not yet implemented.");
  }
}

/**
 * Abstract parent class of all spatial data types.
 */
export abstract class ITEM_STRUCTURE extends DATA_STRUCTURE {
}

/**
 * Logical tree data structure. The tree may be empty. Used for representing data which are logically a tree such as audiology results, microbiology results, biochemistry results.
 */
export class ITEM_TREE extends ITEM_STRUCTURE {
  /**
   * The items comprising the \`ITEM_TREE\`. Can include 0 or more \`CLUSTERs\` and/or 0 or more individual \`ELEMENTs\`.
   */
  items?: undefined;
  /**
   * True if path  a_path' is a valid leaf path.
   *
   * @param a_path - Parameter
   * @returns Result value
   */
  has_element_path(a_path: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement has_element_path behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_element_path not yet implemented.");
  }

  /**
   * Return the leaf element at the path  a_path'.
   * @param a_path - Parameter
   * @returns Result value
   */
  element_at_path(a_path: openehr_base.String): ELEMENT {
    // TODO: Implement element_at_path behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method element_at_path not yet implemented.");
  }

  /**
   * Generate a CEN EN13606-compatible hierarchy, which is the same as the tree's physical representation.
   * @returns Result value
   */
  as_hierarchy(): CLUSTER {
    // For ITEM_TREE, the hierarchy is represented as a CLUSTER containing the items
    // Note: Full implementation requires proper tree traversal and CLUSTER construction
    throw new Error("ITEM_TREE.as_hierarchy requires proper tree structure handling - not yet fully implemented");
  }
}

/**
 * Logical single value data structure. Used to represent any data which is logically a single value, such as a person's height or weight.
 */
export class ITEM_SINGLE extends ITEM_STRUCTURE {
  item?: ELEMENT;
  /**
   * Generate a CEN EN13606-compatible hierarchy consisting of a single \`ELEMENT\`.
   * @returns Result value
   */
  as_hierarchy(): ELEMENT {
    // For ITEM_SINGLE, the hierarchy is just the single element itself
    // Note: Full implementation requires accessing the element item
    throw new Error("ITEM_SINGLE.as_hierarchy requires item access - not yet fully implemented");
  }
}

/**
 * Logical relational database style table data structure, in which columns are named and ordered with respect to each other. Implemented using Cluster-per-row encoding. Each row Cluster must have an identical number of Elements, each of which in turn must have identical names and value types in the corresponding positions in each row.
 *
 * Some columns may be designated  key' columns, containing key data for each row, in the manner of relational tables. This allows row-naming, where each row represents a body site, a blood antigen etc. All values in a column have the same data type.
 *
 * Used for representing any data which is logically a table of values, such as blood pressure, most protocols, many blood tests etc.
 *
 * Misuse: Not to be used for time-based data, which should be represented with the temporal class \`HISTORY\`. The table may be empty.
 */
export class ITEM_TABLE extends ITEM_STRUCTURE {
  /**
   * Physical representation of the table as a list of \`CLUSTERs\`, each containing the data of one row of the table.
   */
  rows?: undefined;
  /**
   * Number of rows in the table.
   * @returns Result value
   */
  row_count(): openehr_base.Integer {
    // TODO: Implement row_count behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method row_count not yet implemented.");
  }

  /**
   * Return number of columns in the table.
   * @returns Result value
   */
  column_count(): openehr_base.Integer {
    // TODO: Implement column_count behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method column_count not yet implemented.");
  }

  /**
   * Return set of row names.
   * @returns Result value
   */
  row_names(): DV_TEXT {
    // TODO: Implement row_names behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method row_names not yet implemented.");
  }

  /**
   * Return set of column names.
   * @returns Result value
   */
  column_names(): DV_TEXT {
    // TODO: Implement column_names behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method column_names not yet implemented.");
  }

  /**
   * Return i-th row.
   * @param i - Parameter
   * @returns Result value
   */
  ith_row(i: openehr_base.Integer): CLUSTER {
    // TODO: Implement ith_row behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method ith_row not yet implemented.");
  }

  /**
   * Return \`True\` if there is a column with name = \`_a_key_\`.
   * @param a_key - Parameter
   * @returns Result value
   */
  has_row_with_name(a_key: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement has_row_with_name behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_row_with_name not yet implemented.");
  }

  /**
   * Return \`True\` if there is a column with name = \`_a_key_\`.
   * @param a_key - Parameter
   * @returns Result value
   */
  has_column_with_name(a_key: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement has_column_with_name behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_column_with_name not yet implemented.");
  }

  /**
   * Return row with name = \`_a_key_\`.
   * @param a_key - Parameter
   * @returns Result value
   */
  named_row(a_key: openehr_base.String): CLUSTER {
    // TODO: Implement named_row behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method named_row not yet implemented.");
  }

  /**
   * Return \`True\` if there is a row with key \`_keys_\`.
   * @param keys - Parameter
   * @returns Result value
   */
  has_row_with_key(keys: undefined): openehr_base.Boolean {
    // TODO: Implement has_row_with_key behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_row_with_key not yet implemented.");
  }

  /**
   * Return rows with particular keys.
   * @param keys - Parameter
   * @returns Result value
   */
  row_with_key(keys: undefined): CLUSTER {
    // TODO: Implement row_with_key behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method row_with_key not yet implemented.");
  }

  /**
   * Return cell at a particular location.
   * @param i - Parameter
   * @param j - Parameter
   * @returns Result value
   */
  element_at_cell_ij(
    i: openehr_base.Integer,
    j: openehr_base.Integer,
  ): ELEMENT {
    // TODO: Implement element_at_cell_ij behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method element_at_cell_ij not yet implemented.");
  }

  /**
   * Generate a CEN EN13606-compatible hierarchy consisting of a single \`CLUSTER\` containing the \`CLUSTERs\` representing the columns of this table.
   * @returns Result value
   */
  as_hierarchy(): CLUSTER {
    // For ITEM_TABLE, the hierarchy is a CLUSTER containing CLUSTERs for columns
    // Note: Full implementation requires proper table structure handling
    throw new Error("ITEM_TABLE.as_hierarchy requires table structure handling - not yet fully implemented");
  }
}

/**
 * Logical list data structure, where each item has a value and can be referred to by a name and a positional index in the list. The list may be empty.
 *
 * \`ITEM_LIST\` is used to represent any data which is logically a list of values, such as blood pressure, most protocols, many blood tests etc.
 *
 * Not to be used for time-based lists, which should be represented with the proper temporal class, i.e. \`HISTORY\`.
 */
export class ITEM_LIST extends ITEM_STRUCTURE {
  /**
   * Physical representation of the list.
   */
  items?: undefined;
  /**
   * Count of all items.
   * @returns Result value
   */
  item_count(): openehr_base.Integer {
    // TODO: Implement item_count behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method item_count not yet implemented.");
  }

  /**
   * Retrieve the names of all items.
   * @returns Result value
   */
  names(): DV_TEXT {
    // TODO: Implement names behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method names not yet implemented.");
  }

  /**
   * Retrieve the item with name ‘a_name’.
   * @param a_name - Parameter
   * @returns Result value
   */
  named_item(a_name: openehr_base.String): ELEMENT {
    // TODO: Implement named_item behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method named_item not yet implemented.");
  }

  /**
   * Retrieve the i-th item with name.
   * @param i - Parameter
   * @returns Result value
   */
  ith_item(i: openehr_base.Integer): ELEMENT {
    // TODO: Implement ith_item behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method ith_item not yet implemented.");
  }

  /**
   * Generate a CEN EN13606-compatible hierarchy consisting of a single \`CLUSTER\` containing the \`ELEMENTs\` of this list.
   * @returns Result value
   */
  as_hierarchy(): CLUSTER {
    // For ITEM_LIST, the hierarchy is a CLUSTER containing the list items
    // Note: Full implementation requires proper list structure handling
    throw new Error("ITEM_LIST.as_hierarchy requires list structure handling - not yet fully implemented");
  }
}

/**
 * Defines the abstract notion of a single event in a series. This class is generic, allowing types to be generated which are locked to particular spatial types, such as \`EVENT<ITEM_LIST>\`. Subtypes express point or intveral data.
 */
export abstract class EVENT<T extends ITEM_STRUCTURE> extends LOCATABLE {
  /**
   * Time of this event. If the width is non-zero, it is the time point of the trailing edge of the event.
   */
  time?: DV_DATE_TIME;
  /**
   * Optional state data for this event.
   */
  state?: ITEM_STRUCTURE;
  /**
   * The data of this event.
   */
  data?: T;
  /**
   * Offset of this event from origin, computed as time.diff(parent.origin).
   * @returns Result value
   */
  offset(): DV_DURATION {
    // TODO: Implement offset behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method offset not yet implemented.");
  }
}

/**
 * Defines a single point event in a series.
 */
export class POINT_EVENT<T> extends EVENT<T> {
}

/**
 * Defines a single interval event in a series.
 */
export class INTERVAL_EVENT<T> extends EVENT<T> {
  /**
   * Duration of the time interval during which the values recorded under \`data\` are true and, if set, the values recorded under \`state\` are true. Void if an instantaneous event.
   */
  width?: DV_DURATION;
  /**
   * Internal storage for sample_count
   * @protected
   */
  protected _sample_count?: openehr_base.Integer;

  /**
   * Optional count of original samples to which this event corresponds.
   */
  get sample_count(): number | undefined {
    return this._sample_count?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for sample_count.
   * Use this to access openehr_base.Integer methods.
   */
  get $sample_count(): openehr_base.Integer | undefined {
    return this._sample_count;
  }

  /**
   * Sets sample_count from either a primitive value or openehr_base.Integer wrapper.
   */
  set sample_count(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._sample_count = undefined;
    } else if (typeof val === "number") {
      this._sample_count = openehr_base.Integer.from(val);
    } else {
      this._sample_count = val;
    }
  }

  /**
   * Mathematical function of the data of this event, e.g.  maximum, mean etc. Coded using https://github.com/openEHR/terminology/blob/master/openEHR_RM/en/openehr_terminology.xml[openEHR vocabulary \`event math function\`]. Default value \`640|actual|\`, meaning 'actual value'.
   */
  math_function?: DV_CODED_TEXT;
  /**
   * Start time of the interval of this event.
   * @returns Result value
   */
  interval_start_time(): DV_DATE_TIME {
    // TODO: Implement interval_start_time behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method interval_start_time not yet implemented.");
  }
}

/**
 * Root object of a linear history, i.e. time series structure. This is a generic class whose type parameter must be a descendant of \`ITEM_STRUCTURE\`, ensuring that each Event in the \`_events_\` of a given instance is of the same structural type, i.e. \`ITEM_TREE\`, \`ITEM_LIST\` etc.
 *
 * For a periodic series of events, period will be set, and the time of each Event in the History must correspond; i.e. the \`EVENT._offset_\` must be a multiple of period for each Event. Missing events in a period History are however allowed.
 */
export class HISTORY<T extends ITEM_STRUCTURE> extends DATA_STRUCTURE {
  /**
   * Time origin of this event history. The first event is not necessarily at the origin point.
   */
  origin?: DV_DATE_TIME;
  /**
   * Period between samples in this segment if periodic.
   */
  period?: DV_DURATION;
  /**
   * Duration of the entire History; either corresponds to the duration of all the events, and/or the duration represented by the summary, if it exists.
   */
  duration?: DV_DURATION;
  /**
   * Optional summary data that aggregates, organizes, reduces and transforms the event series. This may be a text or image that presents a graphical presentation, or some data that assists with the interpretation of the data.
   */
  summary?: ITEM_STRUCTURE;
  /**
   * The events in the series. This attribute is of a generic type whose parameter must be a descendant of \`ITEM_SUTRUCTURE\`.
   */
  events?: undefined;
  /**
   * Indicates whether history is periodic.
   *
   * @returns Result value
   */
  is_periodic(): openehr_base.Boolean {
    // TODO: Implement is_periodic behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_periodic not yet implemented.");
  }
}

/**
 * The abstract parent of \`CLUSTER\` and \`ELEMENT\` representation classes.
 */
export abstract class ITEM extends LOCATABLE {
}

/**
 * The grouping variant of \`ITEM\`, which may contain further instances of \`ITEM\`, in an ordered list.
 */
export class CLUSTER extends ITEM {
  /**
   * Ordered list of items - \`CLUSTER\` or \`ELEMENT\` objects - under this \`CLUSTER\`.
   */
  items?: undefined;
}

/**
 * The leaf variant of \`ITEM\`, to which a \`DATA_VALUE\` instance is attached.
 */
export class ELEMENT extends ITEM {
  /**
   * Flavour of null value, e.g. \`253|unknown|\`, \`271|no information|\`, \`272|masked|\`, and \`273|not applicable|\`.
   */
  null_flavour?: DV_CODED_TEXT;
  /**
   * Property representing leaf value object of \`ELEMENT\`. In real data, any concrete subtype of \`DATA_VALUE\` can be used.
   */
  value?: DATA_VALUE;
  /**
   * Optional specific reason for null value; if set, \`_null_flavour_\` must be set. Null reason may apply only to a minority of clinical data, commonly needed in reporting contexts.
   */
  null_reason?: DV_TEXT;
  /**
   * True if value logically not known, e.g. if indeterminate, not asked etc.
   * @returns Result value
   */
  is_null(): openehr_base.Boolean {
    // TODO: Implement is_null behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_null not yet implemented.");
  }
}

/**
 * Abstract parent of all \`DV_\` data value types.
 */
export abstract class DATA_VALUE extends openehr_base.OPENEHR_DEFINITIONS {
}

/**
 * Items which are truly boolean data, such as true/false or yes/no answers. For such data, it is important to devise the meanings (usually questions in subjective data)  carefully, so that the only allowed results are in fact true or false.
 *
 * Misuse: The DV_BOOLEAN class should not be used as a replacement for naively modelled enumerated types such as male/female etc. Such values should be coded, and in any case the enumeration often has more than two values.
 */
export class DV_BOOLEAN extends DATA_VALUE {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: openehr_base.Boolean;

  /**
   * Boolean value of this item. Actual values may be language or implementation dependent.
   */
  get value(): boolean | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for value.
   * Use this to access openehr_base.Boolean methods.
   */
  get $value(): openehr_base.Boolean | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.Boolean wrapper.
   */
  set value(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "boolean") {
      this._value = openehr_base.Boolean.from(val);
    } else {
      this._value = val;
    }
  }
}

/**
 * For representing state values which obey a defined state machine, such as a variable  representing the states of an instruction or care process.
 *
 * DV_STATE is expressed as a String but its values are driven by archetype-defined  state machines. This provides a powerful way of capturing stateful complex processes  in simple data.
 */
export class DV_STATE extends DATA_VALUE {
  /**
   * The state name. State names are determined by a state/event table defined in archetypes, and coded using openEHR Terminology or local archetype terms, as specified by the archetype.
   */
  value?: DV_CODED_TEXT;
  /**
   * Internal storage for is_terminal
   * @protected
   */
  protected _is_terminal?: openehr_base.Boolean;

  /**
   * Indicates whether this state is a terminal state, such as  "aborted",  "completed" etc. from which no further transitions are possible.
   */
  get is_terminal(): boolean | undefined {
    return this._is_terminal?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_terminal.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_terminal(): openehr_base.Boolean | undefined {
    return this._is_terminal;
  }

  /**
   * Sets is_terminal from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_terminal(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_terminal = undefined;
    } else if (typeof val === "boolean") {
      this._is_terminal = openehr_base.Boolean.from(val);
    } else {
      this._is_terminal = val;
    }
  }
}

/**
 * Type for representing identifiers of real-world entities. Typical identifiers include drivers licence number, social security number, veterans affairs number, prescription id, order id, and so on.
 *
 * DV_IDENTIFIER is used to represent any identifier of a real thing, issued by some authority or agency.
 *
 * Misuse: DV_IDENTIFIER is not used to express identifiers generated by the infrastructure to refer to information items; the types OBJECT_ID and OBJECT_REF and subtypes are defined for this purpose.
 */
export class DV_IDENTIFIER extends DATA_VALUE {
  /**
   * Internal storage for issuer
   * @protected
   */
  protected _issuer?: openehr_base.String;

  /**
   * Optional authority which issues the kind of id used in the id field of this object.
   */
  get issuer(): string | undefined {
    return this._issuer?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for issuer.
   * Use this to access openehr_base.String methods.
   */
  get $issuer(): openehr_base.String | undefined {
    return this._issuer;
  }

  /**
   * Sets issuer from either a primitive value or openehr_base.String wrapper.
   */
  set issuer(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._issuer = undefined;
    } else if (typeof val === "string") {
      this._issuer = openehr_base.String.from(val);
    } else {
      this._issuer = val;
    }
  }

  /**
   * Internal storage for assigner
   * @protected
   */
  protected _assigner?: openehr_base.String;

  /**
   * Optional organisation that assigned the id to the item being identified.
   */
  get assigner(): string | undefined {
    return this._assigner?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for assigner.
   * Use this to access openehr_base.String methods.
   */
  get $assigner(): openehr_base.String | undefined {
    return this._assigner;
  }

  /**
   * Sets assigner from either a primitive value or openehr_base.String wrapper.
   */
  set assigner(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._assigner = undefined;
    } else if (typeof val === "string") {
      this._assigner = openehr_base.String.from(val);
    } else {
      this._assigner = val;
    }
  }

  /**
   * Internal storage for id
   * @protected
   */
  protected _id?: openehr_base.String;

  /**
   * The identifier value. Often structured, according to the definition of the issuing authority's rules.
   */
  get id(): string | undefined {
    return this._id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for id.
   * Use this to access openehr_base.String methods.
   */
  get $id(): openehr_base.String | undefined {
    return this._id;
  }

  /**
   * Sets id from either a primitive value or openehr_base.String wrapper.
   */
  set id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._id = undefined;
    } else if (typeof val === "string") {
      this._id = openehr_base.String.from(val);
    } else {
      this._id = val;
    }
  }

  /**
   * Internal storage for type
   * @protected
   */
  protected _type?: openehr_base.String;

  /**
   * Optional identifier type, such as  prescription , or  Social Security Number . One day a controlled vocabulary might be possible for this.
   */
  get type(): string | undefined {
    return this._type?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for type.
   * Use this to access openehr_base.String methods.
   */
  get $type(): openehr_base.String | undefined {
    return this._type;
  }

  /**
   * Sets type from either a primitive value or openehr_base.String wrapper.
   */
  set type(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._type = undefined;
    } else if (typeof val === "string") {
      this._type = openehr_base.String.from(val);
    } else {
      this._type = val;
    }
  }
}

/**
 * Abstract class defining the common meta-data of all types of encapsulated data.
 */
export abstract class DV_ENCAPSULATED extends DATA_VALUE {
  /**
   * Name of character encoding scheme in which this value is encoded. Coded from openEHR Code Set  character sets . Unicode is the default assumption in openEHR, with UTF-8 being the assumed encoding. This attribute allows for variations from these assumptions.
   */
  charset?: CODE_PHRASE;
  /**
   * Optional indicator of the localised language in which the data is written, if relevant. Coded from openEHR Code Set \`languages\`.
   */
  language?: CODE_PHRASE;
}

/**
 * A specialisation of \`DV_ENCAPSULATED\` for audiovisual and bio-signal types. Includes further metadata relating to multimedia types which are not applicable to other subtypes of \`DV_ENCAPSULATED\`.
 */
export class DV_MULTIMEDIA extends DV_ENCAPSULATED {
  /**
   * Internal storage for alternate_text
   * @protected
   */
  protected _alternate_text?: openehr_base.String;

  /**
   * Text to display in lieu of multimedia display/replay.
   */
  get alternate_text(): string | undefined {
    return this._alternate_text?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for alternate_text.
   * Use this to access openehr_base.String methods.
   */
  get $alternate_text(): openehr_base.String | undefined {
    return this._alternate_text;
  }

  /**
   * Sets alternate_text from either a primitive value or openehr_base.String wrapper.
   */
  set alternate_text(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._alternate_text = undefined;
    } else if (typeof val === "string") {
      this._alternate_text = openehr_base.String.from(val);
    } else {
      this._alternate_text = val;
    }
  }

  /**
   * URI reference to electronic information stored outside the record as a file, database entry etc, if supplied as a reference.
   */
  uri?: DV_URI;
  /**
   * The actual data found at \`_uri_\`, if supplied inline.
   */
  data?: undefined;
  /**
   * Data media type coded from openEHR code set  media types  (interface for the IANA MIME types code set).
   */
  media_type?: CODE_PHRASE;
  /**
   * Compression type, a coded value from the openEHR Integrity check code set. Void means no compression.
   */
  compression_algorithm?: CODE_PHRASE;
  /**
   * Binary cryptographic integrity checksum.
   */
  integrity_check?: undefined;
  /**
   * Type of integrity check, a coded value from the openEHR \`Integrity check\` code set.
   */
  integrity_check_algorithm?: CODE_PHRASE;
  /**
   * The thumbnail for this item, if one exists; mainly for graphics formats.
   */
  thumbnail?: DV_MULTIMEDIA;
  /**
   * Internal storage for size
   * @protected
   */
  protected _size?: openehr_base.Integer;

  /**
   * Original size in bytes of unencoded encapsulated data. I.e. encodings such as base64, hexadecimal etc do not change the value of this attribute.
   */
  get size(): number | undefined {
    return this._size?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for size.
   * Use this to access openehr_base.Integer methods.
   */
  get $size(): openehr_base.Integer | undefined {
    return this._size;
  }

  /**
   * Sets size from either a primitive value or openehr_base.Integer wrapper.
   */
  set size(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._size = undefined;
    } else if (typeof val === "number") {
      this._size = openehr_base.Integer.from(val);
    } else {
      this._size = val;
    }
  }

  /**
   * Computed from the value of the \`_uri_\` attribute: True if  the data is stored externally to the record, as indicated by \`_uri_\`. A copy may also be stored internally, in which case \`_is_expanded_\` is also true.
   * @returns Result value
   */
  is_external(): openehr_base.Boolean {
    // TODO: Implement is_external behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_external not yet implemented.");
  }

  /**
   * Computed from the value of the data attribute. True if  the  data is stored  in  expanded  form, ie within the EHR itself.
   * @returns Result value
   */
  is_inline(): openehr_base.Boolean {
    // TODO: Implement is_inline behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_inline not yet implemented.");
  }

  /**
   * Computed from the value of the \`_compression_algorithm_\` attribute: True if  the  data is stored in compressed form.
   * @returns Result value
   */
  is_compressed(): openehr_base.Boolean {
    // TODO: Implement is_compressed behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_compressed not yet implemented.");
  }

  /**
   * Computed from the value of the \`_integrity_check_algorithm_\` attribute: True if an integrity check has been computed.
   * @returns Result value
   */
  has_integrity_check(): openehr_base.Boolean {
    // TODO: Implement has_integrity_check behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_integrity_check not yet implemented.");
  }
}

/**
 * Encapsulated data expressed as a parsable String. The internal model of the data item is not described in the openEHR model in common with other encapsulated types, but in this case, the form of the data is assumed to be plaintext, rather than compressed or other types of large binary data.
 */
export class DV_PARSABLE extends DV_ENCAPSULATED {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: openehr_base.String;

  /**
   * The string, which may validly be empty in some syntaxes.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value.
   * Use this to access openehr_base.String methods.
   */
  get $value(): openehr_base.String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.String wrapper.
   */
  set value(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = openehr_base.String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * Internal storage for formalism
   * @protected
   */
  protected _formalism?: openehr_base.String;

  /**
   * Name of the formalism, e.g.  GLIF 1.0 ,  Proforma  etc.
   */
  get formalism(): string | undefined {
    return this._formalism?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for formalism.
   * Use this to access openehr_base.String methods.
   */
  get $formalism(): openehr_base.String | undefined {
    return this._formalism;
  }

  /**
   * Sets formalism from either a primitive value or openehr_base.String wrapper.
   */
  set formalism(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._formalism = undefined;
    } else if (typeof val === "string") {
      this._formalism = openehr_base.String.from(val);
    } else {
      this._formalism = val;
    }
  }

  /**
   * Size in bytes of value.
   * @returns Result value
   */
  size(): openehr_base.Integer {
    // TODO: Implement size behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method size not yet implemented.");
  }
}

/**
 * DEPRECATED: use markdown formatted \`DV_TEXT\` instead.
 *
 * Original definition:
 *
 * A logical composite text value consisting of a series of \`DV_TEXTs\`, i.e. plain text (optionally coded) potentially with simple formatting, to form a larger tract of prose, which may be interpreted for display purposes as a paragraph.
 *
 * \`DV_PARAGRAPH\` is the standard way for constructing longer text items in summaries, reports and so on.
 */
export class DV_PARAGRAPH extends DATA_VALUE {
  /**
   * Items making up the paragraph, each of which is a text item (which may have its own formatting, and/or have hyperlinks).
   */
  items?: undefined;
}

/**
 * A text item, which may contain any amount of legal characters arranged as e.g. words, sentences etc (i.e. one \`DV_TEXT\` may be more than one word). Visual formatting and hyperlinks may be included via markdown.
 *
 * If the \`_formatting_\` field is set, the \`_value_\` field is affected as follows:
 *
 * * \`_formatting_ = "plain"\`: plain text, may contain newlines;
 * * \`_formatting_ = "plain_no_newlines"\`: plain text with no newlines;
 * * \`_formatting_ = "markdown"\`: text in markdown format; use of CommonMark strongly recommended.
 *
 * A \`DV_TEXT\` can be coded by adding mappings to it.
 */
export class DV_TEXT extends DATA_VALUE {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: openehr_base.String;

  /**
   * Displayable rendition of the item, regardless of its underlying structure. For \`DV_CODED_TEXT\`, this is the rubric of the complete term as provided by the terminology service.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value.
   * Use this to access openehr_base.String methods.
   */
  get $value(): openehr_base.String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.String wrapper.
   */
  set value(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = openehr_base.String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * DEPRECATED: this field is deprecated; use markdown link/text in the \`_value_\` attribute, and \`"markdown"\` as the value of the \`_formatting_\` field.
   *
   * Original usage, prior to RM Release 1.0.4: Optional link sitting behind a section of plain text or coded term item.
   */
  hyperlink?: DV_URI;
  /**
   * Internal storage for formatting
   * @protected
   */
  protected _formatting?: openehr_base.String;

  /**
   * If set, contains one of the following values:
   *
   * * \`"plain"\`: use for plain text, possibly containing newlines, but otherwise unformatted (same as Void);
   * * \`"plain_no_newlines"\`: use for text containing no newlines or other formatting;
   * * \`"markdown"\`: use for markdown formatted text, strongly recommended in the format of the CommonMark specification.
   *
   * DEPRECATED usage: contains a string of the form \`"name:value; name:value..."\` , e.g. \`"font-weight : bold; font-family : Arial; font-size : 12pt;"\`. Values taken from W3C CSS2 properties lists for background and font .
   */
  get formatting(): string | undefined {
    return this._formatting?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for formatting.
   * Use this to access openehr_base.String methods.
   */
  get $formatting(): openehr_base.String | undefined {
    return this._formatting;
  }

  /**
   * Sets formatting from either a primitive value or openehr_base.String wrapper.
   */
  set formatting(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._formatting = undefined;
    } else if (typeof val === "string") {
      this._formatting = openehr_base.String.from(val);
    } else {
      this._formatting = val;
    }
  }

  /**
   * Terms from other terminologies most closely matching this term, typically used where the originator (e.g. pathology lab) of information uses a local terminology but also supplies one or more equivalents from well known terminologies (e.g. LOINC).
   */
  mappings?: undefined;
  /**
   * Optional indicator of the localised language in which the value is written. Coded from openEHR Code Set  languages . Only used when either the text object is in a different language from the enclosing \`ENTRY\`, or else the text object is being used outside of an \`ENTRY\` or other enclosing structure which indicates the language.
   */
  language?: CODE_PHRASE;
  /**
   * Name of character encoding scheme in which this value is encoded. Coded from openEHR Code Set  character sets . Unicode is the default assumption in openEHR, with UTF-8 being the assumed encoding. This attribute allows for variations from these assumptions.
   */
  encoding?: CODE_PHRASE;
}

/**
 * A text item whose value must be the rubric from a controlled terminology, the key (i.e. the 'code') of which is the \`_defining_code_\` attribute. In other words: a \`DV_CODED_TEXT\` is a combination of a \`CODE_PHRASE\` (effectively a code) and the rubric of that term, from a terminology service, in the language in which the data were authored.
 *
 * Since \`DV_CODED_TEXT\` is a subtype of \`DV_TEXT\`, it can be used in place of it, effectively allowing the type \`DV_TEXT\` to mean  a text item, which may optionally be coded.
 *
 * Misuse: If the intention is to represent a term code attached in some way to a fragment of plain text, \`DV_CODED_TEXT\` should not be used; instead use a \`DV_TEXT\` and a \`TERM_MAPPING\` to a \`CODE_PHRASE\`.
 */
export class DV_CODED_TEXT extends DV_TEXT {
  /**
   * The term of which the  \`_value_\` attribute is the textual rendition (i.e. rubric).
   */
  defining_code?: CODE_PHRASE;
}

/**
 * Represents a coded term mapped to a \`DV_TEXT\`, and the relative match of the target term with respect to the mapped item. Plain or coded text items may appear in the EHR for which one or mappings in alternative terminologies are required. Mappings are only used to enable computer processing, so they can only be instances of \`DV_CODED_TEXT\`.
 *
 * Used for adding classification terms (e.g. adding ICD classifiers to SNOMED descriptive terms), or mapping into equivalents in other terminologies (e.g. across nursing vocabularies).
 */
export class TERM_MAPPING {
  /**
   * The relative match of the target term with respect to the mapped text item. Result meanings:
   *
   * * \`'>'\`: the mapping is to a broader term e.g. orginal text =  arbovirus infection , target =  viral infection
   * * \`'='\`: the mapping is to a (supposedly) equivalent to the original item
   * * \`'<'\`: the mapping is to a narrower term. e.g. original text =  diabetes , mapping =  diabetes mellitus .
   * * \`'?'\`: the kind of mapping is unknown.
   *
   * The first three values are taken from the ISO standards 2788 ( Guide to Establishment and development of monolingual thesauri) and 5964 (Guide to Establishment and development of multilingual thesauri).
   */
  match?: string;
  /**
   * Purpose of the mapping e.g. 'automated data mining', 'billing', 'interoperability'.
   */
  purpose?: DV_CODED_TEXT;
  /**
   * The target term of the mapping.
   */
  target?: CODE_PHRASE;
  /**
   * The mapping is to a narrower term.
   * @returns Result value
   */
  narrower(): openehr_base.Boolean {
    // TODO: Implement narrower behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method narrower not yet implemented.");
  }

  /**
   * The mapping is to a broader term.
   * @returns Result value
   */
  broader(): openehr_base.Boolean {
    // TODO: Implement broader behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method broader not yet implemented.");
  }

  /**
   * The mapping is to an equivalent term.
   * @returns Result value
   */
  equivalent(): openehr_base.Boolean {
    // TODO: Implement equivalent behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method equivalent not yet implemented.");
  }

  /**
   * The kind of mapping is unknown.
   * @returns Result value
   */
  unknown(): openehr_base.Boolean {
    // TODO: Implement unknown behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method unknown not yet implemented.");
  }

  /**
   * True if match valid.
   * @param c - Parameter
   * @returns Result value
   */
  is_valid_match_code(c: string): openehr_base.Boolean {
    // TODO: Implement is_valid_match_code behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_valid_match_code not yet implemented.");
  }
}

/**
 * A fully coordinated (i.e. all coordination has been performed) term from a terminology service (as distinct from a particular terminology).
 */
export class CODE_PHRASE {
  /**
   * Identifier of the distinct terminology from which the code_string (or its elements) was extracted.
   */
  terminology_id?: openehr_base.TERMINOLOGY_ID;
  /**
   * Internal storage for code_string
   * @protected
   */
  protected _code_string?: openehr_base.String;

  /**
   * The key used by the terminology service to identify a concept or coordination of concepts. This string is most likely parsable inside the terminology service, but nothing can be assumed about its syntax outside that context.
   */
  get code_string(): string | undefined {
    return this._code_string?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for code_string.
   * Use this to access openehr_base.String methods.
   */
  get $code_string(): openehr_base.String | undefined {
    return this._code_string;
  }

  /**
   * Sets code_string from either a primitive value or openehr_base.String wrapper.
   */
  set code_string(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._code_string = undefined;
    } else if (typeof val === "string") {
      this._code_string = openehr_base.String.from(val);
    } else {
      this._code_string = val;
    }
  }

  /**
   * Internal storage for preferred_term
   * @protected
   */
  protected _preferred_term?: openehr_base.String;

  /**
   * Optional attribute to carry preferred term corresponding to the code or expression in \`_code_string_\`. Typical use in integration situations which create mappings, and representing data for which both a (non-preferred) actual term and a preferred term are both required.
   */
  get preferred_term(): string | undefined {
    return this._preferred_term?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for preferred_term.
   * Use this to access openehr_base.String methods.
   */
  get $preferred_term(): openehr_base.String | undefined {
    return this._preferred_term;
  }

  /**
   * Sets preferred_term from either a primitive value or openehr_base.String wrapper.
   */
  set preferred_term(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._preferred_term = undefined;
    } else if (typeof val === "string") {
      this._preferred_term = openehr_base.String.from(val);
    } else {
      this._preferred_term = val;
    }
  }
}

/**
 * Abstract class defining the concept of ordered values, which includes ordinals as well as true quantities. It defines the functions  \`<\` and \`_is_strictly_comparable_to()_\`, the latter of which must evaluate to \`True\` for instances being compared with the  \`<\` function, or used as limits in the \`DV_INTERVAL<T>\` class.
 *
 * Data value types which are to be used as limits in the \`DV_INTERVAL<T>\` class must inherit from this class, and implement the function \`_is_strictly_comparable_to()_\` to ensure that instances compare meaningfully. For example, instances of \`DV_QUANTITY\` can only be compared if they measure the same kind of physical quantity.
 */
export abstract class DV_ORDERED extends DATA_VALUE {
  /**
   * Optional normal status indicator of value with respect to normal range for this value. Often included by lab, even if the normal range itself is not included. Coded by ordinals in series HHH, HH, H, (nothing), L, LL, LLL; see openEHR terminology group  \`normal_status\`.
   */
  normal_status?: CODE_PHRASE;
  /**
   * Optional normal range.
   */
  normal_range?: DV_INTERVAL;
  /**
   * Optional tagged other reference ranges for this value in its particular measurement context.
   */
  other_reference_ranges?: undefined;
  /**
   * Test if two instances are strictly comparable. Effected in descendants.
   * @param other - Parameter
   * @returns Result value
   */
  abstract is_strictly_comparable_to(other: DV_ORDERED): openehr_base.Boolean;

  /**
   * True if this quantity has no reference ranges.
   * @returns Result value
   */
  is_simple(): openehr_base.Boolean {
    // TODO: Implement is_simple behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_simple not yet implemented.");
  }

  /**
   * Value is in the normal range, determined by comparison of the value to \`_normal_range_\` if present, or by the \`_normal_status_\` marker if present.
   *
   * @returns Result value
   */
  is_normal(): openehr_base.Boolean {
    // TODO: Implement is_normal behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_normal not yet implemented.");
  }

  /**
   * True if this Ordered object is less than \`_other_\`. Redefined in descendants.
   * @param other - Parameter
   * @returns Result value
   */
  abstract less_than(other: DV_ORDERED): openehr_base.Boolean;
}

/**
 * Generic class defining an interval (i.e. range) of a comparable type. An interval is a contiguous subrange of a comparable base type. Used to define intervals of dates, times, quantities (whose units match) and so on. The type parameter, \`T\`, must be a descendant of the type \`DV_ORDERED\`, which is necessary (but not sufficient) for instances to be compared (\`_strictly_comparable_\` is also needed).
 *
 * Without the \`DV_INTERVAL\` class, quite a few more \`DV_\` classes would be needed to express logical intervals, namely interval versions of all the date/time classes, and of quantity classes. Further, it allows the semantics of intervals to be stated in one place unequivocally, including the conditions for strict comparison.
 *
 * The basic semantics are derived from the class \`Interval<T>\`, described in the support RM.
 */
export class DV_INTERVAL<T extends DV_ORDERED> extends DATA_VALUE {
}

/**
 * Defines a named range to be associated with any \`DV_ORDERED\` datum. Each such range is particular to the patient and context, e.g. sex, age, and any other factor which affects ranges. May be used to represent normal, therapeutic, dangerous, critical etc ranges.
 */
export class REFERENCE_RANGE<T extends DV_ORDERED> {
  /**
   * Term whose value indicates the meaning of this range, e.g.  normal,  critical,  therapeutic  etc.
   */
  meaning?: DV_TEXT;
  /**
   * The data range for this meaning, e.g. critical  etc.
   */
  range?: DV_INTERVAL;
  /**
   * Indicates if the value  \`_v_\` is inside the range.
   *
   * @param v - Parameter
   * @returns Result value
   */
  is_in_range(v: DV_ORDERED): openehr_base.Boolean {
    // TODO: Implement is_in_range behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_in_range not yet implemented.");
  }
}

/**
 * Abstract class defining the concept of true quantified values, i.e. values which are not only ordered, but which have a precise magnitude.
 */
export abstract class DV_QUANTIFIED extends DV_ORDERED {
  /**
   * Internal storage for magnitude_status
   * @protected
   */
  protected _magnitude_status?: openehr_base.String;

  /**
   * Optional status of magnitude with values:
   *
   * * \`"="\`   :   magnitude is a point value
   * * \`"<"\`   :   value is < magnitude
   * * \`">"\`   :   value is > magnitude
   * * \`"<="\` : value is <= magnitude
   * * \`">="\` : value is >= magnitude
   * * \`"~"\`   :   value is approximately magnitude
   *
   * If not present, assumed meaning is  \`"="\` .
   */
  get magnitude_status(): string | undefined {
    return this._magnitude_status?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for magnitude_status.
   * Use this to access openehr_base.String methods.
   */
  get $magnitude_status(): openehr_base.String | undefined {
    return this._magnitude_status;
  }

  /**
   * Sets magnitude_status from either a primitive value or openehr_base.String wrapper.
   */
  set magnitude_status(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._magnitude_status = undefined;
    } else if (typeof val === "string") {
      this._magnitude_status = openehr_base.String.from(val);
    } else {
      this._magnitude_status = val;
    }
  }

  /**
   * Accuracy of measurement. Exact form of expression determined in descendants.
   */
  accuracy?: openehr_base.Any;
  /**
   * Test whether a string value is one of the valid values for the magnitude_status attribute.
   * @returns Result value
   */
  valid_magnitude_status(): openehr_base.Boolean {
    // TODO: Implement valid_magnitude_status behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method valid_magnitude_status not yet implemented.");
  }

  abstract magnitude(): openehr_base.Ordered_Numeric;

  /**
   * True if accuracy is not known, e.g. due to not being recorded or discernable.
   * @returns Result value
   */
  accuracy_unknown(): openehr_base.Boolean {
    // TODO: Implement accuracy_unknown behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method accuracy_unknown not yet implemented.");
  }

  /**
   * Return True if this \`DV_QUANTIFIED\` is considered equal to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  abstract is_equal(other: DV_QUANTIFIED): openehr_base.Boolean;

  /**
   * True if this Quantified object is less than \`_other_\`, based on comparison of \`_magnitude_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_QUANTIFIED): openehr_base.Boolean {
    // Compare based on magnitude
    const thisMag = this.magnitude();
    const otherMag = other.magnitude();
    
    // Handle different types of Ordered_Numeric
    if (typeof thisMag === 'number' && typeof otherMag === 'number') {
      return openehr_base.Boolean.from(thisMag < otherMag);
    }
    
    // If magnitude returns an object with less_than method
    if (thisMag && typeof thisMag === 'object' && 'less_than' in thisMag) {
      return (thisMag as any).less_than(otherMag);
    }
    
    // Fallback: compare as numbers
    return openehr_base.Boolean.from(Number(thisMag) < Number(otherMag));
  }
}

/**
 * Class of enumeration constants defining types of proportion for the \`DV_PROPORTION\` class.
 */
export class PROPORTION_KIND extends openehr_base.Integer {
}

/**
 * Abstract class defining the concept of relative quantified  'amounts'. For relative quantities, the  \`+\` and  \`-\` operators are defined (unlike descendants of \`DV_ABSOLUTE_QUANTITY\`, such as the date/time types).
 */
export abstract class DV_AMOUNT extends DV_QUANTIFIED {
  /**
   * Internal storage for accuracy_is_percent
   * @protected
   */
  protected _accuracy_is_percent?: openehr_base.Boolean;

  /**
   * If \`True\`, indicates that when this object was created, \`_accuracy_\` was recorded as a percent value; if \`False\`, as an absolute quantity value.
   */
  get accuracy_is_percent(): boolean | undefined {
    return this._accuracy_is_percent?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for accuracy_is_percent.
   * Use this to access openehr_base.Boolean methods.
   */
  get $accuracy_is_percent(): openehr_base.Boolean | undefined {
    return this._accuracy_is_percent;
  }

  /**
   * Sets accuracy_is_percent from either a primitive value or openehr_base.Boolean wrapper.
   */
  set accuracy_is_percent(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._accuracy_is_percent = undefined;
    } else if (typeof val === "boolean") {
      this._accuracy_is_percent = openehr_base.Boolean.from(val);
    } else {
      this._accuracy_is_percent = val;
    }
  }

  /**
   * Accuracy of measurement, expressed either as a half-range percent value (\`_accuracy_is_percent_\` = \`True\`) or a half-range quantity. A value of \`0\` means that accuracy is 100%, i.e. no error.
   *
   * A value of \`_unknown_accuracy_value_\` means that accuracy was not recorded.
   */
  override accuracy?: number = undefined;
  /**
   * Test whether a number is a valid percentage, i.e. between 0 and 100.
   * @param number - Parameter
   * @returns Result value
   */
  valid_percentage(number: openehr_base.Ordered_Numeric): openehr_base.Boolean {
    // TODO: Implement valid_percentage behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method valid_percentage not yet implemented.");
  }

  /**
   * Sum of this amount and another. The value of accuracy in the result is either:
   *
   * * the sum of the accuracies of the operands, if both present, or;
   * * both operand accuracies are unknown_accuracy_value.
   *
   * If the accuracy value is a percentage in one operand and not in the other, the form in the result is that of the larger operand.
   * @param other - Parameter
   * @returns Result value
   */
  add(other: DV_AMOUNT): DV_AMOUNT {
    // TODO: Implement add behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method add not yet implemented.");
  }

  /**
   * Difference of this amount and another. The value of \`_accuracy_\` in the result is either:
   *
   * * the sum of the accuracies of the operands, if both present, or;
   * * unknown, if either or both operand accuracies are unknown.
   *
   * If the \`_accuracy_\` value is a percentage in one operand and not in the other, the form in the result is that of the larger operand.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other: DV_AMOUNT): DV_AMOUNT {
    // TODO: Implement subtract behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method subtract not yet implemented.");
  }

  /**
   * Return True if this \`DV_AMOUNT\` is considered equal to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  abstract is_equal(other: DV_QUANTIFIED): openehr_base.Boolean;

  /**
   * Product of this Amount and \`_factor_\`.
   * @param factor - Parameter
   * @returns Result value
   */
  multiply(factor: number): DV_AMOUNT {
    // TODO: Implement multiply behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method multiply not yet implemented.");
  }

  /**
   * Negated version of current object, such as used for representing a difference, e.g. a weight loss.
   * @returns Result value
   */
  negative(): DV_AMOUNT {
    // TODO: Implement negative behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method negative not yet implemented.");
  }

  /**
   * True if this object is less than \`_other_\`. Based on comparison of \`_magnitude_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_AMOUNT): openehr_base.Boolean {
    // TODO: Implement less_than behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method less_than not yet implemented.");
  }
}

/**
 * Models a ratio of values, i.e. where the numerator and denominator are both pure numbers. The \`_valid_proportion_kind_\` property of the \`PROPORTION_KIND\` class is used to control the type attribute to be one of a defined set.
 *
 * Used for recording titers (e.g. 1:128), concentration ratios, e.g. Na:K (unitary denominator), albumin:creatinine ratio, and percentages, e.g. red cell distirbution width (RDW).
 *
 * Misuse: Should not be used to represent things like blood pressure which are often written using a  '/' character, giving the misleading impression that the item is a ratio, when in fact it is a structured value. Similarly, visual acuity, often written as (e.g.) "6/24" in clinical notes is not a ratio but an ordinal (which includes non-numeric symbols like CF = count fingers etc). Should not be used for formulations.
 */
export class DV_PROPORTION extends PROPORTION_KIND {
  /**
   * Numerator of ratio
   */
  numerator?: number;
  /**
   * Denominator of ratio.
   */
  denominator?: number;
  /**
   * Internal storage for type
   * @protected
   */
  protected _type?: openehr_base.Integer;

  /**
   * Indicates semantic type of proportion, including percent, unitary etc.
   */
  get type(): number | undefined {
    return this._type?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for type.
   * Use this to access openehr_base.Integer methods.
   */
  get $type(): openehr_base.Integer | undefined {
    return this._type;
  }

  /**
   * Sets type from either a primitive value or openehr_base.Integer wrapper.
   */
  set type(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._type = undefined;
    } else if (typeof val === "number") {
      this._type = openehr_base.Integer.from(val);
    } else {
      this._type = val;
    }
  }

  /**
   * Internal storage for precision
   * @protected
   */
  protected _precision?: openehr_base.Integer;

  /**
   * Precision  to  which  the  \`_numerator_\` and \`_denominator_\` values of  the  proportion are expressed, in terms of number  of decimal places. The value 0 implies an integral quantity. The value -1 implies no limit, i.e. any number of decimal places.
   */
  get precision(): number | undefined {
    return this._precision?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for precision.
   * Use this to access openehr_base.Integer methods.
   */
  get $precision(): openehr_base.Integer | undefined {
    return this._precision;
  }

  /**
   * Sets precision from either a primitive value or openehr_base.Integer wrapper.
   */
  set precision(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._precision = undefined;
    } else if (typeof val === "number") {
      this._precision = openehr_base.Integer.from(val);
    } else {
      this._precision = val;
    }
  }

  /**
   * Optional normal range.
   */
  override normal_range?: undefined = undefined;
  /**
   * Optional tagged other reference ranges for this value in its particular measurement context.
   */
  override other_reference_ranges?: undefined;
  /**
   * Effective magnitude represented by ratio.
   * @returns Result value
   */
  magnitude(): number {
    // Magnitude is numerator divided by denominator
    if (!this.denominator || this.denominator === 0) {
      throw new Error("Cannot compute magnitude with zero or undefined denominator");
    }
    return (this.numerator || 0) / this.denominator;
  }

  /**
   * True if the \`_numerator_\` and \`_denominator_\` values are integers, i.e. if \`_precision_\` is 0.
   * @returns Result value
   */
  is_integral(): openehr_base.Boolean {
    return openehr_base.Boolean.from(this.precision === 0);
  }

  /**
   * Sum of two strictly comparable proportions.
   * @param other - Parameter
   * @returns Result value
   */
  add(other: DV_PROPORTION): DV_PROPORTION {
    // Check type compatibility
    if (this.type !== other.type) {
      throw new Error("Cannot add proportions with different types");
    }
    
    const result = new DV_PROPORTION();
    // Correct fraction addition: a/b + c/d = (a*d + b*c)/(b*d)
    const a = this.numerator || 0;
    const b = this.denominator || 1;
    const c = other.numerator || 0;
    const d = other.denominator || 1;
    
    result.numerator = a * d + b * c;
    result.denominator = b * d;
    result.type = this.type;
    result.precision = this.precision;
    
    return result;
  }

  /**
   * Difference between two strictly comparable proportions.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other: DV_PROPORTION): DV_PROPORTION {
    // Check type compatibility
    if (this.type !== other.type) {
      throw new Error("Cannot subtract proportions with different types");
    }
    
    const result = new DV_PROPORTION();
    // Correct fraction subtraction: a/b - c/d = (a*d - b*c)/(b*d)
    const a = this.numerator || 0;
    const b = this.denominator || 1;
    const c = other.numerator || 0;
    const d = other.denominator || 1;
    
    result.numerator = a * d - b * c;
    result.denominator = b * d;
    result.type = this.type;
    result.precision = this.precision;
    
    return result;
  }

  /**
   * Return True if this \`DV_AMOUNT\` is considered equal to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other: DV_PROPORTION): openehr_base.Boolean {
    if (!(other instanceof DV_PROPORTION)) {
      return openehr_base.Boolean.from(false);
    }
    // Compare type, numerator, and denominator
    return openehr_base.Boolean.from(
      this.type === other.type &&
      this.numerator === other.numerator &&
      this.denominator === other.denominator
    );
  }

  /**
   * Product of this Proportion and \`_factor_\`.
   * @param factor - Parameter
   * @returns Result value
   */
  multiply(factor: number): DV_PROPORTION {
    const result = new DV_PROPORTION();
    result.numerator = (this.numerator || 0) * factor;
    result.denominator = this.denominator;
    result.type = this.type;
    result.precision = this.precision;
    
    return result;
  }

  /**
   * True if this Proportion is less than  \`_other_\`. Only valid if \`_is_strictly_comparable_to()_\` is True.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_PROPORTION): openehr_base.Boolean {
    // Compare based on magnitude (numerator/denominator)
    return openehr_base.Boolean.from(this.magnitude() < other.magnitude());
  }

  /**
   * Return True if the \`_type_\` of this proportion is the same as the \`_type_\` of \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  is_strictly_comparable_to(other: DV_ORDERED): openehr_base.Boolean {
    if (!(other instanceof DV_PROPORTION)) {
      return openehr_base.Boolean.from(false);
    }
    // Proportions are strictly comparable if they have the same type
    return openehr_base.Boolean.from(this.type === other.type);
  }
}

/**
 * Quantitified type representing  scientific  quantities, i.e. quantities expressed as a magnitude and units. Units are expressed in the UCUM syntax (http://unitsofmeasure.org/ucum.html[Unified Code for Units of Measure (UCUM)], by Gunther Schadow and Clement J. McDonald of The Regenstrief Institute)  (case-sensitive form) by default, or another system if \`_units_system_\` is set.
 *
 * Can also be used for time durations, where it is more convenient to treat these as simply a number of seconds rather than days, months, years (in the latter case, \`DV_DURATION\` may be used).
 */
export class DV_QUANTITY extends DV_AMOUNT {
  /**
   * Numeric magnitude of the quantity.
   */
  magnitude?: number;
  /**
   * Internal storage for precision
   * @protected
   */
  protected _precision?: openehr_base.Integer;

  /**
   * Precision to which the value of the quantity is expressed, in terms of number of decimal places. The value 0 implies an integral quantity.
   * The value -1 implies no limit, i.e. any number of decimal places.
   */
  get precision(): number | undefined {
    return this._precision?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for precision.
   * Use this to access openehr_base.Integer methods.
   */
  get $precision(): openehr_base.Integer | undefined {
    return this._precision;
  }

  /**
   * Sets precision from either a primitive value or openehr_base.Integer wrapper.
   */
  set precision(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._precision = undefined;
    } else if (typeof val === "number") {
      this._precision = openehr_base.Integer.from(val);
    } else {
      this._precision = val;
    }
  }

  /**
   * Internal storage for units
   * @protected
   */
  protected _units?: openehr_base.String;

  /**
   * Quantity units, expressed as a code or syntax string from either UCUM (the default) or the units system specified in \`_units_system_\`, when set.
   *
   * In either case, the value is the code or syntax - normally formed of standard ASCII - which is in principal not the same as the display string, although in simple cases such as 'm' (for meters) it will be.
   *
   * If the \`_units_display_name_\` field is set, this may be used for display. If not, the implementations must effect the resolution of the \`_units_\` value to a display form locally, e.g. by lookup of reference tables, request to a terminology service etc.
   *
   * Example values from UCUM: "kg/m^2", “mm[Hg]", "ms-1", "km/h".
   */
  get units(): string | undefined {
    return this._units?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for units.
   * Use this to access openehr_base.String methods.
   */
  get $units(): openehr_base.String | undefined {
    return this._units;
  }

  /**
   * Sets units from either a primitive value or openehr_base.String wrapper.
   */
  set units(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._units = undefined;
    } else if (typeof val === "string") {
      this._units = openehr_base.String.from(val);
    } else {
      this._units = val;
    }
  }

  /**
   * Optional normal range.
   */
  override normal_range?: undefined = undefined;
  /**
   * Optional tagged other reference ranges for this value in its particular measurement context.
   */
  override other_reference_ranges?: undefined;
  /**
   * Internal storage for units_system
   * @protected
   */
  protected _units_system?: openehr_base.String;

  /**
   * Optional field used to specify a units system from which codes in \`_units_\` are defined. Value is a URI identifying a terminology containing units concepts from the  (https://www.hl7.org/fhir/terminologies-systems.html[HL7 FHIR terminologies list]).
   *
   * If not set, the UCUM standard (case-sensitive codes) is assumed as the units system.
   */
  get units_system(): string | undefined {
    return this._units_system?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for units_system.
   * Use this to access openehr_base.String methods.
   */
  get $units_system(): openehr_base.String | undefined {
    return this._units_system;
  }

  /**
   * Sets units_system from either a primitive value or openehr_base.String wrapper.
   */
  set units_system(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._units_system = undefined;
    } else if (typeof val === "string") {
      this._units_system = openehr_base.String.from(val);
    } else {
      this._units_system = val;
    }
  }

  /**
   * Internal storage for units_display_name
   * @protected
   */
  protected _units_display_name?: openehr_base.String;

  /**
   * Optional field containing the displayable form of the \`_units_\` field, e.g. \`'°C'\`.
   *
   * If not set, the application environment needs to determine the displayable form.
   *
   * NOTE: The display name may be language-dependent for various older and non-systematic units. For this reason, it is not recommended to add unit display names to archetypes, only to templates (for localisation purposes).
   */
  get units_display_name(): string | undefined {
    return this._units_display_name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for units_display_name.
   * Use this to access openehr_base.String methods.
   */
  get $units_display_name(): openehr_base.String | undefined {
    return this._units_display_name;
  }

  /**
   * Sets units_display_name from either a primitive value or openehr_base.String wrapper.
   */
  set units_display_name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._units_display_name = undefined;
    } else if (typeof val === "string") {
      this._units_display_name = openehr_base.String.from(val);
    } else {
      this._units_display_name = val;
    }
  }

  /**
   * Sum of this \`DV_QUANTITY\` and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  add(other: DV_QUANTITY): DV_QUANTITY {
    // Check units compatibility
    if (this.units !== other.units) {
      throw new Error("Cannot add quantities with different units");
    }
    
    const result = new DV_QUANTITY();
    result.magnitude = (this.magnitude || 0) + (other.magnitude || 0);
    result.units = this.units;
    result.units_system = this.units_system;
    result.precision = this.precision;
    
    // Handle accuracy if present
    if (this.accuracy !== undefined && other.accuracy !== undefined) {
      result.accuracy = this.accuracy + other.accuracy;
    }
    
    return result;
  }

  /**
   * Difference of this \`DV_QUANTITY\` and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other: DV_QUANTITY): DV_QUANTITY {
    // Check units compatibility
    if (this.units !== other.units) {
      throw new Error("Cannot subtract quantities with different units");
    }
    
    const result = new DV_QUANTITY();
    result.magnitude = (this.magnitude || 0) - (other.magnitude || 0);
    result.units = this.units;
    result.units_system = this.units_system;
    result.precision = this.precision;
    
    // Handle accuracy if present - use RSS for uncertainty propagation
    if (this.accuracy !== undefined && other.accuracy !== undefined) {
      result.accuracy = Math.sqrt(this.accuracy ** 2 + other.accuracy ** 2);
    }
    
    return result;
  }

  /**
   * Product of this \`DV_QUANTITY\` and \`_factor_\`.
   * @param factor - Parameter
   * @returns Result value
   */
  multiply(factor: number): DV_QUANTITY {
    const result = new DV_QUANTITY();
    result.magnitude = (this.magnitude || 0) * factor;
    result.units = this.units;
    result.units_system = this.units_system;
    result.precision = this.precision;
    
    // Handle accuracy if present
    if (this.accuracy !== undefined) {
      result.accuracy = this.accuracy * Math.abs(factor);
    }
    
    return result;
  }

  /**
   * True if this Quantity object is less than \`_other_\`, based on comparison of \`_magnitude_\`. Only valid if \`_is_strictly_comparable_to()_\` is True.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_QUANTITY): openehr_base.Boolean {
    // Should check units compatibility but comparison is still possible
    if (this.units !== other.units) {
      console.warn("Comparing quantities with different units");
    }
    return openehr_base.Boolean.from((this.magnitude || 0) < (other.magnitude || 0));
  }

  /**
   * True if \`_precision_\` = 0, meaning that the \`_magnitude_\` is a whole number.
   * @returns Result value
   */
  is_integral(): openehr_base.Boolean {
    return openehr_base.Boolean.from(this.precision === 0);
  }

  /**
   * True if this quantity and \`_other_\` have the same \`_units_\` and also \`_units_system_\` if it exists.
   * @param other - Parameter
   * @returns Result value
   */
  is_strictly_comparable_to(other: DV_ORDERED): openehr_base.Boolean {
    if (!(other instanceof DV_QUANTITY)) {
      return openehr_base.Boolean.from(false);
    }
    
    // Check units match
    if (this.units !== other.units) {
      return openehr_base.Boolean.from(false);
    }
    
    // If units_system is present, it must match too
    if (this.units_system !== undefined || other.units_system !== undefined) {
      if (this.units_system !== other.units_system) {
        return openehr_base.Boolean.from(false);
      }
    }
    
    return openehr_base.Boolean.from(true);
  }

  /**
   * Value equality comparison.
   * @param other - The other object to compare with
   * @returns Boolean wrapper indicating equality
   */
  is_equal(other: DV_QUANTIFIED): openehr_base.Boolean {
    if (!(other instanceof DV_QUANTITY)) {
      return openehr_base.Boolean.from(false);
    }
    // Compare magnitude and units
    return openehr_base.Boolean.from(
      this.magnitude === other.magnitude && this.units === other.units
    );
  }
}

/**
 * Countable quantities. Used for countable types such as pregnancies and steps (taken by a physiotherapy patient), number of cigarettes smoked in a day.
 *
 * Misuse: Not to be used for amounts of physical entities (which all have units).
 */
export class DV_COUNT extends DV_AMOUNT {
  /**
   * Internal storage for magnitude
   * @protected
   */
  protected _magnitude?: openehr_base.Integer64;

  get magnitude(): number | undefined {
    return this._magnitude?.value;
  }

  /**
   * Gets the openehr_base.Integer64 wrapper object for magnitude.
   * Use this to access openehr_base.Integer64 methods.
   */
  get $magnitude(): openehr_base.Integer64 | undefined {
    return this._magnitude;
  }

  /**
   * Sets magnitude from either a primitive value or openehr_base.Integer64 wrapper.
   */
  set magnitude(val: number | openehr_base.Integer64 | undefined) {
    if (val === undefined || val === null) {
      this._magnitude = undefined;
    } else if (typeof val === "number") {
      this._magnitude = openehr_base.Integer64.from(val);
    } else {
      this._magnitude = val;
    }
  }

  /**
   * Optional normal range.
   */
  override normal_range?: undefined = undefined;
  /**
   * Optional tagged other reference ranges for this value in its particular measurement context.
   */
  override other_reference_ranges?: undefined;
  /**
   * Sum of this \`DV_COUNT\` and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  add(other: DV_COUNT): DV_COUNT {
    const result = new DV_COUNT();
    result.magnitude = (this.magnitude || 0) + (other.magnitude || 0);
    
    // Handle accuracy if present
    if (this.accuracy !== undefined && other.accuracy !== undefined) {
      result.accuracy = this.accuracy + other.accuracy;
    }
    
    return result;
  }

  /**
   * Difference of this \`DV_COUNT\` and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other: DV_COUNT): DV_COUNT {
    const result = new DV_COUNT();
    result.magnitude = (this.magnitude || 0) - (other.magnitude || 0);
    
    // Handle accuracy if present - use RSS for uncertainty propagation
    if (this.accuracy !== undefined && other.accuracy !== undefined) {
      result.accuracy = Math.sqrt(this.accuracy ** 2 + other.accuracy ** 2);
    }
    
    return result;
  }

  /**
   * Product of this \`DV_COUNT\` and \`_factor_\`.
   * @param factor - Parameter
   * @returns Result value
   */
  multiply(factor: number): DV_COUNT {
    const result = new DV_COUNT();
    result.magnitude = Math.round((this.magnitude || 0) * factor);
    
    // Handle accuracy if present
    if (this.accuracy !== undefined) {
      result.accuracy = this.accuracy * Math.abs(factor);
    }
    
    return result;
  }

  /**
   * True if this Quantified object is less than \`_other_\`, based on comparison of \`_magnitude_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_COUNT): openehr_base.Boolean {
    return openehr_base.Boolean.from((this.magnitude || 0) < (other.magnitude || 0));
  }

  /**
   * Return True.
   * @param other - Parameter
   * @returns Result value
   */
  is_strictly_comparable_to(other: DV_ORDERED): openehr_base.Boolean {
    // Counts are always strictly comparable to other counts
    return openehr_base.Boolean.from(other instanceof DV_COUNT);
  }

  /**
   * Value equality comparison.
   * @param other - The other object to compare with
   * @returns Boolean wrapper indicating equality
   */
  is_equal(other: DV_QUANTIFIED): openehr_base.Boolean {
    if (!(other instanceof DV_COUNT)) {
      return openehr_base.Boolean.from(false);
    }
    // Compare magnitude
    return openehr_base.Boolean.from(this.magnitude === other.magnitude);
  }
}

/**
 * Abstract class defining the concept of quantified entities whose values are absolute with respect to an origin. Dates and Times are the main example.
 */
export abstract class DV_ABSOLUTE_QUANTITY extends DV_QUANTIFIED {
  override accuracy?: DV_AMOUNT = undefined;
  /**
   * Addition of a differential amount to this quantity.
   *
   * The value of accuracy in the result is either:
   *
   * * the sum of the accuracies of the operands, if both present, or;
   * * unknown, if either or both operand accuracies are unknown.
   * @param a_diff - Parameter
   * @returns Result value
   */
  abstract add(a_diff: DV_AMOUNT): DV_ABSOLUTE_QUANTITY;

  /**
   * Result of subtracting a differential amount from this quantity.
   *
   * The value of \`_accuracy_\` in the result is either:
   *
   * * the sum of the accuracies of the operands, if both present, or;
   * * unknown, if either or both operand accuracies are unknown.
   * @param a_diff - Parameter
   * @returns Result value
   */
  abstract subtract(a_diff: DV_AMOUNT): DV_ABSOLUTE_QUANTITY;

  /**
   * Difference of two quantities.
   *
   * The value of accuracy in the result is either:
   *
   * * the sum of the accuracies of the operands, if both present, or;
   * * unknown, if either or both operand accuracies are unknown.
   * @param other - Parameter
   * @returns Result value
   */
  abstract diff(other: DV_ABSOLUTE_QUANTITY): DV_AMOUNT;
}

/**
 * A data type that represents integral score values, e.g. pain, Apgar values, etc, where there is:
 *
 * a) implied ordering,
 * b) no implication that the distance between each value is constant, and
 * c) the total number of values is finite;
 * d) integer values only.
 *
 * Note that although the term 'ordinal' in mathematics means natural numbers only, here any integer is allowed, since negative and zero values are often used by medical professionals for values around a neutral point. Examples of sets of ordinal values:
 *
 * *   -3, -2, -1, 0, 1, 2, 3  -- reflex response values
 * *    0, 1, 2                  -- Apgar values
 *
 * This class is used for recording any clinical datum which is customarily recorded using symbolic values. Example: the results on a urinalysis strip, e.g. \`{neg, trace, +, ++, +++}\` are used for leucocytes, protein, nitrites etc; for non-haemolysed blood \`{neg, trace, moderate}\`; for haemolysed blood \`{small, moderate, large}\`.
 *
 * For scores or scales that include Real numbers (or might in the future, i.e. not fixed for all time, such as Apgar), use \`DV_SCALE\`. \`DV_SCALE\` may also be used in future for representing purely Integer-based scales, however, the \`DV_ORDINAL\` type should continue to be supported in software implementations in order to accommodate existing data that are instances of this type.
 */
export class DV_ORDINAL extends DV_ORDERED {
  /**
   * Coded textual representation of this value in the enumeration, which may be strings made from  +  symbols, or other enumerations of terms such as  \`mild\`, \`moderate\`, \`severe\`, or even the same number series as the values, e.g. 1, 2, 3.
   */
  symbol?: DV_CODED_TEXT;
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: openehr_base.Integer;

  /**
   * Value in ordered enumeration of values. Any integer value can be used.
   */
  get value(): number | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for value.
   * Use this to access openehr_base.Integer methods.
   */
  get $value(): openehr_base.Integer | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.Integer wrapper.
   */
  set value(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "number") {
      this._value = openehr_base.Integer.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * True if this Ordinal value is less than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_ORDINAL): openehr_base.Boolean {
    // Compare based on integer values
    return openehr_base.Boolean.from((this.value || 0) < (other.value || 0));
  }

  /**
   * Test if this Ordinal is strictly comparable to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  is_strictly_comparable_to(other: DV_ORDERED): openehr_base.Boolean {
    // Ordinals from the same terminology/code system are strictly comparable
    // Check if other is a DV_ORDINAL instance
    // A more thorough implementation would check the terminology_id of the symbols
    return openehr_base.Boolean.from(other instanceof DV_ORDINAL);
  }
}

/**
 * A data type that represents scale values, where there is:
 *
 * a) implied ordering,
 * b) no implication that the distance between each value is constant, and
 * c) the total number of values is finite;
 * d) non-integer values are allowed.
 *
 * Example:
 *
 * ----
 * Borg CR 10 Scale
 *
 * 0    No Breathlessness at all
 * 0.5  Very Very Slight (Just Noticeable)
 * 1    Very Slight
 * 2    Slight Breathlessness
 * 3    Moderate
 * ... etc
 * ----
 *
 * For scores that include only Integers, \`DV_SCALE\` may also be used, but \`DV_ORDINAL\` should be supported to accommodate existing data instances of that type.
 */
export class DV_SCALE extends DV_ORDERED {
  /**
   * Coded textual representation of this value in the scale range, which may be strings made from symbols or other enumerations of terms such as  \`no breathlessness\`, \`very very slight\`, \`slight breathlessness\`. Codes come from archetypes.
   *
   * In some cases, a scale may include values that have no code/symbol. In this case, the symbol will be a \`DV-CODED_TEXT\` including the \`_terminology_id_\` and a blank String value for \`_code_string_\`.
   */
  symbol?: DV_CODED_TEXT;
  /**
   * Real number value of Scale item.
   */
  value?: number;
  /**
   * Test if this Scale value is strictly comparable to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  is_strictly_comparable_to(other: DV_ORDERED): openehr_base.Boolean {
    // Scales from the same scale definition are strictly comparable
    // Check if other is a DV_SCALE instance
    // A more thorough implementation would check the terminology_id of the symbols
    return openehr_base.Boolean.from(other instanceof DV_SCALE);
  }

  /**
   * True if this Scale value is less than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_SCALE): openehr_base.Boolean {
    // Compare based on numeric values
    return openehr_base.Boolean.from((this.value || 0) < (other.value || 0));
  }
}

/**
 * Represents a period of time with respect to a notional point in time, which is not specified. A sign may be used to indicate the duration is  backwards  in time rather than forwards.
 *
 * NOTE: two deviations from ISO 8601 are supported, the first, to allow a negative sign, and the second allowing the 'W' designator to be mixed with other designators. See time types section in the Foundation Types model.
 *
 * Used for recording the duration of something in the real world, particularly when there is a need a) to represent the duration in customary format, i.e. days, hours, minutes etc, and b) if it will be used in computational operations with date/time quantities, i.e. additions, subtractions etc.
 *
 * Misuse: Durations cannot be used to represent points in time, or intervals of time.
 */
export class DV_DURATION extends DV_AMOUNT {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: openehr_base.String;

  /**
   * ISO8601 duration string, including described deviations to support negative values and weeks.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value.
   * Use this to access openehr_base.String methods.
   */
  get $value(): openehr_base.String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.String wrapper.
   */
  set value(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = openehr_base.String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * Sum of this Duration and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  add(other: DV_DURATION): DV_DURATION {
    // Note: Full ISO8601 duration arithmetic requires proper parsing
    // This is a simplified implementation
    throw new Error("DV_DURATION arithmetic operations require ISO8601 duration parser - not yet fully implemented");
  }

  /**
   * Difference of this Duration and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other: DV_DURATION): DV_DURATION {
    // Note: Full ISO8601 duration arithmetic requires proper parsing
    // This is a simplified implementation
    throw new Error("DV_DURATION arithmetic operations require ISO8601 duration parser - not yet fully implemented");
  }

  /**
   * Product of this Duration and \`_factor_\`.
   * @param factor - Parameter
   * @returns Result value
   */
  multiply(factor: number): DV_DURATION {
    // Note: Full ISO8601 duration arithmetic requires proper parsing
    // This is a simplified implementation
    throw new Error("DV_DURATION arithmetic operations require ISO8601 duration parser - not yet fully implemented");
  }

  /**
   * True if this duration object is less than \`_other_\`, based on comparison of \`_magnitude()_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_DURATION): openehr_base.Boolean {
    // Compare based on magnitude() which should return seconds
    // Note: magnitude() method must be implemented first
    throw new Error("DV_DURATION.less_than requires magnitude() method - not yet fully implemented");
  }

  /**
   * True, for any two Durations.
   * @param other - Parameter
   * @returns Result value
   */
  is_strictly_comparable_to(other: DV_DURATION): openehr_base.Boolean {
    // TODO: Implement is_strictly_comparable_to behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_strictly_comparable_to not yet implemented.");
  }

  /**
   * Negated version of current duration.
   *
   * Assuming the current duration is positive, the negated version represents a time prior to some origin point, or a negative age (e.g. so-called 'adjusted age' of premature infant).
   * @returns Result value
   */
  negative(): DV_DURATION {
    // Note: Requires ISO8601 duration parsing and negation
    throw new Error("DV_DURATION.negative requires ISO8601 parser - not yet fully implemented");
  }

  /**
   * Numeric value of the duration as a number of seconds. Computed using the method \`_to_seconds()_\` inherited from \`Iso8601_duration\`.
   * @returns Result value
   */
  magnitude(): number {
    // TODO: Implement magnitude behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method magnitude not yet implemented.");
  }

  /**
   * Value equality comparison.
   * @param other - The other object to compare with
   * @returns Boolean wrapper indicating equality
   */
  is_equal(other: DV_QUANTIFIED): openehr_base.Boolean {
    if (!(other instanceof DV_DURATION)) {
      return openehr_base.Boolean.from(false);
    }
    // Compare value strings
    return openehr_base.Boolean.from(this.value === other.value);
  }
}

/**
 * Specialised temporal variant of \`DV_ABSOLUTE_QUANTITY\` whose diff type is \`DV_DURATION\`.
 */
export abstract class DV_TEMPORAL extends DV_ABSOLUTE_QUANTITY {
  /**
   * Time accuracy, expressed as a duration.
   */
  override accuracy?: DV_DURATION = undefined;
  /**
   * Addition of a Duration to this temporal entity.
   * @param a_diff - Parameter
   * @returns Result value
   */
  abstract add(a_diff: DV_DURATION): DV_TEMPORAL;

  /**
   * Subtract a Duration from this temporal entity.
   * @param a_diff - Parameter
   * @returns Result value
   */
  abstract subtract(a_diff: DV_DURATION): DV_TEMPORAL;

  /**
   * Difference between this temporal entity and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  abstract diff(other: DV_TEMPORAL): DV_DURATION;
}

/**
 * Represents an absolute point in time, as measured on the Gregorian calendar, and specified only to the day. Semantics defined by ISO 8601. Used for recording dates in real world time. The partial form is used for approximate birth dates, dates of death, etc.
 */
export class DV_DATE extends DV_TEMPORAL {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: openehr_base.String;

  /**
   * ISO8601 date string.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value.
   * Use this to access openehr_base.String methods.
   */
  get $value(): openehr_base.String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.String wrapper.
   */
  set value(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = openehr_base.String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * Numeric value of the date as days since the calendar origin date \`0001-01-01\`.
   * @returns Result value
   */
  magnitude(): openehr_base.Integer {
    // TODO: Implement magnitude behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method magnitude not yet implemented.");
  }

  /**
   * Return True if this \`DV_QUANTIFIED\` is considered equal to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other: DV_QUANTIFIED): openehr_base.Boolean {
    // TODO: Implement is_equal behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_equal not yet implemented.");
  }

  /**
   * Addition of a Duration to this Date.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff: DV_DURATION): DV_DATE {
    // Note: Full implementation requires ISO8601 duration parsing and date arithmetic
    throw new Error("DV_DATE.add requires ISO8601 parser - not yet fully implemented");
  }

  /**
   * Subtract a Duration from this Date.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract(a_diff: DV_DURATION): DV_DATE {
    // Note: Full implementation requires ISO8601 duration parsing and date arithmetic
    throw new Error("DV_DATE.subtract requires ISO8601 parser - not yet fully implemented");
  }

  /**
   * Difference between this Date and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  diff(other: DV_DATE): DV_DURATION {
    // Note: Full implementation requires ISO8601 duration generation
    throw new Error("DV_DATE.diff requires ISO8601 parser - not yet fully implemented");
  }

  /**
   * True if this date object is less than \`_other_\`, based on comparison of \`_magnitude()_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_DATE): openehr_base.Boolean {
    // Compare ISO8601 date strings lexicographically (works for standard format)
    if (!this.value || !other.value) {
      return openehr_base.Boolean.from(false);
    }
    return openehr_base.Boolean.from(this.value < other.value);
  }

  /**
   * True, for any two Dates.
   * @param other - Parameter
   * @returns Result value
   */
  is_strictly_comparable_to(other: DV_ORDERED): openehr_base.Boolean {
    // Dates are strictly comparable with other dates
    return openehr_base.Boolean.from(other instanceof DV_DATE);
  }

  /**
   * Value equality comparison.
   * @param other - The other object to compare with
   * @returns Boolean wrapper indicating equality
   */
  is_equal(other: DV_QUANTIFIED): openehr_base.Boolean {
    if (!(other instanceof DV_DATE)) {
      return openehr_base.Boolean.from(false);
    }
    // Basic implementation: compare values
    return openehr_base.Boolean.from(this.value === other.value);
  }
}

/**
 * Represents an absolute point in time from an origin usually interpreted as meaning the start of the current day, specified to a fraction of a second. Semantics defined by ISO 8601.
 *
 * Used for recording real world times, rather than scientifically measured fine amounts of time. The partial form is used for approximate times of events and substance administrations.
 */
export class DV_TIME extends DV_TEMPORAL {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: openehr_base.String;

  /**
   * ISO8601 time string
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value.
   * Use this to access openehr_base.String methods.
   */
  get $value(): openehr_base.String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.String wrapper.
   */
  set value(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = openehr_base.String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * Numeric value of the time as seconds since the start of day, i.e. \`00:00:00\`.
   * @returns Result value
   */
  magnitude(): number {
    // TODO: Implement magnitude behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method magnitude not yet implemented.");
  }

  /**
   * Addition of a Duration to this Time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff: DV_DURATION): DV_TIME {
    // Note: Full implementation requires ISO8601 duration parsing and time arithmetic
    throw new Error("DV_TIME.add requires ISO8601 parser - not yet fully implemented");
  }

  /**
   * Subtract a Duration from this Time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract(a_diff: DV_DURATION): DV_TIME {
    // Note: Full implementation requires ISO8601 duration parsing and time arithmetic
    throw new Error("DV_TIME.subtract requires ISO8601 parser - not yet fully implemented");
  }

  /**
   * Difference between this Time and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  diff(other: DV_TIME): DV_DURATION {
    // Note: Full implementation requires ISO8601 duration generation
    throw new Error("DV_TIME.diff requires ISO8601 parser - not yet fully implemented");
  }

  /**
   * True if this time object is less than \`_other_\`, based on comparison of \`_magnitude()_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_TIME): openehr_base.Boolean {
    // Compare ISO8601 time strings lexicographically (works for standard format)
    if (!this.value || !other.value) {
      return openehr_base.Boolean.from(false);
    }
    return openehr_base.Boolean.from(this.value < other.value);
  }

  /**
   * True, for any two Times.
   * @param other - Parameter
   * @returns Result value
   */
  is_strictly_comparable_to(other: DV_ORDERED): openehr_base.Boolean {
    // Times are strictly comparable with other times
    return openehr_base.Boolean.from(other instanceof DV_TIME);
  }

  /**
   * Value equality comparison.
   * @param other - The other object to compare with
   * @returns Boolean wrapper indicating equality
   */
  is_equal(other: DV_QUANTIFIED): openehr_base.Boolean {
    if (!(other instanceof DV_TIME)) {
      return openehr_base.Boolean.from(false);
    }
    // Basic implementation: compare values
    return openehr_base.Boolean.from(this.value === other.value);
  }
}

/**
 * Represents an absolute point in time, specified to the second. Semantics defined by ISO 8601.
 *
 * Used for recording a precise point in real world time, and for approximate time stamps, e.g. the origin of a \`HISTORY\` in an \`OBSERVATION\` which is only partially known.
 */
export class DV_DATE_TIME extends DV_TEMPORAL {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: openehr_base.String;

  /**
   * ISO8601 date/time string.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value.
   * Use this to access openehr_base.String methods.
   */
  get $value(): openehr_base.String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.String wrapper.
   */
  set value(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = openehr_base.String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * Numeric value of the date/time as seconds since the calendar origin date/time \`0001-01-01T00:00:00Z\`.
   *
   * @returns Result value
   */
  magnitude(): number {
    // TODO: Implement magnitude behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method magnitude not yet implemented.");
  }

  /**
   * Addition of a Duration to this Date/time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff: DV_DURATION): DV_DATE_TIME {
    // Note: Full implementation requires ISO8601 duration parsing and datetime arithmetic
    throw new Error("DV_DATE_TIME.add requires ISO8601 parser - not yet fully implemented");
  }

  /**
   * Subtract a Duration from this Date/time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract(a_diff: DV_DURATION): DV_DATE_TIME {
    // Note: Full implementation requires ISO8601 duration parsing and datetime arithmetic
    throw new Error("DV_DATE_TIME.subtract requires ISO8601 parser - not yet fully implemented");
  }

  /**
   * Difference between this Date/time and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  diff(other: DV_DATE_TIME): DV_DURATION {
    // Note: Full implementation requires ISO8601 duration generation
    throw new Error("DV_DATE_TIME.diff requires ISO8601 parser - not yet fully implemented");
  }

  /**
   * True if this date-time object is less than \`_other_\`, based on comparison of \`_magnitude()_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: DV_DATE_TIME): openehr_base.Boolean {
    // Compare ISO8601 datetime strings lexicographically (works for standard format)
    if (!this.value || !other.value) {
      return openehr_base.Boolean.from(false);
    }
    return openehr_base.Boolean.from(this.value < other.value);
  }

  /**
   * True, for any two Date/times.
   * @param other - Parameter
   * @returns Result value
   */
  is_strictly_comparable_to(other: DV_ORDERED): openehr_base.Boolean {
    // Date/times are strictly comparable with other date/times
    return openehr_base.Boolean.from(other instanceof DV_DATE_TIME);
  }

  /**
   * Value equality comparison.
   * @param other - The other object to compare with
   * @returns Boolean wrapper indicating equality
   */
  is_equal(other: DV_QUANTIFIED): openehr_base.Boolean {
    if (!(other instanceof DV_DATE_TIME)) {
      return openehr_base.Boolean.from(false);
    }
    // Basic implementation: compare values
    return openehr_base.Boolean.from(this.value === other.value);
  }
}

/**
 * This is an abstract class of which all timing specifications are specialisations. Specifies points in time, possibly linked to the calendar, or a real world repeating event, such as  breakfast.
 */
export abstract class DV_TIME_SPECIFICATION extends DATA_VALUE {
  /**
   * The specification, in the HL7v3 syntax for \`PIVL\` or \`EIVL\` types.
   */
  value?: DV_PARSABLE;
  /**
   * Indicates what prototypical point in the calendar the specification is aligned to, e.g.  5th of the month . Empty if not aligned. Extracted from the  value' attribute.
   * @returns Result value
   */
  abstract calendar_alignment(): openehr_base.String;

  /**
   * Indicates what real-world event the specification is aligned to if any. Extracted from the  value' attribute.
   * @returns Result value
   */
  abstract event_alignment(): openehr_base.String;

  /**
   * Indicates if the specification is aligned with institution schedules, e.g. a hospital nursing changeover or meal serving times. Extracted from the  value' attribute.
   * @returns Result value
   */
  abstract institution_specified(): openehr_base.Boolean;
}

/**
 * Specifies periodic points in time, linked to the calendar (phase-linked), or a real world repeating event, such as  breakfast  (event-linked). Based on the HL7v3 data types \`PIVL<T>\` and \`EIVL<T>\`.
 *
 * Used in therapeutic prescriptions, expressed as \`INSTRUCTIONs\` in the openEHR model.
 */
export class DV_PERIODIC_TIME_SPECIFICATION extends DV_TIME_SPECIFICATION {
  /**
   * The period of the repetition, computationally derived from the syntax representation. Extracted from the  value' attribute.
   * @returns Result value
   */
  period(): DV_DURATION {
    // TODO: Implement period behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method period not yet implemented.");
  }

  /**
   * Calendar alignment extracted from value.
   * @returns Result value
   */
  calendar_alignment(): openehr_base.String {
    // TODO: Implement calendar_alignment behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method calendar_alignment not yet implemented.");
  }

  /**
   * Event alignment extracted from value.
   * @returns Result value
   */
  event_alignment(): openehr_base.String {
    // TODO: Implement event_alignment behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method event_alignment not yet implemented.");
  }

  /**
   * Extracted from value.
   * @returns Result value
   */
  institution_specified(): openehr_base.Boolean {
    // TODO: Implement institution_specified behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method institution_specified not yet implemented.");
  }
}

/**
 * Specifies points in time in a general syntax. Based on the HL7v3 GTS data type.
 */
export class DV_GENERAL_TIME_SPECIFICATION extends DV_TIME_SPECIFICATION {
  /**
   * Calendar alignment extracted from value.
   * @returns Result value
   */
  calendar_alignment(): openehr_base.String {
    // TODO: Implement calendar_alignment behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method calendar_alignment not yet implemented.");
  }

  /**
   * Event alignment extracted from value.
   * @returns Result value
   */
  event_alignment(): openehr_base.String {
    // TODO: Implement event_alignment behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method event_alignment not yet implemented.");
  }

  /**
   * Extracted from value.
   * @returns Result value
   */
  institution_specified(): openehr_base.Boolean {
    // TODO: Implement institution_specified behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method institution_specified not yet implemented.");
  }
}

/**
 * A reference to an object which structurally conforms to the Universal Resource Identifier (URI) RFC-3986 standard. The reference is contained in the \`_value_\` attribute, which is a \`String\`. So-called 'plain-text URIs' that contain RFC-3986 forbidden characters such as spaces etc, are allowed on the basis that they need to be RFC-3986 encoded prior to use in e.g. REST APIs or other contexts relying on machine-level conformance.
 */
export class DV_URI extends DATA_VALUE {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: openehr_base.String;

  /**
   * Value of URI as a String. 'Plain-text' URIs are allowed, enabling better readability, but must be RFC-3986 encoded in use.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for value.
   * Use this to access openehr_base.String methods.
   */
  get $value(): openehr_base.String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or openehr_base.String wrapper.
   */
  set value(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = openehr_base.String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * A distributed information 'space' in which  information objects  exist. The scheme simultaneously specifies an information space and a mechanism for accessing objects in  that  space.  For  example  if  scheme  = "ftp", it identifies the information space in which  all  ftp-able objects  exist,  and also the application - ftp - which can be used to access them. Values may include: "ftp", "telnet", "mailto", etc. Refer to RFC-3986 for a full list.
   *
   * @returns Result value
   */
  scheme(): openehr_base.String {
    // TODO: Implement scheme behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method scheme not yet implemented.");
  }

  /**
   * A string whose format is  a  function  of  the  scheme. Identifies   the   location  in  <scheme>-space  of  an information entity. Typical values include hierarchical directory  paths  for  any  machine.  For example, with scheme = "ftp", path might be \`"/pub/images/image_01"\`. The strings "." and ".." are reserved for use in the path. Paths may include internet/intranet location identifiers of the form: \`sub_domain...domain\`, e.g. \`"info.cern.ch"\`.
   * @returns Result value
   */
  path(): openehr_base.String {
    // TODO: Implement path behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method path not yet implemented.");
  }

  /**
   * A part of, a  fragment  or  a  sub-function  within  an object. Allows references to sub-parts of objects, such as a certain line and character  position  in  a  text object. The  syntax  and semantics are defined by the application responsible for the object.
   *
   * @returns Result value
   */
  fragment_id(): openehr_base.String {
    // TODO: Implement fragment_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method fragment_id not yet implemented.");
  }

  /**
   * Query string to send to application implied  by  scheme and  path.  Enables  queries  to applications, including databases  to  be  included in  the  URI. Supports any query meaningful to the server, including SQL.
   *
   * @returns Result value
   */
  query(): openehr_base.String {
    // TODO: Implement query behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method query not yet implemented.");
  }
}

/**
 * A \`DV_EHR_URI\` is a \`DV_URI\` which has the scheme name 'ehr', and which can only reference items in EHRs.
 *
 * Used to reference items in an EHR, which may be the same as the current EHR (containing this link), or another.
 */
export class DV_EHR_URI extends DV_URI {
}

/**
 * List of identifiers for groups in the openEHR terminology.
 */
export class OPENEHR_TERMINOLOGY_GROUP_IDENTIFIERS {
  /**
   * Validity function to test if an identifier is in the set defined by this class.
   * @param an_id - Parameter
   * @returns Result value
   */
  valid_terminology_group_id(
    an_id: openehr_base.Boolean,
  ): openehr_base.Boolean {
    // TODO: Implement valid_terminology_group_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method valid_terminology_group_id not yet implemented.");
  }
}

/**
 * List of identifiers for code sets in the openEHR terminology.
 */
export class OPENEHR_CODE_SET_IDENTIFIERS {
  /**
   * Validity function to test if an identifier is in the set defined by this class.
   * @param an_id - Parameter
   * @returns Result value
   */
  valid_code_set_id(an_id: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement valid_code_set_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method valid_code_set_id not yet implemented.");
  }
}

/**
 * Defines an object providing proxy access to a terminology service.
 */
export class TERMINOLOGY_SERVICE extends OPENEHR_TERMINOLOGY_GROUP_IDENTIFIERS {
  /**
   * Return an interface to the terminology named name. Allowable names include:-
   *
   * * openehr,
   * * centc251,
   * * any name from are taken from the US NLM UMLS meta-data list at http://www.nlm.nih.gov/research/umls/metaa1.html
   * @param name - Parameter
   * @returns Result value
   */
  terminology(name: openehr_base.String): TERMINOLOGY_ACCESS {
    // TODO: Implement terminology behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method terminology not yet implemented.");
  }

  /**
   * Return an interface to the code_set identified by the external identifier name (e.g.  ISO_639-1).
   * @param name - Parameter
   * @returns Result value
   */
  code_set(name: openehr_base.String): CODE_SET_ACCESS {
    // TODO: Implement code_set behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method code_set not yet implemented.");
  }

  /**
   * Return an interface to the code_set identified internally in openEHR by id.
   *
   * @param id - Parameter
   * @returns Result value
   */
  code_set_for_id(id: openehr_base.String): CODE_SET_ACCESS {
    // TODO: Implement code_set_for_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method code_set_for_id not yet implemented.");
  }

  /**
   * True if terminology named name known by this service. Allowable names include:-
   *
   * *  openehr
   * * centc251
   * * any name from are taken from the US NLM UMLS meta-data list at       http://www.nlm.nih.gov/research/umls/metaa1.html
   * @param name - Parameter
   * @returns Result value
   */
  has_terminology(name: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement has_terminology behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_terminology not yet implemented.");
  }

  /**
   * True if code_set linked to internal name (e.g. languages ) is available.
   * @param name - Parameter
   * @returns Result value
   */
  has_code_set(name: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement has_code_set behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_code_set not yet implemented.");
  }

  /**
   * Set of all terminology identifiers known in the terminology service. Values from the US NLM UMLS meta-data list at:- http://www.nlm.nih.gov/research/umls/metaa1.html
   * @returns Result value
   */
  terminology_identifiers(): openehr_base.String {
    // TODO: Implement terminology_identifiers behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method terminology_identifiers not yet implemented.");
  }

  /**
   * Set of all code set identifiers known in the terminology service.
   *
   * @returns Result value
   */
  openehr_code_sets(): undefined {
    // TODO: Implement openehr_code_sets behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method openehr_code_sets not yet implemented.");
  }

  /**
   * Set of all code sets identifiers for which there is an internal openEHR name; returned as a Map of ids keyed by internal name.
   * @returns Result value
   */
  code_set_identifiers(): openehr_base.String {
    // TODO: Implement code_set_identifiers behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method code_set_identifiers not yet implemented.");
  }
}

/**
 * Defines an object providing proxy access to a measurement information service.
 */
export class MEASUREMENT_SERVICE {
  /**
   * True if the units string  units' is a valid string according to the HL7 UCUM specification.
   * @param units - Parameter
   * @returns Result value
   */
  is_valid_units_string(units: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement is_valid_units_string behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method is_valid_units_string not yet implemented.");
  }

  /**
   * True if two units strings correspond to the same measured property.
   * @param units1 - Parameter
   * @param units2 - Parameter
   * @returns Result value
   */
  units_equivalent(
    units1: openehr_base.String,
    units2: openehr_base.String,
  ): openehr_base.Boolean {
    // TODO: Implement units_equivalent behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method units_equivalent not yet implemented.");
  }
}

/**
 * A mixin class providing access to services in the external environment.
 */
export abstract class EXTERNAL_ENVIRONMENT_ACCESS extends TERMINOLOGY_SERVICE {
}

/**
 * Defines an object providing proxy access to a code_set.
 */
export class CODE_SET_ACCESS {
  /**
   * External identifier of this code set.
   * @returns Result value
   */
  id(): openehr_base.String {
    // TODO: Implement id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method id not yet implemented.");
  }

  /**
   * Return all codes known in this code set.
   * @returns Result value
   */
  all_codes(): CODE_PHRASE {
    // TODO: Implement all_codes behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method all_codes not yet implemented.");
  }

  /**
   * True if code set knows about 'a_lang' .
   * @param a_lang - Parameter
   * @returns Result value
   */
  has_lang(a_lang: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement has_lang behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_lang not yet implemented.");
  }

  /**
   * True if code set knows about  'a_code'.
   * @param a_code - Parameter
   * @returns Result value
   */
  has_code(a_code: openehr_base.String): openehr_base.Boolean {
    // TODO: Implement has_code behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_code not yet implemented.");
  }
}

/**
 * Defines an object providing proxy access to a terminology.
 */
export class TERMINOLOGY_ACCESS {
  /**
   * Identification of this Terminology.
   * @returns Result value
   */
  id(): openehr_base.String {
    // TODO: Implement id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method id not yet implemented.");
  }

  /**
   * Return all codes known in this terminology.
   * @returns Result value
   */
  all_codes(): CODE_PHRASE {
    // TODO: Implement all_codes behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method all_codes not yet implemented.");
  }

  /**
   * Return all codes under grouper 'a_group_id' from this terminology.
   * @param a_group_id - Parameter
   * @returns Result value
   */
  codes_for_group_id(a_group_id: openehr_base.String): CODE_PHRASE {
    // TODO: Implement codes_for_group_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method codes_for_group_id not yet implemented.");
  }

  /**
   * Return all codes under grouper whose name in 'a_lang' is 'a_name' from this terminology.
   * @param a_lang - Parameter
   * @param a_name - Parameter
   * @returns Result value
   */
  codes_for_group_name(
    a_lang: openehr_base.String,
    a_name: openehr_base.String,
  ): CODE_PHRASE {
    // TODO: Implement codes_for_group_name behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method codes_for_group_name not yet implemented.");
  }

  /**
   * True if  a_code' is known in group  group_id' in the openEHR terminology.
   * @returns Result value
   */
  has_code_for_group_id(): openehr_base.Boolean {
    // TODO: Implement has_code_for_group_id behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method has_code_for_group_id not yet implemented.");
  }

  /**
   * Return all rubric of code  code' in language  lang'.
   * @param a_code - Parameter
   * @returns Result value
   */
  rubric_for_code(a_code: openehr_base.String): openehr_base.String {
    // TODO: Implement rubric_for_code behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method rubric_for_code not yet implemented.");
  }
}

/**
 * The EHR object is the root object and access point of an EHR for a subject of care.
 */
export class EHR {
  /**
   * The identifier of the logical EHR management system in which this EHR was created.
   */
  system_id?: openehr_base.HIER_OBJECT_ID;
  /**
   * The unique identifier of this EHR.
   *
   * NOTE: is is strongly recommended that a UUID always be used for this field.
   */
  ehr_id?: openehr_base.HIER_OBJECT_ID;
  /**
   * List of contributions causing changes to this EHR. Each contribution contains a list of versions, which may include references to any number of \`VERSION\` instances, i.e. items of type \`VERSIONED_COMPOSITION\` and \`VERSIONED_FOLDER\`.
   */
  contributions?: undefined;
  /**
   * Reference to \`EHR_STATUS\` object for this EHR.
   */
  ehr_status?: openehr_base.OBJECT_REF;
  /**
   * Reference to \`EHR_ACCESS\` object for this EHR.
   */
  ehr_access?: openehr_base.OBJECT_REF;
  /**
   * Master list of all Versioned Composition references in this EHR.
   */
  compositions?: undefined;
  /**
   * Optional directory structure for this EHR. If present, this is a reference to the first member of \`_folders_\`.
   */
  directory?: openehr_base.OBJECT_REF;
  /**
   * Time of creation of the EHR.
   */
  time_created?: DV_DATE_TIME;
  /**
   * Optional additional Folder structures for this EHR. If set, the \`_directory_\` attribute refers to the first member.
   */
  folders?: undefined;
  /**
   * Optional list of tags associated with this EHR. Tag \`_target_\` values can only be within the same EHR.
   */
  tags?: undefined;
}

/**
 * Version container for \`EHR_ACCESS\` instance.
 */
export class VERSIONED_EHR_ACCESS extends VERSIONED_OBJECT<T> {
}

/**
 * Version container for \`EHR_STATUS\` instance.
 */
export class VERSIONED_EHR_STATUS extends VERSIONED_OBJECT<T> {
}

/**
 * Version-controlled composition abstraction, defined by inheriting \`VERSIONED_OBJECT<COMPOSITION>\`.
 */
export class VERSIONED_COMPOSITION extends VERSIONED_OBJECT<T> {
  /**
   * Indicates whether this composition set is persistent; derived from first version.
   * @returns Result value
   */
  is_persistent(): openehr_base.Boolean {
    // Note: Should check the first version's composition.is_persistent()
    // This requires version management infrastructure
    throw new Error("VERSIONED_COMPOSITION.is_persistent requires version retrieval - not yet fully implemented");
  }
}

/**
 * EHR-wide access control object. All access decisions to data in the EHR must be made in accordance with the policies and rules in this object.
 *
 * NOTE: It is strongly recommended that the inherited attribute \`_uid_\` be populated in \`EHR_ACCESS\` objects, using the UID copied from the \`_object_id()_\` of the \`_uid_\` field of the enclosing \`VERSION\` object. +
 * For example, the \`ORIGINAL_VERSION.uid\` \`87284370-2D4B-4e3d-A3F3-F303D2F4F34B::uk.nhs.ehr1::2\` would be copied to the \`_uid_\` field of the \`EHR_ACCESS\` object.
 */
export class EHR_ACCESS extends LOCATABLE {
  /**
   * Access control settings for the EHR. Instance is a subtype of the type \`ACCESS_CONTROL_SETTINGS\`, allowing for the use of different access control schemes.
   */
  settings?: ACCESS_CONTROL_SETTINGS;
  /**
   * The name of the access control scheme in use; corresponds to the concrete instance of the settings attribute.
   * @returns Result value
   */
  scheme(): openehr_base.String {
    // TODO: Implement scheme behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method scheme not yet implemented.");
  }
}

/**
 * Single object per EHR containing various EHR-wide status flags and settings, including whether this EHR can be queried, modified etc. This object is always modifiable, in order to change the status of the EHR as a whole.
 *
 * NOTE: It is strongly recommended that the inherited attribute \`_uid_\` be populated in \`EHR_STATUS\` objects, using the UID copied from the \`_object_id()_\` of the \`_uid_\` field of the enclosing \`VERSION\` object. +
 * For example, the \`ORIGINAL_VERSION.uid\` \`87284370-2D4B-4e3d-A3F3-F303D2F4F34B::uk.nhs.ehr1::2\`  would be copied to the \`_uid_\` field of the \`EHR_STATUS\` object.
 */
export class EHR_STATUS extends LOCATABLE {
  /**
   * The subject of this EHR. The \`_external_ref_\` attribute can be used to contain a direct reference to the subject in a demographic or identity service. Alternatively, the association between patients and their records may be done elsewhere for security reasons.
   */
  subject?: PARTY_SELF;
  /**
   * Internal storage for is_queryable
   * @protected
   */
  protected _is_queryable?: openehr_base.Boolean;

  /**
   * True if this EHR should be included in population queries, i.e. if this EHR is considered active in the population.
   */
  get is_queryable(): boolean | undefined {
    return this._is_queryable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_queryable.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_queryable(): openehr_base.Boolean | undefined {
    return this._is_queryable;
  }

  /**
   * Sets is_queryable from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_queryable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_queryable = undefined;
    } else if (typeof val === "boolean") {
      this._is_queryable = openehr_base.Boolean.from(val);
    } else {
      this._is_queryable = val;
    }
  }

  /**
   * Internal storage for is_modifiable
   * @protected
   */
  protected _is_modifiable?: openehr_base.Boolean;

  /**
   * True if the EHR, other than the \`EHR_STATUS\` object, is allowed to be written to. The \`EHR_STATUS\` object itself can always be written to.
   */
  get is_modifiable(): boolean | undefined {
    return this._is_modifiable?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_modifiable.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_modifiable(): openehr_base.Boolean | undefined {
    return this._is_modifiable;
  }

  /**
   * Sets is_modifiable from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_modifiable(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_modifiable = undefined;
    } else if (typeof val === "boolean") {
      this._is_modifiable = openehr_base.Boolean.from(val);
    } else {
      this._is_modifiable = val;
    }
  }

  /**
   * Any other details of the EHR summary object, in the form of an archetyped \`ITEM_STRUCTURE\`.
   */
  other_details?: ITEM_STRUCTURE;
}

/**
 * Access Control Settings for the EHR and components. Intended to support multiple access control schemes. Currently implementation dependent.
 */
export abstract class ACCESS_CONTROL_SETTINGS {
}

/**
 * Generic model of an Extract of some information from a repository.
 */
export class EXTRACT extends LOCATABLE {
  /**
   * The content extracted and serialised from the source repository for this Extract.
   */
  chapters?: undefined;
  /**
   * The specification that this Extract actually conforms to; might not be identical with the specification of the corresponding request.
   */
  specification?: EXTRACT_SPEC;
  /**
   * Reference to causing Request, if any.
   */
  request_id?: openehr_base.HIER_OBJECT_ID;
  /**
   * Creation time of this Extract
   */
  time_created?: DV_DATE_TIME;
  /**
   * Identifier of creating system.
   */
  system_id?: openehr_base.HIER_OBJECT_ID;
  /**
   * Internal storage for sequence_nr
   * @protected
   */
  protected _sequence_nr?: openehr_base.Integer;

  /**
   * Number of this Extract response in sequence of responses to Extract request identified by \`_request_id_\`. If this is the sole response, or there was no request, value is 1.
   */
  get sequence_nr(): number | undefined {
    return this._sequence_nr?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for sequence_nr.
   * Use this to access openehr_base.Integer methods.
   */
  get $sequence_nr(): openehr_base.Integer | undefined {
    return this._sequence_nr;
  }

  /**
   * Sets sequence_nr from either a primitive value or openehr_base.Integer wrapper.
   */
  set sequence_nr(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._sequence_nr = undefined;
    } else if (typeof val === "number") {
      this._sequence_nr = openehr_base.Integer.from(val);
    } else {
      this._sequence_nr = val;
    }
  }

  /**
   * Participations relevant to the creation of this Extract.
   */
  participations?: undefined;
}

/**
 * Generic model of a Request for an Extract, containing an Extract specification.
 */
export class EXTRACT_ACTION_REQUEST extends LOCATABLE {
  /**
   * Identifier of previous \`EXTRACT_REQUEST\`.
   */
  request_id?: openehr_base.OBJECT_REF;
  override uid?: openehr_base.HIER_OBJECT_ID = undefined;
  /**
   * Requested action: \`cancel | resend | send new\`. Coded by openEHR Terminology group \`'extract action type'\`.
   */
  action?: DV_CODED_TEXT;
}

/**
 * One content chapter of an Extract; contains information relating to only one entity.
 */
export class EXTRACT_CHAPTER extends LOCATABLE {
  /**
   * The information content of this chapter.
   */
  items?: undefined;
}

/**
 * Abstract parent of Extract Folder and Content types.
 */
export abstract class EXTRACT_ITEM extends LOCATABLE {
}

/**
 * Abstract model of a wrapper for one content item in an Extract, containing various meta-data. Indicates whether it was part of the primary set and what its original path was. Intended to be subtyped for wrappers of specific types of content.
 */
export abstract class EXTRACT_CONTENT_ITEM extends EXTRACT_ITEM {
  /**
   * Internal storage for is_primary
   * @protected
   */
  protected _is_primary?: openehr_base.Boolean;

  /**
   * True if the content item carried in this container was part of the primary set for the Extract, i.e. not added due to link-following.
   */
  get is_primary(): boolean | undefined {
    return this._is_primary?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_primary.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_primary(): openehr_base.Boolean | undefined {
    return this._is_primary;
  }

  /**
   * Sets is_primary from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_primary(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_primary = undefined;
    } else if (typeof val === "boolean") {
      this._is_primary = openehr_base.Boolean.from(val);
    } else {
      this._is_primary = val;
    }
  }

  /**
   * Internal storage for is_changed
   * @protected
   */
  protected _is_changed?: openehr_base.Boolean;

  /**
   * True if the content item carried in this container is any kind of change since last send, in repeat sending situations.
   */
  get is_changed(): boolean | undefined {
    return this._is_changed?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_changed.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_changed(): openehr_base.Boolean | undefined {
    return this._is_changed;
  }

  /**
   * Sets is_changed from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_changed(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_changed = undefined;
    } else if (typeof val === "boolean") {
      this._is_changed = openehr_base.Boolean.from(val);
    } else {
      this._is_changed = val;
    }
  }

  /**
   * Internal storage for is_masked
   * @protected
   */
  protected _is_masked?: openehr_base.Boolean;

  /**
   * True if the content of this item has not been included due to insufficient access rights of requestor.
   */
  get is_masked(): boolean | undefined {
    return this._is_masked?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for is_masked.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_masked(): openehr_base.Boolean | undefined {
    return this._is_masked;
  }

  /**
   * Sets is_masked from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_masked(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_masked = undefined;
    } else if (typeof val === "boolean") {
      this._is_masked = openehr_base.Boolean.from(val);
    } else {
      this._is_masked = val;
    }
  }

  /**
   * Content object.
   */
  item?: openehr_base.Any;
}

/**
 * Type of chapter that contains information relating to a single demographic entity.
 */
export class EXTRACT_ENTITY_CHAPTER extends EXTRACT_CHAPTER {
  /**
   * Internal storage for extract_id_key
   * @protected
   */
  protected _extract_id_key?: openehr_base.String;

  /**
   * Reference to entity, usually a demographic entity such as a patient that the content of this chapter relates to.
   */
  get extract_id_key(): string | undefined {
    return this._extract_id_key?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for extract_id_key.
   * Use this to access openehr_base.String methods.
   */
  get $extract_id_key(): openehr_base.String | undefined {
    return this._extract_id_key;
  }

  /**
   * Sets extract_id_key from either a primitive value or openehr_base.String wrapper.
   */
  set extract_id_key(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._extract_id_key = undefined;
    } else if (typeof val === "string") {
      this._extract_id_key = openehr_base.String.from(val);
    } else {
      this._extract_id_key = val;
    }
  }
}

/**
 * The manifest for one entity (e.g. EHR subject), identifying the entity and optionally specifying top-level items to be included in the Extract. The list actually included may be modified by the \`_version_spec_\` part of the specification, and also by the link_depth attribute. In repeat (standing order) requests, the final inclusion may be modified by the send_changes_only value for \`EXTRACT_UPDATE_SPEC._update_method_\`.
 *
 * Various identifiers may be provided for the entity; these are to be used by the receiver system to locate the entity. The \`_extract_id_key_\` attribute is used to record the identifier that will be used throughout the Extract for this entity, including in instances of \`EXTRACT_ENTITY_IDENTIFIER\`.
 */
export class EXTRACT_ENTITY_MANIFEST {
  /**
   * Internal storage for extract_id_key
   * @protected
   */
  protected _extract_id_key?: openehr_base.String;

  /**
   * Identifier by which this entity is known in the Extract. May be one of the other identifiers, e.g. ehr_id or subject_id, or it may be something else, including a simple integer.
   */
  get extract_id_key(): string | undefined {
    return this._extract_id_key?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for extract_id_key.
   * Use this to access openehr_base.String methods.
   */
  get $extract_id_key(): openehr_base.String | undefined {
    return this._extract_id_key;
  }

  /**
   * Sets extract_id_key from either a primitive value or openehr_base.String wrapper.
   */
  set extract_id_key(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._extract_id_key = undefined;
    } else if (typeof val === "string") {
      this._extract_id_key = openehr_base.String.from(val);
    } else {
      this._extract_id_key = val;
    }
  }

  /**
   * Internal storage for ehr_id
   * @protected
   */
  protected _ehr_id?: openehr_base.String;

  /**
   * EHR / EMR identifier for the entity at the target system.
   */
  get ehr_id(): string | undefined {
    return this._ehr_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for ehr_id.
   * Use this to access openehr_base.String methods.
   */
  get $ehr_id(): openehr_base.String | undefined {
    return this._ehr_id;
  }

  /**
   * Sets ehr_id from either a primitive value or openehr_base.String wrapper.
   */
  set ehr_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._ehr_id = undefined;
    } else if (typeof val === "string") {
      this._ehr_id = openehr_base.String.from(val);
    } else {
      this._ehr_id = val;
    }
  }

  /**
   * Internal storage for subject_id
   * @protected
   */
  protected _subject_id?: openehr_base.String;

  /**
   * Subject (i.e. patient or similar) identifier for the entity at the target system.
   */
  get subject_id(): string | undefined {
    return this._subject_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for subject_id.
   * Use this to access openehr_base.String methods.
   */
  get $subject_id(): openehr_base.String | undefined {
    return this._subject_id;
  }

  /**
   * Sets subject_id from either a primitive value or openehr_base.String wrapper.
   */
  set subject_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._subject_id = undefined;
    } else if (typeof val === "string") {
      this._subject_id = openehr_base.String.from(val);
    } else {
      this._subject_id = val;
    }
  }

  /**
   * Other identifiers that may be used to find the entity at the target system, keyed by type. May include medicare numbers, drivers license number, tax number etc.
   */
  other_ids?: undefined;
  /**
   * List of Uids of items to be included in the Extract, in cases where individual items are being requested by id. More typically, this attribute is not used, and the \`EXTRACT_SPEC._criteria query_\` defines the Extract contents. If set, for openEHR data, these are Uids identifying the version containers.
   */
  item_list?: undefined;
}

export class EXTRACT_ERROR {
  request_id?: openehr_base.OBJECT_REF;
  reason?: DV_TEXT;
}

/**
 * Folder in local Folder structure in an Extract. Empty Folders are allowed.
 */
export class EXTRACT_FOLDER extends EXTRACT_ITEM {
  /**
   * List of Folders and content items in this Folder.
   */
  items?: undefined;
}

/**
 * Specification of the candidate entities and optionally top-level items (e.g. Compositions) to be included in the Extract.
 */
export class EXTRACT_MANIFEST {
  /**
   * List of entity manifests uids of items included in the Extract; for openEHR data, these are uids identifying the version containers.
   */
  entities?: undefined;
}

/**
 * Model of a participation of a Party (any Actor or Role) in an activity.  Used to represent any participation of a Party in some activity, which is not  explicitly in the model, e.g. assisting nurse. Can be used to record past or  future participations.
 *
 * Should not be used in place of more permanent relationships between demographic entities.
 */
export class EXTRACT_PARTICIPATION {
  /**
   * The time interval during which the participation took place, if it is used in an observational context (i.e. recording facts about the past); or the intended time interval of the participation when used in future contexts, such as EHR Instructions.
   */
  time?: undefined;
  /**
   * The function of the Party in this participation (note that a given party might participate in more than one way in a particular activity). This attribute should be coded, but cannot be limited to the HL7v3:ParticipationFunction vocabulary, since it is too limited and hospital-oriented.
   */
  function?: DV_TEXT;
  /**
   * The mode of the performer / activity interaction, e.g. present, by telephone, by email etc.
   */
  mode?: DV_CODED_TEXT;
  /**
   * Internal storage for performer
   * @protected
   */
  protected _performer?: openehr_base.String;

  /**
   * Uid of demographic entity within Extract who performed this participation.
   */
  get performer(): string | undefined {
    return this._performer?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for performer.
   * Use this to access openehr_base.String methods.
   */
  get $performer(): openehr_base.String | undefined {
    return this._performer;
  }

  /**
   * Sets performer from either a primitive value or openehr_base.String wrapper.
   */
  set performer(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._performer = undefined;
    } else if (typeof val === "string") {
      this._performer = openehr_base.String.from(val);
    } else {
      this._performer = val;
    }
  }
}

/**
 * Generic model of a Request for an Extract, containing an Extract specification.
 */
export class EXTRACT_REQUEST extends LOCATABLE {
  /**
   * Specification details of the request.
   */
  extract_spec?: EXTRACT_SPEC;
  /**
   * Update details of the request.
   */
  update_spec?: EXTRACT_UPDATE_SPEC;
  /**
   * Identifier of this Request, generated by requestor.
   */
  override uid?: openehr_base.HIER_OBJECT_ID = undefined;
}

/**
 * Specification of an Extract's contents. Subtypes can be used to add details specific to the type of Extract. The specification consists of attributes specifying the directory, and two further groups of attributes in their own classes, namely a version specfication (which versions of information items are to be included) and a manifest (which entities are to be included in the extract).
 *
 * Use: Used in a request to specify an Extract, as well as to describe what is contained in an Extract.
 */
export class EXTRACT_SPEC {
  /**
   * Specification of which versions of information items to include in the Extract. If Void, the default is latest versions only (which is reasonable for non-versioning systems as well).
   */
  version_spec?: EXTRACT_VERSION_SPEC;
  /**
   * Specification of entities (e.g. records) to include in the Extract.
   */
  manifest?: EXTRACT_MANIFEST;
  /**
   * Coded term indicating the type of content required, e.g.
   *
   * * \`|openehr-ehr|\`
   * * \`|openehr-demographic|\`
   * * \`|generic-emr|\`
   * * \`|other|\`
   *
   * Coded by openEHR Terminology group \`'extract content type'\`.
   */
  extract_type?: DV_CODED_TEXT;
  /**
   * Internal storage for include_multimedia
   * @protected
   */
  protected _include_multimedia?: openehr_base.Boolean;

  /**
   * Indicates whether in-line instances of \`DV_MULTIMEDIA\` in the source data are included or not.
   */
  get include_multimedia(): boolean | undefined {
    return this._include_multimedia?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for include_multimedia.
   * Use this to access openehr_base.Boolean methods.
   */
  get $include_multimedia(): openehr_base.Boolean | undefined {
    return this._include_multimedia;
  }

  /**
   * Sets include_multimedia from either a primitive value or openehr_base.Boolean wrapper.
   */
  set include_multimedia(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._include_multimedia = undefined;
    } else if (typeof val === "boolean") {
      this._include_multimedia = openehr_base.Boolean.from(val);
    } else {
      this._include_multimedia = val;
    }
  }

  /**
   * Internal storage for priority
   * @protected
   */
  protected _priority?: openehr_base.Integer;

  /**
   * Requested priority of this request to be handled by server. Priority schemes are likely to be local, and use values agreed by both ends.
   *
   * TBD: alternative is standard coded terms
   */
  get priority(): number | undefined {
    return this._priority?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for priority.
   * Use this to access openehr_base.Integer methods.
   */
  get $priority(): openehr_base.Integer | undefined {
    return this._priority;
  }

  /**
   * Sets priority from either a primitive value or openehr_base.Integer wrapper.
   */
  set priority(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._priority = undefined;
    } else if (typeof val === "number") {
      this._priority = openehr_base.Integer.from(val);
    } else {
      this._priority = val;
    }
  }

  /**
   * Internal storage for link_depth
   * @protected
   */
  protected _link_depth?: openehr_base.Integer;

  /**
   * Degree of links to follow emanating from content items specified for inclusion. The kind of links to follow is dependent on the type of Extract.
   *
   * All items at the target end of followed links at the given depth are also included in the extract; \`EXTRACT_CONTENT_ITEM._is_primary_\` is used to differentiate.
   *
   * * 0 = don't follow;
   * * 1 = follow first degree links;
   * * 2 = follow 2nd degree links;
   * * ....
   * * n = follow nth degree links
   */
  get link_depth(): number | undefined {
    return this._link_depth?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for link_depth.
   * Use this to access openehr_base.Integer methods.
   */
  get $link_depth(): openehr_base.Integer | undefined {
    return this._link_depth;
  }

  /**
   * Sets link_depth from either a primitive value or openehr_base.Integer wrapper.
   */
  set link_depth(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._link_depth = undefined;
    } else if (typeof val === "number") {
      this._link_depth = openehr_base.Integer.from(val);
    } else {
      this._link_depth = val;
    }
  }

  /**
   * Queries specifying the contents of this Extract.
   */
  criteria?: undefined;
  /**
   * Other specification items. Archetypable.
   */
  other_details?: ITEM_STRUCTURE;
}

/**
 * Specification of the how the request should be processed by server. The request can be persisted in the server, meaning that a) it can be re-activated by the requesting system simply by indicating Request id, and b) that a changes-only pattern of Extract updates can be set up. To achieve this, the server has to remember what was sent in the previous response.
 *
 * The update mode may be event-driven and periodic update or a mixture of both. The candidate items to be sent each time are the result of re-evaluating the content and versioning parts of the specification; what is actually sent is determined by the \`_send_changes_only_\` flag.
 */
export class EXTRACT_UPDATE_SPEC {
  /**
   * Internal storage for persist_in_server
   * @protected
   */
  protected _persist_in_server?: openehr_base.Boolean;

  /**
   * If True, this Request is persisted in the server until further notice.
   */
  get persist_in_server(): boolean | undefined {
    return this._persist_in_server?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for persist_in_server.
   * Use this to access openehr_base.Boolean methods.
   */
  get $persist_in_server(): openehr_base.Boolean | undefined {
    return this._persist_in_server;
  }

  /**
   * Sets persist_in_server from either a primitive value or openehr_base.Boolean wrapper.
   */
  set persist_in_server(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._persist_in_server = undefined;
    } else if (typeof val === "boolean") {
      this._persist_in_server = openehr_base.Boolean.from(val);
    } else {
      this._persist_in_server = val;
    }
  }

  /**
   * Period for resending update Extracts in response to original Request.
   */
  repeat_period?: DV_DURATION;
  /**
   * Set of Event names that will cause sending of update Extracts. Event types include:
   *
   * * \`|any_change|\` - any change in content items matched by content specification, e.g. new versions of persistent compositions. If the content list allows matching of any, or a wide range of archetypes, this event type will match any additions to the record.
   * * \`|correction|\` - match error corrections only, including deletions.
   * * \`|update|\` - match updates (i.e. new versions) of included content items.
   *
   * Coded by openEHR Terminology group 'extract update trigger event type'.
   */
  trigger_events?: undefined;
  /**
   * Indicate mode of update. Can be: send only items that are changed (including logical deletions) or new since last send. For \`_persist_in_server_\` Requests only.
   */
  update_method?: CODE_PHRASE;
}

/**
 * Specification of what versions should be included in an Extract. By default, only latest versions are included in the Extract, in which case this part of the Extract specification is not needed at all. The attributes \`_include_all_versions_\` and \`_commit_time_interval_\` are used to modify this; the former forces all versions to be included; the latter limits the versions to be those latest versions committed in the time interval, or if \`_include_all_versions_\` is \`True\`, all versions committed in the time interval.
 */
export class EXTRACT_VERSION_SPEC {
  /**
   * Internal storage for include_all_versions
   * @protected
   */
  protected _include_all_versions?: openehr_base.Boolean;

  /**
   * True if all versions of each item in the Extract are included.
   */
  get include_all_versions(): boolean | undefined {
    return this._include_all_versions?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for include_all_versions.
   * Use this to access openehr_base.Boolean methods.
   */
  get $include_all_versions(): openehr_base.Boolean | undefined {
    return this._include_all_versions;
  }

  /**
   * Sets include_all_versions from either a primitive value or openehr_base.Boolean wrapper.
   */
  set include_all_versions(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._include_all_versions = undefined;
    } else if (typeof val === "boolean") {
      this._include_all_versions = openehr_base.Boolean.from(val);
    } else {
      this._include_all_versions = val;
    }
  }

  /**
   * Specifies commit time interval of items to source repository to include in Extract. By default, only latest versions whose commit times fall in the range are included. If include_all_versions is True, then the range includes all versions committed within the interval.
   */
  commit_time_interval?: undefined;
  /**
   * Internal storage for include_revision_history
   * @protected
   */
  protected _include_revision_history?: openehr_base.Boolean;

  /**
   * True if revision histories of the items in the Extract are included. If included, it is always the full revision history.
   */
  get include_revision_history(): boolean | undefined {
    return this._include_revision_history?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for include_revision_history.
   * Use this to access openehr_base.Boolean methods.
   */
  get $include_revision_history(): openehr_base.Boolean | undefined {
    return this._include_revision_history;
  }

  /**
   * Sets include_revision_history from either a primitive value or openehr_base.Boolean wrapper.
   */
  set include_revision_history(
    val: boolean | openehr_base.Boolean | undefined,
  ) {
    if (val === undefined || val === null) {
      this._include_revision_history = undefined;
    } else if (typeof val === "boolean") {
      this._include_revision_history = openehr_base.Boolean.from(val);
    } else {
      this._include_revision_history = val;
    }
  }

  /**
   * Internal storage for include_data
   * @protected
   */
  protected _include_data?: openehr_base.Boolean;

  /**
   * \`True\` if the data of items matched by the content spec should be included. This is the default. If \`False\`, only revision history is included in serialised versions. Turning this option on in openEHR systems causes \`X_VERSIONED_OBJECTs\` to have \`_revision_history_\` set, but versions Void. Useful for interrogating a server without having to look at any content data. In other systems it may or may not have a sensible meaning.
   */
  get include_data(): boolean | undefined {
    return this._include_data?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for include_data.
   * Use this to access openehr_base.Boolean methods.
   */
  get $include_data(): openehr_base.Boolean | undefined {
    return this._include_data;
  }

  /**
   * Sets include_data from either a primitive value or openehr_base.Boolean wrapper.
   */
  set include_data(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._include_data = undefined;
    } else if (typeof val === "boolean") {
      this._include_data = openehr_base.Boolean.from(val);
    } else {
      this._include_data = val;
    }
  }
}

/**
 * Form of \`EHR EXTRACT_ITEM\` containing openEHR serialised \`VERSIONED_OBJECTs\`.
 */
export class OPENEHR_CONTENT_ITEM extends EXTRACT_CONTENT_ITEM {
  /**
   * Content object.
   */
  override item?: X_VERSIONED_OBJECT = undefined;
}

/**
 * Variety of Extract content that consists is a sharable data-oriented version of \`VERSIONED_OBJECT<T>\`.
 */
export class X_VERSIONED_OBJECT<T> {
  /**
   * Uid of original \`VERSIONED_OBJECT\`.
   */
  uid?: openehr_base.HIER_OBJECT_ID;
  /**
   * Owner_id from original \`VERSIONED_OBJECT\`, which identifies source EHR.
   */
  owner_id?: openehr_base.OBJECT_REF;
  /**
   * Creation time of original \`VERSIONED_OBJECT\`.
   */
  time_created?: DV_DATE_TIME;
  /**
   * Internal storage for total_version_count
   * @protected
   */
  protected _total_version_count?: openehr_base.Integer;

  /**
   * Total number of versions in original \`VERSIONED_OBJECT\` at time of creation of this \`X_VERSIONED_OBJECT\`.
   */
  get total_version_count(): number | undefined {
    return this._total_version_count?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for total_version_count.
   * Use this to access openehr_base.Integer methods.
   */
  get $total_version_count(): openehr_base.Integer | undefined {
    return this._total_version_count;
  }

  /**
   * Sets total_version_count from either a primitive value or openehr_base.Integer wrapper.
   */
  set total_version_count(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._total_version_count = undefined;
    } else if (typeof val === "number") {
      this._total_version_count = openehr_base.Integer.from(val);
    } else {
      this._total_version_count = val;
    }
  }

  /**
   * Internal storage for extract_version_count
   * @protected
   */
  protected _extract_version_count?: openehr_base.Integer;

  /**
   * The number of Versions in this extract for this Versioned object, i.e. the count of items in the versions attribute. May be 0 if only revision history is requested.
   */
  get extract_version_count(): number | undefined {
    return this._extract_version_count?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for extract_version_count.
   * Use this to access openehr_base.Integer methods.
   */
  get $extract_version_count(): openehr_base.Integer | undefined {
    return this._extract_version_count;
  }

  /**
   * Sets extract_version_count from either a primitive value or openehr_base.Integer wrapper.
   */
  set extract_version_count(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._extract_version_count = undefined;
    } else if (typeof val === "number") {
      this._extract_version_count = openehr_base.Integer.from(val);
    } else {
      this._extract_version_count = val;
    }
  }

  /**
   * Optional revision history of the original \`VERSIONED_OBJECT\`. If included, it is the complete revision history.
   */
  revision_history?: REVISION_HISTORY;
  /**
   * 0 or more Versions from the original \`VERSIONED_OBJECT\`, according to the Extract specification.
   */
  versions?: undefined;
}

/**
 * Form of \`X_VERSIONED_OBJECT\` for \`EHR_ACCESS\` EHR object.
 */
export class X_VERSIONED_EHR_ACCESS extends X_VERSIONED_OBJECT<T> {
}

/**
 * Form of \`X_VERSIONED_OBJECT\` for \`EHR_STATUS\` EHR object.
 */
export class X_VERSIONED_EHR_STATUS extends X_VERSIONED_OBJECT<T> {
}

/**
 * Form of \`X_VERSIONED_OBJECT\` for \`COMPOSITION\` EHR object.
 */
export class X_VERSIONED_COMPOSITION extends X_VERSIONED_OBJECT<T> {
}

/**
 * Form of \`X_VERSIONED_OBJECT\` for \`FOLDER\` EHR object.
 */
export class X_VERSIONED_FOLDER extends X_VERSIONED_OBJECT<T> {
}

/**
 * Form of \`X_VERSIONED_OBJECT\` for \`PARTY\` demographic object.
 */
export class X_VERSIONED_PARTY extends X_VERSIONED_OBJECT<T> {
}

/**
 * Single item in generic extract, designed for 13606 and CDA data.
 */
export class GENERIC_CONTENT_ITEM extends EXTRACT_CONTENT_ITEM {
  /**
   * Identifier of model or schema used to create the content.
   */
  item_type?: DV_CODED_TEXT;
  /**
   * Internal storage for item_type_version
   * @protected
   */
  protected _item_type_version?: openehr_base.String;

  /**
   * Version of model or schema used to create the content item.
   */
  get item_type_version(): string | undefined {
    return this._item_type_version?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for item_type_version.
   * Use this to access openehr_base.String methods.
   */
  get $item_type_version(): openehr_base.String | undefined {
    return this._item_type_version;
  }

  /**
   * Sets item_type_version from either a primitive value or openehr_base.String wrapper.
   */
  set item_type_version(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._item_type_version = undefined;
    } else if (typeof val === "string") {
      this._item_type_version = openehr_base.String.from(val);
    } else {
      this._item_type_version = val;
    }
  }

  /**
   * Internal storage for author
   * @protected
   */
  protected _author?: openehr_base.String;

  /**
   * Reference to a demographic entity elsewhere in this Extract representing the author of the item version. The reference should be a UID corresponding to the UID of a \`GENERIC_CONTENT_ITEM\` containing the demographic information.
   */
  get author(): string | undefined {
    return this._author?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for author.
   * Use this to access openehr_base.String methods.
   */
  get $author(): openehr_base.String | undefined {
    return this._author;
  }

  /**
   * Sets author from either a primitive value or openehr_base.String wrapper.
   */
  set author(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._author = undefined;
    } else if (typeof val === "string") {
      this._author = openehr_base.String.from(val);
    } else {
      this._author = val;
    }
  }

  /**
   * Time of creation of this item version on the original system. This may be an earlier commit time, or it may be the time at which the item was created during the Extract generation process.
   */
  creation_time?: openehr_base.Iso8601_date_time;
  /**
   * Internal storage for authoriser
   * @protected
   */
  protected _authoriser?: openehr_base.String;

  /**
   * Reference to a demographic entity elsewhere in this Extract representing an authoriser of the item version, if relevant. The reference should be a UID corresponding to the UID of a \`GENERIC_CONTENT_ITEM\` containing the demographic information.
   */
  get authoriser(): string | undefined {
    return this._authoriser?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for authoriser.
   * Use this to access openehr_base.String methods.
   */
  get $authoriser(): openehr_base.String | undefined {
    return this._authoriser;
  }

  /**
   * Sets authoriser from either a primitive value or openehr_base.String wrapper.
   */
  set authoriser(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._authoriser = undefined;
    } else if (typeof val === "string") {
      this._authoriser = openehr_base.String.from(val);
    } else {
      this._authoriser = val;
    }
  }

  /**
   * Time of authorisation of this item version on the original system where relevant.
   */
  authorisation_time?: openehr_base.Iso8601_date_time;
  /**
   * Coded lifecycle status of the item.
   */
  item_status?: DV_CODED_TEXT;
  /**
   * Internal storage for version_id
   * @protected
   */
  protected _version_id?: openehr_base.String;

  /**
   * Version id of this item in original system.
   */
  get version_id(): string | undefined {
    return this._version_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for version_id.
   * Use this to access openehr_base.String methods.
   */
  get $version_id(): openehr_base.String | undefined {
    return this._version_id;
  }

  /**
   * Sets version_id from either a primitive value or openehr_base.String wrapper.
   */
  set version_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._version_id = undefined;
    } else if (typeof val === "string") {
      this._version_id = openehr_base.String.from(val);
    } else {
      this._version_id = val;
    }
  }

  /**
   * Internal storage for version_set_id
   * @protected
   */
  protected _version_set_id?: openehr_base.String;

  /**
   * Version set id of this item in original system, where applicable.
   */
  get version_set_id(): string | undefined {
    return this._version_set_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for version_set_id.
   * Use this to access openehr_base.String methods.
   */
  get $version_set_id(): openehr_base.String | undefined {
    return this._version_set_id;
  }

  /**
   * Sets version_set_id from either a primitive value or openehr_base.String wrapper.
   */
  set version_set_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._version_set_id = undefined;
    } else if (typeof val === "string") {
      this._version_set_id = openehr_base.String.from(val);
    } else {
      this._version_set_id = val;
    }
  }

  /**
   * Internal storage for system_id
   * @protected
   */
  protected _system_id?: openehr_base.String;

  /**
   * Identifier of EMR or other system from which the item was created / extracted. Typically in the form of a domain name.
   */
  get system_id(): string | undefined {
    return this._system_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for system_id.
   * Use this to access openehr_base.String methods.
   */
  get $system_id(): openehr_base.String | undefined {
    return this._system_id;
  }

  /**
   * Sets system_id from either a primitive value or openehr_base.String wrapper.
   */
  set system_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._system_id = undefined;
    } else if (typeof val === "string") {
      this._system_id = openehr_base.String.from(val);
    } else {
      this._system_id = val;
    }
  }

  /**
   * Other details about the content item.
   */
  other_details?: undefined;
  /**
   * Content object.
   */
  override item?: LOCATABLE = undefined;
}

/**
 * Abstract parent of message payload types.
 */
export abstract class MESSAGE_CONTENT {
}

/**
 * Type of request designed for synchronisation of Contributions between openEHR servers.
 */
export class SYNC_EXTRACT_REQUEST extends MESSAGE_CONTENT {
  /**
   * Details of specification of synchronisation request.
   */
  specification?: SYNC_EXTRACT_SPEC;
}

export class SYNC_EXTRACT extends MESSAGE_CONTENT {
  /**
   * Details of specification of this Extract.
   */
  specification?: SYNC_EXTRACT_SPEC;
  /**
   * Content, in the form of a serialised Contributions.
   */
  items?: undefined;
}

/**
 * Serialised form of Contribution for an Extract.
 */
export class X_CONTRIBUTION {
  /**
   * Uid of Contribution in source system.
   */
  uid?: openehr_base.HIER_OBJECT_ID;
  /**
   * Audit of Contribution in source system.
   */
  audit?: AUDIT_DETAILS;
  /**
   * Serialised Versions from Contribution in source system.
   */
  versions?: undefined;
}

/**
 * Details of specification of Extract, used in a request to specify an Extract, or in a response, to describe what is actually in the Extract.
 */
export class SYNC_EXTRACT_SPEC {
  /**
   * Internal storage for includes_versions
   * @protected
   */
  protected _includes_versions?: openehr_base.Boolean;

  /**
   * True if the Versions from the Contribution are included; False if just the Contribution and its Audit are included.
   */
  get includes_versions(): boolean | undefined {
    return this._includes_versions?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for includes_versions.
   * Use this to access openehr_base.Boolean methods.
   */
  get $includes_versions(): openehr_base.Boolean | undefined {
    return this._includes_versions;
  }

  /**
   * Sets includes_versions from either a primitive value or openehr_base.Boolean wrapper.
   */
  set includes_versions(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._includes_versions = undefined;
    } else if (typeof val === "boolean") {
      this._includes_versions = openehr_base.Boolean.from(val);
    } else {
      this._includes_versions = val;
    }
  }

  /**
   * List of Contributions to include / that are included in the Extract.
   */
  contribution_list?: undefined;
  /**
   * Specify Contributions included in Extract by threshold date.
   */
  contributions_since?: DV_DATE_TIME;
  /**
   * Internal storage for all_contributions
   * @protected
   */
  protected _all_contributions?: openehr_base.Boolean;

  /**
   * True if all Contributions in the record are included.
   */
  get all_contributions(): boolean | undefined {
    return this._all_contributions?.value;
  }

  /**
   * Gets the openehr_base.Boolean wrapper object for all_contributions.
   * Use this to access openehr_base.Boolean methods.
   */
  get $all_contributions(): openehr_base.Boolean | undefined {
    return this._all_contributions;
  }

  /**
   * Sets all_contributions from either a primitive value or openehr_base.Boolean wrapper.
   */
  set all_contributions(val: boolean | openehr_base.Boolean | undefined) {
    if (val === undefined || val === null) {
      this._all_contributions = undefined;
    } else if (typeof val === "boolean") {
      this._all_contributions = openehr_base.Boolean.from(val);
    } else {
      this._all_contributions = val;
    }
  }
}

/**
 * A “message” is an authored, possibly signed, piece of content intended for one or more recipients. Since the recipient may or may not be known directly, recipients are specified in the \`ADDRESSED_MESSAGE\` class.
 */
export class MESSAGE {
  /**
   * Details of who actually created the message and when. This is the person who entered the data or otherwise caused the message to be created, or might be a piece of software.
   */
  audit?: AUDIT_DETAILS;
  /**
   * Party responsible for the message content, who may or may not be technically responsible for its creation (e.g. by data entry etc).
   */
  author?: PARTY_PROXY;
  /**
   * Content of the message.
   */
  content?: MESSAGE_CONTENT;
  /**
   * Internal storage for signature
   * @protected
   */
  protected _signature?: openehr_base.String;

  /**
   * Optional signature by the author of message content in openPGP format. The signature is created as a Hash and optional signing of the serialisation of this message object with this signature field Void.
   */
  get signature(): string | undefined {
    return this._signature?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for signature.
   * Use this to access openehr_base.String methods.
   */
  get $signature(): openehr_base.String | undefined {
    return this._signature;
  }

  /**
   * Sets signature from either a primitive value or openehr_base.String wrapper.
   */
  set signature(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._signature = undefined;
    } else if (typeof val === "string") {
      this._signature = openehr_base.String.from(val);
    } else {
      this._signature = val;
    }
  }
}

/**
 * The concept of a message addressed to nominated recipients.
 */
export class ADDRESSED_MESSAGE {
  /**
   * Internal storage for sender
   * @protected
   */
  protected _sender?: openehr_base.String;

  /**
   * Party sending the message.
   */
  get sender(): string | undefined {
    return this._sender?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for sender.
   * Use this to access openehr_base.String methods.
   */
  get $sender(): openehr_base.String | undefined {
    return this._sender;
  }

  /**
   * Sets sender from either a primitive value or openehr_base.String wrapper.
   */
  set sender(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._sender = undefined;
    } else if (typeof val === "string") {
      this._sender = openehr_base.String.from(val);
    } else {
      this._sender = val;
    }
  }

  /**
   * Internal storage for sender_reference
   * @protected
   */
  protected _sender_reference?: openehr_base.String;

  /**
   * Identification of message used by sender. This will be the same no matter how many times this message is sent to these recipients.
   */
  get sender_reference(): string | undefined {
    return this._sender_reference?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for sender_reference.
   * Use this to access openehr_base.String methods.
   */
  get $sender_reference(): openehr_base.String | undefined {
    return this._sender_reference;
  }

  /**
   * Sets sender_reference from either a primitive value or openehr_base.String wrapper.
   */
  set sender_reference(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._sender_reference = undefined;
    } else if (typeof val === "string") {
      this._sender_reference = openehr_base.String.from(val);
    } else {
      this._sender_reference = val;
    }
  }

  /**
   * Intended recipients, in the form of internet addresses.
   */
  addressees?: undefined;
  /**
   * Internal storage for urgency
   * @protected
   */
  protected _urgency?: openehr_base.Integer;

  /**
   * Urgency with which destination should deal with message:
   *
   * * -1 - low
   * * 0 - normal
   * * 1 - high
   */
  get urgency(): number | undefined {
    return this._urgency?.value;
  }

  /**
   * Gets the openehr_base.Integer wrapper object for urgency.
   * Use this to access openehr_base.Integer methods.
   */
  get $urgency(): openehr_base.Integer | undefined {
    return this._urgency;
  }

  /**
   * Sets urgency from either a primitive value or openehr_base.Integer wrapper.
   */
  set urgency(val: number | openehr_base.Integer | undefined) {
    if (val === undefined || val === null) {
      this._urgency = undefined;
    } else if (typeof val === "number") {
      this._urgency = openehr_base.Integer.from(val);
    } else {
      this._urgency = val;
    }
  }

  /**
   * The content of the message.
   */
  message?: MESSAGE;
}

/**
 * Ancestor of all Party types, including real world entities and their roles. A Party is any entity which can participate in an activity. The \`_name_\` attribute inherited from \`LOCATABLE\` is used to indicate the actual type of party (note that the actual names, i.e. identities of parties are indicated in the \`_identities_\` attribute, not the \`_name_\` attribute).
 *
 * NOTE: It is strongly recommended that the inherited attribute \`_uid_\` be populated in \`PARTY\` objects, using the UID copied from the \`_object_id()_\` of the \`_uid_\` field of the enclosing \`VERSION\` object. +
 * For example, the \`ORIGINAL_VERSION.uid\` \`87284370-2D4B-4e3d-A3F3-F303D2F4F34B::uk.nhs.ehr1::2\`  would be copied to the \`_uid_\` field of the \`PARTY\` object.
 */
export abstract class PARTY extends LOCATABLE {
  /**
   * Identities used by the party to identify itself, such as legal name, stage names, aliases, nicknames and so on.
   */
  identities?: undefined;
  /**
   * Contacts for this party.
   */
  contacts?: undefined;
  /**
   * All other details for this Party.
   */
  details?: ITEM_STRUCTURE;
  /**
   * References to relationships in which this Party takes part as target.
   */
  reverse_relationships?: undefined;
  /**
   * Relationships in which this Party takes part as source.
   */
  relationships?: undefined;
  /**
   * Type of party, such as  \`PERSON\`,  \`ORGANISATION\`, etc. Role name, e.g.  general practitioner ,  nurse ,  private citizen . Taken from inherited \`_name_\` attribute.
   * @returns Result value
   */
  type(): DV_TEXT {
    // TODO: Implement type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method type not yet implemented.");
  }
}

/**
 * Description of a means of contact of a Party. Actual structure is archetyped.
 */
export class CONTACT extends LOCATABLE {
  /**
   * A set of address alternatives for this contact purpose and time validity combination.
   */
  addresses?: undefined;
  /**
   * Valid time interval for this contact descriptor.
   */
  time_validity?: undefined;
  /**
   * Purpose for which this contact is used, e.g. mail,  daytime phone, etc. Taken from value of inherited \`_name_\` attribute.
   * @returns Result value
   */
  purpose(): DV_TEXT {
    // TODO: Implement purpose behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method purpose not yet implemented.");
  }
}

/**
 * Address of contact, which may be electronic or geographic.
 */
export class ADDRESS extends LOCATABLE {
  /**
   * Archetypable structured address.
   */
  details?: ITEM_STRUCTURE;
  /**
   * Type of address, e.g. electronic,  locality. Taken from value of inherited \`_name_\` attribute.
   * @returns Result value
   */
  type(): DV_TEXT {
    // TODO: Implement type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method type not yet implemented.");
  }
}

/**
 * An identity  owned  by a Party, such as a person name or company name, and which is used by the Party to identify itself. Actual structure is archetyped.
 */
export class PARTY_IDENTITY extends LOCATABLE {
  /**
   * The value of the identity. This will often taken the form of a parseable string or a small structure of strings.
   */
  details?: ITEM_STRUCTURE;
  /**
   * Purpose of identity, e.g. legal ,  stagename,  nickname,  tribal name,  trading name. Taken from value of inherited \`_name_\` attribute.
   * @returns Result value
   */
  purpose(): DV_TEXT {
    // TODO: Implement purpose behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method purpose not yet implemented.");
  }
}

/**
 * Generic description of a role performed by an Actor. The role corresponds to a competency of the Party. Roles are used to define the responsibilities undertaken by a Party for a purpose. Roles should have credentials qualifying the performer to perform the role.
 */
export class ROLE extends PARTY {
  /**
   * Valid time interval for this role.
   */
  time_validity?: undefined;
  /**
   * Reference to Version container of Actor playing the role.
   */
  performer?: openehr_base.PARTY_REF;
  /**
   * The capabilities of this role.
   */
  capabilities?: undefined;
}

/**
 * Ancestor of all real-world types, including people and organisations. An actor is any real-world entity capable of taking on a role.
 */
export abstract class ACTOR extends PARTY {
  /**
   * Languages which can be used to communicate with this actor, in preferred order of use (if known, else order irrelevant).
   */
  languages?: undefined;
  /**
   * Identifiers of the Version container for each Role played by this Party.
   */
  roles?: undefined;
}

/**
 * Capability of a role, such as  ehr modifier,  health care provider. Capability should be backed up by credentials.
 */
export class CAPABILITY extends LOCATABLE {
  /**
   * The qualifications of the performer of the role for this capability. This might include professional qualifications and official identifications such as provider numbers etc.
   */
  credentials?: ITEM_STRUCTURE;
  /**
   * Valid time interval for the credentials of this capability.
   */
  time_validity?: undefined;
}

/**
 * Generic concept of any kind of agent, including devices, software systems, but not humans or organisations.
 */
export class AGENT extends ACTOR {
}

/**
 * Generic description of organisations. An organisation is a legally constituted body whose existence (in general) outlives the existence of parties considered to be part of it.
 */
export class ORGANISATION extends ACTOR {
}

/**
 * A group is a real world group of parties which is created by another party, usually an organisation, for some specific purpose. A typical clinical example is that of the specialist care team, e.g.  cardiology team . The members of the group usually work together.
 */
export class GROUP extends ACTOR {
}

/**
 * Generic description of persons. Provides a dedicated type to which Person archetypes can be targeted.
 */
export class PERSON extends ACTOR {
}

/**
 * Generic description of a relationship between parties.
 */
export class PARTY_RELATIONSHIP extends LOCATABLE {
  /**
   * The detailed description of the relationship.
   */
  details?: ITEM_STRUCTURE;
  /**
   * Target of relationship.
   */
  target?: openehr_base.PARTY_REF;
  /**
   * Valid time interval for this relationship.
   */
  time_validity?: undefined;
  /**
   * Source of relationship.
   */
  source?: openehr_base.PARTY_REF;
  /**
   * Type of relationship, such as  employment,  authority,  health provision
   * @returns Result value
   */
  type(): DV_TEXT {
    // TODO: Implement type behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method type not yet implemented.");
  }
}

/**
 * Static type formed by binding generic parameter of \`VERSIONED_OBJECT<T>\` to \`PARTY\`.
 */
export class VERSIONED_PARTY extends VERSIONED_OBJECT<T> {
}

/**
 * Abstract ancestor of all concrete content types.
 */
export abstract class CONTENT_ITEM extends LOCATABLE {
}

/**
 * This class is used to create intermediate representations of data from sources not otherwise conforming to openEHR classes, such as HL7 messages, relational databases and so on.
 */
export class GENERIC_ENTRY extends CONTENT_ITEM {
  /**
   * The data from the source message or record. May be recorded in any structural openEHR representation.
   */
  data?: ITEM;
}

/**
 * Content of one version in a \`VERSIONED_COMPOSITION\`. A Composition is considered the unit of modification of the record, the unit of transmission in record Extracts, and the unit of attestation by authorising clinicians. In this latter sense, it may be considered equivalent to a signed document.
 *
 * NOTE: It is strongly recommended that the inherited attribute \`_uid_\` be populated in Compositions, using the UID copied from the \`_object_id()_\` of the \`_uid_\` field of the enclosing \`VERSION\` object. +
 * For example, the \`ORIGINAL_VERSION.uid\` \`87284370-2D4B-4e3d-A3F3-F303D2F4F34B::uk.nhs.ehr1::2\` would be copied to the \`_uid_\` field of the Composition.
 */
export class COMPOSITION extends LOCATABLE {
  /**
   * Mandatory indicator of the localised language in which this Composition is written. Coded from openEHR Code Set  \`languages\`. The language of an Entry if different from the Composition is indicated in \`ENTRY._language_\`.
   */
  language?: CODE_PHRASE;
  /**
   * Name of territory in which this Composition was written. Coded from openEHR  countries  code set, which is an expression of the ISO 3166 standard.
   */
  territory?: CODE_PHRASE;
  /**
   * Temporal category of this Composition, i.e.
   *
   * * \`431|persistent|\` - of potential life-time validity;
   * * \`451|episodic|\` - valid over the life of a care episode;
   * * \`433|event|\` - valid at the time of recording (long-term validity requires subsequent clinical assessment).
   *
   * or any other code defined in the openEHR terminology group 'category'.
   */
  category?: DV_CODED_TEXT;
  /**
   * The clinical session context of this Composition, i.e. the contextual attributes of the clinical session.
   */
  context?: EVENT_CONTEXT;
  /**
   * The person primarily responsible for the content of the Composition (but not necessarily its committal into the EHR system). This is the identifier which should appear on the screen. It may or may not be the person who entered the data. When it is the patient, the special self  instance of \`PARTY_PROXY\` will be used.
   */
  composer?: PARTY_PROXY;
  /**
   * The content of this Composition.
   */
  content?: undefined;
  /**
   * True if category is \`431|persistent|\`, False otherwise. Useful for finding Compositions in an EHR which are guaranteed to be of interest to most users.
   * @returns Result value
   */
  is_persistent(): openehr_base.Boolean {
    // Check if category code is "431" (persistent)
    if (!this.category || !this.category.defining_code) {
      return openehr_base.Boolean.from(false);
    }
    return openehr_base.Boolean.from(this.category.defining_code.code_string === "431");
  }
}

/**
 * Documents the context information of a healthcare event involving the subject of care and the health system. The context information recorded here are independent of the attributes recorded in the version audit, which document the  system interaction  context, i.e. the context of a user interacting with the health record system. Healthcare events include patient contacts, and any other business activity, such as pathology investigations which take place on behalf of the patient.
 */
export class EVENT_CONTEXT extends PATHABLE {
  /**
   * Start time of the clinical session or other kind of event during which a provider performs a service of any kind for the patient.
   */
  start_time?: DV_DATE_TIME;
  /**
   * Optional end time of the clinical session.
   */
  end_time?: DV_DATE_TIME;
  /**
   * Internal storage for location
   * @protected
   */
  protected _location?: openehr_base.String;

  /**
   * The actual location where the session occurred, e.g. 'microbiology lab 2', 'home', 'ward A3'  and so on.
   */
  get location(): string | undefined {
    return this._location?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for location.
   * Use this to access openehr_base.String methods.
   */
  get $location(): openehr_base.String | undefined {
    return this._location;
  }

  /**
   * Sets location from either a primitive value or openehr_base.String wrapper.
   */
  set location(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._location = undefined;
    } else if (typeof val === "string") {
      this._location = openehr_base.String.from(val);
    } else {
      this._location = val;
    }
  }

  /**
   * The setting in which the clinical session took place. Coded using the openEHR Terminology,  setting  group.
   */
  setting?: DV_CODED_TEXT;
  /**
   * Other optional context which will be archetyped.
   */
  other_context?: ITEM_STRUCTURE;
  /**
   * The health care facility under whose care the event took place. This is the most specific workgroup or delivery unit within a care delivery enterprise that has an official identifier in the health system, and can be used to ensure medico-legal accountability.
   */
  health_care_facility?: PARTY_IDENTIFIED;
  /**
   * Parties involved in the healthcare event. These would normally include the physician(s) and often the patient (but not the latter if the clinical session is a pathology test for example).
   */
  participations?: undefined;
}

/**
 * Represents a heading in a heading structure, or  section tree.  Created according to archetyped structures for typical headings such as SOAP,  physical examination, but also pathology result heading structures.  Should not be used instead of \`ENTRY\` hierarchical structures.
 */
export class SECTION extends CONTENT_ITEM {
  /**
   * Ordered list of content items under this section, which may include:
   *
   * * more \`SECTIONs\`;
   * * \`ENTRYs\`.
   */
  items?: undefined;
}

/**
 * The abstract parent of all \`ENTRY\` subtypes. An \`ENTRY\` is the root of a logical item of  hard  clinical information created in the  clinical statement  context, within a clinical session. There can be numerous such contexts in a clinical session. Observations and other Entry types only ever document information captured/created in the event documented by the enclosing Composition.
 *
 * An \`ENTRY\` is also the minimal unit of information any query should return, since a whole \`ENTRY\` (including subparts) records spatial structure, timing information, and contextual information, as well as the subject and generator of the information.
 */
export abstract class ENTRY extends CONTENT_ITEM {
  /**
   * Mandatory indicator of the localised language in which this Entry is written. Coded from openEHR Code Set  languages .
   */
  language?: CODE_PHRASE;
  /**
   * Name of character set in which text values in this Entry are encoded. Coded from openEHR Code Set  character sets.
   */
  encoding?: CODE_PHRASE;
  /**
   * Other participations at \`ENTRY\` level.
   */
  other_participations?: undefined;
  /**
   * Identifier of externally held workflow engine data for this workflow execution, for this subject of care.
   */
  workflow_id?: openehr_base.OBJECT_REF;
  /**
   * Id of human subject of this \`ENTRY\`, e.g.:
   *
   * * organ donor
   * * foetus
   * * a family member
   * * another clinically relevant person.
   */
  subject?: PARTY_PROXY;
  /**
   * Optional identification of provider of the information in this \`ENTRY\`, which might be:
   *
   * * the patient
   * * a patient agent, e.g. parent, guardian
   * * the clinician
   * * a device or software
   *
   * Generally only used when the recorder needs to make it explicit. Otherwise, Composition composer and other participants are assumed.
   */
  provider?: PARTY_PROXY;
  /**
   * Returns True if this Entry is about the subject of the EHR, in which case the subject attribute is of type PARTY_SELF.
   * @returns Result value
   */
  subject_is_self(): openehr_base.Boolean {
    // TODO: Implement subject_is_self behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method subject_is_self not yet implemented.");
  }
}

/**
 * Entry subtype for administrative information, i.e. information about setting up the clinical process, but not itself clinically relevant. Archetypes will define contained information.
 *
 * Used for administrative details of admission, episode, ward location, discharge, appointment (if not stored in a practice management or appointments system).
 *
 * Not to be used for any clinically significant information.
 */
export class ADMIN_ENTRY extends ENTRY {
  /**
   * Content of the Admin Entry.
   */
  data?: ITEM_STRUCTURE;
}

/**
 * The abstract parent of all clinical \`ENTRY\` subtypes. A \`CARE_ENTRY\` defines protocol and guideline attributes for all clinical Entry subtypes.
 */
export abstract class CARE_ENTRY extends ENTRY {
  /**
   * Description of the method (i.e. how) the information in this entry was arrived at. For \`OBSERVATIONs\`, this is a description of the method or instrument used. For \`EVALUATIONs\`, how the evaluation was arrived at. For \`INSTRUCTIONs\`, how to execute the Instruction. This may take the form of references to guidelines, including manually followed and executable; knowledge references such as a paper in Medline; clinical reasons within a larger care process.
   */
  protocol?: ITEM_STRUCTURE;
  /**
   * Optional external identifier of guideline creating this Entry if relevant.
   */
  guideline_id?: openehr_base.OBJECT_REF;
}

/**
 * Entry subtype for all clinical data in the past or present, i.e. which (by the time it is recorded) has already occurred. \`OBSERVATION\` data is expressed using the class \`HISTORY<T>\`, which guarantees that it is situated in time. \`OBSERVATION\` is used for all notionally objective (i.e. measured in some way) observations of phenomena, and patient-reported phenomena, e.g. pain.
 *
 * Not to be used for recording opinion or future statements of any kind, including instructions, intentions, plans etc.
 */
export class OBSERVATION extends CARE_ENTRY {
  /**
   * The data of this observation, in the form of a history of values which may be of any complexity.
   */
  data?: undefined;
  /**
   * Optional recording of the state of subject of this observation during the observation process, in the form of a separate history of values which may be of any complexity. State may also be recorded within the History of the data attribute.
   */
  state?: undefined;
}

/**
 * Entry type for evaluation statements. Used for all kinds of statements which evaluate other information, such as interpretations of observations, diagnoses, differential diagnoses, hypotheses, risk assessments, goals and plans.
 *
 * Should not be used for actionable statements such as medication orders - these are represented using the \`INSTRUCTION\` type.
 */
export class EVALUATION extends CARE_ENTRY {
  /**
   * The data of this evaluation, in the form of a spatial data structure.
   */
  data?: ITEM_STRUCTURE;
}

/**
 * Used to record a clinical action that has been performed, which may have been ad hoc, or due to the execution of an Activity in an Instruction workflow. Every Action corresponds to a careflow step of some kind or another.
 */
export class ACTION extends CARE_ENTRY {
  /**
   * Point in time at which this action completed. To indicate an unknown time, use a \`DV_DATE_TIME\` instance with \`_value_\` set to the time of creation (or some other known time before which the Action is known to have occurred, e.g. data accession timestamp from integration engine), and \`_magnitude_status_\` set to \`<\`.
   */
  time?: DV_DATE_TIME;
  /**
   * Details of transition in the Instruction state machine caused by this Action.
   */
  ism_transition?: ISM_TRANSITION;
  /**
   * Details of the Instruction that caused this Action to be performed, if there was one.
   */
  instruction_details?: INSTRUCTION_DETAILS;
  /**
   * Description of the action that has been performed, in the form of an archetyped structure.
   */
  description?: ITEM_STRUCTURE;
}

/**
 * Defines a single activity within an Instruction, such as a medication administration.
 */
export class ACTIVITY extends LOCATABLE {
  /**
   * Timing of the activity, in the form of a parsable string. If used, the preferred syntax is ISO8601 'R' format, but other formats may be used including HL7 GTS.
   *
   * May be omitted if:
   *
   * * timing is represented structurally in the \`_description_\` attribute (e.g. via archetyped elements), or
   * * unavailable, e.g. imported legacy data; in such cases, the \`INSTRUCTION._narrative_\` should carry text that indicates the timing of its \`_activities_\`.
   */
  timing?: DV_PARSABLE;
  /**
   * Internal storage for action_archetype_id
   * @protected
   */
  protected _action_archetype_id?: openehr_base.String;

  /**
   * Perl-compliant regular expression pattern, enclosed in  '//' delimiters, indicating the valid identifiers of archetypes for Actions corresponding to this Activity specification.
   *
   * Defaults to  \`/.*\/\`, meaning any archetype.
   */
  get action_archetype_id(): string | undefined {
    return this._action_archetype_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for action_archetype_id.
   * Use this to access openehr_base.String methods.
   */
  get $action_archetype_id(): openehr_base.String | undefined {
    return this._action_archetype_id;
  }

  /**
   * Sets action_archetype_id from either a primitive value or openehr_base.String wrapper.
   */
  set action_archetype_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._action_archetype_id = undefined;
    } else if (typeof val === "string") {
      this._action_archetype_id = openehr_base.String.from(val);
    } else {
      this._action_archetype_id = val;
    }
  }

  /**
   * Description of the activity, in the form of an archetyped structure.
   */
  description?: ITEM_STRUCTURE;
}

/**
 * Model of a transition in the Instruction State Machine, caused by a careflow step. The attributes document the careflow step as well as the ISM transition.
 */
export class ISM_TRANSITION extends PATHABLE {
  /**
   * The ISM current state. Coded by openEHR terminology group Instruction states.
   */
  current_state?: DV_CODED_TEXT;
  /**
   * The ISM transition which occurred to arrive in the current_state. Coded by openEHR terminology group  Instruction transitions.
   */
  transition?: DV_CODED_TEXT;
  /**
   * The step in the careflow process which occurred as part of generating this action, e.g.  dispense ,  start_administration. This attribute represents the clinical  label for the activity, as  opposed to current_state which represents  the state machine (ISM)  computable form. Defined in archetype.
   */
  careflow_step?: DV_CODED_TEXT;
  /**
   * Optional possibility of adding one or more reasons for this careflow step having been taken. Multiple reasons may occur in medication management for example.
   */
  reason?: undefined;
}

/**
 * Used to record details of the Instruction causing an Action.
 */
export class INSTRUCTION_DETAILS extends PATHABLE {
  /**
   * Reference to causing Instruction.
   */
  instruction_id?: openehr_base.LOCATABLE_REF;
  /**
   * Internal storage for activity_id
   * @protected
   */
  protected _activity_id?: openehr_base.String;

  /**
   * Identifier of Activity within Instruction, in the form of its archetype path.
   */
  get activity_id(): string | undefined {
    return this._activity_id?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for activity_id.
   * Use this to access openehr_base.String methods.
   */
  get $activity_id(): openehr_base.String | undefined {
    return this._activity_id;
  }

  /**
   * Sets activity_id from either a primitive value or openehr_base.String wrapper.
   */
  set activity_id(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._activity_id = undefined;
    } else if (typeof val === "string") {
      this._activity_id = openehr_base.String.from(val);
    } else {
      this._activity_id = val;
    }
  }

  /**
   * Various workflow engine state details, potentially including such things as:
   *
   * * condition that fired to cause this Action to be done (with actual variables substituted);
   * * list of notifications which actually occurred (with all variables substituted);
   * * other workflow engine state.
   *
   * This specification does not currently define the actual structure or semantics of this field.
   */
  wf_details?: ITEM_STRUCTURE;
}

/**
 * Used to specify actions in the future. Enables simple and complex specifications to be expressed, including in a fully-computable workflow form. Used for any actionable statement such as medication and therapeutic orders, monitoring, recall and review. Enough details must be provided for the specification to be directly executed by an actor, either human or machine.
 *
 * Not to be used for plan items which are only specified in general terms.
 */
export class INSTRUCTION extends CARE_ENTRY {
  /**
   * Mandatory human-readable version of what the Instruction is about.
   */
  narrative?: DV_TEXT;
  /**
   * Optional expiry date/time to assist determination of when an Instruction can be assumed to have expired. This helps prevent false listing of Instructions as Active when they clearly must have been terminated in some way or other.
   */
  expiry_time?: DV_DATE_TIME;
  /**
   * Optional workflow engine executable expression of the Instruction.
   */
  wf_definition?: DV_PARSABLE;
  /**
   * List of all activities in Instruction.
   */
  activities?: undefined;
}

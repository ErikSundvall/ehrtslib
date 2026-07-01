/**
 * RM Instance Generator
 *
 * Generates example RM instances from operational templates/archetypes.
 *
 * Mode semantics:
 * - minimal: mandatory RM attributes plus template nodes whose occurrence/cardinality lower bound is mandatory
 * - example: minimal plus every node mentioned in the operational template once
 * - maximal: every allowed template node, using a bounded sample for repeating nodes
 */

import * as openehr_am from "../openehr_am.ts";
import {
  resolveTemplateLanguage,
  termCodeCandidates,
} from "./term_codes.ts";

type MultiplicityLike = {
  lower?: number;
  upper?: number;
  lower_unbounded?: boolean;
  upper_unbounded?: boolean;
  interval?: MultiplicityLike;
};

type TermBag = Record<string, { text?: unknown; description?: unknown }>;

interface Bounds {
  min: number;
  max: number;
  unbounded: boolean;
}

const MANDATORY_RM_ATTRIBUTES: Record<string, string[]> = {
  LOCATABLE: ["archetype_node_id", "name"],
  COMPOSITION: ["language", "territory", "category", "composer"],
  EVENT_CONTEXT: ["start_time", "setting"],
  ENTRY: ["language", "encoding", "subject"],
  OBSERVATION: ["data"],
  EVALUATION: ["data"],
  ADMIN_ENTRY: ["data"],
  INSTRUCTION: ["narrative"],
  ACTION: ["time", "ism_transition", "description"],
  ACTIVITY: ["description", "action_archetype_id"],
  HISTORY: ["origin", "events"],
  EVENT: ["time", "data"],
  POINT_EVENT: ["time", "data"],
  INTERVAL_EVENT: ["time", "data", "math_function"],
  CLUSTER: ["items"],
};

const LOCATABLE_TYPES = new Set([
  "COMPOSITION",
  "SECTION",
  "OBSERVATION",
  "EVALUATION",
  "INSTRUCTION",
  "ACTION",
  "ADMIN_ENTRY",
  "CLUSTER",
  "ELEMENT",
  "ITEM_TREE",
  "ITEM_LIST",
  "ITEM_TABLE",
  "ITEM_SINGLE",
  "HISTORY",
  "EVENT",
  "POINT_EVENT",
  "INTERVAL_EVENT",
  "ACTIVITY",
]);

const ENTRY_TYPES = new Set([
  "OBSERVATION",
  "EVALUATION",
  "INSTRUCTION",
  "ACTION",
  "ADMIN_ENTRY",
]);

export type GenerationMode = "minimal" | "example" | "maximal";

export interface GeneratorConfig {
  mode?: GenerationMode;
  fillOptional?: boolean;
  maxDepth?: number;
  includeMandatoryRMAttributes?: boolean;
  /** Safety cap for unbounded or very high upper cardinalities in maximal mode. */
  maxGeneratedItems?: number;
}

export class RMInstanceGenerator {
  private config: GeneratorConfig;
  private terms: TermBag = {};
  private language = "en";

  constructor(config?: GeneratorConfig) {
    this.config = {
      mode: "example",
      fillOptional: undefined,
      maxDepth: 50,
      includeMandatoryRMAttributes: true,
      maxGeneratedItems: 3,
      ...config,
    };
  }

  generate(
    template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE,
  ): any {
    if (!template.definition) {
      throw new Error("Template has no definition");
    }

    this.language = resolveTemplateLanguage(template);
    this.terms = this.collectTerms(template);

    return this.generateFromCObject(template.definition, 0, "root");
  }

  private generateFromCObject(
    cObject: openehr_am.C_OBJECT,
    depth: number,
    pathHint = "value",
  ): any {
    if (depth > (this.config.maxDepth || 50)) return null;
    if (this.isObjectExcluded(cObject)) return null;

    if (cObject instanceof openehr_am.C_QUANTITY) {
      return this.generateQuantity(cObject);
    }
    if (cObject instanceof openehr_am.C_CODED_TEXT) {
      return this.generateCodedText(cObject);
    }
    if (cObject instanceof openehr_am.C_TERMINOLOGY_CODE) {
      return this.generateCodePhrase(cObject);
    }
    if (
      cObject instanceof openehr_am.C_PRIMITIVE_OBJECT ||
      cObject instanceof openehr_am.C_PRIMITIVE
    ) {
      return this.generatePrimitive(cObject, pathHint);
    }

    const rmType = cObject.rm_type_name ?? "ITEM_TREE";
    const isComplex = cObject instanceof openehr_am.C_COMPLEX_OBJECT ||
      cObject instanceof openehr_am.C_ARCHETYPE_ROOT;
    const hasAttributes = isComplex &&
      ((cObject.attributes?.length ?? 0) > 0);

    if (!hasAttributes && rmType.startsWith("DV_")) {
      return this.generateDataValueByType(rmType, pathHint);
    }

    const instance: Record<string, unknown> = { _type: rmType };

    if (cObject.node_id && !rmType.startsWith("DV_")) {
      instance.archetype_node_id = cObject.node_id;
      if (LOCATABLE_TYPES.has(rmType)) {
        const label = this.termText(cObject.node_id);
        if (label) instance.name = this.dvText(label);
      }
    }

    if (isComplex) {
      this.generateAttributes(instance, cObject, depth);
    } else {
      return this.generateDataValueByType(rmType, pathHint);
    }

    return instance;
  }

  private generateAttributes(
    instance: Record<string, unknown>,
    cObject: openehr_am.C_COMPLEX_OBJECT,
    depth: number,
  ): void {
    const generatedAttributes = new Set<string>();

    for (const cAttribute of cObject.attributes ?? []) {
      const attrName = cAttribute.rm_attribute_name;
      if (!attrName || this.isAttributeExcluded(cAttribute)) continue;

      const value = this.generateAttributeValue(cAttribute, depth);
      if (value === undefined) continue;

      instance[attrName] = value;
      generatedAttributes.add(attrName);
    }

    if (this.config.includeMandatoryRMAttributes) {
      this.addMandatoryRMAttributes(
        instance,
        cObject.rm_type_name || "",
        generatedAttributes,
        cObject.node_id,
      );
    }
  }

  private generateAttributeValue(
    cAttribute: openehr_am.C_ATTRIBUTE,
    depth: number,
  ): any {
    const attrName = cAttribute.rm_attribute_name || "attribute";
    const children = (cAttribute as { children?: openehr_am.C_OBJECT[] })
      .children ?? [];
    const allowedChildren = children.filter((child) =>
      !this.isObjectExcluded(child)
    );
    const requiredChildren = allowedChildren.filter((child) =>
      this.isObjectRequired(child)
    );
    const attrBounds = this.attributeBounds(cAttribute);
    const hasMandatoryDescendant = allowedChildren.some((child) =>
      this.hasMandatoryDescendant(child)
    );
    const isRequired = attrBounds.min > 0 || requiredChildren.length > 0 ||
      hasMandatoryDescendant;
    const shouldFillOptional = this.shouldFillOptional(cAttribute);

    if (!isRequired && !shouldFillOptional) return undefined;
    if (!allowedChildren.length) return this.generateDefaultValue("", attrName);

    if (!(cAttribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE)) {
      const child = requiredChildren[0] ?? allowedChildren[0];
      return this.generateFromCObject(child, depth + 1, attrName);
    }

    const selected = this.selectChildrenForMultipleAttribute(
      allowedChildren,
      requiredChildren,
      attrBounds,
    );
    if (!selected.length && attrBounds.min === 0) return undefined;

    const values: any[] = [];
    for (const child of selected) {
      const count = this.objectItemCount(child);
      for (let i = 0; i < count; i++) {
        const childInstance = this.generateFromCObject(
          child,
          depth + 1,
          `${attrName}[${values.length}]`,
        );
        if (childInstance !== null && childInstance !== undefined) {
          values.push(childInstance);
        }
      }
    }

    if (this.config.mode === "maximal" && selected.length) {
      const targetCount = this.maxAllowedSample(attrBounds);
      let index = 0;
      while (values.length < targetCount) {
        const child = selected[index % selected.length];
        const childInstance = this.generateFromCObject(
          child,
          depth + 1,
          `${attrName}[${values.length}]`,
        );
        if (childInstance === null || childInstance === undefined) break;
        values.push(childInstance);
        index++;
      }
    }

    while (values.length < attrBounds.min && allowedChildren.length) {
      const child = allowedChildren[values.length % allowedChildren.length];
      const childInstance = this.generateFromCObject(
        child,
        depth + 1,
        `${attrName}[${values.length}]`,
      );
      if (childInstance === null || childInstance === undefined) break;
      values.push(childInstance);
    }

    return values;
  }

  private addMandatoryRMAttributes(
    instance: Record<string, unknown>,
    rmTypeName: string,
    generatedAttributes: Set<string>,
    nodeId?: string,
  ): void {
    for (const attrName of this.mandatoryAttributesFor(rmTypeName)) {
      if (
        generatedAttributes.has(attrName) || instance[attrName] !== undefined
      ) {
        continue;
      }
      instance[attrName] = this.generateDefaultValue(
        rmTypeName,
        attrName,
        nodeId,
      );
    }
  }

  private mandatoryAttributesFor(rmTypeName: string): string[] {
    const attrs = new Set<string>();
    if (LOCATABLE_TYPES.has(rmTypeName)) {
      for (const attr of MANDATORY_RM_ATTRIBUTES.LOCATABLE) attrs.add(attr);
    }
    if (ENTRY_TYPES.has(rmTypeName)) {
      for (const attr of MANDATORY_RM_ATTRIBUTES.ENTRY) attrs.add(attr);
    }
    for (const attr of MANDATORY_RM_ATTRIBUTES[rmTypeName] ?? []) {
      attrs.add(attr);
    }
    return [...attrs];
  }

  private generateDefaultValue(
    rmTypeName: string,
    attrName: string,
    nodeId?: string,
  ): any {
    switch (attrName) {
      case "archetype_node_id":
        return nodeId ?? "at0000";
      case "name":
        return this.dvText(
          this.termText(nodeId) ?? this.readableRmType(rmTypeName),
        );
      case "language":
        return this.codePhrase("ISO_639-1", "en");
      case "territory":
        return this.codePhrase("ISO_3166-1", "US");
      case "encoding":
        return this.codePhrase("IANA_character-sets", "UTF-8");
      case "category":
        return this.dvCodedText("event", "openehr", "433");
      case "composer":
        return { _type: "PARTY_IDENTIFIED", name: "Generated example" };
      case "subject":
        return { _type: "PARTY_SELF" };
      case "time":
      case "origin":
      case "start_time":
        return this.dvDateTime();
      case "setting":
        return this.dvCodedText("other care", "openehr", "238");
      case "math_function":
        return this.dvCodedText("actual", "openehr", "640");
      case "narrative":
        return this.dvText("Generated instruction narrative");
      case "action_archetype_id":
        return "openEHR-EHR-ACTION.generated.v1";
      case "ism_transition":
        return {
          _type: "ISM_TRANSITION",
          current_state: this.dvCodedText("completed", "openehr", "532"),
        };
      case "description":
      case "data":
        return {
          _type: "ITEM_TREE",
          archetype_node_id: "at0001",
          name: this.dvText(this.readableRmType(attrName)),
          items: [],
        };
      case "content":
      case "events":
      case "items":
        return [];
      case "value":
        return this.dvText("Example value");
      default:
        if (attrName.endsWith("time")) return this.dvDateTime();
        return null;
    }
  }

  private shouldFillOptional(_cAttribute: openehr_am.C_ATTRIBUTE): boolean {
    if (typeof this.config.fillOptional === "boolean") {
      return this.config.fillOptional;
    }
    return this.config.mode !== "minimal";
  }

  private selectChildrenForMultipleAttribute(
    allowedChildren: openehr_am.C_OBJECT[],
    requiredChildren: openehr_am.C_OBJECT[],
    attrBounds: Bounds,
  ): openehr_am.C_OBJECT[] {
    if (this.config.mode === "minimal" && this.config.fillOptional !== true) {
      if (requiredChildren.length) return requiredChildren;
      if (attrBounds.min > 0) return allowedChildren.slice(0, attrBounds.min);
      return [];
    }
    return allowedChildren;
  }

  private objectItemCount(child: openehr_am.C_OBJECT): number {
    const bounds = this.objectBounds(child);
    if (this.config.mode === "maximal") return this.maxAllowedSample(bounds);
    return Math.max(bounds.min, 1);
  }

  private attributeBounds(cAttribute: openehr_am.C_ATTRIBUTE): Bounds {
    const existence =
      (cAttribute as { existence?: MultiplicityLike }).existence;
    const existenceBounds = this.boundsFromMultiplicity(existence, 0, 1);

    if (cAttribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE) {
      const cardinality =
        (cAttribute as { cardinality?: { interval?: MultiplicityLike } })
          .cardinality;
      const cardBounds = this.boundsFromMultiplicity(
        cardinality?.interval,
        0,
        1,
      );
      return {
        min: Math.max(existenceBounds.min, cardBounds.min),
        max: cardBounds.max,
        unbounded: cardBounds.unbounded,
      };
    }

    return existenceBounds;
  }

  private objectBounds(cObject: openehr_am.C_OBJECT): Bounds {
    return this.boundsFromMultiplicity(
      cObject.occurrences as MultiplicityLike | undefined,
      1,
      1,
    );
  }

  private boundsFromMultiplicity(
    multiplicity: MultiplicityLike | undefined,
    defaultMin: number,
    defaultMax: number,
  ): Bounds {
    const interval = multiplicity?.interval ?? multiplicity;
    if (!interval) {
      return { min: defaultMin, max: defaultMax, unbounded: false };
    }
    const lower = interval.lower_unbounded ? 0 : (interval.lower ?? defaultMin);
    const unbounded = interval.upper_unbounded === true;
    const upper = unbounded ? -1 : (interval.upper ?? defaultMax);
    return {
      min: Math.max(0, Number(lower)),
      max: upper < 0 ? -1 : Math.max(0, Number(upper)),
      unbounded,
    };
  }

  private isObjectRequired(cObject: openehr_am.C_OBJECT): boolean {
    return this.objectBounds(cObject).min > 0;
  }

  private hasMandatoryDescendant(cObject: openehr_am.C_OBJECT): boolean {
    if (this.isObjectRequired(cObject)) return true;
    if (
      !(cObject instanceof openehr_am.C_COMPLEX_OBJECT) &&
      !(cObject instanceof openehr_am.C_ARCHETYPE_ROOT)
    ) {
      return false;
    }
    for (const cAttribute of cObject.attributes ?? []) {
      if (this.isAttributeExcluded(cAttribute)) continue;
      const children = (cAttribute as { children?: openehr_am.C_OBJECT[] })
        .children ?? [];
      for (const child of children) {
        if (this.isObjectExcluded(child)) continue;
        if (this.isObjectRequired(child) || this.hasMandatoryDescendant(child)) {
          return true;
        }
      }
    }
    return false;
  }

  private isObjectExcluded(cObject: openehr_am.C_OBJECT): boolean {
    const bounds = this.objectBounds(cObject);
    return !bounds.unbounded && bounds.max === 0;
  }

  private isAttributeExcluded(cAttribute: openehr_am.C_ATTRIBUTE): boolean {
    const bounds = this.attributeBounds(cAttribute);
    return !bounds.unbounded && bounds.max === 0;
  }

  private maxAllowedSample(bounds: Bounds): number {
    const configured = this.config.maxGeneratedItems ?? 3;
    if (bounds.unbounded || bounds.max < 0) {
      return Math.max(bounds.min, Math.min(2, configured));
    }
    return Math.max(bounds.min, Math.min(bounds.max, configured));
  }

  private generateQuantity(cObject: openehr_am.C_QUANTITY): any {
    const item =
      ((cObject as { list?: Array<{ units?: string }> }).list ?? [])[0];
    return { _type: "DV_QUANTITY", magnitude: 1, units: item?.units ?? "1" };
  }

  private generateCodedText(cObject: openehr_am.C_CODED_TEXT): any {
    const code = ((cObject as { code_list?: string[] }).code_list ?? [])[0] ??
      (cObject as { constraint?: string }).constraint ??
      cObject.node_id;
    return this.dvCodedText(
      this.termText(code) ?? "Generated coded value",
      (cObject as { terminology?: string }).terminology ?? "local",
      code && !code.startsWith("id") ? code : "at0000",
    );
  }

  private generateCodePhrase(cObject: openehr_am.C_TERMINOLOGY_CODE): any {
    const code = cObject.default_value?.code_string ??
      cObject.assumed_value?.code_string ??
      cObject.constraint ??
      "at0000";
    const terminology =
      (cObject as { terminology_id?: string }).terminology_id ??
        cObject.default_value?.terminology_id?.value ??
        cObject.assumed_value?.terminology_id?.value ??
        (code.startsWith("at") || code.startsWith("id") ? "local" : "openehr");
    return this.codePhrase(terminology, code);
  }

  private generatePrimitive(
    cObject: openehr_am.C_PRIMITIVE_OBJECT | openehr_am.C_PRIMITIVE,
    pathHint: string,
  ): any {
    if (cObject instanceof openehr_am.C_STRING) {
      const values = (cObject as { list?: string[] }).list;
      return cObject.assumed_value?.value ?? values?.[0] ??
        this.exampleText(pathHint);
    }
    if (cObject instanceof openehr_am.C_BOOLEAN) {
      if (cObject.true_valid === false && cObject.false_valid !== false) {
        return false;
      }
      return true;
    }
    if (cObject instanceof openehr_am.C_INTEGER) return 1;
    if (cObject instanceof openehr_am.C_REAL) return 1.0;
    const rmType = "rm_type_name" in cObject ? (cObject.rm_type_name ?? "") : "";
    if (rmType === "DURATION") return "PT1H";
    return this.generateDataValueByType(rmType, pathHint);
  }

  private generateDataValueByType(rmType: string, pathHint: string): any {
    switch (rmType) {
      case "DV_TEXT":
        return this.dvText(this.exampleText(pathHint));
      case "DV_CODED_TEXT":
        return this.dvCodedText("Generated coded value", "local", "at0000");
      case "DV_QUANTITY":
        return { _type: "DV_QUANTITY", magnitude: 1, units: "1" };
      case "DV_COUNT":
        return { _type: "DV_COUNT", magnitude: 1 };
      case "DV_PROPORTION":
        return {
          _type: "DV_PROPORTION",
          numerator: 1,
          denominator: 1,
          type: 1,
        };
      case "DV_DATE":
        return { _type: "DV_DATE", value: "2026-01-01" };
      case "DV_TIME":
        return { _type: "DV_TIME", value: "12:00:00" };
      case "DV_DATE_TIME":
        return this.dvDateTime();
      case "DV_DURATION":
        return { _type: "DV_DURATION", value: "PT1H" };
      case "DV_BOOLEAN":
        return { _type: "DV_BOOLEAN", value: true };
      case "DV_URI":
        return { _type: "DV_URI", value: "https://example.org" };
      case "DV_EHR_URI":
        return { _type: "DV_EHR_URI", value: "ehr://example" };
      case "DV_IDENTIFIER":
        return {
          _type: "DV_IDENTIFIER",
          issuer: "example",
          assigner: "example",
          id: "example-id",
          type: "example",
        };
      case "CODE_PHRASE":
        return this.codePhrase("local", "at0000");
      default:
        if (rmType === "STRING") return this.exampleText(pathHint);
        if (rmType === "INTEGER") return 1;
        if (rmType === "REAL") return 1.0;
        if (rmType === "BOOLEAN") return true;
        return {
          _type: rmType || "DV_TEXT",
          value: this.exampleText(pathHint),
        };
    }
  }

  private collectTerms(
    template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE,
  ): TermBag {
    const ontology = template.ontology as
      | { term_definitions?: Record<string, TermBag> }
      | undefined;
    const defs = ontology?.term_definitions ?? {};
    return defs[this.language] ?? defs.en ?? Object.values(defs)[0] ?? {};
  }

  private termText(code?: string): string | undefined {
    if (!code) return undefined;
    for (const candidate of termCodeCandidates(code)) {
      const term = this.terms[candidate];
      const text = termLabel(term?.text);
      if (text) return text;
    }
    return undefined;
  }

  private nodeIdToAtCode(nodeId: string): string {
    return termCodeCandidates(nodeId)[1] ?? nodeId;
  }

  private readableRmType(rmType: string): string {
    return rmType
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private exampleText(pathHint: string): string {
    const leaf = pathHint.split(/[.[\]]/).filter(Boolean).pop() ?? "value";
    return `Example ${leaf.replace(/_/g, " ")}`;
  }

  private dvText(value: string): any {
    return { _type: "DV_TEXT", value };
  }

  private dvCodedText(value: string, terminology: string, code: string): any {
    return {
      _type: "DV_CODED_TEXT",
      value,
      defining_code: this.codePhrase(terminology, code),
    };
  }

  private codePhrase(terminology: string, code: string): any {
    return {
      _type: "CODE_PHRASE",
      terminology_id: { value: terminology },
      code_string: code,
    };
  }

  private dvDateTime(): any {
    return { _type: "DV_DATE_TIME", value: "2026-01-01T12:00:00Z" };
  }
}

function termLabel(val: unknown): string | undefined {
  if (typeof val === "string" && val && val !== "[object Object]") return val;
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    return termLabel(o.value) ?? termLabel(o.text) ?? termLabel(o["#text"]);
  }
  return undefined;
}

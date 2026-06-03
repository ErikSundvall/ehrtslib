/**
 * RM Instance Generator
 *
 * Generates valid RM instances from operational templates/archetypes.
 * Modes:
 * - minimal: mandatory RM + template constraints only
 * - example: minimal + one example per template-defined field (optional included)
 * - maximal: everything allowed by RM + template (upper cardinality, all siblings)
 */

import * as openehr_am from "../openehr_am.ts";
import {
  type ArchetypeResolver,
  resolveConstraintObject,
} from "../am/flattening/template_flattener.ts";
import {
  arrayItemCount,
  isAttributeMandatory,
  isProhibited,
} from "./constraint_utils.ts";
import {
  generateDvFromRmTypeName,
  generatePrimitiveValue,
  isDataValueRmType,
} from "./dv_value_generator.ts";

const MANDATORY_RM_ATTRIBUTES: Record<string, readonly string[]> = {
  COMPOSITION: ["language", "territory", "category", "composer"],
  OBSERVATION: ["data"],
  INSTRUCTION: ["narrative"],
  ACTION: ["time"],
  HISTORY: ["origin"],
  EVENT: ["time"],
  POINT_EVENT: ["time"],
  INTERVAL_EVENT: ["time", "math_function"],
  CLUSTER: ["items"],
  EVALUATION: ["data"],
  ADMIN_ENTRY: ["data"],
  SECTION: ["items"],
  ITEM_TREE: ["items"],
  ITEM_LIST: ["items"],
  ITEM_TABLE: ["rows"],
  ITEM_SINGLE: ["item"],
  ELEMENT: [],
};

const LOCATABLE_TYPES = new Set([
  "COMPOSITION", "SECTION", "OBSERVATION", "EVALUATION", "INSTRUCTION", "ACTION",
  "ADMIN_ENTRY", "CLUSTER", "ELEMENT", "ITEM_TREE", "ITEM_LIST", "ITEM_TABLE",
  "ITEM_SINGLE", "HISTORY", "EVENT", "POINT_EVENT", "INTERVAL_EVENT",
]);

export type GenerationMode = "minimal" | "example" | "maximal";

export interface GeneratorConfig {
  mode?: GenerationMode;
  fillOptional?: boolean;
  maxDepth?: number;
  includeMandatoryRMAttributes?: boolean;
  /** Resolve C_ARCHETYPE_ROOT / slots while generating (requires loaded archetypes). */
  resolver?: ArchetypeResolver;
}

const ARRAY_CONTAINER_ATTRIBUTES = new Set([
  "items",
  "content",
  "events",
  "activities",
  "protocol",
  "parts",
  "other_participations",
  "relationships",
  "identities",
  "details",
]);

function isArrayContainerAttribute(attrName: string): boolean {
  return ARRAY_CONTAINER_ATTRIBUTES.has(attrName);
}

export class RMInstanceGenerator {
  private config: GeneratorConfig;

  constructor(config?: GeneratorConfig) {
    this.config = {
      mode: "example",
      fillOptional: undefined,
      maxDepth: 50,
      includeMandatoryRMAttributes: true,
      ...config,
    };
  }

  generate(
    template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE,
  ): unknown {
    if (!template.definition) {
      throw new Error("Template has no definition");
    }
    return this.generateFromCObject(template.definition, 0);
  }

  private generateFromCObject(
    cObject: openehr_am.C_OBJECT,
    depth: number,
  ): unknown {
    if (depth > (this.config.maxDepth || 50)) {
      return null;
    }

    let node = cObject;
    if (this.config.resolver) {
      node = resolveConstraintObject(cObject, this.config.resolver);
    }

    if (isProhibited(node.occurrences)) {
      return null;
    }

    const rmType = node.rm_type_name ?? "";

    if (node instanceof openehr_am.C_PRIMITIVE_OBJECT) {
      return generatePrimitiveValue(node);
    }

    if (
      isDataValueRmType(rmType) &&
      (!(node instanceof openehr_am.C_COMPLEX_OBJECT) ||
        !node.attributes?.length)
    ) {
      return generateDvFromRmTypeName(rmType, node);
    }

    const instance: Record<string, unknown> = {
      _type: rmType,
    };

    if (node instanceof openehr_am.C_COMPLEX_OBJECT) {
      this.applyLocatableIdentity(instance, node);
      this.generateAttributes(instance, node, depth);
    }

    return instance;
  }

  private applyLocatableIdentity(
    instance: Record<string, unknown>,
    cObject: openehr_am.C_COMPLEX_OBJECT,
  ): void {
    if (!cObject.rm_type_name || !LOCATABLE_TYPES.has(cObject.rm_type_name)) {
      return;
    }
    if (cObject.node_id) {
      instance.archetype_node_id = cObject.node_id;
    }
    if (!instance.name) {
      instance.name = {
        _type: "DV_TEXT",
        value: cObject.rm_type_name,
      };
    }
  }

  private generateAttributes(
    instance: Record<string, unknown>,
    cObject: openehr_am.C_COMPLEX_OBJECT,
    depth: number,
  ): void {
    const generatedAttributes = new Set<string>();
    const mode = this.config.mode ?? "example";

    if (cObject.attributes) {
      for (const cAttribute of cObject.attributes) {
        const attrName = cAttribute.rm_attribute_name;
        if (!attrName) continue;

        const children = (cAttribute as { children?: openehr_am.C_OBJECT[] })
          .children ?? [];
        if (!children.length) continue;

        const viableChildren = children.filter((ch) =>
          !isProhibited(ch.occurrences)
        );
        if (!viableChildren.length) continue;

        const isMultiple = cAttribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE;
        const isContainerArray = isMultiple ||
          (viableChildren.length > 1 && isArrayContainerAttribute(attrName));

        const targets: openehr_am.C_OBJECT[] = [];
        for (const child of viableChildren) {
          const required = isAttributeMandatory(cAttribute, child);
          if (this.shouldIncludeChild(cAttribute, child, required, depth)) {
            targets.push(child);
          }
        }

        if (!targets.length) continue;

        generatedAttributes.add(attrName);

        if (isContainerArray) {
          const values: unknown[] = [];
          for (const child of targets) {
            const required = isAttributeMandatory(cAttribute, child);
            const count = arrayItemCount(
              mode,
              required,
              isMultiple ? cAttribute.cardinality : undefined,
              child.occurrences,
            );
            for (let i = 0; i < count; i++) {
              const childInstance = this.generateFromCObject(child, depth + 1);
              if (childInstance != null) values.push(childInstance);
            }
          }
          if (values.length) instance[attrName] = values;
        } else {
          instance[attrName] = this.generateFromCObject(targets[0], depth + 1);
        }
      }
    }

    if (this.config.includeMandatoryRMAttributes !== false) {
      this.addMandatoryRMAttributes(
        instance,
        cObject.rm_type_name ?? "",
        generatedAttributes,
        cObject,
      );
    }

    this.fillDataValueLeaves(instance, cObject, depth);
  }

  /**
   * After structural generation, ensure DV leaf attributes under constrained nodes have values.
   */
  private fillDataValueLeaves(
    instance: Record<string, unknown>,
    cObject: openehr_am.C_COMPLEX_OBJECT,
    depth: number,
  ): void {
    if (this.config.mode === "minimal") return;
    if (!cObject.attributes?.length) return;

    for (const cAttribute of cObject.attributes) {
      const attrName = cAttribute.rm_attribute_name;
      if (!attrName) continue;
      const current = instance[attrName];
      if (current === undefined || current === null) continue;

      const children = (cAttribute as { children?: openehr_am.C_OBJECT[] })
        .children ?? [];
      const child = children[0];
      if (!child) continue;

      const rmType = child.rm_type_name ?? "";
      if (!isDataValueRmType(rmType)) continue;

      const needsFill = typeof current === "object" &&
        current !== null &&
        !Array.isArray(current) &&
        Object.keys(current as Record<string, unknown>).length <= 1;

      if (needsFill) {
        instance[attrName] = this.generateFromCObject(child, depth + 1);
      }
    }
  }

  private shouldIncludeChild(
    cAttribute: openehr_am.C_ATTRIBUTE,
    child: openehr_am.C_OBJECT,
    isRequired: boolean,
    _depth: number,
  ): boolean {
    if (isProhibited(child.occurrences)) return false;
    if (isRequired) return true;

    if (typeof this.config.fillOptional === "boolean") {
      return this.config.fillOptional;
    }

    switch (this.config.mode) {
      case "minimal":
        return false;
      case "maximal":
      case "example":
        return true;
      default:
        return true;
    }
  }

  private addMandatoryRMAttributes(
    instance: Record<string, unknown>,
    rmTypeName: string,
    generatedAttributes: Set<string>,
    cObject: openehr_am.C_COMPLEX_OBJECT,
  ): void {
    const mandatory = new Set<string>(
      MANDATORY_RM_ATTRIBUTES[rmTypeName] ?? [],
    );
    if (LOCATABLE_TYPES.has(rmTypeName)) {
      mandatory.add("archetype_node_id");
      if (!mandatory.has("name") && rmTypeName !== "ELEMENT") {
        mandatory.add("name");
      }
    }

    for (const attrName of mandatory) {
      if (generatedAttributes.has(attrName)) continue;
      const value = this.generateMandatoryRmAttribute(
        rmTypeName,
        attrName,
        cObject,
      );
      if (value !== undefined) {
        instance[attrName] = value;
      }
    }
  }

  private generateMandatoryRmAttribute(
    rmTypeName: string,
    attrName: string,
    cObject: openehr_am.C_COMPLEX_OBJECT,
  ): unknown {
    if (attrName === "archetype_node_id") {
      return cObject.node_id ?? undefined;
    }

    switch (`${rmTypeName}.${attrName}`) {
      case "COMPOSITION.language":
        return {
          _type: "CODE_PHRASE",
          terminology_id: { value: "ISO_639-1" },
          code_string: "en",
        };
      case "COMPOSITION.territory":
        return {
          _type: "CODE_PHRASE",
          terminology_id: { value: "ISO_3166-1" },
          code_string: "US",
        };
      case "COMPOSITION.category":
        return {
          _type: "DV_CODED_TEXT",
          value: "event",
          defining_code: {
            _type: "CODE_PHRASE",
            terminology_id: { value: "openehr" },
            code_string: "433",
          },
        };
      case "COMPOSITION.composer":
        return { _type: "PARTY_IDENTIFIED", name: "Example composer" };
      case "INSTRUCTION.narrative":
        return { _type: "DV_TEXT", value: "Example instruction narrative" };
      case "ACTION.time":
      case "EVENT.time":
      case "POINT_EVENT.time":
        return { _type: "DV_DATE_TIME", value: new Date().toISOString() };
      case "HISTORY.origin":
        return { _type: "DV_DATE_TIME", value: new Date().toISOString() };
      case "INTERVAL_EVENT.math_function":
        return {
          _type: "DV_CODED_TEXT",
          value: "actual",
          defining_code: {
            _type: "CODE_PHRASE",
            terminology_id: { value: "openehr" },
            code_string: "640",
          },
        };
      case "CLUSTER.items":
      case "SECTION.items":
      case "ITEM_TREE.items":
      case "ITEM_LIST.items":
        return [];
      default:
        if (attrName === "name") {
          return { _type: "DV_TEXT", value: rmTypeName };
        }
        if (attrName === "data") {
          return null;
        }
        return undefined;
    }
  }
}

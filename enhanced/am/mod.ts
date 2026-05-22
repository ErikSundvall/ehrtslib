/**
 * Archetype Model utilities (flattening, differential extraction).
 */

export { cloneAttribute, cloneCObject, cloneComplexObject } from "./aom_clone.ts";

export {
  type ArchetypeResolver,
  extractDifferentialDefinition,
  flattenArchetypeDefinition,
  flattenToOperationalTemplate,
} from "./flattening/template_flattener.ts";

export { specializeComplexObject } from "./flattening/specialize.ts";

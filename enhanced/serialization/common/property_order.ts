import type { ArchetypeNodeIdLocation, NameLocation } from "./types.ts";

export type { NameLocation };

export interface PropertyOrderOptions {
  archetypeNodeIdLocation?: ArchetypeNodeIdLocation;
  nameLocation?: NameLocation;
}

/**
 * Order RM object property keys for serialization readability.
 *
 * When `archetypeNodeIdLocation` is `beginning`, archetype_node_id is placed first
 * (before name), overriding `nameLocation`.
 */
export function orderSerializationKeys(
  props: string[],
  options: PropertyOrderOptions = {},
): string[] {
  const archIdLocation = options.archetypeNodeIdLocation ?? "after_name";
  const nameLocation = options.nameLocation ?? "default";

  const hasArchId = props.includes("archetype_node_id");
  const hasName = props.includes("name");
  const others = props.filter((k) => k !== "archetype_node_id" && k !== "name");

  if (!hasArchId) {
    if (nameLocation === "beginning" && hasName) {
      return ["name", ...others];
    }
    return [...props];
  }

  if (archIdLocation === "beginning") {
    const head: string[] = ["archetype_node_id"];
    if (hasName) head.push("name");
    return [...head, ...others];
  }

  if (archIdLocation === "after_name") {
    if (nameLocation === "beginning" && hasName) {
      return ["name", "archetype_node_id", ...others];
    }
    const rest = props.filter((k) => k !== "archetype_node_id");
    const ordered: string[] = [];
    let archPlaced = false;
    for (const key of rest) {
      ordered.push(key);
      if (key === "name") {
        ordered.push("archetype_node_id");
        archPlaced = true;
      }
    }
    if (!archPlaced) ordered.push("archetype_node_id");
    return ordered;
  }

  // end
  if (nameLocation === "beginning" && hasName) {
    return ["name", ...others, "archetype_node_id"];
  }
  const rest = props.filter((k) => k !== "archetype_node_id");
  return [...rest, "archetype_node_id"];
}

/**
 * Shared types for serialization configuration
 */

/**
 * Location of the archetype_node_id property in the serialized output
 */
export type ArchetypeNodeIdLocation = 'beginning' | 'after_name' | 'end';

/** Where to place the `name` attribute among locatable object properties. */
export type NameLocation = 'default' | 'beginning';

/**
 * Deserialize STRUCTURED JSON payloads to RM composition instances.
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

import type { WebTemplate } from "./types.ts";
import { deserializeFromFlat } from "./flat_deserializer.ts";
import { structuredToFlat } from "./structured_to_flat.ts";

type RmObject = Record<string, unknown>;
type StructuredValue = Record<string, unknown>;

export class StructuredDeserializer {
  constructor(private webTemplate: WebTemplate) {}

  deserialize(structured: StructuredValue): RmObject {
    const flat = structuredToFlat(structured, this.webTemplate);
    return deserializeFromFlat(flat, this.webTemplate);
  }

  deserializeJson(json: string): RmObject {
    return this.deserialize(JSON.parse(json) as StructuredValue);
  }
}

export function deserializeFromStructured(
  structured: StructuredValue,
  webTemplate: WebTemplate,
): RmObject {
  return new StructuredDeserializer(webTemplate).deserialize(structured);
}

export function deserializeFromStructuredJson(
  json: string,
  webTemplate: WebTemplate,
): RmObject {
  return new StructuredDeserializer(webTemplate).deserializeJson(json);
}

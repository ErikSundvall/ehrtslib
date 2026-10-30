/**
 * Deserialize STRUCTURED JSON payloads to RM composition instances.
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

import type { WebTemplate } from "./types.ts";
import {
  deserializeFromFlat,
  type FlatDeserializeOptions,
} from "./flat_deserializer.ts";
import { structuredToFlat } from "./structured_to_flat.ts";

type RmObject = Record<string, unknown>;
type StructuredValue = Record<string, unknown>;

export class StructuredDeserializer {
  constructor(
    private webTemplate: WebTemplate,
    private options: FlatDeserializeOptions = {},
  ) {}

  deserialize(structured: StructuredValue): RmObject {
    const flat = structuredToFlat(structured, this.webTemplate);
    return deserializeFromFlat(flat, this.webTemplate, this.options);
  }

  deserializeJson(json: string): RmObject {
    return this.deserialize(JSON.parse(json) as StructuredValue);
  }
}

export function deserializeFromStructured(
  structured: StructuredValue,
  webTemplate: WebTemplate,
  options?: FlatDeserializeOptions,
): RmObject {
  return new StructuredDeserializer(webTemplate, options).deserialize(structured);
}

export function deserializeFromStructuredJson(
  json: string,
  webTemplate: WebTemplate,
  options?: FlatDeserializeOptions,
): RmObject {
  return new StructuredDeserializer(webTemplate, options).deserializeJson(json);
}

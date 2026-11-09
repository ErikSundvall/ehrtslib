/**
 * AsciiDoc deserializer for the structural (round-trip) openEHR document dialect.
 */

import {
  applyCompositionEntryDefaults,
  blocksToRmObject,
  detectDocumentDialect,
  type DocumentMetadata,
} from "../documents_common/mod.ts";
import { DeserializationError, InvalidFormatError } from "../common/errors.ts";
import { validateDeserializedInstance } from "../common/post_deserialize_validation.ts";
import { extractStructuralCompositionFromText } from "../documents_common/document_structural_deserialize.ts";
import { lexAsciidocLossless } from "./asciidoc_lexer.ts";
import {
  type AsciidocDeserializationConfig,
  DEFAULT_ASCIIDOC_DESERIALIZATION_CONFIG,
  STRUCTURAL_ASCIIDOC_DIALECT,
} from "./asciidoc_deserialize_config.ts";

export class AsciidocDeserializer {
  private config: Required<AsciidocDeserializationConfig>;

  constructor(config: AsciidocDeserializationConfig = {}) {
    this.config = { ...DEFAULT_ASCIIDOC_DESERIALIZATION_CONFIG, ...config };
  }

  deserialize<T = Record<string, unknown>>(adoc: string): T {
    const dialect = detectDocumentDialect(adoc);
    if (
      this.config.dialect === STRUCTURAL_ASCIIDOC_DIALECT &&
      dialect !== "structural_lossless"
    ) {
      throw new InvalidFormatError(
        "Input does not look like structural AsciiDoc (missing attribute header, type annotations, or archetype node-id comments). " +
          "Compact, embedding, and wikilink AsciiDoc are output-only.",
        adoc,
      );
    }

    try {
      const { frontmatter, blocks } = lexAsciidocLossless(adoc);
      const meta: DocumentMetadata = { frontmatter };
      const fromTail = this.config.dialect === STRUCTURAL_ASCIIDOC_DIALECT
        ? extractStructuralCompositionFromText(adoc)
        : null;
      let instance = fromTail ?? blocksToRmObject(blocks, meta, {
        validateAgainstTemplate: this.config.validateAgainstTemplate,
      });
      if (fromTail) applyCompositionEntryDefaults(instance, meta);
      this.maybeValidate(instance, adoc);
      return instance as T;
    } catch (error) {
      if (error instanceof DeserializationError) throw error;
      throw new DeserializationError(
        `Failed to deserialize AsciiDoc: ${error instanceof Error ? error.message : String(error)}`,
        adoc,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private maybeValidate(instance: unknown, adoc: string): void {
    const template = this.config.validateAgainstTemplate;
    if (!template) return;
    const result = validateDeserializedInstance(instance, {
      validateAgainstTemplate: template,
    });
    if (result && !result.valid) {
      throw new DeserializationError(
        `Deserialized AsciiDoc failed template validation: ${result.summary ?? "invalid"}`,
        adoc,
      );
    }
  }
}

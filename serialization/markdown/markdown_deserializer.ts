/**
 * Markdown deserializer for structural (lossless) openEHR document dialect.
 */

import type { openehr_am } from "../../am/openehr_am.ts";
import {
  applyCompositionEntryDefaults,
  blocksToRmObject,
  detectDocumentDialect,
  type DocumentMetadata,
} from "../documents_common/mod.ts";
import { DeserializationError, InvalidFormatError } from "../common/errors.ts";
import { validateDeserializedInstance } from "../common/post_deserialize_validation.ts";
import { extractStructuralCompositionFromText } from "../documents_common/document_structural_deserialize.ts";
import { lexMarkdownStructural, parseMarkdownFrontmatter } from "./markdown_lexer.ts";
import {
  type MarkdownDeserializationConfig,
  DEFAULT_MARKDOWN_DESERIALIZATION_CONFIG,
  STRUCTURAL_MARKDOWN_DIALECT,
} from "./markdown_deserialize_config.ts";

export class MarkdownDeserializer {
  private config: Required<MarkdownDeserializationConfig>;

  constructor(config: MarkdownDeserializationConfig = {}) {
    this.config = { ...DEFAULT_MARKDOWN_DESERIALIZATION_CONFIG, ...config };
  }

  deserialize<T = Record<string, unknown>>(markdown: string): T {
    const dialect = detectDocumentDialect(markdown);
    if (
      this.config.dialect === STRUCTURAL_MARKDOWN_DIALECT &&
      dialect !== "structural_lossless"
    ) {
      throw new InvalidFormatError(
        "Input does not look like structural Markdown (missing frontmatter, type annotations, or archetype node-id markers). " +
          "Embedding, compact, and wikilink Markdown are output-only and cannot be parsed losslessly.",
        markdown,
      );
    }

    try {
      const { body, frontmatter } = parseMarkdownFrontmatter(markdown);
      const meta: DocumentMetadata = { frontmatter };
      const fromTail = this.config.dialect === STRUCTURAL_MARKDOWN_DIALECT
        ? extractStructuralCompositionFromText(markdown)
        : null;
      let instance = fromTail ?? blocksToRmObject(lexMarkdownStructural(body), meta, {
        validateAgainstTemplate: this.config.validateAgainstTemplate,
      });
      if (fromTail) applyCompositionEntryDefaults(instance, meta);
      this.maybeValidate(instance, markdown);
      return instance as T;
    } catch (error) {
      if (error instanceof DeserializationError) throw error;
      throw new DeserializationError(
        `Failed to deserialize Markdown: ${error instanceof Error ? error.message : String(error)}`,
        markdown,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private maybeValidate(instance: unknown, markdown: string): void {
    const template = this.config.validateAgainstTemplate;
    if (!template) return;
    const result = validateDeserializedInstance(instance, {
      validateAgainstTemplate: template,
    });
    if (result && !result.valid) {
      throw new DeserializationError(
        `Deserialized Markdown failed template validation: ${result.summary ?? "invalid"}`,
        markdown,
      );
    }
  }
}

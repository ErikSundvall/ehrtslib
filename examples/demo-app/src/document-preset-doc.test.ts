import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import {
  DEMO_DOCUMENT_PRESET_OPTION_VALUES,
  DOCUMENT_PRESET_DOC_ANCHORS,
  DOCUMENT_PRESET_SELECT_IDS,
  documentPresetDocUrl,
} from "./document-preset-doc.ts";
import { DOCUMENT_PRESET_DOC_PATH } from "../../../serialization/documents_common/document_preset_rules.ts";

const INDEX_HTML = new URL("../public/index.html", import.meta.url);

Deno.test("document preset doc: anchors exist in documents-presets.md", async () => {
  const docPath = new URL(
    `../../../${DOCUMENT_PRESET_DOC_PATH}`,
    import.meta.url,
  );
  const text = await Deno.readTextFile(docPath);
  for (const anchor of DOCUMENT_PRESET_DOC_ANCHORS) {
    if (anchor === "rm-simplification-rules") {
      assertStringIncludes(text, "## RM simplification rules");
    } else {
      assertStringIncludes(text, `## ${anchor}`);
    }
  }
});

Deno.test("demo index.html: preset selects link to matching doc anchors", async () => {
  const html = await Deno.readTextFile(INDEX_HTML);
  for (const selectId of DOCUMENT_PRESET_SELECT_IDS) {
    assertStringIncludes(html, `id="${selectId}"`);
    const linkId = selectId.replace("-config-preset", "-preset-doc-link");
    assertStringIncludes(html, `id="${linkId}"`);
    assertStringIncludes(html, "About formats");
    for (const value of DEMO_DOCUMENT_PRESET_OPTION_VALUES) {
      assertStringIncludes(html, `value="${value}"`);
    }
    const expectedHref = documentPresetDocUrl("structural");
    assertStringIncludes(html, expectedHref.split("#")[0]);
  }
});

Deno.test("documentPresetDocUrl builds GitHub fragment links", () => {
  assertEquals(
    documentPresetDocUrl("compact"),
    "https://github.com/ErikSundvall/ehrtslib/blob/main/serialization/documents-presets.md#compact",
  );
  assert(
  DOCUMENT_PRESET_DOC_ANCHORS.includes("rm-simplification-rules"),
  );
});

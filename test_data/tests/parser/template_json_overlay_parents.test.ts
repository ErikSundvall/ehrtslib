/**
 * AD@git `.t.json` closure must fetch TEMPLATE_OVERLAY parent archetypes
 * (issue #64). Snapshot overlays already carry terms; differential ones do not.
 */

import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.220.0/path/mod.ts";
import {
  collectTemplateJsonExternalRefsFromText,
} from "../../../parser/template_json_dependencies.ts";
import {
  loadGitHubTemplateClosure,
} from "../../../parser/github_template_closure.ts";
import {
  ClinicalModelWorkspace,
  parseTemplateJson,
} from "../../../parser/mod.ts";
import { buildWebTemplate } from "../../../serialization/simplified/web_template_builder.ts";
import type { WebTemplateNode } from "../../../serialization/simplified/types.ts";

const OVERLAY_ID = "openEHR-EHR-EVALUATION.ovl-problem_diagnosis-001.v1";
const OVERLAY_PARENT = "openEHR-EHR-EVALUATION.problem_diagnosis.v1";
const BP_OVERLAY_ID = "openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v1";
const BP_PARENT = "openEHR-EHR-OBSERVATION.blood_pressure.v2";
const DEVICE_ID = "openEHR-EHR-CLUSTER.device.v1";
const COMPOSITION_PARENT = "openEHR-EHR-COMPOSITION.encounter.v1";

/** Differential template: overlay C_ARCHETYPE_ROOT + empty overlay terms. */
function differentialTemplateJson(opts?: {
  snakeCase?: boolean;
  extraNestedRoot?: boolean;
  /** Minimal overlay tree for flatten/name tests (no nested roots). */
  forFlatten?: boolean;
}): string {
  const overlaysKey = opts?.snakeCase ? "template_overlays" : "templateOverlays";
  const parentKey = opts?.snakeCase ? "parent_archetype_id" : "parentArchetypeId";
  const forFlatten = opts?.forFlatten === true;
  const includeNested = !forFlatten && opts?.extraNestedRoot !== false;
  const nestedDevice = includeNested
    ? [{
      "@type": "C_ARCHETYPE_ROOT",
      "rmTypeName": "CLUSTER",
      "nodeId": "at0.1",
      "archetypeRef": DEVICE_ID,
    }]
    : [];
  const bpRoot = {
    "@type": "C_ARCHETYPE_ROOT",
    "rmTypeName": "OBSERVATION",
    "nodeId": "at0.2",
    "archetypeRef": BP_OVERLAY_ID,
  };
  return JSON.stringify({
    "@type": "TEMPLATE",
    [parentKey]: COMPOSITION_PARENT,
    "differential": true,
    "archetypeId": {
      "@type": "ARCHETYPE_HRID",
      "value": "openEHR-EHR-COMPOSITION.t_simple_dx.v1",
    },
    "originalLanguage": {
      "terminologyId": { "value": "ISO_639-1" },
      "codeString": "en",
    },
    "definition": {
      "@type": "C_COMPLEX_OBJECT",
      "rmTypeName": "COMPOSITION",
      "nodeId": "at0000.1",
      "attributes": [{
        "@type": "C_ATTRIBUTE",
        "rmAttributeName": "content",
        "children": [{
          "@type": "C_ARCHETYPE_ROOT",
          "rmTypeName": "EVALUATION",
          // Flatten tests use the overlay concept id so term lookup hits at0000,
          // not the parent ITEM_TREE code at0001 ("Tree").
          "nodeId": forFlatten ? "at0000.1" : "at0001.1",
          "archetypeRef": OVERLAY_ID,
        }],
      }],
    },
    "terminology": {
      "@type": "ARCHETYPE_TERMINOLOGY",
      "conceptCode": "at0000.1",
      "termDefinitions": { "en": {} },
    },
    [overlaysKey]: [
      {
        "@type": "TEMPLATE_OVERLAY",
        [parentKey]: OVERLAY_PARENT,
        "differential": true,
        "archetypeId": { "@type": "ARCHETYPE_HRID", "value": OVERLAY_ID },
        "definition": {
          "@type": "C_COMPLEX_OBJECT",
          "rmTypeName": "EVALUATION",
          "nodeId": "at0000.1",
          "attributes": [{
            "@type": "C_ATTRIBUTE",
            "rmAttributeName": "data",
            "children": [{
              "@type": "C_COMPLEX_OBJECT",
              "rmTypeName": "ITEM_TREE",
              "nodeId": "at0001.1",
              "attributes": [{
                "@type": "C_ATTRIBUTE",
                "rmAttributeName": "items",
                "children": [
                  {
                    "@type": "C_COMPLEX_OBJECT",
                    "rmTypeName": "ELEMENT",
                    "nodeId": "at0002.1",
                    "attributes": [],
                  },
                  {
                    "@type": "C_COMPLEX_OBJECT",
                    "rmTypeName": "ELEMENT",
                    "nodeId": "at0005.1",
                    "attributes": [],
                  },
                  ...nestedDevice,
                  ...(includeNested ? [bpRoot] : []),
                ],
              }],
            }],
          }],
        },
        "terminology": {
          "@type": "ARCHETYPE_TERMINOLOGY",
          "termDefinitions": {},
        },
      },
      ...(includeNested
        ? [{
          "@type": "TEMPLATE_OVERLAY",
          [parentKey]: BP_PARENT,
          "differential": true,
          "archetypeId": { "@type": "ARCHETYPE_HRID", "value": BP_OVERLAY_ID },
          "definition": {
            "@type": "C_COMPLEX_OBJECT",
            "rmTypeName": "OBSERVATION",
            "nodeId": "at0000.1",
            "attributes": [],
          },
          "terminology": {
            "@type": "ARCHETYPE_TERMINOLOGY",
            "termDefinitions": {},
          },
        }]
        : []),
    ],
  });
}

function snapshotTemplateJson(): string {
  return JSON.stringify({
    "@type": "TEMPLATE",
    "parentArchetypeId": COMPOSITION_PARENT,
    "differential": false,
    "archetypeId": { "value": "openEHR-EHR-COMPOSITION.t_snapshot_dx.v1" },
    "originalLanguage": {
      "terminologyId": { "value": "ISO_639-1" },
      "codeString": "en",
    },
    "definition": {
      "@type": "C_COMPLEX_OBJECT",
      "rmTypeName": "COMPOSITION",
      "nodeId": "at0000.1",
      "attributes": [{
        "@type": "C_ATTRIBUTE",
        "rmAttributeName": "content",
        "children": [{
          "@type": "C_ARCHETYPE_ROOT",
          "rmTypeName": "EVALUATION",
          "nodeId": "at0000.1",
          "archetypeRef": OVERLAY_ID,
        }],
      }],
    },
    "terminology": { "termDefinitions": { "en": {} } },
    "templateOverlays": [{
      "@type": "TEMPLATE_OVERLAY",
      "parentArchetypeId": OVERLAY_PARENT,
      "differential": false,
      "archetypeId": { "value": OVERLAY_ID },
      "definition": {
        "@type": "C_COMPLEX_OBJECT",
        "rmTypeName": "EVALUATION",
        "nodeId": "at0000.1",
        "attributes": [{
          "@type": "C_ATTRIBUTE",
          "rmAttributeName": "data",
          "children": [{
            "@type": "C_COMPLEX_OBJECT",
            "rmTypeName": "ITEM_TREE",
            "nodeId": "at0001.1",
            "attributes": [{
              "@type": "C_ATTRIBUTE",
              "rmAttributeName": "items",
              "children": [{
                "@type": "C_COMPLEX_OBJECT",
                "rmTypeName": "ELEMENT",
                "nodeId": "at0002.1",
                "attributes": [],
              }],
            }],
          }],
        }],
      },
      "terminology": {
        "termDefinitions": {
          "en": {
            "at0000.1": { "text": "Snapshot problem", "description": "overlay root" },
            "at0002.1": {
              "text": "Snapshot problem name",
              "description": "from overlay",
            },
          },
        },
      },
    }],
  });
}

function evaluationParentAdl(): string {
  // ADL 2 keeps at-codes (ADL 1.4 conversion remaps them to idN, so overlay
  // at0002.1 would not match parent terminology keys).
  return `archetype (adl_version=2.0.6; rm_release=1.0.4)
    ${OVERLAY_PARENT}

language
    original_language = <[ISO_639-1::en]>

description
    original_author = <
        ["name"] = <"test">
    >
    lifecycle_state = <"unmanaged">

definition
    EVALUATION[at0000] matches {
        data matches {
            ITEM_TREE[at0001] matches {
                items matches {
                    ELEMENT[at0002] occurrences matches {0..1} matches {
                        value matches {
                            DV_TEXT
                        }
                    }
                    ELEMENT[at0005] occurrences matches {0..1} matches {
                        value matches {
                            DV_TEXT
                        }
                    }
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            items = <
                ["at0000"] = <
                    text = <"Problem/Diagnosis">
                    description = <"A problem or diagnosis.">
                >
                ["at0001"] = <
                    text = <"Tree">
                    description = <"@ internal @">
                >
                ["at0002"] = <
                    text = <"Problem/Diagnosis name">
                    description = <"The identified problem or diagnosis.">
                >
                ["at0005"] = <
                    text = <"Severity">
                    description = <"Severity of the problem.">
                >
            >
        >
    >
`;
}

function stubAdl(id: string, rmType: string, concept: string): string {
  return `archetype
    ${id}

language
    original_language = <[ISO_639-1::en]>

description
    original_author = <
        ["name"] = <"test">
    >
    lifecycle_state = <"unmanaged">

revision
    1.0.0

concept
    at0000

definition
    ${rmType}[at0000] matches {
    }

ontology
    term_definitions = <
        ["en"] = <
            items = <
                ["at0000"] = <
                    text = <"${concept}">
                    description = <"${concept}">
                >
            >
        >
    >
`;
}

function mockGitHubFetch(
  files: Record<string, string>,
): typeof fetch {
  const sha = "abc123def456";
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.href
      : input.url;
    if (url.includes("/repos/") && url.includes("/branches/")) {
      return new Response(JSON.stringify({ commit: { sha } }), { status: 200 });
    }
    if (url.includes("/git/trees/")) {
      const tree = Object.keys(files).map((path) => ({ path, type: "blob" }));
      return new Response(JSON.stringify({ tree }), { status: 200 });
    }
    const raw = url.match(
      /raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+)$/,
    );
    if (raw) {
      const path = decodeURIComponent(raw[1]);
      const content = files[path];
      if (content === undefined) {
        return new Response("missing", { status: 404 });
      }
      return new Response(content, { status: 200 });
    }
    return new Response(`unhandled ${url}`, { status: 418 });
  }) as typeof fetch;
}

function walkNames(
  node: WebTemplateNode,
  out: Array<{ nodeId?: string; name?: string; rmType: string }> = [],
): Array<{ nodeId?: string; name?: string; rmType: string }> {
  out.push({ nodeId: node.nodeId, name: node.name, rmType: node.rmType });
  for (const child of node.children ?? []) walkNames(child, out);
  return out;
}

Deno.test("collectTemplateJsonExternalRefsFromText includes overlay parents", () => {
  const refs = collectTemplateJsonExternalRefsFromText(
    differentialTemplateJson(),
  );
  assert(refs.includes(COMPOSITION_PARENT), `missing composition parent: ${refs}`);
  assert(refs.includes(OVERLAY_PARENT), `missing overlay parent: ${refs}`);
  assert(refs.includes(BP_PARENT), `missing nested overlay parent: ${refs}`);
  assert(refs.includes(DEVICE_ID), `missing nested C_ARCHETYPE_ROOT: ${refs}`);
  assertFalse(refs.includes(OVERLAY_ID), "must not fetch inlined overlay ids");
  assertFalse(refs.includes(BP_OVERLAY_ID), "must not fetch inlined overlay ids");
});

Deno.test("collectTemplateJsonExternalRefsFromText accepts template_overlays snake_case", () => {
  const refs = collectTemplateJsonExternalRefsFromText(
    differentialTemplateJson({ snakeCase: true }),
  );
  assert(refs.includes(OVERLAY_PARENT));
  assert(refs.includes(BP_PARENT));
});

Deno.test("Care unit v2 still lists CLUSTER.organisation parent, not overlay id", async () => {
  const fixture = await Deno.readTextFile(
    fromFileUrl(new URL("../../tjson/Care unit v2.t.json", import.meta.url)),
  );
  const refs = collectTemplateJsonExternalRefsFromText(fixture);
  assert(refs.some((r) => r.includes("openEHR-EHR-CLUSTER.organisation")));
  assertFalse(refs.some((r) => /ovl-organisation/i.test(r)));
});

Deno.test("parseTemplateJson maps overlay parent_archetype_id after camelCase remap", async () => {
  const fixture = await Deno.readTextFile(
    fromFileUrl(new URL("../../tjson/Care unit v2.t.json", import.meta.url)),
  );
  const { overlays } = parseTemplateJson(fixture);
  assert(overlays.length >= 1);
  assertEquals(
    overlays[0].parent_archetype_id?.value,
    "openEHR-EHR-CLUSTER.organisation.v1",
  );
});

Deno.test("mock GitHub closure fetches overlay parent ADLs", async () => {
  const tjson = differentialTemplateJson();
  const files: Record<string, string> = {
    "local/simple-dx.t.json": tjson,
    [`local/archetypes/${COMPOSITION_PARENT}.adl`]: stubAdl(
      COMPOSITION_PARENT,
      "COMPOSITION",
      "Encounter",
    ),
    [`local/archetypes/${OVERLAY_PARENT}.adl`]: evaluationParentAdl(),
    [`local/archetypes/${BP_PARENT}.adl`]: stubAdl(
      BP_PARENT,
      "OBSERVATION",
      "Blood pressure",
    ),
    [`local/archetypes/${DEVICE_ID}.adl`]: stubAdl(DEVICE_ID, "CLUSTER", "Device"),
  };
  const result = await loadGitHubTemplateClosure(
    "https://github.com/org/repo/blob/main/local/simple-dx.t.json",
    { fetch: mockGitHubFetch(files), maxFiles: 20 },
  );
  assertEquals(result.rootPath, "local/simple-dx.t.json");
  const paths = result.entries.map((e) => e.path);
  assert(paths.some((p) => p.endsWith(`${OVERLAY_PARENT}.adl`)), `${paths}`);
  assert(paths.some((p) => p.endsWith(`${BP_PARENT}.adl`)), `${paths}`);
  assert(paths.some((p) => p.endsWith(`${DEVICE_ID}.adl`)), `${paths}`);
  assertFalse(result.warnings.some((w) => w.includes(OVERLAY_PARENT)));
});

Deno.test("mock GitHub tree with only .t.json warns on overlay parents", async () => {
  const files = { "local/simple-dx.t.json": differentialTemplateJson() };
  const result = await loadGitHubTemplateClosure(
    "https://github.com/org/repo/blob/main/local/simple-dx.t.json",
    { fetch: mockGitHubFetch(files), maxFiles: 20 },
  );
  assertEquals(result.fetched, 1);
  assert(result.warnings.some((w) => w.includes(COMPOSITION_PARENT)));
  assert(result.warnings.some((w) => w.includes(OVERLAY_PARENT)));
  assert(result.warnings.some((w) => w.includes(BP_PARENT)));
});

Deno.test("flatten differential overlay uses parent ontology for web-template names", () => {
  const ws = new ClinicalModelWorkspace();
  ws.addFiles([
    {
      path: "local/simple-dx.t.json",
      content: differentialTemplateJson({ forFlatten: true }),
    },
    { path: `local/${OVERLAY_PARENT}.adl`, content: evaluationParentAdl() },
    {
      path: `local/${COMPOSITION_PARENT}.adl`,
      content: stubAdl(COMPOSITION_PARENT, "COMPOSITION", "Encounter"),
    },
  ]);
  const { operationalTemplate } = ws.resolveOperational();
  const wt = buildWebTemplate(operationalTemplate);
  const nodes = walkNames(wt.tree);
  const evaluation = nodes.find((n) => n.rmType === "EVALUATION");
  assert(evaluation, `missing EVALUATION: ${JSON.stringify(nodes)}`);
  assertEquals(evaluation.name, "Problem/Diagnosis");
  assertFalse(evaluation.name === "at0000.1");

  const nameEl = nodes.find((n) =>
    n.nodeId === "at0002.1" || n.nodeId === "at0002"
  );
  const severityEl = nodes.find((n) =>
    n.nodeId === "at0005.1" || n.nodeId === "at0005"
  );
  if (nameEl) {
    assertEquals(nameEl.name, "Problem/Diagnosis name");
    assertFalse(nameEl.name === "at0002.1");
  }
  if (severityEl) {
    assertEquals(severityEl.name, "Severity");
  }
});

Deno.test("flatten snapshot overlay keeps names without overlay parent ADL", () => {
  const ws = new ClinicalModelWorkspace();
  ws.addFile("local/snapshot.t.json", snapshotTemplateJson());
  const { operationalTemplate } = ws.resolveOperational();
  const wt = buildWebTemplate(operationalTemplate);
  const nodes = walkNames(wt.tree);
  const evaluation = nodes.find((n) => n.rmType === "EVALUATION");
  assert(evaluation, `missing snapshot EVALUATION: ${JSON.stringify(nodes)}`);
  assertEquals(evaluation.name, "Snapshot problem");
  const el = nodes.find((n) => n.nodeId === "at0002.1" || n.nodeId === "at0002");
  if (el) {
    assertEquals(el.name, "Snapshot problem name");
  }
});

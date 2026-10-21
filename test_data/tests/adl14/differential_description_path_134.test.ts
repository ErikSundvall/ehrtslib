/**
 * #134: a differential path through ACTIVITY.description must resolve.
 * `description` is also an ADL section keyword, so the path used to be cut
 * there and the constraint was dropped from the flattened template and the
 * OPT 1.4 export.
 */
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { Adl2TemplateLibrary } from "../../../generation/opt14/adl2_template_library.ts";
import { exportAdl2TemplateToOpt14 } from "../../../generation/opt14/opt14_exporter.ts";
import { type PObject, pWalk } from "../../../generation/opt14/p_model.ts";
import { parseAdl } from "../../../parser/mod.ts";

const PARENT = `archetype (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-INSTRUCTION.service_request.v1.0.0

language
    original_language = <[ISO_639-1::en]>

definition
    INSTRUCTION[id1] matches {
        activities matches {
            ACTIVITY[id2] matches {
                description matches {
                    ITEM_TREE[id10] matches {
                        items matches {
                            ELEMENT[id63] matches {
                                value matches {
                                    DV_TEXT
                                }
                            }
                        }
                    }
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"Service request"> description = <"Service request">>
            ["id2"] = <text = <"Activity"> description = <"Activity">>
            ["id10"] = <text = <"Tree"> description = <"Tree">>
            ["id63"] = <text = <"Reason"> description = <"Reason for request">>
        >
    >
`;

const TEMPLATE = `template (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-COMPOSITION.t_service_request.v1.0.0

language
    original_language = <[ISO_639-1::en]>

definition
    COMPOSITION[id1] matches {
        content matches {
            use_archetype INSTRUCTION[id2, openEHR-EHR-INSTRUCTION.t_service_request.v1]
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"Request composition"> description = <"Request composition">>
            ["id2"] = <text = <"Service request"> description = <"Service request">>
        >
    >

------------------------------------------------------------------------
template_overlay
    openEHR-EHR-INSTRUCTION.t_service_request.v1.0.0

specialize
    openEHR-EHR-INSTRUCTION.service_request.v1

definition
    INSTRUCTION[id1.1] matches {
        /activities[id2]/description[id10]/items[id63]/value matches {
            DV_CODED_TEXT[id9006.1] matches {
                defining_code matches {[ac0.1]}
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1.1"] = <text = <"Service request"> description = <"Service request">>
            ["at0.1"] = <text = <"Follow-up"> description = <"Follow-up">>
            ["at0.2"] = <text = <"Screening"> description = <"Screening">>
        >
    >
    value_sets = <
        ["ac0.1"] = <
            id = <"ac0.1">
            members = <"at0.1", "at0.2">
        >
    >
`;

function findNode(root: PObject, nodeId: string): PObject | undefined {
  let found: PObject | undefined;
  pWalk(root, (o) => {
    if (o.nodeId === nodeId) found = o;
  });
  return found;
}

Deno.test("#134 differential path keeps the description segment", () => {
  // deno-lint-ignore no-explicit-any
  const parsed: any = parseAdl(
    TEMPLATE.split(/\n-{5,}[ \t]*\n/)[1].replace(
      /^\s*template_overlay\b/,
      "archetype",
    ),
  );
  const names = parsed.archetype.definition.attributes.map(
    // deno-lint-ignore no-explicit-any
    (a: any) => a.rm_attribute_name,
  );
  assertEquals(names, [
    "/activities[id2]/description[id10]/items[id63]/value",
  ]);
});

Deno.test("#134 path through description constrains the element in OPT 1.4", () => {
  const lib = new Adl2TemplateLibrary();
  lib.addSource(PARENT);
  const ids = lib.addSource(TEMPLATE);
  const tid = ids[0];
  const overlay = lib.resolve("openEHR-EHR-INSTRUCTION.t_service_request.v1")!;
  const flat = lib.flatten(overlay);
  const lost = lib.warnings.filter((w) => w.includes("not found in parent"));
  assertEquals(lost, [], lib.warnings.join("\n"));

  const reason = findNode(flat.def, "id63");
  assert(reason, "reason element survives flattening");
  const value = reason!.attrs?.find((a) => a.name === "value");
  const coded = value?.children.find((c) => c.rmType === "DV_CODED_TEXT");
  assert(coded, "coded-text constraint is applied");
  const code = coded!.attrs?.find((a) => a.name === "defining_code")?.children
    .find((c) => c.kind === "term");
  assertEquals(code?.termConstraint, "ac0.1");
  assertEquals(flat.valueSets["ac0.1"], ["at0.1", "at0.2"]);

  const { xml, warnings } = exportAdl2TemplateToOpt14(lib, tid);
  assert(
    !warnings.some((w) => w.includes("not found in parent")),
    warnings.join("\n"),
  );
  assert(xml.includes("<rm_type_name>DV_CODED_TEXT</rm_type_name>"), xml);
  assert(xml.includes("<code_list>at0.1</code_list>"), xml);
  assert(xml.includes("<code_list>at0.2</code_list>"), xml);
});

Deno.test("#134 Archie request specialisation path through description flattens", () => {
  const dir = new URL(
    "../../archie-tests/flattening/",
    import.meta.url,
  );
  const lib = new Adl2TemplateLibrary();
  lib.addSource(
    Deno.readTextFileSync(
      new URL("openEHR-EHR-INSTRUCTION.request.v1.0.0.adls", dir),
    ),
  );
  lib.addSource(
    Deno.readTextFileSync(
      new URL(
        "openEHR-EHR-INSTRUCTION.request-pathology_test.v1.0.0.adls",
        dir,
      ),
    ),
  );
  const child = lib.resolve(
    "openEHR-EHR-INSTRUCTION.request-pathology_test.v1.0.0",
  )!;
  const flat = lib.flatten(child);
  assertEquals(
    lib.warnings.filter((w) => w.includes("not found in parent")),
    [],
    lib.warnings.join("\n"),
  );
  const requested = findNode(flat.def, "id122.1");
  const narrative = findNode(flat.def, "id136.1");
  assert(requested, "specialised service-requested node");
  assert(narrative, "specialised description-of-test node");
  assert(
    requested!.attrs?.find((a) => a.name === "name")?.children.some((c) =>
      c.nodeId === "id0.146"
    ),
    "name constraint on the specialised node is kept",
  );
});

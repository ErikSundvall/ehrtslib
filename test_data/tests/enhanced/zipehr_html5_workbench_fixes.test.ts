/**
 * ZipEHR html5 fixes ported from penpad-clinergy-workbench (#322).
 * @see penpad-clinergy-workbench docs/zipehr-roundtrip-gaps.md
 */
import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  serializeCanonicalToHtml5,
  serializeToHtml5Variant,
  zipehrHtml5ToCanonical,
} from "../../../serialization/zipehr/mod.ts";
import { shouldEmitPropertyAttribute } from "../../../serialization/zipehr/shared.ts";

const WORKBENCH_HTML5_OPTS = {
  layout: "linesaving" as const,
  propertyMode: "comment" as const,
};

Deno.test("html5 comment mode still emits p attribute (XML parser drops comments)", async () => {
  assertEquals(shouldEmitPropertyAttribute("comment", false), true);
  const cluster: Record<string, unknown> = {
    _type: "CLUSTER",
    name: { _type: "DV_TEXT", value: "Blood pressure" },
    archetype_node_id: "at0003",
    items: [
      {
        _type: "ELEMENT",
        name: { _type: "DV_TEXT", value: "Systolic" },
        archetype_node_id: "at0004",
        value: {
          _type: "DV_QUANTITY",
          magnitude: 120,
          units: "mm[Hg]",
        },
      },
    ],
  };
  const html = await serializeCanonicalToHtml5(cluster, {
    dialect: "short",
    ...WORKBENCH_HTML5_OPTS,
  });
  assert(html.includes("<!--items-->") || html.includes("p=\"items\""));
  assert(html.includes("p=\"items\""), html);
  const stripped = html.replace(/<!--[^>]*-->/g, "");
  const back = zipehrHtml5ToCanonical(stripped) as Record<string, unknown>;
  const items = back.items as unknown[];
  assertEquals(items?.length, 1);
  assertEquals((items[0] as { value?: { magnitude?: number } }).value?.magnitude, 120);
});

Deno.test("html5 deserialize: #text before child elements (leading LOCATABLE name)", () => {
  const html =
    `<o-e fmt="s1" n="at0001">Name<o-q p="value" fmt="s1"><mag fmt="s1">5</mag><unit fmt="s1">kg</unit></o-q></o-e>`;
  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals((back.name as { value?: string })?.value, "Name");
  assertEquals((back.value as { magnitude?: number }).magnitude, 5);
});

Deno.test("html5: COMPOSITION.composer.name stays openEHR String", async () => {
  const canonical = JSON.parse(
    await Deno.readTextFile(
      new URL("../../fixtures/workbench-ferro/03-bilateral-pain.json", import.meta.url),
    ),
  ) as Record<string, unknown>;
  assertEquals(typeof (canonical.composer as { name?: unknown })?.name, "string");
  const html = await serializeToHtml5Variant(
    canonical,
    "zipehr.html5.short",
    WORKBENCH_HTML5_OPTS,
  );
  const round = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  const composer = round.composer as Record<string, unknown>;
  assertEquals(typeof composer.name, "string");
  assertEquals(composer.name, (canonical.composer as { name: string }).name);
});

Deno.test("html5: CLUSTER.items sibling order preserved on round-trip", async () => {
  const canonical = JSON.parse(
    await Deno.readTextFile(
      new URL("../../fixtures/workbench-ferro/01-demo-1998.json", import.meta.url),
    ),
  ) as Record<string, unknown>;
  const findCluster = (o: unknown): Record<string, unknown> | undefined => {
    if (!o || typeof o !== "object") return undefined;
    if (Array.isArray(o)) {
      for (const item of o) {
        const hit = findCluster(item);
        if (hit) return hit;
      }
      return undefined;
    }
    const rec = o as Record<string, unknown>;
    if (
      rec._type === "CLUSTER" &&
      rec.archetype_node_id === "openEHR-EHR-CLUSTER.symptom_sign.v2"
    ) {
      return rec;
    }
    for (const v of Object.values(rec)) {
      const hit = findCluster(v);
      if (hit) return hit;
    }
    return undefined;
  };
  const cluster = findCluster(canonical);
  assert(cluster);
  const orderBefore = (cluster.items as Record<string, unknown>[]).map((i) =>
    String(i.archetype_node_id)
  );
  assert(orderBefore.length >= 2);
  const round = zipehrHtml5ToCanonical(
    await serializeToHtml5Variant(canonical, "zipehr.html5.short", WORKBENCH_HTML5_OPTS),
  ) as Record<string, unknown>;
  const clusterAfter = findCluster(round);
  assert(clusterAfter);
  const orderAfter = (clusterAfter.items as Record<string, unknown>[]).map((i) =>
    String(i.archetype_node_id)
  );
  assertEquals(orderAfter, orderBefore);
});

Deno.test("html5 serialize: quiet-structure marks at0002 POINT_EVENT", async () => {
  const event: Record<string, unknown> = {
    _type: "POINT_EVENT",
    name: { _type: "DV_TEXT", value: "Any event" },
    archetype_node_id: "at0002",
    time: { _type: "DV_DATE_TIME", value: "2021-01-01T12:00:00Z" },
    data: {
      _type: "ITEM_TREE",
      name: { _type: "DV_TEXT", value: "Tree" },
      archetype_node_id: "at0003",
      items: [],
    },
  };
  const html = await serializeCanonicalToHtml5(event, {
    dialect: "short",
    layout: "linesaving",
    propertyMode: "comment",
  });
  assert(html.includes('data-zs-quiet-heading'));
  assert(html.includes('title="Any event"'));
  assert(html.includes('title="Tree"'));
});

Deno.test("html5 deserialize: child does not inherit parent p attribute", () => {
  const html = `<o-ob fmt="s1" p="data"><o-hi fmt="s1" n="at0001"><o-pe fmt="s1" n="at0002"><o-d fmt="s1" p="time">2020-01-01</o-d></o-pe></o-hi></o-ob>`;
  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals(back._type, "OBSERVATION");
  const data = back.data as Record<string, unknown>;
  assertEquals(data?._type, "HISTORY");
  const events = data?.events as unknown[];
  assertEquals(events?.length, 1);
});

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

Deno.test("zipehr.html5.short workbench fixtures: strict canonical round-trip", async () => {
  const dir = new URL("../../fixtures/workbench-ferro/", import.meta.url);
  for (let i = 1; i <= 7; i++) {
    const id = String(i).padStart(2, "0");
    const files = [...Deno.readDirSync(dir)].map((e) => e.name).filter((n) =>
      n.startsWith(`${id}-`)
    );
    assert(files.length === 1, `expected one fixture for ${id}, got ${files}`);
    const canonical = JSON.parse(
      await Deno.readTextFile(new URL(files[0], dir)),
    ) as Record<string, unknown>;
    const html = await serializeToHtml5Variant(
      canonical,
      "zipehr.html5.short",
      WORKBENCH_HTML5_OPTS,
    );
    const round = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
    assert(
      deepEqual(round, canonical),
      `${files[0]}: round-trip differs from canonical`,
    );
  }
});
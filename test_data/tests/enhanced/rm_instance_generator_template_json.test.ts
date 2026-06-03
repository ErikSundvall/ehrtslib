import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.220.0/path/mod.ts";
import { ArchetypeRepository } from "../../enhanced/parser/legacy/archetype_repository.ts";
import { RMInstanceGenerator } from "../../enhanced/generation/mod.ts";

const CARE_UNIT_JSON = fromFileUrl(
  new URL("../../tjson/Care unit v2.t.json", import.meta.url),
);

Deno.test("RMInstanceGenerator example mode fills Better .t.json cluster items", async () => {
  const text = await Deno.readTextFile(CARE_UNIT_JSON);
  const repo = ArchetypeRepository.fromEntries([
    { path: "Care unit v2.t.json", content: text },
  ]);
  const template = repo.getTemplate(repo.listTemplateIds()[0])!;
  const opt = repo.flattenTemplate(template);

  const minimal = new RMInstanceGenerator({ mode: "minimal", resolver: repo })
    .generate(opt) as Record<string, unknown>;
  const example = new RMInstanceGenerator({ mode: "example", resolver: repo })
    .generate(opt) as Record<string, unknown>;
  const maximal = new RMInstanceGenerator({ mode: "maximal", resolver: repo })
    .generate(opt) as Record<string, unknown>;

  const minimalItems = minimal.items as unknown[] | undefined;
  const exampleItems = example.items as Array<Record<string, unknown>>;
  const maximalItems = maximal.items as unknown[];

  assert(!minimalItems?.length);
  assert(exampleItems.length >= 3);
  assert((maximalItems?.length ?? 0) > exampleItems.length);

  const coded = exampleItems.find((i) => i.archetype_node_id === "at0004.1");
  assert(coded?.value);
  assertEquals((coded!.value as Record<string, unknown>)._type, "DV_CODED_TEXT");
  assert(
    (coded!.value as Record<string, unknown>).value === "vårdenhet" ||
      (coded!.value as Record<string, unknown>).defining_code,
  );
});

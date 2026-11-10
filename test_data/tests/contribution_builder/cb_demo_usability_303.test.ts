import { assert, assertEquals } from "@std/assert";
import { Window } from "npm:happy-dom@21.0.4";
import {
  collectFieldProblems,
  fieldValidationViews,
  initialDemoShowsValidation,
  problemMatchesField,
} from "../../../examples/demo-app/src/cb-field-validation.ts";
import {
  ensureFieldValidationHosts,
  paintFieldValidation,
} from "../../../examples/demo-app/src/cb-field-validation-ui.ts";
import {
  createDemoSession,
  DEMO_FILLED_DIAGNOSIS_NAME,
  DEMO_INITIAL_EMPTY_MANDATORY_FIELD,
  readField,
  writeField,
} from "../../../examples/demo-app/src/contribution-demo.ts";

const assets = new URL(
  "../../../examples/demo-app/public/contribution-builder/",
  import.meta.url,
);

async function started() {
  return await createDemoSession(
    await Deno.readTextFile(new URL("simple-diagnose-and-vitals.opt", assets)),
    await Deno.readTextFile(
      new URL("simple-diagnose-and-vitals.wt.json", assets),
    ),
  );
}

Deno.test("cb demo #303: session starts with empty mandatory diagnosis name", async () => {
  const session = await started();
  assertEquals(DEMO_INITIAL_EMPTY_MANDATORY_FIELD, "diagnosisName");
  assertEquals(readField(session, session.clones[0], "diagnosisName"), "");
  assert(initialDemoShowsValidation(session, session.clones[0].caller.build));
});

Deno.test("cb demo #303: validator problems map to diagnosisName binding", async () => {
  const session = await started();
  const build = session.clones[0].caller.build;
  const validation = session.validator.validate(
    build,
    session.draftId,
    session.template,
  );
  const binding = session.fields.diagnosisName;
  const mapped = collectFieldProblems(session, validation);
  assert(mapped.has("diagnosisName"));
  const views = fieldValidationViews(session, validation);
  assert(views.some((v) => v.field === "diagnosisName"));
  assert(views.every((v) => v.message.length > 0));
  for (const problem of validation.errors) {
    if (problem.node === binding.target) {
      assert(problemMatchesField(problem, binding));
    }
  }
});

Deno.test("cb demo #303: filling diagnosis clears field validation paint", async () => {
  const session = await started();
  writeField(
    session,
    session.clones[0],
    "diagnosisName",
    DEMO_FILLED_DIAGNOSIS_NAME,
  );
  const validation = session.validator.validate(
    session.clones[0].caller.build,
    session.draftId,
    session.template,
  );
  const views = fieldValidationViews(session, validation);
  assertEquals(views.some((v) => v.field === "diagnosisName"), false);
});

Deno.test("cb demo #303: validation UI shows mark for empty diagnosis", async () => {
  const w = new Window();
  (globalThis as unknown as { window: Window }).window = w;
  (globalThis as unknown as { document: Document }).document = w.document;
  (globalThis as unknown as { HTMLElement: typeof HTMLElement }).HTMLElement = w
    .HTMLElement as typeof HTMLElement;
  (globalThis as unknown as { HTMLInputElement: typeof HTMLInputElement })
    .HTMLInputElement = w.HTMLInputElement as typeof HTMLInputElement;
  w.document.body.innerHTML = `
    <article class="clone">
      <label class="field-shell">
        <span class="field-heading field-heading--diagnosisName">Name</span>
        <input data-field="diagnosisName" value="" />
      </label>
    </article>`;
  const css = await Deno.readTextFile(
    new URL(
      "../../../examples/demo-app/public/contribution-builder.css",
      import.meta.url,
    ),
  );
  const style = w.document.createElement("style");
  style.textContent = css;
  w.document.head.append(style);
  const panel = w.document.querySelector(".clone")! as HTMLElement;
  const hosts = ensureFieldValidationHosts(panel);
  const session = await started();
  const views = fieldValidationViews(
    session,
    session.validator.validate(
      session.clones[0].caller.build,
      session.draftId,
      session.template,
    ),
  );
  paintFieldValidation(hosts, views);
  const host = hosts.get("diagnosisName")!;
  assertEquals(host.mark.hidden, false);
  assert(host.mark.getAttribute("aria-label")!.length > 0);
  assert(host.input.classList.contains("field-input--invalid"));
  w.close();
});

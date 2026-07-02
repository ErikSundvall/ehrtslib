/**
 * Parse Web Template JSON into the internal {@link WebTemplate} model.
 *
 * Accepts the format produced by this library's {@link buildWebTemplate} as
 * well as EHRBase / Better dialects:
 * - optional top-level `webTemplate` wrapper (EHRBase REST responses),
 * - `templateId` / `template_id` spellings,
 * - `cardinalities`, `annotations`, `termBindings`, `dependsOn` pass-through,
 * - missing `min` / `max` defaulting to 0 / 1,
 * - root `aqlPath` of `""` or `"/"`.
 */

import type {
  WebTemplate,
  WebTemplateInput,
  WebTemplateNode,
} from "./types.ts";

type Json = Record<string, unknown>;

function isObject(v: unknown): v is Json {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function parseInput(raw: Json): WebTemplateInput {
  const input: WebTemplateInput = {
    type: asString(raw.type) ?? "TEXT",
  };
  const suffix = asString(raw.suffix);
  if (suffix) input.suffix = suffix;
  if (isObject(raw.validation)) input.validation = raw.validation;
  if (Array.isArray(raw.list)) {
    input.list = raw.list.filter(isObject).map((item) => ({
      ...item,
      value: String(item.value ?? ""),
    }));
  }
  if (typeof raw.listOpen === "boolean") input.listOpen = raw.listOpen;
  const terminology = asString(raw.terminology);
  if (terminology) input.terminology = terminology;
  if (raw.defaultValue !== undefined) input.defaultValue = raw.defaultValue;
  return input;
}

function parseNode(raw: Json): WebTemplateNode {
  const node: WebTemplateNode = {
    id: asString(raw.id) ?? "id",
    rmType: asString(raw.rmType) ?? asString(raw.rm_type) ?? "UNKNOWN",
    min: asNumber(raw.min, 0),
    max: asNumber(raw.max, 1),
    aqlPath: asString(raw.aqlPath) ?? asString(raw.aql_path) ?? "",
  };

  const name = asString(raw.name);
  if (name) node.name = name;
  const localizedName = asString(raw.localizedName);
  if (localizedName) node.localizedName = localizedName;
  const nodeId = asString(raw.nodeId) ?? asString(raw.node_id);
  if (nodeId) node.nodeId = nodeId;
  if (raw.inContext === true) node.inContext = true;
  if (Array.isArray(raw.dependsOn)) {
    node.dependsOn = raw.dependsOn.filter((d): d is string =>
      typeof d === "string"
    );
  }
  if (isObject(raw.localizedNames)) {
    node.localizedNames = raw.localizedNames as Record<string, string>;
  }
  if (isObject(raw.localizedDescriptions)) {
    node.localizedDescriptions = raw.localizedDescriptions as Record<
      string,
      string
    >;
  }
  if (isObject(raw.annotations)) node.annotations = raw.annotations;
  if (isObject(raw.termBindings)) {
    node.termBindings = raw.termBindings as WebTemplateNode["termBindings"];
  }
  if (Array.isArray(raw.inputs)) {
    node.inputs = raw.inputs.filter(isObject).map(parseInput);
  }
  if (Array.isArray(raw.children)) {
    node.children = raw.children.filter(isObject).map(parseNode);
  }
  return node;
}

/** True if the JSON value looks like a Web Template document. */
export function isWebTemplateJson(value: unknown): boolean {
  if (!isObject(value)) return false;
  const doc = isObject(value.webTemplate) ? value.webTemplate : value;
  return isObject(doc.tree) &&
    (typeof doc.templateId === "string" ||
      typeof doc.template_id === "string");
}

export function parseWebTemplate(source: string | unknown): WebTemplate {
  const parsed = typeof source === "string" ? JSON.parse(source) : source;
  if (!isObject(parsed)) {
    throw new Error("Web template must be a JSON object");
  }
  // EHRBase wraps the document in { webTemplate: ... }
  const doc = isObject(parsed.webTemplate) ? parsed.webTemplate : parsed;

  const templateId = asString(doc.templateId) ?? asString(doc.template_id);
  if (!templateId) throw new Error("Web template missing templateId");
  if (!isObject(doc.tree)) throw new Error("Web template missing tree");

  const webTemplate: WebTemplate = {
    templateId,
    defaultLanguage: asString(doc.defaultLanguage) ??
      asString(doc.default_language) ?? "en",
    tree: parseNode(doc.tree),
  };
  const semVer = asString(doc.semVer) ?? asString(doc.semver);
  if (semVer) webTemplate.semVer = semVer;
  const version = asString(doc.version);
  if (version) webTemplate.version = version;
  if (Array.isArray(doc.languages)) {
    webTemplate.languages = doc.languages.filter((l): l is string =>
      typeof l === "string"
    );
  }
  return webTemplate;
}

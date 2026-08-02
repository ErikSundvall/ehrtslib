/**
 * Normalise Archetype Designer / Better `.t.json` toward spec-oriented AOM JSON.
 * See: https://discourse.openehr.org/t/incompatibility-issues-when-using-archetype-designer-s-export-fileset-t-json-files/4389
 */

const PROPERTY_ALIASES: Record<string, string> = {
  rmTypeName: "rm_type_name",
  rmAttributeName: "rm_attribute_name",
  nodeId: "node_id",
  parentArchetypeId: "parent_archetype_id",
  archetypeRef: "archetype_ref",
  referenceType: "reference_type",
  adlVersion: "adl_version",
  templateId: "template_id",
  termDefinitions: "term_definitions",
  conceptCode: "concept_code",
  originalLanguage: "original_language",
  templateOverlays: "template_overlays",
  defaultValue: "default_value",
  buildUid: "build_uid",
  rmName: "rm_name",
  rmRelease: "rm_release",
  otherMetaData: "other_meta_data",
  attributeTuples: "attribute_tuples",
  codeString: "code_string",
  terminologyId: "terminology_id",
  lowerIncluded: "lower_included",
  upperIncluded: "upper_included",
  lowerUnbounded: "lower_unbounded",
  upperUnbounded: "upper_unbounded",
  trueValid: "true_valid",
  falseValid: "false_valid",
  isOrdered: "is_ordered",
  isUnique: "is_unique",
};

/** Deep-normalise Better export JSON before AOM parsing. */
export function normalizeBetterTemplateJson(root: unknown): unknown {
  return normalizeNode(root);
}

function normalizeNode(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(normalizeNode);
  if (typeof value !== "object") return value;

  const rec = value as Record<string, unknown>;
  const typeRaw = String(rec["@type"] ?? rec["@_type"] ?? rec._type ?? "");
  const type = typeRaw.replace(/^.*:/, "");

  if (type === "BINARY_OPERATOR") {
    return normalizeBinaryOperator(rec);
  }

  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(rec)) {
    let normKey = PROPERTY_ALIASES[key] ?? key;
    let normVal = normalizeNode(raw);

    if (key === "@type") {
      out["@type"] = raw;
      out["@_type"] = raw;
      continue;
    }
    if (key === "_type") {
      out["_type"] = raw;
      if (!out["@_type"]) out["@_type"] = raw;
      continue;
    }

    if (
      normKey === "lifecycle_state" && normVal && typeof normVal === "object"
    ) {
      const ls = normVal as Record<string, unknown>;
      normVal = ls.code_string ?? ls.codeString ?? ls.value ?? normVal;
    }

    if (
      normKey === "terminology_id" && normVal && typeof normVal === "object"
    ) {
      const tid = normVal as Record<string, unknown>;
      normVal = tid.value ?? tid;
    }

    if (normKey === "constraint" && Array.isArray(normVal)) {
      normVal = normalizeConstraintArray(normVal, type);
    }

    out[normKey] = normVal;
  }

  return out;
}

function normalizeConstraintArray(
  items: unknown[],
  parentType: string,
): unknown {
  if (parentType === "C_INTEGER" || parentType === "C_REAL") {
    const intervals = items.map((item) => {
      if (item && typeof item === "object") {
        const iv = item as Record<string, unknown>;
        if (
          String(iv["@type"] ?? iv["@_type"] ?? iv._type ?? "").includes(
            "Interval",
          )
        ) {
          return normalizeIntervalObject(iv);
        }
        return normalizeIntervalObject(iv);
      }
      return item;
    });
    return intervals.length === 1 ? intervals[0] : { interval: intervals[0] };
  }
  return items.map(normalizeNode);
}

function normalizeIntervalObject(
  iv: Record<string, unknown>,
): Record<string, unknown> {
  return {
    lower: iv.lower,
    upper: iv.upper,
    lower_included: iv.lower_included ?? iv.lowerIncluded,
    upper_included: iv.upper_included ?? iv.upperIncluded,
    lower_unbounded: iv.lower_unbounded ?? iv.lowerUnbounded,
    upper_unbounded: iv.upper_unbounded ?? iv.upperUnbounded,
  };
}

function normalizeBinaryOperator(
  rec: Record<string, unknown>,
): Record<string, unknown> {
  const out = {
    ...rec,
    "@type": "EXPR_BINARY_OPERATOR",
    "@_type": "EXPR_BINARY_OPERATOR",
  };
  const op = rec.operator ?? rec.operator_def;
  if (typeof op === "string") {
    out.operator_def = {
      "@type": "OPERATOR_DEF_BUILTIN",
      "@_type": "OPERATOR_DEF_BUILTIN",
      identifier: op,
    };
    delete out.operator;
  } else if (op && typeof op === "object") {
    out.operator_def = normalizeNode(op);
  }
  for (const [k, v] of Object.entries(rec)) {
    if (k === "operator" || k === "@type" || k === "@_type") continue;
    const nk = PROPERTY_ALIASES[k] ?? k;
    out[nk] = normalizeNode(v);
  }
  return out;
}

/** Post-parse lint: warn if camelCase AM fields survived normalisation. */
export function collectBetterJsonLintWarnings(
  raw: Record<string, unknown>,
): string[] {
  const warnings: string[] = [];
  walkLint(raw, "", warnings);
  return warnings;
}

function walkLint(node: unknown, path: string, warnings: string[]): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((c, i) => walkLint(c, `${path}[${i}]`, warnings));
    return;
  }
  const rec = node as Record<string, unknown>;
  for (const key of ["rmTypeName", "rmAttributeName", "nodeId"]) {
    if (key in rec) {
      warnings.push(`${path}: unmapped Better field "${key}" (normaliser gap)`);
    }
  }
  for (const [k, v] of Object.entries(rec)) {
    if (k === "@type" || k === "@_type") continue;
    walkLint(v, path ? `${path}.${k}` : k, warnings);
  }
}

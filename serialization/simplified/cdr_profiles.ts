/**
 * CDR-specific Web Template and FLAT conventions.
 *
 * Profiles bundle options that must stay aligned when posting to a given CDR.
 * Individual options on {@link WebTemplateBuilderOptions},
 * {@link FlatSerializerOptions}, and {@link FlatValidatorOptions} still
 * override the profile.
 */

import type { FlatSerializerOptions } from "./flat_serializer.ts";
import type { FlatValidatorOptions } from "./flat_validator.ts";
import type { WebTemplateBuilderOptions } from "./web_template_builder.ts";

/** Target CDR family for simplified-format conventions. */
export type CdrProfile = "ferroehr" | "ehrbase" | "better";

/** Default profile: EHRbase (library default FLAT flavour is `output`). */
export const DEFAULT_CDR_PROFILE: CdrProfile = "ehrbase";

export interface CdrProfileAwareOptions {
  cdrProfile?: CdrProfile;
}

export interface ResolvedCdrProfileOptions {
  profile: CdrProfile;
  webTemplate: WebTemplateBuilderOptions;
  flat: FlatSerializerOptions;
  flatValidator: FlatValidatorOptions;
}

type WebTemplateOpts = Omit<WebTemplateBuilderOptions, "cdrProfile">;
type FlatOpts = Omit<FlatSerializerOptions, "cdrProfile">;
type FlatValidatorOpts = Omit<FlatValidatorOptions, "cdrProfile">;

function profileWebTemplate(profile: CdrProfile): WebTemplateOpts {
  switch (profile) {
    case "ferroehr":
      // Evidence: penpad-clinergy-workbench tests/fixtures/ferro-flat/wt.json
      // and ferro-flat-0N.json (#316, #312).
      return {
        treeRootId: "archetype",
        omitSectionNameNode: true,
        renamedArchetypeRootId: "archetype",
        elementNameId: "name_constraint",
      };
    case "ehrbase":
      // Evidence: ehrbase/openEHR_SDK OPTParser.buildId(term) for node ids
      // (github.com/ehrbase/openEHR_SDK/.../OPTParser.java); openEHR ITS-REST
      // simplified formats examples key FLAT paths with the template id
      // (`conformance-ehrbase.de.v0` in docs/vendor/simplified_formats.md);
      // ehrtslib flat_flavours_239 EHRbase fixtures. The default profile keeps
      // that template-id root. `treeRootId: "archetype"` (Ferro's `encounter`
      // / `report`) moves keys such as `aql_example/measurements/...` and
      // breaks the name/value sibling SECTION round trip. SECTION dv_text
      // omission vs Ferro: unverified in SDK source.
      return {
        treeRootId: "template",
        omitSectionNameNode: true,
        renamedArchetypeRootId: "label",
        elementNameId: "term",
      };
    case "better":
      // Evidence: openEHR ITS simplified formats (Better origin); SIMPLIFIED_FORMATS.md
      // INPUT/OUTPUT flavours. Better-specific WT node-id rules beyond shared
      // buildId-style slugs: unverified without Better Web Template export here.
      return {
        treeRootId: "archetype",
        omitSectionNameNode: true,
        renamedArchetypeRootId: "label",
        elementNameId: "term",
      };
  }
}

function profileFlat(profile: CdrProfile): FlatOpts {
  switch (profile) {
    case "ferroehr":
      // Verified: ferro-flat-0N.json uses input-style ctx/ and encounter/ root;
      // locatableName omit — Ferro 5.5.0 rejects /_name (#312).
      // Unverified: which FLAT flavour FerroEHR accepts on live POST (input vs output).
      // Default flavour is `output` (spec lossless form); pass flavor: "input" to
      // match Ferro export shape when comparing fixtures.
      return { flavor: "output", locatableName: "omit" };
    case "ehrbase":
      // Evidence: ehrtslib docs/SIMPLIFIED_FORMATS.md § flavours; EHRbase SDK
      // conformance POST uses ctx/ (input), GET uses full paths (output).
      return { flavor: "output", locatableName: "path" };
    case "better":
      // Evidence: SIMPLIFIED_FORMATS.md — Better INPUT/OUTPUT map to input/output.
      return { flavor: "output", locatableName: "path" };
  }
}

function profileFlatValidator(_profile: CdrProfile): FlatValidatorOpts {
  return { strictUnknownKeys: true };
}

/** Merge profile defaults with explicit per-API options (explicit wins). */
export function resolveCdrProfile(options?: {
  cdrProfile?: CdrProfile;
  webTemplate?: WebTemplateBuilderOptions;
  flat?: FlatSerializerOptions;
  flatValidator?: FlatValidatorOptions;
}): ResolvedCdrProfileOptions {
  const profile = options?.cdrProfile ?? DEFAULT_CDR_PROFILE;
  const wtIn = stripCdrProfile(options?.webTemplate);
  const flatIn = stripCdrProfile(options?.flat);
  const valIn = stripCdrProfile(options?.flatValidator);
  return {
    profile,
    webTemplate: { ...profileWebTemplate(profile), ...wtIn, cdrProfile: profile },
    flat: { ...profileFlat(profile), ...flatIn },
    flatValidator: { ...profileFlatValidator(profile), ...valIn },
  };
}

export function mergeWebTemplateBuilderOptions(
  options?: WebTemplateBuilderOptions,
): WebTemplateBuilderOptions {
  const { webTemplate } = resolveCdrProfile({
    cdrProfile: options?.cdrProfile,
    webTemplate: options,
  });
  return webTemplate;
}

export function mergeFlatSerializerOptions(
  options?: FlatSerializerOptions,
): FlatSerializerOptions {
  const { flat } = resolveCdrProfile({
    cdrProfile: options?.cdrProfile,
    flat: options,
  });
  return flat;
}

export function mergeFlatValidatorOptions(
  options?: FlatValidatorOptions,
): FlatValidatorOptions {
  const { flatValidator } = resolveCdrProfile({
    cdrProfile: options?.cdrProfile,
    flatValidator: options,
  });
  return flatValidator;
}

function stripCdrProfile<T extends { cdrProfile?: CdrProfile } | undefined>(
  opts: T,
): Omit<NonNullable<T>, "cdrProfile"> | undefined {
  if (!opts) return undefined;
  const { cdrProfile: _p, ...rest } = opts;
  return rest as Omit<NonNullable<T>, "cdrProfile">;
}

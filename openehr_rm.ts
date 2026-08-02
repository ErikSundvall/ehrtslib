// Re-export wrapper for openehr_rm
//
// Stable public path: the implementation lives in ./rm/, split into one module
// per BMM package (see tasks/bmm_package_map.json).

export * from "./rm/mod.ts";

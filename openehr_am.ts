// Re-export wrapper for openehr_am
//
// Stable public path: the implementation lives in ./am/, split into one module
// per BMM package (see tasks/bmm_package_map.json).

export * from "./am/mod.ts";

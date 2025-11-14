// Re-export wrapper for openehr_rm
// 
// This file provides backward compatibility by re-exporting all symbols from the enhanced implementation.
// External code can continue to import from the root level without changes.
// 
// ✅ Backward Compatibility Layer
// This is a thin re-export wrapper that maintains API stability.
// The actual implementation is in ./enhanced/openehr_rm.ts
// 
// For internal development, prefer importing directly from ./enhanced/ to be explicit.
// 
// Note: In a future phase, this may be replaced with a more sophisticated /dist structure
// that provides multiple export formats (ESM, CommonJS, etc.) for different target environments.

export * from "./enhanced/openehr_rm.ts";

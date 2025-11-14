# Enhanced Implementation Directory

This directory contains **fully implemented** TypeScript classes with working behavior, extending the stubs generated from openEHR BMM specifications.

## Purpose

The enhanced files contain:
1. **Complete method implementations** (not just stubs)
2. **Additional helper methods** beyond the BMM specification
3. **LLM-assisted enhancements** and optimizations
4. **Behavioral logic** for all class methods
5. **Documentation improvements** and examples

## ✅ Safe to Edit

Files in this directory are:
- **Safe to edit manually** or with LLM assistance
- **NOT overwritten** by the generator
- **The source of truth** for the library's actual behavior
- **Version controlled** with your enhancements preserved

## Structure

This directory mirrors the structure of `/generated`:
- `openehr_base.ts` - Enhanced base types with full implementations
- `openehr_rm.ts` - Enhanced Reference Model with complete behavior
- `openehr_am.ts` - Enhanced Archetype Model with full functionality
- `openehr_term.ts` - Enhanced terminology service with working methods
- `openehr_lang.ts` - Enhanced language support with complete implementations

## Import Guidelines

When editing enhanced files:
- Import from other enhanced files using relative paths: `./openehr_base.ts`
- Do NOT import from root-level re-export wrappers
- Do NOT import from `/generated` (use enhanced versions)

Example:
```typescript
// ✅ Good
import * as openehr_base from "./openehr_base.ts";

// ❌ Bad - don't import from root
import * as openehr_base from "../openehr_base.ts";
```

## Updating to New BMM Versions

When a new BMM version is released:

1. Generate new stubs in `/generated`
2. Run comparison tool: `deno run --allow-read tasks/compare_bmm_versions.ts`
3. Review the changes report
4. Manually update files in this directory to incorporate:
   - New classes (copy stubs, then implement)
   - New methods (add to existing classes)
   - Changed signatures (update existing methods)
5. Run tests to verify everything still works

**Do not** simply copy from `/generated` to `/enhanced` - you'll lose all your enhancements!

## Version Tracking

Each file should have a header comment indicating:
- Last BMM version it was synced with
- Date of last update
- Any known differences from the BMM specification

Example:
```typescript
// Enhanced implementation based on BMM: base v1.3.0
// Last synced: 2025-11-14
// Custom additions: Helper methods for common operations
```

See the main [README.md](../README.md) for complete workflow documentation.

# Enhanced Implementation Directory

This directory contains TypeScript classes with enhanced implementations and
working behavior, extending the stubs generated from openEHR BMM
specifications. Classes here may be **fully implemented** or **partially
implemented** (especially after BMM updates when new features are being
integrated).

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

Additional service files not in `/generated`:

- `terminology_service.ts` - Terminology service that loads and queries openEHR terminology XML files
- `property_unit_service.ts` - Property and unit service for UCUM-based unit handling
- `ucum_service.ts` - UCUM (Unified Code for Units of Measure) validation and conversion service
- `temporal_polyfill.ts` - Temporal API polyfill for date/time operations

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

When a new BMM version is released, follow the detailed workflow in the main
[README.md](../README.md) under "Updating to a New BMM Version". The process
ensures your enhanced implementations are preserved while incorporating new BMM
changes.

**Do not** simply copy from `/generated` to `/enhanced` - you'll lose all your
enhancements!

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

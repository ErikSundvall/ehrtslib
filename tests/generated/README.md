# Tests for Generated Code

This directory contains tests for the **generated** code stubs in `/generated`.

## Purpose

These tests verify:

- ✅ Classes can be instantiated
- ✅ Properties exist with correct types
- ✅ Method signatures are correct
- ⚠️ Methods may throw "not yet implemented" errors (expected for stubs)

## Important

Tests in this directory should:

- **NOT** expect full behavioral correctness
- **Focus on** structural correctness (types, signatures)
- **Accept** that many methods are just stubs
- **Verify** that the BMM-to-TypeScript translation is accurate

## Running These Tests

```bash
deno test tests/generated/
```

## Comparison

Tests in `/tests/enhanced` expect full implementations and behavioral
correctness. Tests here only verify the structural aspects from BMM
specifications.

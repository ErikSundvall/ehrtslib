# Tests for Enhanced Implementations

This directory contains tests for the **enhanced** implementations in `/enhanced`.

## Purpose

These tests verify:
- ✅ Full behavioral correctness
- ✅ All methods work as specified
- ✅ Edge cases are handled properly
- ✅ Integration between classes works correctly

## Important

Tests in this directory should:
- **Expect full functionality** - no "not implemented" errors
- **Test behavior** not just structure
- **Cover edge cases** and error conditions
- **Validate** complex interactions between classes

## Running These Tests

```bash
deno test tests/enhanced/
```

## Comparison

Tests in `/tests/generated` only verify structural correctness.
Tests here verify full implementation correctness and behavior.

## Test Development Process

When adding new tests:
1. Start with structural tests in `/tests/generated`
2. Once implementation is complete, add behavioral tests here
3. Enhanced tests can import from `/tests/generated` if needed for fixtures

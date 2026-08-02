# Behavioural tests for the hand-written implementations

This directory holds behavioural tests for the hand-written model modules
(`base/`, `rm/`, `am/`, `lang/`, `term/`) and the serialization, terminology and
metadata layers built on them.

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

From the **repository root**:

```bash
deno test test_data/tests/enhanced/ --allow-read --no-check
```

## Comparison

Tests under `test_data/tests/generated/` only verify structural correctness. Tests here
verify full implementation correctness and behavior.

## Test Development Process

When adding new tests:

1. Start with structural tests in `test_data/tests/generated/`
2. Once implementation is complete, add behavioral tests here
3. Behavioural tests can import from generated fixtures if needed

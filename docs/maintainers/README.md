# Maintainer documentation

Material for people who change ehrtslib itself (codegen, BMM, agents, roadmap).
**Library users should start at [../README.md](../README.md)** instead.

## Hubs

| Topic | Location |
| ----- | -------- |
| BMM / stub / meta regeneration | [../../README-FOR-LIB-MAINTENANCE.md](../../README-FOR-LIB-MAINTENANCE.md) |
| What is safe to edit under `enhanced/` | [../../enhanced/README.md](../../enhanced/README.md) |
| Generated stubs (do not hand-edit) | [../../generated/README.md](../../generated/README.md) |
| Domain glossary (agents) | [../../CONTEXT.md](../../CONTEXT.md) |
| Roadmap | [../../ROADMAP.md](../../ROADMAP.md) · [finished](../../ROADMAP-FINISHED-TASKS.md) |
| Spec vs impl notes | [../../INCONSISTENCIES.md](../../INCONSISTENCIES.md) |
| Archie test-data attribution | [../../ARCHIE_ATTRIBUTION.md](../../ARCHIE_ATTRIBUTION.md) |
| Cursor Cloud / MCP | [../CURSOR_CLOUD_SETUP.md](../CURSOR_CLOUD_SETUP.md) |
| Agent runtime notes | [../../AGENTS.md](../../AGENTS.md) |
| RM meta regeneration detail | [rm-meta-generation.md](rm-meta-generation.md) |
| Test fixtures | [../../test_data/README.md](../../test_data/README.md) |
| PRDs / task lists | [../../tasks/](../../tasks/) |
| Historical merge notes | [../../archive/](../../archive/) |

## Target layout (ongoing)

Prefer gradually relocating the root maintainer files listed above into this
folder (with short stubs at old paths). User-facing docs stay under `docs/`
root or `docs/user/` and are linked only from [../README.md](../README.md) and
the repository [README.md](../../README.md).

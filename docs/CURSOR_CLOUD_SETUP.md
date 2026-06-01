# Cursor Cloud Agent setup (parity with local)

Cloud agents clone this repo but **do not** read `~/.cursor/mcp.json` or global skills on your machine. Use this checklist so cloud agents match your local Cursor setup.

## Already in the repo (no extra step)

| Item | Path |
|------|------|
| MCP definitions (reference + local IDE) | [`.cursor/mcp.json`](../.cursor/mcp.json) |
| Agent skills (openEHR, Context7, personal workflows) | [`.cursor/skills/`](../.cursor/skills/) |
| openEHR project rule | [`.cursor/rules/openehr-context.mdc`](../.cursor/rules/openehr-context.mdc) |
| Cloud VM install (Deno) | [`.cursor/environment.json`](../.cursor/environment.json) |
| Agent instructions | [`AGENTS.md`](../AGENTS.md) |

After changing skills locally, re-sync into the repo:

```powershell
# From repo root — refresh openEHR + Context7 plugin skills, then add any new ~/.agents/skills
.\scripts\sync-cursor-skills.ps1
```

## Required: enable MCP on Cloud Agents (dashboard)

Cloud agents **ignore** `.cursor/mcp.json`. Add the same HTTP servers at [cursor.com/agents](https://cursor.com/agents) (MCP section), using **literal URLs** (not `${env:…}`):

| Server | URL | Notes |
|--------|-----|--------|
| `deepwiki` | `https://mcp.deepwiki.com/mcp` | No API key |
| `openehr-assistant` | `https://openehr-assistant-mcp.apps.cadasto.com/` | Cadasto openEHR Assistant |
| `context7` | `https://mcp.context7.com/mcp` | Optional header `CONTEXT7_API_KEY` in dashboard Secrets for higher limits |

Optional (only if you use them locally):

| Server | URL |
|--------|-----|
| Atlassian | `https://mcp.atlassian.com/v1/mcp` (OAuth via dashboard) |
| Hugging Face | `https://huggingface.co/mcp?login` (OAuth via dashboard) |

## Optional: Cursor plugins on your account

Locally you may also use **marketplace plugins** (openEHR Assistant, Context7, Atlassian, Hugging Face). Skills from those plugins are **vendored** under `.cursor/skills/` for cloud. You do not need the plugin installed on cloud if the repo skills + dashboard MCP are configured.

To keep plugin-only updates in sync, run `scripts/sync-cursor-skills.ps1` after upgrading plugins.

## Secrets

Put API keys in **Cursor → Cloud Agents → Secrets**, not in committed files:

- `CONTEXT7_API_KEY` — if Context7 rate limits apply

## Verify parity

1. Start a cloud agent on `main` with MCP toggles above enabled.
2. Ask it to run `guide_search` (openehr-assistant) or `read_wiki_structure` (deepwiki).
3. Ask it to follow the `archetype-authoring` skill for a trivial ADL review.

If MCP tools are missing, the dashboard MCP list is incomplete—not the repo.

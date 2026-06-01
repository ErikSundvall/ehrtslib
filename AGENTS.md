# Instructions for AI programming agents

## Cursor Cloud agents

Cloud agents use **this repo**, not your machine's `~/.cursor/` folder.

- **Skills**: Loaded from `.cursor/skills/` (openEHR, Context7, and synced personal workflows).
- **Rules**: `.cursor/rules/` (e.g. `openehr-context.mdc` for `*.adl` / `*.oet` / `*.opt`).
- **MCP**: Repo [`.cursor/mcp.json`](.cursor/mcp.json) documents servers for the local IDE; **cloud agents need the same servers enabled at [cursor.com/agents](https://cursor.com/agents)** (see [docs/CURSOR_CLOUD_SETUP.md](docs/CURSOR_CLOUD_SETUP.md)).
- **Deno**: Cloud VM runs `.cursor/environment.json` install on first use.

Before openEHR modeling tasks, use openehr-assistant MCP (`guide_search`, CKM, terminology) and skills under `.cursor/skills/`.

## Documentation guidance

- Always prefer reading and analyzing original documentation of latest version
  of libraries and projects rather than random search hits that may be of lower
  quality or based on outdated versions.
- It is good to offload some tasks to external MCP (Model Context Protocol)
  - If you are a local agent you already have a built in way
    to access MCP servers, but you may need to ask user to add certain MCP
    servers to you configuration (please do ask and feel free to recommend new MCPs).
- Deepwiki.com is a great source for outsourcing analysis of any project on
  github. If possible, delegate your questions about the library to the Deepwiki
  MCP server. The DeepWiki MCP server offers three main tools:
  1. read_wiki_structure - list documentation topics for a GitHub
     repository
  2. read_wiki_contents - View documentation
  3. ask_question - Get an AI-powered, context-grounded response
- Context7 with its MCP is another great source for querying documentation
- If working with openEHR, then check that the openehr-assistant MCP from Cadasto 
  is installed and use those skills, agents etc. 

## Development process guidance

- If asked to make a `PRD` (Product Requirements Document) based on a prompt,
  then follow the instructions in
  https://raw.githubusercontent.com/snarktank/ai-dev-tasks/refs/heads/main/create-prd.md
- If asked to create a `task list` then look in the /tasks subdirectory for a
  PRD file to base it on. If there are several PRD files that don't already have
  associated task lists, then ask user for disambiguation. Then follow
  instructions in
  https://raw.githubusercontent.com/snarktank/ai-dev-tasks/refs/heads/main/generate-tasks.md
  using the PRD file as input. Refer to PRD in task list document.
- Put PRDs and task lists in a /tasks subdirectory

## Development tooling guidance

- When working with Javascript or Typescript based projects prefer using Deno
  for management over using Node.js and NPM. Deno is installed in the local
  environment, but remote agents (like Jules) might need to install Deno in 
  its VM before using it.
- The local environment is a Windows machine without admin privileges,
  Powershell and CMD are available. It uses [Scoop](https://scoop.sh/)
  for package installation, so base any advice on that.

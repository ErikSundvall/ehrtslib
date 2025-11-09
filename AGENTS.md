# Instructions for AI programming agents

## Documentation guidance

* Always prefer reading and analyzing original documentation of latest version of libraries and projects rather than random search hits that may be of lower quality or based on outdated versions.
* Deepwiki.com is a great source for outsourcing analysis of any project on github. If possible, delegate your questions about the library to the Deepwiki MCP, see below:
  * If you are a local agent (e.g. Gemini CLI), you have direct access to the Deepwiki MCP tools.
  * If you are Jules or any other AI that does not have direct Deepwiki MCP tool access, you must use HTTP calls to interact with the Deepwiki MCP server. Refer to https://docs.devin.ai/work-with-devin/deepwiki-mcp for details. Note that you may need to store a session ID from the Deepwiki server for subsequent calls.
  * The DeepWiki MCP server, offers three main tools:
    1. read_wiki_structure - Get a list of documentation topics for a GitHub repository
    2. read_wiki_contents - View documentation about a GitHub repository
    3. ask_question - Ask any question about a GitHub repository and get an AI-powered, context-grounded response

## Development process guidance

* If asked to make a `PRD` (Product Requirements Document) based on a prompt, then follow the instructions in https://raw.githubusercontent.com/snarktank/ai-dev-tasks/refs/heads/main/create-prd.md
* If asked to create a `task list` then look in the /tasks subdirectory for a PRD file to base it on. If there are several PRD files that don't already have associated task lists, then ask user for disambiguation. Then follow instructions in https://raw.githubusercontent.com/snarktank/ai-dev-tasks/refs/heads/main/generate-tasks.md using the PRD file as input.

## Development tooling guidance

* When working with Javascript or Typescript based projects prefer using Deno for management over using Node.js and NPM. Deno is installed in the local environment, but Jules might need to install Deno in its VM before using it.
* The local environment is a Windows machine without admin privileges, Powershell is available. It uses [Scoop](https://scoop.sh/) for package installation, so base any advice on that


 
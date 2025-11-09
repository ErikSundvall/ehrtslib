# Instructions for AI programming agents

## Documentation guidance

* Always prefer reading and analyzing original documentation of latest version of libraries and projects rather than random search hits that may be of lower quality or based on outdated versions.
* Deepwiki.com is a great source for outsourcing analysis of any project on github. If possible, delegate your questions about the library to the Deepwiki MCP, see below:
  * If you are a local agent (e.g. Gemini CLI), you have direct access to the Deepwiki MCP tools.
  * If you are Jules or any other AI that does not have direct Deepwiki MCP tool access, you must use one of the following official MCP clients:
    * **TypeScript:** Use the `@modelcontextprotocol/sdk` package. See the [TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#writing-mcp-clients) for usage details. A successful connection to the Deepwiki server has been established using this client.
    * **Python:** Use the `fastmcp` library. See the [FastMCP client documentation](https://gofastmcp.com/clients/client) for usage details. A successful connection to the Deepwiki server has been established using this client.
  * The DeepWiki MCP server offers three main tools:
    1. read_wiki_structure - Get a list of documentation topics for a GitHub repository
    2. read_wiki_contents - View documentation about a GitHub repository
    3. ask_question - Ask any question about a GitHub repository and get an AI-powered, context-grounded response

## Development process guidance

* If asked to make a `PRD` (Product Requirements Document) based on a prompt, then follow the instructions in https://raw.githubusercontent.com/snarktank/ai-dev-tasks/refs/heads/main/create-prd.md
* If asked to create a `task list` then look in the /tasks subdirectory for a PRD file to base it on. If there are several PRD files that don't already have associated task lists, then ask user for disambiguation. Then follow instructions in https://raw.githubusercontent.com/snarktank/ai-dev-tasks/refs/heads/main/generate-tasks.md using the PRD file as input.

## Development tooling guidance

* When working with Javascript or Typescript based projects prefer using Deno for management over using Node.js and NPM. Deno is installed in the local environment, but Jules might need to install Deno in its VM before using it.
* The local environment is a Windows machine without admin privileges, Powershell is available. It uses [Scoop](https://scoop.sh/) for package installation, so base any advice on that

## Interacting with MCP Servers

When you need to interact with an MCP server like Deepwiki, do not use `curl`. Instead, use one of the following client libraries:

### TypeScript/JavaScript Client

You can use the `mcp-client` library via `npx`.

**Example:**
```bash
npx mcp-client --server-url <server_url> --tool-name <tool_name> --tool-params '{"repoName": "<owner>/<repo>"}'
```

For more details, refer to the [TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#writing-mcp-clients).

### Python Client

You can use the `fastmcp` library.

**Installation:**
```bash
pip install fastmcp
```

**Example:**
```python
import asyncio
from fastmcp import Client

async def call_mcp_server(server_url, tool_name, params):
    client = Client(server_url)
    async with client:
        response = await client.call_tool(tool_name, params)
        return response

# Example usage:
# server_url = "https://mcp.deepwiki.com/mcp"
# tool_name = "ask_question"
# params = {"repoName": "owner/repo", "question": "What is the main purpose?"}
# asyncio.run(call_mcp_server(server_url, tool_name, params))
```

For more details, refer to the [fastmcp documentation](https://gofastmcp.com/clients/client).

### Fallback Approach

If neither of the above clients work, you can try the approach described in this [Hugging Face blog post](https://huggingface.co/blog/tiny-agents).
# Interacting with MCP Servers

This is additional info for The Jules AI agent, adding to the basic instructions found in AGENTS.md (Gemini CLI should NOT use this aproach, but rather ask user to configure its built in MCP client.)

When you need to interact with an MCP server like Deepwiki, do _not_ use `curl`. Instead, use one of the following client libraries:

## TypeScript/JavaScript Client

You can use the `mcp-client` library via `npx`.

**Example:**
```bash
npx mcp-client --server-url <server_url> --tool-name <tool_name> --tool-params '{"repoName": "<owner>/<repo>"}'
```

For more details, refer to the [TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#writing-mcp-clients).

## Python Client

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
If neither of the above clients work, and user does not respond to your warnings in a timely manner, then you can go on and try the approach described in this [Hugging Face blog post](https://huggingface.co/blog/tiny-agents).
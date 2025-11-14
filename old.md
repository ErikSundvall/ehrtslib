Old instructions that we used to modify the AGENTS.md file

Jules can't (yet) run MCP (Model Context Protocol) clients by itself to connect
to external MCP servers like Deepwiki MCP. So, first test locally if the
_client_ part of one of the following MCP SDKs/libraries can be used from Jules'
VM to call Deepwiki MCP and other MCP servers. Then if successful, update
AGENTS.md with instructions to Jules, that it should to try calling the Deepwiki
and other MCPs that way (instead of trying to invent stuff with calls via Curl
that it has failed several times already).

- a client accesible via npx/npm:
  https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#writing-mcp-clients
- a client accesible via Python https://gofastmcp.com/clients/client
- If non of the above work, try approach at
  https://huggingface.co/blog/tiny-agents

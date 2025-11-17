import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function main() {
  const transport = new StreamableHTTPClientTransport(
    new URL("https://mcp.deepwiki.com/mcp"),
  );

  const client = new Client({
    name: "ehrtslib-client",
    version: "1.0.0",
  });

  try {
    await client.connect(transport);
    console.log("Connected to Deepwiki MCP server.");

    const tools = await client.listTools();
    console.log("Available tools:", tools);
  } catch (error) {
    console.error("Failed to connect to Deepwiki MCP server:", error);
  } finally {
    await client.close();
  }
}

main();

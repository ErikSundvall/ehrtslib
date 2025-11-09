import asyncio
from fastmcp import Client

async def main():
    client = Client("https://mcp.deepwiki.com/mcp")

    async with client:
        try:
            await client.ping()
            print("Connected to Deepwiki MCP server.")

            tools = await client.list_tools()
            print("Available tools:", tools)
        except Exception as e:
            print(f"Failed to connect to Deepwiki MCP server: {e}")

if __name__ == "__main__":
    asyncio.run(main())

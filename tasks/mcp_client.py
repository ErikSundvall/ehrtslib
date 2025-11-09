import argparse
import json
import urllib.request
import urllib.parse

BASE_URL = "https://mcp.deepwiki.com/sse"

def call_mcp(tool_name, repo_name, question=None):
    """
    Calls the Deepwiki MCP server with the specified tool and parameters.
    """
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    payload = {
        "tool": tool_name,
        "repoName": repo_name
    }

    if tool_name == "ask_question":
        if not question:
            raise ValueError("Question is required for 'ask_question' tool.")
        payload["question"] = question
    elif tool_name in ["read_wiki_structure", "read_wiki_contents"]:
        pass # No additional parameters for these tools beyond repoName
    else:
        raise ValueError(f"Unknown tool: {tool_name}")

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(BASE_URL, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req) as response:
            response_data = response.read().decode("utf-8")
            print(response_data)
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        print(e.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

def main():
    parser = argparse.ArgumentParser(description="Deepwiki MCP Client for Jules.")
    parser.add_argument("tool_name", type=str,
                        choices=["read_wiki_structure", "read_wiki_contents", "ask_question"],
                        help="Name of the MCP tool to call.")
    parser.add_argument("repo_name", type=str, help="GitHub repository in owner/repo format.")
    parser.add_argument("--question", type=str, help="Question for the 'ask_question' tool.")

    args = parser.parse_args()

    call_mcp(args.tool_name, args.repo_name, args.question)

if __name__ == "__main__":
    main()

# Agent Instructions for MCP Connector Simulation

When asked to look up information about a software library, repository, or technology using the "MCP Connector," follow this standardized procedure. This ensures a consistent and efficient information retrieval process.

## Procedure

1.  **Initial Search:**
    *   Use the `google_search` tool to find the official source of information.
    *   Construct a specific query to avoid ambiguity. Good patterns include:
        *   `"{topic} javascript library"`
        *   `"{topic} official documentation"`
        *   `"{repository-owner}/{repository-name} github"`
    *   **Example:** To look up the `d3` library, a search for `"d3"` is too generic. A better query is `"d3 javascript library"`. For a specific repository like `d3/d3`, use `"d3/d3 github"`.

2.  **Information Extraction:**
    *   From the search results, identify the most authoritative URL. This is typically the official documentation, the project's homepage, or the GitHub repository.
    *   Use the `view_text_website` tool to read the content of this URL.

3.  **Summarization and Reporting:**
    *   Analyze the text content to identify the following key pieces of information:
        *   The primary purpose of the library/technology.
        *   Its main features or capabilities.
        *   Common use cases.
    *   Synthesize this information into a concise summary.
    *   Report this summary to the user using the `message_user` tool.

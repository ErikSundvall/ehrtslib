# ehrtslib
TypeScript library for (to begin with) openEHR

TODO:
# Phase 1
Use deepwiki MCP connection for info about openEHR's BMM files. Following the dependency graph of openEHR packages/libraries (starting with BASE package and its dependencies and then move upwards), build typescript libraries for all of openEHR (RM first, then TERM and AM). Keep classes of the same package in same typescript file (ine fil per package). Keep the exact snake_case class and method names and capitalization as in the BMM specification.  Start jules on this task in this github repository (ehrtslib). Take your time Jules and do a thorough job, no hurry i will turn off my computer and check in tomorrow. 

# Phase 2
* Previous phase was a good experient based on a not so information rich BMM variant. Keep it in a subdirectory for comparison and add a readme in that directory explaining how it was generated.
* The latest versions of openEHR BMM are in JSON format and contain updated (and more) information about each class and can be found in https://github.com/sebastian-iancu/code-generator/tree/master/code/BMM-JSON (raw files are of course in https://raw.githubusercontent.com/sebastian-iancu/code-generator/refs/heads/master/code/BMM-JSON/ ). That repository is also available in Deepwiki. 
* Make a brand new set of TS libraries from these. Use JsDoc to include all extra documentation for the classes etc found in the BMMs. There are many version of BMMS in the sebastian-iancu/code-generator only use the latest Semver version of each library, example, only use openehr_base_1.3.0.bmm.json among these:
```
openehr_base_1.0.4.bmm.json
openehr_base_1.1.0.bmm.json
openehr_base_1.2.0.bmm.json
openehr_base_1.3.0.bmm.json
```

Jules can't (yet) run MCP (Model Context Protocol) clients by itself to connect to external MCP servers like Deepwiki MCP. So, first test locally if the _client_ part of one of the following MCP SDKs/libraries can be used from Jules' VM to call Deepwiki MCP and other MCP servers. Then if successful, update AGENTS.md with instructions to Jules, that it should to try calling the Deepwiki and other MCPs that way (instead of trying to invent stuff with calls via Curl that it has failed several times already). 
* a client accesible via npx/npm: https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#writing-mcp-clients
* a client accesible via Python https://gofastmcp.com/clients/client
* If non of the above work, try approach at https://huggingface.co/blog/tiny-agents
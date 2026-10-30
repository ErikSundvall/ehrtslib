"""Summarise better_probe_output.json: stored DV_CODED_TEXT value and code at the test leaf."""
import json
import xml.etree.ElementTree as ET
from pathlib import Path

NS = "{http://schemas.openehr.org/v1}"
HERE = Path(__file__).parent
for r in json.loads((HERE / "better_probe_output.json").read_text(encoding="utf-8")):
    if "error" in r:
        print(r["id"], "error:", r["error"][:120])
        continue
    for item in ET.fromstring(r["canonical_xml"]).iter(NS + "items"):
        if item.get("archetype_node_id") == "at0005":
            value = item.find(NS + "value")
            print(r["id"], value.findtext(NS + "value"), value.findtext(NS + "defining_code/" + NS + "code_string"))

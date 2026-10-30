"""POST each FLAT variant from flat_inputs.json to an openEHR REST server and
print the stored DV_CODED_TEXT (value, code) or the error.

Usage: python3 cdr_language_test.py BASE_URL [--auth user:pass] [--ehrbase-format-param]
  BASE_URL e.g. http://localhost:8080/ehrbase/rest/openehr/v1
  The template must already be uploaded. --ehrbase-format-param posts with
  ?format=FLAT&templateId=... (EHRbase); otherwise the Simplified Formats media
  type and the openehr-template-id header are used (FerroEHR).
Writes results JSON to stdout.
"""
import argparse, base64, json, sys, urllib.parse, urllib.request
from pathlib import Path

HERE = Path(__file__).parent
INPUTS = json.loads((HERE / "flat_inputs.json").read_text(encoding="utf-8"))
LEAF_NODE_ID = "at0005"

def request(base, auth, method, path, body=None, headers=None):
    h = dict(headers or {})
    if auth:
        h["Authorization"] = "Basic " + base64.b64encode(auth.encode()).decode()
    data = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
    if data:
        h.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(base + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read().decode(), {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(), {}

def find_leaf_values(node, found):
    if isinstance(node, dict):
        if node.get("_type") == "ELEMENT" and node.get("archetype_node_id") == LEAF_NODE_ID:
            found.append(node.get("value"))
        for v in node.values():
            find_leaf_values(v, found)
    elif isinstance(node, list):
        for v in node:
            find_leaf_values(v, found)
    return found

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("base_url")
    ap.add_argument("--auth")
    ap.add_argument("--ehrbase-format-param", action="store_true")
    a = ap.parse_args()
    template_id = INPUTS["template_id"]
    status, body, _ = request(a.base_url, a.auth, "POST", "/ehr", None,
                           {"Prefer": "return=representation", "Accept": "application/json"})
    ehr_id = json.loads(body)["ehr_id"]["value"]
    results = []
    for v in INPUTS["variants"]:
        flat = dict(INPUTS["base"], **{"ctx/language": v["ctx/language"]}, **v["leaf_input"])
        if a.ehrbase_format_param:
            path = f"/ehr/{ehr_id}/composition?templateId={urllib.parse.quote(template_id)}&format=FLAT"
            headers = {"Prefer": "return=representation", "Accept": "application/json"}
        else:
            path = f"/ehr/{ehr_id}/composition"
            headers = {"Content-Type": "application/openehr.wt.flat+json", "openehr-template-id": template_id,
                       "Prefer": "return=representation", "Accept": "application/json"}
        status, body, resp_headers = request(a.base_url, a.auth, "POST", path, flat, headers)
        r = {"id": v["id"], "ctx/language": v["ctx/language"], "description": v["description"], "status": status}
        if status in (200, 201):
            # Read the stored composition back in canonical JSON.
            uid = resp_headers.get("etag", "").removeprefix("W/").strip('"')
            _, body, _ = request(a.base_url, a.auth, "GET", f"/ehr/{ehr_id}/composition/{uid}", None,
                                 {"Accept": "application/json"})
            stored = find_leaf_values(json.loads(body), [])
            r["stored"] = [{"value": s.get("value"), "code": (s.get("defining_code") or {}).get("code_string")} for s in stored]
        else:
            r["error"] = body[:500]
        results.append(r)
    json.dump(results, sys.stdout, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()

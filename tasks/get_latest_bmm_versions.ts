// Discover official openEHR BMM JSON schemas and write tasks/bmm_versions.json.
//
// Catalog: openEHR/specifications-ITS-BMM (published JSON under components/*/json/).
// Working copies: openEHR/specifications-<COMPONENT>/computable/BMM/ — preferred
// when the same filename exists there, because ITS-BMM import can lag (see
// specifications-ITS-BMM AGENTS.md).
//
// The LANG 1.1.0-bmm3 file shares schema id `openehr_lang_1.1.0` with the
// classic LANG schema; it is recorded separately as `openehr_lang_bmm3`.

const ITS_BMM_TREE =
  "https://api.github.com/repos/openEHR/specifications-ITS-BMM/git/trees/master?recursive=1";
const ITS_BMM_RAW =
  "https://raw.githubusercontent.com/openEHR/specifications-ITS-BMM/master";

/** Packages ehrtslib generates stubs for and implements by hand. */
const EHRTSLIB_PACKAGE_KEYS = new Set([
  "openehr_am",
  "openehr_base",
  "openehr_lang",
  "openehr_lang_bmm3",
  "openehr_rm",
  "openehr_term",
]);

interface TreeEntry {
  path?: string;
  type?: string;
}

interface PackageCandidate {
  packageKey: string;
  component: string;
  filename: string;
  version: string;
}

function parseSemver(v: string): [number, number, number] {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new Error(`Invalid semver: ${v}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function cmpSemver(a: string, b: string): number {
  const av = parseSemver(a);
  const bv = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (av[i] !== bv[i]) return av[i] - bv[i];
  }
  return 0;
}

function itsBmmUrl(component: string, filename: string): string {
  return `${ITS_BMM_RAW}/components/${component}/json/${filename}`;
}

function workingCopyUrl(component: string, filename: string): string {
  return `https://raw.githubusercontent.com/openEHR/specifications-${component}/master/computable/BMM/${filename}`;
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET" });
    if (res.body) {
      await res.body.cancel();
    }
    return res.ok;
  } catch {
    return false;
  }
}

async function resolveUrl(component: string, filename: string): Promise<string> {
  const working = workingCopyUrl(component, filename);
  if (await urlExists(working)) return working;
  return itsBmmUrl(component, filename);
}

function parseJsonPath(path: string): PackageCandidate | undefined {
  const m = /^components\/([A-Z0-9]+)\/json\/(openehr_[a-z]+)_(\d+\.\d+\.\d+)(-bmm3)?\.bmm\.json$/
    .exec(path);
  if (!m) return undefined;
  const component = m[1];
  const packageName = m[2];
  const version = m[3];
  const bmm3 = m[4] === "-bmm3";
  const filename = path.slice(path.lastIndexOf("/") + 1);
  return {
    packageKey: bmm3 ? `${packageName}_bmm3` : packageName,
    component,
    filename,
    version,
  };
}

const treeRes = await fetch(ITS_BMM_TREE, {
  headers: {
    Accept: "application/vnd.github+json",
    "User-Agent": "ehrtslib-bmm-discovery",
  },
});
if (!treeRes.ok) {
  throw new Error(
    `Failed to list specifications-ITS-BMM tree: HTTP ${treeRes.status}`,
  );
}
const tree = await treeRes.json() as { tree?: TreeEntry[] };
const candidates: PackageCandidate[] = [];
for (const entry of tree.tree ?? []) {
  if (entry.type !== "blob" || !entry.path) continue;
  const parsed = parseJsonPath(entry.path);
  if (parsed) candidates.push(parsed);
}

if (candidates.length === 0) {
  throw new Error("No BMM JSON files found under specifications-ITS-BMM");
}

const latest = new Map<string, PackageCandidate>();
for (const cand of candidates) {
  const prev = latest.get(cand.packageKey);
  if (!prev || cmpSemver(cand.version, prev.version) > 0) {
    latest.set(cand.packageKey, cand);
  }
}

const bmmVersions: Record<string, string> = {};
const keys = [...latest.keys()].sort();
for (const key of keys) {
  const cand = latest.get(key)!;
  if (!EHRTSLIB_PACKAGE_KEYS.has(key)) {
    console.log(
      `skip ${key} ${cand.version} (ITS-BMM has it; ehrtslib does not import this component)`,
    );
    continue;
  }
  const url = await resolveUrl(cand.component, cand.filename);
  bmmVersions[key] = url;
  console.log(`${key} ${cand.version} -> ${url}`);
}

const missing = [...EHRTSLIB_PACKAGE_KEYS].filter((k) => !(k in bmmVersions));
if (missing.length > 0) {
  throw new Error(
    `ITS-BMM catalog is missing expected package(s): ${missing.join(", ")}`,
  );
}

await Deno.writeTextFile(
  "./tasks/bmm_versions.json",
  JSON.stringify(bmmVersions, null, 2) + "\n",
);

console.log("bmm_versions.json created successfully.");

# Cutting ehrtslib releases

ehrtslib has **three independent version numbers**:

| Package               | Stored in                                                            | Git tag           | GitHub Pages                                      |
| --------------------- | -------------------------------------------------------------------- | ----------------- | ------------------------------------------------- |
| Library               | [`deno.json`](../../deno.json) `"version"`                           | `v0.1` / `v0.1.1` | GitHub Release; `versions.json` `library.current` |
| Format converter demo | [`examples/demo-app/deno.json`](../../examples/demo-app/deno.json)   | `demo-v0.2`       | `/demo/` bleeding edge; frozen `/demo-v0.2/`      |
| TAAAT                 | [`examples/taaat-app/deno.json`](../../examples/taaat-app/deno.json) | `taaat-v0.1`      | `/taaat/` bleeding edge; frozen `/taaat-v0.1/`    |

Patch `0` is omitted from the tag, same as
[intEHRgrator](https://github.com/regionstockholm/intehrgrator): `0.2.0` →
`demo-v0.2`, `0.2.1` → `demo-v0.2.1`.

## Cut a release

Working tree must be clean. `gh` must be authenticated (the script only pushes a
tag; Actions publishes).

```bash
# Library (TypeScript package)
deno task release -- --package library --version 0.1.0

# Format converter demo
deno task release -- --package demo --version 0.2.0

# TAAAT
deno task release -- --package taaat --version 0.1.0

# Re-tag whatever is already in that package's deno.json
deno task release -- --package demo --current

# Validate + build only
deno task release -- --package taaat --version 0.1.0 --dry-run
```

The script bumps the matching `deno.json`, builds the webapp when needed, packs
the library when that is the package being released, commits `chore: release …`,
tags, and pushes.
[`.github/workflows/release.yml`](../../.github/workflows/release.yml) then:

1. Builds that webapp (demo / TAAAT).
2. Assembles a Pages tree: wget-mirrors the live site, **adds** `/<tag>/` as an
   immutable copy, writes
   [`versions.json`](https://eriksundvall.github.io/ehrtslib/versions.json).
3. Deploys Pages and creates a GitHub Release. A library release attaches three
   sets (see below) and publishes runtime bundles at `/lib/<tag>/`.

Frozen directories are never overwritten. Releasing `demo-v0.2` while
`/demo-v0.1/` already exists leaves `demo-v0.1` untouched.

## Bleeding edge vs frozen

Every push to `main` (except `chore: release` commits, which the release
workflow already deploys) rebuilds `/demo/` and `/taaat/` and **wget-mirrors**
every tag listed in live `versions.json` back into the new artifact. That is the
same pattern intEHRgrator uses so old subdirectory URLs keep serving the bits
they shipped with.

| URL                                                 | Meaning                 |
| --------------------------------------------------- | ----------------------- |
| https://eriksundvall.github.io/ehrtslib/demo/       | Latest `main` demo      |
| https://eriksundvall.github.io/ehrtslib/demo-v0.2/  | Immutable demo `0.2.0`  |
| https://eriksundvall.github.io/ehrtslib/taaat/      | Latest `main` TAAAT     |
| https://eriksundvall.github.io/ehrtslib/taaat-v0.1/ | Immutable TAAAT `0.1.0` |

The format converter and TAAAT read this manifest when they are opened on GitHub
Pages. If the page is not that app’s `recommended` tag, a dialog links to the
frozen release, the bleeding-edge `/demo/` or `/taaat/` build, the tutorial, and
the README. The lower-left footer always shows the package version and build id,
and keeps a switch link after the dialog is dismissed.

Pin a recommended webapp tag (while a newer one is still shaking out) by
committing `RECOMMENDED_VERSIONS.json` at the repo root:

```json
{ "demo": "demo-v0.2", "taaat": "taaat-v0.1" }
```

Or set `RECOMMENDED_VERSION_DEMO` / `RECOMMENDED_VERSION_TAAAT` in the Actions
environment.

## Local Pages assembly

```bash
deno task build:demo
deno task build:taaat
PAGES_SITE_URL=https://eriksundvall.github.io/ehrtslib \
  deno run -A scripts/assemble-pages.ts main docs /tmp/ehrtslib-pages
```

Assembly tests: `deno test -A --no-check scripts/`.

A library release still refreshes `versions.json` on Pages but **does not** fall
back to `docs/` if the live site cannot be mirrored, so `/demo/` and `/taaat/`
cannot be wiped by a library-only tag. Later main-branch deploys wget
`/lib/<tag>/` back into the Pages tree the same way they keep frozen demo and
TAAAT directories.

## Library release sets

`deno task pack:library` builds the same directory CI uploads
(`dist/library-release/`). Consumer instructions:
[`docs/library-package.md`](../library-package.md).

| Set         | GitHub Release asset                                                               | Contents                                                                   |
| ----------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Source      | `ehrtslib-<version>-source.zip`                                                    | TypeScript library, `deno.json` import map, `terminology_data/`, `LICENSE` |
| Development | `ehrtslib-<version>-dev.zip`                                                       | Source plus `docs/`, `README.md`, `CONTRIBUTING.md`                        |
| Runtime     | `ehrtslib-<version>.min.js` and the `-rm`, `-parser`, and `-serialization` bundles | Single-file ESM, minified for transfer size                                |

Import URLs:

| Use                                                         | URL                                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Full barrel via jsDelivr                                    | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/mod.ts`                         |
| Reference Model via jsDelivr                                | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/openehr_rm.ts`                  |
| Archetype Model via jsDelivr                                | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/openehr_am.ts`                  |
| Parser via jsDelivr                                         | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/parser/mod.ts`                  |
| Serializers via jsDelivr                                    | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/serialization/mod.ts`           |
| RM attribute lookup via jsDelivr (`meta`)                   | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/meta/mod.ts`                    |
| Class specification lookup via jsDelivr (`spec`)            | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/spec/mod.ts`                    |
| Source module via GitHub raw                                | `https://raw.githubusercontent.com/ErikSundvall/ehrtslib/v0.3.1/mod.ts`                   |
| Runtime bundle on GitHub Pages                              | `https://eriksundvall.github.io/ehrtslib/lib/v0.3.1/`                                     |
| Release download (redirects to GitHub's release-asset host) | `https://github.com/ErikSundvall/ehrtslib/releases/download/v0.3.1/ehrtslib-0.3.1.min.js` |

Applications that bundle their own code should use the source zip and
tree-shake. The runtime bundles are the prebuilt files for a page or a one-URL
import. A checkout of the tag stays the developer tree.

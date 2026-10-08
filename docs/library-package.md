# Using a published ehrtslib library release

Each library tag publishes three sets on the
[GitHub Release](https://github.com/ErikSundvall/ehrtslib/releases). Patch `0`
is omitted from the tag (`0.3.0` is `v0.3`, `0.3.1` is `v0.3.1`):

| Set             | Archive or files                | What it is                                                 |
| --------------- | ------------------------------- | ---------------------------------------------------------- |
| **Source**      | `ehrtslib-<version>-source.zip` | TypeScript library a program imports                       |
| **Development** | `ehrtslib-<version>-dev.zip`    | Source plus `docs/`, `README.md`, and `CONTRIBUTING.md`    |
| **Runtime**     | `ehrtslib-<version>*.min.js`    | Single-file ESM bundles for a web page or a one-URL import |

A git checkout of the tag is the developer tree: library, demo, TAAAT, tests,
and maintainer scripts. Importing the library uses the source zip or the tag
URLs below.

Applications that ship a bundle should take the **source** package and
tree-shake it in their own bundler, so the client only includes the modules that
application calls. The runtime bundles are the small prebuilt alternative when
there is no application bundler.

## Source package

The zip contains:

- entries: `mod.ts`, `openehr_rm.ts`, `openehr_am.ts`, `openehr_base.ts`,
  `openehr_lang.ts`, `openehr_term.ts`
- packages: `am/`, `base/`, `rm/`, `lang/`, `meta/`, `parser/`, `generation/`,
  `serialization/`, `spec/`, `term/`, `validation/`, `terminology_data/`
- `deno.json` (name, version, `exports`, import map) and `LICENSE`
- `import-map.json` and this guide as `LIBRARY_PACKAGE.md`

Unpack it and map a prefix at the folder:

```json
{
  "imports": {
    "ehrtslib/": "./vendor/ehrtslib/"
  }
}
```

```ts
import {
  generation,
  meta,
  parser,
  rm,
  serialization,
  validation,
} from "ehrtslib/mod.ts";
import * as spec from "ehrtslib/spec/mod.ts";
```

`deno.json` inside the archive already maps `yaml` and `fast-xml-parser` (and
the other pins from the repository). From that directory, `deno run` and
`deno check` resolve those specifiers.

Terminology XML is loaded from the process working directory:

- `terminology_data/openehr_terminology_en.xml` (also `es` and `pt`)
- `terminology_data/openehr_external_terminologies.xml`
- `terminology_data/PropertyUnitData.xml`

## Import the git tag

The tag contains the same library files at the repository root, so a consumer
can import them without unpacking the zip.
[jsDelivr](https://www.jsdelivr.com/github) is a CDN in front of GitHub:

```ts
import { rm } from "https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/mod.ts";
import * as am from "https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/openehr_am.ts";
import { attributesFor } from "https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/meta/mod.ts";
import { classSpec } from "https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/spec/mod.ts";
```

Replace `v0.3.1` with the tag. GitHub's own raw host, without that CDN, is:

```text
https://raw.githubusercontent.com/ErikSundvall/ehrtslib/v0.3.1/mod.ts
```

The release asset `ehrtslib-<version>.import-map.json` maps `ehrtslib/` to the
jsDelivr prefix and pins `yaml` and `fast-xml-parser`:

```bash
deno run --import-map=ehrtslib-0.3.1.import-map.json app.ts
```

Relative imports inside the library (`./rm/mod.ts` and the rest) resolve against
the tag URL. Bare specifiers `yaml` and `fast-xml-parser` resolve through that
import map, or through the `deno.json` next to a local unpack.

## Development package

`ehrtslib-<version>-dev.zip` is the source package plus the documentation tree,
`README.md`, and `CONTRIBUTING.md`. Built copies of the demo and TAAAT apps are
left out; those have their own `demo-v*` and `taaat-v*` releases.

## Runtime bundles

These ESM files are minified for transfer size (whitespace and syntax).
Identifiers stay readable. Each file is one entry. The jsDelivr column is the
TypeScript module on the git tag (Deno). jsDelivr does not host the `.min.js`
attachments; those are on GitHub Pages and the Release download.

| File                                      | Entry                  | jsDelivr (git tag)                                                              |
| ----------------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| `ehrtslib-<version>.min.js`               | `mod.ts`               | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/mod.ts`               |
| `ehrtslib-<version>-rm.min.js`            | `openehr_rm.ts`        | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/openehr_rm.ts`        |
| `ehrtslib-<version>-parser.min.js`        | `parser/mod.ts`        | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/parser/mod.ts`        |
| `ehrtslib-<version>-serialization.min.js` | `serialization/mod.ts` | `https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/serialization/mod.ts` |

The full barrel also exports `am`, `base`, `lang`, `term`, `generation`, `meta`,
and `validation`. Those namespaces do not have their own `.min.js` files. `spec`
(`classSpec`, `attributeSpec`) is omitted from `mod.ts` and from every minified
file; import `spec/mod.ts` from the source package or from jsDelivr.
`serialization/xml/mod.ts` and `serialization/typescript/mod.ts` are the same:
they are in the source package and on jsDelivr, and they are not exports of the
serialization bundle.

GitHub Pages serves them with a JavaScript content type:

```text
https://eriksundvall.github.io/ehrtslib/lib/v0.3.1/
```

```html
<script type="module">
import { rm } from "https://eriksundvall.github.io/ehrtslib/lib/v0.3.1/ehrtslib-0.3.1.min.js";
</script>
```

```ts
import { parseAdl } from "https://eriksundvall.github.io/ehrtslib/lib/v0.3.1/ehrtslib-0.3.1-parser.min.js";
import { parseAdl as parseAdlFromCdn } from "https://cdn.jsdelivr.net/gh/ErikSundvall/ehrtslib@v0.3.1/parser/mod.ts";
```

The same filenames are attached to the GitHub Release. Those download URLs
redirect to GitHub's release-asset host:

```text
https://github.com/ErikSundvall/ehrtslib/releases/download/v0.3.1/ehrtslib-0.3.1.min.js
```

Pages is the URL to use from a web page. The release download is the attachment
to keep next to the zips.

`OpenEHRTerminologyService` reads `terminology_data/*.xml` with
`Deno.readTextFile` when `initialize()` runs. A page that only constructs RM
objects and serializes JSON can use the RM or serialization bundle without that
call.

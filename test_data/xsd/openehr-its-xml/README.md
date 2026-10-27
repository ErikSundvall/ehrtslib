# openEHR ITS XML schemas (test fixtures)

Vendored **unmodified** XSD files from the [openEHR specifications-ITS-XML](https://github.com/openEHR/specifications-ITS-XML) repository. Used only at **build/test time** (OPT 1.4 `Template.xsd` validation in `test_data/tests/parser/`). They are **not** part of the published library, runtime bundles, or jsDelivr entry points (`test_data/` is excluded from `deno task pack:library`).

| Path | Upstream source |
|------|-----------------|
| `components/AM/Release-1.4/` | `components/AM/Release-1.4/` |
| `components/RM/Release-1.1.0/` | `components/RM/Release-1.1.0/` (included by AM `Resource.xsd`) |
| `components/BASE/latest/` | `components/BASE/latest/` (included by RM `DataTypes.xsd`) |

- **Pinned commit:** `265752ffb01db88a8ced56b7b371ba0ed9aa531c` ( `master` at time of import )
- **License:** see [`UPSTREAM-LICENSE`](UPSTREAM-LICENSE) (Apache 2.0)

## Refresh from upstream

```bash
deno task refresh:openehr-its-xml
```

Or manually:

```bash
git clone --depth 1 https://github.com/openEHR/specifications-ITS-XML.git /tmp/openehr-its-xml
COMMIT=$(git -C /tmp/openehr-its-xml rev-parse HEAD)
DEST=test_data/xsd/openehr-its-xml
rm -rf "$DEST/components"
mkdir -p "$DEST/components/AM" "$DEST/components/RM" "$DEST/components/BASE"
cp -r /tmp/openehr-its-xml/components/AM/Release-1.4 "$DEST/components/AM/"
cp -r /tmp/openehr-its-xml/components/RM/Release-1.1.0 "$DEST/components/RM/"
cp -r /tmp/openehr-its-xml/components/BASE/latest "$DEST/components/BASE/"
cp /tmp/openehr-its-xml/LICENSE "$DEST/UPSTREAM-LICENSE"
echo "Update README pinned commit to $COMMIT"
```

After refresh, update the pinned commit line in this README and run the OPT XSD tests.

**Note:** `docs/vendor/v1-xsd/` may still hold documentation mirrors; tests use **this** tree only.

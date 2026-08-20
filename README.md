# ehrtslib (Electronic Health Record TypeScript Library)

[Experimental website](https://eriksundvall.github.io/ehrtslib) · [Live demo](https://eriksundvall.github.io/ehrtslib/demo)

TypeScript library for (to begin with) openEHR — usable in browsers and on Deno/Node. Import only what you need; rely on tree-shaking for client bundles.

## Documentation map

| Audience | Entry |
| -------- | ----- |
| **Library users** | [docs/README.md](docs/README.md) |
| **Maintainers / agents** | [docs/maintainers/README.md](docs/maintainers/README.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [AGENTS.md](AGENTS.md) |

## Quick start

```typescript
import { COMPOSITION } from "./openehr_rm.ts";
import { JsonConfigurableSerializer } from "./serialization/json/mod.ts";

const composition = new COMPOSITION({
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  name: "Blood Pressure Recording",
  language: "ISO_639-1::en",
  territory: "ISO_3166-1::GB",
  category: "openehr::433|event|",
  composer: { name: "Dr. Smith" },
});

const json = new JsonConfigurableSerializer({ prettyPrint: true })
  .serialize(composition);
```

| Topic | Doc |
| ----- | --- |
| Hello world, packages, limitations | [docs/getting-started.md](docs/getting-started.md) |
| Dual accessors (`name` vs `$name`) | [docs/user/dual-accessors.md](docs/user/dual-accessors.md) |
| Constructors + terse codes | [docs/user/brief-property-styles.md](docs/user/brief-property-styles.md) |
| Serialization formats | [serialization/README.md](serialization/README.md) |
| FLAT / STRUCTURED / Web Template | [docs/SIMPLIFIED_FORMATS.md](docs/SIMPLIFIED_FORMATS.md) |
| Clinical model file sets / GitHub load | [docs/CLINICAL_MODEL_FILESETS.md](docs/CLINICAL_MODEL_FILESETS.md) |
| ADL 1.4 / 2 + OPT/OET + validation | [docs/ADL_SUPPORT.md](docs/ADL_SUPPORT.md) |
| Terminology lookup (`at0001` is local) | [docs/ADL_SUPPORT.md](docs/ADL_SUPPORT.md#terminology-lookup-at0001-is-not-global) |
| Validation gaps | [docs/VALIDATION_LIMITATIONS.md](docs/VALIDATION_LIMITATIONS.md) |
| RM attribute introspection | [docs/RM_ATTRIBUTES.md](docs/RM_ATTRIBUTES.md) |

```typescript
import { parseAdl } from "./parser/mod.ts";
import { TemplateValidator } from "./validation/mod.ts";

const { archetype } = parseAdl(adlText);
const validator = new TemplateValidator({ validateUnits: true });
await validator.initialize();
const result = validator.validate(rmInstance, template);
```

## Examples and demo

- Deno scripts: [examples/README.md](examples/README.md)
- Browser converter: [examples/demo-app/README.md](examples/demo-app/README.md) — primary clinical models from [Ehrlibs/openEHR-model-examples](https://github.com/Ehrlibs/openEHR-model-examples)
- Roadmap: [docs/maintainers/roadmap.md](docs/maintainers/roadmap.md)


You can also visit [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/ErikSundvall/ehrtslib) to ask about how to use and understand Ehrtslib.
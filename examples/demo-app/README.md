# Ehrtslib Format Converter Demo

This directory contains the source code for the ehrtslib Format Converter demo application.

## Features

The demo application provides:

- **Format Conversion**: Convert between XML, JSON, and YAML formats
- **TypeScript Code Generation**: Generate TypeScript constructor code using the simplified object creation patterns
- **Configurable Options**: Fine-tune output for each format
- **Terse Format Support**: Compact notation for CODE_PHRASE and DV_CODED_TEXT
- **Hybrid YAML Style**: Intelligent inline/block formatting for optimal readability

### New in Phase 4g.6

- **TypeScript Constructor Serializer**: Professional serializer that generates code following the "Nested Object Initialization" pattern from SIMPLIFIED-CREATION-GUIDE.md
  - Supports terse format for CODE_PHRASE and DV_CODED_TEXT
  - Primitive value constructors for simple wrapper types
  - Configurable archetype_node_id location (beginning, after_name, end)
  - Optional comments and undefined attributes display

- **Fixed YAML Hybrid Style**: Now correctly produces inline flow formatting for simple objects
  - Example: `{value: Vital Signs}` instead of multi-line block format
  - Configurable `maxInlineProperties` threshold (default: 3)
  - Simple objects with ≤ maxInlineProperties and no nested objects use flow style

- **Initial Conversion on Load**: Demo now loads an example and runs conversion automatically on startup

## Directory Structure

- **`src/`**: Contains the TypeScript source code for the application logic.
  - `main.ts`: Entry point and UI event handlers
  - `converter.ts`: Format conversion logic using serializers (reduced from 610 to 305 lines!)
  - `examples.ts`: Example data for testing
- **`public/`**: Contains the static assets (HTML, CSS) that act as the template for the application.
- **`mockup/`**: Historical directory containing the initial static mockup and design documentation.
- **`scripts/`**: Build scripts to bundle the application and deploy it to the documentation output.
- **`public_legacy/`**: Older version of the public assets (kept for reference).

## Building the Demo

The build process compiles the TypeScript code into a single bundle and copies the static assets to the `docs/demo` directory.

To build the demo, run the following command from the project root:

```bash
deno task build:demo
```

This will:
1. Bundle `src/main.ts` into `docs/demo/bundle.js`
2. Copy `public/index.html` and `public/styles.css` to `docs/demo/`

The output can then be served statically from the `docs/demo` directory.

## Configuration Options

### TypeScript Options

- **Archetype ID Location**: Control where `archetype_node_id` appears in generated code (beginning, after_name, end)
- **Use Terse Format**: Enable compact notation for CODE_PHRASE and DV_CODED_TEXT
- **Use Primitive Value Constructors**: Simplify wrapper types (e.g., just `"text"` instead of `{value: "text"}`)
- **Include Comments**: Add helpful comments to generated code
- **Include Undefined Attributes**: Show all possible properties even if not set
- **Indent**: Configure indentation (spaces)

### YAML Options

- **Configuration Presets**: Default, Verbose, Hybrid, Flow Style, Custom
- **Archetype ID Location**: Control property ordering
- **Max Inline Properties**: Threshold for inline formatting in hybrid style (1-10, default: 3)
- **Block/Hybrid/Flow Style**: Choose formatting style
- **Terse Format**: Recommended for YAML
- **Type Inference**: Compact mode with fewer type annotations
- **Indent**: Configure indentation (spaces)

### JSON and XML Options

Standard configuration options available for JSON and XML serialization as well.

## Development

To work on the demo app:

1. Make changes to files in `src/` or `public/`
2. Run `deno task build:demo` to rebuild
3. Open `docs/demo/index.html` in a browser to test

## Links

- Live Demo: https://eriksundvall.github.io/ehrtslib/demo
- Main Documentation: https://github.com/ErikSundvall/ehrtslib
- TypeScript Serializer README: ../../enhanced/serialization/typescript/README.md
- YAML Serializer README: ../../enhanced/serialization/yaml/README.md


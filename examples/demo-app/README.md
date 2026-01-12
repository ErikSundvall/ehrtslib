# Ehrtslib Format Converter Demo

This directory contains the source code for the ehrtslib Format Converter demo application.

## Directory Structure

- **`src/`**: Contains the TypeScript source code for the application logic.
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

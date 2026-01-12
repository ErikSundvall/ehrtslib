import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const projectRoot = path.resolve(__dirname, '../../..');

// Plugin to replace Deno-specific imports with browser-compatible alternatives
const denoBrowserShim = {
  name: 'deno-browser-shim',
  setup(build) {
    // Intercept deno_dom imports and provide a browser-compatible alternative
    build.onResolve({ filter: /deno_dom/ }, args => {
      return { path: args.path, namespace: 'deno-dom-shim' };
    });
    
    build.onLoad({ filter: /.*/, namespace: 'deno-dom-shim' }, () => {
      return {
        contents: `
          // Browser shim for deno_dom
          export const DOMParser = window.DOMParser;
          export const Document = window.Document;
        `,
        loader: 'js'
      };
    });
  }
};

async function build() {
  console.log('🔨 Building ehrtslib demo app...');
  
  try {
    // Clean dist directory
    const distDir = path.join(rootDir, 'dist');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true });
    }
    fs.mkdirSync(distDir, { recursive: true });
    
    // Bundle TypeScript
    await esbuild.build({
      entryPoints: [path.join(rootDir, 'src/main.ts')],
      bundle: true,
      outfile: path.join(distDir, 'bundle.js'),
      format: 'iife',
      platform: 'browser',
      target: 'es2022',
      sourcemap: true,
      minify: process.env.NODE_ENV === 'production',
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
      },
      // Resolve node_modules from project root
      nodePaths: [
        path.join(projectRoot, 'node_modules'),
        path.join(rootDir, 'node_modules')
      ],
      // External packages that will be loaded from CDN or node_modules
      alias: {
        'npm:temporal-polyfill@0.2.5': 'temporal-polyfill'
      },
      plugins: [denoBrowserShim]
    });
    
    // Copy static assets from public/
    const publicDir = path.join(rootDir, 'public');
    const files = fs.readdirSync(publicDir);
    
    for (const file of files) {
      const srcPath = path.join(publicDir, file);
      const destPath = path.join(distDir, file);
      
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ Copied ${file}`);
      }
    }
    
    console.log('✅ Build completed successfully!');
    console.log(`📦 Output: ${distDir}`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

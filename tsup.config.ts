/** @format */

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["lib/**/*.{ts,tsx}"], // Match all TypeScript files in the lib directory
  format: ["cjs", "esm"], // Output CommonJS and ES module formats
  dts: true, // Generate TypeScript declaration files
  sourcemap: false, // Disable source maps
  external: ["express"], // Mark express as external
  target: "node16", // Target Node.js 16
  splitting: false, // Disable code splitting (helps with ESM issues sometimes)
  clean: true, // Clean the output directory before build
  esbuildOptions(options) {
    options.banner = {
      js: '"use strict";',
    };
  },
});

/** @format */

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["lib/**/*.{ts,tsx}"], // Match all TypeScript files in the lib directory
  format: ["cjs", "esm"], // Output formats
  dts: true, // Generate TypeScript declaration files
  sourcemap: false,
  // Additional options
});

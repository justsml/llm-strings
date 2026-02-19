import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/providers.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
});

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import convexPlugin from "@convex-dev/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', '.contentlayer/**', 'convex/_generated/**'],
  },
  ...compat.extends("next/core-web-vitals"),
  ...convexPlugin.configs.recommended,
];

export default eslintConfig;

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import convexPlugin from "@convex-dev/eslint-plugin";

export default tseslint.config(
  {
    ignores: [
      "_archive/**",
      "convex/_generated/**",
      "dist/**",
      "node_modules/**",
      "admin/vitest.config.ts",
      "vitest.config.ts"
    ]
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Disable type-aware linting to avoid memory issues
      // Type checking is handled by tsc
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Disable type-aware rules that require projectService
      // "@typescript-eslint/no-floating-promises": "warn",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    files: ["admin/**/*.{ts,tsx}"],
    languageOptions: {
      // Admin also doesn't need type-aware linting
      // Type checking is handled by tsc
    }
  },
  ...convexPlugin.configs.recommended
);

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import convexPlugin from "@convex-dev/eslint-plugin";

export default tseslint.config(
  {
    ignores: [
      "_archive/**",
      "admin-frontend/**",
      "convex/_generated/**",
      "dist/**",
      "node_modules/**"
    ]
  },
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: new URL('.', import.meta.url).pathname
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  ...convexPlugin.configs.recommended
);

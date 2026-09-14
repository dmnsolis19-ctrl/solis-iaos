import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "artifacts/**",
      "docs/baseline-v1.2/**",
      "packages/contracts/openapi/**",
      "packages/contracts/mqtt/**",
    ],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      globals: globals.node,
      sourceType: "module",
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: globals.node,
    },
  },
);

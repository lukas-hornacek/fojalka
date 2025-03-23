import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "@stylistic": stylistic,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@stylistic/semi": "error",
      "no-extra-parens": ["error", "all"],
      "quotes": [2, "double", { "avoidEscape": true }],
      "@stylistic/indent": ["error", 2],
      "@stylistic/space-before-blocks": ["error", "always"],
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/space-infix-ops": "error",
      "@stylistic/keyword-spacing": ["error", { before: true, after: true }],
      "@stylistic/comma-spacing": ["error", { before: false, after: true }],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/block-spacing": ["error", "always"],

      "@stylistic/no-multiple-empty-lines": ["error", { max: 1 }],
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/no-trailing-spaces": "error",

      "curly": ["error", "all"],
      "arrow-body-style": ["error", "as-needed"]
    },
  },
);

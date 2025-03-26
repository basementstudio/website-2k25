// eslint.config.js
const { defineConfig } = require("eslint/config")

const typescriptPlugin = require("@typescript-eslint/eslint-plugin")
const prettierPlugin = require("eslint-plugin-prettier")
const simpleImportSortPlugin = require("eslint-plugin-simple-import-sort")
const nextPlugin = require("@next/eslint-plugin-next")
const reactHooksPlugin = require("eslint-plugin-react-hooks")
const typescriptParser = require("@typescript-eslint/parser")

module.exports = defineConfig([
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      prettier: prettierPlugin,
      "simple-import-sort": simpleImportSortPlugin,
      "@next/next": nextPlugin,
      "react-hooks": reactHooksPlugin
    },
    languageOptions: {
      parser: typescriptParser
    },
    rules: {
      semi: "off",
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",

      "react-hooks/exhaustive-deps": "warn",

      "prettier/prettier": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error"
    }
  }
])

import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js"], 
    languageOptions: {
      sourceType: "commonjs"
    },
    plugins : ["jest-formatting"]
  },
  {languageOptions: { 
    globals: globals.browser 
  }},
  pluginJs.configs.recommended,
];
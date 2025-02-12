import globals from "globals";
import stylisticJs from '@stylistic/eslint-plugin-js'
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["statics/addons/*", "statics/lil-gui/*", "statics/ammo/*", 'statics/three/*'] // acts as global ignores, due to the absence of other properties
  },
  pluginJs.configs.recommended,
  {
    plugins: {
      '@stylistic/js': stylisticJs
    },
    rules: {
      '@stylistic/js/keyword-spacing': ['error', {"after": true, "before": true}]
    },
    languageOptions: { globals: {...globals.browser, "globals": true, "Ammo": true} },
  },
];
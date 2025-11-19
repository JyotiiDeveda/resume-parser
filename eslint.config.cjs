// eslint.config.cjs
const prettierPlugin = require("eslint-plugin-prettier");

module.exports = [
  {
    // files this config applies to
    files: ["**/*.js"],
    // ignore common generated folders (optional but useful)
    ignores: ["node_modules/**", "dist/**", "build/**"],
    languageOptions: {
      ecmaVersion: "latest",
      // CommonJS source type so `require`/`module.exports` are fine
      sourceType: "script",
      // declare Node globals as readonly so ESLint won't mark them undefined
      globals: {
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        console: "readonly",
      },
    },
    plugins: {
      // plugin must be required like this in flat config
      prettier: prettierPlugin,
    },
    rules: {
      // run Prettier as an ESLint rule and make formatting errors show up
      "prettier/prettier": "error",

      // your chosen ESLint rules
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];

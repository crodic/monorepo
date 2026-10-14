import globals from "globals";
import babelParser from "@babel/eslint-parser";
import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for NestJS.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nestJsConfig = [
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-typescript"],
          plugins: [
            ["@babel/plugin-proposal-decorators", { version: "legacy" }],
          ],
        },
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
];

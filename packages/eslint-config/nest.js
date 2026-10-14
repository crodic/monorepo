import { createRequire } from "node:module";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import { config as baseConfig } from "./base.js";

const require = createRequire(import.meta.url);

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
          presets: [require.resolve("@babel/preset-typescript")],
          plugins: [
            [
              require.resolve("@babel/plugin-proposal-decorators"),
              { version: "legacy" },
            ],
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
      "no-undef": "off",
    },
  },
];

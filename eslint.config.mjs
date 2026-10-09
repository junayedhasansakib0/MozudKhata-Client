import next from "eslint-config-next";
import prettier from "eslint-config-prettier";

// Next 16 ships a native ESLint flat config (array). Spread it directly.
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...next,
  prettier,
];

export default config;

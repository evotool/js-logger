const ecmascript = require('@evojs/eslint-plugin/configs/ecmascript').default;
const typescript = require('@evojs/eslint-plugin/configs/typescript').default;

// Конфигурация для JavaScript файлов
const javascriptConfig = {
  ...ecmascript,
  files: ['**/*.{js,mjs,cjs}'],
};

// Конфигурация для TypeScript файлов с кастомными правилами
const typescriptConfig = {
  ...ecmascript,
  ...typescript,
  files: ['**/*.ts'],
  plugins: {
    ...ecmascript.plugins,
    ...typescript.plugins,
  },
  languageOptions: {
    ...ecmascript.languageOptions,
    ...typescript.languageOptions,
    parserOptions: {
      ...ecmascript.languageOptions?.parserOptions,
      ...typescript.languageOptions?.parserOptions,
      project: 'tsconfig.json',
    },
  },
  settings: {
    ...ecmascript.settings,
    ...typescript.settings,
  },
  rules: {
    ...ecmascript.rules,
    ...typescript.rules,
  },
};

module.exports = [javascriptConfig, typescriptConfig];

// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // Falso positivo com axios.create (a API documentada do Axios)
      'import/no-named-as-default-member': 'off',
    },
  },
]);

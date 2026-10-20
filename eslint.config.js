const expoConfig = require('eslint-config-expo/flat')
const eslintConfigPrettier = require('eslint-config-prettier/flat')
const { defineConfig } = require('eslint/config')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  // Desactiva reglas de formato para que Prettier sea la única fuente de verdad.
  eslintConfigPrettier
])

require('dotenv').config({ path: '.env.test' })

module.exports = {
  preset: 'jest-expo',

  // No escanear node_modules ni los worktrees de agentes (.claude/worktrees),
  // que contienen copias del repo y duplican/inflan los tests.
  testPathIgnorePatterns: ['/node_modules/', '/.claude/'],

  moduleNameMapper: {
    '^~/(.*)\$': '<rootDir>/src/\$1',
    '^@/(.*)\$': '<rootDir>/\$1'
  }
}

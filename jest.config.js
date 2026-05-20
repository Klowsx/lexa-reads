require('dotenv').config({ path: '.env.test' });

module.exports = {
  preset: 'jest-expo',

  moduleNameMapper: {
    '^~/(.*)\$': '<rootDir>/src/\$1',
    '^@/(.*)\$': '<rootDir>/\$1',
  },
};

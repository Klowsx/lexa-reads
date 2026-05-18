require('dotenv').config({ path: '.env.test' });

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/react-native/extend-expect'],
  moduleNameMapper: {
    '^~/(.*)\$': '<rootDir>/src/\$1',
    '^@/(.*)\$': '<rootDir>/\$1',
  },
};

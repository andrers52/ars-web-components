/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.js'],
  moduleFileExtensions: ['js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 78,
      lines: 78,
      statements: 77
    }
  },
  collectCoverageFrom: [
    'components/**/*.js',
    'mixins/**/*.js',
    '!**/demo/**',
    '!**/*.css.js'
  ],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/test/setup.cjs'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleDirectories: ['node_modules', '.'],
  moduleNameMapper: {
    '^arslib$': '<rootDir>/test/__mocks__/arslib.js'
  },
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!(arslib)/)'
  ]
};

module.exports = config;
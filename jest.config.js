module.exports = {
  testEnvironment: 'node',
  verbose: false,
  testTimeout: 5000,
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
  detectOpenHandles: false,
  forceExit: false,
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js'],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 75,
      lines: 85,
      statements: 84
    }
  },
  testMatch: [
    '**/test/*.test.js'
  ],
  testPathIgnorePatterns: ['node_modules'],
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
  // Minimal configuration for stability
  maxWorkers: 1
};

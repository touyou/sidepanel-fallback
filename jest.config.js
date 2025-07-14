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
  testMatch: ['**/test/*.test.js'],
  testPathIgnorePatterns: ['node_modules'],
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
  // Enhanced Node.js compatibility for versions 18-22
  maxWorkers: 1,
  // Node 22 specific compatibility
  preset: undefined,
  // Node 22 experimental VM modules fix
  extensionsToTreatAsEsm: [],
  // Node 22 worker thread compatibility
  workerIdleMemoryLimit: '512MB'
};

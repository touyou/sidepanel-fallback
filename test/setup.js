/**
 * Jest setup for Node.js 20/22 compatibility
 * This file handles compatibility issues between Jest and newer Node.js versions
 */

// Fix for Node.js 20/22 global object handling
if (typeof global !== 'undefined' && !global.structuredClone) {
  global.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}

// Polyfill for performance.now() if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  };
}

// Enhanced error handling for async operations
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out specific Node.js 20/22 compatibility warnings that are safe to ignore
  const message = args[0]?.toString() || '';

  if (
    message.includes('_document') ||
    message.includes('impl') ||
    message.includes('soft deleted')
  ) {
    // Suppress Jest + Node.js 20/22 memory management warnings in test output
    return;
  }

  originalConsoleError.apply(console, args);
};

// Ensure proper cleanup for Node.js 20/22
afterEach(() => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

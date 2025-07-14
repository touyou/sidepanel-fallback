/**
 * Jest setup for Node.js 18-22 compatibility
 * This file handles compatibility issues between Jest and newer Node.js versions
 */

// Node version detection
const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);

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
    message.includes('soft deleted') ||
    // Node 22 specific warnings
    (nodeVersion >= 22 &&
      (message.includes('ExperimentalWarning') ||
        message.includes('--experimental-vm-modules') ||
        message.includes('punycode') ||
        message.includes('DEP0040')))
  ) {
    // Suppress Jest + Node.js 20/22 memory management warnings in test output
    return;
  }

  originalConsoleError.apply(console, args);
};

// Node 22 specific Jest compatibility fixes
if (nodeVersion >= 22) {
  // Handle Jest's process.exit behavior in Node 22
  const originalExit = process.exit;
  process.exit = code => {
    // Give time for async cleanup in Node 22
    setTimeout(() => originalExit(code), 50);
  };

  // Node 22 experimental VM module compatibility
  if (process.env.NODE_OPTIONS?.includes('--experimental-vm-modules')) {
    // Disable specific warnings that interfere with Jest in Node 22
    const originalEmitWarning = process.emitWarning;
    process.emitWarning = (warning, type, code) => {
      if (type === 'ExperimentalWarning' && (code === 'vm' || warning.includes('vm modules'))) {
        return;
      }
      return originalEmitWarning.call(process, warning, type, code);
    };
  }

  // Node 22 worker thread memory management
  if (global.gc) {
    // More aggressive garbage collection for Node 22
    const originalGc = global.gc;
    global.gc = () => {
      try {
        originalGc();
      } catch (_e) {
        // Ignore GC errors in Node 22
      }
    };
  }
}

// Ensure proper cleanup for Node.js 20/22
afterEach(() => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

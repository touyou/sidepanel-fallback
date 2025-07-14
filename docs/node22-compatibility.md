# Node.js 22 Compatibility Guide

This document outlines the Node.js 22 compatibility issues and solutions implemented in this project.

## Overview

Node.js 22 introduced several changes that affect Jest testing environments. This project includes comprehensive compatibility fixes to ensure tests run correctly across Node.js versions 18-22.

## Node.js 22 Specific Issues

### 1. Experimental VM Modules

**Issue**: Node.js 22 changed how experimental VM modules work with Jest.
**Solution**: Enhanced `NODE_OPTIONS` with memory management and improved warning suppression.

### 2. Process Exit Behavior

**Issue**: Jest's process exit handling changed in Node.js 22.
**Solution**: Implemented delayed exit handling to allow proper async cleanup.

### 3. Console and Warning Handling

**Issue**: Node.js 22 generates additional warnings that interfere with test output.
**Solution**: Enhanced console filtering to suppress Node.js 22 specific warnings.

### 4. Memory Management

**Issue**: Node.js 22 has stricter memory management that can cause test failures.
**Solution**: Added memory limits and enhanced garbage collection handling.

## Configuration Files

### jest.config.js
- Added `workerIdleMemoryLimit` for Node.js 22 worker thread compatibility
- Enhanced `extensionsToTreatAsEsm` configuration

### test/setup.js
- Node.js 22 specific process exit handling
- Enhanced warning suppression for experimental VM modules
- Improved garbage collection handling

### package.json
- Updated test scripts with `--max-old-space-size=4096` for better memory management
- Enhanced `NODE_OPTIONS` for Node.js 22 compatibility

## CI/CD Compatibility

The GitHub Actions workflow tests against:
- Node.js 18.x
- Node.js 20.x  
- Node.js 22.x

All compatibility fixes are backwards compatible with older Node.js versions.

## Troubleshooting

### Common Node.js 22 Issues

1. **Out of Memory Errors**
   - Solution: Increase `--max-old-space-size` in test scripts
   - Already implemented: `--max-old-space-size=4096`

2. **Experimental Warning Spam**
   - Solution: Enhanced warning suppression in test setup
   - Suppresses: `ExperimentalWarning`, `punycode`, `DEP0040`

3. **Jest Worker Failures**
   - Solution: Added `workerIdleMemoryLimit` and `maxWorkers: 1`
   - Forces single-threaded test execution for stability

4. **Process Exit Hangs**
   - Solution: Delayed process exit with cleanup timeout
   - Implemented: 50ms delay for proper async cleanup

## Testing Node.js 22 Locally

To test with Node.js 22 locally:

```bash
# Using nvm
nvm use 22
npm test

# Using volta
volta pin node@22
npm test
```

## Future Compatibility

This setup is designed to be forwards-compatible with future Node.js versions while maintaining backwards compatibility with Node.js 18+.
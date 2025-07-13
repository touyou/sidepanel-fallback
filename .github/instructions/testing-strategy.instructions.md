---
applyTo: 'test/**/*.js,jest.config.js,babel.config.js,.github/workflows/test.yml'
---

# Testing Strategy & Best Practices

## Jest Configuration & Node.js Compatibility

### Environment Setup

- **Jest 29.x** for Node.js 20 compatibility
- **Babel transformation** for ES6+ modules
- **Coverage thresholds**: 85% (realistic for OSS projects)
- **GitHub Actions** for CI/CD across Node.js 16, 18, 20

### Mock Strategies

#### DOM Mocking

```javascript
// Create comprehensive DOM mocks
const mockDocument = {
  createElement: jest.fn(() => ({
    classList: { add: jest.fn() },
    appendChild: jest.fn(),
    setAttribute: jest.fn()
  }))
  // ... other DOM methods
};
```

#### Chrome Extension API Mocking

```javascript
// Mock Chrome APIs for testing
global.chrome = {
  sidePanel: {
    open: jest.fn().mockResolvedValue(undefined)
  }
};
```

#### LocalStorage Mocking

```javascript
// Simple localStorage mock
const mockLocalStorage = {};
global.localStorage = {
  getItem: jest.fn(key => mockLocalStorage[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorage[key] = value;
  }),
  removeItem: jest.fn(key => {
    delete mockLocalStorage[key];
  })
};
```

## Test Organization Patterns

### Test Structure

```javascript
describe('ComponentName', () => {
  // Setup and teardown
  beforeEach(() => {
    /* reset mocks */
  });
  afterEach(() => {
    /* cleanup */
  });

  describe('methodName', () => {
    it('handles normal case correctly', () => {
      // Test happy path
    });

    it('handles edge case appropriately', () => {
      // Test error conditions
    });
  });
});
```

### Test Naming Convention

- Use **descriptive English** test names
- Focus on **behavior**, not implementation
- Examples:
  - ✅ `'returns error when called without arguments'`
  - ❌ `'引数なしでエラー'` (Japanese)
  - ❌ `'test_function_returns_null'` (implementation-focused)

## Common Testing Pitfalls & Solutions

### Problem: Jest Timeout with Complex Mocks

**Solution**: Simplify mocks, use jest.spyOn() for specific methods

### Problem: Boolean Type Assertions Failing

**Solution**: Use explicit boolean conversion (`!!value`)

### Problem: Async Test Race Conditions

**Solution**: Proper async/await usage, avoid Promise constructor

### Problem: DOM Event Testing

**Solution**: Mock event targets properly, simulate user interactions

## Coverage & Quality Gates

### Coverage Requirements

- **Statements**: 85%
- **Branches**: 85%
- **Functions**: 85%
- **Lines**: 85%

### Quality Checks

- All tests must pass across Node.js 16, 18, 20
- ESLint rules must pass
- Prettier formatting enforced
- No console.log statements in production code

## Test Automation

### Local Development

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

### CI/CD Pipeline

- **GitHub Actions** on push/PR
- **Matrix testing** across Node.js versions
- **Coverage reports** uploaded as artifacts
- **PR summaries** with coverage information

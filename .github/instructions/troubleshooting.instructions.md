---
applyTo: '**/*.js,**/*.json,.github/workflows/*.yml,package.json'
---

# Common Issues & Solutions

## Jest & Testing Issues

### Jest Timeout Problems

**Symptoms**: Tests hang or timeout, especially with complex mocks **Solution**:

```javascript
// Simplify mocks - avoid overly complex mock objects
const simpleMock = {
  method: jest.fn().mockResolvedValue('result')
};

// Use jest.spyOn for existing objects
jest.spyOn(global, 'localStorage');
```

### Boolean Type Assertion Failures

**Symptoms**: Tests fail with "expected undefined, received false" **Solution**:

```javascript
// Use explicit boolean conversion
return !!(chrome && chrome.sidePanel);

// Instead of just:
return chrome && chrome.sidePanel;
```

### Async Test Race Conditions

**Symptoms**: Intermittent test failures, especially in CI **Solution**:

```javascript
// Always use async/await properly
it('async test', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});

// Avoid Promise constructor unless necessary
```

## Node.js Version Compatibility

### Jest Version Conflicts

**Problem**: Jest 27 incompatible with Node.js 20 **Solution**: Upgrade to Jest
29

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "babel-jest": "^29.7.0"
  }
}
```

### Babel Configuration

**Problem**: ES6 modules not transforming properly **Solution**: Update
babel.config.js

```javascript
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: '16' }
      }
    ]
  ]
};
```

## GitHub Actions Issues

### Upload Artifact Version

**Problem**: upload-artifact@v3 deprecated **Solution**: Use v4 with proper
syntax

```yaml
- name: Upload coverage reports
  uses: actions/upload-artifact@v4
  with:
    name: coverage-reports-node-${{ matrix.node-version }}
    path: coverage/
    retention-days: 30
```

### Permission Issues

**Problem**: GitHub Actions can't write to repository **Solution**: Add proper
permissions

```yaml
jobs:
  release:
    permissions:
      contents: write
      pull-requests: write
```

## Browser Extension Context

### Extension Detection

**Problem**: Inconsistent detection of extension context **Solution**: Use
comprehensive feature detection

```javascript
function isExtensionContext() {
  return !!(
    globalThis.chrome &&
    chrome.sidePanel &&
    typeof chrome.sidePanel.open === 'function'
  );
}
```

### Fallback Timing

**Problem**: Sidepanel API calls fail silently **Solution**: Implement proper
error handling and fallback

```javascript
try {
  await chrome.sidePanel.open({ path: url });
  return { success: true, mode: 'sidepanel' };
} catch (error) {
  // Fall back to window.open
  const popup = window.open(url, '_blank', windowFeatures);
  return { success: !!popup, mode: 'window' };
}
```

## Build & Distribution

### Module Format Issues

**Problem**: Library not working in different environments **Solution**: Provide
multiple build formats

```javascript
// Vite config for multiple outputs
export default {
  build: {
    lib: {
      entry: 'src/index.js',
      formats: ['es', 'umd'],
      name: 'SidepanelFallback'
    }
  }
};
```

### TypeScript Definition Problems

**Problem**: IDE not recognizing types **Solution**: Proper index.d.ts structure

```typescript
declare module 'sidepanel-fallback' {
  export default class SidepanelFallback {
    init(options?: InitOptions): Promise<InitResult>;
    openPanel(url: string): Promise<OpenResult>;
    // ... other methods
  }
}
```

## Development Workflow

### Git Commit Messages

**Best Practice**: Use conventional commit format

```
feat: add new browser detection
fix: resolve fallback timing issue
docs: update API documentation
test: add edge case coverage
chore: update dependencies
```

### Code Review Checklist

- [ ] All tests passing
- [ ] English-only text in user-facing content
- [ ] TypeScript definitions updated
- [ ] Documentation reflects changes
- [ ] No console.log statements in production

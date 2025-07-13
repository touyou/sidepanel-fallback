# Contributing to SidepanelFallback

Thank you for your interest in contributing to SidepanelFallback! This guide
will help you get started.

## Development Philosophy

SidepanelFallback is built using **Test-Driven Development (TDD)** following
@t_wada principles:

1. **Red** → Write a failing test first
2. **Green** → Write minimal code to make the test pass
3. **Refactor** → Improve code quality while keeping tests green

## Getting Started

### Development Setup

### Prerequisites

- Node.js 16+ and npm 7+
- Git
- Code editor with ESLint and Prettier support (recommended)

### Getting Started

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/sidepanel-fallback.git
   cd sidepanel-fallback
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Run Quality Checks**

   ```bash
   npm run quality     # Run lint and format checks
   npm run quality:fix # Auto-fix lint and format issues
   npm run lint        # Run ESLint only
   npm run format      # Run Prettier only
   ```

4. **Run Tests**

   ```bash
   npm test           # Run all tests
   npm run test:watch # Run tests in watch mode
   npm run test:coverage # Run tests with coverage
   ```

5. **Start Development**

   ```bash
   npm run dev        # Start Vite dev server
   ```

6. **Build Package**
   ```bash
   npm run build      # Build for production
   ```

### Code Quality

This project enforces code quality through:

- **ESLint**: JavaScript linting with modern best practices
- **Prettier**: Code formatting for consistent style
- **Jest**: Test coverage requirements (90%+ threshold)
- **Pre-commit hooks**: Automatic lint and format on commit

Your code editor should automatically format files on save if you have ESLint
and Prettier extensions installed.

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Follow TDD Process

For any new feature or bug fix:

1. **Write a test first** that describes the expected behavior
2. **Run the test** to see it fail (Red)
3. **Write minimal code** to make the test pass (Green)
4. **Refactor** the code while keeping tests green
5. **Repeat** until feature is complete

### Example TDD Cycle

```javascript
// 1. RED: Write failing test
describe('newFeature', () => {
  it('should do something specific', () => {
    const result = newFeature('input');
    expect(result).toBe('expected output');
  });
});

// 2. Run test → FAIL ❌

// 3. GREEN: Write minimal implementation
export function newFeature(input) {
  return 'expected output'; // Minimal solution
}

// 4. Run test → PASS ✅

// 5. REFACTOR: Improve implementation
export function newFeature(input) {
  // Proper implementation
  return processInput(input);
}
```

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Test the build
npm run build

# Test in browser
npm run dev
```

### 4. Commit Your Changes

We use conventional commits for clear history:

```bash
git add .
git commit -m "feat: add new feature description"
# or
git commit -m "fix: resolve specific bug"
# or
git commit -m "docs: update API documentation"
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring without changing functionality
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Code Standards

### Module Structure

Each module should follow this pattern:

```javascript
// src/newModule.js
export class NewModule {
  constructor() {
    // Initialization
  }

  publicMethod() {
    // Public API
  }

  _privateMethod() {
    // Private methods prefixed with _
  }
}
```

### Test Structure

```javascript
// test/newModule.test.js
import { NewModule } from '../src/newModule.js';

describe('NewModule', () => {
  let module;

  beforeEach(() => {
    module = new NewModule();
  });

  describe('publicMethod', () => {
    it('should handle normal case', () => {
      // Test implementation
    });

    it('should handle edge case', () => {
      // Edge case testing
    });

    it('should handle error case', () => {
      // Error handling testing
    });
  });
});
```

### Documentation

- Add JSDoc comments for all public methods
- Update usage.md for API changes
- Update README.md for significant features
- Update ai-notes.md for design decisions

## Testing Guidelines

### Test Coverage Requirements

- **100% pass rate** is required
- Test both success and error scenarios
- Mock external dependencies properly
- Test browser compatibility where relevant

### Test Categories

1. **Unit Tests**: Test individual modules in isolation
2. **Integration Tests**: Test module interactions
3. **Error Handling**: Test all error scenarios
4. **Browser Compatibility**: Test different user agents

### Mocking Strategy

Use Jest mocks for external dependencies:

```javascript
// Mock browser APIs
global.navigator = { userAgent: 'test-ua' };
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

// Mock DOM
global.document = {
  createElement: jest.fn()
};
```

## Pull Request Process

### Before Submitting

1. **All tests pass**: `npm test` returns 100% success
2. **Code builds**: `npm run build` completes without errors
3. **Documentation updated**: README, usage.md, etc.
4. **Commits are clean**: Use conventional commit messages

### PR Requirements

1. **Descriptive title**: Explain what the PR does
2. **Detailed description**: Why the change is needed
3. **Test evidence**: Show that tests pass
4. **Breaking changes**: Clearly document any breaking changes

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Documentation

- [ ] README updated if needed
- [ ] API documentation updated if needed
```

## Issue Guidelines

### Reporting Bugs

Use the bug report template:

```markdown
**Describe the bug** Clear description of the issue

**To Reproduce** Steps to reproduce:

1. Initialize with '...'
2. Call method '...'
3. See error

**Expected behavior** What should happen

**Environment**

- Browser: [e.g., Chrome 120]
- Node.js version: [e.g., 18.17.0]
- Library version: [e.g., 1.0.0]
```

### Feature Requests

```markdown
**Is your feature request related to a problem?** Description of the problem

**Describe the solution you'd like** Clear description of desired feature

**Describe alternatives you've considered** Other solutions you've thought about

**Additional context** Any other context about the feature
```

## Release Process

### Version Numbers

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. All tests pass
2. Documentation updated
3. Version bumped in package.json
4. CHANGELOG.md updated
5. Git tag created
6. NPM package published

## Community

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a positive environment

### Getting Help

- 📖 Read the [documentation](docs/usage.md)
- 🔍 Search existing
  [issues](https://github.com/touyou/sidepanel-fallback/issues)
- 💬 Start a
  [discussion](https://github.com/touyou/sidepanel-fallback/discussions)

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Package.json contributors field

Thank you for contributing to SidepanelFallback! 🎉

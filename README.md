# SidepanelFallback

A lightweight fallback utility for Chrome Extensions to handle side panel
conflicts. Provides browser-specific storage and display mode switching with a
clean developer API.

[![npm version](https://badge.fury.io/js/sidepanel-fallback.svg)](https://badge.fury.io/js/sidepanel-fallback)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/touyou/sidepanel-fallback/workflows/Tests/badge.svg)](https://github.com/touyou/sidepanel-fallback/actions)
[![Node.js CI](https://github.com/touyou/sidepanel-fallback/actions/workflows/test.yml/badge.svg)](https://github.com/touyou/sidepanel-fallback/actions/workflows/test.yml)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Features

- 🚀 **Automatic Fallback**: Seamlessly switch between Chrome sidepanel and
  popup window
- 🌐 **Cross-Browser Support**: Works with Chrome, Firefox, Safari, Edge, and
  more
- 💾 **Persistent Settings**: Per-browser mode preferences with
  localStorage/Chrome Storage API
- 🎛️ **Embeddable Settings UI**: Ready-to-use settings component
- 🧪 **Test Driven**: 150+ test cases with 100% coverage using Jest and @t_wada
  TDD principles
- 📦 **Zero Dependencies**: Lightweight and self-contained
- 🔧 **Developer Friendly**: Clean API with TypeScript support
- ⚡ **Modern Build**: ES6+ modules with UMD fallback via Vite
- 📏 **Code Quality**: ESLint + Prettier for consistent code style

## Quick Start

```bash
npm install sidepanel-fallback
```

```javascript
import { SidepanelFallback } from 'sidepanel-fallback';

// Initialize
const fallback = new SidepanelFallback();
await fallback.init();

// Open panel (auto-detects best method)
await fallback.openPanel('/panel.html');

// Add settings UI
const container = document.getElementById('settings');
await fallback.withSettingsUI(container);
```

## Why SidepanelFallback?

Chrome Extensions with sidepanel functionality face several challenges:

- **Browser Compatibility**: Sidepanel API is Chrome-specific
- **API Availability**: Not all Chrome versions support sidepanel
- **User Preferences**: Some users prefer popup windows
- **Fallback Complexity**: Manual fallback implementation is error-prone

SidepanelFallback solves these issues with a unified API that automatically
handles browser detection, fallback logic, and user preferences.

## Browser Support

| Browser     | Sidepanel | Popup | Auto Mode |
| ----------- | --------- | ----- | --------- |
| Chrome 114+ | ✅        | ✅    | sidepanel |
| Edge 114+   | ✅        | ✅    | sidepanel |
| Firefox     | ❌        | ✅    | window    |
| Safari      | ❌        | ✅    | window    |

## API Overview

### Core Methods

```javascript
// Initialize the library
await fallback.init();

// Open a panel
const result = await fallback.openPanel('/panel.html');

// Add settings UI to container
await fallback.withSettingsUI(document.getElementById('settings'));

// Get current configuration
const settings = fallback.getCurrentSettings();
```

### Configuration Options

```javascript
const fallback = new SidepanelFallback({
  defaultMode: 'auto', // 'auto', 'sidepanel', 'window'
  userAgent: 'custom-ua' // Override browser detection
});
```

## Examples

### Chrome Extension

```javascript
// background.js
import { SidepanelFallback } from 'sidepanel-fallback';

const fallback = new SidepanelFallback();
await fallback.init();

chrome.action.onClicked.addListener(async () => {
  await fallback.openPanel('panel.html');
});
```

### Web Application

```javascript
// app.js
import { SidepanelFallback } from 'sidepanel-fallback';

const fallback = new SidepanelFallback();
await fallback.init();

document.getElementById('open-btn').onclick = () => {
  fallback.openPanel('/dashboard.html');
};
```

## Documentation

- 📖 [Complete API Documentation](docs/usage.md)
- 🏗️ [Architecture & Design](docs/ai-notes.md)
- 🧪 [Test Results & Coverage](docs/testing.md)

## Requirements

- **Node.js**: 18.18.0 or higher
- **npm**: 8.0.0 or higher
- **Browser**: Chrome 88+, Firefox 78+, Safari 14+, Edge 88+

For legacy environments, consider using an older version that supports
Node.js 16.

## Development

### Setup

```bash
git clone https://github.com/touyou/sidepanel-fallback.git
cd sidepanel-fallback
npm install
```

### Commands

```bash
npm test                    # Run tests
npm run test:coverage       # Run tests with coverage
npm run test:coverage:html  # Generate HTML coverage report (opens in browser)
npm run test:coverage:summary # Show coverage summary only
npm run test:watch          # Run tests in watch mode
npm run dev                 # Start development server
npm run build               # Build for production
npm run quality             # Run lint + format check
npm run quality:fix         # Fix lint + format issues
```

### Coverage Reports

This project maintains high test coverage (85%+ lines, 80%+ branches). Coverage
reports are generated locally and stored as GitHub Actions artifacts:

- **Local Development**: Run `npm run test:coverage:html` to view detailed
  coverage
- **CI/CD**: Coverage reports are uploaded as artifacts in GitHub Actions
- **Pull Requests**: Coverage summaries are automatically posted for Node.js
  20.x runs npm run lint # Check code quality npm run format # Format code npm
  run quality # Run all quality checks npm run health-check # Validate project
  setup

### Code Quality

This project maintains high code quality standards:

- **ESLint**: Enforces JavaScript best practices and catches potential bugs
- **Prettier**: Ensures consistent code formatting across the codebase
- **Jest**: Maintains 90%+ test coverage with comprehensive test suites
- **TDD**: Follows test-driven development (@t_wada style)

Pre-commit hooks automatically run linting and formatting to maintain
consistency.

### Test Coverage

- ✅ **150+ test cases** across 13 modules
- ✅ **100% pass rate**
- ✅ **Complete API coverage**
- ✅ **Cross-browser compatibility tests**
- ✅ **Integration & End-to-End testing**
- ✅ **Performance benchmarking**
- ✅ **Memory leak detection**
- ✅ **Error handling validation**

## Architecture

The library is built as a composition of focused modules:

```
src/
├── index.js              # Main API integration
├── browserInfo.js        # User agent detection
├── modeStorage.js        # Settings persistence
├── panelLauncher.js      # Panel opening logic
└── settingsUI.js         # Settings UI component

test/
├── *.test.js             # 13 comprehensive test suites
├── benchmark.test.js     # Performance benchmarking
├── integration.test.js   # Integration testing
├── e2e.test.js          # End-to-end testing
└── testUtils.js         # Testing utilities
```

Each module is fully tested with enterprise-level test coverage including unit tests, integration tests, end-to-end tests, and performance benchmarks.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md)
for details.

### Development Process

1. **Fork** the repository
2. **Create** a feature branch
3. **Write tests** first (TDD approach)
4. **Implement** the feature
5. **Ensure all tests pass**
6. **Submit** a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report bugs](https://github.com/touyou/sidepanel-fallback/issues)
- 💡 [Request features](https://github.com/touyou/sidepanel-fallback/issues)
- 📚
  [Documentation](https://github.com/touyou/sidepanel-fallback/tree/main/docs)

---

Made with ❤️ by [touyou](https://github.com/touyou)

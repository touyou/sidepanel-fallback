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

### Chrome Extension Convenience API

For Chrome Extensions, we provide simplified methods:

```javascript
// Setup extension configuration
await fallback.setupExtension({
  sidepanelPath: 'sidepanel.html',
  popupPath: 'popup.html'
});

// Handle action clicks with automatic mode detection
const result = await fallback.handleActionClick();

// Toggle between sidepanel and popup modes
await fallback.toggleMode();
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

chrome.action.onClicked.addListener(async () => {
  await fallback.init();
  const result = await fallback.openPanel('sidepanel.html');

  if (result.success) {
    console.log(`Panel opened using ${result.method}`);
  }
});
```

### Chrome Extension with Simplified API

```javascript
// background.js - Simplified API for easier development
import { SidepanelFallback } from 'sidepanel-fallback';

const fallback = new SidepanelFallback({ defaultMode: 'auto' });

// One-time setup
await fallback.setupExtension({
  sidepanelPath: 'sidepanel.html',
  popupPath: 'popup.html'
});

// Automatic mode handling
chrome.action.onClicked.addListener(async () => {
  await fallback.handleActionClick();
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

### Complete Example

A production-ready Chrome Extension example is available in [`examples/chrome-extension/`](examples/chrome-extension/) featuring:

- Manifest V3 compatibility
- Automatic sidepanel ↔ popup fallback
- Settings UI with persistent preferences
- Shared UI components
- Performance monitoring

```bash
npm run build
# Load examples/chrome-extension/ in chrome://extensions/
```

## Documentation

- 📖 [Complete API Documentation](docs/usage.md)
- 🏗️ [Architecture & Design](docs/ai-notes.md)
- 🧪 [Test Results & Coverage](docs/testing.md)

## Requirements

- **Node.js**: 18.18.0 or higher
- **npm**: 8.0.0 or higher  
- **Browser**: Chrome 88+, Firefox 78+, Safari 14+, Edge 88+

### Node.js Compatibility

Actively tested on Node.js 18.x (LTS), 20.x (LTS), and 22.x (Current).

**Note**: Some advanced test suites are disabled on Node.js 20/22 due to Jest compatibility issues. Core functionality remains fully supported.

### Test Commands

```bash
npm test           # Run core tests
npm run test:full  # Run full test suite (Node.js 18 recommended)
```

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
npm run dev                 # Start development server
npm run build               # Build for production
npm run quality             # Run lint + format check
npm run quality:fix         # Fix lint + format issues
```

### Test Coverage

- ✅ **150+ test cases** with **100% pass rate**
- ✅ **Complete API coverage** across all modules
- ✅ **Cross-browser compatibility** testing
- ✅ **Integration & End-to-End** testing
- ✅ **Performance benchmarking** and memory leak detection

## Architecture

Built as focused, testable modules:

```
src/
├── index.js              # Main API
├── browserInfo.js        # Browser detection
├── modeStorage.js        # Settings persistence
├── panelLauncher.js      # Panel opening logic
└── settingsUI.js         # Settings UI component
```

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

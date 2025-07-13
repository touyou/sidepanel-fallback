# SidepanelFallback

A lightweight fallback utility for Chrome Extensions to handle side panel conflicts. Provides browser-specific storage and display mode switching with a clean developer API.

[![npm version](https://badge.fury.io/js/sidepanel-fallback.svg)](https://badge.fury.io/js/sidepanel-fallback)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/touyou/sidepanel-fallback/workflows/Tests/badge.svg)](https://github.com/touyou/sidepanel-fallback/actions)
[![Coverage Status](https://coveralls.io/repos/github/touyou/sidepanel-fallback/badge.svg?branch=main)](https://coveralls.io/github/touyou/sidepanel-fallback?branch=main)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Features

- 🚀 **Automatic Fallback**: Seamlessly switch between Chrome sidepanel and popup window
- 🌐 **Cross-Browser Support**: Works with Chrome, Firefox, Safari, Edge, and more
- 💾 **Persistent Settings**: Per-browser mode preferences with localStorage/Chrome Storage API
- 🎛️ **Embeddable Settings UI**: Ready-to-use settings component
- 🧪 **Test Driven**: 46 test cases with 100% coverage using Jest and @t_wada TDD principles
- 📦 **Zero Dependencies**: Lightweight and self-contained
- 🔧 **Developer Friendly**: Clean API with TypeScript support
- ⚡ **Modern Build**: ES6+ modules with UMD fallback via Vite

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

SidepanelFallback solves these issues with a unified API that automatically handles browser detection, fallback logic, and user preferences.

## Browser Support

| Browser | Sidepanel | Popup | Auto Mode |
|---------|-----------|-------|-----------|
| Chrome 114+ | ✅ | ✅ | sidepanel |
| Edge 114+ | ✅ | ✅ | sidepanel |
| Firefox | ❌ | ✅ | window |
| Safari | ❌ | ✅ | window |

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
  defaultMode: 'auto',    // 'auto', 'sidepanel', 'window'
  userAgent: 'custom-ua'  // Override browser detection
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

## Development

Built with Test-Driven Development (TDD) following @t_wada principles:

```bash
# Install dependencies
npm install

# Run tests (46 test cases)
npm test

# Start development server
npm run dev

# Build for production
npm run build
```

### Test Coverage

- ✅ **46 test cases** across 5 modules
- ✅ **100% pass rate** 
- ✅ **Complete API coverage**
- ✅ **Browser compatibility tests**
- ✅ **Error handling validation**

## Architecture

The library is built as a composition of focused modules:

```
src/
├── index.js           # Main API integration
├── browserInfo.js     # User agent detection
├── modeStorage.js     # Settings persistence  
├── panelLauncher.js   # Panel opening logic
└── settingsUI.js      # Settings UI component
```

Each module is fully tested and follows single responsibility principle.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

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
- � [Documentation](https://github.com/touyou/sidepanel-fallback/tree/main/docs)

---

Made with ❤️ by [touyou](https://github.com/touyou)

Made with ❤️ by the SidepanelFallback team

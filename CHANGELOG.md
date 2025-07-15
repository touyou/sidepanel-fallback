# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Core Library**: Complete sidepanel fallback functionality with automatic browser detection
- **Chrome Extension API**: Simplified convenience methods (`setupExtension`, `handleActionClick`, `toggleMode`)
- **Shared UI Components**: Reusable `SidepanelFallbackUI` class for consistent popup/sidepanel interfaces
- **Cross-Browser Support**: Works with Chrome 88+, Firefox 78+, Safari 14+, Edge 88+
- **Persistent Storage**: Per-browser mode preferences with localStorage/Chrome Storage API
- **Settings UI Component**: Embeddable settings interface with real-time mode switching
- **TypeScript Support**: Complete type definitions for all APIs
- **Performance Features**: Lazy loading, caching, progressive initialization, memory tracking
- **Comprehensive Testing**: 150+ test cases with 100% pass rate across multiple test suites
- **Modern Build System**: Vite-based build with ES6+ modules and UMD fallback
- **Developer Tools**: ESLint v9 with Flat Config, Prettier, automated quality checks
- **Documentation**: Complete API reference, usage guides, and working examples
- **CI/CD Pipeline**: GitHub Actions with Node.js 18.x/20.x/22.x testing matrix

### Fixed

- **Chrome Extension getBrowserInfo Error**: Resolved method call errors in background script
- **Mode Detection Issues**: Fixed "Unknown" mode display with proper fallback to storage-based lookup
- **Message Handler Coverage**: Added missing `GET_STATUS` and `SET_MODE` handlers in background script
- **Sidepanel API Integration**: Proper user gesture handling and fallback to window mode
- **UI Initialization Timing**: Enhanced reliability with retry mechanisms for status updates
- **Node.js 20/22 Compatibility**: Resolved segmentation faults and memory issues in test execution

### Changed

- **BREAKING**: Minimum Node.js requirement updated from 16.0.0 to 18.18.0
- **Dependencies**: Updated to latest stable versions (Vite v5, ESLint v9, Jest v30)
- **ESLint Configuration**: Migrated from legacy .eslintrc.json to modern Flat Config format
- **Documentation Language**: Complete conversion from Japanese to English for international accessibility
- **UI Architecture**: Refactored to use shared components eliminating code duplication
- **Test Infrastructure**: Enhanced Jest configuration for better cross-Node.js version support

### Technical Highlights

- **Zero Dependencies**: Self-contained implementation with no external runtime dependencies
- **TDD Approach**: Developed following @t_wada test-driven development principles
- **Modular Architecture**: Clean separation of concerns across focused modules
- **Enterprise-Grade Testing**: Unit, integration, e2e, and performance benchmarking
- **Modern Standards**: ES6+ modules, async/await, Chrome Manifest V3 compatibility

### Browser Compatibility Matrix

| Browser     | Sidepanel API | Popup Window | Auto Mode Default |
|-------------|---------------|--------------|-------------------|
| Chrome 114+ | ✅            | ✅           | sidepanel         |
| Edge 114+   | ✅            | ✅           | sidepanel         |
| Firefox     | ❌            | ✅           | window            |
| Safari      | ❌            | ✅           | window            |

### API Surface

#### Core Methods
- `init()` - Initialize the fallback system
- `openPanel(path, options)` - Open panel with automatic fallback
- `withSettingsUI(container)` - Add embeddable settings interface
- `getCurrentSettings()` - Get current browser and mode configuration

#### Chrome Extension Convenience Methods
- `setupExtension(options)` - One-time extension configuration
- `handleActionClick(mode)` - Automatic action button handling
- `toggleMode()` - Switch between sidepanel and popup modes

#### Event System
- Comprehensive event emission for all operations
- Error handling with graceful degradation
- Performance tracking and debugging capabilities

[Unreleased]: https://github.com/touyou/sidepanel-fallback/compare/HEAD...HEAD

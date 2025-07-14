# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Complete internationalization of codebase for global development
- Comprehensive project modernization including Node.js 18+, Vite v5, ESLint v9, Jest v30
- Automated release workflow with CHANGELOG management and GitHub release creation
- Development process documentation with CHANGELOG guidelines

### Changed

- **BREAKING CHANGE**: Minimum Node.js version requirement increased from 16.0.0+ to 18.18.0+
- Updated all dependencies to latest stable versions (Vite v5.4.19, ESLint v9.31.0, Jest v30.0.4)
- Migrated ESLint configuration from legacy .eslintrc.json to modern Flat Config (eslint.config.mjs)
- Converted all Japanese comments and documentation to English for international accessibility
- Enhanced GitHub Actions workflow with Node.js 18.x, 20.x, 22.x testing matrix

### Fixed

- Resolved ESLint v9 compatibility issues with Node.js engine requirements
- Fixed globals syntax compatibility in ESLint Flat Config
- Corrected TypeScript definitions and JSDoc consistency across all modules

### Added

- Core sidepanel fallback functionality
- Browser detection utilities (`browserInfo.js`)
- Persistent storage management (`modeStorage.js`)
- Panel launcher with automatic fallback (`panelLauncher.js`)
- Embeddable settings UI component (`settingsUI.js`)
- Main API with initialization and integration (`index.js`)
- Comprehensive test suite with 46 test cases and 100% coverage
- TypeScript type definitions
- Cross-browser support (Chrome, Firefox, Safari, Edge)
- Zero-dependency implementation
- Complete documentation set:
  - Usage guide and API reference
  - Testing strategy documentation
  - Contributing guidelines
  - Security policy
- Build system with Vite
- GitHub Actions CI/CD workflows
- OSS-ready project structure
- ESLint Flat Config format (eslint.config.mjs) for modern linting
- Support for globals package in ESLint v9 configuration
- Improved catch error variable handling in ESLint rules
- Automatic CHANGELOG management in release workflow
- Enhanced GitHub release process with automatic release notes generation

### Changed

- **BREAKING**: Updated minimum Node.js requirement from 16.0.0 to 18.18.0
- Updated Vite from v4.5.14 to v5.4.19 for better performance and security
- Updated GitHub Actions workflows to test Node.js 18.x, 20.x, and 22.x
- Updated release workflow to use Node.js 20.x
- Updated Babel configuration to target Node.js 18.18.0 specifically
- Updated TypeScript definitions to use correct 'window' mode instead of 'popup'
- **BREAKING**: Migrated ESLint from v8.57.1 to v9.31.0 with Flat Config format
- Updated Jest from v29.7.0 to v30.0.4 for latest testing features
- Removed legacy .eslintrc.json and .eslintignore files
- Enhanced ESLint configuration to properly handle catch block variables
- Improved release workflow with automatic CHANGELOG updates and version
  management

### Infrastructure

- Modernized build toolchain for enhanced development experience
- Improved CI/CD pipeline with latest Node.js LTS versions
- Enhanced security posture with updated dependencies
- Updated linting infrastructure to ESLint v9 standards
- Improved testing infrastructure with Jest v30
- Automated release process with CHANGELOG integration

### Technical Details

- TDD development approach following @t_wada principles
- Jest test framework with extensive coverage
- ES6+ modules with UMD fallback
- localStorage and Chrome Storage API integration
- Chrome sidepanel API with popup window fallback
- Persistent per-browser mode preferences
- Automatic browser capability detection
- Clean, developer-friendly API surface

### Browser Compatibility

- Chrome 88+ (sidepanel API support)
- Firefox 78+
- Safari 14+
- Edge 88+
- Other Chromium-based browsers

### API Surface

- `SidepanelFallback.init()` - Initialize the fallback system
- `SidepanelFallback.openPanel(url, options)` - Open panel with auto-fallback
- `SidepanelFallback.withSettingsUI(container, options)` - Add settings UI
- `SidepanelFallback.getCurrentSettings()` - Get current configuration

[Unreleased]: https://github.com/touyou/sidepanel-fallback/compare/v1.0.0...HEAD

# Sidepanel Fallback Examples

This directory contains practical usage examples for the `sidepanel-fallback`
library.

## 📁 Available Examples

### [Chrome Extension Example](./chrome-extension/)

A complete working Chrome Extension implementation example. Experience all
features of the library in a real extension including sidepanel and popup window
fallback functionality, settings UI, performance tracking, and more.

**Key Features:**

- ✅ Manifest V3 compatible
- ✅ Automatic sidepanel ↔ popup fallback
- ✅ Settings UI component implementation
- ✅ Performance monitoring features
- ✅ English UI support
- ✅ Installable practical example

## 🚀 Quick Start

### 1. Try the Chrome Extension Example

```bash
# 1. Clone this repository (or if already cloned)
git clone https://github.com/touyou/sidepanel-fallback.git
cd sidepanel-fallback

# 2. Install dependencies and build
npm install
npm run build

# 3. Load as Chrome Extension
# - Open chrome://extensions/
# - Enable Developer mode
# - Click "Load unpacked extension"
# - Select examples/chrome-extension/ directory
```

### 2. Test Functionality

1. Click the extension icon in the toolbar
2. Chrome/Edge: Sidepanel opens
3. Firefox/Safari: Popup window opens
4. Verify settings UI, performance statistics, and browser detection features

## 📖 Detailed Documentation

Each example includes detailed README files:

- [Chrome Extension Detailed Guide](./chrome-extension/README.md)

## 🔧 Customization Guide

### Library Configuration Options

```javascript
const fallbackInstance = new SidepanelFallback({
  defaultMode: 'auto', // 'auto' | 'sidepanel' | 'window'
  enablePerformanceTracking: true,
  enableCaching: true,
  enableLazyLoading: true
});
```

### Event Handling

```javascript
// Browser detection event
fallbackInstance.on('browserDetected', data => {
  console.log('Detected browser:', data.browser);
});

// Mode change event
fallbackInstance.on('modeChanged', data => {
  console.log(`${data.oldMode} → ${data.newMode}`);
});

// Panel open event
fallbackInstance.on('afterOpenPanel', data => {
  console.log('Panel opened:', data.method);
});
```

## 🎯 Use Case Implementation Examples

### 1. Basic Sidepanel Extension

```javascript
// background.js
chrome.action.onClicked.addListener(async tab => {
  const result = await fallbackInstance.openPanel('panel.html');
  console.log('Panel open result:', result);
});
```

### 2. Application with Settings

```javascript
// panel.js
// Automatically add settings UI
const settingsContainer = document.getElementById('settings');
await fallbackInstance.withSettingsUI(settingsContainer);
```

### 3. Performance Monitoring

```javascript
// Get performance statistics
const stats = fallbackInstance.getPerformanceStats();
console.log('Cache statistics:', stats.browserCache);
console.log('Memory usage:', stats.memorySnapshots);
```

## 🆘 Troubleshooting

### Common Issues

1. **Sidepanel won't open**
   - Confirm using Chrome 114+
   - Verify `sidePanel` permission is included in manifest.json

2. **Library won't load**
   - Confirm `sidepanel-fallback.umd.js` is in the correct path
   - Check file loading status in Network tab

3. **Settings not saving**
   - Verify `storage` permission is enabled
   - Check localStorage/chrome.storage in browser dev tools

### Debug Methods

```javascript
// Monitor debug events
fallbackInstance.on('debug', data => {
  console.log('Debug info:', data);
});

// Monitor error events
fallbackInstance.on('error', data => {
  console.error('Error occurred:', data);
});
```

## 🤝 Contributing

New examples and improvement suggestions are welcome!

1. Fork and create a new branch
2. Add new examples or improve existing ones
3. Add appropriate documentation
4. Submit a pull request

## 📄 License

These examples are provided under the same MIT license as the main library.

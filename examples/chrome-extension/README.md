# Chrome Extension Example

This example demonstrates how to use the `sidepanel-fallback` library in a real Chrome Extension.

## 📁 File Structure

```
chrome-extension/
├── manifest.json           # Chrome Extension configuration file
├── background.js           # Background service worker  
├── sidepanel.html          # Sidepanel display HTML
├── popup.html              # Fallback popup HTML
├── sidepanel-fallback.umd.js # Library file (auto-copied from dist/)
└── README.md               # This file
```

## 🚀 Installation Instructions

### 1. Load as Chrome Extension

1. Open `chrome://extensions/` in Chrome browser
2. Enable "Developer mode" in the top right
3. Click "Load unpacked extension"
4. Select this directory (`examples/chrome-extension/`)
5. The extension will be loaded and an icon will appear in the toolbar

### 2. Test Functionality

1. Click the extension icon in the toolbar
2. Chrome: Sidepanel opens
3. Other browsers/environments: Popup window opens

## 🎯 Demo Features

### Sidepanel Mode (Chrome/Edge)
- 📱 Displays as sidepanel on the right side of the browser
- 🎛️ Real-time settings changes
- 📊 Performance statistics display
- ⚙️ Settings UI component demo

### Popup Mode (Firefox/Safari/Others)
- 🪟 Displays as independent popup window
- ⚠️ Clear indication of fallback behavior
- 🔄 Same feature set in compact UI

## 🛠️ Implementation Highlights

### 1. Service Worker (background.js)
```javascript
// Library initialization
const fallbackInstance = new SidepanelFallback({
  defaultMode: 'auto',
  enablePerformanceTracking: true
});

await fallbackInstance.init();

// Action button click handler
chrome.action.onClicked.addListener(async (tab) => {
  const result = await fallbackInstance.openPanel('sidepanel.html');
  // Fallback handling...
});
```

### 2. Sidepanel/Popup (HTML)
```javascript
// Frontend initialization
const fallbackInstance = new SidepanelFallback({
  defaultMode: 'auto',
  enableCaching: true
});

await fallbackInstance.init();

// Add settings UI
await fallbackInstance.withSettingsUI(container);
```

### 3. Manifest V3 Support
```json
{
  "manifest_version": 3,
  "permissions": ["sidePanel", "storage"],
  "background": {
    "service_worker": "background.js"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

## 📋 Testing Checklist

- [ ] Extension loads properly
- [ ] Panel/popup opens when icon is clicked
- [ ] Browser information is correctly detected and displayed
- [ ] Display mode settings work
- [ ] Setting changes are persisted
- [ ] Performance statistics can be retrieved
- [ ] Cache clear function works
- [ ] Fallback behavior works in different browsers

## 🔧 Customization Examples

### Adding Custom Configuration Options
```javascript
const fallbackInstance = new SidepanelFallback({
  defaultMode: 'auto',
  enablePerformanceTracking: true,
  enableCaching: true,
  // Custom options
  customOption: 'value'
});
```

### Adding Event Listeners
```javascript
fallbackInstance.on('modeChanged', (data) => {
  console.log(`Mode changed: ${data.oldMode} → ${data.newMode}`);
});

fallbackInstance.on('afterOpenPanel', (data) => {
  console.log('Panel opened:', data);
});
```

## 🐛 Troubleshooting

### Extension Won't Load
- Check that `manifest.json` syntax is correct
- Verify `background.js` has no syntax errors
- Check Chrome DevTools Console for errors

### Sidepanel Won't Open
- Confirm using Chrome 114+
- Verify `sidePanel` permission is enabled
- Check background script logs

### Library Errors
- Confirm `sidepanel-fallback.umd.js` is properly placed
- Check Network tab for file loading status

## 📚 Reference Links

- [Chrome Extensions Developer Guide](https://developer.chrome.com/docs/extensions/)
- [Side Panel API Documentation](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- [sidepanel-fallback Library Documentation](../../docs/usage.md)

## 🎉 Use Cases

This example can be used as a reference for creating extensions with:

- Bookmark management tools
- Note & ToDo management
- Password managers
- Developer tools
- Social media management
- Online learning tools

Customize the UI and logic according to your specific use case.
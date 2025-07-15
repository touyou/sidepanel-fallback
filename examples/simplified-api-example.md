# Chrome Extension Example with Simplified API

This example demonstrates how to use sidepanel-fallback with the new simplified
API for Chrome Extensions.

## New API Overview

Building on learnings from chrome-extension-switcher, we've added these
simplified API methods:

- `setupExtension(options)` - Extension configuration setup
- `handleActionClick(mode)` - Action button click handling
- `toggleMode()` - Toggle between sidepanel/popup modes

## background.js (Simplified Version)

```javascript
import SidepanelFallback from 'sidepanel-fallback';

// Create instance
const sidepanelFallback = new SidepanelFallback({
  defaultMode: 'auto' // Auto-detection
});

// Extension setup
sidepanelFallback.setupExtension({
  sidepanelPath: 'sidepanel.html',
  popupPath: 'popup.html'
});

// Action button click handling
chrome.action.onClicked.addListener(async tab => {
  const result = await sidepanelFallback.handleActionClick();

  if (!result.success) {
    console.error('Failed to handle action click:', result.error);
  } else if (result.userAction) {
    // User action required (sidepanel mode)
    console.log('User action required:', result.userAction);
  }
});

// Message handling (mode toggle from settings)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleMode') {
    sidepanelFallback
      .toggleMode()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }
});
```

## Comparison with Traditional Approach

### Traditional Approach (chrome-extension-switcher)

```javascript
// Complex setup and error handling required
chrome.action.onClicked.addListener(async tab => {
  try {
    const result = await chrome.storage.local.get(['mode']);
    const currentMode = result.mode || 'popup';

    if (currentMode === 'sidepanel') {
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: true,
        path: 'sidepanel.html'
      });
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
      // Show instruction window...
    } else {
      await chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 400,
        height: 600,
        focused: true
      });
    }
  } catch (error) {
    // Error handling...
  }
});
```

### New API

```javascript
// Simple and clear
chrome.action.onClicked.addListener(async tab => {
  const result = await sidepanelFallback.handleActionClick();
  // Error handling and fallbacks are automatically managed
});
```

## Benefits

1. **Simplicity**: Complex logic is encapsulated within the library
2. **Error Handling**: Automatic fallback functionality
3. **Browser Support**: Works on older browsers
4. **Maintainability**: Library absorbs API changes

## manifest.json

```json
{
  "manifest_version": 3,
  "name": "Sidepanel Example with Simplified API",
  "version": "1.0.0",
  "permissions": ["storage", "sidePanel"],
  "action": {
    "default_title": "Open Panel"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

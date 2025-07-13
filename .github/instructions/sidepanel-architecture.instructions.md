---
applyTo: 'src/**/*.js,src/index.d.ts,public/**/*.html'
---

# Chrome Extension Sidepanel Fallback Implementation

## Core Problem & Solution

### The Challenge

Chrome Extensions with sidepanel functionality need fallback mechanisms because:

- Sidepanel API may fail due to conflicts or permissions
- Different browsers have different capabilities
- Users may prefer different panel modes (sidepanel vs popup window)

### Fallback Strategy

```javascript
// Primary: Try Chrome Sidepanel API
try {
  await chrome.sidePanel.open({ path: '/panel.html' });
} catch (error) {
  // Fallback: Use window.open popup
  window.open('/panel.html', '_blank', 'width=400,height=600');
}
```

## Architecture Components

### 1. Browser Detection (`browserInfo.js`)

- Detects Chrome, Firefox, Safari, Edge, Dia browsers
- Uses User Agent string analysis
- Returns consistent browser identifiers

### 2. Mode Storage (`modeStorage.js`)

- Abstracts localStorage and Chrome Extension Storage
- Stores user preferences per browser
- Validates mode values (sidepanel, window, auto)

### 3. Panel Launcher (`panelLauncher.js`)

- Handles actual panel opening logic
- Implements fallback mechanism
- Manages window popup configuration

### 4. Settings UI (`settingsUI.js`)

- Generates HTML for user preference UI
- Handles radio button interactions
- Provides callback mechanism for settings changes

### 5. Main Integration (`index.js`)

- Coordinates all components
- Provides simple public API
- Handles auto-mode browser detection

## API Usage Patterns

### Basic Setup

```javascript
import SidepanelFallback from 'sidepanel-fallback';

const fallback = new SidepanelFallback();
await fallback.init();
await fallback.openPanel('/panel.html');
```

### With Settings UI

```javascript
const fallback = new SidepanelFallback();
await fallback.init();

// Add settings to your page
const container = document.getElementById('settings-container');
await fallback.withSettingsUI(container);
```

### Auto Mode Behavior

- **Chrome/Edge**: Prefers sidepanel mode
- **Firefox/Safari**: Prefers window mode
- **Unknown browsers**: Defaults to window mode
- **User can override** with explicit settings

## Browser Context Detection

### Extension Context

```javascript
// Detects if running in Chrome Extension
const isExtension = !!(globalThis.chrome && chrome.sidePanel);
```

### Fallback Logic

1. Check if running in extension context
2. Try sidepanel API if available and mode is 'sidepanel'
3. Fall back to window.open if sidepanel fails
4. Handle errors gracefully with user feedback

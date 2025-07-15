# SidepanelFallback API Usage Guide

## Installation

### NPM (recommended)

```bash
npm install sidepanel-fallback
```

### CDN

```html
<script src="https://unpkg.com/sidepanel-fallback/dist/sidepanel-fallback.umd.js"></script>
```

### Local Build

```bash
git clone https://github.com/touyou/sidepanel-fallback.git
cd sidepanel-fallback
npm install
npm run build
```

## Quick Start

### Basic Usage

```javascript
import { SidepanelFallback } from 'sidepanel-fallback';

// Initialize the fallback system
const fallback = new SidepanelFallback();
await fallback.init();

// Open a panel (will use sidepanel or window based on browser/settings)
const result = await fallback.openPanel('/panel.html');
console.log(result); // { success: true, method: 'sidepanel' }
```

### With Custom Configuration

```javascript
const fallback = new SidepanelFallback({
  defaultMode: 'window', // Force window mode by default
  userAgent: 'custom-ua' // Override user agent detection
});

await fallback.init();
```

## API Reference

### Constructor

```javascript
new SidepanelFallback(options);
```

**Parameters:**

- `options` (Object, optional)
  - `defaultMode` (String): Default mode when no user preference is saved.
    Options: `'auto'`, `'sidepanel'`, `'window'`. Default: `'auto'`
  - `userAgent` (String): Custom user agent string for browser detection.
    Default: `navigator.userAgent`

### Methods

#### `init()`

Initialize the fallback system. Must be called before using other methods.

```javascript
await fallback.init();
```

**Returns:** `Promise<{browser: string, mode: string}>`

- `browser`: Detected browser ('chrome', 'firefox', 'safari', 'edge', 'dia',
  'unknown')
- `mode`: Current mode ('sidepanel', 'window', 'auto')

#### `openPanel(path)`

Open a panel using the configured mode.

```javascript
const result = await fallback.openPanel('/panel.html');
```

**Parameters:**

- `path` (String): Path to the panel HTML file

**Returns:** `Promise<Object>`

- `success` (Boolean): Whether the panel was opened successfully
- `method` (String): Actual method used ('sidepanel' or 'window')
- `fallback` (Boolean): Whether fallback was used (only present if true)
- `error` (String): Error message if success is false

#### `withSettingsUI(container)`

Add a settings UI to the specified container element.

```javascript
const container = document.getElementById('settings-container');
await fallback.withSettingsUI(container);
```

**Parameters:**

- `container` (HTMLElement): Container element for the settings UI

**Returns:** `Promise<{success: boolean, error?: string}>`

#### `getCurrentSettings()`

Get the current configuration.

```javascript
const settings = fallback.getCurrentSettings();
console.log(settings); // { browser: 'chrome', mode: 'sidepanel' }
```

**Returns:** `{browser: string, mode: string} | null`

- Returns `null` if not initialized

## Usage Examples

### Chrome Extension Integration

#### manifest.json (Manifest V3)

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0",
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "panel.html"
  },
  "action": {
    "default_popup": "popup.html"
  }
}
```

#### Background Script

```javascript
import { SidepanelFallback } from './lib/sidepanel-fallback.js';

const fallback = new SidepanelFallback();
await fallback.init();

chrome.action.onClicked.addListener(async tab => {
  const result = await fallback.openPanel('panel.html');
  if (!result.success) {
    console.error('Failed to open panel:', result.error);
  }
});
```

#### Popup with Settings

```html
<!-- popup.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>Extension Settings</title>
    <style>
      .settings-container {
        width: 300px;
        padding: 16px;
      }
    </style>
  </head>
  <body>
    <div class="settings-container">
      <h2>Panel Settings</h2>
      <div id="settings-ui"></div>
    </div>

    <script type="module">
      import { SidepanelFallback } from './lib/sidepanel-fallback.js';

      const fallback = new SidepanelFallback();
      await fallback.init();

      const container = document.getElementById('settings-ui');
      await fallback.withSettingsUI(container);
    </script>
  </body>
</html>
```

### Web Application Integration

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Web App with Panel</title>
  </head>
  <body>
    <button id="open-panel">Open Panel</button>
    <div id="settings"></div>

    <script type="module">
      import { SidepanelFallback } from 'sidepanel-fallback';

      const fallback = new SidepanelFallback();
      await fallback.init();

      // Add settings UI
      const settingsContainer = document.getElementById('settings');
      await fallback.withSettingsUI(settingsContainer);

      // Panel open button
      document
        .getElementById('open-panel')
        .addEventListener('click', async () => {
          const result = await fallback.openPanel('/panel.html');
          if (result.success) {
            console.log(`Panel opened using ${result.method}`);
          } else {
            alert(`Failed to open panel: ${result.error}`);
          }
        });
    </script>
  </body>
</html>
```

## Browser Support

| Browser     | Sidepanel Support | Window Fallback | Auto Mode Default |
| ----------- | ----------------- | --------------- | ----------------- |
| Chrome 114+ | ✅                | ✅              | sidepanel         |
| Edge 114+   | ✅                | ✅              | sidepanel         |
| Dia         | ✅                | ✅              | sidepanel         |
| Firefox     | ❌                | ✅              | window            |
| Safari      | ❌                | ✅              | window            |

## Mode Behavior

### Auto Mode (Recommended)

- **Chrome/Edge/Dia**: Attempts to use sidepanel, falls back to window if
  unavailable
- **Firefox/Safari**: Uses window mode directly
- **Unknown browsers**: Uses window mode

### Sidepanel Mode

- Attempts to use Chrome's sidepanel API
- Falls back to popup window if sidepanel is unavailable
- Works only in Chrome Extension context

### Window Mode

- Always uses `window.open()` to create a popup window
- Works in both extension and web application contexts
- Configurable window dimensions (400x600 by default)

## Error Handling

All methods return result objects with success/error information:

```javascript
const result = await fallback.openPanel('/panel.html');
if (!result.success) {
  switch (result.error) {
    case 'SidepanelFallback not initialized. Call init() first.':
      // Initialize before use
      break;
    case 'Panel path is required':
      // Provide a valid path
      break;
    case 'Failed to open popup window':
      // Popup blocked or other window.open() failure
      break;
  }
}
```

## Development and Testing

### Build from Source

```bash
git clone https://github.com/your-username/sidepanel-fallback.git
cd sidepanel-fallback
npm install
npm test      # Run tests
npm run dev   # Start development server
npm run build # Build for production
```

### Testing

The library includes comprehensive Jest tests:

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

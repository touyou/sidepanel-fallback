# Chrome Extension Example - New Simplified API

This sample demonstrates a Chrome extension implementation using the new
simplified API of the `sidepanel-fallback` library. The new API allows setup
to ## 💫 Benefits of New API

1. **Dramatic Code Reduction**: 80%+ code reduction
2. **Error Resilience**: Automatic error handling
3. **Usability**: Automatic user instructions
4. **Maintainability**: Simple implementation, easy to understand
5. **Extensibility**: Detailed configuration available when neededleted with
   just 3 lines of code.

## 🚀 New Simplified API

Using Chrome extensions has become dramatically easier:

### Before (Legacy API)

```javascript
// Previously required 20+ lines of code...
const fallbackInstance = new SidepanelFallback({...});
await fallbackInstance.init();
chrome.action.onClicked.addListener(async tab => {
  const result = await fallbackInstance.openPanel('sidepanel.html');
  // Complex error handling...
});
// More setup code...
```

### After (New Simplified API)

```javascript
// Setup completed with just 3 lines!
await fallbackInstance.setupExtension({
  sidepanelPath: 'sidepanel.html',
  popupPath: 'popup.html'
});

chrome.action.onClicked.addListener(async tab => {
  await fallbackInstance.handleActionClick(); // All automated!
});
```

## 📁 File Structure

```
chrome-extension/
├── manifest.json               # Chrome extension configuration
├── background.js              # Background script (using new API)
├── sidepanel.html             # Sidepanel display HTML
├── popup.html                 # Fallback popup HTML
├── popup.js                   # Popup script (new API compatible)
├── sidepanel-fallback.umd.js  # Library file
└── README.md                  # This file
```

## 🎯 New API Features

### ✨ setupExtension() - Automatic Setup

- Automatically configures sidepanel and popup paths
- Browser detection and mode selection are automatic
- User instructions are displayed automatically

### ⚡ handleActionClick() - Automatic Processing

- Automatically handles action button clicks
- Automatic sidepanel⇄popup switching
- Error handling and fallback are automatic

### 🔄 toggleMode() - Mode Switching

- Programmatic mode switching
- Automatic setting persistence
- Automatic UI updates

## 🛠️ Implementation Examples

### 1. Background Script (background.js)

```javascript
importScripts('sidepanel-fallback.umd.js');

let fallbackInstance = null;

async function initializeFallback() {
  fallbackInstance = new SidepanelFallback.SidepanelFallback({
    defaultMode: 'auto',
    enablePerformanceTracking: true,
    enableLazyLoading: false, // For Service Worker
    enableProgressiveInit: false // For Service Worker
  });

  await fallbackInstance.init();

  // New API: Configure extension with one line
  await fallbackInstance.setupExtension({
    sidepanelPath: 'sidepanel.html',
    popupPath: 'popup.html',
    showInstruction: true
  });
}

// Initialize when extension starts
chrome.runtime.onStartup.addListener(initializeFallback);
chrome.runtime.onInstalled.addListener(initializeFallback);

// Action click - New API: Process with one line
chrome.action.onClicked.addListener(async tab => {
  if (!fallbackInstance) await initializeFallback();

  // All automated!
  const result = await fallbackInstance.handleActionClick();
  console.log('Panel open result:', result);
});
```

### 2. Popup Script (popup.js)

```javascript
// Mode toggle button
toggleModeBtn.addEventListener('click', async () => {
  // New API: Request mode toggle to background
  const response = await chrome.runtime.sendMessage({
    type: 'TOGGLE_MODE'
  });

  // Update UI
  if (response.success) {
    updateUI(response.mode);
  }
});
```

### 3. Message Handling (background.js)

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'TOGGLE_MODE':
      if (fallbackInstance) {
        // New API: Toggle mode with one line
        fallbackInstance
          .toggleMode()
          .then(result => sendResponse(result))
          .catch(error =>
            sendResponse({ success: false, error: error.message })
          );
      }
      break;
  }
  return true;
});
```

## 🎯 API Comparison

| Feature           | Legacy API         | New Simplified API    |
| ----------------- | ------------------ | --------------------- |
| Basic Setup       | 20+ lines          | 3 lines               |
| Mode Toggle       | Manual impl. req.  | `toggleMode()`        |
| Action Click      | Complex processing | `handleActionClick()` |
| Error Handling    | Manual impl. req.  | Automatic             |
| User Instructions | Manual impl. req.  | Automatic display     |

## 🚀 Installation & Setup

### 1. Load as Chrome Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select this directory (`examples/chrome-extension/`)
5. The extension loads and an icon appears in the toolbar

### 2. Test Functionality

1. Click the extension icon in the toolbar
2. **Chrome**: Sidepanel opens
3. **Other browsers**: Popup window opens
4. **Mode Toggle**: Use the button in the popup to change modes

## ✨ New API Features

### Automatic Browser Detection

- Chrome/Edge: Sidepanel preferred
- Firefox/Safari: Popup mode
- 機能制限時: 自動フォールバック

### ユーザー指示の自動表示

- サイドパネルモード時にユーザー向け説明を自動表示
- Data URLsを使用してHTMLベースの指示を提供

### 設定の永続化

- モード切り替えが自動的に保存
- 拡張機能再起動時に設定復元

## 📋 テストチェックリスト

- [ ] 拡張機能が正常に読み込まれる
- [ ] アイコンクリックでパネル/ポップアップが開く
- [ ] ブラウザ情報が正しく検出・表示される
- [ ] モード切り替えボタンが動作する
- [ ] 設定変更が永続化される
- [ ] パフォーマンス統計が取得できる
- [ ] キャッシュクリア機能が動作する

## � 新API利用のメリット

1. **コード量激減**: 80%以上のコード削減
2. **エラー耐性**: 自動エラーハンドリング
3. **ユーザビリティ**: 自動的なユーザー指示
4. **保守性**: シンプルな実装で理解しやすい
5. **拡張性**: 必要に応じて詳細設定も可能

## 🔧 カスタマイズ例

### Adding Configuration Options

```javascript
await fallbackInstance.setupExtension({
  sidepanelPath: 'custom-sidepanel.html',
  popupPath: 'custom-popup.html',
  showInstruction: true,
  // Custom options
  windowWidth: 500,
  windowHeight: 700
});
```

### Adding Event Listeners

```javascript
fallbackInstance.on('modeChanged', data => {
  console.log(`Mode: ${data.oldMode} → ${data.newMode}`);
});
```

## 🎉 Practical Examples

Using this new API, you can easily create extensions like:

- 📚 Bookmark management tools
- 📝 Note & ToDo management
- 🔐 Password managers
- 🛠️ Developer tools
- 📱 Social media management
- 🎓 Online learning tools

All starting with just 3 lines of basic setup!

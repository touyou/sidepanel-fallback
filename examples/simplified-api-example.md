# Chrome Extension Example with Simplified API

この例は、新しい簡潔なAPIを使用してsidepanel-fallbackをChrome拡張機能で使用する方法を示しています。

## 新しいAPI概要

chrome-extension-switcherで学んだ知見を活かして、以下の簡潔なAPIを追加しました：

- `setupExtension(options)` - 拡張機能の初期設定
- `handleActionClick(mode)` - アクションボタンクリック時の処理
- `toggleMode()` - サイドパネル/ポップアップモードの切り替え

## background.js (簡潔版)

```javascript
import SidepanelFallback from 'sidepanel-fallback';

// インスタンス作成
const sidepanelFallback = new SidepanelFallback({
  defaultMode: 'auto' // 自動検出
});

// 拡張機能設定
sidepanelFallback.setupExtension({
  sidepanelPath: 'sidepanel.html',
  popupPath: 'popup.html',
  showInstruction: true // サイドパネル案内を表示
});

// アクションボタンクリック時の処理
chrome.action.onClicked.addListener(async tab => {
  const result = await sidepanelFallback.handleActionClick();

  if (!result.success) {
    console.error('Failed to handle action click:', result.error);
  } else if (result.userAction) {
    // ユーザーに追加アクションが必要な場合（サイドパネルモード）
    console.log('User action required:', result.userAction);
  }
});

// メッセージハンドリング（設定画面からのモード切り替え）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleMode') {
    sidepanelFallback
      .toggleMode()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 非同期レスポンス
  }
});
```

## 従来の方法との比較

### 従来の方法（chrome-extension-switcher）

```javascript
// 複雑な設定とエラーハンドリングが必要
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
      // 案内ウィンドウを表示...
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
    // エラーハンドリング...
  }
});
```

### 新しいAPI

```javascript
// 簡潔で分かりやすい
chrome.action.onClicked.addListener(async tab => {
  const result = await sidepanelFallback.handleActionClick();
  // エラーハンドリングやフォールバックは自動的に処理される
});
```

## 利点

1. **簡潔性**: 複雑なロジックがライブラリ内に隠蔽される
2. **エラーハンドリング**: 自動的なフォールバック機能
3. **ブラウザ対応**: 古いブラウザでも動作
4. **保守性**: APIが変更されてもライブラリが吸収

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

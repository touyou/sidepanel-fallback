# Chrome Extension Example

この例は、`sidepanel-fallback` ライブラリを実際のChrome Extensionで使用する方法を示しています。

## 📁 ファイル構成

```
chrome-extension/
├── manifest.json           # Chrome Extension設定ファイル
├── background.js           # バックグラウンドサービスワーカー  
├── sidepanel.html          # サイドパネル表示用HTML
├── popup.html              # フォールバック用ポップアップHTML
├── sidepanel-fallback.umd.js # ライブラリファイル（dist/から自動コピー）
└── README.md               # このファイル
```

## 🚀 インストール方法

### 1. Chrome Extensionとして読み込み

1. Chromeブラウザで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このディレクトリ（`examples/chrome-extension/`）を選択
5. 拡張機能が読み込まれ、ツールバーにアイコンが表示される

### 2. 動作確認

1. ツールバーの拡張機能アイコンをクリック
2. Chromeの場合：サイドパネルが開く
3. その他のブラウザ/環境：ポップアップウィンドウが開く

## 🎯 デモ機能

### サイドパネルモード（Chrome/Edge）
- 📱 ブラウザの右側にサイドパネルとして表示
- 🎛️ リアルタイム設定変更
- 📊 パフォーマンス統計表示
- ⚙️ 設定UIコンポーネントのデモ

### ポップアップモード（Firefox/Safari/その他）
- 🪟 独立したポップアップウィンドウとして表示
- ⚠️ フォールバック動作の明示
- 🔄 同じ機能セットをコンパクトなUIで提供

## 🛠️ 実装のポイント

### 1. Service Worker（background.js）
```javascript
// ライブラリの初期化
const fallbackInstance = new SidepanelFallback({
  defaultMode: 'auto',
  enablePerformanceTracking: true
});

await fallbackInstance.init();

// アクションボタンクリック時の処理
chrome.action.onClicked.addListener(async (tab) => {
  const result = await fallbackInstance.openPanel('sidepanel.html');
  // フォールバック処理...
});
```

### 2. サイドパネル/ポップアップ（HTML）
```javascript
// フロントエンドでの初期化
const fallbackInstance = new SidepanelFallback({
  defaultMode: 'auto',
  enableCaching: true
});

await fallbackInstance.init();

// 設定UIの追加
await fallbackInstance.withSettingsUI(container);
```

### 3. Manifest V3対応
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

## 📋 動作確認チェックリスト

- [ ] 拡張機能が正常に読み込まれる
- [ ] アイコンクリック時にパネル/ポップアップが開く
- [ ] ブラウザ情報が正しく検出・表示される
- [ ] 表示モード設定が機能する
- [ ] 設定変更が永続化される
- [ ] パフォーマンス統計が取得できる
- [ ] キャッシュクリア機能が動作する
- [ ] 異なるブラウザでフォールバック動作が確認できる

## 🔧 カスタマイズ例

### 独自の設定オプション追加
```javascript
const fallbackInstance = new SidepanelFallback({
  defaultMode: 'auto',
  enablePerformanceTracking: true,
  enableCaching: true,
  // カスタムオプション
  customOption: 'value'
});
```

### イベントリスナーの追加
```javascript
fallbackInstance.on('modeChanged', (data) => {
  console.log(`モード変更: ${data.oldMode} → ${data.newMode}`);
});

fallbackInstance.on('afterOpenPanel', (data) => {
  console.log('パネル開始:', data);
});
```

## 🐛 トラブルシューティング

### 拡張機能が読み込まれない
- `manifest.json` の書式が正しいか確認
- `background.js` にシンタックスエラーがないか確認
- Chrome DevTools のConsoleでエラーをチェック

### サイドパネルが開かない
- Chrome 114+ を使用しているか確認
- `sidePanel` パーミッションが有効か確認
- バックグラウンドスクリプトのログを確認

### ライブラリのエラー
- `sidepanel-fallback.umd.js` が正しく配置されているか確認
- ネットワークタブでファイルの読み込み状況を確認

## 📚 参考リンク

- [Chrome Extensions Developer Guide](https://developer.chrome.com/docs/extensions/)
- [Side Panel API Documentation](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- [sidepanel-fallback ライブラリ仕様](../../docs/usage.md)

## 🎉 応用例

この例を参考に、以下のような機能を持つ拡張機能を作成できます：

- ブックマーク管理ツール
- メモ・ToDo管理
- パスワードマネージャー
- 開発者ツール
- ソーシャルメディア管理
- オンライン学習ツール

各用途に応じて、UIとロジックをカスタマイズしてください。
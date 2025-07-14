# Sidepanel Fallback Examples

このディレクトリには、`sidepanel-fallback` ライブラリの実用的な使用例が含まれています。

## 📁 利用例

### [Chrome Extension Example](./chrome-extension/)
実際に動作するChrome Extensionの完全な実装例です。サイドパネルとポップアップウィンドウのフォールバック機能、設定UI、パフォーマンス追跡など、ライブラリのすべての機能を実際の拡張機能で体験できます。

**主な特徴：**
- ✅ Manifest V3 対応
- ✅ サイドパネル ↔ ポップアップの自動フォールバック
- ✅ 設定UIコンポーネントの実装例
- ✅ パフォーマンス監視機能
- ✅ 日本語UI対応
- ✅ インストール可能な実用例

## 🚀 クイックスタート

### 1. Chrome Extension Example を試す

```bash
# 1. このリポジトリをクローン（または既にクローン済み）
git clone https://github.com/touyou/sidepanel-fallback.git
cd sidepanel-fallback

# 2. 依存関係をインストールしてビルド
npm install
npm run build

# 3. Chrome Extension として読み込み
# - chrome://extensions/ を開く
# - デベロッパーモードを有効にする
# - 「パッケージ化されていない拡張機能を読み込む」をクリック
# - examples/chrome-extension/ ディレクトリを選択
```

### 2. 動作確認

1. ツールバーに追加された拡張機能アイコンをクリック
2. Chrome/Edgeの場合：サイドパネルが開く
3. Firefox/Safariの場合：ポップアップウィンドウが開く
4. 設定UI、パフォーマンス統計、ブラウザ検出機能を確認

## 📖 詳細ドキュメント

各例には詳細なREADMEファイルが含まれています：

- [Chrome Extension の詳細説明](./chrome-extension/README.md)

## 🔧 カスタマイズ方法

### ライブラリのオプション設定
```javascript
const fallbackInstance = new SidepanelFallback({
  defaultMode: 'auto',          // 'auto' | 'sidepanel' | 'window'
  enablePerformanceTracking: true,
  enableCaching: true,
  enableLazyLoading: true
});
```

### イベントハンドリング
```javascript
// ブラウザ検出時
fallbackInstance.on('browserDetected', (data) => {
  console.log('検出ブラウザ:', data.browser);
});

// モード変更時
fallbackInstance.on('modeChanged', (data) => {
  console.log(`${data.oldMode} → ${data.newMode}`);
});

// パネル開始時
fallbackInstance.on('afterOpenPanel', (data) => {
  console.log('パネル開始:', data.method);
});
```

## 🎯 用途別の実装例

### 1. 基本的なサイドパネル拡張機能
```javascript
// background.js
chrome.action.onClicked.addListener(async (tab) => {
  const result = await fallbackInstance.openPanel('panel.html');
  console.log('パネル開始結果:', result);
});
```

### 2. 設定付きアプリケーション
```javascript
// panel.js
// 設定UIを自動で追加
const settingsContainer = document.getElementById('settings');
await fallbackInstance.withSettingsUI(settingsContainer);
```

### 3. パフォーマンス監視
```javascript
// パフォーマンス統計の取得
const stats = fallbackInstance.getPerformanceStats();
console.log('キャッシュ統計:', stats.browserCache);
console.log('メモリ使用量:', stats.memorySnapshots);
```

## 🆘 トラブルシューティング

### よくある問題

1. **サイドパネルが開かない**
   - Chrome 114+ を使用していることを確認
   - `sidePanel` パーミッションが manifest.json に含まれていることを確認

2. **ライブラリが読み込まれない**
   - `sidepanel-fallback.umd.js` が正しいパスにあることを確認
   - ネットワークタブでファイルの読み込み状況を確認

3. **設定が保存されない**
   - `storage` パーミッションが有効になっていることを確認
   - ブラウザの開発者ツールで localStorage/chrome.storage をチェック

### デバッグ方法

```javascript
// デバッグイベントの監視
fallbackInstance.on('debug', (data) => {
  console.log('デバッグ情報:', data);
});

// エラーイベントの監視
fallbackInstance.on('error', (data) => {
  console.error('エラー発生:', data);
});
```

## 🤝 コントリビューション

新しい例や改善提案は歓迎です！

1. フォークして新しいブランチを作成
2. 例を追加または既存例を改善
3. 適切なドキュメントを追加
4. プルリクエストを送信

## 📄 ライセンス

これらの例はメインライブラリと同じ MIT ライセンスの下で提供されます。
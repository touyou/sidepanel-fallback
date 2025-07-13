# AI協同開発メモ

## panelLauncher.js のfallback設計について
Sidepanel APIが競合等で開けない可能性があるため、失敗時は window.open を使ってフォールバック。
判定が非同期で不確実なため、ユーザー設定で明示的に window モードを選ばせる方式にする方が確実。
Sidepanel API自体の使用条件が変化する可能性があるので、interface は疎結合に保つ。

## 設計思想
- TDD @t_wada 流の Red → Green → Refactor サイクルを厳密に守る
- コードを書く前にテストを書く
- 関数の名前がその仕様になるよう意識
- 実装よりも具体例から始める

## 開発進行メモ
- 最初のターゲット: `browserInfo.js` と `browserInfo.test.js`
- 開発中は常にこのファイルを開いて設計意図を記録
- `npm run dev` (Vite) と `npx jest --watch` でloop確認

## ✅ 完了項目

### 2025/07/13 プロジェクトセットアップ & 最初のTDDサイクル
- [x] npm プロジェクト初期化
- [x] Jest 27（Node.js 16互換）セットアップ
- [x] Vite設定
- [x] ディレクトリ構造作成（src/, test/, public/, docs/）
- [x] TDD Red→Green→Refactor 最初のサイクル完了

### browserInfo.js 完了 ✅
**Red**: テストファイル作成→モジュール存在しない→テスト失敗
**Green**: 最低限の実装で全8テストケース通過
- Chrome, Firefox, Safari, Edge, Dia判定
- 不正な入力（undefined, 空文字）の処理
- Edge vs Chrome判定の順序重要（ChromeのUA含むため）

## 次のステップ
1. `modeStorage.js` & `modeStorage.test.js` （localStorage/chrome.storage対応）
2. `panelLauncher.js` & `panelLauncher.test.js` （メイン処理）
3. `settingsUI.js` & `settingsUI.test.js` （DOM UI）
4. `index.js` （API統合）

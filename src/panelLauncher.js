export class PanelLauncher {
  constructor() {}

  /**
   * パネルを開く（sidepanelまたはwindowモード）
   * @param {string} mode - 'sidepanel' または 'window'
   * @param {string} path - 開くパネルのパス
   * @returns {Promise<{success: boolean, method?: string, fallback?: boolean, error?: string}>}
   */
  async openPanel(mode, path) {
    // モード検証
    if (mode !== 'sidepanel' && mode !== 'window') {
      return {
        success: false,
        error: `Invalid mode: ${mode}. Must be "sidepanel" or "window"`
      };
    }

    // sidepanelモードの場合
    if (mode === 'sidepanel') {
      if (this.isExtensionContext()) {
        try {
          await chrome.sidePanel.open({ path });
          return { success: true, method: 'sidepanel' };
        } catch (error) {
          // エラーの場合はwindowにフォールバック
          return this._openWindow(path, true);
        }
      } else {
        // Extension contextでない場合はwindowにフォールバック
        return this._openWindow(path, true);
      }
    }

    // windowモードの場合
    if (mode === 'window') {
      return this._openWindow(path, false);
    }
  }

  /**
   * Chrome Extension contextでsidePanelが利用可能かチェック
   * @returns {boolean}
   */
  isExtensionContext() {
    return !!(typeof chrome !== 'undefined' && 
              chrome.sidePanel && 
              typeof chrome.sidePanel.open === 'function');
  }

  /**
   * window.openを使ってポップアップを開く
   * @param {string} path - 開くパネルのパス
   * @param {boolean} isFallback - フォールバックかどうか
   * @returns {Promise<{success: boolean, method: string, fallback?: boolean, error?: string}>}
   */
  async _openWindow(path, isFallback) {
    const windowFeatures = 'width=400,height=600,scrollbars=yes,resizable=yes';
    const popup = window.open(path, 'sidepanel_fallback', windowFeatures);
    
    if (popup) {
      popup.focus();
      const result = { success: true, method: 'window' };
      if (isFallback) {
        result.fallback = true;
      }
      return result;
    } else {
      return {
        success: false,
        error: 'Failed to open popup window'
      };
    }
  }
}

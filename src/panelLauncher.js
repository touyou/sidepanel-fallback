export class PanelLauncher {
  constructor() {}

  /**
   * Open a panel (sidepanel or window mode)
   * @param {string} mode - 'sidepanel' or 'window'
   * @param {string} path - Path of the panel to open
   * @returns {Promise<{success: boolean, method?: string, fallback?: boolean, error?: string}>}
   */
  async openPanel(mode, path) {
    // Mode validation
    if (mode !== 'sidepanel' && mode !== 'window') {
      return {
        success: false,
        error: `Invalid mode: ${mode}. Must be "sidepanel" or "window"`
      };
    }

    // sidepanel mode case
    if (mode === 'sidepanel') {
      if (this.isExtensionContext()) {
        try {
          await chrome.sidePanel.open({ path });
          return { success: true, method: 'sidepanel' };
        } catch (_error) {
          // Fallback to window on error
          return this._openWindow(path, true);
        }
      } else {
        // Fallback to window when not in Extension context
        return this._openWindow(path, true);
      }
    }

    // window mode case
    if (mode === 'window') {
      return this._openWindow(path, false);
    }
  }

  /**
   * Check if sidepanel is available in Chrome Extension context
   * @returns {boolean}
   */
  isExtensionContext() {
    return !!(
      typeof chrome !== 'undefined' &&
      chrome.sidePanel &&
      typeof chrome.sidePanel.open === 'function'
    );
  }

  /**
   * window.openを使ってポップアップを開く
   * @param {string} path - 開くパネルのパス
   * @param {boolean} isFallback - Whether this is a fallback operation
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

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
          // Set the sidepanel path if provided
          if (path) {
            await chrome.sidePanel.setOptions({ path });
          }
          await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
          // Open the sidepanel (uses current active tab)
          await chrome.sidePanel.open();
          return { success: true, method: 'sidepanel' };
        } catch (_error) {
          // Fallback to window on error (either setOptions or open failed)
          return this._openWindow(path, true);
        }
      } else {
        // Fallback to window when not in Extension context
        return this._openWindow(path, true);
      }
    }

    // window mode case
    if (mode === 'window') {
      // In Chrome Extension context, disable automatic sidepanel opening on action click
      // so that the background script can handle popup creation
      if (this.isChromeExtensionContext() && typeof chrome.sidePanel?.setPanelBehavior === 'function') {
        try {
          await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
        } catch (_error) {
          // Ignore errors in setting panel behavior - not critical for popup functionality
        }
      }
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
      typeof chrome.sidePanel.open === 'function' &&
      typeof chrome.sidePanel.setOptions === 'function'
    );
  }

  /**
   * Check if we're in Chrome Extension context (even without sidePanel API)
   * @returns {boolean}
   */
  isChromeExtensionContext() {
    return !!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
  }

  /**
   * Open a popup using the appropriate API based on context
   * @param {string} path - Path to the panel to open
   * @param {boolean} isFallback - Whether this is a fallback operation
   * @returns {Promise<{success: boolean, method: string, fallback?: boolean, error?: string}>}
   */
  async _openWindow(path, isFallback) {
    // If we're in Chrome Extension context, use chrome.windows.create
    if (this.isChromeExtensionContext()) {
      try {
        // Resolve relative paths for Chrome Extension context
        const resolvedPath =
          path.startsWith('chrome-extension://') || path.startsWith('http')
            ? path
            : chrome.runtime.getURL(path);

        const _window = await chrome.windows.create({
          url: resolvedPath,
          type: 'popup',
          width: 400,
          height: 600,
          focused: true
        });

        const result = { success: true, method: 'window' };
        if (isFallback) {
          result.fallback = true;
        }
        return result;
      } catch (error) {
        return {
          success: false,
          error: `Failed to open panel: ${error.message}`
        };
      }
    } else {
      // Use window.open for non-extension contexts
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Failed to open panel: window is not defined'
        };
      }

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
}

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

    console.log(`Opening panel in ${mode} mode with path: ${path}`);

    // sidepanel mode case
    if (mode === 'sidepanel') {
      if (this.isExtensionContext()) {
        try {
          // Set the sidepanel path and enable it
          if (path) {
            await chrome.sidePanel.setOptions({ path, enabled: true });
          }

          // Enable automatic sidepanel opening on action click
          await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

          // Don't use sidePanel.open() due to user gesture restrictions
          // Instead, let the user click the sidepanel icon

          return {
            success: true,
            method: 'sidepanel',
            userAction: 'Click the sidepanel icon in browser toolbar'
          };
        } catch (error) {
          console.warn('Failed to setup sidepanel, falling back to window mode:', error);
          // If sidepanel setup fails, automatically fallback to window mode
          return this._openWindow(path, true);
        }
      } else {
        // Not in extension context, fallback to window mode
        return this._openWindow(path, true);
      }
    }

    // window mode case
    if (mode === 'window') {
      // In Chrome Extension context, disable automatic sidepanel opening on action click
      // so that the background script can handle popup creation
      if (
        this.isChromeExtensionContext() &&
        typeof chrome.sidePanel?.setPanelBehavior === 'function'
      ) {
        try {
          await chrome.sidePanel.setOptions({ enabled: false });
          await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
        } catch (_error) {
          // Ignore errors in setting panel behavior - not critical for popup functionality
        }
      }
      return this._openWindow(path, false);
    }
  }

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

  /**
   * Set the panel mode (used by the simplified API)
   * @param {string} mode - 'sidepanel' or 'window'
   * @returns {Promise<{success: boolean, mode: string, error?: string}>}
   */
  async setMode(mode) {
    // Mode validation
    if (mode !== 'sidepanel' && mode !== 'window') {
      return {
        success: false,
        error: `Invalid mode: ${mode}. Must be "sidepanel" or "window"`
      };
    }

    try {
      if (mode === 'sidepanel') {
        // Enable sidepanel mode
        if (this.isChromeExtensionContext() && typeof chrome.sidePanel?.setOptions === 'function') {
          await chrome.sidePanel.setOptions({ enabled: true });
          await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
        }
      } else if (mode === 'window') {
        // Disable sidepanel mode
        if (this.isChromeExtensionContext() && typeof chrome.sidePanel?.setOptions === 'function') {
          await chrome.sidePanel.setOptions({ enabled: false });
          await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
        }
      }

      return {
        success: true,
        mode: mode
      };
    } catch (error) {
      return {
        success: false,
        mode: mode,
        error: error.message
      };
    }
  }
}

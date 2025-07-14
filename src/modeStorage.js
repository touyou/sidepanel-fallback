/**
 * Class to manage display mode settings per browser
 * Uses localStorage or Chrome Extension Storage API
 */
class ModeStorage {
  constructor() {
    this.storagePrefix = 'sidepanel-fallback-mode-';
    this.validModes = ['sidepanel', 'window', 'auto'];
  }

  /**
   * Check if running in Chrome Extension environment
   * @returns {boolean}
   */
  _isExtensionContext() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;
  }

  /**
   * Input validation
   * @param {string} browser Browser name
   * @param {string} mode Mode name
   */
  _validateInputs(browser, mode) {
    if (!browser || typeof browser !== 'string' || browser.trim() === '') {
      throw new Error('Invalid browser name');
    }

    if (!mode || typeof mode !== 'string' || !this.validModes.includes(mode)) {
      throw new Error('Invalid mode');
    }
  }

  /**
   * Generate storage key
   * @param {string} browser Browser name
   * @returns {string}
   */
  _getStorageKey(browser) {
    return this.storagePrefix + browser;
  }

  /**
   * Set browser display mode
   * @param {string} browser Browser name
   * @param {string} mode Display mode ('sidepanel', 'window', 'auto')
   * @returns {Promise<void>}
   */
  async setMode(browser, mode) {
    this._validateInputs(browser, mode);

    const key = this._getStorageKey(browser);

    if (this._isExtensionContext()) {
      // Chrome Extension environment
      return new Promise((resolve, reject) => {
        const data = {};
        data[key] = mode;

        chrome.storage.sync.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    } else {
      // Regular browser environment (using localStorage)
      localStorage.setItem(key, mode);
      return Promise.resolve();
    }
  }

  /**
   * Get the display mode for a browser
   * @param {string} browser Browser name
   * @returns {Promise<string|null>} The configured mode, or null if not set
   */
  async getMode(browser) {
    if (!browser || typeof browser !== 'string' || browser.trim() === '') {
      return null;
    }

    const key = this._getStorageKey(browser);

    if (this._isExtensionContext()) {
      // Chrome Extension environment
      return new Promise(resolve => {
        chrome.storage.sync.get(key, result => {
          resolve(result[key] || null);
        });
      });
    } else {
      // Regular browser environment (using localStorage)
      const value = localStorage.getItem(key);
      return Promise.resolve(value);
    }
  }

  /**
   * Delete all settings
   * @returns {Promise<void>}
   */
  async clear() {
    if (this._isExtensionContext()) {
      return new Promise(resolve => {
        chrome.storage.sync.clear(() => {
          resolve();
        });
      });
    } else {
      // Clear only related keys in localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      return Promise.resolve();
    }
  }
}

export { ModeStorage };

/**
 * ブラウザごとの表示モード設定を管理するクラス
 * localStorage または Chrome Extension Storage API を使用
 */
class ModeStorage {
  constructor() {
    this.storagePrefix = 'sidepanel-fallback-mode-';
    this.validModes = ['sidepanel', 'window', 'auto'];
  }

  /**
   * Chrome Extension環境かどうかを判定
   * @returns {boolean}
   */
  _isExtensionContext() {
    return typeof chrome !== 'undefined' && 
           chrome.storage && 
           chrome.storage.sync;
  }

  /**
   * 入力値のバリデーション
   * @param {string} browser ブラウザ名
   * @param {string} mode モード名
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
   * ストレージキーを生成
   * @param {string} browser ブラウザ名
   * @returns {string}
   */
  _getStorageKey(browser) {
    return this.storagePrefix + browser;
  }

  /**
   * ブラウザの表示モードを設定
   * @param {string} browser ブラウザ名
   * @param {string} mode 表示モード ('sidepanel', 'window', 'auto')
   * @returns {Promise<void>}
   */
  async setMode(browser, mode) {
    this._validateInputs(browser, mode);
    
    const key = this._getStorageKey(browser);

    if (this._isExtensionContext()) {
      // Chrome Extension環境
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
      // 通常のブラウザ環境（localStorage使用）
      localStorage.setItem(key, mode);
      return Promise.resolve();
    }
  }

  /**
   * ブラウザの表示モードを取得
   * @param {string} browser ブラウザ名
   * @returns {Promise<string|null>} 設定されたモード、未設定の場合はnull
   */
  async getMode(browser) {
    if (!browser || typeof browser !== 'string' || browser.trim() === '') {
      return null;
    }

    const key = this._getStorageKey(browser);

    if (this._isExtensionContext()) {
      // Chrome Extension環境
      return new Promise((resolve) => {
        chrome.storage.sync.get(key, (result) => {
          resolve(result[key] || null);
        });
      });
    } else {
      // 通常のブラウザ環境（localStorage使用）
      const value = localStorage.getItem(key);
      return Promise.resolve(value);
    }
  }

  /**
   * 全ての設定を削除
   * @returns {Promise<void>}
   */
  async clear() {
    if (this._isExtensionContext()) {
      return new Promise((resolve) => {
        chrome.storage.sync.clear(() => {
          resolve();
        });
      });
    } else {
      // localStorage内の関連キーのみクリア
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

module.exports = { ModeStorage };

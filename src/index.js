import { getBrowserInfo } from './browserInfo.js';
import { ModeStorage } from './modeStorage.js';
import { PanelLauncher } from './panelLauncher.js';
import { SettingsUI } from './settingsUI.js';

export class SidepanelFallback {
  constructor(options = {}) {
    this.options = {
      defaultMode: 'auto',
      userAgent: null,
      ...options
    };
    
    this.browser = null;
    this.mode = null;
    this.storage = null;
    this.launcher = null;
    this.settingsUI = null;
    this.initialized = false;
  }

  /**
   * SidepanelFallbackを初期化する
   * @returns {Promise<{browser: string, mode: string}>}
   */
  async init() {
    // ブラウザ判定
    const userAgent = this.options.userAgent || navigator.userAgent;
    this.browser = getBrowserInfo(userAgent);
    
    // ストレージとランチャーを初期化
    this.storage = new ModeStorage();
    this.launcher = new PanelLauncher();
    this.settingsUI = new SettingsUI();
    
    // 保存されたモードを取得
    const savedMode = await this.storage.getMode(this.browser);
    this.mode = savedMode || this.options.defaultMode;
    
    this.initialized = true;
    
    return {
      browser: this.browser,
      mode: this.mode
    };
  }

  /**
   * パネルを開く
   * @param {string} path - パネルのパス
   * @returns {Promise<{success: boolean, method?: string, fallback?: boolean, error?: string}>}
   */
  async openPanel(path) {
    if (!this.initialized) {
      return {
        success: false,
        error: 'SidepanelFallback not initialized. Call init() first.'
      };
    }

    if (!path) {
      return {
        success: false,
        error: 'Panel path is required'
      };
    }

    // モードの決定
    let actualMode = this.mode;
    if (this.mode === 'auto') {
      actualMode = this._getAutoMode();
    }

    return await this.launcher.openPanel(actualMode, path);
  }

  /**
   * 設定UIを作成してコンテナに追加する
   * @param {HTMLElement} container - 設定UIを挿入するコンテナ要素
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async withSettingsUI(container) {
    if (!this.initialized) {
      return {
        success: false,
        error: 'SidepanelFallback not initialized. Call init() first.'
      };
    }

    if (!container) {
      return {
        success: false,
        error: 'Container element is required'
      };
    }

    // 設定変更時のコールバック
    const onSettingsChange = async (newSettings) => {
      if (newSettings.mode) {
        await this.storage.setMode(this.browser, newSettings.mode);
        this.mode = newSettings.mode;
      }
    };

    // 設定パネルを作成
    const settingsPanel = this.settingsUI.createSettingsPanel(
      { mode: this.mode },
      onSettingsChange
    );

    // コンテナに追加
    container.appendChild(settingsPanel);

    return { success: true };
  }

  /**
   * 現在の設定を取得する
   * @returns {{browser: string, mode: string} | null}
   */
  getCurrentSettings() {
    if (!this.initialized) {
      return null;
    }

    return {
      browser: this.browser,
      mode: this.mode
    };
  }

  /**
   * autoモードでの実際のモードを決定する
   * @returns {string}
   * @private
   */
  _getAutoMode() {
    // Chrome系ブラウザ（Chrome, Edge, Dia）はsidepanel対応
    if (['chrome', 'edge', 'dia'].includes(this.browser)) {
      return 'sidepanel';
    }
    
    // Firefox, Safari, その他はwindow
    return 'window';
  }
}

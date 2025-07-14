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
   * Initialize SidepanelFallback
   * @returns {Promise<{browser: string, mode: string}>}
   */
  async init() {
    // Browser detection
    const userAgent = this.options.userAgent || navigator.userAgent;
    this.browser = getBrowserInfo(userAgent);

    // Initialize storage and launcher
    this.storage = new ModeStorage();
    this.launcher = new PanelLauncher();
    this.settingsUI = new SettingsUI();

    // Get saved mode
    const savedMode = await this.storage.getMode(this.browser);
    this.mode = savedMode || this.options.defaultMode;

    this.initialized = true;

    return {
      browser: this.browser,
      mode: this.mode
    };
  }

  /**
   * Open a panel
   * @param {string} path - Panel path
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

    // Determine mode
    let actualMode = this.mode;
    if (this.mode === 'auto') {
      actualMode = this._getAutoMode();
    }

    return await this.launcher.openPanel(actualMode, path);
  }

  /**
   * Create settings UI and add it to a container
   * @param {HTMLElement} container - Container element to insert the settings UI
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

    // Callback for settings changes
    const onSettingsChange = async newSettings => {
      if (newSettings.mode) {
        await this.storage.setMode(this.browser, newSettings.mode);
        this.mode = newSettings.mode;
      }
    };

    // Create settings panel
    const settingsPanel = this.settingsUI.createSettingsPanel(
      { mode: this.mode },
      onSettingsChange
    );

    // Add to container
    container.appendChild(settingsPanel);

    return { success: true };
  }

  /**
   * Get current settings
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
   * Determine the actual mode in auto mode
   * @returns {string}
   * @private
   */
  _getAutoMode() {
    // Chrome-based browsers (Chrome, Edge, Dia) support sidepanel
    if (['chrome', 'edge', 'dia'].includes(this.browser)) {
      return 'sidepanel';
    }

    // Firefox, Safari, and others use window
    return 'window';
  }
}

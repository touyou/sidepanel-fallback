import { getBrowserInfo } from './browserInfo.js';
import { ModeStorage } from './modeStorage.js';
import { PanelLauncher } from './panelLauncher.js';
import { SettingsUI } from './settingsUI.js';
import { ErrorCodes, createErrorResult, createSuccessResult } from './errorHandling.js';

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
    try {
      // Browser detection
      const userAgent = this.options.userAgent || navigator.userAgent;
      this.browser = getBrowserInfo(userAgent);

      if (!this.browser) {
        throw new Error('Failed to detect browser from user agent');
      }

      // Initialize storage and launcher
      this.storage = new ModeStorage();
      this.launcher = new PanelLauncher();
      this.settingsUI = new SettingsUI();

      // Get saved mode
      const savedMode = await this.storage.getMode(this.browser);
      this.mode = savedMode || this.options.defaultMode;

      this.initialized = true;

      return createSuccessResult({
        browser: this.browser,
        mode: this.mode
      }, {
        userAgent: userAgent.substring(0, 50) + '...', // Truncated for logging
        defaultMode: this.options.defaultMode
      });
    } catch (error) {
      return createErrorResult(
        ErrorCodes.INIT_FAILED,
        `Initialization failed: ${error.message}`,
        {
          userAgent: this.options.userAgent,
          defaultMode: this.options.defaultMode,
          originalError: error.message
        }
      );
    }
  }

  /**
   * Open a panel
   * @param {string} path - Panel path
   * @returns {Promise<{success: boolean, method?: string, fallback?: boolean, error?: string}>}
   */
  async openPanel(path) {
    if (!this.initialized) {
      return createErrorResult(
        ErrorCodes.NOT_INITIALIZED,
        'SidepanelFallback not initialized. Call init() first.',
        { path }
      );
    }

    if (!path) {
      return createErrorResult(
        ErrorCodes.INVALID_PATH,
        'Panel path is required',
        { providedPath: path }
      );
    }

    // Determine mode
    let actualMode = this.mode;
    if (this.mode === 'auto') {
      actualMode = this._getAutoMode();
    }

    try {
      const result = await this.launcher.openPanel(actualMode, path);
      return createSuccessResult(result, { 
        requestedMode: this.mode,
        effectiveMode: actualMode,
        browser: this.browser
      });
    } catch (error) {
      return createErrorResult(
        ErrorCodes.PANEL_OPEN_FAILED,
        `Failed to open panel: ${error.message}`,
        { 
          path, 
          mode: actualMode, 
          browser: this.browser,
          originalError: error.message
        }
      );
    }
  }

  /**
   * Create settings UI and add it to a container
   * @param {HTMLElement} container - Container element to insert the settings UI
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async withSettingsUI(container) {
    if (!this.initialized) {
      return createErrorResult(
        ErrorCodes.NOT_INITIALIZED,
        'SidepanelFallback not initialized. Call init() first.',
        { container }
      );
    }

    if (!container) {
      return createErrorResult(
        ErrorCodes.INVALID_CONTAINER,
        'Container element is required',
        { providedContainer: container }
      );
    }

    // Callback for settings changes
    const onSettingsChange = async newSettings => {
      if (newSettings.mode) {
        await this.storage.setMode(this.browser, newSettings.mode);
        this.mode = newSettings.mode;
      }
    };

    try {
      // Create settings panel
      const settingsPanel = this.settingsUI.createSettingsPanel(
        { mode: this.mode },
        onSettingsChange
      );

      // Add to container
      container.appendChild(settingsPanel);

      return createSuccessResult({}, { 
        browser: this.browser,
        currentMode: this.mode
      });
    } catch (error) {
      return createErrorResult(
        ErrorCodes.UI_CREATION_FAILED,
        `Failed to create settings UI: ${error.message}`,
        { 
          browser: this.browser,
          mode: this.mode,
          originalError: error.message
        }
      );
    }
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

import { getBrowserInfo } from './browserInfo.js';
import { ModeStorage } from './modeStorage.js';
import { PanelLauncher } from './panelLauncher.js';
import { SettingsUI } from './settingsUI.js';
import { ErrorCodes, createErrorResult, createSuccessResult } from './errorHandling.js';
import { createValidatedConfig } from './configValidation.js';
import { smartNormalize } from './resultNormalizer.js';
import { container } from './diContainer.js';

export class SidepanelFallback {
  constructor(options = {}) {
    // Validate configuration first, but fall back to original behavior for now
    const validationResult = this._validateConfig(options);
    if (!validationResult.success && options.strictValidation) {
      throw new Error(validationResult.error?.message || 'Invalid configuration');
    }

    // Use original options merging for backward compatibility
    this.options = {
      defaultMode: 'auto',
      userAgent: null,
      ...options
    };

    // Dependency injection support (experimental feature flag)
    this._enableDI = options.enableDependencyInjection || false;
    this._container = options.container || container;
    
    // Support for custom implementations (dependency injection)
    this._customStorage = options.storage || null;
    this._customLauncher = options.launcher || null;
    this._customSettingsUI = options.settingsUI || null;
    this._customBrowserDetector = options.browserDetector || null;

    this.browser = null;
    this.mode = null;
    this.storage = null;
    this.launcher = null;
    this.settingsUI = null;
    this.initialized = false;
  }

  /**
   * Validate configuration (internal method)
   * @param {object} config - Configuration to validate
   * @returns {object} Validation result
   * @private
   */
  _validateConfig(config) {
    try {
      return createValidatedConfig(config);
    } catch (error) {
      return createErrorResult(ErrorCodes.VALIDATION_ERROR, 'Configuration validation failed', {
        originalError: error.message
      });
    }
  }

  /**
   * Initialize SidepanelFallback
   * @returns {Promise<{browser: string, mode: string}>}
   */
  async init() {
    try {
      // Get userAgent
      const userAgent = this.options.userAgent || navigator.userAgent;
      
      // Browser detection - use DI only if enabled and custom detector provided
      if (this._customBrowserDetector) {
        this.browser = this._customBrowserDetector.getBrowserInfo(userAgent);
      } else if (this._enableDI) {
        try {
          const browserDetector = this._container.get('browserDetector');
          this.browser = browserDetector.getBrowserInfo(userAgent);
        } catch {
          // Fallback to direct import
          this.browser = getBrowserInfo(userAgent);
        }
      } else {
        // Default behavior for backward compatibility
        this.browser = getBrowserInfo(userAgent);
      }

      if (!this.browser) {
        throw new Error('Failed to detect browser from user agent');
      }

      // Initialize dependencies - use DI only if enabled and custom implementations provided
      if (this._customStorage) {
        this.storage = this._customStorage;
      } else if (this._enableDI) {
        try {
          this.storage = this._container.get('storage');
        } catch {
          this.storage = new ModeStorage();
        }
      } else {
        this.storage = new ModeStorage();
      }

      if (this._customLauncher) {
        this.launcher = this._customLauncher;
      } else if (this._enableDI) {
        try {
          this.launcher = this._container.get('launcher');
        } catch {
          this.launcher = new PanelLauncher();
        }
      } else {
        this.launcher = new PanelLauncher();
      }

      if (this._customSettingsUI) {
        this.settingsUI = this._customSettingsUI;
      } else if (this._enableDI) {
        try {
          this.settingsUI = this._container.get('settingsUI');
        } catch {
          this.settingsUI = new SettingsUI();
        }
      } else {
        this.settingsUI = new SettingsUI();
      }

      // Get saved mode
      const savedMode = await this.storage.getMode(this.browser);
      this.mode = savedMode || this.options.defaultMode;

      this.initialized = true;

      const result = createSuccessResult(
        {
          browser: this.browser,
          mode: this.mode
        },
        {
          userAgent: userAgent.substring(0, 50) + '...', // Truncated for logging
          defaultMode: this.options.defaultMode,
          dependencyInjectionUsed: {
            storage: !!this._customStorage,
            launcher: !!this._customLauncher,
            settingsUI: !!this._customSettingsUI,
            browserDetector: !!this._customBrowserDetector
          }
        }
      );

      // Normalize for backward compatibility
      return smartNormalize(result, 'init');
    } catch (error) {
      const errorResult = createErrorResult(
        ErrorCodes.INIT_FAILED,
        `Initialization failed: ${error.message}`,
        {
          userAgent: this.options.userAgent,
          defaultMode: this.options.defaultMode,
          originalError: error.message
        }
      );

      // For init errors, throw the error for backward compatibility
      throw new Error(errorResult.error);
    }
  }

  /**
   * Open a panel
   * @param {string} path - Panel path
   * @returns {Promise<{success: boolean, method?: string, fallback?: boolean, error?: string}>}
   */
  async openPanel(path) {
    if (!this.initialized) {
      const errorResult = createErrorResult(
        ErrorCodes.NOT_INITIALIZED,
        'SidepanelFallback not initialized. Call init() first.',
        { path }
      );
      return smartNormalize(errorResult, 'openPanel');
    }

    if (!path) {
      const errorResult = createErrorResult(ErrorCodes.INVALID_PATH, 'Panel path is required', {
        providedPath: path
      });
      return smartNormalize(errorResult, 'openPanel');
    }

    // Determine mode
    let actualMode = this.mode;
    if (this.mode === 'auto') {
      actualMode = this._getAutoMode();
    }

    try {
      const result = await this.launcher.openPanel(actualMode, path);
      const successResult = createSuccessResult(result, {
        requestedMode: this.mode,
        effectiveMode: actualMode,
        browser: this.browser
      });
      return smartNormalize(successResult, 'openPanel');
    } catch (error) {
      const errorResult = createErrorResult(
        ErrorCodes.PANEL_OPEN_FAILED,
        `Failed to open panel: ${error.message}`,
        {
          path,
          mode: actualMode,
          browser: this.browser,
          originalError: error.message
        }
      );
      return smartNormalize(errorResult, 'openPanel');
    }
  }

  /**
   * Create settings UI and add it to a container
   * @param {HTMLElement} container - Container element to insert the settings UI
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async withSettingsUI(container) {
    if (!this.initialized) {
      const errorResult = createErrorResult(
        ErrorCodes.NOT_INITIALIZED,
        'SidepanelFallback not initialized. Call init() first.',
        { container }
      );
      return smartNormalize(errorResult, 'settings');
    }

    if (!container) {
      const errorResult = createErrorResult(
        ErrorCodes.INVALID_CONTAINER,
        'Container element is required',
        {
          providedContainer: container
        }
      );
      return smartNormalize(errorResult, 'settings');
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

      const successResult = createSuccessResult(
        {},
        {
          browser: this.browser,
          currentMode: this.mode
        }
      );
      return smartNormalize(successResult, 'settings');
    } catch (error) {
      const errorResult = createErrorResult(
        ErrorCodes.UI_CREATION_FAILED,
        `Failed to create settings UI: ${error.message}`,
        {
          browser: this.browser,
          mode: this.mode,
          originalError: error.message
        }
      );
      return smartNormalize(errorResult, 'settings');
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

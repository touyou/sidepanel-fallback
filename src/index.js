import { getBrowserInfo } from './browserInfo.js';
import { ModeStorage } from './modeStorage.js';
import { PanelLauncher } from './panelLauncher.js';
import { SettingsUI } from './settingsUI.js';
import { ErrorCodes, createErrorResult, createSuccessResult } from './errorHandling.js';
import { createValidatedConfig } from './configValidation.js';
import { smartNormalize } from './resultNormalizer.js';
import { container } from './diContainer.js';
import { EVENTS, createDebugEvent, createErrorEvent } from './eventSystem.js';

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
    this._customEventEmitter = options.eventEmitter || null;

    this.browser = null;
    this.mode = null;
    this.storage = null;
    this.launcher = null;
    this.settingsUI = null;
    this.eventEmitter = null;
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

      // Initialize event emitter
      if (this._customEventEmitter) {
        this.eventEmitter = this._customEventEmitter;
      } else if (this._enableDI) {
        try {
          this.eventEmitter = this._container.get('eventEmitter');
        } catch {
          // Import dynamically to avoid circular dependencies
          const { EventEmitter } = await import('./eventSystem.js');
          this.eventEmitter = new EventEmitter();
        }
      } else {
        // Import dynamically to avoid circular dependencies
        const { EventEmitter } = await import('./eventSystem.js');
        this.eventEmitter = new EventEmitter();
      }

      // Emit initialization start event
      this.eventEmitter.emit(EVENTS.BEFORE_INIT, {
        browser: this.browser,
        userAgent,
        enableDI: this._enableDI
      });

      // Get saved mode
      const savedMode = await this.storage.getMode(this.browser);
      this.mode = savedMode || this.options.defaultMode;

      this.initialized = true;

      // Emit browser detection event
      this.eventEmitter.emit(EVENTS.BROWSER_DETECTED, {
        browser: this.browser,
        userAgent
      });

      // Emit storage read event
      this.eventEmitter.emit(EVENTS.STORAGE_READ, {
        browser: this.browser,
        savedMode,
        finalMode: this.mode
      });

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
            browserDetector: !!this._customBrowserDetector,
            eventEmitter: !!this._customEventEmitter
          }
        }
      );

      // Emit initialization complete event
      this.eventEmitter.emit(EVENTS.AFTER_INIT, {
        browser: this.browser,
        mode: this.mode,
        result
      });

      // Normalize for backward compatibility
      return smartNormalize(result, 'init');
    } catch (error) {
      // Emit initialization error event if eventEmitter is available
      if (this.eventEmitter) {
        this.eventEmitter.emit(EVENTS.INIT_ERROR, createErrorEvent(error, 'init', {
          userAgent: this.options.userAgent,
          defaultMode: this.options.defaultMode
        }));
      }

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

    // Emit before open panel event
    this.eventEmitter.emit(EVENTS.BEFORE_OPEN_PANEL, {
      path,
      mode: this.mode,
      browser: this.browser
    });

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

      // Emit after open panel event
      this.eventEmitter.emit(EVENTS.AFTER_OPEN_PANEL, {
        path,
        mode: actualMode,
        requestedMode: this.mode,
        browser: this.browser,
        result: successResult
      });

      return smartNormalize(successResult, 'openPanel');
    } catch (error) {
      // Emit panel open error event
      this.eventEmitter.emit(EVENTS.PANEL_OPEN_ERROR, createErrorEvent(error, 'openPanel', {
        path,
        mode: actualMode,
        requestedMode: this.mode,
        browser: this.browser
      }));

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
        // Emit before settings change event
        this.eventEmitter.emit(EVENTS.BEFORE_SETTINGS_CHANGE, {
          oldMode: this.mode,
          newMode: newSettings.mode,
          browser: this.browser
        });

        try {
          await this.storage.setMode(this.browser, newSettings.mode);
          
          // Emit storage write event
          this.eventEmitter.emit(EVENTS.STORAGE_WRITE, {
            browser: this.browser,
            mode: newSettings.mode
          });

          const oldMode = this.mode;
          this.mode = newSettings.mode;

          // Emit mode changed event
          this.eventEmitter.emit(EVENTS.MODE_CHANGED, {
            oldMode,
            newMode: this.mode,
            browser: this.browser
          });

          // Emit after settings change event
          this.eventEmitter.emit(EVENTS.AFTER_SETTINGS_CHANGE, {
            oldMode,
            newMode: this.mode,
            browser: this.browser
          });
        } catch (error) {
          // Emit settings error event
          this.eventEmitter.emit(EVENTS.SETTINGS_ERROR, createErrorEvent(error, 'settingsChange', {
            oldMode: this.mode,
            newMode: newSettings.mode,
            browser: this.browser
          }));
          throw error; // Re-throw to maintain existing error handling
        }
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
   * Add an event listener
   * @param {string} eventName - The event name
   * @param {Function} listener - The listener function
   * @returns {Function} Unsubscribe function
   */
  on(eventName, listener) {
    if (!this.eventEmitter) {
      throw new Error('Event system not initialized. Call init() first.');
    }
    return this.eventEmitter.on(eventName, listener);
  }

  /**
   * Add a one-time event listener
   * @param {string} eventName - The event name
   * @param {Function} listener - The listener function
   * @returns {Function} Unsubscribe function
   */
  once(eventName, listener) {
    if (!this.eventEmitter) {
      throw new Error('Event system not initialized. Call init() first.');
    }
    return this.eventEmitter.once(eventName, listener);
  }

  /**
   * Remove an event listener
   * @param {string} eventName - The event name
   * @param {Function} listener - The listener function
   */
  off(eventName, listener) {
    if (!this.eventEmitter) {
      throw new Error('Event system not initialized. Call init() first.');
    }
    this.eventEmitter.off(eventName, listener);
  }

  /**
   * Emit a debug event with context
   * @param {string} operation - The operation being performed
   * @param {Object} context - Additional context data
   */
  debug(operation, context = {}) {
    if (this.eventEmitter) {
      this.eventEmitter.emit(EVENTS.DEBUG, createDebugEvent(operation, {
        ...context,
        browser: this.browser,
        mode: this.mode,
        initialized: this.initialized
      }));
    }
  }

  /**
   * Get available event names
   * @returns {Object} Object containing all available event names
   */
  static get EVENTS() {
    return EVENTS;
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

import { getBrowserInfo } from './browserInfo.js';
import { ModeStorage } from './modeStorage.js';
import { PanelLauncher } from './panelLauncher.js';
import { SettingsUI } from './settingsUI.js';
import { ErrorCodes, createErrorResult, createSuccessResult } from './errorHandling.js';
import { createValidatedConfig } from './configValidation.js';
import { smartNormalize } from './resultNormalizer.js';
import { container } from './diContainer.js';
import { EVENTS, createDebugEvent, createErrorEvent } from './eventSystem.js';
import {
  PerformanceTimer,
  globalLazyLoader,
  ProgressiveInitializer,
  globalMemoryTracker,
  createModuleLoader
} from './performanceUtils.js';
import {
  globalBrowserCache,
  globalUICache,
  createBatchedStorage,
  globalStorageOptimizer
} from './cachingUtils.js';

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

    // Performance options
    this._enablePerformanceTracking = options.enablePerformanceTracking !== false;
    this._enableLazyLoading = options.enableLazyLoading !== false;
    this._enableProgressiveInit = options.enableProgressiveInit !== false;
    this._enableCaching = options.enableCaching !== false;
    this._enableStorageBatching = options.enableStorageBatching !== false;
    this._performanceTimer = null;

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

    // Performance and lazy loading
    this.lazyLoader = globalLazyLoader;
    this.progressiveInitializer = new ProgressiveInitializer();
    this.memoryTracker = globalMemoryTracker;

    // Caching and optimization
    this.browserCache = globalBrowserCache;
    this.uiCache = globalUICache;
    this.storageOptimizer = globalStorageOptimizer;

    // Setup progressive initialization stages
    this._setupProgressiveInitialization();

    // Global instance reference for performance tracking
    if (typeof globalThis !== 'undefined') {
      globalThis.sidepanelFallbackInstance = this;
    }
  }

  /**
   * Setup progressive initialization stages
   * @private
   */
  _setupProgressiveInitialization() {
    if (!this._enableProgressiveInit) {
      return;
    }

    // Stage 1: Core browser detection (highest priority, required)
    this.progressiveInitializer.defineStage(
      'browser-detection',
      async () => {
        const userAgent = this.options.userAgent || navigator.userAgent;

        if (this._customBrowserDetector) {
          this.browser = this._customBrowserDetector.getBrowserInfo(userAgent);
        } else if (this._enableDI) {
          try {
            const browserDetector = this._container.get('browserDetector');
            this.browser = browserDetector.getBrowserInfo(userAgent);
          } catch {
            // Use cached browser detection if enabled
            if (this._enableCaching) {
              this.browser = this.browserCache.get(userAgent, getBrowserInfo);
            } else {
              this.browser = getBrowserInfo(userAgent);
            }
          }
        } else {
          // Use cached browser detection if enabled
          if (this._enableCaching) {
            this.browser = this.browserCache.get(userAgent, getBrowserInfo);
          } else {
            this.browser = getBrowserInfo(userAgent);
          }
        }

        if (!this.browser) {
          throw new Error('Failed to detect browser from user agent');
        }

        return { browser: this.browser };
      },
      { priority: 100, required: true, timeout: 1000 }
    );

    // Stage 2: Event system initialization (high priority, required)
    this.progressiveInitializer.defineStage(
      'event-system',
      async () => {
        if (this._customEventEmitter) {
          this.eventEmitter = this._customEventEmitter;
        } else if (this._enableDI) {
          try {
            this.eventEmitter = this._container.get('eventEmitter');
          } catch {
            if (this._enableLazyLoading) {
              const EventEmitter = await this.lazyLoader.load(
                'event-emitter',
                createModuleLoader('./eventSystem.js')
              );
              this.eventEmitter = new EventEmitter.EventEmitter();
            } else {
              const { EventEmitter } = await import('./eventSystem.js');
              this.eventEmitter = new EventEmitter();
            }
          }
        } else {
          if (this._enableLazyLoading) {
            const EventEmitter = await this.lazyLoader.load(
              'event-emitter',
              createModuleLoader('./eventSystem.js')
            );
            this.eventEmitter = new EventEmitter.EventEmitter();
          } else {
            const { EventEmitter } = await import('./eventSystem.js');
            this.eventEmitter = new EventEmitter();
          }
        }

        return { eventSystem: 'initialized' };
      },
      { priority: 90, required: true, dependencies: ['browser-detection'], timeout: 2000 }
    );

    // Stage 3: Storage initialization (medium priority, required)
    this.progressiveInitializer.defineStage(
      'storage',
      async () => {
        if (this._customStorage) {
          this.storage = this._customStorage;
        } else if (this._enableDI) {
          try {
            this.storage = this._container.get('storage');
          } catch {
            if (this._enableLazyLoading) {
              const ModeStorageModule = await this.lazyLoader.load(
                'mode-storage',
                createModuleLoader('./modeStorage.js')
              );
              this.storage = new ModeStorageModule.ModeStorage();
            } else {
              this.storage = new ModeStorage();
            }
          }
        } else {
          if (this._enableLazyLoading) {
            const ModeStorageModule = await this.lazyLoader.load(
              'mode-storage',
              createModuleLoader('./modeStorage.js')
            );
            this.storage = new ModeStorageModule.ModeStorage();
          } else {
            this.storage = new ModeStorage();
          }
        }

        // Wrap storage with batching if enabled
        if (this._enableStorageBatching && !this._customStorage) {
          this.storage = createBatchedStorage(this.storage, {
            batchSize: 5,
            batchTimeout: 300
          });
        }

        // Get saved mode
        const savedMode = await this.storage.getMode(this.browser);
        this.mode = savedMode || this.options.defaultMode;

        return { mode: this.mode };
      },
      { priority: 80, required: true, dependencies: ['browser-detection'], timeout: 3000 }
    );

    // Stage 4: Panel launcher initialization (medium priority, required)
    this.progressiveInitializer.defineStage(
      'panel-launcher',
      async () => {
        if (this._customLauncher) {
          this.launcher = this._customLauncher;
        } else if (this._enableDI) {
          try {
            this.launcher = this._container.get('launcher');
          } catch {
            if (this._enableLazyLoading) {
              const PanelLauncherModule = await this.lazyLoader.load(
                'panel-launcher',
                createModuleLoader('./panelLauncher.js')
              );
              this.launcher = new PanelLauncherModule.PanelLauncher();
            } else {
              this.launcher = new PanelLauncher();
            }
          }
        } else {
          if (this._enableLazyLoading) {
            const PanelLauncherModule = await this.lazyLoader.load(
              'panel-launcher',
              createModuleLoader('./panelLauncher.js')
            );
            this.launcher = new PanelLauncherModule.PanelLauncher();
          } else {
            this.launcher = new PanelLauncher();
          }
        }

        return { launcher: 'initialized' };
      },
      { priority: 70, required: true, dependencies: ['browser-detection'], timeout: 2000 }
    );

    // Stage 5: Settings UI initialization (low priority, optional)
    this.progressiveInitializer.defineStage(
      'settings-ui',
      async () => {
        if (this._customSettingsUI) {
          this.settingsUI = this._customSettingsUI;
        } else if (this._enableDI) {
          try {
            this.settingsUI = this._container.get('settingsUI');
          } catch {
            if (this._enableLazyLoading) {
              const SettingsUIModule = await this.lazyLoader.load(
                'settings-ui',
                createModuleLoader('./settingsUI.js')
              );
              this.settingsUI = new SettingsUIModule.SettingsUI();
            } else {
              this.settingsUI = new SettingsUI();
            }
          }
        } else {
          if (this._enableLazyLoading) {
            const SettingsUIModule = await this.lazyLoader.load(
              'settings-ui',
              createModuleLoader('./settingsUI.js')
            );
            this.settingsUI = new SettingsUIModule.SettingsUI();
          } else {
            this.settingsUI = new SettingsUI();
          }
        }

        return { settingsUI: 'initialized' };
      },
      { priority: 50, required: false, dependencies: ['browser-detection'], timeout: 3000 }
    );
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
   * @param {Object} [options] - Initialization options
   * @param {Array<string>} [options.stages] - Specific stages to run
   * @param {boolean} [options.skipProgressiveInit] - Skip progressive initialization
   * @returns {Promise<{browser: string, mode: string}>}
   */
  async init(options = {}) {
    try {
      // Start performance tracking
      if (this._enablePerformanceTracking) {
        this._performanceTimer = new PerformanceTimer('initialization');
        this.memoryTracker.snapshot('init-start');
      }

      // Use progressive initialization if enabled and not skipped
      if (this._enableProgressiveInit && !options.skipProgressiveInit) {
        return await this._progressiveInit(options.stages);
      } else {
        return await this._standardInit();
      }
    } catch (error) {
      // Complete performance tracking on error
      if (this._performanceTimer) {
        const perfData = this._performanceTimer.complete({ success: false, error: error.message });
        if (this.eventEmitter) {
          this.eventEmitter.emit('performance', perfData);
        }
      }

      // Emit initialization error event if eventEmitter is available
      if (this.eventEmitter) {
        this.eventEmitter.emit(
          EVENTS.INIT_ERROR,
          createErrorEvent(error, 'init', {
            userAgent: this.options.userAgent,
            defaultMode: this.options.defaultMode
          })
        );
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
   * Progressive initialization implementation
   * @param {Array<string>} [stages] - Specific stages to run
   * @returns {Promise<Object>} Initialization result
   * @private
   */
  async _progressiveInit(stages) {
    if (this._performanceTimer) {
      this._performanceTimer.mark('progressive-init-start');
    }

    const initResult = await this.progressiveInitializer.initialize(stages);

    if (!initResult.success) {
      throw new Error(`Progressive initialization failed: ${initResult.error.message}`);
    }

    this.initialized = true;

    // Emit events after successful initialization
    if (this.eventEmitter) {
      this.eventEmitter.emit(EVENTS.BROWSER_DETECTED, {
        browser: this.browser,
        userAgent: this.options.userAgent || navigator.userAgent
      });

      this.eventEmitter.emit(EVENTS.STORAGE_READ, {
        browser: this.browser,
        savedMode: initResult.results.storage?.mode,
        finalMode: this.mode
      });

      this.eventEmitter.emit(EVENTS.AFTER_INIT, {
        browser: this.browser,
        mode: this.mode,
        progressive: true,
        performance: initResult.performance
      });
    }

    // Complete performance tracking
    if (this._performanceTimer) {
      this._performanceTimer.mark('progressive-init-complete');
      this.memoryTracker.snapshot('init-complete');

      const perfData = this._performanceTimer.complete({
        success: true,
        progressive: true,
        memoryDiff: this.memoryTracker.getDiff('init-start', 'init-complete')
      });

      if (this.eventEmitter) {
        this.eventEmitter.emit('performance', perfData);
      }
    }

    const result = createSuccessResult(
      {
        browser: this.browser,
        mode: this.mode
      },
      {
        userAgent: (this.options.userAgent || navigator.userAgent).substring(0, 50) + '...',
        defaultMode: this.options.defaultMode,
        progressive: true,
        performance: initResult.performance,
        dependencyInjectionUsed: {
          storage: !!this._customStorage,
          launcher: !!this._customLauncher,
          settingsUI: !!this._customSettingsUI,
          browserDetector: !!this._customBrowserDetector,
          eventEmitter: !!this._customEventEmitter
        }
      }
    );

    return smartNormalize(result, 'init');
  }

  /**
   * Standard initialization implementation (backward compatibility)
   * @returns {Promise<Object>} Initialization result
   * @private
   */
  async _standardInit() {
    if (this._performanceTimer) {
      this._performanceTimer.mark('standard-init-start');
    }

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
        // Fallback to cached detection if enabled
        if (this._enableCaching) {
          this.browser = this.browserCache.get(userAgent, getBrowserInfo);
        } else {
          this.browser = getBrowserInfo(userAgent);
        }
      }
    } else {
      // Default behavior with optional caching
      if (this._enableCaching) {
        this.browser = this.browserCache.get(userAgent, getBrowserInfo);
      } else {
        this.browser = getBrowserInfo(userAgent);
      }
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

    // Wrap storage with batching if enabled
    if (this._enableStorageBatching && !this._customStorage) {
      this.storage = createBatchedStorage(this.storage, {
        batchSize: 5,
        batchTimeout: 300
      });
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
        progressive: false,
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
      result,
      progressive: false
    });

    // Complete performance tracking
    if (this._performanceTimer) {
      this._performanceTimer.mark('standard-init-complete');
      this.memoryTracker.snapshot('init-complete');

      const perfData = this._performanceTimer.complete({
        success: true,
        progressive: false,
        memoryDiff: this.memoryTracker.getDiff('init-start', 'init-complete')
      });

      if (this.eventEmitter) {
        this.eventEmitter.emit('performance', perfData);
      }
    }

    // Normalize for backward compatibility
    return smartNormalize(result, 'init');
  }

  /**
   * Open a panel
   * @param {string} path - Panel path
   * @param {Object} [options] - Panel options
   * @returns {Promise<{success: boolean, method?: string, fallback?: boolean, error?: string}>}
   */
  async openPanel(path, options = {}) {
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
      const result = await this.launcher.openPanel(actualMode, path, options);
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
      this.eventEmitter.emit(
        EVENTS.PANEL_OPEN_ERROR,
        createErrorEvent(error, 'openPanel', {
          path,
          mode: actualMode,
          requestedMode: this.mode,
          browser: this.browser
        })
      );

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

    // Ensure settings UI is loaded if using lazy loading
    if (this._enableLazyLoading && !this.settingsUI) {
      try {
        // Try to load from progressive initializer if available
        if (
          this._enableProgressiveInit &&
          !this.progressiveInitializer.isStageCompleted('settings-ui')
        ) {
          await this.progressiveInitializer.initialize(['settings-ui']);
        } else {
          // Fallback to direct lazy loading
          const SettingsUIModule = await this.lazyLoader.load(
            'settings-ui',
            createModuleLoader('./settingsUI.js')
          );
          this.settingsUI = new SettingsUIModule.SettingsUI();
        }
      } catch (error) {
        const errorResult = createErrorResult(
          ErrorCodes.UI_CREATION_FAILED,
          `Failed to load settings UI: ${error.message}`,
          {
            browser: this.browser,
            mode: this.mode,
            originalError: error.message
          }
        );
        return smartNormalize(errorResult, 'settings');
      }
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
          this.eventEmitter.emit(
            EVENTS.SETTINGS_ERROR,
            createErrorEvent(error, 'settingsChange', {
              oldMode: this.mode,
              newMode: newSettings.mode,
              browser: this.browser
            })
          );
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
      this.eventEmitter.emit(
        EVENTS.DEBUG,
        createDebugEvent(operation, {
          ...context,
          browser: this.browser,
          mode: this.mode,
          initialized: this.initialized
        })
      );
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
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    const stats = {
      lazyLoader: this.lazyLoader.getCacheStats(),
      progressiveInitializer: this.progressiveInitializer.getStatus(),
      memorySnapshots: this.memoryTracker.getSnapshots(),
      performanceTracking: this._enablePerformanceTracking,
      lazyLoading: this._enableLazyLoading,
      progressiveInit: this._enableProgressiveInit,
      caching: this._enableCaching,
      storageBatching: this._enableStorageBatching
    };

    // Add caching stats if enabled
    if (this._enableCaching) {
      stats.browserCache = this.browserCache.getStats();
      stats.uiCache = this.uiCache.getStats();
    }

    // Add storage batching detailed stats if enabled and available
    if (this._enableStorageBatching && this.storage && this.storage.getBatchStats) {
      stats.storageBatchingDetails = this.storage.getBatchStats();
    }

    // Add storage optimization recommendations
    if (this.storageOptimizer) {
      stats.storageOptimization = this.storageOptimizer.getRecommendations();
    }

    return stats;
  }

  /**
   * Preload components for better performance
   * @param {Array<string>} [components] - Specific components to preload
   * @returns {Promise<void>}
   */
  async preloadComponents(components = ['panel-launcher', 'settings-ui']) {
    if (!this._enableLazyLoading) {
      return; // Nothing to preload if lazy loading is disabled
    }

    const preloadList = components
      .map(component => {
        let loader;
        switch (component) {
          case 'panel-launcher':
            loader = createModuleLoader('./panelLauncher.js');
            break;
          case 'settings-ui':
            loader = createModuleLoader('./settingsUI.js');
            break;
          case 'mode-storage':
            loader = createModuleLoader('./modeStorage.js');
            break;
          case 'event-emitter':
            loader = createModuleLoader('./eventSystem.js');
            break;
          default:
            return null;
        }

        return { key: component, loader };
      })
      .filter(Boolean);

    await this.lazyLoader.preload(preloadList);

    // Emit preload complete event
    if (this.eventEmitter) {
      this.eventEmitter.emit('performance', {
        operation: 'preload-complete',
        components: components,
        cacheStats: this.lazyLoader.getCacheStats()
      });
    }
  }

  /**
   * Clear performance caches
   * @param {string} [cacheType] - Specific cache to clear ('lazy', 'memory', 'browser', 'ui', 'all')
   */
  clearPerformanceCaches(cacheType = 'all') {
    switch (cacheType) {
      case 'lazy':
        this.lazyLoader.clearCache();
        break;
      case 'memory':
        this.memoryTracker.snapshots.length = 0;
        break;
      case 'browser':
        if (this._enableCaching) {
          this.browserCache.clear();
        }
        break;
      case 'ui':
        if (this._enableCaching) {
          this.uiCache.clear();
        }
        break;
      case 'all':
        this.lazyLoader.clearCache();
        this.memoryTracker.snapshots.length = 0;
        if (this._enableCaching) {
          this.browserCache.clear();
          this.uiCache.clear();
        }
        break;
    }

    if (this.eventEmitter) {
      this.eventEmitter.emit('performance', {
        operation: 'cache-cleared',
        cacheType
      });
    }
  }

  /**
   * Optimize storage performance
   * @returns {Promise<object>} Optimization recommendations
   */
  async optimizeStorage() {
    if (!this._enableStorageBatching || !this.storage || !this.storage.flush) {
      return { message: 'Storage batching not enabled or not supported' };
    }

    // Flush any pending operations
    await this.storage.flush();

    // Get optimization recommendations
    const recommendations = this.storageOptimizer.getRecommendations();

    if (this.eventEmitter) {
      this.eventEmitter.emit('performance', {
        operation: 'storage-optimized',
        recommendations
      });
    }

    return recommendations;
  }

  /**
   * Cleanup expired UI cache entries
   */
  cleanupUICache() {
    if (this._enableCaching && this.uiCache) {
      this.uiCache.cleanup();

      if (this.eventEmitter) {
        this.eventEmitter.emit('performance', {
          operation: 'ui-cache-cleaned',
          stats: this.uiCache.getStats()
        });
      }
    }
  }

  /**
   * Get auto mode based on browser
   * @returns {string} The appropriate mode for the detected browser
   * @private
   */
  _getAutoMode() {
    if (!this.browser) {
      // Fallback to window mode if browser not detected
      return 'window';
    }

    // Chrome and Edge prefer sidepanel mode
    if (this.browser === 'chrome' || this.browser === 'edge') {
      return 'sidepanel';
    }

    // Firefox, Safari, and unknown browsers prefer window mode
    return 'window';
  }

  /**
   * Chrome Extension convenience methods
   * Simplified API for common Chrome Extension use cases
   */

  /**
   * Setup Chrome Extension with automatic mode switching
   * @param {Object} options - Configuration options
   * @param {string} options.sidepanelPath - Path to sidepanel HTML
   * @param {string} options.popupPath - Path to popup HTML
   * @returns {Promise<{success: boolean, mode: string, error?: string}>}
   */
  async setupExtension(options = {}) {
    const { sidepanelPath, popupPath } = options;

    if (!sidepanelPath && !popupPath) {
      return {
        success: false,
        error: 'Either sidepanelPath or popupPath must be provided'
      };
    }

    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.init();
      }

      // Store configuration for later use
      this._extensionConfig = {
        sidepanelPath,
        popupPath
      };

      return {
        success: true,
        mode: this.mode
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle Chrome Extension action click
   * Automatically chooses between sidepanel and popup based on current mode
   * @param {string} [mode] - Force specific mode ('sidepanel' or 'popup')
   * @returns {Promise<{success: boolean, method: string, userAction?: string, error?: string}>}
   */
  async handleActionClick(mode = null) {
    if (!this._extensionConfig) {
      return {
        success: false,
        error: 'Extension not configured. Call setupExtension() first.'
      };
    }

    try {
      const targetMode = mode || (this.mode === 'auto' ? this._getAutoMode() : this.mode);

      if (targetMode === 'sidepanel' && this._extensionConfig.sidepanelPath) {
        const result = await this.launcher.openPanel(
          'sidepanel',
          this._extensionConfig.sidepanelPath
        );
        return result;
      } else if (this._extensionConfig.popupPath) {
        const result = await this.launcher.openPanel('window', this._extensionConfig.popupPath);
        return result;
      } else {
        return {
          success: false,
          error: `No ${targetMode} path configured`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Toggle between sidepanel and popup modes
   * @returns {Promise<{success: boolean, mode: string, oldMode: string, error?: string}>}
   */
  async toggleMode() {
    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.init();
      }

      const currentMode = this.mode === 'auto' ? this._getAutoMode() : this.mode;
      const newMode = currentMode === 'sidepanel' ? 'window' : 'sidepanel';

      // Use the launcher's setMode method
      const result = await this.launcher.setMode(newMode);

      if (result.success) {
        // Update the internal mode
        this.mode = newMode;

        // Store the new mode using storage
        if (this.storage) {
          await this.storage.setMode(this.browser, newMode);
        }

        // Emit mode change event
        if (this.eventEmitter) {
          this.eventEmitter.emit('modeChanged', {
            oldMode: currentMode,
            newMode: newMode
          });
        }

        return {
          success: true,
          mode: newMode,
          oldMode: currentMode
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to set mode'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get cache recommendations based on usage patterns
   * @returns {object} Cache recommendations
   */
  getCacheRecommendations() {
    const recommendations = [];

    if (this._enableCaching) {
      const browserStats = this.browserCache.getStats();
      const uiStats = this.uiCache.getStats();

      if (browserStats.hitRate < 0.8 && browserStats.misses > 10) {
        recommendations.push({
          type: 'browser-cache',
          priority: 'medium',
          description: 'Low browser cache hit rate, consider increasing cache size',
          currentHitRate: browserStats.hitRate
        });
      }

      if (uiStats.evictions > uiStats.hits * 0.1) {
        recommendations.push({
          type: 'ui-cache',
          priority: 'medium',
          description: 'High UI cache eviction rate, consider increasing cache size or age',
          evictionRate: uiStats.evictions / (uiStats.hits + uiStats.misses)
        });
      }
    }

    return { recommendations, timestamp: Date.now() };
  }
}

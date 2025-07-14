/**
 * Performance monitoring and lazy loading utilities
 */

/**
 * Performance timer for measuring operation durations
 */
export class PerformanceTimer {
  constructor(operation) {
    this.operation = operation;
    this.startTime = performance.now();
    this.marks = new Map();
  }

  /**
   * Add a performance mark
   * @param {string} name - Mark name
   * @param {Object} context - Additional context
   */
  mark(name, context = {}) {
    const timestamp = performance.now();
    this.marks.set(name, {
      timestamp,
      duration: timestamp - this.startTime,
      context
    });
  }

  /**
   * Complete the timer and return performance data
   * @param {Object} context - Additional context
   * @returns {Object} Performance data
   */
  complete(context = {}) {
    const endTime = performance.now();
    const totalDuration = endTime - this.startTime;

    return {
      operation: this.operation,
      totalDuration,
      startTime: this.startTime,
      endTime,
      marks: Object.fromEntries(this.marks),
      context
    };
  }
}

/**
 * Lazy loader for UI components and modules
 */
export class LazyLoader {
  constructor() {
    this._cache = new Map();
    this._loading = new Map();
  }

  /**
   * Lazy load a module or component
   * @param {string} key - Unique key for the component
   * @param {Function} loader - Function that returns a Promise resolving to the component
   * @returns {Promise} Promise resolving to the loaded component
   */
  async load(key, loader) {
    // Return cached version if available
    if (this._cache.has(key)) {
      return this._cache.get(key);
    }

    // Return ongoing loading promise if already loading
    if (this._loading.has(key)) {
      return this._loading.get(key);
    }

    // Start loading
    const loadingPromise = this._loadWithPerformanceTracking(key, loader);
    this._loading.set(key, loadingPromise);

    try {
      const result = await loadingPromise;
      this._cache.set(key, result);
      this._loading.delete(key);
      return result;
    } catch (error) {
      this._loading.delete(key);
      throw error;
    }
  }

  /**
   * Load with performance tracking
   * @param {string} key - Component key
   * @param {Function} loader - Loader function
   * @returns {Promise} Loading promise
   * @private
   */
  async _loadWithPerformanceTracking(key, loader) {
    const timer = new PerformanceTimer(`lazy-load-${key}`);

    try {
      timer.mark('load-start');
      const result = await loader();
      timer.mark('load-complete');

      // Emit performance event if available
      if (typeof globalThis !== 'undefined' && globalThis.sidepanelFallbackInstance) {
        const instance = globalThis.sidepanelFallbackInstance;
        if (instance.eventEmitter) {
          instance.eventEmitter.emit(
            'performance',
            timer.complete({
              type: 'lazy-load',
              key,
              success: true
            })
          );
        }
      }

      return result;
    } catch (error) {
      timer.mark('load-error');

      // Emit performance error event if available
      if (typeof globalThis !== 'undefined' && globalThis.sidepanelFallbackInstance) {
        const instance = globalThis.sidepanelFallbackInstance;
        if (instance.eventEmitter) {
          instance.eventEmitter.emit(
            'performance',
            timer.complete({
              type: 'lazy-load',
              key,
              success: false,
              error: error.message
            })
          );
        }
      }

      throw error;
    }
  }

  /**
   * Preload components in the background
   * @param {Array<{key: string, loader: Function}>} components - Components to preload
   */
  async preload(components) {
    const preloadPromises = components.map(({ key, loader }) => {
      return this.load(key, loader).catch(error => {
        // Log preload errors but don't fail the batch
        // eslint-disable-next-line no-console
        console.warn(`Failed to preload component ${key}:`, error);
        return null;
      });
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Clear cache for a specific component or all components
   * @param {string} [key] - Component key (optional)
   */
  clearCache(key) {
    if (key) {
      this._cache.delete(key);
    } else {
      this._cache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      cached: this._cache.size,
      loading: this._loading.size,
      keys: Array.from(this._cache.keys())
    };
  }
}

/**
 * Progressive initialization manager
 */
export class ProgressiveInitializer {
  constructor() {
    this.stages = new Map();
    this.completedStages = new Set();
    this.currentStage = null;
  }

  /**
   * Define an initialization stage
   * @param {string} name - Stage name
   * @param {Function} initializer - Initialization function
   * @param {Object} options - Stage options
   */
  defineStage(name, initializer, options = {}) {
    this.stages.set(name, {
      name,
      initializer,
      dependencies: options.dependencies || [],
      priority: options.priority || 0,
      required: options.required !== false,
      timeout: options.timeout || 5000
    });
  }

  /**
   * Run initialization stages
   * @param {Array<string>} [stageNames] - Specific stages to run (optional)
   * @returns {Promise<Object>} Initialization results
   */
  async initialize(stageNames) {
    const timer = new PerformanceTimer('progressive-initialization');
    const results = {};
    const errors = {};

    try {
      const stagesToRun = stageNames
        ? stageNames.map(name => this.stages.get(name)).filter(Boolean)
        : this._getSortedStages();

      timer.mark('stages-start', { count: stagesToRun.length });

      for (const stage of stagesToRun) {
        if (this.completedStages.has(stage.name)) {
          continue; // Skip already completed stages
        }

        try {
          this.currentStage = stage.name;
          timer.mark(`stage-${stage.name}-start`);

          // Check dependencies
          for (const dep of stage.dependencies) {
            if (!this.completedStages.has(dep)) {
              throw new Error(`Dependency ${dep} not completed for stage ${stage.name}`);
            }
          }

          // Run stage with timeout
          const result = await this._runStageWithTimeout(stage);
          results[stage.name] = result;
          this.completedStages.add(stage.name);

          timer.mark(`stage-${stage.name}-complete`);
        } catch (error) {
          timer.mark(`stage-${stage.name}-error`);
          errors[stage.name] = error;

          if (stage.required) {
            throw new Error(`Required stage ${stage.name} failed: ${error.message}`);
          }

          // Log non-required stage errors but continue
          // eslint-disable-next-line no-console
          console.warn(`Optional stage ${stage.name} failed:`, error);
        }
      }

      this.currentStage = null;
      timer.mark('stages-complete');

      return {
        success: true,
        results,
        errors,
        performance: timer.complete({
          completedStages: Array.from(this.completedStages),
          totalStages: stagesToRun.length
        })
      };
    } catch (error) {
      this.currentStage = null;
      timer.mark('initialization-error');

      return {
        success: false,
        error,
        results,
        errors,
        performance: timer.complete({
          completedStages: Array.from(this.completedStages),
          failedAt: this.currentStage
        })
      };
    }
  }

  /**
   * Run a stage with timeout
   * @param {Object} stage - Stage configuration
   * @returns {Promise} Stage result
   * @private
   */
  async _runStageWithTimeout(stage) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Stage ${stage.name} timed out after ${stage.timeout}ms`));
      }, stage.timeout);

      Promise.resolve(stage.initializer())
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Get stages sorted by priority and dependencies
   * @returns {Array} Sorted stages
   * @private
   */
  _getSortedStages() {
    const stages = Array.from(this.stages.values());

    // Simple topological sort by dependencies, then by priority
    return stages.sort((a, b) => {
      // Dependencies first
      if (a.dependencies.includes(b.name)) return 1;
      if (b.dependencies.includes(a.name)) return -1;

      // Then by priority (higher priority first)
      return b.priority - a.priority;
    });
  }

  /**
   * Check if a stage is completed
   * @param {string} stageName - Stage name
   * @returns {boolean} Whether the stage is completed
   */
  isStageCompleted(stageName) {
    return this.completedStages.has(stageName);
  }

  /**
   * Get initialization status
   * @returns {Object} Initialization status
   */
  getStatus() {
    return {
      currentStage: this.currentStage,
      completedStages: Array.from(this.completedStages),
      totalStages: this.stages.size,
      isComplete: this.completedStages.size === this.stages.size
    };
  }
}

/**
 * Global lazy loader instance
 */
export const globalLazyLoader = new LazyLoader();

/**
 * Create a performance-aware module loader
 * @param {string} modulePath - Path to the module
 * @returns {Function} Loader function
 */
export function createModuleLoader(modulePath) {
  return async () => {
    const module = await import(modulePath);
    return module.default || module;
  };
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  constructor() {
    this.snapshots = [];
    this.isSupported = 'memory' in performance;
  }

  /**
   * Take a memory snapshot
   * @param {string} label - Snapshot label
   * @returns {Object|null} Memory snapshot or null if not supported
   */
  snapshot(label = 'default') {
    if (!this.isSupported) {
      return null;
    }

    const snapshot = {
      label,
      timestamp: Date.now(),
      memory: {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    };

    this.snapshots.push(snapshot);

    // Keep only last 50 snapshots
    if (this.snapshots.length > 50) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Get memory usage diff between snapshots
   * @param {string} startLabel - Start snapshot label
   * @param {string} endLabel - End snapshot label
   * @returns {Object|null} Memory diff or null if snapshots not found
   */
  getDiff(startLabel, endLabel) {
    const start = this.snapshots.find(s => s.label === startLabel);
    const end = this.snapshots.find(s => s.label === endLabel);

    if (!start || !end) {
      return null;
    }

    return {
      duration: end.timestamp - start.timestamp,
      memoryDiff: {
        used: end.memory.used - start.memory.used,
        total: end.memory.total - start.memory.total
      },
      start,
      end
    };
  }

  /**
   * Get all snapshots
   * @returns {Array} Memory snapshots
   */
  getSnapshots() {
    return [...this.snapshots];
  }
}

/**
 * Global memory tracker instance
 */
export const globalMemoryTracker = new MemoryTracker();

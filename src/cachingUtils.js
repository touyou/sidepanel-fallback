/**
 * Caching and Storage Optimization Utilities
 * Phase 4.2: Advanced caching, browser detection caching, storage batching
 */

/**
 * Browser Detection Cache
 * Caches browser detection results to avoid redundant User Agent parsing
 */
export class BrowserDetectionCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cached browser info or compute and cache it
   * @param {string} userAgent - User agent string
   * @param {Function} detector - Browser detection function
   * @returns {string} Browser name
   */
  get(userAgent, detector) {
    const key = this._hashUserAgent(userAgent);

    if (this.cache.has(key)) {
      this.hits++;
      const cached = this.cache.get(key);
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached.browser;
    }

    this.misses++;
    const browser = detector(userAgent);
    this.set(key, { browser, timestamp: Date.now() });
    return browser;
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {object} value - Cache value
   */
  set(key, value) {
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0
    };
  }

  /**
   * Hash user agent for consistent keys
   * @param {string} userAgent - User agent string
   * @returns {string} Hash key
   * @private
   */
  _hashUserAgent(userAgent) {
    // Simple hash for consistent keys
    let hash = 0;
    for (let i = 0; i < userAgent.length; i++) {
      const char = userAgent.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

/**
 * Batched Storage Manager
 * Batches storage operations to reduce I/O overhead
 */
export class BatchedStorage {
  constructor(storage, options = {}) {
    this.storage = storage;
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 500; // ms
    this.pendingOperations = new Map();
    this.batchTimer = null;
    this.stats = {
      operations: 0,
      batches: 0,
      batchSizes: []
    };
  }

  /**
   * Get value from storage (immediate)
   * @param {string} key - Storage key
   * @returns {Promise<any>} Storage value
   */
  async get(key) {
    // Check pending operations first
    if (this.pendingOperations.has(key)) {
      const pending = this.pendingOperations.get(key);
      if (pending.type === 'set') {
        return pending.value;
      }
      if (pending.type === 'remove') {
        return null;
      }
    }

    return await this.storage.get(key);
  }

  /**
   * Get mode for specific browser (ModeStorage compatibility)
   * @param {string} browser - Browser name
   * @returns {Promise<string|null>} Saved mode
   */
  async getMode(browser) {
    if (this.storage.getMode) {
      return await this.storage.getMode(browser);
    }

    // Fallback to generic get method
    return await this.get(`mode_${browser}`);
  }

  /**
   * Set mode for specific browser (ModeStorage compatibility)
   * @param {string} browser - Browser name
   * @param {string} mode - Mode to save
   * @returns {Promise<void>}
   */
  async setMode(browser, mode) {
    if (this.storage.setMode) {
      // If underlying storage has setMode, delegate to it
      return await this.storage.setMode(browser, mode);
    }

    // Fallback to generic set method
    return await this.set(`mode_${browser}`, mode);
  }

  /**
   * Clear all storage (ModeStorage compatibility)
   * @returns {Promise<void>}
   */
  async clear() {
    // Flush any pending operations first
    await this.flush();

    if (this.storage.clear) {
      return await this.storage.clear();
    }

    // No fallback for clear without keys
    throw new Error('Clear operation not supported by underlying storage');
  }

  /**
   * Set value in storage (batched)
   * @param {string} key - Storage key
   * @param {any} value - Storage value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    this.pendingOperations.set(key, {
      type: 'set',
      key,
      value,
      timestamp: Date.now()
    });

    this.stats.operations++;
    this._scheduleBatch();

    // Return immediately for batched operation
    return Promise.resolve();
  }

  /**
   * Remove value from storage (batched)
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async remove(key) {
    this.pendingOperations.set(key, {
      type: 'remove',
      key,
      timestamp: Date.now()
    });

    this.stats.operations++;
    this._scheduleBatch();

    return Promise.resolve();
  }

  /**
   * Force flush all pending operations
   * @returns {Promise<void>}
   */
  async flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    return await this._executeBatch();
  }

  /**
   * Get batch statistics
   * @returns {object} Batch stats
   */
  getBatchStats() {
    const avgBatchSize =
      this.stats.batchSizes.length > 0
        ? this.stats.batchSizes.reduce((a, b) => a + b, 0) / this.stats.batchSizes.length
        : 0;

    return {
      totalOperations: this.stats.operations,
      totalBatches: this.stats.batches,
      averageBatchSize: Math.round(avgBatchSize * 100) / 100,
      pendingOperations: this.pendingOperations.size,
      batchEfficiency: this.stats.operations > 0 ? this.stats.batches / this.stats.operations : 0
    };
  }

  /**
   * Schedule batch execution
   * @private
   */
  _scheduleBatch() {
    // Execute immediately if batch size reached
    if (this.pendingOperations.size >= this.batchSize) {
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
      this._executeBatch();
      return;
    }

    // Schedule batch execution if not already scheduled
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.batchTimer = null;
        this._executeBatch();
      }, this.batchTimeout);
    }
  }

  /**
   * Execute pending batch operations
   * @private
   */
  async _executeBatch() {
    if (this.pendingOperations.size === 0) {
      return;
    }

    const operations = Array.from(this.pendingOperations.values());
    this.pendingOperations.clear();

    this.stats.batches++;
    this.stats.batchSizes.push(operations.length);

    // Keep only last 100 batch sizes for average calculation
    if (this.stats.batchSizes.length > 100) {
      this.stats.batchSizes.shift();
    }

    // Group operations by type for efficiency
    const sets = operations.filter(op => op.type === 'set');
    const removes = operations.filter(op => op.type === 'remove');

    try {
      // Execute batch sets
      if (sets.length > 0) {
        const setData = {};
        sets.forEach(op => {
          setData[op.key] = op.value;
        });

        if (this.storage.setBatch) {
          await this.storage.setBatch(setData);
        } else {
          // Fallback to individual operations
          await Promise.all(sets.map(op => this.storage.set(op.key, op.value)));
        }
      }

      // Execute batch removes
      if (removes.length > 0) {
        if (this.storage.removeBatch) {
          await this.storage.removeBatch(removes.map(op => op.key));
        } else {
          // Fallback to individual operations
          await Promise.all(removes.map(op => this.storage.remove(op.key)));
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Batch storage operation failed:', error);
      throw error;
    }
  }
}

/**
 * UI Component Cache
 * Caches UI components and their rendered state
 */
export class UIComponentCache {
  constructor(maxComponents = 50, maxAge = 300000) {
    // 5 minutes default
    this.cache = new Map();
    this.maxComponents = maxComponents;
    this.maxAge = maxAge;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  /**
   * Get cached component
   * @param {string} key - Component key
   * @returns {object|null} Cached component or null
   */
  get(key) {
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, cached);

    return cached.component;
  }

  /**
   * Set cached component
   * @param {string} key - Component key
   * @param {object} component - Component to cache
   * @param {object} metadata - Additional metadata
   */
  set(key, component, metadata = {}) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxComponents) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }

    this.cache.set(key, {
      component,
      timestamp: Date.now(),
      metadata
    });
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now();
    const toDelete = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.maxAge) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxComponents,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }
}

/**
 * Global cache instances
 */
export const globalBrowserCache = new BrowserDetectionCache(50);
export const globalUICache = new UIComponentCache(30, 600000); // 10 minutes

/**
 * Create a batched storage wrapper
 * @param {object} storage - Storage implementation
 * @param {object} options - Batching options
 * @returns {BatchedStorage} Batched storage instance
 */
export function createBatchedStorage(storage, options = {}) {
  return new BatchedStorage(storage, options);
}

/**
 * Storage operation optimizer
 * Analyzes storage patterns and suggests optimizations
 */
export class StorageOptimizer {
  constructor() {
    this.operations = [];
    this.patterns = {
      frequentKeys: new Map(),
      operationTypes: new Map(),
      timingPatterns: []
    };
  }

  /**
   * Record a storage operation
   * @param {string} type - Operation type ('get', 'set', 'remove')
   * @param {string} key - Storage key
   * @param {number} duration - Operation duration in ms
   */
  recordOperation(type, key, duration) {
    const operation = {
      type,
      key,
      duration,
      timestamp: Date.now()
    };

    this.operations.push(operation);

    // Keep only last 1000 operations
    if (this.operations.length > 1000) {
      this.operations.shift();
    }

    this._updatePatterns(operation);
  }

  /**
   * Get optimization recommendations
   * @returns {object} Optimization recommendations
   */
  getRecommendations() {
    const recommendations = [];

    // Analyze frequent keys
    const frequentKeys = Array.from(this.patterns.frequentKeys.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (frequentKeys.length > 0) {
      recommendations.push({
        type: 'caching',
        priority: 'high',
        description: 'Consider caching frequently accessed keys',
        keys: frequentKeys.map(([key]) => key)
      });
    }

    // Analyze operation patterns
    const writeOps = this.patterns.operationTypes.get('set') || 0;
    const readOps = this.patterns.operationTypes.get('get') || 0;

    if (writeOps > readOps * 0.5) {
      recommendations.push({
        type: 'batching',
        priority: 'medium',
        description: 'High write volume detected, consider batched storage',
        writeRatio: writeOps / (readOps + writeOps)
      });
    }

    // Analyze timing patterns
    const avgDuration =
      this.operations.length > 0
        ? this.operations.reduce((sum, op) => sum + op.duration, 0) / this.operations.length
        : 0;

    if (avgDuration > 10) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        description: 'Slow storage operations detected',
        averageDuration: avgDuration
      });
    }

    return {
      recommendations,
      stats: this.getStats()
    };
  }

  /**
   * Get operation statistics
   * @returns {object} Operation stats
   */
  getStats() {
    const total = this.operations.length;
    const byType = Array.from(this.patterns.operationTypes.entries());
    const avgDuration =
      total > 0 ? this.operations.reduce((sum, op) => sum + op.duration, 0) / total : 0;

    return {
      totalOperations: total,
      operationsByType: Object.fromEntries(byType),
      averageDuration: Math.round(avgDuration * 100) / 100,
      frequentKeysCount: this.patterns.frequentKeys.size
    };
  }

  /**
   * Update internal patterns
   * @param {object} operation - Operation details
   * @private
   */
  _updatePatterns(operation) {
    // Update frequent keys
    const currentCount = this.patterns.frequentKeys.get(operation.key) || 0;
    this.patterns.frequentKeys.set(operation.key, currentCount + 1);

    // Update operation types
    const currentTypeCount = this.patterns.operationTypes.get(operation.type) || 0;
    this.patterns.operationTypes.set(operation.type, currentTypeCount + 1);

    // Update timing patterns
    this.patterns.timingPatterns.push({
      timestamp: operation.timestamp,
      duration: operation.duration
    });

    // Keep only last 100 timing patterns
    if (this.patterns.timingPatterns.length > 100) {
      this.patterns.timingPatterns.shift();
    }
  }
}

export const globalStorageOptimizer = new StorageOptimizer();

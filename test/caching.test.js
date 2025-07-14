/**
 * Caching and Storage Optimization Tests
 * Tests for Phase 4.2 caching features
 */

import {
  BrowserDetectionCache,
  BatchedStorage,
  UIComponentCache,
  StorageOptimizer,
  globalBrowserCache,
  globalUICache,
  createBatchedStorage
} from '../src/cachingUtils.js';
import { SidepanelFallback } from '../src/index.js';
import { setupTestEnvironment, mockUserAgent } from './testUtils.js';

describe('Caching and Storage Optimization', () => {
  beforeEach(() => {
    setupTestEnvironment();
    mockUserAgent('firefox');

    // Clear global caches
    globalBrowserCache.clear();
    globalUICache.clear();
  });

  describe('BrowserDetectionCache', () => {
    let cache;

    beforeEach(() => {
      cache = new BrowserDetectionCache(5);
    });

    it('should cache browser detection results', () => {
      const detector = jest.fn().mockReturnValue('firefox');
      const userAgent = 'Mozilla/5.0 Firefox/91.0';

      const result1 = cache.get(userAgent, detector);
      const result2 = cache.get(userAgent, detector);

      expect(result1).toBe('firefox');
      expect(result2).toBe('firefox');
      expect(detector).toHaveBeenCalledTimes(1); // Should be cached
    });

    it('should respect cache size limit', () => {
      const detector = jest.fn().mockImplementation(ua => ua.slice(-1));

      // Fill cache beyond capacity
      for (let i = 0; i < 10; i++) {
        cache.get(`user-agent-${i}`, detector);
      }

      const stats = cache.getStats();
      expect(stats.size).toBe(5); // Respects maxSize
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(10);
    });

    it('should provide accurate statistics', () => {
      const detector = jest.fn().mockReturnValue('chrome');

      cache.get('ua1', detector);
      cache.get('ua1', detector); // Hit
      cache.get('ua2', detector);

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(0.33, 2);
    });
  });

  describe('BatchedStorage', () => {
    let mockStorage;
    let batchedStorage;

    beforeEach(() => {
      mockStorage = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(),
        remove: jest.fn().mockResolvedValue(),
        setBatch: jest.fn().mockResolvedValue(),
        removeBatch: jest.fn().mockResolvedValue()
      };

      batchedStorage = new BatchedStorage(mockStorage, {
        batchSize: 3,
        batchTimeout: 100
      });
    });

    it('should batch set operations', async () => {
      await batchedStorage.set('key1', 'value1');
      await batchedStorage.set('key2', 'value2');
      await batchedStorage.set('key3', 'value3');

      // Wait for batch execution
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockStorage.setBatch).toHaveBeenCalledWith({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      });
    });

    it('should handle immediate flush', async () => {
      await batchedStorage.set('key1', 'value1');
      await batchedStorage.set('key2', 'value2');

      await batchedStorage.flush();

      expect(mockStorage.setBatch).toHaveBeenCalledWith({
        key1: 'value1',
        key2: 'value2'
      });
    });

    it('should return pending values for gets', async () => {
      await batchedStorage.set('key1', 'pending-value');

      const value = await batchedStorage.get('key1');
      expect(value).toBe('pending-value');
      expect(mockStorage.get).not.toHaveBeenCalled();
    });

    it('should provide batch statistics', async () => {
      await batchedStorage.set('key1', 'value1');
      await batchedStorage.set('key2', 'value2');
      await batchedStorage.flush();

      const stats = batchedStorage.getBatchStats();
      expect(stats.totalOperations).toBe(2);
      expect(stats.totalBatches).toBe(1);
      expect(stats.averageBatchSize).toBe(2);
    });

    it('should fallback to individual operations if batch methods unavailable', async () => {
      const simpleMockStorage = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(),
        remove: jest.fn().mockResolvedValue()
      };

      const simpleBatchedStorage = new BatchedStorage(simpleMockStorage, {
        batchSize: 2,
        batchTimeout: 10
      });

      await simpleBatchedStorage.set('key1', 'value1');
      await simpleBatchedStorage.set('key2', 'value2');

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(simpleMockStorage.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('UIComponentCache', () => {
    let cache;

    beforeEach(() => {
      cache = new UIComponentCache(3, 100); // Small cache with 100ms expiry
    });

    it('should cache UI components', () => {
      const component = { type: 'button', text: 'Click me' };

      cache.set('button1', component, { priority: 'high' });
      const cached = cache.get('button1');

      expect(cached).toEqual(component);
    });

    it('should expire old entries', async () => {
      const component = { type: 'button', text: 'Click me' };

      cache.set('button1', component);

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));

      const cached = cache.get('button1');
      expect(cached).toBeNull();
    });

    it('should respect cache size limit with LRU eviction', () => {
      cache.set('comp1', { id: 1 });
      cache.set('comp2', { id: 2 });
      cache.set('comp3', { id: 3 });
      cache.set('comp4', { id: 4 }); // Should evict comp1

      expect(cache.get('comp1')).toBeNull();
      expect(cache.get('comp2')).toEqual({ id: 2 });
      expect(cache.get('comp4')).toEqual({ id: 4 });
    });

    it('should provide accurate statistics', () => {
      cache.set('comp1', { id: 1 });
      cache.get('comp1'); // Hit
      cache.get('comp2'); // Miss
      cache.set('comp2', { id: 2 });
      cache.set('comp3', { id: 3 });
      cache.set('comp4', { id: 4 }); // Eviction

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.evictions).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should cleanup expired entries', async () => {
      cache.set('comp1', { id: 1 });
      cache.set('comp2', { id: 2 });

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));

      cache.cleanup();

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.evictions).toBe(2);
    });
  });

  describe('StorageOptimizer', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new StorageOptimizer();
    });

    it('should record storage operations', () => {
      optimizer.recordOperation('get', 'user-settings', 5);
      optimizer.recordOperation('set', 'user-settings', 10);
      optimizer.recordOperation('get', 'user-settings', 3);

      const stats = optimizer.getStats();
      expect(stats.totalOperations).toBe(3);
      expect(stats.operationsByType.get).toBe(2);
      expect(stats.operationsByType.set).toBe(1);
      expect(stats.averageDuration).toBeCloseTo(6, 1);
    });

    it('should provide caching recommendations for frequent keys', () => {
      // Record multiple operations on same key
      for (let i = 0; i < 5; i++) {
        optimizer.recordOperation('get', 'frequent-key', 2);
      }

      const recommendations = optimizer.getRecommendations();

      expect(recommendations.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'caching',
          priority: 'high'
        })
      );
    });

    it('should provide batching recommendations for high write volume', () => {
      // Record many write operations
      for (let i = 0; i < 20; i++) {
        optimizer.recordOperation('set', `key-${i}`, 5);
      }

      // Record fewer read operations
      for (let i = 0; i < 5; i++) {
        optimizer.recordOperation('get', `key-${i}`, 3);
      }

      const recommendations = optimizer.getRecommendations();

      expect(recommendations.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'batching',
          priority: 'medium'
        })
      );
    });

    it('should provide performance recommendations for slow operations', () => {
      optimizer.recordOperation('get', 'slow-key', 50);
      optimizer.recordOperation('set', 'slow-key', 60);

      const recommendations = optimizer.getRecommendations();

      expect(recommendations.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'performance',
          priority: 'high'
        })
      );
    });
  });

  describe('SidepanelFallback Caching Integration', () => {
    it('should support caching features', async () => {
      const fallback = new SidepanelFallback({
        enableCaching: true,
        enableStorageBatching: true,
        enableProgressiveInit: false // Disable progressive init to avoid complexity
      });

      await fallback.init();

      const stats = fallback.getPerformanceStats();
      expect(stats.caching).toBe(true);
      expect(stats.storageBatching).toBe(true); // This should be boolean true now
      expect(stats.browserCache).toBeDefined();
      expect(stats.uiCache).toBeDefined();
    });

    it('should use browser detection cache', async () => {
      // Clear global cache first
      globalBrowserCache.clear();

      const testUserAgent = 'test-ua-unique-' + Date.now();

      // First instance - will populate cache
      const fallback1 = new SidepanelFallback({
        enableCaching: true,
        userAgent: testUserAgent,
        enableProgressiveInit: false
      });

      await fallback1.init();

      // Verify cache has an entry
      const initialStats = globalBrowserCache.getStats();
      expect(initialStats.misses).toBe(1); // Should have one miss

      // Second instance - should hit cache
      const fallback2 = new SidepanelFallback({
        enableCaching: true,
        userAgent: testUserAgent,
        enableProgressiveInit: false
      });

      await fallback2.init();

      // Check cache stats - should now have a hit
      const finalStats = globalBrowserCache.getStats();
      expect(finalStats.hits).toBe(1);
      expect(finalStats.misses).toBe(1);
    });

    it('should support storage optimization', async () => {
      const fallback = new SidepanelFallback({
        enableStorageBatching: true,
        enableProgressiveInit: false
      });

      await fallback.init();

      const optimization = await fallback.optimizeStorage();
      expect(optimization).toBeDefined();
    });

    it('should support UI cache cleanup', async () => {
      const fallback = new SidepanelFallback({
        enableCaching: true,
        enableProgressiveInit: false
      });

      await fallback.init();

      // Should not throw
      fallback.cleanupUICache();
    });

    it('should provide cache recommendations', async () => {
      const fallback = new SidepanelFallback({
        enableCaching: true,
        enableProgressiveInit: false
      });

      await fallback.init();

      const recommendations = fallback.getCacheRecommendations();
      expect(recommendations.recommendations).toBeInstanceOf(Array);
      expect(recommendations.timestamp).toBeGreaterThan(0);
    });

    it('should support selective cache clearing', async () => {
      const fallback = new SidepanelFallback({
        enableCaching: true,
        enableLazyLoading: true,
        enableProgressiveInit: false
      });

      await fallback.init();

      // Should not throw for any cache type
      fallback.clearPerformanceCaches('browser');
      fallback.clearPerformanceCaches('ui');
      fallback.clearPerformanceCaches('lazy');
      fallback.clearPerformanceCaches('memory');
      fallback.clearPerformanceCaches('all');
    });
  });

  describe('createBatchedStorage', () => {
    it('should create a batched storage wrapper', () => {
      const mockStorage = {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn()
      };

      const batched = createBatchedStorage(mockStorage, {
        batchSize: 5,
        batchTimeout: 200
      });

      expect(batched).toBeInstanceOf(BatchedStorage);
      expect(batched.batchSize).toBe(5);
      expect(batched.batchTimeout).toBe(200);
    });
  });
});

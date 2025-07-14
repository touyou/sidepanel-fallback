/**
 * Performance and Lazy Loading Tests
 * Tests for performance monitoring, lazy loading, and progressive initialization
 */

import {
  PerformanceTimer,
  LazyLoader,
  ProgressiveInitializer,
  MemoryTracker,
  globalLazyLoader,
  globalMemoryTracker,
  createModuleLoader
} from '../src/performanceUtils.js';
import { SidepanelFallback } from '../src/index.js';
import { setupTestEnvironment, mockUserAgent, mockPerformanceAPI } from './testUtils.js';

describe('Performance and Lazy Loading', () => {
  beforeEach(() => {
    setupTestEnvironment();
    mockUserAgent('firefox');
    mockPerformanceAPI();

    // Clear global instances
    globalLazyLoader.clearCache();
    globalMemoryTracker.snapshots.length = 0;
  });

  describe('PerformanceTimer', () => {
    it('should track operation duration', () => {
      const timer = new PerformanceTimer('test-operation');

      timer.mark('step1');
      timer.mark('step2', { context: 'test' });

      const result = timer.complete({ success: true });

      expect(result.operation).toBe('test-operation');
      expect(result.totalDuration).toBeGreaterThan(0);
      expect(result.marks.step1).toBeDefined();
      expect(result.marks.step2.context).toEqual({ context: 'test' });
      expect(result.context.success).toBe(true);
    });
  });

  describe('LazyLoader', () => {
    let loader;

    beforeEach(() => {
      loader = new LazyLoader();
    });

    it('should load and cache components', async () => {
      const mockComponent = { name: 'test-component' };
      const loadFn = jest.fn().mockResolvedValue(mockComponent);

      const result1 = await loader.load('test-comp', loadFn);
      const result2 = await loader.load('test-comp', loadFn);

      expect(result1).toBe(mockComponent);
      expect(result2).toBe(mockComponent);
      expect(loadFn).toHaveBeenCalledTimes(1); // Should be cached
    });

    it('should handle concurrent loading', async () => {
      const mockComponent = { name: 'test-component' };
      const loadFn = jest.fn().mockResolvedValue(mockComponent);

      const [result1, result2] = await Promise.all([
        loader.load('test-comp', loadFn),
        loader.load('test-comp', loadFn)
      ]);

      expect(result1).toBe(mockComponent);
      expect(result2).toBe(mockComponent);
      expect(loadFn).toHaveBeenCalledTimes(1); // Should share loading promise
    });

    it('should handle loading errors', async () => {
      const error = new Error('Load failed');
      const loadFn = jest.fn().mockRejectedValue(error);

      await expect(loader.load('failing-comp', loadFn)).rejects.toThrow('Load failed');

      // Should allow retry after error
      const successFn = jest.fn().mockResolvedValue({ success: true });
      const result = await loader.load('failing-comp', successFn);
      expect(result.success).toBe(true);
    });

    it('should preload components', async () => {
      const comp1 = jest.fn().mockResolvedValue({ name: 'comp1' });
      const comp2 = jest.fn().mockResolvedValue({ name: 'comp2' });
      const comp3 = jest.fn().mockRejectedValue(new Error('Failed'));

      await loader.preload([
        { key: 'comp1', loader: comp1 },
        { key: 'comp2', loader: comp2 },
        { key: 'comp3', loader: comp3 }
      ]);

      expect(comp1).toHaveBeenCalled();
      expect(comp2).toHaveBeenCalled();
      expect(comp3).toHaveBeenCalled();

      const stats = loader.getCacheStats();
      expect(stats.cached).toBe(2); // comp3 failed so not cached
      expect(stats.keys).toContain('comp1');
      expect(stats.keys).toContain('comp2');
    });

    it('should provide cache statistics', () => {
      const stats = loader.getCacheStats();
      expect(stats).toEqual({
        cached: 0,
        loading: 0,
        keys: []
      });
    });
  });

  describe('ProgressiveInitializer', () => {
    let initializer;

    beforeEach(() => {
      initializer = new ProgressiveInitializer();
    });

    it('should define and run stages in correct order', async () => {
      const stage1 = jest.fn().mockResolvedValue('stage1-result');
      const stage2 = jest.fn().mockResolvedValue('stage2-result');
      const stage3 = jest.fn().mockResolvedValue('stage3-result');

      initializer.defineStage('stage1', stage1, { priority: 100 });
      initializer.defineStage('stage2', stage2, { priority: 90, dependencies: ['stage1'] });
      initializer.defineStage('stage3', stage3, { priority: 80, dependencies: ['stage2'] });

      const result = await initializer.initialize();

      expect(result.success).toBe(true);
      expect(result.results.stage1).toBe('stage1-result');
      expect(result.results.stage2).toBe('stage2-result');
      expect(result.results.stage3).toBe('stage3-result');

      // Check execution order by examining call order
      const stage1CallTime = stage1.mock.invocationCallOrder[0];
      const stage2CallTime = stage2.mock.invocationCallOrder[0];
      const stage3CallTime = stage3.mock.invocationCallOrder[0];

      expect(stage1CallTime).toBeLessThan(stage2CallTime);
      expect(stage2CallTime).toBeLessThan(stage3CallTime);
    });

    it('should handle stage failures', async () => {
      const stage1 = jest.fn().mockResolvedValue('success');
      const stage2 = jest.fn().mockRejectedValue(new Error('Stage 2 failed'));

      initializer.defineStage('stage1', stage1, { required: false });
      initializer.defineStage('stage2', stage2, { required: true });

      const result = await initializer.initialize();

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Stage 2 failed');
      expect(result.results.stage1).toBe('success');
    });

    it('should handle optional stage failures', async () => {
      const stage1 = jest.fn().mockResolvedValue('success');
      const stage2 = jest.fn().mockRejectedValue(new Error('Optional failed'));
      const stage3 = jest.fn().mockResolvedValue('success3');

      initializer.defineStage('stage1', stage1, { required: true });
      initializer.defineStage('stage2', stage2, { required: false });
      initializer.defineStage('stage3', stage3, { required: true, dependencies: ['stage1'] });

      const result = await initializer.initialize();

      expect(result.success).toBe(true);
      expect(result.results.stage1).toBe('success');
      expect(result.results.stage3).toBe('success3');
      expect(result.errors.stage2).toBeDefined();
    });

    it('should handle stage timeouts', async () => {
      const slowStage = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      initializer.defineStage('slow', slowStage, { timeout: 50 });

      const result = await initializer.initialize();

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('timed out');
    });

    it('should provide status information', () => {
      initializer.defineStage('stage1', jest.fn());
      initializer.defineStage('stage2', jest.fn());

      const status = initializer.getStatus();
      expect(status.totalStages).toBe(2);
      expect(status.completedStages).toEqual([]);
      expect(status.isComplete).toBe(false);
    });
  });

  describe('MemoryTracker', () => {
    let tracker;

    beforeEach(() => {
      tracker = new MemoryTracker();
    });

    it('should take memory snapshots', () => {
      const snapshot = tracker.snapshot('test-snapshot');

      if (tracker.isSupported) {
        expect(snapshot).toBeDefined();
        expect(snapshot.label).toBe('test-snapshot');
        expect(snapshot.memory).toBeDefined();
      } else {
        expect(snapshot).toBeNull();
      }
    });

    it('should calculate memory diffs', () => {
      tracker.snapshot('start');
      tracker.snapshot('end');

      const diff = tracker.getDiff('start', 'end');

      if (tracker.isSupported) {
        expect(diff).toBeDefined();
        expect(diff.duration).toBeGreaterThanOrEqual(0);
        expect(diff.memoryDiff).toBeDefined();
      } else {
        expect(diff).toBeNull();
      }
    });
  });

  describe('SidepanelFallback Performance Integration', () => {
    it('should support performance tracking', async () => {
      const fallback = new SidepanelFallback({
        enablePerformanceTracking: true,
        enableLazyLoading: false,
        enableProgressiveInit: false
      });

      await fallback.init();

      const stats = fallback.getPerformanceStats();
      expect(stats.performanceTracking).toBe(true);
      expect(stats.lazyLoading).toBe(false);
      expect(stats.progressiveInit).toBe(false);
    });

    it('should support lazy loading', async () => {
      const fallback = new SidepanelFallback({
        enableLazyLoading: true,
        enableProgressiveInit: false
      });

      await fallback.init();

      const stats = fallback.getPerformanceStats();
      expect(stats.lazyLoading).toBe(true);
      expect(stats.lazyLoader.cached).toBeGreaterThanOrEqual(0);
    });

    it('should support progressive initialization', async () => {
      const fallback = new SidepanelFallback({
        enableProgressiveInit: true
      });

      await fallback.init();

      const stats = fallback.getPerformanceStats();
      expect(stats.progressiveInit).toBe(true);
      expect(stats.progressiveInitializer.isComplete).toBe(true);
    });

    it('should support component preloading', async () => {
      const fallback = new SidepanelFallback({
        enableLazyLoading: true
      });

      await fallback.init();
      await fallback.preloadComponents(['panel-launcher', 'settings-ui']);

      const stats = fallback.getPerformanceStats();
      expect(stats.lazyLoader.cached).toBeGreaterThan(0);
    });

    it('should support cache clearing', async () => {
      const fallback = new SidepanelFallback({
        enableLazyLoading: true,
        enablePerformanceTracking: true
      });

      await fallback.init();
      await fallback.preloadComponents();

      // Should have some cache entries
      let stats = fallback.getPerformanceStats();
      const initialSnapshots = stats.memorySnapshots.length;

      fallback.clearPerformanceCaches('lazy');
      stats = fallback.getPerformanceStats();
      expect(stats.lazyLoader.cached).toBe(0);
      expect(stats.memorySnapshots.length).toBe(initialSnapshots);

      fallback.clearPerformanceCaches('memory');
      stats = fallback.getPerformanceStats();
      expect(stats.memorySnapshots.length).toBe(0);
    });

    it('should handle initialization with specific stages', async () => {
      const fallback = new SidepanelFallback({
        enableProgressiveInit: true
      });

      await fallback.init({ stages: ['browser-detection', 'event-system'] });

      const stats = fallback.getPerformanceStats();
      expect(stats.progressiveInitializer.completedStages).toContain('browser-detection');
      expect(stats.progressiveInitializer.completedStages).toContain('event-system');
    });

    it('should fallback to standard init when progressive init is disabled', async () => {
      const fallback = new SidepanelFallback({
        enableProgressiveInit: false
      });

      await fallback.init();

      const stats = fallback.getPerformanceStats();
      expect(stats.progressiveInit).toBe(false);
      expect(fallback.initialized).toBe(true);
    });
  });

  describe('createModuleLoader', () => {
    it('should create a module loader function', () => {
      const loader = createModuleLoader('./test-module.js');
      expect(typeof loader).toBe('function');
    });
  });
});

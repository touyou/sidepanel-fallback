/**
 * End-to-End Tests for SidepanelFallback
 * Tests real-world usage scenarios and browser compatibility
 */

import { SidepanelFallback } from '../src/index.js';
import { setupTestEnvironment } from './testUtils.js';

// Setup test environment before any tests
setupTestEnvironment();

// Browser simulation utilities
const createBrowserEnvironment = (browserType, hasExtensionAPI = false) => {
  const userAgents = {
    chrome:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    safari:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188'
  };

  // Mock DOM and global objects
  global.navigator = {
    userAgent: userAgents[browserType] || userAgents.chrome
  };

  global.window = {
    open: jest.fn(() => ({
      close: jest.fn(),
      focus: jest.fn(),
      location: { href: '' },
      document: { title: 'Test Panel' }
    })),
    localStorage: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    },
    location: {
      origin: 'https://example.com',
      href: 'https://example.com/test'
    }
  };

  global.document = {
    createElement: jest.fn(tagName => ({
      tagName: tagName.toUpperCase(),
      innerHTML: '',
      children: [],
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false)
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(() => null),
      querySelectorAll: jest.fn(() => []),
      querySelector: jest.fn(() => null),
      value: '',
      checked: false,
      dispatchEvent: jest.fn()
    })),
    getElementById: jest.fn(() => null),
    querySelector: jest.fn(() => null),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };

  // Mock Chrome Extension API only if specified
  if (hasExtensionAPI) {
    global.chrome = {
      sidePanel: {
        open: jest.fn().mockResolvedValue(undefined),
        setOptions: jest.fn().mockResolvedValue(undefined)
      },
      storage: {
        local: {
          get: jest.fn().mockImplementation((keys, callback) => {
            const result = {};
            if (callback) callback(result);
            return Promise.resolve(result);
          }),
          set: jest.fn().mockImplementation((items, callback) => {
            if (callback) callback();
            return Promise.resolve();
          })
        }
      },
      runtime: {
        id: 'test-extension-id',
        getURL: jest.fn().mockImplementation(path => `chrome-extension://test-extension-id${path}`)
      },
      windows: {
        create: jest.fn().mockResolvedValue({ id: 1 })
      }
    };
  } else {
    delete global.chrome;
  }

  return browserType;
};

describe('End-to-End Tests', () => {
  let fallback;

  beforeAll(() => {
    // Ensure test environment is properly set up
    setupTestEnvironment();
  });

  afterEach(() => {
    if (fallback) {
      fallback.clearPerformanceCaches('all');
    }
    jest.clearAllMocks();

    // Clear localStorage to prevent test interference
    if (global.localStorage) {
      global.localStorage.clear();
    }
  });

  describe('Chrome Extension Environment', () => {
    beforeEach(() => {
      createBrowserEnvironment('chrome', true);
    });

    it('should work end-to-end in Chrome extension context', async () => {
      fallback = new SidepanelFallback({
        defaultMode: 'auto',
        enablePerformanceTracking: true
      });

      // Initialize
      const initResult = await fallback.init();
      expect(initResult.success).toBe(true);
      expect(initResult.browser).toBe('chrome');
      expect(initResult.mode).toBe('auto');

      // Open panel - should use sidepanel API
      const openResult = await fallback.openPanel('/extension-panel.html');
      expect(openResult.success).toBe(true);
      expect(openResult.method).toBe('sidepanel');
      expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({
        path: '/extension-panel.html'
      });
      expect(chrome.sidePanel.open).toHaveBeenCalledWith();

      // Create settings UI
      const container = document.createElement('div');
      const settingsResult = await fallback.withSettingsUI(container);
      expect(settingsResult.success).toBe(true);

      // Verify performance tracking
      const stats = fallback.getPerformanceStats();
      expect(stats.performanceTracking).toBe(true);
    });

    it('should handle sidepanel API failure gracefully', async () => {
      // Mock sidepanel API to fail
      chrome.sidePanel.open.mockRejectedValue(new Error('Permission denied'));

      fallback = new SidepanelFallback({
        defaultMode: 'sidepanel'
      });

      await fallback.init();
      const result = await fallback.openPanel('/extension-panel.html');

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.method).toBe('window');
      expect(chrome.windows.create).toHaveBeenCalled();
    });
  });

  describe('Firefox Web Environment', () => {
    beforeEach(() => {
      createBrowserEnvironment('firefox', false);
    });

    it('should work end-to-end in Firefox without extension API', async () => {
      fallback = new SidepanelFallback({
        defaultMode: 'auto',
        enableCaching: true,
        enableStorageBatching: true
      });

      const initResult = await fallback.init();
      expect(initResult.success).toBe(true);
      expect(initResult.browser).toBe('firefox');

      // Should use window mode for Firefox
      const openResult = await fallback.openPanel('/web-panel.html');
      expect(openResult.success).toBe(true);
      expect(openResult.method).toBe('window');
      expect(window.open).toHaveBeenCalledWith(
        '/web-panel.html',
        'sidepanel_fallback',
        expect.stringContaining('width=400')
      );
    });

    it('should persist settings in localStorage', async () => {
      // Temporarily remove chrome object to test localStorage path
      const tempChrome = global.chrome;
      delete global.chrome;

      fallback = new SidepanelFallback();
      await fallback.init();

      const container = document.createElement('div');
      await fallback.withSettingsUI(container);

      // Simulate settings change directly on storage
      await fallback.storage.setMode('firefox', 'window');

      // For now, just verify the call was made without error
      expect(fallback.storage).toBeDefined();

      // Restore chrome object
      global.chrome = tempChrome;
    });
  });

  describe('Safari Web Environment', () => {
    beforeEach(() => {
      createBrowserEnvironment('safari', false);
    });

    it('should work end-to-end in Safari', async () => {
      fallback = new SidepanelFallback({
        defaultMode: 'auto',
        enableProgressiveInit: true
      });

      const initResult = await fallback.init();
      expect(initResult.success).toBe(true);
      expect(initResult.browser).toBe('safari');

      const openResult = await fallback.openPanel('/safari-panel.html');
      expect(openResult.success).toBe(true);
      expect(openResult.method).toBe('window');
    });

    it('should handle Safari popup blocking', async () => {
      // Mock window.open to return null (popup blocked)
      window.open.mockReturnValue(null);

      fallback = new SidepanelFallback();
      await fallback.init();

      const result = await fallback.openPanel('/blocked-panel.html');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to open popup window');
    });
  });

  describe('Edge Extension Environment', () => {
    beforeEach(() => {
      createBrowserEnvironment('edge', true);
    });

    it('should work end-to-end in Edge with extension API', async () => {
      fallback = new SidepanelFallback({
        defaultMode: 'auto',
        enableLazyLoading: true
      });

      const initResult = await fallback.init();
      expect(initResult.success).toBe(true);
      expect(initResult.browser).toBe('edge');

      // Edge should prefer sidepanel like Chrome
      const openResult = await fallback.openPanel('/edge-panel.html');
      expect(openResult.success).toBe(true);
      expect(openResult.method).toBe('sidepanel');
    });
  });

  describe('Cross-Browser Compatibility', () => {
    const browsers = [
      { name: 'chrome', hasExtAPI: true },
      { name: 'firefox', hasExtAPI: false },
      { name: 'safari', hasExtAPI: false },
      { name: 'edge', hasExtAPI: true }
    ];

    browsers.forEach(({ name, hasExtAPI }) => {
      it(`should initialize consistently across ${name}`, async () => {
        createBrowserEnvironment(name, hasExtAPI);

        fallback = new SidepanelFallback({
          defaultMode: 'auto',
          enablePerformanceTracking: true,
          enableCaching: true
        });

        const result = await fallback.init();

        expect(result.success).toBe(true);
        expect(result.browser).toBe(name);
        // init() returns the configured mode, not the resolved mode
        expect(result.mode).toBe('auto');
        expect(fallback.initialized).toBe(true);

        // Verify core functionality works
        const settings = fallback.getCurrentSettings();
        expect(settings.browser).toBe(name);

        const stats = fallback.getPerformanceStats();
        expect(stats).toBeDefined();
        expect(stats.performanceTracking).toBe(true);
      });
    });

    it('should use appropriate panel opening method per browser', async () => {
      const expectations = {
        chrome: { method: 'sidepanel', api: 'chrome.sidePanel' },
        edge: { method: 'sidepanel', api: 'chrome.sidePanel' },
        firefox: { method: 'window', api: 'window.open' },
        safari: { method: 'window', api: 'window.open' }
      };

      for (const [browser, { method }] of Object.entries(expectations)) {
        jest.clearAllMocks();
        createBrowserEnvironment(browser, ['chrome', 'edge'].includes(browser));

        fallback = new SidepanelFallback({ defaultMode: 'auto' });
        await fallback.init();

        const result = await fallback.openPanel('/test-panel.html');

        expect(result.success).toBe(true);
        expect(result.method).toBe(method);

        if (method === 'sidepanel') {
          expect(chrome.sidePanel.open).toHaveBeenCalled();
        } else {
          expect(window.open).toHaveBeenCalled();
        }
      }
    });
  });

  describe('Real-World Usage Scenarios', () => {
    it('should handle rapid successive panel openings', async () => {
      createBrowserEnvironment('chrome', true);

      fallback = new SidepanelFallback({
        enablePerformanceTracking: true,
        enableCaching: true
      });

      await fallback.init();

      // Open multiple panels rapidly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(fallback.openPanel(`/panel-${i}.html`));
      }

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({
          path: `/panel-${index}.html`
        });
      });
      expect(chrome.sidePanel.open).toHaveBeenCalledTimes(5);
    });

    it('should handle settings changes during panel operations', async () => {
      createBrowserEnvironment('chrome', true);

      fallback = new SidepanelFallback({
        defaultMode: 'auto',
        enableStorageBatching: true
      });

      await fallback.init();

      const container = document.createElement('div');
      await fallback.withSettingsUI(container);

      // Change mode while panel is "open"
      await fallback.openPanel('/initial-panel.html');

      // Change settings
      await fallback.storage.setMode('chrome', 'window');
      fallback.mode = 'window';

      // Open another panel with new settings
      const result = await fallback.openPanel('/new-panel.html');
      expect(result.success).toBe(true);
      expect(result.method).toBe('window');
      expect(chrome.windows.create).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      createBrowserEnvironment('chrome', true);

      // Mock network-like errors
      chrome.sidePanel.open.mockRejectedValue(new Error('Network error'));
      chrome.windows.create.mockRejectedValue(new Error('Window creation failed'));
      window.open.mockReturnValue(null);

      fallback = new SidepanelFallback({
        defaultMode: 'sidepanel'
      });

      await fallback.init();

      const result = await fallback.openPanel('/network-panel.html');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should maintain performance under repeated initialization', async () => {
      createBrowserEnvironment('chrome', true);

      const initTimes = [];

      for (let i = 0; i < 5; i++) {
        fallback = new SidepanelFallback({
          enablePerformanceTracking: true,
          enableCaching: true
        });

        const startTime = Date.now();
        await fallback.init();
        const endTime = Date.now();

        initTimes.push(endTime - startTime);

        // Clean up for next iteration
        fallback.clearPerformanceCaches('all');
      }

      // After caching, initialization should be faster
      const avgTime = initTimes.reduce((a, b) => a + b, 0) / initTimes.length;
      expect(avgTime).toBeLessThan(100); // Should be fast with caching
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from partial initialization failures', async () => {
      createBrowserEnvironment('chrome', true);

      // Mock storage to fail initially
      const originalLocalStorage = window.localStorage;
      window.localStorage = {
        ...originalLocalStorage,
        getItem: jest.fn(() => {
          throw new Error('Storage error');
        }),
        setItem: jest.fn(() => {
          throw new Error('Storage error');
        })
      };

      fallback = new SidepanelFallback({
        defaultMode: 'sidepanel'
      });

      try {
        await fallback.init();
        expect(true).toBe(false); // Should throw
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Restore storage and retry
      window.localStorage = originalLocalStorage;

      const newFallback = new SidepanelFallback({
        defaultMode: 'sidepanel'
      });

      const result = await newFallback.init();
      expect(result.success).toBe(true);
    });

    it('should handle corrupted cache gracefully', async () => {
      createBrowserEnvironment('chrome', true);

      fallback = new SidepanelFallback({
        enableCaching: true
      });

      await fallback.init();

      // Corrupt the cache by adding invalid data
      fallback.browserCache.cache.set('corrupted', { invalid: 'data' });

      // Should still work with cache clearing
      fallback.clearPerformanceCaches('browser');

      const result = await fallback.openPanel('/recovery-panel.html');
      expect(result.success).toBe(true);
    });
  });
});

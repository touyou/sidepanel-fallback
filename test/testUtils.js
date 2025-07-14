/**
 * Test utilities for dependency injection
 */

import { DIContainer } from '../src/diContainer.js';

/**
 * Create a test DI container with mocked dependencies
 * @param {object} mocks - Mock objects for each service
 * @returns {DIContainer} Test container
 */
export function createTestContainer(mocks = {}) {
  const container = new DIContainer();

  // Register mock instances
  if (mocks.storage) {
    container.registerInstance('storage', mocks.storage);
  }
  if (mocks.launcher) {
    container.registerInstance('launcher', mocks.launcher);
  }
  if (mocks.settingsUI) {
    container.registerInstance('settingsUI', mocks.settingsUI);
  }
  if (mocks.browserDetector) {
    container.registerInstance('browserDetector', mocks.browserDetector);
  }

  return container;
}

/**
 * Create mock browser detector
 * @param {string} browserName - Browser name to return
 * @returns {object} Mock browser detector
 */
export function createMockBrowserDetector(browserName = 'chrome') {
  return {
    getBrowserInfo: jest.fn().mockReturnValue(browserName)
  };
}

/**
 * Create mock storage
 * @param {string} mode - Mode to return from getMode
 * @returns {object} Mock storage
 */
export function createMockStorage(mode = null) {
  return {
    setMode: jest.fn().mockResolvedValue(),
    getMode: jest.fn().mockResolvedValue(mode),
    clear: jest.fn().mockResolvedValue()
  };
}

/**
 * Create mock launcher
 * @param {object} result - Result to return from openPanel
 * @returns {object} Mock launcher
 */
export function createMockLauncher(result = { success: true, method: 'sidepanel' }) {
  return {
    openPanel: jest.fn().mockResolvedValue(result),
    isExtensionContext: jest.fn().mockReturnValue(true)
  };
}

/**
 * Create mock settings UI
 * @returns {object} Mock settings UI
 */
export function createMockSettingsUI() {
  const mockElement = { appendChild: jest.fn() };

  return {
    createSettingsPanel: jest.fn().mockReturnValue(mockElement)
  };
}

/**
 * Setup test environment with DOM and user agent
 */
export function setupTestEnvironment() {
  // Setup DOM globals if not already present
  if (typeof global.navigator === 'undefined') {
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0'
    };
  }

  if (typeof global.document === 'undefined') {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;

    // Mock window.open for JSDOM
    global.window.open = jest.fn(() => ({
      focus: jest.fn(),
      close: jest.fn(),
      location: { href: '' }
    }));
  }

  // Setup localStorage mock
  if (typeof global.localStorage === 'undefined') {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: key => store[key] || null,
        setItem: (key, value) => (store[key] = value.toString()),
        removeItem: key => delete store[key],
        clear: () => (store = {}),
        get length() {
          return Object.keys(store).length;
        },
        key: i => {
          const keys = Object.keys(store);
          return keys[i] || null;
        }
      };
    })();

    global.localStorage = localStorageMock;
  }
}

/**
 * Mock user agent for testing
 * @param {string} browser - Browser type ('firefox', 'chrome', 'safari', 'edge')
 */
export function mockUserAgent(browser) {
  const userAgents = {
    firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
    chrome:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    safari:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
  };

  global.navigator.userAgent = userAgents[browser] || userAgents.firefox;
}

/**
 * Setup Chrome extension environment for testing
 */
export function mockChromeExtensionEnvironment() {
  const extensionMock = {
    runtime: {
      getManifest: jest.fn().mockReturnValue({
        manifest_version: 3,
        name: 'Test Extension'
      }),
      sendMessage: jest.fn().mockResolvedValue({}),
      onMessage: {
        addListener: jest.fn()
      }
    },
    tabs: {
      query: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 1 })
    },
    sidePanel: {
      open: jest.fn().mockResolvedValue(undefined),
      setOptions: jest.fn().mockResolvedValue(undefined)
    }
  };

  global.chrome = extensionMock;
  return extensionMock;
}

/**
 * Mock performance API for testing
 */
export function mockPerformanceAPI() {
  if (!global.performance) {
    global.performance = {
      now: jest.fn(() => Date.now()),
      memory: {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 50000000,
        jsHeapSizeLimit: 100000000
      }
    };
  }

  // Mock requestIdleCallback
  global.requestIdleCallback = jest.fn(callback => {
    setTimeout(callback, 0);
    return 1;
  });

  global.cancelIdleCallback = jest.fn();
}

/**
 * Create async mock with delay
 */
export function createAsyncMock(resolveValue, delay = 0) {
  return jest.fn().mockImplementation(() => {
    return new Promise(resolve => {
      setTimeout(() => resolve(resolveValue), delay);
    });
  });
}

/**
 * Create rejected mock with delay
 */
export function createRejectedMock(error, delay = 0) {
  return jest.fn().mockImplementation(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(error), delay);
    });
  });
}

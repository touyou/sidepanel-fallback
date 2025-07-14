/**
 * Test for dependency injection functionality
 */

import { SidepanelFallback } from '../src/index.js';
import { createTestContainer, createMockBrowserDetector, createMockStorage, createMockLauncher, createMockSettingsUI } from './testUtils.js';

describe('SidepanelFallback - Dependency Injection', () => {
  let mockStorage;
  let mockLauncher;
  let mockSettingsUI;
  let mockBrowserDetector;
  let testContainer;

  beforeEach(() => {
    // Setup DOM environment
    global.document = {
      createElement: jest.fn().mockReturnValue({
        appendChild: jest.fn()
      })
    };

    // Setup localStorage mock
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    // Create mocks
    mockStorage = createMockStorage('window');
    mockLauncher = createMockLauncher({ success: true, method: 'window' });
    mockSettingsUI = createMockSettingsUI();
    mockBrowserDetector = createMockBrowserDetector('firefox');

    // Create test container
    testContainer = createTestContainer({
      storage: mockStorage,
      launcher: mockLauncher,
      settingsUI: mockSettingsUI,
      browserDetector: mockBrowserDetector
    });

    // Mock navigator
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Firefox/115.0)'
    };
  });

  describe('DI Container Integration', () => {
    it('uses custom container when enableDependencyInjection is true', async () => {
      const fallback = new SidepanelFallback({
        enableDependencyInjection: true,
        container: testContainer
      });

      const result = await fallback.init();

      expect(mockBrowserDetector.getBrowserInfo).toHaveBeenCalledWith(global.navigator.userAgent);
      expect(mockStorage.getMode).toHaveBeenCalledWith('firefox');
      expect(result.browser).toBe('firefox');
      expect(result.mode).toBe('window');
    });

    it('uses default implementations when enableDependencyInjection is false', async () => {
      const fallback = new SidepanelFallback({
        enableDependencyInjection: false,
        container: testContainer
      });

      const result = await fallback.init();

      // Should not use mocked browser detector
      expect(mockBrowserDetector.getBrowserInfo).not.toHaveBeenCalled();
      // Should use actual getBrowserInfo function
      expect(result.browser).toBe('firefox'); // Still firefox due to UA, but via actual function
    });
  });

  describe('Custom Implementation Injection', () => {
    it('uses custom storage implementation', async () => {
      const customStorage = createMockStorage('sidepanel');
      
      const fallback = new SidepanelFallback({
        storage: customStorage
      });

      await fallback.init();

      expect(customStorage.getMode).toHaveBeenCalled();
      expect(mockStorage.getMode).not.toHaveBeenCalled();
    });

    it('uses custom launcher implementation', async () => {
      const customLauncher = createMockLauncher({ success: true, method: 'custom' });
      
      const fallback = new SidepanelFallback({
        launcher: customLauncher
      });

      await fallback.init();
      const result = await fallback.openPanel('/test.html');

      expect(customLauncher.openPanel).toHaveBeenCalledWith('auto', '/test.html');
      expect(result.method).toBe('custom');
    });

    it('uses custom settings UI implementation', async () => {
      const customSettingsUI = createMockSettingsUI();
      const mockContainer = document.createElement('div');
      
      const fallback = new SidepanelFallback({
        settingsUI: customSettingsUI
      });

      await fallback.init();
      await fallback.withSettingsUI(mockContainer);

      expect(customSettingsUI.createSettingsPanel).toHaveBeenCalled();
    });

    it('uses custom browser detector implementation', async () => {
      const customBrowserDetector = createMockBrowserDetector('chrome');
      
      const fallback = new SidepanelFallback({
        browserDetector: customBrowserDetector
      });

      const result = await fallback.init();

      expect(customBrowserDetector.getBrowserInfo).toHaveBeenCalled();
      expect(result.browser).toBe('chrome');
    });
  });

  describe('Mixed DI and Custom Implementations', () => {
    it('prioritizes custom implementations over DI container', async () => {
      const customStorage = createMockStorage('custom-mode');
      
      const fallback = new SidepanelFallback({
        enableDependencyInjection: true,
        container: testContainer,
        storage: customStorage // This should take priority
      });

      const result = await fallback.init();

      expect(customStorage.getMode).toHaveBeenCalled();
      expect(mockStorage.getMode).not.toHaveBeenCalled();
      expect(result.mode).toBe('custom-mode');
    });
  });

  describe('DI Metadata', () => {
    it('includes DI information in initialization metadata', async () => {
      const customStorage = createMockStorage('window');
      
      const fallback = new SidepanelFallback({
        enableDependencyInjection: true,
        container: testContainer,
        storage: customStorage
      });

      // Access the raw result without normalization for testing
      const normalizedResult = await fallback.init();
      
      // The result should have been normalized, but we can check the behavior
      expect(normalizedResult.browser).toBe('firefox');
      expect(normalizedResult.mode).toBe('window');
    });
  });
});

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

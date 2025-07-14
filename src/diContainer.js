/**
 * Dependency injection container for SidepanelFallback
 * Enables better testability and customization of implementations
 */

import { ModeStorage } from './modeStorage.js';
import { PanelLauncher } from './panelLauncher.js';
import { SettingsUI } from './settingsUI.js';
import { getBrowserInfo } from './browserInfo.js';
import { EventEmitter } from './eventSystem.js';

/**
 * Interface for storage implementations
 */
export class IStorageProvider {
  async setMode(_browser, _mode) {
    throw new Error('setMode must be implemented by storage provider');
  }

  async getMode(_browser) {
    throw new Error('getMode must be implemented by storage provider');
  }

  async clear() {
    throw new Error('clear must be implemented by storage provider');
  }
}

/**
 * Interface for panel launcher implementations
 */
export class IPanelLauncher {
  async openPanel(_mode, _path) {
    throw new Error('openPanel must be implemented by panel launcher');
  }

  isExtensionContext() {
    throw new Error('isExtensionContext must be implemented by panel launcher');
  }
}

/**
 * Interface for settings UI implementations
 */
export class ISettingsUI {
  createSettingsPanel(_currentSettings, _onSettingsChange) {
    throw new Error('createSettingsPanel must be implemented by settings UI');
  }
}

/**
 * Interface for browser detection implementations
 */
export class IBrowserDetector {
  getBrowserInfo(_userAgent) {
    throw new Error('getBrowserInfo must be implemented by browser detector');
  }
}

/**
 * Default implementations using existing classes
 */
export class DefaultStorageProvider extends IStorageProvider {
  constructor() {
    super();
    this._storage = new ModeStorage();
  }

  async setMode(browser, mode) {
    return this._storage.setMode(browser, mode);
  }

  async getMode(browser) {
    return this._storage.getMode(browser);
  }

  async clear() {
    return this._storage.clear();
  }
}

export class DefaultPanelLauncher extends IPanelLauncher {
  constructor() {
    super();
    this._launcher = new PanelLauncher();
  }

  async openPanel(mode, path) {
    return this._launcher.openPanel(mode, path);
  }

  isExtensionContext() {
    return this._launcher.isExtensionContext();
  }
}

export class DefaultSettingsUI extends ISettingsUI {
  constructor() {
    super();
    this._ui = new SettingsUI();
  }

  createSettingsPanel(currentSettings, onSettingsChange) {
    return this._ui.createSettingsPanel(currentSettings, onSettingsChange);
  }
}

export class DefaultBrowserDetector extends IBrowserDetector {
  getBrowserInfo(userAgent) {
    return getBrowserInfo(userAgent);
  }
}

/**
 * Default event emitter implementation
 */
export class DefaultEventEmitter extends EventEmitter {
  constructor() {
    super();
  }
}

/**
 * Dependency injection container
 */
export class DIContainer {
  constructor() {
    this._providers = new Map();
    this._instances = new Map();

    // Register default providers
    this.registerProvider('storage', DefaultStorageProvider);
    this.registerProvider('launcher', DefaultPanelLauncher);
    this.registerProvider('settingsUI', DefaultSettingsUI);
    this.registerProvider('browserDetector', DefaultBrowserDetector);
    this.registerProvider('eventEmitter', DefaultEventEmitter);
  }

  /**
   * Register a provider class for a service
   * @param {string} name - Service name
   * @param {Function} providerClass - Provider class constructor
   */
  registerProvider(name, providerClass) {
    this._providers.set(name, providerClass);
    // Clear cached instance when provider changes
    if (this._instances.has(name)) {
      this._instances.delete(name);
    }
  }

  /**
   * Register a singleton instance for a service
   * @param {string} name - Service name
   * @param {object} instance - Service instance
   */
  registerInstance(name, instance) {
    this._instances.set(name, instance);
  }

  /**
   * Get a service instance (singleton pattern)
   * @param {string} name - Service name
   * @returns {object} Service instance
   */
  get(name) {
    // Return cached instance if available
    if (this._instances.has(name)) {
      return this._instances.get(name);
    }

    // Create new instance from provider
    const ProviderClass = this._providers.get(name);
    if (!ProviderClass) {
      throw new Error(`No provider registered for service: ${name}`);
    }

    const instance = new ProviderClass();
    this._instances.set(name, instance);
    return instance;
  }

  /**
   * Create a fresh instance (not cached)
   * @param {string} name - Service name
   * @returns {object} Service instance
   */
  create(name) {
    const ProviderClass = this._providers.get(name);
    if (!ProviderClass) {
      throw new Error(`No provider registered for service: ${name}`);
    }

    return new ProviderClass();
  }

  /**
   * Clear all cached instances
   */
  clear() {
    this._instances.clear();
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  hasProvider(name) {
    return this._providers.has(name);
  }

  /**
   * Get all registered service names
   * @returns {string[]}
   */
  getServiceNames() {
    return Array.from(this._providers.keys());
  }
}

/**
 * Global DI container instance
 */
export const container = new DIContainer();

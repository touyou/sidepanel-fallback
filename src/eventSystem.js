/**
 * Event System for SidepanelFallback
 * Provides lifecycle hooks and state change notifications
 */

/**
 * Event emitter interface for the event system
 * @interface IEventEmitter
 */
export const IEventEmitter = {
  /**
   * Register an event listener
   * @param {string} _eventName - The name of the event
   * @param {Function} _listener - The event listener function
   * @returns {Function} Unsubscribe function
   */
  on(_eventName, _listener) {
    throw new Error('IEventEmitter.on must be implemented');
  },

  /**
   * Register a one-time event listener
   * @param {string} _eventName - The name of the event
   * @param {Function} _listener - The event listener function
   * @returns {Function} Unsubscribe function
   */
  once(_eventName, _listener) {
    throw new Error('IEventEmitter.once must be implemented');
  },

  /**
   * Remove an event listener
   * @param {string} _eventName - The name of the event
   * @param {Function} _listener - The event listener function
   */
  off(_eventName, _listener) {
    throw new Error('IEventEmitter.off must be implemented');
  },

  /**
   * Emit an event
   * @param {string} _eventName - The name of the event
   * @param {...any} _args - Arguments to pass to listeners
   */
  emit(_eventName, ..._args) {
    throw new Error('IEventEmitter.emit must be implemented');
  },

  /**
   * Remove all listeners for an event or all events
   * @param {string} [_eventName] - The name of the event (optional)
   */
  removeAllListeners(_eventName) {
    throw new Error('IEventEmitter.removeAllListeners must be implemented');
  }
};

/**
 * Simple event emitter implementation
 */
export class EventEmitter {
  constructor() {
    this._events = new Map();
    this._maxListeners = 10;
  }

  /**
   * Register an event listener
   * @param {string} eventName - The name of the event
   * @param {Function} listener - The event listener function
   * @returns {Function} Unsubscribe function
   */
  on(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }

    if (!this._events.has(eventName)) {
      this._events.set(eventName, []);
    }

    const listeners = this._events.get(eventName);

    // Warn if too many listeners
    if (listeners.length >= this._maxListeners) {
      // eslint-disable-next-line no-console
      console.warn(
        `Warning: Possible EventEmitter memory leak detected. ${listeners.length + 1} listeners added for event "${eventName}". Use setMaxListeners() to increase limit.`
      );
    }

    listeners.push(listener);

    // Return unsubscribe function
    return () => this.off(eventName, listener);
  }

  /**
   * Register a one-time event listener
   * @param {string} eventName - The name of the event
   * @param {Function} listener - The event listener function
   * @returns {Function} Unsubscribe function
   */
  once(eventName, listener) {
    const onceWrapper = (...args) => {
      this.off(eventName, onceWrapper);
      listener.apply(this, args);
    };

    return this.on(eventName, onceWrapper);
  }

  /**
   * Remove an event listener
   * @param {string} eventName - The name of the event
   * @param {Function} listener - The event listener function
   */
  off(eventName, listener) {
    if (!this._events.has(eventName)) {
      return;
    }

    const listeners = this._events.get(eventName);
    const index = listeners.indexOf(listener);

    if (index !== -1) {
      listeners.splice(index, 1);

      // Clean up empty event arrays
      if (listeners.length === 0) {
        this._events.delete(eventName);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} eventName - The name of the event
   * @param {...any} args - Arguments to pass to listeners
   * @returns {boolean} True if there were listeners
   */
  emit(eventName, ...args) {
    if (!this._events.has(eventName)) {
      return false;
    }

    const listeners = this._events.get(eventName).slice(); // Copy to avoid issues with modifications during emit

    for (const listener of listeners) {
      try {
        listener.apply(this, args);
      } catch (error) {
        // Don't let listener errors break the emit process
        // eslint-disable-next-line no-console
        console.error(`Error in event listener for "${eventName}":`, error);
      }
    }

    return listeners.length > 0;
  }

  /**
   * Remove all listeners for an event or all events
   * @param {string} [eventName] - The name of the event (optional)
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this._events.delete(eventName);
    } else {
      this._events.clear();
    }
  }

  /**
   * Set the maximum number of listeners per event
   * @param {number} n - Maximum number of listeners
   */
  setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0) {
      throw new TypeError('n must be a non-negative number');
    }
    this._maxListeners = n;
  }

  /**
   * Get the maximum number of listeners per event
   * @returns {number} Maximum number of listeners
   */
  getMaxListeners() {
    return this._maxListeners;
  }

  /**
   * Get the current listener count for an event
   * @param {string} eventName - The name of the event
   * @returns {number} Number of listeners
   */
  listenerCount(eventName) {
    return this._events.has(eventName) ? this._events.get(eventName).length : 0;
  }

  /**
   * Get all event names that have listeners
   * @returns {string[]} Array of event names
   */
  eventNames() {
    return Array.from(this._events.keys());
  }
}

/**
 * Event types for SidepanelFallback lifecycle
 */
export const EVENTS = {
  // Initialization events
  BEFORE_INIT: 'beforeInit',
  AFTER_INIT: 'afterInit',
  INIT_ERROR: 'initError',

  // Panel operation events
  BEFORE_OPEN_PANEL: 'beforeOpenPanel',
  AFTER_OPEN_PANEL: 'afterOpenPanel',
  PANEL_OPEN_ERROR: 'panelOpenError',

  // Settings events
  BEFORE_SETTINGS_CHANGE: 'beforeSettingsChange',
  AFTER_SETTINGS_CHANGE: 'afterSettingsChange',
  SETTINGS_ERROR: 'settingsError',

  // Mode change events
  MODE_CHANGED: 'modeChanged',

  // Browser detection events
  BROWSER_DETECTED: 'browserDetected',

  // Storage events
  STORAGE_READ: 'storageRead',
  STORAGE_WRITE: 'storageWrite',
  STORAGE_ERROR: 'storageError',

  // Debug events
  DEBUG: 'debug',
  ERROR: 'error',
  WARNING: 'warning'
};

/**
 * Create debugging event data
 * @param {string} operation - The operation being performed
 * @param {Object} context - Additional context data
 * @returns {Object} Debug event data
 */
export function createDebugEvent(operation, context = {}) {
  return {
    timestamp: new Date().toISOString(),
    operation,
    context
  };
}

/**
 * Create error event data
 * @param {Error} error - The error that occurred
 * @param {string} operation - The operation that failed
 * @param {Object} context - Additional context data
 * @returns {Object} Error event data
 */
export function createErrorEvent(error, operation, context = {}) {
  return {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    operation,
    context
  };
}

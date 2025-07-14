/**
 * Standard error object for SidepanelFallback operations
 */
export class SidepanelError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'SidepanelError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error codes for different types of failures
 */
export const ErrorCodes = {
  // Initialization errors
  INIT_FAILED: 'INIT_FAILED',
  BROWSER_DETECTION_FAILED: 'BROWSER_DETECTION_FAILED',
  STORAGE_INIT_FAILED: 'STORAGE_INIT_FAILED',

  // Input validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_BROWSER: 'INVALID_BROWSER',
  INVALID_MODE: 'INVALID_MODE',
  INVALID_PATH: 'INVALID_PATH',
  INVALID_CONTAINER: 'INVALID_CONTAINER',

  // Operation errors
  NOT_INITIALIZED: 'NOT_INITIALIZED',
  PANEL_OPEN_FAILED: 'PANEL_OPEN_FAILED',
  STORAGE_OPERATION_FAILED: 'STORAGE_OPERATION_FAILED',
  UI_CREATION_FAILED: 'UI_CREATION_FAILED',

  // Browser/API errors
  SIDEPANEL_API_UNAVAILABLE: 'SIDEPANEL_API_UNAVAILABLE',
  POPUP_BLOCKED: 'POPUP_BLOCKED',
  EXTENSION_CONTEXT_INVALID: 'EXTENSION_CONTEXT_INVALID'
};

/**
 * Create a standardized error result object
 * @param {string} code - Error code from ErrorCodes
 * @param {string} message - Human-readable error message
 * @param {object} context - Additional context information
 * @returns {object} Standardized error result
 */
export function createErrorResult(code, message, context = {}) {
  return {
    success: false,
    error: message,
    errorCode: code,
    context: {
      ...context,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Create a standardized success result object
 * @param {object} data - Success data
 * @param {object} metadata - Additional metadata
 * @returns {object} Standardized success result
 */
export function createSuccessResult(data = {}, metadata = {}) {
  return {
    success: true,
    ...data,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Configuration validation and management for SidepanelFallback
 */

import { ErrorCodes, createErrorResult } from './errorHandling.js';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  defaultMode: 'auto',
  userAgent: null,
  storagePrefix: 'sidepanel-fallback-mode-',
  enableDebugMode: false,
  validModes: ['sidepanel', 'window', 'auto'],
  supportedBrowsers: ['chrome', 'firefox', 'safari', 'edge', 'dia']
};

/**
 * Configuration schema for validation
 */
export const CONFIG_SCHEMA = {
  defaultMode: {
    type: 'string',
    required: false,
    validValues: DEFAULT_CONFIG.validModes,
    description: 'Default display mode when no saved preference exists'
  },
  userAgent: {
    type: 'string',
    required: false,
    allowNull: true,
    description: 'Custom user agent string for browser detection'
  },
  storagePrefix: {
    type: 'string',
    required: false,
    minLength: 1,
    description: 'Prefix for localStorage keys'
  },
  enableDebugMode: {
    type: 'boolean',
    required: false,
    description: 'Enable debug logging and additional context'
  }
};

/**
 * Validate a configuration value against its schema
 * @param {string} key - Configuration key
 * @param {any} value - Value to validate
 * @param {object} schema - Schema definition for the key
 * @returns {object} Validation result with success/error information
 */
function validateConfigValue(key, value, schema) {
  // Handle optional values
  if (value === undefined) {
    if (schema.required) {
      return createErrorResult(ErrorCodes.INVALID_INPUT, `Configuration key '${key}' is required`, {
        key,
        schema
      });
    }
    return { success: true };
  }

  // Handle null values
  if (value === null) {
    if (!schema.allowNull) {
      return createErrorResult(
        ErrorCodes.INVALID_INPUT,
        `Configuration key '${key}' cannot be null`,
        { key, value, schema }
      );
    }
    return { success: true };
  }

  // Type validation
  if (typeof value !== schema.type) {
    return createErrorResult(
      ErrorCodes.INVALID_INPUT,
      `Configuration key '${key}' must be of type ${schema.type}, got ${typeof value}`,
      { key, value, expectedType: schema.type, actualType: typeof value }
    );
  }

  // String-specific validations
  if (schema.type === 'string') {
    if (schema.minLength && value.length < schema.minLength) {
      return createErrorResult(
        ErrorCodes.INVALID_INPUT,
        `Configuration key '${key}' must be at least ${schema.minLength} characters long`,
        { key, value, minLength: schema.minLength, actualLength: value.length }
      );
    }

    if (schema.validValues && !schema.validValues.includes(value)) {
      return createErrorResult(
        ErrorCodes.INVALID_INPUT,
        `Configuration key '${key}' must be one of: ${schema.validValues.join(', ')}`,
        { key, value, validValues: schema.validValues }
      );
    }
  }

  return { success: true };
}

/**
 * Validate a complete configuration object
 * @param {object} config - Configuration object to validate
 * @returns {object} Validation result with success/error information
 */
export function validateConfiguration(config) {
  if (!config || typeof config !== 'object') {
    return createErrorResult(ErrorCodes.INVALID_INPUT, 'Configuration must be an object', {
      providedConfig: config
    });
  }

  const errors = [];

  // Validate each provided configuration key
  for (const [key, value] of Object.entries(config)) {
    const schema = CONFIG_SCHEMA[key];

    if (!schema) {
      errors.push({
        key,
        error: `Unknown configuration key '${key}'`,
        validKeys: Object.keys(CONFIG_SCHEMA)
      });
      continue;
    }

    const validation = validateConfigValue(key, value, schema);
    if (!validation.success) {
      errors.push({
        key,
        error: validation.error,
        context: validation.context
      });
    }
  }

  if (errors.length > 0) {
    return createErrorResult(
      ErrorCodes.INVALID_INPUT,
      `Configuration validation failed: ${errors.length} error(s)`,
      { errors, providedConfig: config }
    );
  }

  return { success: true };
}

/**
 * Merge user configuration with defaults and validate
 * @param {object} userConfig - User-provided configuration
 * @returns {object} Result containing merged config or error information
 */
export function createValidatedConfig(userConfig = {}) {
  // Validate user configuration
  const validation = validateConfiguration(userConfig);
  if (!validation.success) {
    return validation;
  }

  // Merge with defaults
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...userConfig
  };

  return {
    success: true,
    config: mergedConfig,
    metadata: {
      userProvidedKeys: Object.keys(userConfig),
      defaultKeys: Object.keys(DEFAULT_CONFIG),
      finalKeys: Object.keys(mergedConfig)
    }
  };
}

/**
 * Get configuration documentation
 * @returns {object} Documentation for all configuration options
 */
export function getConfigurationDocs() {
  const docs = {};

  for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
    docs[key] = {
      type: schema.type,
      required: schema.required || false,
      default: DEFAULT_CONFIG[key],
      description: schema.description,
      validValues: schema.validValues || null,
      constraints: {
        allowNull: schema.allowNull || false,
        minLength: schema.minLength || null
      }
    };
  }

  return docs;
}

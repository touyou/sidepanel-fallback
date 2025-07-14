/**
 * Result normalization utilities for backward compatibility
 * This module provides a bridge between new structured results and legacy expectations
 */

/**
 * Normalize a result to be backward compatible with existing tests
 * @param {object} result - Result from createSuccessResult or createErrorResult
 * @param {string} type - Type of result: 'openPanel', 'init', 'settings', 'simple'
 * @returns {object} Normalized result
 */
export function normalizeResult(result, type = 'simple') {
  if (!result || typeof result !== 'object') {
    return result;
  }

  // For backward compatibility, extract core data and flatten structure
  switch (type) {
    case 'openPanel':
      return normalizeOpenPanelResult(result);
    case 'init':
      return normalizeInitResult(result);
    case 'settings':
      return normalizeSettingsResult(result);
    default:
      return normalizeSimpleResult(result);
  }
}

/**
 * Normalize openPanel results for backward compatibility
 * @param {object} result - Structured result
 * @returns {object} Legacy format result
 */
function normalizeOpenPanelResult(result) {
  if (!result.success) {
    // Error case: extract just success, error (and errorCode if needed for new tests)
    return {
      success: false,
      error: result.error
    };
  }

  // Success case: extract method, success, fallback
  const normalized = {
    success: true,
    method: result.method
  };

  // Add fallback only if it exists and is true
  if (result.fallback === true) {
    normalized.fallback = true;
  }

  return normalized;
}

/**
 * Normalize init results for backward compatibility
 * @param {object} result - Structured result
 * @returns {object} Legacy format result
 */
function normalizeInitResult(result) {
  if (!result.success) {
    throw new Error(result.error);
  }

  // Return success along with browser and mode data
  return {
    success: true,
    browser: result.browser,
    mode: result.mode
  };
}

/**
 * Normalize settings UI results for backward compatibility
 * @param {object} result - Structured result
 * @returns {object} Legacy format result
 */
function normalizeSettingsResult(result) {
  // Settings UI results are already in expected format
  return {
    success: result.success,
    ...(result.error && { error: result.error })
  };
}

/**
 * Normalize simple results (general case)
 * @param {object} result - Structured result
 * @returns {object} Legacy format result
 */
function normalizeSimpleResult(result) {
  // Extract core success/error structure
  const normalized = { success: result.success };

  if (!result.success && result.error) {
    normalized.error = result.error;
  }

  return normalized;
}

/**
 * Check if a result needs normalization (has metadata/context structure)
 * @param {object} result - Result to check
 * @returns {boolean} True if normalization is needed
 */
export function needsNormalization(result) {
  return (
    result &&
    typeof result === 'object' &&
    (result.hasOwnProperty('metadata') || result.hasOwnProperty('context'))
  );
}

/**
 * Smart wrapper that normalizes only when needed
 * @param {object} result - Result to potentially normalize
 * @param {string} type - Type of result
 * @returns {object} Normalized or original result
 */
export function smartNormalize(result, type = 'simple') {
  return needsNormalization(result) ? normalizeResult(result, type) : result;
}

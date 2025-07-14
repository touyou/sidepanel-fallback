const {
  DEFAULT_CONFIG,
  CONFIG_SCHEMA,
  validateConfiguration,
  createValidatedConfig,
  getConfigurationDocs
} = require('../src/configValidation.js');

describe('configValidation', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_CONFIG.defaultMode).toBe('auto');
      expect(DEFAULT_CONFIG.userAgent).toBeNull();
      expect(DEFAULT_CONFIG.storagePrefix).toBe('sidepanel-fallback-mode-');
      expect(DEFAULT_CONFIG.enableDebugMode).toBe(false);
      expect(DEFAULT_CONFIG.validModes).toEqual(['sidepanel', 'window', 'auto']);
      expect(DEFAULT_CONFIG.supportedBrowsers).toEqual(['chrome', 'firefox', 'safari', 'edge', 'dia']);
    });
  });

  describe('CONFIG_SCHEMA', () => {
    it('should have schema for all config keys', () => {
      expect(CONFIG_SCHEMA.defaultMode).toBeDefined();
      expect(CONFIG_SCHEMA.userAgent).toBeDefined();
      expect(CONFIG_SCHEMA.storagePrefix).toBeDefined();
      expect(CONFIG_SCHEMA.enableDebugMode).toBeDefined();
    });
  });

  describe('validateConfiguration', () => {
    it('should accept valid configuration', () => {
      const config = {
        defaultMode: 'sidepanel',
        enableDebugMode: true
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(true);
    });

    it('should reject non-object configuration', () => {
      const result = validateConfiguration('not an object');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Configuration must be an object');
    });

    it('should reject null configuration', () => {
      const result = validateConfiguration(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Configuration must be an object');
    });

    it('should reject unknown configuration keys', () => {
      const config = {
        unknownKey: 'value'
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Configuration validation failed');
      expect(result.context.errors[0].error).toContain("Unknown configuration key 'unknownKey'");
    });

    it('should reject invalid mode values', () => {
      const config = {
        defaultMode: 'invalid-mode'
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(false);
      expect(result.context.errors[0].error).toContain('must be one of: sidepanel, window, auto');
    });

    it('should reject invalid type for mode', () => {
      const config = {
        defaultMode: 123
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(false);
      expect(result.context.errors[0].error).toContain('must be of type string, got number');
    });

    it('should reject invalid type for enableDebugMode', () => {
      const config = {
        enableDebugMode: 'not-boolean'
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(false);
      expect(result.context.errors[0].error).toContain('must be of type boolean, got string');
    });

    it('should reject empty string for storagePrefix', () => {
      const config = {
        storagePrefix: ''
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(false);
      expect(result.context.errors[0].error).toContain('must be at least 1 characters long');
    });

    it('should accept null userAgent', () => {
      const config = {
        userAgent: null
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(true);
    });

    it('should accept valid userAgent string', () => {
      const config = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(true);
    });

    it('should reject invalid type for userAgent', () => {
      const config = {
        userAgent: 123
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(false);
      expect(result.context.errors[0].error).toContain('must be of type string, got number');
    });

    it('should accept undefined values for optional fields', () => {
      const config = {
        defaultMode: undefined,
        userAgent: undefined
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(true);
    });

    it('should handle multiple validation errors', () => {
      const config = {
        defaultMode: 'invalid',
        enableDebugMode: 'not-boolean',
        unknownKey: 'value'
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(false);
      expect(result.context.errors).toHaveLength(3);
    });

    it('should test required field validation path', () => {
      // Create a mock schema with required field to test the required path
      const { validateConfiguration: originalValidateConfig } = require('../src/configValidation.js');
      
      // Test with required field missing (undefined) - this triggers the required validation branch
      const CONFIG_SCHEMA_WITH_REQUIRED = {
        requiredField: {
          type: 'string',
          required: true,
          description: 'A required field for testing'
        }
      };
      
      // Mock the CONFIG_SCHEMA temporarily
      const originalSchema = require('../src/configValidation.js').CONFIG_SCHEMA;
      Object.assign(originalSchema, CONFIG_SCHEMA_WITH_REQUIRED);
      
      const config = {
        requiredField: undefined // This should trigger the required validation branch
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(false);
      expect(result.context.errors[0].error).toContain("Configuration key 'requiredField' is required");
      
      // Clean up - remove the mock field
      delete originalSchema.requiredField;
    });

    it('should handle null values for fields that do not allow null', () => {
      const config = {
        storagePrefix: null // storagePrefix doesn't allow null
      };
      
      const result = validateConfiguration(config);
      expect(result.success).toBe(false);
      expect(result.context.errors[0].error).toContain("Configuration key 'storagePrefix' cannot be null");
    });
  });

  describe('createValidatedConfig', () => {
    it('should merge user config with defaults', () => {
      const userConfig = {
        defaultMode: 'sidepanel',
        enableDebugMode: true
      };
      
      const result = createValidatedConfig(userConfig);
      expect(result.success).toBe(true);
      expect(result.config.defaultMode).toBe('sidepanel');
      expect(result.config.enableDebugMode).toBe(true);
      expect(result.config.userAgent).toBeNull(); // from defaults
      expect(result.config.storagePrefix).toBe('sidepanel-fallback-mode-'); // from defaults
    });

    it('should work with empty config', () => {
      const result = createValidatedConfig({});
      expect(result.success).toBe(true);
      expect(result.config).toEqual(DEFAULT_CONFIG);
      expect(result.metadata.userProvidedKeys).toEqual([]);
    });

    it('should work with no config (undefined)', () => {
      const result = createValidatedConfig();
      expect(result.success).toBe(true);
      expect(result.config).toEqual(DEFAULT_CONFIG);
    });

    it('should return validation error for invalid config', () => {
      const userConfig = {
        defaultMode: 'invalid-mode'
      };
      
      const result = createValidatedConfig(userConfig);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Configuration validation failed');
    });

    it('should include metadata about keys', () => {
      const userConfig = {
        defaultMode: 'window'
      };
      
      const result = createValidatedConfig(userConfig);
      expect(result.success).toBe(true);
      expect(result.metadata.userProvidedKeys).toEqual(['defaultMode']);
      expect(result.metadata.defaultKeys).toEqual(Object.keys(DEFAULT_CONFIG));
      expect(result.metadata.finalKeys).toEqual(Object.keys(result.config));
    });
  });

  describe('getConfigurationDocs', () => {
    it('should return documentation for all config options', () => {
      const docs = getConfigurationDocs();
      
      expect(docs.defaultMode).toBeDefined();
      expect(docs.defaultMode.type).toBe('string');
      expect(docs.defaultMode.default).toBe('auto');
      expect(docs.defaultMode.description).toBeDefined();
      expect(docs.defaultMode.validValues).toEqual(['sidepanel', 'window', 'auto']);
    });

    it('should include constraints for each option', () => {
      const docs = getConfigurationDocs();
      
      expect(docs.userAgent.constraints.allowNull).toBe(true);
      expect(docs.storagePrefix.constraints.minLength).toBe(1);
    });

    it('should mark all fields as non-required', () => {
      const docs = getConfigurationDocs();
      
      Object.values(docs).forEach(doc => {
        expect(doc.required).toBe(false);
      });
    });

    it('should handle fields without validValues', () => {
      const docs = getConfigurationDocs();
      
      expect(docs.userAgent.validValues).toBeNull();
      expect(docs.enableDebugMode.validValues).toBeNull();
    });
  });
});
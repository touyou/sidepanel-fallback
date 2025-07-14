const { SidepanelError, ErrorCodes, createErrorResult, createSuccessResult } = require('../src/errorHandling.js');

describe('ErrorHandling', () => {
  describe('SidepanelError', () => {
    it('should create error with message and code', () => {
      const error = new SidepanelError('Test message', 'TEST_CODE');
      
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('SidepanelError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.context).toEqual({});
      expect(error.timestamp).toBeDefined();
      expect(error instanceof Error).toBe(true);
    });

    it('should create error with context', () => {
      const context = { userId: 123, action: 'test' };
      const error = new SidepanelError('Test message', 'TEST_CODE', context);
      
      expect(error.context).toEqual(context);
    });

    it('should include timestamp', () => {
      const before = new Date().toISOString();
      const error = new SidepanelError('Test message', 'TEST_CODE');
      const after = new Date().toISOString();
      
      expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(error.timestamp >= before).toBe(true);
      expect(error.timestamp <= after).toBe(true);
    });
  });

  describe('ErrorCodes', () => {
    it('should have all required error codes', () => {
      expect(ErrorCodes.INIT_FAILED).toBe('INIT_FAILED');
      expect(ErrorCodes.BROWSER_DETECTION_FAILED).toBe('BROWSER_DETECTION_FAILED');
      expect(ErrorCodes.STORAGE_INIT_FAILED).toBe('STORAGE_INIT_FAILED');
      expect(ErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ErrorCodes.INVALID_BROWSER).toBe('INVALID_BROWSER');
      expect(ErrorCodes.INVALID_MODE).toBe('INVALID_MODE');
      expect(ErrorCodes.INVALID_PATH).toBe('INVALID_PATH');
      expect(ErrorCodes.INVALID_CONTAINER).toBe('INVALID_CONTAINER');
      expect(ErrorCodes.NOT_INITIALIZED).toBe('NOT_INITIALIZED');
      expect(ErrorCodes.PANEL_OPEN_FAILED).toBe('PANEL_OPEN_FAILED');
      expect(ErrorCodes.STORAGE_OPERATION_FAILED).toBe('STORAGE_OPERATION_FAILED');
      expect(ErrorCodes.UI_CREATION_FAILED).toBe('UI_CREATION_FAILED');
      expect(ErrorCodes.SIDEPANEL_API_UNAVAILABLE).toBe('SIDEPANEL_API_UNAVAILABLE');
      expect(ErrorCodes.POPUP_BLOCKED).toBe('POPUP_BLOCKED');
      expect(ErrorCodes.EXTENSION_CONTEXT_INVALID).toBe('EXTENSION_CONTEXT_INVALID');
    });
  });

  describe('createErrorResult', () => {
    it('should create error result with required fields', () => {
      const result = createErrorResult('TEST_CODE', 'Test message');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test message');
      expect(result.errorCode).toBe('TEST_CODE');
      expect(result.context).toBeDefined();
      expect(result.context.timestamp).toBeDefined();
    });

    it('should create error result with context', () => {
      const context = { userId: 123, action: 'test' };
      const result = createErrorResult('TEST_CODE', 'Test message', context);
      
      expect(result.context.userId).toBe(123);
      expect(result.context.action).toBe('test');
      expect(result.context.timestamp).toBeDefined();
    });

    it('should include timestamp in context', () => {
      const before = new Date().toISOString();
      const result = createErrorResult('TEST_CODE', 'Test message');
      const after = new Date().toISOString();
      
      expect(result.context.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.context.timestamp >= before).toBe(true);
      expect(result.context.timestamp <= after).toBe(true);
    });
  });

  describe('createSuccessResult', () => {
    it('should create success result with default values', () => {
      const result = createSuccessResult();
      
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should create success result with data', () => {
      const data = { userId: 123, action: 'completed' };
      const result = createSuccessResult(data);
      
      expect(result.success).toBe(true);
      expect(result.userId).toBe(123);
      expect(result.action).toBe('completed');
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should create success result with metadata', () => {
      const metadata = { version: '1.0.0', source: 'test' };
      const result = createSuccessResult({}, metadata);
      
      expect(result.success).toBe(true);
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.metadata.source).toBe('test');
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should include timestamp in metadata', () => {
      const before = new Date().toISOString();
      const result = createSuccessResult();
      const after = new Date().toISOString();
      
      expect(result.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.metadata.timestamp >= before).toBe(true);
      expect(result.metadata.timestamp <= after).toBe(true);
    });
  });
});
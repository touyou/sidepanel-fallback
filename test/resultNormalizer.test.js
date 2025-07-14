const {
  normalizeResult,
  needsNormalization,
  smartNormalize
} = require('../src/resultNormalizer.js');

describe('resultNormalizer', () => {
  describe('normalizeResult', () => {
    describe('openPanel type', () => {
      it('should normalize successful openPanel result', () => {
        const result = {
          success: true,
          method: 'sidepanel',
          metadata: { timestamp: '2023-01-01' }
        };
        
        const normalized = normalizeResult(result, 'openPanel');
        expect(normalized).toEqual({
          success: true,
          method: 'sidepanel'
        });
      });

      it('should normalize successful openPanel result with fallback', () => {
        const result = {
          success: true,
          method: 'window',
          fallback: true,
          metadata: { timestamp: '2023-01-01' }
        };
        
        const normalized = normalizeResult(result, 'openPanel');
        expect(normalized).toEqual({
          success: true,
          method: 'window',
          fallback: true
        });
      });

      it('should normalize failed openPanel result', () => {
        const result = {
          success: false,
          error: 'Panel open failed',
          errorCode: 'PANEL_OPEN_FAILED',
          context: { details: 'some context' }
        };
        
        const normalized = normalizeResult(result, 'openPanel');
        expect(normalized).toEqual({
          success: false,
          error: 'Panel open failed'
        });
      });

      it('should not include fallback if false', () => {
        const result = {
          success: true,
          method: 'sidepanel',
          fallback: false,
          metadata: { timestamp: '2023-01-01' }
        };
        
        const normalized = normalizeResult(result, 'openPanel');
        expect(normalized).toEqual({
          success: true,
          method: 'sidepanel'
        });
      });
    });

    describe('init type', () => {
      it('should normalize successful init result', () => {
        const result = {
          success: true,
          browser: 'chrome',
          mode: 'auto',
          metadata: { timestamp: '2023-01-01' }
        };
        
        const normalized = normalizeResult(result, 'init');
        expect(normalized).toEqual({
          success: true,
          browser: 'chrome',
          mode: 'auto'
        });
      });

      it('should throw error for failed init result', () => {
        const result = {
          success: false,
          error: 'Initialization failed',
          context: { details: 'some context' }
        };
        
        expect(() => normalizeResult(result, 'init')).toThrow('Initialization failed');
      });
    });

    describe('settings type', () => {
      it('should normalize successful settings result', () => {
        const result = {
          success: true,
          metadata: { timestamp: '2023-01-01' }
        };
        
        const normalized = normalizeResult(result, 'settings');
        expect(normalized).toEqual({
          success: true
        });
      });

      it('should normalize failed settings result', () => {
        const result = {
          success: false,
          error: 'Settings error',
          context: { details: 'some context' }
        };
        
        const normalized = normalizeResult(result, 'settings');
        expect(normalized).toEqual({
          success: false,
          error: 'Settings error'
        });
      });
    });

    describe('simple type (default)', () => {
      it('should normalize successful simple result', () => {
        const result = {
          success: true,
          metadata: { timestamp: '2023-01-01' }
        };
        
        const normalized = normalizeResult(result, 'simple');
        expect(normalized).toEqual({
          success: true
        });
      });

      it('should normalize failed simple result', () => {
        const result = {
          success: false,
          error: 'Some error',
          context: { details: 'some context' }
        };
        
        const normalized = normalizeResult(result, 'simple');
        expect(normalized).toEqual({
          success: false,
          error: 'Some error'
        });
      });

      it('should use simple type as default', () => {
        const result = {
          success: true,
          metadata: { timestamp: '2023-01-01' }
        };
        
        const normalized = normalizeResult(result);
        expect(normalized).toEqual({
          success: true
        });
      });
    });

    it('should handle non-object input', () => {
      expect(normalizeResult('string')).toBe('string');
      expect(normalizeResult(123)).toBe(123);
      expect(normalizeResult(null)).toBe(null);
      expect(normalizeResult(undefined)).toBe(undefined);
    });
  });

  describe('needsNormalization', () => {
    it('should return true for objects with metadata', () => {
      const result = {
        success: true,
        metadata: { timestamp: '2023-01-01' }
      };
      
      expect(needsNormalization(result)).toBe(true);
    });

    it('should return true for objects with context', () => {
      const result = {
        success: false,
        error: 'Error message',
        context: { details: 'some context' }
      };
      
      expect(needsNormalization(result)).toBe(true);
    });

    it('should return false for simple objects', () => {
      const result = {
        success: true,
        method: 'sidepanel'
      };
      
      expect(needsNormalization(result)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(needsNormalization('string')).toBe(false);
      expect(needsNormalization(123)).toBe(false);
      expect(needsNormalization(null)).toBeFalsy();
      expect(needsNormalization(undefined)).toBeFalsy();
    });
  });

  describe('smartNormalize', () => {
    it('should normalize when needed', () => {
      const result = {
        success: true,
        method: 'sidepanel',
        metadata: { timestamp: '2023-01-01' }
      };
      
      const normalized = smartNormalize(result, 'openPanel');
      expect(normalized).toEqual({
        success: true,
        method: 'sidepanel'
      });
    });

    it('should return original when normalization not needed', () => {
      const result = {
        success: true,
        method: 'sidepanel'
      };
      
      const normalized = smartNormalize(result, 'openPanel');
      expect(normalized).toBe(result);
    });

    it('should use simple type as default', () => {
      const result = {
        success: true,
        metadata: { timestamp: '2023-01-01' }
      };
      
      const normalized = smartNormalize(result);
      expect(normalized).toEqual({
        success: true
      });
    });
  });
});
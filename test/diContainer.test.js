const {
  IStorageProvider,
  IPanelLauncher,
  ISettingsUI,
  IBrowserDetector,
  DefaultStorageProvider,
  DefaultPanelLauncher,
  DefaultSettingsUI,
  DefaultBrowserDetector,
  DefaultEventEmitter,
  DIContainer,
  container
} = require('../src/diContainer.js');

describe('DIContainer', () => {
  describe('Interface classes', () => {
    describe('IStorageProvider', () => {
      it('should throw error for unimplemented setMode', async () => {
        const provider = new IStorageProvider();
        await expect(provider.setMode('chrome', 'sidepanel')).rejects.toThrow('setMode must be implemented by storage provider');
      });

      it('should throw error for unimplemented getMode', async () => {
        const provider = new IStorageProvider();
        await expect(provider.getMode('chrome')).rejects.toThrow('getMode must be implemented by storage provider');
      });

      it('should throw error for unimplemented clear', async () => {
        const provider = new IStorageProvider();
        await expect(provider.clear()).rejects.toThrow('clear must be implemented by storage provider');
      });
    });

    describe('IPanelLauncher', () => {
      it('should throw error for unimplemented openPanel', async () => {
        const launcher = new IPanelLauncher();
        await expect(launcher.openPanel('sidepanel', '/test')).rejects.toThrow('openPanel must be implemented by panel launcher');
      });

      it('should throw error for unimplemented isExtensionContext', () => {
        const launcher = new IPanelLauncher();
        expect(() => launcher.isExtensionContext()).toThrow('isExtensionContext must be implemented by panel launcher');
      });
    });

    describe('ISettingsUI', () => {
      it('should throw error for unimplemented createSettingsPanel', () => {
        const ui = new ISettingsUI();
        expect(() => ui.createSettingsPanel({}, () => {})).toThrow('createSettingsPanel must be implemented by settings UI');
      });
    });

    describe('IBrowserDetector', () => {
      it('should throw error for unimplemented getBrowserInfo', () => {
        const detector = new IBrowserDetector();
        expect(() => detector.getBrowserInfo('test-user-agent')).toThrow('getBrowserInfo must be implemented by browser detector');
      });
    });
  });

  describe('Default implementations', () => {
    describe('DefaultStorageProvider', () => {
      it('should create instance with ModeStorage', () => {
        const provider = new DefaultStorageProvider();
        expect(provider).toBeInstanceOf(DefaultStorageProvider);
        expect(provider).toBeInstanceOf(IStorageProvider);
        expect(provider._storage).toBeDefined();
      });

      it('should delegate setMode to internal storage', async () => {
        const provider = new DefaultStorageProvider();
        provider._storage.setMode = jest.fn().mockResolvedValue(undefined);
        
        await provider.setMode('chrome', 'sidepanel');
        expect(provider._storage.setMode).toHaveBeenCalledWith('chrome', 'sidepanel');
      });

      it('should delegate getMode to internal storage', async () => {
        const provider = new DefaultStorageProvider();
        provider._storage.getMode = jest.fn().mockResolvedValue('sidepanel');
        
        const result = await provider.getMode('chrome');
        expect(provider._storage.getMode).toHaveBeenCalledWith('chrome');
        expect(result).toBe('sidepanel');
      });

      it('should delegate clear to internal storage', async () => {
        const provider = new DefaultStorageProvider();
        provider._storage.clear = jest.fn().mockResolvedValue(undefined);
        
        await provider.clear();
        expect(provider._storage.clear).toHaveBeenCalled();
      });
    });

    describe('DefaultPanelLauncher', () => {
      it('should create instance with PanelLauncher', () => {
        const launcher = new DefaultPanelLauncher();
        expect(launcher).toBeInstanceOf(DefaultPanelLauncher);
        expect(launcher).toBeInstanceOf(IPanelLauncher);
        expect(launcher._launcher).toBeDefined();
      });

      it('should delegate openPanel to internal launcher', async () => {
        const launcher = new DefaultPanelLauncher();
        launcher._launcher.openPanel = jest.fn().mockResolvedValue({ success: true });
        
        const result = await launcher.openPanel('sidepanel', '/test');
        expect(launcher._launcher.openPanel).toHaveBeenCalledWith('sidepanel', '/test');
        expect(result).toEqual({ success: true });
      });

      it('should delegate isExtensionContext to internal launcher', () => {
        const launcher = new DefaultPanelLauncher();
        launcher._launcher.isExtensionContext = jest.fn().mockReturnValue(true);
        
        const result = launcher.isExtensionContext();
        expect(launcher._launcher.isExtensionContext).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });

    describe('DefaultSettingsUI', () => {
      it('should create instance with SettingsUI', () => {
        const ui = new DefaultSettingsUI();
        expect(ui).toBeInstanceOf(DefaultSettingsUI);
        expect(ui).toBeInstanceOf(ISettingsUI);
        expect(ui._ui).toBeDefined();
      });

      it('should delegate createSettingsPanel to internal UI', () => {
        const ui = new DefaultSettingsUI();
        const mockElement = { tagName: 'DIV' };
        ui._ui.createSettingsPanel = jest.fn().mockReturnValue(mockElement);
        
        const settings = { mode: 'sidepanel' };
        const callback = jest.fn();
        const result = ui.createSettingsPanel(settings, callback);
        
        expect(ui._ui.createSettingsPanel).toHaveBeenCalledWith(settings, callback);
        expect(result).toBe(mockElement);
      });
    });

    describe('DefaultBrowserDetector', () => {
      it('should create instance', () => {
        const detector = new DefaultBrowserDetector();
        expect(detector).toBeInstanceOf(DefaultBrowserDetector);
        expect(detector).toBeInstanceOf(IBrowserDetector);
      });

      it('should delegate getBrowserInfo to getBrowserInfo function', () => {
        const detector = new DefaultBrowserDetector();
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        
        const result = detector.getBrowserInfo(userAgent);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result).toBe('chrome');
      });
    });

    describe('DefaultEventEmitter', () => {
      it('should create instance extending EventEmitter', () => {
        const emitter = new DefaultEventEmitter();
        expect(emitter).toBeInstanceOf(DefaultEventEmitter);
        expect(typeof emitter.on).toBe('function');
        expect(typeof emitter.emit).toBe('function');
      });
    });
  });

  describe('DIContainer class', () => {
    let container;

    beforeEach(() => {
      container = new DIContainer();
    });

    it('should initialize with default providers', () => {
      expect(container.hasProvider('storage')).toBe(true);
      expect(container.hasProvider('launcher')).toBe(true);
      expect(container.hasProvider('settingsUI')).toBe(true);
      expect(container.hasProvider('browserDetector')).toBe(true);
      expect(container.hasProvider('eventEmitter')).toBe(true);
    });

    it('should register custom providers', () => {
      class CustomProvider {}
      container.registerProvider('custom', CustomProvider);
      
      expect(container.hasProvider('custom')).toBe(true);
    });

    it('should register singleton instances', () => {
      const instance = { test: 'value' };
      container.registerInstance('test', instance);
      
      const retrieved = container.get('test');
      expect(retrieved).toBe(instance);
    });

    it('should get singleton instances', () => {
      const instance1 = container.get('storage');
      const instance2 = container.get('storage');
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(DefaultStorageProvider);
    });

    it('should create fresh instances', () => {
      const instance1 = container.create('storage');
      const instance2 = container.create('storage');
      
      expect(instance1).not.toBe(instance2);
      expect(instance1).toBeInstanceOf(DefaultStorageProvider);
      expect(instance2).toBeInstanceOf(DefaultStorageProvider);
    });

    it('should throw error for unknown providers', () => {
      expect(() => container.get('unknown')).toThrow('No provider registered for service: unknown');
      expect(() => container.create('unknown')).toThrow('No provider registered for service: unknown');
    });

    it('should clear cached instances when provider changes', () => {
      const instance1 = container.get('storage');
      
      class NewStorageProvider extends IStorageProvider {}
      container.registerProvider('storage', NewStorageProvider);
      
      const instance2 = container.get('storage');
      expect(instance1).not.toBe(instance2);
      expect(instance2).toBeInstanceOf(NewStorageProvider);
    });

    it('should clear all cached instances', () => {
      const instance1 = container.get('storage');
      container.clear();
      const instance2 = container.get('storage');
      
      expect(instance1).not.toBe(instance2);
    });

    it('should get all service names', () => {
      const names = container.getServiceNames();
      expect(names).toContain('storage');
      expect(names).toContain('launcher');
      expect(names).toContain('settingsUI');
      expect(names).toContain('browserDetector');
      expect(names).toContain('eventEmitter');
    });
  });

  describe('Global container instance', () => {
    it('should export global container', () => {
      expect(container).toBeInstanceOf(DIContainer);
      expect(container.hasProvider('storage')).toBe(true);
    });
  });
});
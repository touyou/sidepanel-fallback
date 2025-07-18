import { SidepanelFallback } from '../src/index.js';

// 依存モジュールのモック
jest.mock('../src/browserInfo.js', () => ({
  getBrowserInfo: jest.fn()
}));

jest.mock('../src/modeStorage.js', () => ({
  ModeStorage: jest.fn().mockImplementation(() => ({
    getMode: jest.fn(),
    setMode: jest.fn()
  }))
}));

jest.mock('../src/panelLauncher.js', () => ({
  PanelLauncher: jest.fn().mockImplementation(() => ({
    openPanel: jest.fn(),
    setMode: jest.fn().mockResolvedValue({ success: true })
  }))
}));

jest.mock('../src/settingsUI.js', () => ({
  SettingsUI: jest.fn().mockImplementation(() => ({
    createSettingsPanel: jest.fn()
  }))
}));

import { getBrowserInfo } from '../src/browserInfo.js';
import { ModeStorage } from '../src/modeStorage.js';
import { PanelLauncher } from '../src/panelLauncher.js';
import { SettingsUI } from '../src/settingsUI.js';

describe('SidepanelFallback', () => {
  let mockStorage, mockLauncher, mockSettingsUI;

  beforeEach(() => {
    jest.clearAllMocks();

    // モックインスタンスを作成
    mockStorage = {
      getMode: jest.fn(),
      setMode: jest.fn()
    };
    mockLauncher = {
      openPanel: jest.fn(),
      setMode: jest.fn().mockResolvedValue({ success: true })
    };
    mockSettingsUI = {
      createSettingsPanel: jest.fn()
    };

    // コンストラクタのモックを設定
    ModeStorage.mockImplementation(() => mockStorage);
    PanelLauncher.mockImplementation(() => mockLauncher);
    SettingsUI.mockImplementation(() => mockSettingsUI);

    // デフォルトのブラウザ検出結果を設定
    getBrowserInfo.mockReturnValue('chrome');

    // グローバルnavigatorをモック
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/115.0.0.0'
    };

    // Clear any existing global caches
    if (typeof globalThis !== 'undefined' && globalThis.sidepanelFallbackInstance) {
      try {
        globalThis.sidepanelFallbackInstance.clearPerformanceCaches('all');
      } catch (_error) {
        // Ignore errors during cleanup
      }
    }
  });

  describe('init', () => {
    it('initializes successfully', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      mockStorage.getMode.mockResolvedValue('sidepanel');

      const fallback = new SidepanelFallback();
      const result = await fallback.init();

      expect(getBrowserInfo).toHaveBeenCalledWith(global.navigator.userAgent);
      expect(ModeStorage).toHaveBeenCalled();
      expect(mockStorage.getMode).toHaveBeenCalledWith('chrome');
      expect(result.browser).toBe('chrome');
      expect(result.mode).toBe('sidepanel');
    });

    it('uses default (auto) when mode is unset during initialization', async () => {
      getBrowserInfo.mockReturnValue('firefox');
      mockStorage.getMode.mockResolvedValue(null);

      const fallback = new SidepanelFallback({
        enableCaching: false, // Disable caching to avoid interference
        enableProgressiveInit: false // Disable progressive init for simpler testing
      });
      const result = await fallback.init();

      expect(result.browser).toBe('firefox');
      expect(result.mode).toBe('auto');
    });

    it('can initialize with custom settings', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      mockStorage.getMode.mockResolvedValue(null);

      const fallback = new SidepanelFallback({
        defaultMode: 'window',
        userAgent: 'Custom User Agent'
      });
      const result = await fallback.init();

      expect(getBrowserInfo).toHaveBeenCalledWith('Custom User Agent');
      expect(result.mode).toBe('window');
    });
  });

  describe('openPanel', () => {
    it('opens panel with configured mode', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      mockStorage.getMode.mockResolvedValue('sidepanel');
      mockLauncher.openPanel.mockResolvedValue({ success: true, method: 'sidepanel' });

      const fallback = new SidepanelFallback();
      await fallback.init();
      const result = await fallback.openPanel('/panel.html');

      expect(PanelLauncher).toHaveBeenCalled();
      expect(mockLauncher.openPanel).toHaveBeenCalledWith('sidepanel', '/panel.html', {});
      expect(result.success).toBe(true);
      expect(result.method).toBe('sidepanel');
    });

    it('selects mode based on browser in auto mode', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      mockStorage.getMode.mockResolvedValue('auto');
      mockLauncher.openPanel.mockResolvedValue({ success: true, method: 'sidepanel' });

      const fallback = new SidepanelFallback();
      await fallback.init();
      await fallback.openPanel('/panel.html');

      // Chromeの場合はsidepanelを選択
      expect(mockLauncher.openPanel).toHaveBeenCalledWith('sidepanel', '/panel.html', {});
    });

    it('selects window mode for Firefox in auto mode', async () => {
      getBrowserInfo.mockReturnValue('firefox');
      mockStorage.getMode.mockResolvedValue('auto');
      mockLauncher.openPanel.mockResolvedValue({ success: true, method: 'window' });

      const fallback = new SidepanelFallback({
        enableCaching: false, // Disable caching to avoid interference
        enableProgressiveInit: false // Disable progressive init for simpler testing
      });
      await fallback.init();
      await fallback.openPanel('/panel.html');

      // Firefoxの場合はwindowを選択
      expect(mockLauncher.openPanel).toHaveBeenCalledWith('window', '/panel.html', {});
    });

    it('returns error when openPanel is called before init', async () => {
      const fallback = new SidepanelFallback();
      const result = await fallback.openPanel('/panel.html');

      expect(result.success).toBe(false);
      expect(result.error).toBe('SidepanelFallback not initialized. Call init() first.');
    });

    it('returns error when openPanel is called without arguments', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      const mockStorage = new ModeStorage();
      mockStorage.getMode.mockResolvedValue('sidepanel');

      const fallback = new SidepanelFallback();
      await fallback.init();
      const result = await fallback.openPanel();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Panel path is required');
    });
  });

  describe('withSettingsUI', () => {
    it('creates settings UI and inserts into container', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      mockStorage.getMode.mockResolvedValue('sidepanel');
      const mockPanel = { className: 'settings-panel' };
      mockSettingsUI.createSettingsPanel.mockReturnValue(mockPanel);

      const mockContainer = {
        appendChild: jest.fn(),
        innerHTML: ''
      };

      const fallback = new SidepanelFallback();
      await fallback.init();
      const result = await fallback.withSettingsUI(mockContainer);

      expect(SettingsUI).toHaveBeenCalled();
      expect(mockSettingsUI.createSettingsPanel).toHaveBeenCalledWith(
        { mode: 'sidepanel' },
        expect.any(Function)
      );
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockPanel);
      expect(result.success).toBe(true);
    });

    it('saves to storage when settings are changed', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      mockStorage.getMode.mockResolvedValue('sidepanel');
      mockStorage.setMode.mockResolvedValue();
      mockSettingsUI.createSettingsPanel.mockReturnValue({ className: 'settings-panel' });

      const mockContainer = { appendChild: jest.fn() };

      const fallback = new SidepanelFallback();
      await fallback.init();
      await fallback.withSettingsUI(mockContainer);

      // createSettingsPanelに渡されたコールバック関数を取得して実行
      const onSettingsChange = mockSettingsUI.createSettingsPanel.mock.calls[0][1];
      await onSettingsChange({ mode: 'window' });

      expect(mockStorage.setMode).toHaveBeenCalledWith('chrome', 'window');
    });

    it('returns error when withSettingsUI is called before init', async () => {
      const fallback = new SidepanelFallback();
      const mockContainer = { appendChild: jest.fn() };
      const result = await fallback.withSettingsUI(mockContainer);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SidepanelFallback not initialized. Call init() first.');
    });

    it('returns error when container is not specified', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      const mockStorage = new ModeStorage();
      mockStorage.getMode.mockResolvedValue('sidepanel');

      const fallback = new SidepanelFallback();
      await fallback.init();
      const result = await fallback.withSettingsUI();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Container element is required');
    });
  });

  describe('getCurrentSettings', () => {
    it('can retrieve current settings', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      mockStorage.getMode.mockResolvedValue('window');

      const fallback = new SidepanelFallback();
      await fallback.init();
      const settings = fallback.getCurrentSettings();

      expect(settings.browser).toBe('chrome');
      expect(settings.mode).toBe('window');
    });

    it('returns null when called before init', () => {
      const fallback = new SidepanelFallback();
      const settings = fallback.getCurrentSettings();

      expect(settings).toBeNull();
    });
  });

  describe('Chrome Extension Simplified API', () => {
    beforeEach(() => {
      // Mock chrome extension environment
      global.chrome = {
        sidePanel: {
          open: jest.fn().mockResolvedValue(undefined),
          setOptions: jest.fn().mockResolvedValue(undefined),
          setPanelBehavior: jest.fn().mockResolvedValue(undefined)
        },
        runtime: {
          id: 'test-extension-id',
          getURL: jest
            .fn()
            .mockImplementation(path => `chrome-extension://test-extension-id${path}`)
        },
        windows: {
          create: jest.fn().mockResolvedValue({ id: 1 })
        }
      };

      // Update the mock to include setMode
      mockLauncher.setMode = jest.fn().mockResolvedValue({ success: true });
      mockLauncher.openPanel = jest.fn().mockResolvedValue({ success: true, method: 'sidepanel' });
    });

    describe('setupExtension', () => {
      it('sets up extension configuration successfully', async () => {
        getBrowserInfo.mockReturnValue('chrome');
        mockStorage.getMode.mockResolvedValue('auto');

        const fallback = new SidepanelFallback();
        const result = await fallback.setupExtension({
          sidepanelPath: '/sidepanel.html',
          popupPath: '/popup.html'
        });

        expect(result.success).toBe(true);
        expect(result.mode).toBe('auto');
        expect(fallback._extensionConfig).toEqual({
          sidepanelPath: '/sidepanel.html',
          popupPath: '/popup.html'
        });
      });

      it('returns error when no paths are provided', async () => {
        const fallback = new SidepanelFallback();
        const result = await fallback.setupExtension({});

        expect(result.success).toBe(false);
        expect(result.error).toContain('Either sidepanelPath or popupPath must be provided');
      });

      it('initializes automatically if not already initialized', async () => {
        getBrowserInfo.mockReturnValue('chrome');
        mockStorage.getMode.mockResolvedValue('auto');

        const fallback = new SidepanelFallback();
        expect(fallback.initialized).toBe(false);

        const result = await fallback.setupExtension({
          sidepanelPath: '/sidepanel.html'
        });

        expect(result.success).toBe(true);
        expect(fallback.initialized).toBe(true);
      });
    });

    describe('handleActionClick', () => {
      it('handles action click for sidepanel mode', async () => {
        getBrowserInfo.mockReturnValue('chrome');
        mockStorage.getMode.mockResolvedValue('sidepanel');

        const fallback = new SidepanelFallback();
        await fallback.setupExtension({
          sidepanelPath: '/sidepanel.html',
          popupPath: '/popup.html'
        });

        const result = await fallback.handleActionClick();

        expect(mockLauncher.openPanel).toHaveBeenCalledWith('sidepanel', '/sidepanel.html');
        expect(result.success).toBe(true);
      });

      it('handles action click for window mode', async () => {
        getBrowserInfo.mockReturnValue('chrome');
        mockStorage.getMode.mockResolvedValue('window');

        const fallback = new SidepanelFallback();
        await fallback.setupExtension({
          sidepanelPath: '/sidepanel.html',
          popupPath: '/popup.html'
        });

        const result = await fallback.handleActionClick();

        expect(mockLauncher.openPanel).toHaveBeenCalledWith('window', '/popup.html');
        expect(result.success).toBe(true);
      });

      it('returns error when extension not configured', async () => {
        const fallback = new SidepanelFallback();
        const result = await fallback.handleActionClick();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Extension not configured');
      });

      it('forces specific mode when provided', async () => {
        getBrowserInfo.mockReturnValue('chrome');
        mockStorage.getMode.mockResolvedValue('sidepanel');

        const fallback = new SidepanelFallback();
        await fallback.setupExtension({
          sidepanelPath: '/sidepanel.html',
          popupPath: '/popup.html'
        });

        const result = await fallback.handleActionClick('window');

        expect(mockLauncher.openPanel).toHaveBeenCalledWith('window', '/popup.html');
        expect(result.success).toBe(true);
      });
    });

    describe('toggleMode', () => {
      it('toggles from sidepanel to window mode', async () => {
        getBrowserInfo.mockReturnValue('chrome');
        mockStorage.getMode.mockResolvedValue('sidepanel');
        mockLauncher.setMode.mockResolvedValue({ success: true });
        mockStorage.setMode.mockResolvedValue();

        const fallback = new SidepanelFallback();
        await fallback.init();

        const result = await fallback.toggleMode();

        expect(mockLauncher.setMode).toHaveBeenCalledWith('window');
        expect(mockStorage.setMode).toHaveBeenCalledWith('chrome', 'window');
        expect(result.success).toBe(true);
        expect(result.mode).toBe('window');
        expect(result.oldMode).toBe('sidepanel');
        expect(fallback.mode).toBe('window');
      });

      it('toggles from window to sidepanel mode', async () => {
        getBrowserInfo.mockReturnValue('chrome');
        mockStorage.getMode.mockResolvedValue('window');
        mockLauncher.setMode.mockResolvedValue({ success: true });
        mockStorage.setMode.mockResolvedValue();

        const fallback = new SidepanelFallback();
        await fallback.init();

        const result = await fallback.toggleMode();

        expect(mockLauncher.setMode).toHaveBeenCalledWith('sidepanel');
        expect(mockStorage.setMode).toHaveBeenCalledWith('chrome', 'sidepanel');
        expect(result.success).toBe(true);
        expect(result.mode).toBe('sidepanel');
        expect(result.oldMode).toBe('window');
        expect(fallback.mode).toBe('sidepanel');
      });

      it('handles auto mode correctly', async () => {
        getBrowserInfo.mockReturnValue('chrome');
        mockStorage.getMode.mockResolvedValue('auto');
        mockLauncher.setMode.mockResolvedValue({ success: true });
        mockStorage.setMode.mockResolvedValue();

        const fallback = new SidepanelFallback();
        await fallback.init();

        const result = await fallback.toggleMode();

        // Auto mode for Chrome should resolve to sidepanel, so toggle to window
        expect(mockLauncher.setMode).toHaveBeenCalledWith('window');
        expect(result.success).toBe(true);
        expect(result.oldMode).toBe('sidepanel'); // Auto resolves to sidepanel for Chrome
      });

      it('initializes automatically if not already initialized', async () => {
        getBrowserInfo.mockReturnValue('chrome');
        mockStorage.getMode.mockResolvedValue('sidepanel');
        mockLauncher.setMode.mockResolvedValue({ success: true });
        mockStorage.setMode.mockResolvedValue();

        const fallback = new SidepanelFallback();
        expect(fallback.initialized).toBe(false);

        const result = await fallback.toggleMode();

        expect(fallback.initialized).toBe(true);
        expect(result.success).toBe(true);
      });

      it('handles setMode failure', async () => {
        getBrowserInfo.mockReturnValue('chrome');
        mockStorage.getMode.mockResolvedValue('sidepanel');
        mockLauncher.setMode.mockResolvedValue({ success: false, error: 'API error' });

        const fallback = new SidepanelFallback();
        await fallback.init();

        const result = await fallback.toggleMode();

        expect(result.success).toBe(false);
        expect(result.error).toBe('API error');
      });
    });
  });
});

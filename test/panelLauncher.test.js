import { PanelLauncher } from '../src/panelLauncher.js';

describe('PanelLauncher', () => {
  beforeEach(() => {
    // グローバルのモック初期化
    global.chrome = undefined;
    global.window = {
      open: jest.fn()
    };
    // windowOpenの呼び出し履歴をクリア
    jest.clearAllMocks();
  });

  describe('openPanel', () => {
    it('opens sidepanel when chrome.sidePanel.open is available in sidepanel mode', async () => {
      // Chrome Extension環境のモック
      global.chrome = {
        sidePanel: {
          open: jest.fn().mockResolvedValue(undefined),
          setOptions: jest.fn().mockResolvedValue(undefined),
          setPanelBehavior: jest.fn().mockResolvedValue(undefined)
        },
        windows: {
          create: jest.fn().mockResolvedValue({ id: 1 })
        }
      };

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('sidepanel', '/panel.html');

      expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({
        path: '/panel.html',
        enabled: true
      });
      expect(chrome.sidePanel.setPanelBehavior).toHaveBeenCalledWith({
        openPanelOnActionClick: true
      });
      // Note: chrome.sidePanel.open() is not called due to user gesture restrictions
      expect(result).toEqual({
        success: true,
        method: 'sidepanel',
        userAction: 'Click the sidepanel icon in browser toolbar'
      });
    });

    it('uses window.open to open popup in window mode', async () => {
      const mockWindow = { focus: jest.fn() };
      global.window.open.mockReturnValue(mockWindow);

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('window', '/panel.html');

      expect(global.window.open).toHaveBeenCalledWith(
        '/panel.html',
        'sidepanel_fallback',
        'width=400,height=600,scrollbars=yes,resizable=yes'
      );
      expect(mockWindow.focus).toHaveBeenCalled();
      expect(result).toEqual({ success: true, method: 'window' });
    });

    it('falls back to window when chrome.sidePanel is not available in sidepanel mode', async () => {
      // Chrome Extension環境だがsidePanelがない（古いChrome）
      global.chrome = {};
      const mockWindow = { focus: jest.fn() };
      global.window.open.mockReturnValue(mockWindow);

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('sidepanel', '/panel.html');

      expect(global.window.open).toHaveBeenCalledWith(
        '/panel.html',
        'sidepanel_fallback',
        'width=400,height=600,scrollbars=yes,resizable=yes'
      );
      expect(result).toEqual({ success: true, method: 'window', fallback: true });
    });

    it('falls back to window when chrome.sidePanel.open throws error in sidepanel mode', async () => {
      global.chrome = {
        sidePanel: {
          open: jest.fn().mockRejectedValue(new Error('Permission denied')),
          setOptions: jest.fn().mockRejectedValue(new Error('Permission denied')),
          setPanelBehavior: jest.fn().mockResolvedValue(undefined)
        },
        runtime: {
          id: 'extension-id',
          getURL: jest.fn().mockImplementation(path => `chrome-extension://extension-id${path}`)
        },
        windows: {
          create: jest.fn().mockResolvedValue({ id: 1 })
        }
      };

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('sidepanel', '/panel.html');

      // Since setOptions fails, it should fallback to chrome.windows.create
      expect(chrome.windows.create).toHaveBeenCalledWith({
        url: 'chrome-extension://extension-id/panel.html',
        type: 'popup',
        width: 400,
        height: 600,
        focused: true
      });
      expect(result).toEqual({ success: true, method: 'window', fallback: true });
    });

    it('returns error when window.open fails', async () => {
      global.window.open.mockReturnValue(null);

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('window', '/panel.html');

      expect(result).toEqual({
        success: false,
        error: 'Failed to open popup window'
      });
    });

    it('uses chrome.windows.create in Chrome Extension context for window mode', async () => {
      global.chrome = {
        runtime: {
          id: 'extension-id',
          getURL: jest.fn().mockImplementation(path => `chrome-extension://extension-id${path}`)
        },
        windows: {
          create: jest.fn().mockResolvedValue({ id: 1 })
        }
      };

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('window', '/panel.html');

      expect(chrome.windows.create).toHaveBeenCalledWith({
        url: 'chrome-extension://extension-id/panel.html',
        type: 'popup',
        width: 400,
        height: 600,
        focused: true
      });
      expect(result).toEqual({ success: true, method: 'window' });
    });

    it('uses chrome.windows.create for fallback in Chrome Extension context', async () => {
      global.chrome = {
        runtime: {
          id: 'extension-id',
          getURL: jest.fn().mockImplementation(path => `chrome-extension://extension-id${path}`)
        },
        sidePanel: {
          open: jest.fn().mockRejectedValue(new Error('Permission denied')),
          setOptions: jest.fn().mockRejectedValue(new Error('Permission denied')),
          setPanelBehavior: jest.fn().mockResolvedValue(undefined)
        },
        windows: {
          create: jest.fn().mockResolvedValue({ id: 1 })
        }
      };

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('sidepanel', '/panel.html');

      // Since setOptions fails, it should fallback to chrome.windows.create
      expect(chrome.windows.create).toHaveBeenCalledWith({
        url: 'chrome-extension://extension-id/panel.html',
        type: 'popup',
        width: 400,
        height: 600,
        focused: true
      });
      expect(result).toEqual({ success: true, method: 'window', fallback: true });
    });

    it('handles chrome.windows.create error in Chrome Extension context', async () => {
      global.chrome = {
        runtime: {
          id: 'extension-id',
          getURL: jest.fn().mockImplementation(path => `chrome-extension://extension-id${path}`)
        },
        windows: {
          create: jest.fn().mockRejectedValue(new Error('Windows API error'))
        }
      };

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('window', '/panel.html');

      expect(result).toEqual({
        success: false,
        error: 'Failed to open panel: Windows API error'
      });
    });

    it('handles absolute URLs correctly in Chrome Extension context', async () => {
      global.chrome = {
        runtime: {
          id: 'extension-id',
          getURL: jest.fn().mockImplementation(path => `chrome-extension://extension-id${path}`)
        },
        windows: {
          create: jest.fn().mockResolvedValue({ id: 1 })
        }
      };

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel(
        'window',
        'chrome-extension://extension-id/panel.html'
      );

      expect(chrome.windows.create).toHaveBeenCalledWith({
        url: 'chrome-extension://extension-id/panel.html',
        type: 'popup',
        width: 400,
        height: 600,
        focused: true
      });
      expect(chrome.runtime.getURL).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, method: 'window' });
    });

    it('returns error when window is not defined in non-extension context', async () => {
      global.chrome = undefined;
      global.window = undefined;

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('window', '/panel.html');

      expect(result).toEqual({
        success: false,
        error: 'Failed to open panel: window is not defined'
      });
    });

    it('returns error for invalid mode (other than sidepanel or window)', async () => {
      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('invalid', '/panel.html');

      expect(result).toEqual({
        success: false,
        error: 'Invalid mode: invalid. Must be "sidepanel" or "window"'
      });
    });
  });

  describe('isExtensionContext', () => {
    it('returns true when chrome.sidePanel API is available', () => {
      global.chrome = {
        sidePanel: {
          open: jest.fn(),
          setOptions: jest.fn()
        }
      };

      const launcher = new PanelLauncher();
      expect(launcher.isExtensionContext()).toBe(true);
    });

    it('returns false when chrome object does not exist', () => {
      global.chrome = undefined;

      const launcher = new PanelLauncher();
      expect(launcher.isExtensionContext()).toBe(false);
    });

    it('returns false when chrome object exists but sidePanel does not', () => {
      global.chrome = {};

      const launcher = new PanelLauncher();
      expect(launcher.isExtensionContext()).toBe(false);
    });
  });

  describe('isChromeExtensionContext', () => {
    it('returns true when chrome.runtime.id is available', () => {
      global.chrome = {
        runtime: {
          id: 'extension-id'
        }
      };

      const launcher = new PanelLauncher();
      expect(launcher.isChromeExtensionContext()).toBe(true);
    });

    it('returns false when chrome object does not exist', () => {
      global.chrome = undefined;

      const launcher = new PanelLauncher();
      expect(launcher.isChromeExtensionContext()).toBe(false);
    });

    it('returns false when chrome object exists but runtime does not', () => {
      global.chrome = {};

      const launcher = new PanelLauncher();
      expect(launcher.isChromeExtensionContext()).toBe(false);
    });

    it('returns false when chrome.runtime exists but id does not', () => {
      global.chrome = {
        runtime: {}
      };

      const launcher = new PanelLauncher();
      expect(launcher.isChromeExtensionContext()).toBe(false);
    });
  });

  describe('setMode', () => {
    it('successfully sets mode to sidepanel when chrome.sidePanel API is available', async () => {
      global.chrome = {
        runtime: {
          id: 'extension-id'
        },
        sidePanel: {
          setOptions: jest.fn().mockResolvedValue(undefined),
          setPanelBehavior: jest.fn().mockResolvedValue(undefined)
        }
      };

      const launcher = new PanelLauncher();
      const result = await launcher.setMode('sidepanel');

      expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ enabled: true });
      expect(chrome.sidePanel.setPanelBehavior).toHaveBeenCalledWith({
        openPanelOnActionClick: true
      });
      expect(result).toEqual({ success: true, mode: 'sidepanel' });
    });

    it('successfully sets mode to window', async () => {
      global.chrome = {
        runtime: {
          id: 'extension-id'
        },
        sidePanel: {
          setOptions: jest.fn().mockResolvedValue(undefined),
          setPanelBehavior: jest.fn().mockResolvedValue(undefined)
        }
      };

      const launcher = new PanelLauncher();
      const result = await launcher.setMode('window');

      expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ enabled: false });
      expect(chrome.sidePanel.setPanelBehavior).toHaveBeenCalledWith({
        openPanelOnActionClick: false
      });
      expect(result).toEqual({ success: true, mode: 'window' });
    });

    it('handles chrome.sidePanel API errors gracefully', async () => {
      global.chrome = {
        runtime: {
          id: 'extension-id'
        },
        sidePanel: {
          setOptions: jest.fn().mockResolvedValue(undefined),
          setPanelBehavior: jest.fn().mockRejectedValue(new Error('API error'))
        }
      };

      const launcher = new PanelLauncher();
      const result = await launcher.setMode('sidepanel');

      expect(result).toEqual({
        success: false,
        mode: 'sidepanel',
        error: 'API error'
      });
    });

    it('returns success when chrome.sidePanel is not available', async () => {
      global.chrome = undefined;

      const launcher = new PanelLauncher();
      const result = await launcher.setMode('sidepanel');

      expect(result).toEqual({ success: true, mode: 'sidepanel' });
    });

    it('returns error for invalid mode', async () => {
      const launcher = new PanelLauncher();
      const result = await launcher.setMode('invalid');

      expect(result).toEqual({
        success: false,
        error: 'Invalid mode: invalid. Must be "sidepanel" or "window"'
      });
    });
  });
});

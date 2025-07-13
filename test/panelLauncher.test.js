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
    it('sidepanelモードでchrome.sidePanel.openが使用可能な場合、sidepanelを開く', async () => {
      // Chrome Extension環境のモック
      global.chrome = {
        sidePanel: {
          open: jest.fn().mockResolvedValue(undefined)
        }
      };

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('sidepanel', '/panel.html');

      expect(chrome.sidePanel.open).toHaveBeenCalledWith({ path: '/panel.html' });
      expect(result).toEqual({ success: true, method: 'sidepanel' });
    });

    it('windowモードの場合、window.openを使用してポップアップを開く', async () => {
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

    it('sidepanelモードでchrome.sidePanelが利用できない場合、windowにフォールバック', async () => {
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

    it('sidepanelモードでchrome.sidePanel.openがエラーの場合、windowにフォールバック', async () => {
      global.chrome = {
        sidePanel: {
          open: jest.fn().mockRejectedValue(new Error('Permission denied'))
        }
      };
      const mockWindow = { focus: jest.fn() };
      global.window.open.mockReturnValue(mockWindow);

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('sidepanel', '/panel.html');

      expect(chrome.sidePanel.open).toHaveBeenCalledWith({ path: '/panel.html' });
      expect(global.window.open).toHaveBeenCalledWith(
        '/panel.html',
        'sidepanel_fallback',
        'width=400,height=600,scrollbars=yes,resizable=yes'
      );
      expect(result).toEqual({ success: true, method: 'window', fallback: true });
    });

    it('window.openが失敗した場合、エラーを返す', async () => {
      global.window.open.mockReturnValue(null);

      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('window', '/panel.html');

      expect(result).toEqual({
        success: false,
        error: 'Failed to open popup window'
      });
    });

    it('不正なmode（sidepanel、window以外）の場合、エラーを返す', async () => {
      const launcher = new PanelLauncher();
      const result = await launcher.openPanel('invalid', '/panel.html');

      expect(result).toEqual({
        success: false,
        error: 'Invalid mode: invalid. Must be "sidepanel" or "window"'
      });
    });
  });

  describe('isExtensionContext', () => {
    it('chrome.sidePanel APIが利用可能な場合、trueを返す', () => {
      global.chrome = {
        sidePanel: {
          open: jest.fn()
        }
      };

      const launcher = new PanelLauncher();
      expect(launcher.isExtensionContext()).toBe(true);
    });

    it('chromeオブジェクトが存在しない場合、falseを返す', () => {
      global.chrome = undefined;

      const launcher = new PanelLauncher();
      expect(launcher.isExtensionContext()).toBe(false);
    });

    it('chromeオブジェクトはあるがsidePanelがない場合、falseを返す', () => {
      global.chrome = {};

      const launcher = new PanelLauncher();
      expect(launcher.isExtensionContext()).toBe(false);
    });
  });
});

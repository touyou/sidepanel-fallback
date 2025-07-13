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
    openPanel: jest.fn()
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
      openPanel: jest.fn()
    };
    mockSettingsUI = {
      createSettingsPanel: jest.fn()
    };

    // コンストラクタのモックを設定
    ModeStorage.mockImplementation(() => mockStorage);
    PanelLauncher.mockImplementation(() => mockLauncher);
    SettingsUI.mockImplementation(() => mockSettingsUI);

    // グローバルnavigatorをモック
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/115.0.0.0'
    };
  });

  describe('init', () => {
    it('初期化が正常に完了する', async () => {
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

    it('初期化でモードが未設定の場合、デフォルト（auto）を使用する', async () => {
      getBrowserInfo.mockReturnValue('firefox');
      mockStorage.getMode.mockResolvedValue(null);

      const fallback = new SidepanelFallback();
      const result = await fallback.init();

      expect(result.browser).toBe('firefox');
      expect(result.mode).toBe('auto');
    });

    it('カスタム設定で初期化できる', async () => {
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
    it('設定されたモードでパネルを開く', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      mockStorage.getMode.mockResolvedValue('sidepanel');
      mockLauncher.openPanel.mockResolvedValue({ success: true, method: 'sidepanel' });

      const fallback = new SidepanelFallback();
      await fallback.init();
      const result = await fallback.openPanel('/panel.html');

      expect(PanelLauncher).toHaveBeenCalled();
      expect(mockLauncher.openPanel).toHaveBeenCalledWith('sidepanel', '/panel.html');
      expect(result.success).toBe(true);
      expect(result.method).toBe('sidepanel');
    });

    it('autoモードの場合、ブラウザに応じてモードを選択する', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      mockStorage.getMode.mockResolvedValue('auto');
      mockLauncher.openPanel.mockResolvedValue({ success: true, method: 'sidepanel' });

      const fallback = new SidepanelFallback();
      await fallback.init();
      const result = await fallback.openPanel('/panel.html');

      // Chromeの場合はsidepanelを選択
      expect(mockLauncher.openPanel).toHaveBeenCalledWith('sidepanel', '/panel.html');
    });

    it('Firefoxでautoモードの場合、windowモードを選択する', async () => {
      getBrowserInfo.mockReturnValue('firefox');
      mockStorage.getMode.mockResolvedValue('auto');
      mockLauncher.openPanel.mockResolvedValue({ success: true, method: 'window' });

      const fallback = new SidepanelFallback();
      await fallback.init();
      const result = await fallback.openPanel('/panel.html');

      // Firefoxの場合はwindowを選択
      expect(mockLauncher.openPanel).toHaveBeenCalledWith('window', '/panel.html');
    });

    it('init前にopenPanelを呼ぶとエラーを返す', async () => {
      const fallback = new SidepanelFallback();
      const result = await fallback.openPanel('/panel.html');

      expect(result.success).toBe(false);
      expect(result.error).toBe('SidepanelFallback not initialized. Call init() first.');
    });

    it('引数なしでopenPanelを呼ぶとエラーを返す', async () => {
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
    it('設定UIを作成してコンテナに挿入する', async () => {
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

    it('設定変更時にストレージに保存される', async () => {
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

    it('init前にwithSettingsUIを呼ぶとエラーを返す', async () => {
      const fallback = new SidepanelFallback();
      const mockContainer = { appendChild: jest.fn() };
      const result = await fallback.withSettingsUI(mockContainer);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SidepanelFallback not initialized. Call init() first.');
    });

    it('コンテナが指定されていない場合はエラーを返す', async () => {
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
    it('現在の設定を取得できる', async () => {
      getBrowserInfo.mockReturnValue('chrome');
      mockStorage.getMode.mockResolvedValue('window');

      const fallback = new SidepanelFallback();
      await fallback.init();
      const settings = fallback.getCurrentSettings();

      expect(settings.browser).toBe('chrome');
      expect(settings.mode).toBe('window');
    });

    it('init前に呼ぶとnullを返す', () => {
      const fallback = new SidepanelFallback();
      const settings = fallback.getCurrentSettings();

      expect(settings).toBeNull();
    });
  });
});

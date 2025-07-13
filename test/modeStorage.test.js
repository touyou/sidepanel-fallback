const { ModeStorage } = require('../src/modeStorage.js');

describe('ModeStorage', () => {
  let storage;

  beforeEach(() => {
    // テスト前にモックのlocalStorageをクリア
    global.localStorage = {
      data: {},
      getItem: jest.fn((key) => global.localStorage.data[key] || null),
      setItem: jest.fn((key, value) => {
        global.localStorage.data[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete global.localStorage.data[key];
      }),
      clear: jest.fn(() => {
        global.localStorage.data = {};
      })
    };

    // Chrome Extension APIのモック
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };

    storage = new ModeStorage();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('localStorage環境', () => {
    it('ブラウザモードを保存できる', async () => {
      await storage.setMode('chrome', 'sidepanel');
      
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'sidepanel-fallback-mode-chrome', 
        'sidepanel'
      );
    });

    it('保存したブラウザモードを取得できる', async () => {
      global.localStorage.data['sidepanel-fallback-mode-firefox'] = 'window';
      
      const mode = await storage.getMode('firefox');
      
      expect(mode).toBe('window');
      expect(global.localStorage.getItem).toHaveBeenCalledWith(
        'sidepanel-fallback-mode-firefox'
      );
    });

    it('未設定のブラウザはnullを返す', async () => {
      const mode = await storage.getMode('unknown-browser');
      
      expect(mode).toBeNull();
    });

    it('不正なブラウザ名の場合はエラーをスロー', async () => {
      await expect(storage.setMode('', 'sidepanel')).rejects.toThrow('Invalid browser name');
      await expect(storage.setMode(null, 'sidepanel')).rejects.toThrow('Invalid browser name');
    });

    it('不正なモード名の場合はエラーをスロー', async () => {
      await expect(storage.setMode('chrome', '')).rejects.toThrow('Invalid mode');
      await expect(storage.setMode('chrome', 'invalid')).rejects.toThrow('Invalid mode');
    });
  });

  describe('Chrome Extension環境', () => {
    beforeEach(() => {
      // Chrome Extension環境をシミュレート
      storage._isExtensionContext = jest.fn().mockReturnValue(true);
    });

    it('Chrome Storageを使ってモードを保存できる', async () => {
      global.chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback && callback();
      });

      await storage.setMode('chrome', 'sidepanel');

      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
        { 'sidepanel-fallback-mode-chrome': 'sidepanel' },
        expect.any(Function)
      );
    });

    it('Chrome Storageからモードを取得できる', async () => {
      global.chrome.storage.sync.get.mockImplementation((key, callback) => {
        callback({ 'sidepanel-fallback-mode-edge': 'window' });
      });

      const mode = await storage.getMode('edge');

      expect(mode).toBe('window');
      expect(global.chrome.storage.sync.get).toHaveBeenCalledWith(
        'sidepanel-fallback-mode-edge',
        expect.any(Function)
      );
    });
  });

  describe('有効なモード値', () => {
    it('sidepanelモードが有効', async () => {
      await expect(storage.setMode('chrome', 'sidepanel')).resolves.not.toThrow();
    });

    it('windowモードが有効', async () => {
      await expect(storage.setMode('firefox', 'window')).resolves.not.toThrow();
    });

    it('autoモードが有効', async () => {
      await expect(storage.setMode('safari', 'auto')).resolves.not.toThrow();
    });
  });
});

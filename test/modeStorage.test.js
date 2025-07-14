const { ModeStorage } = require('../src/modeStorage.js');

describe('ModeStorage - localStorage', () => {
  let storage;
  let mockLocalStorage;

  beforeEach(() => {
    // シンプルなlocalStorageモック
    mockLocalStorage = {};
    global.localStorage = {
      getItem: jest.fn(key => mockLocalStorage[key] || null),
      setItem: jest.fn((key, value) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: jest.fn(key => {
        delete mockLocalStorage[key];
      }),
      key: jest.fn(index => {
        const keys = Object.keys(mockLocalStorage);
        return keys[index] || null;
      }),
      get length() {
        return Object.keys(mockLocalStorage).length;
      }
    };

    storage = new ModeStorage();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can save browser mode', async () => {
    await storage.setMode('chrome', 'sidepanel');

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'sidepanel-fallback-mode-chrome',
      'sidepanel'
    );
  });

  it('can retrieve saved browser mode', async () => {
    mockLocalStorage['sidepanel-fallback-mode-firefox'] = 'window';

    const mode = await storage.getMode('firefox');

    expect(mode).toBe('window');
    expect(global.localStorage.getItem).toHaveBeenCalledWith('sidepanel-fallback-mode-firefox');
  });

  it('returns null for unset browsers', async () => {
    const mode = await storage.getMode('unknown-browser');

    expect(mode).toBeNull();
  });

  it('throws error for invalid browser name', async () => {
    await expect(storage.setMode('', 'sidepanel')).rejects.toThrow('Invalid browser name');
    await expect(storage.setMode(null, 'sidepanel')).rejects.toThrow('Invalid browser name');
    await expect(storage.setMode('   ', 'sidepanel')).rejects.toThrow('Invalid browser name');
  });

  it('throws error for invalid mode name', async () => {
    await expect(storage.setMode('chrome', '')).rejects.toThrow('Invalid mode');
    await expect(storage.setMode('chrome', 'invalid')).rejects.toThrow('Invalid mode');
    await expect(storage.setMode('chrome', null)).rejects.toThrow('Invalid mode');
  });

  it('can use valid mode values', async () => {
    await expect(storage.setMode('chrome', 'sidepanel')).resolves.not.toThrow();
    await expect(storage.setMode('firefox', 'window')).resolves.not.toThrow();
    await expect(storage.setMode('safari', 'auto')).resolves.not.toThrow();
  });

  it('returns null for invalid browser name in getMode', async () => {
    const mode1 = await storage.getMode('');
    const mode2 = await storage.getMode(null);
    const mode3 = await storage.getMode('   ');

    expect(mode1).toBeNull();
    expect(mode2).toBeNull();
    expect(mode3).toBeNull();
  });

  it('can clear all storage', async () => {
    // Setup some data
    mockLocalStorage['sidepanel-fallback-mode-chrome'] = 'sidepanel';
    mockLocalStorage['sidepanel-fallback-mode-firefox'] = 'window';
    mockLocalStorage['other-data'] = 'should-remain';

    await storage.clear();

    expect(global.localStorage.removeItem).toHaveBeenCalledWith('sidepanel-fallback-mode-chrome');
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('sidepanel-fallback-mode-firefox');
    expect(global.localStorage.removeItem).not.toHaveBeenCalledWith('other-data');
  });
});

describe('ModeStorage - Chrome Extension environment', () => {
  let storage;
  let mockChrome;

  beforeEach(() => {
    // Chrome Extension環境のモック
    mockChrome = {
      storage: {
        sync: {
          set: jest.fn((data, callback) => {
            callback && callback();
          }),
          get: jest.fn((key, callback) => {
            callback && callback({});
          }),
          clear: jest.fn((callback) => {
            callback && callback();
          })
        }
      },
      runtime: {
        lastError: null
      }
    };

    global.chrome = mockChrome;
    storage = new ModeStorage();
  });

  afterEach(() => {
    delete global.chrome;
    jest.clearAllMocks();
  });

  it('should detect extension context', () => {
    expect(storage._isExtensionContext()).toBeTruthy();
  });

  it('can save mode in extension context', async () => {
    await storage.setMode('chrome', 'sidepanel');

    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
      { 'sidepanel-fallback-mode-chrome': 'sidepanel' },
      expect.any(Function)
    );
  });

  it('can retrieve mode from extension storage', async () => {
    mockChrome.storage.sync.get.mockImplementation((key, callback) => {
      callback({ [key]: 'window' });
    });

    const mode = await storage.getMode('firefox');

    expect(mode).toBe('window');
    expect(mockChrome.storage.sync.get).toHaveBeenCalledWith('sidepanel-fallback-mode-firefox', expect.any(Function));
  });

  it('returns null for unset browsers in extension context', async () => {
    mockChrome.storage.sync.get.mockImplementation((key, callback) => {
      callback({});
    });

    const mode = await storage.getMode('unknown-browser');

    expect(mode).toBeNull();
  });

  it('handles storage errors in extension context', async () => {
    mockChrome.runtime.lastError = { message: 'Storage quota exceeded' };
    mockChrome.storage.sync.set.mockImplementation((data, callback) => {
      callback && callback();
    });

    await expect(storage.setMode('chrome', 'sidepanel')).rejects.toThrow('Storage quota exceeded');
  });

  it('can clear all storage in extension context', async () => {
    await storage.clear();

    expect(mockChrome.storage.sync.clear).toHaveBeenCalledWith(expect.any(Function));
  });
});

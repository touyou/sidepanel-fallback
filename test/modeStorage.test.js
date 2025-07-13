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
      })
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
  });

  it('throws error for invalid mode name', async () => {
    await expect(storage.setMode('chrome', '')).rejects.toThrow('Invalid mode');
    await expect(storage.setMode('chrome', 'invalid')).rejects.toThrow('Invalid mode');
  });

  it('can use valid mode values', async () => {
    await expect(storage.setMode('chrome', 'sidepanel')).resolves.not.toThrow();
    await expect(storage.setMode('firefox', 'window')).resolves.not.toThrow();
    await expect(storage.setMode('safari', 'auto')).resolves.not.toThrow();
  });
});

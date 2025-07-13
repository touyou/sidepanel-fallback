const { ModeStorage } = require('../src/modeStorage.js');

describe('ModeStorage - Basic', () => {
  it('インスタンスを作成できる', () => {
    const storage = new ModeStorage();
    expect(storage).toBeDefined();
  });

  it('有効なモード値を検証する', () => {
    const storage = new ModeStorage();
    expect(storage.validModes).toContain('sidepanel');
    expect(storage.validModes).toContain('window');
    expect(storage.validModes).toContain('auto');
  });
});

const { getBrowserInfo } = require('../src/browserInfo.js');

describe('getBrowserInfo', () => {
  it('ChromeのUAを正しく判定する', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0) Chrome/115.0.0.0';
    expect(getBrowserInfo(ua)).toBe('chrome');
  });

  it('Diaを判別できる', () => {
    const ua = 'Mozilla/5.0 (Dia/1.0.0)';
    expect(getBrowserInfo(ua)).toBe('dia');
  });

  it('Firefoxを判別できる', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0';
    expect(getBrowserInfo(ua)).toBe('firefox');
  });

  it('Safariを判別できる', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
    expect(getBrowserInfo(ua)).toBe('safari');
  });

  it('Edgeを判別できる', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
    expect(getBrowserInfo(ua)).toBe('edge');
  });

  it('不明なブラウザはunknownを返す', () => {
    const ua = 'Unknown Browser/1.0';
    expect(getBrowserInfo(ua)).toBe('unknown');
  });

  it('undefinedが渡された場合はunknownを返す', () => {
    expect(getBrowserInfo(undefined)).toBe('unknown');
  });

  it('空文字が渡された場合はunknownを返す', () => {
    expect(getBrowserInfo('')).toBe('unknown');
  });
});

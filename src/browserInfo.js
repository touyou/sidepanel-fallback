/**
 * User Agentストリングからブラウザ情報を判定する
 * @param {string} userAgent - User Agentストリング
 * @returns {string} ブラウザ名（'chrome', 'firefox', 'safari', 'edge', 'dia', 'unknown'）
 */
function getBrowserInfo(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') {
    return 'unknown';
  }

  const ua = userAgent.toLowerCase();

  // Dia（カスタムブラウザ）の判定
  if (ua.includes('dia/')) {
    return 'dia';
  }

  // EdgeはChromeより先に判定する必要がある（Chrome UAも含むため）
  if (ua.includes('edg/')) {
    return 'edge';
  }

  // Chrome判定
  if (ua.includes('chrome/')) {
    return 'chrome';
  }

  // Firefox判定
  if (ua.includes('firefox/')) {
    return 'firefox';
  }

  // Safari判定（SafariかつWebkitの場合）
  if (ua.includes('safari/') && ua.includes('webkit/') && !ua.includes('chrome/')) {
    return 'safari';
  }

  return 'unknown';
}

export { getBrowserInfo };

/**
 * Determine browser information from User Agent string
 * @param {string} userAgent - User Agent string
 * @returns {string} Browser name ('chrome', 'firefox', 'safari', 'edge', 'dia', 'unknown')
 */
function getBrowserInfo(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') {
    return 'unknown';
  }

  const ua = userAgent.toLowerCase();

  // Dia (custom browser) detection
  if (ua.includes('dia/')) {
    return 'dia';
  }

  // Edge must be detected before Chrome (since it includes Chrome UA)
  if (ua.includes('edg/')) {
    return 'edge';
  }

  // Chrome detection
  if (ua.includes('chrome/')) {
    return 'chrome';
  }

  // Firefox detection
  if (ua.includes('firefox/')) {
    return 'firefox';
  }

  // Safari detection (Safari and Webkit)
  if (ua.includes('safari/') && ua.includes('webkit/') && !ua.includes('chrome/')) {
    return 'safari';
  }

  return 'unknown';
}

export { getBrowserInfo };

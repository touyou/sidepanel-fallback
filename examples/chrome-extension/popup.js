let fallbackInstance = null;

// Initialization process
async function initializeDemo() {
  try {
    // Create library instance (from UMD build)
    fallbackInstance = new SidepanelFallback.SidepanelFallback({
      defaultMode: 'window', // Popup so explicitly window mode
      enablePerformanceTracking: true,
      enableCaching: true,
      enableLazyLoading: false, // Disable for web demo
      enableProgressiveInit: false // Disable for web demo
    });

    // Initialize
    const result = await fallbackInstance.init();
    console.log('Popup fallback initialized:', result);

    // Update UI
    updateBrowserInfo(result);
    await setupSettingsUI();

    // Initial performance stats display
    updatePerformanceStats();
  } catch (error) {
    console.error('Popup demo initialization failed:', error);
    document.getElementById('performance-output').textContent =
      `Initialization error: ${error.message}`;
  }
}

// Update browser information display
function updateBrowserInfo(result) {
  const browserBadge = document.getElementById('browser-badge');

  browserBadge.textContent = result.browser || 'unknown';
  browserBadge.className = `badge ${result.browser || 'unknown'}`;
}

// Settings UI setup
async function setupSettingsUI() {
  try {
    const container = document.getElementById('settings-container');

    // Clear existing content
    container.innerHTML = '';

    // Add settings UI
    await fallbackInstance.withSettingsUI(container);

    console.log('Settings UI loaded successfully');
  } catch (error) {
    console.error('Failed to setup settings UI:', error);
    document.getElementById('settings-container').innerHTML =
      '<h3>Display Mode Settings</h3><p>Failed to load settings UI.</p>';
  }
}

// Get performance statistics
function getPerformanceStats() {
  try {
    if (!fallbackInstance) {
      throw new Error('Library not initialized');
    }

    const stats = fallbackInstance.getPerformanceStats();
    document.getElementById('performance-output').textContent =
      `Performance statistics:\n${JSON.stringify(stats, null, 2)}`;
  } catch (error) {
    console.error('Failed to get performance stats:', error);
    document.getElementById('performance-output').textContent =
      `Statistics error: ${error.message}`;
  }
}

// Update performance statistics
function updatePerformanceStats() {
  if (fallbackInstance) {
    const settings = fallbackInstance.getCurrentSettings();
    if (settings) {
      document.getElementById('performance-output').textContent =
        `Current settings:\nBrowser: ${settings.browser}\nMode: ${settings.mode}\n\nFallback: Popup window display active`;
    }
  }
}

// Clear cache
function clearCache() {
  try {
    if (!fallbackInstance) {
      throw new Error('Library not initialized');
    }

    fallbackInstance.clearPerformanceCaches('all');
    document.getElementById('performance-output').textContent = 'All caches have been cleared.';
  } catch (error) {
    console.error('Failed to clear cache:', error);
    document.getElementById('performance-output').textContent =
      `Cache clear error: ${error.message}`;
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeDemo();

  // Add event listeners for buttons
  document.getElementById('performance-stats-btn').addEventListener('click', getPerformanceStats);
  document.getElementById('clear-cache-btn').addEventListener('click', clearCache);
});

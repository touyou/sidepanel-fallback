let fallbackInstance = null;

// Initialization process
async function initializeDemo() {
  try {
    // Create library instance (from UMD build)
    fallbackInstance = new SidepanelFallback.SidepanelFallback({
      defaultMode: 'auto',
      enablePerformanceTracking: true,
      enableCaching: true,
      enableLazyLoading: false, // Disable for web demo
      enableProgressiveInit: false // Disable for web demo
    });

    // Initialize
    const result = await fallbackInstance.init();
    console.log('Sidepanel fallback initialized:', result);

    // Update UI
    updateBrowserInfo(result);
    await setupSettingsUI();

    // Initial performance stats display
    updatePerformanceStats();
  } catch (error) {
    console.error('Demo initialization failed:', error);
    document.getElementById('performance-output').textContent =
      `Initialization error: ${error.message}`;
  }
}

// Update browser information display
function updateBrowserInfo(result) {
  const browserBadge = document.getElementById('browser-badge');
  const modeBadge = document.getElementById('mode-badge');
  const sidepanelSupport = document.getElementById('sidepanel-support');

  browserBadge.textContent = result.browser || 'unknown';
  browserBadge.className = `badge ${result.browser || 'unknown'}`;

  modeBadge.textContent = result.mode || 'unknown';
  modeBadge.className = `badge ${result.mode || 'unknown'}`;

  const isSupported = result.browser === 'chrome' || result.browser === 'edge';
  sidepanelSupport.innerHTML = isSupported
    ? '<span class="status-indicator active"></span>Supported'
    : '<span class="status-indicator inactive"></span>Not Supported';
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

// Open new panel
async function openNewPanel() {
  try {
    if (!fallbackInstance) {
      throw new Error('Library not initialized');
    }

    const result = await fallbackInstance.openPanel('popup.html');
    document.getElementById('performance-output').textContent =
      `Panel open result:\n${JSON.stringify(result, null, 2)}`;
  } catch (error) {
    console.error('Failed to open panel:', error);
    document.getElementById('performance-output').textContent =
      `Panel open error: ${error.message}`;
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
        `Current settings:\nBrowser: ${settings.browser}\nMode: ${settings.mode}`;
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
  document.getElementById('open-panel-btn').addEventListener('click', openNewPanel);
  document.getElementById('performance-stats-btn').addEventListener('click', getPerformanceStats);
  document.getElementById('clear-cache-btn').addEventListener('click', clearCache);
});

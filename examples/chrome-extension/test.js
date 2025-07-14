// Mock Chrome APIs for testing
if (typeof chrome === 'undefined') {
  window.chrome = {
    runtime: {
      onInstalled: { addListener: () => {} },
      onStartup: { addListener: () => {} },
      onMessage: { addListener: () => {} },
      getURL: path => `chrome-extension://test/${path}`
    },
    action: {
      onClicked: { addListener: () => {} }
    },
    storage: {
      sync: {
        get: (key, callback) => callback({}),
        set: (data, callback) => callback(),
        clear: callback => callback()
      }
    },
    sidePanel: {
      open: async () => {}
    },
    windows: {
      create: () => ({ id: 1 })
    }
  };
}

async function testLibrary() {
  const output = document.getElementById('output');

  try {
    output.innerHTML += '<p>Testing SidepanelFallback library...</p>';

    // Test that the library is loaded
    if (typeof SidepanelFallback === 'undefined') {
      throw new Error('SidepanelFallback not loaded');
    }
    output.innerHTML += '<p>✓ Library loaded successfully</p>';

    // Test constructor with service worker compatible settings
    const fallbackInstance = new SidepanelFallback.SidepanelFallback({
      defaultMode: 'auto',
      enablePerformanceTracking: true,
      enableCaching: true,
      enableLazyLoading: false, // Disabled to avoid dynamic imports
      enableProgressiveInit: false // Disabled to avoid dynamic imports
    });
    output.innerHTML += '<p>✓ Instance created successfully</p>';

    // Test initialization
    const result = await fallbackInstance.init();
    output.innerHTML += '<p>✓ Initialization successful: ' + JSON.stringify(result) + '</p>';

    output.innerHTML += '<p><strong>✅ All tests passed! No dynamic import errors.</strong></p>';
  } catch (error) {
    output.innerHTML += '<p><strong>❌ Test failed: ' + error.message + '</strong></p>';
    console.error('Test error:', error);
  }
}

// Run test when page loads
document.addEventListener('DOMContentLoaded', testLibrary);

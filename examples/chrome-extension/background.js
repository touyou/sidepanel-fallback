// Chrome Extension Background Script
// Demonstrates the new simplified sidepanel-fallback API

// Import the sidepanel-fallback library
importScripts('sidepanel-fallback.umd.js');

let fallbackInstance = null;

// Initialize the sidepanel fallback when extension starts
async function initializeFallback() {
  // Avoid double initialization
  if (fallbackInstance && fallbackInstance.initialized) {
    console.log('Fallback already initialized, skipping...');
    return;
  }

  try {
    // Create instance with Chrome Extension specific options
    // Note: Disable progressive initialization and lazy loading as they use dynamic imports
    // which are not supported in service worker environments (Chrome Extension background)
    fallbackInstance = new SidepanelFallback.SidepanelFallback({
      defaultMode: 'auto', // Let the library decide based on browser capabilities
      enablePerformanceTracking: true,
      enableCaching: true,
      enableLazyLoading: false, // Disable - uses dynamic imports not supported in service workers
      enableProgressiveInit: false // Disable - uses dynamic imports not supported in service workers
    });

    // Initialize the library
    const result = await fallbackInstance.init();
    console.log('Sidepanel Fallback initialized:', result);

    // Setup extension with the new simplified API
    const setupResult = await fallbackInstance.setupExtension({
      sidepanelPath: 'sidepanel.html',
      popupPath: 'popup.html',
      showInstruction: true // Show instruction for sidepanel mode
    });

    if (setupResult.success) {
      console.log('Extension setup completed, mode:', setupResult.mode);
      console.log('Fallback instance mode:', fallbackInstance.mode);
      console.log('Fallback instance browser:', fallbackInstance.browser);

      // Also log current settings for debugging
      const currentSettings = fallbackInstance.getCurrentSettings();
      console.log('Current settings after setup:', currentSettings);
    } else {
      console.error('Extension setup failed:', setupResult.error);
    }

    // Listen for fallback events
    fallbackInstance.on('browserDetected', data => {
      console.log('Browser detected:', data.browser);
    });

    fallbackInstance.on('modeChanged', data => {
      console.log('Display mode changed:', data.oldMode, '->', data.newMode);
    });

    fallbackInstance.on('afterOpenPanel', data => {
      console.log('Panel opened:', data);
    });
  } catch (error) {
    console.error('Failed to initialize sidepanel fallback:', error);
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(async details => {
  console.log('Extension installed:', details.reason);
  await initializeFallback();
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension starting up');
  await initializeFallback();
});

// Handle action button click (toolbar icon) - NOW MUCH SIMPLER!
chrome.action.onClicked.addListener(async tab => {
  console.log('Action clicked for tab:', tab.id);

  if (!fallbackInstance) {
    console.log('Fallback not initialized, initializing now...');
    await initializeFallback();
  }

  try {
    // Use the new simplified API - handles everything automatically!
    const result = await fallbackInstance.handleActionClick();
    console.log('Panel open result:', result);

    if (!result.success) {
      console.error('Failed to open panel:', result.error);
    } else if (result.userAction) {
      console.log('User action required:', result.userAction);
    }
  } catch (error) {
    console.error('Failed to open panel:', error);
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);

  switch (message.type) {
    case 'GET_SETTINGS':
      (async () => {
        try {
          // Initialize if not already initialized
          if (!fallbackInstance) {
            console.log('Fallback not initialized, initializing now for get settings...');
            await initializeFallback();
          }

          if (fallbackInstance) {
            const settings = fallbackInstance.getCurrentSettings();
            sendResponse({ success: true, settings });
          } else {
            sendResponse({ success: false, error: 'Failed to initialize fallback instance' });
          }
        } catch (error) {
          console.error('Failed to get settings:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      break;

    case 'GET_STATUS':
      (async () => {
        try {
          // Initialize if not already initialized
          if (!fallbackInstance) {
            console.log('Fallback not initialized, initializing now for get status...');
            await initializeFallback();
          }

          if (fallbackInstance) {
            const settings = fallbackInstance.getCurrentSettings();

            // Debug logging to see what we're getting
            console.log('GET_STATUS - settings:', settings);
            console.log('GET_STATUS - fallbackInstance.mode:', fallbackInstance.mode);
            console.log('GET_STATUS - fallbackInstance.browser:', fallbackInstance.browser);

            // Try to get saved mode directly from storage as a fallback
            let savedMode = null;
            try {
              if (fallbackInstance.storage && fallbackInstance.browser) {
                savedMode = await fallbackInstance.storage.getMode(fallbackInstance.browser);
                console.log('GET_STATUS - saved mode from storage:', savedMode);
              }
            } catch (error) {
              console.log('GET_STATUS - failed to get saved mode:', error);
            }

            // Get the effective mode (resolve 'auto' to actual mode)
            let effectiveMode = settings?.mode || fallbackInstance.mode || savedMode || 'unknown';
            if (effectiveMode === 'auto' && fallbackInstance._getAutoMode) {
              effectiveMode = fallbackInstance._getAutoMode();
            } else if (effectiveMode === 'auto' && fallbackInstance.browser) {
              // Fallback implementation of auto mode detection
              effectiveMode =
                fallbackInstance.browser === 'chrome' || fallbackInstance.browser === 'edge'
                  ? 'sidepanel'
                  : 'window';
            }

            sendResponse({
              success: true,
              mode: effectiveMode,
              status: 'Ready',
              browser: fallbackInstance.browser
            });
          } else {
            sendResponse({ success: false, error: 'Failed to initialize fallback instance' });
          }
        } catch (error) {
          console.error('Failed to get status:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      break;

    case 'SET_MODE':
      (async () => {
        try {
          // Initialize if not already initialized
          if (!fallbackInstance) {
            console.log('Fallback not initialized, initializing now for set mode...');
            await initializeFallback();
          }

          if (fallbackInstance) {
            // Use launcher to set mode and update storage
            const result = await fallbackInstance.launcher.setMode(message.mode);

            if (result.success) {
              // Update internal mode and save to storage
              fallbackInstance.mode = message.mode;
              if (fallbackInstance.storage && fallbackInstance.browser) {
                await fallbackInstance.storage.setMode(fallbackInstance.browser, message.mode);
              }

              console.log('Mode set to:', message.mode, result);
              sendResponse(result);
            } else {
              sendResponse(result);
            }
          } else {
            sendResponse({ success: false, error: 'Failed to initialize fallback instance' });
          }
        } catch (error) {
          console.error('Failed to set mode:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      break;

    case 'TOGGLE_MODE':
      (async () => {
        try {
          // Initialize if not already initialized
          if (!fallbackInstance) {
            console.log('Fallback not initialized, initializing now for toggle mode...');
            await initializeFallback();
          }

          if (fallbackInstance) {
            const result = await fallbackInstance.toggleMode();
            console.log('Mode toggled:', result);
            sendResponse(result);
          } else {
            sendResponse({ success: false, error: 'Failed to initialize fallback instance' });
          }
        } catch (error) {
          console.error('Failed to toggle mode:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      break;

    case 'GET_PERFORMANCE_STATS':
      (async () => {
        try {
          // Initialize if not already initialized
          if (!fallbackInstance) {
            console.log('Fallback not initialized, initializing now for performance stats...');
            await initializeFallback();
          }

          if (fallbackInstance) {
            const stats = fallbackInstance.getPerformanceStats();
            sendResponse({ success: true, stats });
          } else {
            sendResponse({ success: false, error: 'Failed to initialize fallback instance' });
          }
        } catch (error) {
          console.error('Failed to get performance stats:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      break;

    case 'CLEAR_CACHE':
      (async () => {
        try {
          // Initialize if not already initialized
          if (!fallbackInstance) {
            console.log('Fallback not initialized, initializing now for clear cache...');
            await initializeFallback();
          }

          if (fallbackInstance) {
            fallbackInstance.clearPerformanceCaches(message.cacheType || 'all');
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Failed to initialize fallback instance' });
          }
        } catch (error) {
          console.error('Failed to clear cache:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep message channel open for async response
});

// Handle any errors
self.addEventListener('error', event => {
  console.error('Background script error:', event.error);
});

console.log('Background script loaded - using simplified API');

// Chrome Extension Background Script
// Demonstrates sidepanel-fallback library usage in a service worker

// Import the sidepanel-fallback library
importScripts('sidepanel-fallback.umd.js');

let fallbackInstance = null;

// Initialize the sidepanel fallback when extension starts
async function initializeFallback() {
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

// Handle action button click (toolbar icon)
chrome.action.onClicked.addListener(async tab => {
  console.log('Action clicked for tab:', tab.id);

  if (!fallbackInstance) {
    console.log('Fallback not initialized, initializing now...');
    await initializeFallback();
  }

  try {
    // The library automatically handles fallback logic:
    // 1. In Chrome/Edge, it first tries sidepanel mode
    // 2. If sidepanel fails (due to conflicts, permissions, etc.), it automatically falls back to window mode
    // 3. In Firefox/Safari, it directly uses window mode
    // 4. The library uses chrome.windows.create for extension context and window.open for web context
    const result = await fallbackInstance.openPanel('sidepanel.html');
    console.log('Panel open result:', result);

    if (!result.success) {
      console.error('Failed to open panel with fallback library:', result.error);
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
      if (fallbackInstance) {
        const settings = fallbackInstance.getCurrentSettings();
        sendResponse({ success: true, settings });
      } else {
        sendResponse({ success: false, error: 'Fallback not initialized' });
      }
      break;

    case 'GET_PERFORMANCE_STATS':
      if (fallbackInstance) {
        const stats = fallbackInstance.getPerformanceStats();
        sendResponse({ success: true, stats });
      } else {
        sendResponse({ success: false, error: 'Fallback not initialized' });
      }
      break;

    case 'CLEAR_CACHE':
      if (fallbackInstance) {
        fallbackInstance.clearPerformanceCaches(message.cacheType || 'all');
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Fallback not initialized' });
      }
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

console.log('Background script loaded');

// Popup script for the simplified Sidepanel Fallback extension

console.log('Popup script loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing popup interface with shared UI');

  // Initialize the shared UI for popup
  const ui = new SidepanelFallbackUI('app', {
    title: 'Sidepanel Fallback',
    isPopup: true,
    width: '320px'
  });

  console.log('Popup interface initialized with shared UI components');

  // Force a status update after initialization is complete
  setTimeout(() => {
    console.log('Popup: Forcing status update after initialization...');
    ui.updateStatus();
  }, 1000);
});

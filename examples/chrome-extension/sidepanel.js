// Sidepanel script for the new simplified API demonstration
// Shows how the new API simplifies Chrome extension development

console.log('Sidepanel script loaded with new simplified API');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing sidepanel interface with shared UI');

  // Initialize the shared UI for sidepanel
  const ui = new SidepanelFallbackUI('app', {
    title: 'Sidepanel Fallback - サイドパネルモード',
    isPopup: false
  });

  console.log('Sidepanel interface initialized with shared UI components');

  // Force a status update after initialization is complete
  setTimeout(() => {
    console.log('Sidepanel: Forcing status update after initialization...');
    ui.updateStatus();
  }, 1000);
});

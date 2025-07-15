// Shared UI components and functionality for Chrome Extension
// This module provides common UI components for both popup and sidepanel

class SidepanelFallbackUI {
  constructor(containerId = 'app', options = {}) {
    this.container = document.getElementById(containerId) || document.body;
    this.options = {
      title: 'Sidepanel Fallback',
      isPopup: false,
      width: '320px',
      ...options
    };
    this.currentMode = 'unknown';
    this.browserInfo = 'Unknown';
    this.status = 'Ready';

    this.init();
  }

  init() {
    this.setupStyles();
    this.render();
    this.attachEventListeners();
    this.detectBrowser();
    this.updateStatus();

    // Retry status update after a short delay to ensure background script is ready
    setTimeout(() => {
      this.updateStatus();
    }, 500);
  }

  setupStyles() {
    if (document.getElementById('sidepanel-fallback-styles')) return;

    const style = document.createElement('style');
    style.id = 'sidepanel-fallback-styles';
    style.textContent = `
      .sidepanel-fallback-ui {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        font-size: 14px;
        color: #333;
        background: #fff;
        ${this.options.isPopup ? `width: ${this.options.width}; min-height: 240px;` : 'min-height: 100vh;'}
      }

      .sf-header {
        padding: 16px;
        border-bottom: 1px solid #e5e5e5;
        background: #f9f9f9;
      }

      .sf-header h1 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .sf-mode-indicator {
        margin-top: 4px;
        font-size: 12px;
        color: #666;
      }

      .sf-content {
        padding: 16px;
      }

      .sf-mode-section {
        margin-bottom: 16px;
      }

      .sf-mode-section h3 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }

      .sf-mode-options {
        display: flex;
        gap: 8px;
      }

      .sf-mode-btn {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #fff;
        color: #374151;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: center;
      }

      .sf-mode-btn:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
      }

      .sf-mode-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .sf-info-section {
        padding: 12px;
        background: #f8fafc;
        border-radius: 6px;
        margin-bottom: 16px;
      }

      .sf-info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }

      .sf-info-item:last-child {
        margin-bottom: 0;
      }

      .sf-info-label {
        font-size: 12px;
        color: #6b7280;
      }

      .sf-info-value {
        font-size: 12px;
        font-weight: 500;
        color: #374151;
      }

      .sf-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .sf-btn {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #fff;
        color: #374151;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .sf-btn:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
      }

      .sf-btn.primary {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .sf-btn.primary:hover {
        background: #2563eb;
      }

      .sf-status {
        margin-top: 12px;
        padding: 8px;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 6px;
        font-size: 11px;
        color: #0c4a6e;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  render() {
    this.container.innerHTML = `
      <div class="sidepanel-fallback-ui">
        <div class="sf-header">
          <h1>${this.options.title}</h1>
          <div class="sf-mode-indicator" id="modeIndicator">Mode: ${this.currentMode}</div>
        </div>

        <div class="sf-content">
          <div class="sf-mode-section">
            <h3>Display Mode</h3>
            <div class="sf-mode-options">
              <button class="sf-mode-btn" id="sidepanelBtn">Sidepanel</button>
              <button class="sf-mode-btn" id="windowBtn">Window</button>
            </div>
          </div>

          <div class="sf-info-section">
            <div class="sf-info-item">
              <span class="sf-info-label">Current Mode</span>
              <span class="sf-info-value" id="currentMode">-</span>
            </div>
            <div class="sf-info-item">
              <span class="sf-info-label">Browser</span>
              <span class="sf-info-value" id="browserInfo">-</span>
            </div>
            <div class="sf-info-item">
              <span class="sf-info-label">Status</span>
              <span class="sf-info-value" id="status">${this.status}</span>
            </div>
          </div>

          <div class="sf-actions">
            <button class="sf-btn primary" id="toggleMode">Toggle Mode</button>
            <button class="sf-btn" id="clearCache">Clear Cache</button>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Mode buttons
    document
      .getElementById('sidepanelBtn')
      .addEventListener('click', () => this.setMode('sidepanel'));
    document.getElementById('windowBtn').addEventListener('click', () => this.setMode('window'));

    // Action buttons
    document.getElementById('toggleMode').addEventListener('click', () => this.toggleMode());
    document.getElementById('clearCache').addEventListener('click', () => this.clearCache());
  }

  detectBrowser() {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserName = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
    } else if (userAgent.includes('Edg')) {
      browserName = 'Edge';
    }

    this.browserInfo = browserName;
    this.updateDisplay();
  }

  updateDisplay() {
    const elements = {
      modeIndicator: document.getElementById('modeIndicator'),
      currentMode: document.getElementById('currentMode'),
      browserInfo: document.getElementById('browserInfo'),
      status: document.getElementById('status'),
      sidepanelBtn: document.getElementById('sidepanelBtn'),
      windowBtn: document.getElementById('windowBtn')
    };

    if (elements.modeIndicator) {
      elements.modeIndicator.textContent = `Mode: ${this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1)}`;
    }
    if (elements.currentMode) {
      elements.currentMode.textContent =
        this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1);
    }
    if (elements.browserInfo) {
      elements.browserInfo.textContent = this.browserInfo;
    }
    if (elements.status) {
      elements.status.textContent = this.status;
    }

    // Update button states
    if (elements.sidepanelBtn) {
      elements.sidepanelBtn.classList.toggle('active', this.currentMode === 'sidepanel');
    }
    if (elements.windowBtn) {
      elements.windowBtn.classList.toggle('active', this.currentMode === 'window');
    }
  }

  async updateStatus() {
    try {
      console.log('UI: Requesting status from background script...');
      const response = await this.sendMessage({ type: 'GET_STATUS' });
      console.log('UI: Got status response:', response);

      if (response.success) {
        this.currentMode = response.mode || 'unknown';
        this.status = response.status || 'Ready';
        console.log('UI: Updated mode to:', this.currentMode);
        this.updateDisplay();
      } else {
        console.error('UI: Status request failed:', response.error);
        this.status = 'Error: ' + (response.error || 'Unknown error');
        this.updateDisplay();
      }
    } catch (error) {
      console.error('UI: Failed to get status:', error);
      this.status = 'Error getting status';
      this.updateDisplay();

      // Retry after a short delay if this is the initial attempt
      if (!this.statusUpdateRetried) {
        this.statusUpdateRetried = true;
        setTimeout(() => {
          console.log('UI: Retrying status update...');
          this.updateStatus();
        }, 1000);
      }
    }
  }

  async setMode(mode) {
    console.log(`${mode.charAt(0).toUpperCase() + mode.slice(1)} mode selected`);
    this.status = `Switching to ${mode}...`;
    this.updateDisplay();

    try {
      const response = await this.sendMessage({
        type: 'SET_MODE',
        mode: mode
      });

      if (response.success) {
        await this.updateStatus();
        if (response.userAction) {
          this.status = response.userAction;
          this.updateDisplay();
        }
      } else {
        this.status = `Error: ${response.error}`;
        this.updateDisplay();
      }
    } catch (error) {
      console.error(`Failed to set ${mode} mode:`, error);
      this.status = `Error: ${error.message}`;
      this.updateDisplay();
    }
  }

  async toggleMode() {
    console.log('Toggle mode button clicked');
    this.status = 'Toggling mode...';
    this.updateDisplay();

    try {
      const response = await this.sendMessage({ type: 'TOGGLE_MODE' });

      if (response.success) {
        await this.updateStatus();
        if (response.userAction) {
          this.status = response.userAction;
          this.updateDisplay();
        }
      } else {
        this.status = `Error: ${response.error}`;
        this.updateDisplay();
      }
    } catch (error) {
      console.error('Failed to toggle mode:', error);
      this.status = `Error: ${error.message}`;
      this.updateDisplay();
    }
  }

  async clearCache() {
    console.log('Clear cache button clicked');
    this.status = 'Clearing cache...';
    this.updateDisplay();

    try {
      const response = await this.sendMessage({ type: 'CLEAR_CACHE' });

      if (response.success) {
        this.status = 'Cache cleared';
        this.updateDisplay();
        await this.updateStatus();
      } else {
        this.status = `Error: ${response.error}`;
        this.updateDisplay();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      this.status = `Error: ${error.message}`;
      this.updateDisplay();
    }
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!chrome?.runtime?.sendMessage) {
        reject(new Error('Chrome runtime not available'));
        return;
      }

      chrome.runtime.sendMessage(message, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response || { success: false, error: 'No response' });
        }
      });
    });
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SidepanelFallbackUI;
} else {
  window.SidepanelFallbackUI = SidepanelFallbackUI;
}

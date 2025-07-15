export class SettingsUI {
  constructor() {}

  /**
   * Generate HTML for settings panel
   * @param {Object} currentSettings - Current settings (default: { mode: 'sidepanel' })
   * @returns {HTMLElement} DOM element of settings panel
   */
  renderSettingsPanel(currentSettings = { mode: 'sidepanel' }) {
    const container = document.createElement('div');
    container.className = 'sidepanel-settings';

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Display Mode Settings';
    container.appendChild(title);

    // Create radio button group
    const radioOptions = [
      { value: 'sidepanel', label: 'Side Panel', checked: currentSettings.mode === 'sidepanel' },
      { value: 'window', label: 'Popup Window', checked: currentSettings.mode === 'window' }
    ];

    const radioGroup = this.createRadioGroup('mode', radioOptions);
    container.appendChild(radioGroup);

    return container;
  }

  /**
   * Bind event listeners for settings changes
   * @param {HTMLElement} panel - DOM element of settings panel
   * @param {Function} onSettingsChange - Callback for settings changes
   */
  bindEvents(panel, onSettingsChange) {
    if (!onSettingsChange) {
      return;
    }

    const radioButtons = panel.querySelectorAll('input[name="mode"]');
    radioButtons.forEach(radio => {
      radio.addEventListener('change', event => {
        if (event.target.checked) {
          onSettingsChange({ mode: event.target.value });
        }
      });
    });
  }

  /**
   * Create complete settings panel (render + event binding)
   * @param {Object} currentSettings - Current settings
   * @param {Function} onSettingsChange - Callback for settings changes
   * @returns {HTMLElement} DOM element of settings panel
   */
  createSettingsPanel(currentSettings, onSettingsChange) {
    const panel = this.renderSettingsPanel(currentSettings);
    this.bindEvents(panel, onSettingsChange);
    return panel;
  }

  /**
   * Create radio button group
   * @param {string} name - name attribute for radio buttons
   * @param {Array} options - Array of radio button options
   * @returns {HTMLElement} DOM element of radio button group
   */
  createRadioGroup(name, options) {
    const container = document.createElement('div');
    container.className = 'radio-group';
    container.style.display = 'flex';
    container.style.gap = '4px';

    options.forEach(option => {
      const label = document.createElement('label');
      label.className = 'radio-label';
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '2px';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = name;
      radio.value = option.value;
      radio.checked = option.checked;

      const span = document.createElement('span');
      span.textContent = option.label;

      label.appendChild(radio);
      label.appendChild(span);
      container.appendChild(label);
    });

    return container;
  }
}

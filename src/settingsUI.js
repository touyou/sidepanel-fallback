export class SettingsUI {
  constructor() {}

  /**
   * 設定パネルのHTMLを生成する
   * @param {Object} currentSettings - 現在の設定（デフォルト: { mode: 'sidepanel' }）
   * @returns {HTMLElement} 設定パネルのDOM要素
   */
  renderSettingsPanel(currentSettings = { mode: 'sidepanel' }) {
    const container = document.createElement('div');
    container.className = 'sidepanel-settings';

    // タイトル
    const title = document.createElement('h3');
    title.textContent = 'Display Mode Settings';
    container.appendChild(title);

    // ラジオボタングループ作成
    const radioOptions = [
      { value: 'sidepanel', label: 'Side Panel', checked: currentSettings.mode === 'sidepanel' },
      { value: 'window', label: 'Popup Window', checked: currentSettings.mode === 'window' }
    ];

    const radioGroup = this.createRadioGroup('mode', radioOptions);
    container.appendChild(radioGroup);

    return container;
  }

  /**
   * 設定変更時のイベントリスナーをバインドする
   * @param {HTMLElement} panel - 設定パネルのDOM要素
   * @param {Function} onSettingsChange - 設定変更時のコールバック
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
   * 完全な設定パネル（描画 + イベントバインド）を作成する
   * @param {Object} currentSettings - 現在の設定
   * @param {Function} onSettingsChange - 設定変更時のコールバック
   * @returns {HTMLElement} 設定パネルのDOM要素
   */
  createSettingsPanel(currentSettings, onSettingsChange) {
    const panel = this.renderSettingsPanel(currentSettings);
    this.bindEvents(panel, onSettingsChange);
    return panel;
  }

  /**
   * ラジオボタングループを作成する
   * @param {string} name - ラジオボタンのname属性
   * @param {Array} options - ラジオボタンのオプション配列
   * @returns {HTMLElement} ラジオボタングループのDOM要素
   */
  createRadioGroup(name, options) {
    const container = document.createElement('div');
    container.className = 'radio-group';

    options.forEach(option => {
      const label = document.createElement('label');
      label.className = 'radio-label';

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

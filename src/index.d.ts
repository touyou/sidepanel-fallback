/**
 * SidepanelFallback - A lightweight fallback utility for Chrome Extensions
 * to handle side panel conflicts with browser-specific storage and display mode switching.
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  supportsPopup: boolean;
  supportsSidepanel: boolean;
}

export interface StorageMode {
  mode: 'sidepanel' | 'window' | 'auto';
  browserKey: string;
  lastUpdated: number;
}

export interface PanelOptions {
  url?: string;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  focused?: boolean;
  type?: 'popup' | 'normal';
}

export interface SettingsUIOptions {
  title?: string;
  showBrowserInfo?: boolean;
  onModeChange?: (mode: string) => void;
}

export interface SidepanelFallbackOptions {
  defaultMode?: 'sidepanel' | 'window' | 'auto';
  userAgent?: string;
}

export interface InitResult {
  browser: string;
  mode: string;
}

export interface OpenPanelResult {
  success: boolean;
  method?: string;
  fallback?: boolean;
  error?: string;
}

export interface SettingsUIResult {
  success: boolean;
  error?: string;
}

export interface CurrentSettings {
  browser: string;
  mode: string;
}

/**
 * Main SidepanelFallback class
 */
export declare class SidepanelFallback {
  constructor(options?: SidepanelFallbackOptions);

  /**
   * Initialize the fallback system
   */
  init(): Promise<InitResult>;

  /**
   * Open panel using the best available method
   */
  openPanel(path: string): Promise<OpenPanelResult>;

  /**
   * Add settings UI to the provided container
   */
  withSettingsUI(container: HTMLElement): Promise<SettingsUIResult>;

  /**
   * Get current settings and configuration
   */
  getCurrentSettings(): CurrentSettings | null;
}

/**
 * Browser information utilities
 */
export declare function getBrowserInfo(userAgent?: string): string;

/**
 * Mode Storage class
 */
export declare class ModeStorage {
  constructor();
  setMode(browser: string, mode: string): Promise<void>;
  getMode(browser: string): Promise<string | null>;
  clear(): Promise<void>;
}

/**
 * Panel Launcher class
 */
export declare class PanelLauncher {
  constructor();
  openPanel(path: string, mode: string): Promise<OpenPanelResult>;
}

/**
 * Settings UI class
 */
export declare class SettingsUI {
  constructor();
  createSettingsPanel(currentSettings: any, onSettingsChange: (settings: any) => void): HTMLElement;
}

export default SidepanelFallback;

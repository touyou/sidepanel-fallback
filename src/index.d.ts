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
  storageKey?: string;
  enableDebugMode?: boolean;
}

export interface CurrentSettings {
  mode: 'sidepanel' | 'window' | 'auto';
  browserInfo: BrowserInfo;
  storageMode: StorageMode;
  isInitialized: boolean;
}

/**
 * Main SidepanelFallback class
 */
export declare class SidepanelFallback {
  constructor(options?: SidepanelFallbackOptions);

  /**
   * Initialize the fallback system
   */
  init(): Promise<void>;

  /**
   * Open panel using the best available method
   */
  openPanel(url?: string, options?: PanelOptions): Promise<void>;

  /**
   * Add settings UI to the provided container
   */
  withSettingsUI(container: HTMLElement, options?: SettingsUIOptions): Promise<void>;

  /**
   * Get current settings and configuration
   */
  getCurrentSettings(): CurrentSettings;

  /**
   * Check if the system is initialized
   */
  isInitialized(): boolean;

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean): void;
}

/**
 * Browser information utilities
 */
export declare namespace BrowserUtils {
  function getBrowserInfo(): BrowserInfo;
  function isChrome(): boolean;
  function isFirefox(): boolean;
  function isSafari(): boolean;
  function isEdge(): boolean;
  function supportsPopup(): boolean;
  function supportsSidepanel(): boolean;
}

/**
 * Storage utilities
 */
export declare namespace StorageUtils {
  function getStorageMode(browserKey: string): Promise<StorageMode | null>;
  function setStorageMode(mode: StorageMode): Promise<void>;
  function clearStorageMode(browserKey: string): Promise<void>;
}

/**
 * Panel launcher utilities
 */
export declare namespace PanelLauncher {
  function openSidePanel(url: string): Promise<void>;
  function openPopupWindow(url: string, options?: PanelOptions): Promise<Window | null>;
  function canUseSidePanel(): boolean;
}

/**
 * Settings UI utilities
 */
export declare namespace SettingsUI {
  function createSettingsUI(
    container: HTMLElement,
    options?: SettingsUIOptions
  ): Promise<HTMLElement>;
  function updateSettingsDisplay(settings: CurrentSettings): void;
  function bindEventHandlers(onModeChange?: (mode: string) => void): void;
}

export default SidepanelFallback;

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
  
  // Dependency injection options
  enableDependencyInjection?: boolean;
  container?: any;
  storage?: any;
  launcher?: any;
  settingsUI?: any;
  browserDetector?: any;
  eventEmitter?: EventEmitter;
  
  // Legacy compatibility
  strictValidation?: boolean;
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
 * Enhanced result structures with metadata support
 */
export interface ResultMetadata {
  timestamp: string;
  [key: string]: any;
}

export interface ResultContext {
  timestamp: string;
  [key: string]: any;
}

export interface StructuredResult<T = any> {
  success: boolean;
  error?: string;
  errorCode?: string;
  metadata?: ResultMetadata;
  context?: ResultContext;
}

export interface StructuredSuccessResult<T = any> extends StructuredResult<T> {
  success: true;
  metadata: ResultMetadata;
}

export interface StructuredErrorResult extends StructuredResult {
  success: false;
  error: string;
  errorCode: string;
  context: ResultContext;
}

/**
 * Configuration and validation types
 */
export interface SidepanelFallbackConfig {
  defaultMode?: 'auto' | 'sidepanel' | 'window';
  userAgent?: string;
  storagePrefix?: string;
  enableDebugMode?: boolean;
  validModes?: string[];
  supportedBrowsers?: string[];
  strictValidation?: boolean;
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  errors?: Array<{
    key: string;
    error: string;
    context?: any;
  }>;
  providedConfig?: any;
}

/**
 * Error codes for different types of failures
 */
export enum ErrorCodes {
  // Initialization errors
  INIT_FAILED = 'INIT_FAILED',
  BROWSER_DETECTION_FAILED = 'BROWSER_DETECTION_FAILED',
  STORAGE_INIT_FAILED = 'STORAGE_INIT_FAILED',

  // Input validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_BROWSER = 'INVALID_BROWSER',
  INVALID_MODE = 'INVALID_MODE',
  INVALID_PATH = 'INVALID_PATH',
  INVALID_CONTAINER = 'INVALID_CONTAINER',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Operation errors
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  PANEL_OPEN_FAILED = 'PANEL_OPEN_FAILED',
  STORAGE_OPERATION_FAILED = 'STORAGE_OPERATION_FAILED',
  UI_CREATION_FAILED = 'UI_CREATION_FAILED',

  // Browser/API errors
  SIDEPANEL_API_UNAVAILABLE = 'SIDEPANEL_API_UNAVAILABLE',
  POPUP_BLOCKED = 'POPUP_BLOCKED',
  EXTENSION_CONTEXT_INVALID = 'EXTENSION_CONTEXT_INVALID'
}

/**
 * Main SidepanelFallback class
 */
export declare class SidepanelFallback {
  constructor(options?: SidepanelFallbackConfig);

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

  /**
   * Event system methods
   */
  on(eventName: string, listener: EventListener): () => void;
  once(eventName: string, listener: EventListener): () => void;
  off(eventName: string, listener: EventListener): void;
  debug(operation: string, context?: Record<string, any>): void;

  /**
   * Static event constants
   */
  static readonly EVENTS: SidepanelEvents;
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

/**
 * Event system interfaces
 */
export interface EventListener {
  (event: any): void;
}

export interface EventEmitter {
  on(eventName: string, listener: EventListener): () => void;
  once(eventName: string, listener: EventListener): () => void;
  off(eventName: string, listener: EventListener): void;
  emit(eventName: string, ...args: any[]): boolean;
  removeAllListeners(eventName?: string): void;
}

export interface DebugEvent {
  timestamp: string;
  operation: string;
  context: Record<string, any>;
}

export interface ErrorEvent {
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  operation: string;
  context: Record<string, any>;
}

export interface SidepanelEvents {
  BEFORE_INIT: 'beforeInit';
  AFTER_INIT: 'afterInit';
  INIT_ERROR: 'initError';
  BEFORE_OPEN_PANEL: 'beforeOpenPanel';
  AFTER_OPEN_PANEL: 'afterOpenPanel';
  PANEL_OPEN_ERROR: 'panelOpenError';
  BEFORE_SETTINGS_CHANGE: 'beforeSettingsChange';
  AFTER_SETTINGS_CHANGE: 'afterSettingsChange';
  SETTINGS_ERROR: 'settingsError';
  MODE_CHANGED: 'modeChanged';
  BROWSER_DETECTED: 'browserDetected';
  STORAGE_READ: 'storageRead';
  STORAGE_WRITE: 'storageWrite';
  STORAGE_ERROR: 'storageError';
  DEBUG: 'debug';
  ERROR: 'error';
  WARNING: 'warning';
}

export default SidepanelFallback;

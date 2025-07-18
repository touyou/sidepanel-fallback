(function (g, l) {
  typeof exports == 'object' && typeof module < 'u'
    ? l(exports)
    : typeof define == 'function' && define.amd
      ? define(['exports'], l)
      : ((g = typeof globalThis < 'u' ? globalThis : g || self), l((g.SidepanelFallback = {})));
})(this, function (g) {
  'use strict';
  function l(r) {
    if (!r || typeof r != 'string') return 'unknown';
    const e = r.toLowerCase();
    return e.includes('dia/')
      ? 'dia'
      : e.includes('edg/')
        ? 'edge'
        : e.includes('chrome/')
          ? 'chrome'
          : e.includes('firefox/')
            ? 'firefox'
            : e.includes('safari/') && e.includes('webkit/') && !e.includes('chrome/')
              ? 'safari'
              : 'unknown';
  }
  class f {
    constructor() {
      ((this.storagePrefix = 'sidepanel-fallback-mode-'),
        (this.validModes = ['sidepanel', 'window', 'auto']));
    }
    _isExtensionContext() {
      return typeof chrome < 'u' && chrome.storage && chrome.storage.sync;
    }
    _validateInputs(e, t) {
      if (!e || typeof e != 'string' || e.trim() === '') throw new Error('Invalid browser name');
      if (!t || typeof t != 'string' || !this.validModes.includes(t))
        throw new Error('Invalid mode');
    }
    _getStorageKey(e) {
      return this.storagePrefix + e;
    }
    async setMode(e, t) {
      this._validateInputs(e, t);
      const s = this._getStorageKey(e);
      return this._isExtensionContext()
        ? new Promise((i, n) => {
            const o = {};
            ((o[s] = t),
              chrome.storage.sync.set(o, () => {
                chrome.runtime.lastError ? n(new Error(chrome.runtime.lastError.message)) : i();
              }));
          })
        : (localStorage.setItem(s, t), Promise.resolve());
    }
    async getMode(e) {
      if (!e || typeof e != 'string' || e.trim() === '') return null;
      const t = this._getStorageKey(e);
      if (this._isExtensionContext())
        return new Promise(s => {
          chrome.storage.sync.get(t, i => {
            s(i[t] || null);
          });
        });
      {
        const s = localStorage.getItem(t);
        return Promise.resolve(s);
      }
    }
    async clear() {
      if (this._isExtensionContext())
        return new Promise(e => {
          chrome.storage.sync.clear(() => {
            e();
          });
        });
      {
        const e = [];
        for (let t = 0; t < localStorage.length; t++) {
          const s = localStorage.key(t);
          s && s.startsWith(this.storagePrefix) && e.push(s);
        }
        return (e.forEach(t => localStorage.removeItem(t)), Promise.resolve());
      }
    }
  }
  class p {
    constructor() {}
    async openPanel(e, t) {
      var s;
      if (e !== 'sidepanel' && e !== 'window')
        return { success: !1, error: `Invalid mode: ${e}. Must be "sidepanel" or "window"` };
      if ((console.log(`Opening panel in ${e} mode with path: ${t}`), e === 'sidepanel'))
        if (this.isExtensionContext())
          try {
            return (
              t && (await chrome.sidePanel.setOptions({ path: t, enabled: !0 })),
              await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: !0 }),
              {
                success: !0,
                method: 'sidepanel',
                userAction: 'Click the sidepanel icon in browser toolbar'
              }
            );
          } catch (i) {
            return (
              console.warn('Failed to setup sidepanel, falling back to window mode:', i),
              this._openWindow(t, !0)
            );
          }
        else return this._openWindow(t, !0);
      if (e === 'window') {
        if (
          this.isChromeExtensionContext() &&
          typeof ((s = chrome.sidePanel) == null ? void 0 : s.setPanelBehavior) == 'function'
        )
          try {
            (await chrome.sidePanel.setOptions({ enabled: !1 }),
              await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: !1 }));
          } catch {}
        return this._openWindow(t, !1);
      }
    }
    isExtensionContext() {
      return !!(
        typeof chrome < 'u' &&
        chrome.sidePanel &&
        typeof chrome.sidePanel.open == 'function' &&
        typeof chrome.sidePanel.setOptions == 'function'
      );
    }
    isChromeExtensionContext() {
      return !!(typeof chrome < 'u' && chrome.runtime && chrome.runtime.id);
    }
    async _openWindow(e, t) {
      if (this.isChromeExtensionContext())
        try {
          const s =
              e.startsWith('chrome-extension://') || e.startsWith('http')
                ? e
                : chrome.runtime.getURL(e),
            i = await chrome.windows.create({
              url: s,
              type: 'popup',
              width: 400,
              height: 600,
              focused: !0
            }),
            n = { success: !0, method: 'window' };
          return (t && (n.fallback = !0), n);
        } catch (s) {
          return { success: !1, error: `Failed to open panel: ${s.message}` };
        }
      else {
        if (typeof window > 'u')
          return { success: !1, error: 'Failed to open panel: window is not defined' };
        const i = window.open(
          e,
          'sidepanel_fallback',
          'width=400,height=600,scrollbars=yes,resizable=yes'
        );
        if (i) {
          i.focus();
          const n = { success: !0, method: 'window' };
          return (t && (n.fallback = !0), n);
        } else return { success: !1, error: 'Failed to open popup window' };
      }
    }
    async setMode(e) {
      var t, s;
      if (e !== 'sidepanel' && e !== 'window')
        return { success: !1, error: `Invalid mode: ${e}. Must be "sidepanel" or "window"` };
      try {
        return (
          e === 'sidepanel'
            ? this.isChromeExtensionContext() &&
              typeof ((t = chrome.sidePanel) == null ? void 0 : t.setOptions) == 'function' &&
              (await chrome.sidePanel.setOptions({ enabled: !0 }),
              await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: !0 }))
            : e === 'window' &&
              this.isChromeExtensionContext() &&
              typeof ((s = chrome.sidePanel) == null ? void 0 : s.setOptions) == 'function' &&
              (await chrome.sidePanel.setOptions({ enabled: !1 }),
              await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: !1 })),
          { success: !0, mode: e }
        );
      } catch (i) {
        return { success: !1, mode: e, error: i.message };
      }
    }
  }
  class w {
    constructor() {}
    renderSettingsPanel(e = { mode: 'sidepanel' }) {
      const t = document.createElement('div');
      t.className = 'sidepanel-settings';
      const s = document.createElement('h3');
      ((s.textContent = 'Display Mode Settings'), t.appendChild(s));
      const i = [
          { value: 'sidepanel', label: 'Side Panel', checked: e.mode === 'sidepanel' },
          { value: 'window', label: 'Popup Window', checked: e.mode === 'window' }
        ],
        n = this.createRadioGroup('mode', i);
      return (t.appendChild(n), t);
    }
    bindEvents(e, t) {
      if (!t) return;
      e.querySelectorAll('input[name="mode"]').forEach(i => {
        i.addEventListener('change', n => {
          n.target.checked && t({ mode: n.target.value });
        });
      });
    }
    createSettingsPanel(e, t) {
      const s = this.renderSettingsPanel(e);
      return (this.bindEvents(s, t), s);
    }
    createRadioGroup(e, t) {
      const s = document.createElement('div');
      return (
        (s.className = 'radio-group'),
        (s.style.display = 'flex'),
        (s.style.gap = '4px'),
        t.forEach(i => {
          const n = document.createElement('label');
          ((n.className = 'radio-label'),
            (n.style.display = 'flex'),
            (n.style.alignItems = 'center'),
            (n.style.gap = '2px'));
          const o = document.createElement('input');
          ((o.type = 'radio'), (o.name = e), (o.value = i.value), (o.checked = i.checked));
          const d = document.createElement('span');
          ((d.textContent = i.label), n.appendChild(o), n.appendChild(d), s.appendChild(n));
        }),
        s
      );
    }
  }
  const c = {
    INIT_FAILED: 'INIT_FAILED',
    INVALID_INPUT: 'INVALID_INPUT',
    INVALID_PATH: 'INVALID_PATH',
    INVALID_CONTAINER: 'INVALID_CONTAINER',
    NOT_INITIALIZED: 'NOT_INITIALIZED',
    PANEL_OPEN_FAILED: 'PANEL_OPEN_FAILED',
    UI_CREATION_FAILED: 'UI_CREATION_FAILED'
  };
  function h(r, e, t = {}) {
    return {
      success: !1,
      error: e,
      errorCode: r,
      context: { ...t, timestamp: new Date().toISOString() }
    };
  }
  function b(r = {}, e = {}) {
    return { success: !0, ...r, metadata: { ...e, timestamp: new Date().toISOString() } };
  }
  const E = {
      defaultMode: 'auto',
      userAgent: null,
      storagePrefix: 'sidepanel-fallback-mode-',
      enableDebugMode: !1,
      validModes: ['sidepanel', 'window', 'auto'],
      supportedBrowsers: ['chrome', 'firefox', 'safari', 'edge', 'dia']
    },
    I = {
      defaultMode: {
        type: 'string',
        required: !1,
        validValues: E.validModes,
        description: 'Default display mode when no saved preference exists'
      },
      userAgent: {
        type: 'string',
        required: !1,
        allowNull: !0,
        description: 'Custom user agent string for browser detection'
      },
      storagePrefix: {
        type: 'string',
        required: !1,
        minLength: 1,
        description: 'Prefix for localStorage keys'
      },
      enableDebugMode: {
        type: 'boolean',
        required: !1,
        description: 'Enable debug logging and additional context'
      }
    };
  function z(r, e, t) {
    if (e === void 0)
      return t.required
        ? h(c.INVALID_INPUT, `Configuration key '${r}' is required`, { key: r, schema: t })
        : { success: !0 };
    if (e === null)
      return t.allowNull
        ? { success: !0 }
        : h(c.INVALID_INPUT, `Configuration key '${r}' cannot be null`, {
            key: r,
            value: e,
            schema: t
          });
    if (typeof e !== t.type)
      return h(
        c.INVALID_INPUT,
        `Configuration key '${r}' must be of type ${t.type}, got ${typeof e}`,
        { key: r, value: e, expectedType: t.type, actualType: typeof e }
      );
    if (t.type === 'string') {
      if (t.minLength && e.length < t.minLength)
        return h(
          c.INVALID_INPUT,
          `Configuration key '${r}' must be at least ${t.minLength} characters long`,
          { key: r, value: e, minLength: t.minLength, actualLength: e.length }
        );
      if (t.validValues && !t.validValues.includes(e))
        return h(
          c.INVALID_INPUT,
          `Configuration key '${r}' must be one of: ${t.validValues.join(', ')}`,
          { key: r, value: e, validValues: t.validValues }
        );
    }
    return { success: !0 };
  }
  function L(r) {
    if (!r || typeof r != 'object')
      return h(c.INVALID_INPUT, 'Configuration must be an object', { providedConfig: r });
    const e = [];
    for (const [t, s] of Object.entries(r)) {
      const i = I[t];
      if (!i) {
        e.push({ key: t, error: `Unknown configuration key '${t}'`, validKeys: Object.keys(I) });
        continue;
      }
      const n = z(t, s, i);
      n.success || e.push({ key: t, error: n.error, context: n.context });
    }
    return e.length > 0
      ? h(c.INVALID_INPUT, `Configuration validation failed: ${e.length} error(s)`, {
          errors: e,
          providedConfig: r
        })
      : { success: !0 };
  }
  function A(r = {}) {
    const e = L(r);
    if (!e.success) return e;
    const t = { ...E, ...r };
    return {
      success: !0,
      config: t,
      metadata: {
        userProvidedKeys: Object.keys(r),
        defaultKeys: Object.keys(E),
        finalKeys: Object.keys(t)
      }
    };
  }
  function D(r, e = 'simple') {
    if (!r || typeof r != 'object') return r;
    switch (e) {
      case 'openPanel':
        return M(r);
      case 'init':
        return O(r);
      case 'settings':
        return R(r);
      default:
        return x(r);
    }
  }
  function M(r) {
    if (!r.success) return { success: !1, error: r.error };
    const e = { success: !0, method: r.method };
    return (
      r.userAction && (e.userAction = r.userAction),
      r.fallback === !0 && (e.fallback = !0),
      e
    );
  }
  function O(r) {
    if (!r.success) throw new Error(r.error);
    return { success: !0, browser: r.browser, mode: r.mode };
  }
  function R(r) {
    return { success: r.success, ...(r.error && { error: r.error }) };
  }
  function x(r) {
    const e = { success: r.success };
    return (!r.success && r.error && (e.error = r.error), e);
  }
  function N(r) {
    return (
      r && typeof r == 'object' && (r.hasOwnProperty('metadata') || r.hasOwnProperty('context'))
    );
  }
  function m(r, e = 'simple') {
    return N(r) ? D(r, e) : r;
  }
  class S {
    constructor() {
      ((this._events = new Map()), (this._maxListeners = 100));
    }
    on(e, t) {
      if (typeof t != 'function') throw new TypeError('Listener must be a function');
      this._events.has(e) || this._events.set(e, []);
      const s = this._events.get(e);
      return (
        s.length >= this._maxListeners &&
          console.warn(
            `Warning: Possible EventEmitter memory leak detected. ${s.length + 1} listeners added for event "${e}". Use setMaxListeners() to increase limit.`
          ),
        s.push(t),
        () => this.off(e, t)
      );
    }
    once(e, t) {
      const s = (...i) => {
        (this.off(e, s), t.apply(this, i));
      };
      return this.on(e, s);
    }
    off(e, t) {
      if (!this._events.has(e)) return;
      const s = this._events.get(e),
        i = s.indexOf(t);
      i !== -1 && (s.splice(i, 1), s.length === 0 && this._events.delete(e));
    }
    emit(e, ...t) {
      if (!this._events.has(e)) return !1;
      const s = this._events.get(e).slice();
      for (const i of s)
        try {
          i.apply(this, t);
        } catch (n) {
          console.error(`Error in event listener for "${e}":`, n);
        }
      return s.length > 0;
    }
    removeAllListeners(e) {
      e ? this._events.delete(e) : this._events.clear();
    }
    setMaxListeners(e) {
      if (typeof e != 'number' || e < 0) throw new TypeError('n must be a non-negative number');
      this._maxListeners = e;
    }
    getMaxListeners() {
      return this._maxListeners;
    }
    listenerCount(e) {
      return this._events.has(e) ? this._events.get(e).length : 0;
    }
    eventNames() {
      return Array.from(this._events.keys());
    }
  }
  const a = {
    BEFORE_INIT: 'beforeInit',
    AFTER_INIT: 'afterInit',
    INIT_ERROR: 'initError',
    BEFORE_OPEN_PANEL: 'beforeOpenPanel',
    AFTER_OPEN_PANEL: 'afterOpenPanel',
    PANEL_OPEN_ERROR: 'panelOpenError',
    BEFORE_SETTINGS_CHANGE: 'beforeSettingsChange',
    AFTER_SETTINGS_CHANGE: 'afterSettingsChange',
    SETTINGS_ERROR: 'settingsError',
    MODE_CHANGED: 'modeChanged',
    BROWSER_DETECTED: 'browserDetected',
    STORAGE_READ: 'storageRead',
    STORAGE_WRITE: 'storageWrite',
    STORAGE_ERROR: 'storageError',
    DEBUG: 'debug',
    ERROR: 'error',
    WARNING: 'warning'
  };
  function P(r, e = {}) {
    return { timestamp: new Date().toISOString(), operation: r, context: e };
  }
  function _(r, e, t = {}) {
    return {
      timestamp: new Date().toISOString(),
      error: { name: r.name, message: r.message, stack: r.stack },
      operation: e,
      context: t
    };
  }
  const y = Object.freeze(
    Object.defineProperty(
      { __proto__: null, EVENTS: a, EventEmitter: S, createDebugEvent: P, createErrorEvent: _ },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  );
  class k {
    async setMode(e, t) {
      throw new Error('setMode must be implemented by storage provider');
    }
    async getMode(e) {
      throw new Error('getMode must be implemented by storage provider');
    }
    async clear() {
      throw new Error('clear must be implemented by storage provider');
    }
  }
  class U {
    async openPanel(e, t) {
      throw new Error('openPanel must be implemented by panel launcher');
    }
    isExtensionContext() {
      throw new Error('isExtensionContext must be implemented by panel launcher');
    }
  }
  class B {
    createSettingsPanel(e, t) {
      throw new Error('createSettingsPanel must be implemented by settings UI');
    }
  }
  class F {
    getBrowserInfo(e) {
      throw new Error('getBrowserInfo must be implemented by browser detector');
    }
  }
  class $ extends k {
    constructor() {
      (super(), (this._storage = new f()));
    }
    async setMode(e, t) {
      return this._storage.setMode(e, t);
    }
    async getMode(e) {
      return this._storage.getMode(e);
    }
    async clear() {
      return this._storage.clear();
    }
  }
  class j extends U {
    constructor() {
      (super(), (this._launcher = new p()));
    }
    async openPanel(e, t) {
      return this._launcher.openPanel(e, t);
    }
    isExtensionContext() {
      return this._launcher.isExtensionContext();
    }
  }
  class q extends B {
    constructor() {
      (super(), (this._ui = new w()));
    }
    createSettingsPanel(e, t) {
      return this._ui.createSettingsPanel(e, t);
    }
  }
  class V extends F {
    getBrowserInfo(e) {
      return l(e);
    }
  }
  class G extends S {
    constructor() {
      super();
    }
  }
  class W {
    constructor() {
      ((this._providers = new Map()),
        (this._instances = new Map()),
        this.registerProvider('storage', $),
        this.registerProvider('launcher', j),
        this.registerProvider('settingsUI', q),
        this.registerProvider('browserDetector', V),
        this.registerProvider('eventEmitter', G));
    }
    registerProvider(e, t) {
      (this._providers.set(e, t), this._instances.has(e) && this._instances.delete(e));
    }
    registerInstance(e, t) {
      this._instances.set(e, t);
    }
    get(e) {
      if (this._instances.has(e)) return this._instances.get(e);
      const t = this._providers.get(e);
      if (!t) throw new Error(`No provider registered for service: ${e}`);
      const s = new t();
      return (this._instances.set(e, s), s);
    }
    create(e) {
      const t = this._providers.get(e);
      if (!t) throw new Error(`No provider registered for service: ${e}`);
      return new t();
    }
    clear() {
      this._instances.clear();
    }
    hasProvider(e) {
      return this._providers.has(e);
    }
    getServiceNames() {
      return Array.from(this._providers.keys());
    }
  }
  const H = new W();
  class v {
    constructor(e) {
      ((this.operation = e), (this.startTime = performance.now()), (this.marks = new Map()));
    }
    mark(e, t = {}) {
      const s = performance.now();
      this.marks.set(e, { timestamp: s, duration: s - this.startTime, context: t });
    }
    complete(e = {}) {
      const t = performance.now(),
        s = t - this.startTime;
      return {
        operation: this.operation,
        totalDuration: s,
        startTime: this.startTime,
        endTime: t,
        marks: Object.fromEntries(this.marks),
        context: e
      };
    }
  }
  class K {
    constructor() {
      ((this._cache = new Map()), (this._loading = new Map()));
    }
    async load(e, t) {
      if (this._cache.has(e)) return this._cache.get(e);
      if (this._loading.has(e)) return this._loading.get(e);
      const s = this._loadWithPerformanceTracking(e, t);
      this._loading.set(e, s);
      try {
        const i = await s;
        return (this._cache.set(e, i), this._loading.delete(e), i);
      } catch (i) {
        throw (this._loading.delete(e), i);
      }
    }
    async _loadWithPerformanceTracking(e, t) {
      const s = new v(`lazy-load-${e}`);
      try {
        s.mark('load-start');
        const i = await t();
        if (
          (s.mark('load-complete'), typeof globalThis < 'u' && globalThis.sidepanelFallbackInstance)
        ) {
          const n = globalThis.sidepanelFallbackInstance;
          n.eventEmitter &&
            n.eventEmitter.emit(
              'performance',
              s.complete({ type: 'lazy-load', key: e, success: !0 })
            );
        }
        return i;
      } catch (i) {
        if (
          (s.mark('load-error'), typeof globalThis < 'u' && globalThis.sidepanelFallbackInstance)
        ) {
          const n = globalThis.sidepanelFallbackInstance;
          n.eventEmitter &&
            n.eventEmitter.emit(
              'performance',
              s.complete({ type: 'lazy-load', key: e, success: !1, error: i.message })
            );
        }
        throw i;
      }
    }
    async preload(e) {
      const t = e.map(({ key: s, loader: i }) =>
        this.load(s, i).catch(n => (console.warn(`Failed to preload component ${s}:`, n), null))
      );
      await Promise.allSettled(t);
    }
    clearCache(e) {
      e ? this._cache.delete(e) : this._cache.clear();
    }
    getCacheStats() {
      return {
        cached: this._cache.size,
        loading: this._loading.size,
        keys: Array.from(this._cache.keys())
      };
    }
  }
  class Z {
    constructor() {
      ((this.stages = new Map()), (this.completedStages = new Set()), (this.currentStage = null));
    }
    defineStage(e, t, s = {}) {
      this.stages.set(e, {
        name: e,
        initializer: t,
        dependencies: s.dependencies || [],
        priority: s.priority || 0,
        required: s.required !== !1,
        timeout: s.timeout || 5e3
      });
    }
    async initialize(e) {
      const t = new v('progressive-initialization'),
        s = {},
        i = {};
      try {
        const n = e ? e.map(o => this.stages.get(o)).filter(Boolean) : this._getSortedStages();
        t.mark('stages-start', { count: n.length });
        for (const o of n)
          if (!this.completedStages.has(o.name))
            try {
              ((this.currentStage = o.name), t.mark(`stage-${o.name}-start`));
              for (const C of o.dependencies)
                if (!this.completedStages.has(C))
                  throw new Error(`Dependency ${C} not completed for stage ${o.name}`);
              const d = await this._runStageWithTimeout(o);
              ((s[o.name] = d),
                this.completedStages.add(o.name),
                t.mark(`stage-${o.name}-complete`));
            } catch (d) {
              if ((t.mark(`stage-${o.name}-error`), (i[o.name] = d), o.required))
                throw new Error(`Required stage ${o.name} failed: ${d.message}`);
              console.warn(`Optional stage ${o.name} failed:`, d);
            }
        return (
          (this.currentStage = null),
          t.mark('stages-complete'),
          {
            success: !0,
            results: s,
            errors: i,
            performance: t.complete({
              completedStages: Array.from(this.completedStages),
              totalStages: n.length
            })
          }
        );
      } catch (n) {
        return (
          (this.currentStage = null),
          t.mark('initialization-error'),
          {
            success: !1,
            error: n,
            results: s,
            errors: i,
            performance: t.complete({
              completedStages: Array.from(this.completedStages),
              failedAt: this.currentStage
            })
          }
        );
      }
    }
    async _runStageWithTimeout(e) {
      return new Promise((t, s) => {
        const i = setTimeout(() => {
          s(new Error(`Stage ${e.name} timed out after ${e.timeout}ms`));
        }, e.timeout);
        Promise.resolve(e.initializer())
          .then(n => {
            (clearTimeout(i), t(n));
          })
          .catch(n => {
            (clearTimeout(i), s(n));
          });
      });
    }
    _getSortedStages() {
      return Array.from(this.stages.values()).sort((t, s) =>
        t.dependencies.includes(s.name)
          ? 1
          : s.dependencies.includes(t.name)
            ? -1
            : s.priority - t.priority
      );
    }
    isStageCompleted(e) {
      return this.completedStages.has(e);
    }
    getStatus() {
      return {
        currentStage: this.currentStage,
        completedStages: Array.from(this.completedStages),
        totalStages: this.stages.size,
        isComplete: this.completedStages.size === this.stages.size
      };
    }
  }
  const J = new K();
  function u(r) {
    return async () => {
      const e = await import(r);
      return e.default || e;
    };
  }
  class Q {
    constructor() {
      ((this.snapshots = []), (this.isSupported = 'memory' in performance));
    }
    snapshot(e = 'default') {
      if (!this.isSupported) return null;
      const t = {
        label: e,
        timestamp: Date.now(),
        memory: {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        }
      };
      return (this.snapshots.push(t), this.snapshots.length > 50 && this.snapshots.shift(), t);
    }
    getDiff(e, t) {
      const s = this.snapshots.find(n => n.label === e),
        i = this.snapshots.find(n => n.label === t);
      return !s || !i
        ? null
        : {
            duration: i.timestamp - s.timestamp,
            memoryDiff: {
              used: i.memory.used - s.memory.used,
              total: i.memory.total - s.memory.total
            },
            start: s,
            end: i
          };
    }
    getSnapshots() {
      return [...this.snapshots];
    }
  }
  const X = new Q();
  class Y {
    constructor(e = 100) {
      ((this.cache = new Map()), (this.maxSize = e), (this.hits = 0), (this.misses = 0));
    }
    get(e, t) {
      const s = this._hashUserAgent(e);
      if (this.cache.has(s)) {
        this.hits++;
        const n = this.cache.get(s);
        return (this.cache.delete(s), this.cache.set(s, n), n.browser);
      }
      this.misses++;
      const i = t(e);
      return (this.set(s, { browser: i, timestamp: Date.now() }), i);
    }
    set(e, t) {
      if (this.cache.size >= this.maxSize) {
        const s = this.cache.keys().next().value;
        this.cache.delete(s);
      }
      this.cache.set(e, t);
    }
    clear() {
      (this.cache.clear(), (this.hits = 0), (this.misses = 0));
    }
    getStats() {
      const e = this.hits + this.misses;
      return {
        size: this.cache.size,
        maxSize: this.maxSize,
        hits: this.hits,
        misses: this.misses,
        hitRate: e > 0 ? this.hits / e : 0
      };
    }
    _hashUserAgent(e) {
      let t = 0;
      for (let s = 0; s < e.length; s++) {
        const i = e.charCodeAt(s);
        ((t = (t << 5) - t + i), (t = t & t));
      }
      return t.toString(36);
    }
  }
  class ee {
    constructor(e, t = {}) {
      ((this.storage = e),
        (this.batchSize = t.batchSize || 10),
        (this.batchTimeout = t.batchTimeout || 500),
        (this.pendingOperations = new Map()),
        (this.batchTimer = null),
        (this.stats = { operations: 0, batches: 0, batchSizes: [] }));
    }
    async get(e) {
      if (this.pendingOperations.has(e)) {
        const t = this.pendingOperations.get(e);
        if (t.type === 'set') return t.value;
        if (t.type === 'remove') return null;
      }
      return await this.storage.get(e);
    }
    async getMode(e) {
      return this.storage.getMode ? await this.storage.getMode(e) : await this.get(`mode_${e}`);
    }
    async setMode(e, t) {
      return this.storage.setMode
        ? await this.storage.setMode(e, t)
        : await this.set(`mode_${e}`, t);
    }
    async clear() {
      if ((await this.flush(), this.storage.clear)) return await this.storage.clear();
      throw new Error('Clear operation not supported by underlying storage');
    }
    async set(e, t) {
      return (
        this.pendingOperations.set(e, { type: 'set', key: e, value: t, timestamp: Date.now() }),
        this.stats.operations++,
        this._scheduleBatch(),
        Promise.resolve()
      );
    }
    async remove(e) {
      return (
        this.pendingOperations.set(e, { type: 'remove', key: e, timestamp: Date.now() }),
        this.stats.operations++,
        this._scheduleBatch(),
        Promise.resolve()
      );
    }
    async flush() {
      return (
        this.batchTimer && (clearTimeout(this.batchTimer), (this.batchTimer = null)),
        await this._executeBatch()
      );
    }
    getBatchStats() {
      const e =
        this.stats.batchSizes.length > 0
          ? this.stats.batchSizes.reduce((t, s) => t + s, 0) / this.stats.batchSizes.length
          : 0;
      return {
        totalOperations: this.stats.operations,
        totalBatches: this.stats.batches,
        averageBatchSize: Math.round(e * 100) / 100,
        pendingOperations: this.pendingOperations.size,
        batchEfficiency: this.stats.operations > 0 ? this.stats.batches / this.stats.operations : 0
      };
    }
    _scheduleBatch() {
      if (this.pendingOperations.size >= this.batchSize) {
        (this.batchTimer && (clearTimeout(this.batchTimer), (this.batchTimer = null)),
          this._executeBatch());
        return;
      }
      this.batchTimer ||
        (this.batchTimer = setTimeout(() => {
          ((this.batchTimer = null), this._executeBatch());
        }, this.batchTimeout));
    }
    async _executeBatch() {
      if (this.pendingOperations.size === 0) return;
      const e = Array.from(this.pendingOperations.values());
      (this.pendingOperations.clear(),
        this.stats.batches++,
        this.stats.batchSizes.push(e.length),
        this.stats.batchSizes.length > 100 && this.stats.batchSizes.shift());
      const t = e.filter(i => i.type === 'set'),
        s = e.filter(i => i.type === 'remove');
      try {
        if (t.length > 0) {
          const i = {};
          (t.forEach(n => {
            i[n.key] = n.value;
          }),
            this.storage.setBatch
              ? await this.storage.setBatch(i)
              : await Promise.all(t.map(n => this.storage.set(n.key, n.value))));
        }
        s.length > 0 &&
          (this.storage.removeBatch
            ? await this.storage.removeBatch(s.map(i => i.key))
            : await Promise.all(s.map(i => this.storage.remove(i.key))));
      } catch (i) {
        throw (console.warn('Batch storage operation failed:', i), i);
      }
    }
  }
  class te {
    constructor(e = 50, t = 3e5) {
      ((this.cache = new Map()),
        (this.maxComponents = e),
        (this.maxAge = t),
        (this.stats = { hits: 0, misses: 0, evictions: 0 }));
    }
    get(e) {
      const t = this.cache.get(e);
      return t
        ? Date.now() - t.timestamp > this.maxAge
          ? (this.cache.delete(e), this.stats.misses++, null)
          : (this.stats.hits++, this.cache.delete(e), this.cache.set(e, t), t.component)
        : (this.stats.misses++, null);
    }
    set(e, t, s = {}) {
      if (this.cache.size >= this.maxComponents) {
        const i = this.cache.keys().next().value;
        (this.cache.delete(i), this.stats.evictions++);
      }
      this.cache.set(e, { component: t, timestamp: Date.now(), metadata: s });
    }
    cleanup() {
      const e = Date.now(),
        t = [];
      for (const [s, i] of this.cache.entries()) e - i.timestamp > this.maxAge && t.push(s);
      t.forEach(s => {
        (this.cache.delete(s), this.stats.evictions++);
      });
    }
    clear() {
      (this.cache.clear(), (this.stats = { hits: 0, misses: 0, evictions: 0 }));
    }
    getStats() {
      const e = this.stats.hits + this.stats.misses;
      return {
        size: this.cache.size,
        maxSize: this.maxComponents,
        hits: this.stats.hits,
        misses: this.stats.misses,
        evictions: this.stats.evictions,
        hitRate: e > 0 ? this.stats.hits / e : 0
      };
    }
  }
  const se = new Y(50),
    ie = new te(30, 6e5);
  function T(r, e = {}) {
    return new ee(r, e);
  }
  class re {
    constructor() {
      ((this.operations = []),
        (this.patterns = {
          frequentKeys: new Map(),
          operationTypes: new Map(),
          timingPatterns: []
        }));
    }
    recordOperation(e, t, s) {
      const i = { type: e, key: t, duration: s, timestamp: Date.now() };
      (this.operations.push(i),
        this.operations.length > 1e3 && this.operations.shift(),
        this._updatePatterns(i));
    }
    getRecommendations() {
      const e = [],
        t = Array.from(this.patterns.frequentKeys.entries())
          .sort((o, d) => d[1] - o[1])
          .slice(0, 10);
      t.length > 0 &&
        e.push({
          type: 'caching',
          priority: 'high',
          description: 'Consider caching frequently accessed keys',
          keys: t.map(([o]) => o)
        });
      const s = this.patterns.operationTypes.get('set') || 0,
        i = this.patterns.operationTypes.get('get') || 0;
      s > i * 0.5 &&
        e.push({
          type: 'batching',
          priority: 'medium',
          description: 'High write volume detected, consider batched storage',
          writeRatio: s / (i + s)
        });
      const n =
        this.operations.length > 0
          ? this.operations.reduce((o, d) => o + d.duration, 0) / this.operations.length
          : 0;
      return (
        n > 10 &&
          e.push({
            type: 'performance',
            priority: 'high',
            description: 'Slow storage operations detected',
            averageDuration: n
          }),
        { recommendations: e, stats: this.getStats() }
      );
    }
    getStats() {
      const e = this.operations.length,
        t = Array.from(this.patterns.operationTypes.entries()),
        s = e > 0 ? this.operations.reduce((i, n) => i + n.duration, 0) / e : 0;
      return {
        totalOperations: e,
        operationsByType: Object.fromEntries(t),
        averageDuration: Math.round(s * 100) / 100,
        frequentKeysCount: this.patterns.frequentKeys.size
      };
    }
    _updatePatterns(e) {
      const t = this.patterns.frequentKeys.get(e.key) || 0;
      this.patterns.frequentKeys.set(e.key, t + 1);
      const s = this.patterns.operationTypes.get(e.type) || 0;
      (this.patterns.operationTypes.set(e.type, s + 1),
        this.patterns.timingPatterns.push({ timestamp: e.timestamp, duration: e.duration }),
        this.patterns.timingPatterns.length > 100 && this.patterns.timingPatterns.shift());
    }
  }
  const ne = new re();
  class oe {
    constructor(e = {}) {
      var s;
      const t = this._validateConfig(e);
      if (!t.success && e.strictValidation)
        throw new Error(((s = t.error) == null ? void 0 : s.message) || 'Invalid configuration');
      ((this.options = { defaultMode: 'auto', userAgent: null, ...e }),
        (this._enableDI = e.enableDependencyInjection || !1),
        (this._container = e.container || H),
        (this._enablePerformanceTracking = e.enablePerformanceTracking !== !1),
        (this._enableLazyLoading = e.enableLazyLoading !== !1),
        (this._enableProgressiveInit = e.enableProgressiveInit !== !1),
        (this._enableCaching = e.enableCaching !== !1),
        (this._enableStorageBatching = e.enableStorageBatching !== !1),
        (this._performanceTimer = null),
        (this._customStorage = e.storage || null),
        (this._customLauncher = e.launcher || null),
        (this._customSettingsUI = e.settingsUI || null),
        (this._customBrowserDetector = e.browserDetector || null),
        (this._customEventEmitter = e.eventEmitter || null),
        (this.browser = null),
        (this.mode = null),
        (this.storage = null),
        (this.launcher = null),
        (this.settingsUI = null),
        (this.eventEmitter = null),
        (this.initialized = !1),
        (this.lazyLoader = J),
        (this.progressiveInitializer = new Z()),
        (this.memoryTracker = X),
        (this.browserCache = se),
        (this.uiCache = ie),
        (this.storageOptimizer = ne),
        this._setupProgressiveInitialization(),
        typeof globalThis < 'u' && (globalThis.sidepanelFallbackInstance = this));
    }
    _setupProgressiveInitialization() {
      this._enableProgressiveInit &&
        (this.progressiveInitializer.defineStage(
          'browser-detection',
          async () => {
            const e = this.options.userAgent || navigator.userAgent;
            if (this._customBrowserDetector)
              this.browser = this._customBrowserDetector.getBrowserInfo(e);
            else if (this._enableDI)
              try {
                const t = this._container.get('browserDetector');
                this.browser = t.getBrowserInfo(e);
              } catch {
                this._enableCaching
                  ? (this.browser = this.browserCache.get(e, l))
                  : (this.browser = l(e));
              }
            else
              this._enableCaching
                ? (this.browser = this.browserCache.get(e, l))
                : (this.browser = l(e));
            if (!this.browser) throw new Error('Failed to detect browser from user agent');
            return { browser: this.browser };
          },
          { priority: 100, required: !0, timeout: 1e3 }
        ),
        this.progressiveInitializer.defineStage(
          'event-system',
          async () => {
            if (this._customEventEmitter) this.eventEmitter = this._customEventEmitter;
            else if (this._enableDI)
              try {
                this.eventEmitter = this._container.get('eventEmitter');
              } catch {
                if (this._enableLazyLoading) {
                  const e = await this.lazyLoader.load('event-emitter', u('./eventSystem.js'));
                  this.eventEmitter = new e.EventEmitter();
                } else {
                  const { EventEmitter: e } = await Promise.resolve().then(() => y);
                  this.eventEmitter = new e();
                }
              }
            else if (this._enableLazyLoading) {
              const e = await this.lazyLoader.load('event-emitter', u('./eventSystem.js'));
              this.eventEmitter = new e.EventEmitter();
            } else {
              const { EventEmitter: e } = await Promise.resolve().then(() => y);
              this.eventEmitter = new e();
            }
            return { eventSystem: 'initialized' };
          },
          { priority: 90, required: !0, dependencies: ['browser-detection'], timeout: 2e3 }
        ),
        this.progressiveInitializer.defineStage(
          'storage',
          async () => {
            if (this._customStorage) this.storage = this._customStorage;
            else if (this._enableDI)
              try {
                this.storage = this._container.get('storage');
              } catch {
                if (this._enableLazyLoading) {
                  const t = await this.lazyLoader.load('mode-storage', u('./modeStorage.js'));
                  this.storage = new t.ModeStorage();
                } else this.storage = new f();
              }
            else if (this._enableLazyLoading) {
              const t = await this.lazyLoader.load('mode-storage', u('./modeStorage.js'));
              this.storage = new t.ModeStorage();
            } else this.storage = new f();
            this._enableStorageBatching &&
              !this._customStorage &&
              (this.storage = T(this.storage, { batchSize: 5, batchTimeout: 300 }));
            const e = await this.storage.getMode(this.browser);
            return ((this.mode = e || this.options.defaultMode), { mode: this.mode });
          },
          { priority: 80, required: !0, dependencies: ['browser-detection'], timeout: 3e3 }
        ),
        this.progressiveInitializer.defineStage(
          'panel-launcher',
          async () => {
            if (this._customLauncher) this.launcher = this._customLauncher;
            else if (this._enableDI)
              try {
                this.launcher = this._container.get('launcher');
              } catch {
                if (this._enableLazyLoading) {
                  const e = await this.lazyLoader.load('panel-launcher', u('./panelLauncher.js'));
                  this.launcher = new e.PanelLauncher();
                } else this.launcher = new p();
              }
            else if (this._enableLazyLoading) {
              const e = await this.lazyLoader.load('panel-launcher', u('./panelLauncher.js'));
              this.launcher = new e.PanelLauncher();
            } else this.launcher = new p();
            return { launcher: 'initialized' };
          },
          { priority: 70, required: !0, dependencies: ['browser-detection'], timeout: 2e3 }
        ),
        this.progressiveInitializer.defineStage(
          'settings-ui',
          async () => {
            if (this._customSettingsUI) this.settingsUI = this._customSettingsUI;
            else if (this._enableDI)
              try {
                this.settingsUI = this._container.get('settingsUI');
              } catch {
                if (this._enableLazyLoading) {
                  const e = await this.lazyLoader.load('settings-ui', u('./settingsUI.js'));
                  this.settingsUI = new e.SettingsUI();
                } else this.settingsUI = new w();
              }
            else if (this._enableLazyLoading) {
              const e = await this.lazyLoader.load('settings-ui', u('./settingsUI.js'));
              this.settingsUI = new e.SettingsUI();
            } else this.settingsUI = new w();
            return { settingsUI: 'initialized' };
          },
          { priority: 50, required: !1, dependencies: ['browser-detection'], timeout: 3e3 }
        ));
    }
    _validateConfig(e) {
      try {
        return A(e);
      } catch (t) {
        return h(c.VALIDATION_ERROR, 'Configuration validation failed', {
          originalError: t.message
        });
      }
    }
    async init(e = {}) {
      try {
        return (
          this._enablePerformanceTracking &&
            ((this._performanceTimer = new v('initialization')),
            this.memoryTracker.snapshot('init-start')),
          this._enableProgressiveInit && !e.skipProgressiveInit
            ? await this._progressiveInit(e.stages)
            : await this._standardInit()
        );
      } catch (t) {
        if (this._performanceTimer) {
          const i = this._performanceTimer.complete({ success: !1, error: t.message });
          this.eventEmitter && this.eventEmitter.emit('performance', i);
        }
        this.eventEmitter &&
          this.eventEmitter.emit(
            a.INIT_ERROR,
            _(t, 'init', {
              userAgent: this.options.userAgent,
              defaultMode: this.options.defaultMode
            })
          );
        const s = h(c.INIT_FAILED, `Initialization failed: ${t.message}`, {
          userAgent: this.options.userAgent,
          defaultMode: this.options.defaultMode,
          originalError: t.message
        });
        throw new Error(s.error);
      }
    }
    async _progressiveInit(e) {
      var i;
      this._performanceTimer && this._performanceTimer.mark('progressive-init-start');
      const t = await this.progressiveInitializer.initialize(e);
      if (!t.success) throw new Error(`Progressive initialization failed: ${t.error.message}`);
      if (
        ((this.initialized = !0),
        this.eventEmitter &&
          (this.eventEmitter.emit(a.BROWSER_DETECTED, {
            browser: this.browser,
            userAgent: this.options.userAgent || navigator.userAgent
          }),
          this.eventEmitter.emit(a.STORAGE_READ, {
            browser: this.browser,
            savedMode: (i = t.results.storage) == null ? void 0 : i.mode,
            finalMode: this.mode
          }),
          this.eventEmitter.emit(a.AFTER_INIT, {
            browser: this.browser,
            mode: this.mode,
            progressive: !0,
            performance: t.performance
          })),
        this._performanceTimer)
      ) {
        (this._performanceTimer.mark('progressive-init-complete'),
          this.memoryTracker.snapshot('init-complete'));
        const n = this._performanceTimer.complete({
          success: !0,
          progressive: !0,
          memoryDiff: this.memoryTracker.getDiff('init-start', 'init-complete')
        });
        this.eventEmitter && this.eventEmitter.emit('performance', n);
      }
      const s = b(
        { browser: this.browser, mode: this.mode },
        {
          userAgent: (this.options.userAgent || navigator.userAgent).substring(0, 50) + '...',
          defaultMode: this.options.defaultMode,
          progressive: !0,
          performance: t.performance,
          dependencyInjectionUsed: {
            storage: !!this._customStorage,
            launcher: !!this._customLauncher,
            settingsUI: !!this._customSettingsUI,
            browserDetector: !!this._customBrowserDetector,
            eventEmitter: !!this._customEventEmitter
          }
        }
      );
      return m(s, 'init');
    }
    async _standardInit() {
      this._performanceTimer && this._performanceTimer.mark('standard-init-start');
      const e = this.options.userAgent || navigator.userAgent;
      if (this._customBrowserDetector) this.browser = this._customBrowserDetector.getBrowserInfo(e);
      else if (this._enableDI)
        try {
          const i = this._container.get('browserDetector');
          this.browser = i.getBrowserInfo(e);
        } catch {
          this._enableCaching
            ? (this.browser = this.browserCache.get(e, l))
            : (this.browser = l(e));
        }
      else
        this._enableCaching ? (this.browser = this.browserCache.get(e, l)) : (this.browser = l(e));
      if (!this.browser) throw new Error('Failed to detect browser from user agent');
      if (this._customStorage) this.storage = this._customStorage;
      else if (this._enableDI)
        try {
          this.storage = this._container.get('storage');
        } catch {
          this.storage = new f();
        }
      else this.storage = new f();
      if (
        (this._enableStorageBatching &&
          !this._customStorage &&
          (this.storage = T(this.storage, { batchSize: 5, batchTimeout: 300 })),
        this._customLauncher)
      )
        this.launcher = this._customLauncher;
      else if (this._enableDI)
        try {
          this.launcher = this._container.get('launcher');
        } catch {
          this.launcher = new p();
        }
      else this.launcher = new p();
      if (this._customSettingsUI) this.settingsUI = this._customSettingsUI;
      else if (this._enableDI)
        try {
          this.settingsUI = this._container.get('settingsUI');
        } catch {
          this.settingsUI = new w();
        }
      else this.settingsUI = new w();
      if (this._customEventEmitter) this.eventEmitter = this._customEventEmitter;
      else if (this._enableDI)
        try {
          this.eventEmitter = this._container.get('eventEmitter');
        } catch {
          const { EventEmitter: i } = await Promise.resolve().then(() => y);
          this.eventEmitter = new i();
        }
      else {
        const { EventEmitter: i } = await Promise.resolve().then(() => y);
        this.eventEmitter = new i();
      }
      this.eventEmitter.emit(a.BEFORE_INIT, {
        browser: this.browser,
        userAgent: e,
        enableDI: this._enableDI
      });
      const t = await this.storage.getMode(this.browser);
      ((this.mode = t || this.options.defaultMode),
        (this.initialized = !0),
        this.eventEmitter.emit(a.BROWSER_DETECTED, { browser: this.browser, userAgent: e }),
        this.eventEmitter.emit(a.STORAGE_READ, {
          browser: this.browser,
          savedMode: t,
          finalMode: this.mode
        }));
      const s = b(
        { browser: this.browser, mode: this.mode },
        {
          userAgent: e.substring(0, 50) + '...',
          defaultMode: this.options.defaultMode,
          progressive: !1,
          dependencyInjectionUsed: {
            storage: !!this._customStorage,
            launcher: !!this._customLauncher,
            settingsUI: !!this._customSettingsUI,
            browserDetector: !!this._customBrowserDetector,
            eventEmitter: !!this._customEventEmitter
          }
        }
      );
      if (
        (this.eventEmitter.emit(a.AFTER_INIT, {
          browser: this.browser,
          mode: this.mode,
          result: s,
          progressive: !1
        }),
        this._performanceTimer)
      ) {
        (this._performanceTimer.mark('standard-init-complete'),
          this.memoryTracker.snapshot('init-complete'));
        const i = this._performanceTimer.complete({
          success: !0,
          progressive: !1,
          memoryDiff: this.memoryTracker.getDiff('init-start', 'init-complete')
        });
        this.eventEmitter && this.eventEmitter.emit('performance', i);
      }
      return m(s, 'init');
    }
    async openPanel(e, t = {}) {
      if (!this.initialized) {
        const i = h(c.NOT_INITIALIZED, 'SidepanelFallback not initialized. Call init() first.', {
          path: e
        });
        return m(i, 'openPanel');
      }
      if (!e) {
        const i = h(c.INVALID_PATH, 'Panel path is required', { providedPath: e });
        return m(i, 'openPanel');
      }
      this.eventEmitter.emit(a.BEFORE_OPEN_PANEL, {
        path: e,
        mode: this.mode,
        browser: this.browser
      });
      let s = this.mode;
      this.mode === 'auto' && (s = this._getAutoMode());
      try {
        const i = await this.launcher.openPanel(s, e, t),
          n = b(i, { requestedMode: this.mode, effectiveMode: s, browser: this.browser });
        return (
          this.eventEmitter.emit(a.AFTER_OPEN_PANEL, {
            path: e,
            mode: s,
            requestedMode: this.mode,
            browser: this.browser,
            result: n
          }),
          m(n, 'openPanel')
        );
      } catch (i) {
        this.eventEmitter.emit(
          a.PANEL_OPEN_ERROR,
          _(i, 'openPanel', { path: e, mode: s, requestedMode: this.mode, browser: this.browser })
        );
        const n = h(c.PANEL_OPEN_FAILED, `Failed to open panel: ${i.message}`, {
          path: e,
          mode: s,
          browser: this.browser,
          originalError: i.message
        });
        return m(n, 'openPanel');
      }
    }
    async withSettingsUI(e) {
      if (!this.initialized) {
        const s = h(c.NOT_INITIALIZED, 'SidepanelFallback not initialized. Call init() first.', {
          container: e
        });
        return m(s, 'settings');
      }
      if (!e) {
        const s = h(c.INVALID_CONTAINER, 'Container element is required', { providedContainer: e });
        return m(s, 'settings');
      }
      if (this._enableLazyLoading && !this.settingsUI)
        try {
          if (
            this._enableProgressiveInit &&
            !this.progressiveInitializer.isStageCompleted('settings-ui')
          )
            await this.progressiveInitializer.initialize(['settings-ui']);
          else {
            const s = await this.lazyLoader.load('settings-ui', u('./settingsUI.js'));
            this.settingsUI = new s.SettingsUI();
          }
        } catch (s) {
          const i = h(c.UI_CREATION_FAILED, `Failed to load settings UI: ${s.message}`, {
            browser: this.browser,
            mode: this.mode,
            originalError: s.message
          });
          return m(i, 'settings');
        }
      const t = async s => {
        if (s.mode) {
          this.eventEmitter.emit(a.BEFORE_SETTINGS_CHANGE, {
            oldMode: this.mode,
            newMode: s.mode,
            browser: this.browser
          });
          try {
            (await this.storage.setMode(this.browser, s.mode),
              this.eventEmitter.emit(a.STORAGE_WRITE, { browser: this.browser, mode: s.mode }));
            const i = this.mode;
            ((this.mode = s.mode),
              this.eventEmitter.emit(a.MODE_CHANGED, {
                oldMode: i,
                newMode: this.mode,
                browser: this.browser
              }),
              this.eventEmitter.emit(a.AFTER_SETTINGS_CHANGE, {
                oldMode: i,
                newMode: this.mode,
                browser: this.browser
              }));
          } catch (i) {
            throw (
              this.eventEmitter.emit(
                a.SETTINGS_ERROR,
                _(i, 'settingsChange', {
                  oldMode: this.mode,
                  newMode: s.mode,
                  browser: this.browser
                })
              ),
              i
            );
          }
        }
      };
      try {
        const s = this.settingsUI.createSettingsPanel({ mode: this.mode }, t);
        e.appendChild(s);
        const i = b({}, { browser: this.browser, currentMode: this.mode });
        return m(i, 'settings');
      } catch (s) {
        const i = h(c.UI_CREATION_FAILED, `Failed to create settings UI: ${s.message}`, {
          browser: this.browser,
          mode: this.mode,
          originalError: s.message
        });
        return m(i, 'settings');
      }
    }
    getCurrentSettings() {
      return this.initialized ? { browser: this.browser, mode: this.mode } : null;
    }
    on(e, t) {
      if (!this.eventEmitter) throw new Error('Event system not initialized. Call init() first.');
      return this.eventEmitter.on(e, t);
    }
    once(e, t) {
      if (!this.eventEmitter) throw new Error('Event system not initialized. Call init() first.');
      return this.eventEmitter.once(e, t);
    }
    off(e, t) {
      if (!this.eventEmitter) throw new Error('Event system not initialized. Call init() first.');
      this.eventEmitter.off(e, t);
    }
    debug(e, t = {}) {
      this.eventEmitter &&
        this.eventEmitter.emit(
          a.DEBUG,
          P(e, { ...t, browser: this.browser, mode: this.mode, initialized: this.initialized })
        );
    }
    static get EVENTS() {
      return a;
    }
    getPerformanceStats() {
      const e = {
        lazyLoader: this.lazyLoader.getCacheStats(),
        progressiveInitializer: this.progressiveInitializer.getStatus(),
        memorySnapshots: this.memoryTracker.getSnapshots(),
        performanceTracking: this._enablePerformanceTracking,
        lazyLoading: this._enableLazyLoading,
        progressiveInit: this._enableProgressiveInit,
        caching: this._enableCaching,
        storageBatching: this._enableStorageBatching
      };
      return (
        this._enableCaching &&
          ((e.browserCache = this.browserCache.getStats()), (e.uiCache = this.uiCache.getStats())),
        this._enableStorageBatching &&
          this.storage &&
          this.storage.getBatchStats &&
          (e.storageBatchingDetails = this.storage.getBatchStats()),
        this.storageOptimizer &&
          (e.storageOptimization = this.storageOptimizer.getRecommendations()),
        e
      );
    }
    async preloadComponents(e = ['panel-launcher', 'settings-ui']) {
      if (!this._enableLazyLoading) return;
      const t = e
        .map(s => {
          let i;
          switch (s) {
            case 'panel-launcher':
              i = u('./panelLauncher.js');
              break;
            case 'settings-ui':
              i = u('./settingsUI.js');
              break;
            case 'mode-storage':
              i = u('./modeStorage.js');
              break;
            case 'event-emitter':
              i = u('./eventSystem.js');
              break;
            default:
              return null;
          }
          return { key: s, loader: i };
        })
        .filter(Boolean);
      (await this.lazyLoader.preload(t),
        this.eventEmitter &&
          this.eventEmitter.emit('performance', {
            operation: 'preload-complete',
            components: e,
            cacheStats: this.lazyLoader.getCacheStats()
          }));
    }
    clearPerformanceCaches(e = 'all') {
      switch (e) {
        case 'lazy':
          this.lazyLoader.clearCache();
          break;
        case 'memory':
          this.memoryTracker.snapshots.length = 0;
          break;
        case 'browser':
          this._enableCaching && this.browserCache.clear();
          break;
        case 'ui':
          this._enableCaching && this.uiCache.clear();
          break;
        case 'all':
          (this.lazyLoader.clearCache(),
            (this.memoryTracker.snapshots.length = 0),
            this._enableCaching && (this.browserCache.clear(), this.uiCache.clear()));
          break;
      }
      this.eventEmitter &&
        this.eventEmitter.emit('performance', { operation: 'cache-cleared', cacheType: e });
    }
    async optimizeStorage() {
      if (!this._enableStorageBatching || !this.storage || !this.storage.flush)
        return { message: 'Storage batching not enabled or not supported' };
      await this.storage.flush();
      const e = this.storageOptimizer.getRecommendations();
      return (
        this.eventEmitter &&
          this.eventEmitter.emit('performance', {
            operation: 'storage-optimized',
            recommendations: e
          }),
        e
      );
    }
    cleanupUICache() {
      this._enableCaching &&
        this.uiCache &&
        (this.uiCache.cleanup(),
        this.eventEmitter &&
          this.eventEmitter.emit('performance', {
            operation: 'ui-cache-cleaned',
            stats: this.uiCache.getStats()
          }));
    }
    _getAutoMode() {
      return this.browser && (this.browser === 'chrome' || this.browser === 'edge')
        ? 'sidepanel'
        : 'window';
    }
    async setupExtension(e = {}) {
      const { sidepanelPath: t, popupPath: s } = e;
      if (!t && !s)
        return { success: !1, error: 'Either sidepanelPath or popupPath must be provided' };
      try {
        return (
          this.initialized || (await this.init()),
          (this._extensionConfig = { sidepanelPath: t, popupPath: s }),
          { success: !0, mode: this.mode }
        );
      } catch (i) {
        return { success: !1, error: i.message };
      }
    }
    async handleActionClick(e = null) {
      if (!this._extensionConfig)
        return { success: !1, error: 'Extension not configured. Call setupExtension() first.' };
      try {
        const t = e || (this.mode === 'auto' ? this._getAutoMode() : this.mode);
        return t === 'sidepanel' && this._extensionConfig.sidepanelPath
          ? await this.launcher.openPanel('sidepanel', this._extensionConfig.sidepanelPath)
          : this._extensionConfig.popupPath
            ? await this.launcher.openPanel('window', this._extensionConfig.popupPath)
            : { success: !1, error: `No ${t} path configured` };
      } catch (t) {
        return { success: !1, error: t.message };
      }
    }
    async toggleMode() {
      try {
        this.initialized || (await this.init());
        const e = this.mode === 'auto' ? this._getAutoMode() : this.mode,
          t = e === 'sidepanel' ? 'window' : 'sidepanel',
          s = await this.launcher.setMode(t);
        return s.success
          ? ((this.mode = t),
            this.storage && (await this.storage.setMode(this.browser, t)),
            this.eventEmitter && this.eventEmitter.emit('modeChanged', { oldMode: e, newMode: t }),
            { success: !0, mode: t, oldMode: e })
          : { success: !1, error: s.error || 'Failed to set mode' };
      } catch (e) {
        return { success: !1, error: e.message };
      }
    }
    getCacheRecommendations() {
      const e = [];
      if (this._enableCaching) {
        const t = this.browserCache.getStats(),
          s = this.uiCache.getStats();
        (t.hitRate < 0.8 &&
          t.misses > 10 &&
          e.push({
            type: 'browser-cache',
            priority: 'medium',
            description: 'Low browser cache hit rate, consider increasing cache size',
            currentHitRate: t.hitRate
          }),
          s.evictions > s.hits * 0.1 &&
            e.push({
              type: 'ui-cache',
              priority: 'medium',
              description: 'High UI cache eviction rate, consider increasing cache size or age',
              evictionRate: s.evictions / (s.hits + s.misses)
            }));
      }
      return { recommendations: e, timestamp: Date.now() };
    }
  }
  ((g.SidepanelFallback = oe), Object.defineProperty(g, Symbol.toStringTag, { value: 'Module' }));
});

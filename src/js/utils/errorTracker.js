// Event Tracker Utility
// Comprehensive event tracking system for debugging and monitoring game events,
// errors, state changes, and user interactions. Provides centralized logging
// with categorization and optional visual overlay for development.

export class EventTracker {
  constructor(options = {}) {
    this.options = {
      overlay: true,
      consoleLogging: true,
      logLevel: 'all', // 'all', 'errors', 'warnings', 'info'
      maxLogEntries: 1000,
      ...options,
    };

    this.eventLog = [];
    this.overlayEl = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    this.isInitialized = true;
    this.trackEvent('system', 'tracker_initialized', { timestamp: Date.now() });
  }

  // Track general events with category, action, and optional data
  trackEvent(category, action, data = {}) {
    const entry = {
      type: 'event',
      category,
      action,
      data,
      timestamp: Date.now(),
      level: 'info',
    };

    this.addLogEntry(entry);

    if (this.options.consoleLogging) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      console.log(`🎯 [${time}] ${category}:${action}`, data);
    }
  }

  // Track errors with context
  trackError(error, context = {}) {
    const entry = {
      type: 'error',
      message: error.message || String(error),
      stack: error.stack,
      context,
      timestamp: Date.now(),
      level: 'error',
    };

    this.addLogEntry(entry);

    if (this.options.consoleLogging) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      console.error(`❌ [${time}] ERROR: ${entry.message}`, context);
      if (entry.stack) console.error(entry.stack);
    }

    this.updateOverlay(`ERROR: ${entry.message}`, 'error');
  }

  // Track state changes
  trackState(stateName, value, previousValue = null) {
    const entry = {
      type: 'state',
      stateName,
      value,
      previousValue,
      timestamp: Date.now(),
      level: 'info',
    };

    this.addLogEntry(entry);

    if (this.options.consoleLogging) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      console.log(
        `🔄 [${time}] STATE: ${stateName} = ${value}`,
        previousValue !== null ? `(was: ${previousValue})` : ''
      );
    }
  }

  // Track performance metrics
  trackPerformance(metric, value, unit = 'ms') {
    const entry = {
      type: 'performance',
      metric,
      value,
      unit,
      timestamp: Date.now(),
      level: 'info',
    };

    this.addLogEntry(entry);

    if (this.options.consoleLogging) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      console.log(`⏱️ [${time}] PERF: ${metric} = ${value}${unit}`);
    }
  }

  // Add entry to log with size management
  addLogEntry(entry) {
    this.eventLog.push(entry);

    // Manage log size
    if (this.eventLog.length > this.options.maxLogEntries) {
      this.eventLog.splice(
        0,
        this.eventLog.length - this.options.maxLogEntries
      );
    }
  }

  setupGlobalErrorHandlers() {
    window.addEventListener('error', (e) => {
      this.trackError(e.error || new Error(e.message), {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      });
    });

    window.addEventListener('unhandledrejection', (e) => {
      this.trackError(
        e.reason instanceof Error ? e.reason : new Error(e.reason),
        {}
      );
    });
  }

  // Update overlay display (optional visual feedback)
  updateOverlay(message, type = 'info') {
    if (!this.options.overlay) return;

    // Create overlay if it doesn't exist
    if (!this.overlayEl) {
      this.overlayEl = document.createElement('div');
      this.overlayEl.id = 'event-tracker-overlay';
      this.overlayEl.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
        pointer-events: none;
      `;
      document.body.appendChild(this.overlayEl);
    }

    // Update overlay content
    const time = new Date().toLocaleTimeString();
    this.overlayEl.innerHTML = `[${time}] ${message}`;

    // Apply type-specific styling
    if (type === 'error') {
      this.overlayEl.style.background = 'rgba(255,0,0,0.8)';
    } else if (type === 'warning') {
      this.overlayEl.style.background = 'rgba(255,165,0,0.8)';
    } else {
      this.overlayEl.style.background = 'rgba(0,0,0,0.8)';
    }

    // Auto-hide overlay after 3 seconds
    setTimeout(() => {
      if (this.overlayEl) {
        this.overlayEl.style.opacity = '0.5';
      }
    }, 3000);
  }

  // Get filtered event log
  getEventLog(filter = {}) {
    let filteredLog = this.eventLog;

    if (filter.type) {
      filteredLog = filteredLog.filter((entry) => entry.type === filter.type);
    }

    if (filter.category) {
      filteredLog = filteredLog.filter(
        (entry) => entry.category === filter.category
      );
    }

    if (filter.level) {
      filteredLog = filteredLog.filter((entry) => entry.level === filter.level);
    }

    return filteredLog;
  }

  // Clear event log
  clearLog() {
    this.eventLog = [];
    this.trackEvent('system', 'log_cleared', { timestamp: Date.now() });
  }
}

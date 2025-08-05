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

  // Update visual overlay for errors and warnings
  updateOverlay(message, type = 'info') {
    if (!this.options.overlay) return;

    if (!this.overlayEl) {
      this.createOverlay();
    }

    const div = document.createElement('div');
    div.className = `overlay-${type}`;
    div.textContent = message;

    // Add styling based on type
    const colors = {
      error: 'rgba(255, 0, 0, 0.9)',
      warning: 'rgba(255, 165, 0, 0.9)',
      info: 'rgba(0, 100, 200, 0.9)',
    };

    div.style.background = colors[type] || colors.info;
    div.style.color = '#fff';
    div.style.padding = '2px 4px';
    div.style.marginBottom = '1px';

    this.overlayEl.appendChild(div);

    // Auto-remove info messages after 3 seconds
    if (type === 'info') {
      setTimeout(() => {
        if (div.parentNode) {
          div.parentNode.removeChild(div);
        }
      }, 3000);
    }
  }

  // Create the overlay element
  createOverlay() {
    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'event-tracker-overlay';
    this.overlayEl.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 99999;
      max-width: 400px;
      max-height: 300px;
      overflow-y: auto;
      font: 12px/1.4 monospace;
      pointer-events: none;
      border-radius: 4px;
    `;
    document.body.appendChild(this.overlayEl);
  }

  // Set up global error handlers
  setupGlobalErrorHandlers() {
    window.addEventListener('error', (e) => {
      this.trackError(e.error || new Error(e.message), {
        source: 'global',
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      });
    });

    window.addEventListener('unhandledrejection', (e) => {
      this.trackError(e.reason || new Error('Unhandled Promise Rejection'), {
        source: 'promise',
        type: 'unhandled_rejection',
      });
    });
  }

  // Get filtered log entries
  getEvents(filter = {}) {
    let events = this.eventLog.slice();

    if (filter.type) {
      events = events.filter((e) => e.type === filter.type);
    }

    if (filter.category) {
      events = events.filter((e) => e.category === filter.category);
    }

    if (filter.level) {
      events = events.filter((e) => e.level === filter.level);
    }

    if (filter.since) {
      events = events.filter((e) => e.timestamp >= filter.since);
    }

    return events;
  }

  // Clear log entries
  clear(type = null) {
    if (type) {
      this.eventLog = this.eventLog.filter((e) => e.type !== type);
    } else {
      this.eventLog = [];
    }

    if (this.overlayEl) {
      this.overlayEl.innerHTML = '';
    }
  }

  // Export log as JSON for analysis
  exportLog() {
    return JSON.stringify(this.eventLog, null, 2);
  }

  // Get summary statistics
  getSummary() {
    const summary = {
      total: this.eventLog.length,
      byType: {},
      byLevel: {},
      timeRange: null,
    };

    this.eventLog.forEach((entry) => {
      // Count by type
      summary.byType[entry.type] = (summary.byType[entry.type] || 0) + 1;

      // Count by level
      summary.byLevel[entry.level] = (summary.byLevel[entry.level] || 0) + 1;
    });

    // Calculate time range
    if (this.eventLog.length > 0) {
      const timestamps = this.eventLog.map((e) => e.timestamp);
      summary.timeRange = {
        start: Math.min(...timestamps),
        end: Math.max(...timestamps),
        duration: Math.max(...timestamps) - Math.min(...timestamps),
      };
    }

    return summary;
  }
}

// Create a singleton instance for global use
export const eventTracker = new EventTracker();

// Legacy compatibility function
export function initializeErrorTracker(options = {}) {
  eventTracker.options = { ...eventTracker.options, ...options };
  eventTracker.initialize();
  return {
    getErrors: () => eventTracker.getEvents({ type: 'error' }),
    clear: () => eventTracker.clear('error'),
  };
}

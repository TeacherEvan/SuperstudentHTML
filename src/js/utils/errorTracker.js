// Error Tracker Utility
// Lightweight helper to capture global JavaScript errors and unhandled promise
// rejections at runtime.  It logs them to the console (or custom logger) and
// can optionally display a small overlay at the top of the page so testers
// immediately see when something went wrong without opening DevTools.

export function initializeErrorTracker(options = {}) {
  const {
    overlay = true,
    logger = console.error
  } = options;

  const errorLog = [];
  let overlayEl = null;

  function appendOverlay(line) {
    if (!overlay) return;
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.id = 'error-overlay';
      overlayEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        background: rgba(200, 0, 0, 0.9);
        color: #fff;
        font: 12px/1.4 monospace;
        max-height: 200px;
        overflow-y: auto;
        padding: 6px 8px;
        white-space: pre-wrap;`;
      document.body.appendChild(overlayEl);
    }
    const div = document.createElement('div');
    div.textContent = line;
    overlayEl.appendChild(div);
  }

  function record(type, message, source, lineno, colno, error) {
    const entry = {
      type,
      message,
      source,
      lineno,
      colno,
      stack: error && error.stack,
      timestamp: Date.now()
    };
    errorLog.push(entry);

    const time = new Date(entry.timestamp).toLocaleTimeString();
    const line = `[${time}] ${type}: ${message}${source ? ` (${source}:${lineno}:${colno})` : ''}`;
    logger(line);
    if (error && error.stack) logger(error.stack);
    appendOverlay(line);
  }

  window.addEventListener('error', (e) => {
    record('Error', e.message, e.filename, e.lineno, e.colno, e.error);
  });

  window.addEventListener('unhandledrejection', (e) => {
    record('Unhandled Promise', e.reason?.message || String(e.reason), '', 0, 0, e.reason);
  });

  return {
    getErrors() {
      return errorLog.slice();
    },
    clear() {
      errorLog.length = 0;
      if (overlayEl) overlayEl.innerHTML = '';
    }
  };
} 
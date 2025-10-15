export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.activeTouches = new Map();
    this.touchCooldown = new Map();
    this.eventListeners = new Map();
    this.longPressTimeout = new Map();
    this.tapTimeout = null;
    this.lastTapTime = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Unified pointer events for cross-device support
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointercancel', this.handlePointerCancel.bind(this));

    // Prevent default touch behaviors
    this.canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchend', e => e.preventDefault(), { passive: false });

    // Prevent context menu and selection
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    this.canvas.addEventListener('selectstart', e => e.preventDefault());
  }

  handlePointerDown(event) {
    const pointerId = event.pointerId;
    const coords = this.getEventCoordinates(event);

    // Check cooldown
    if (this.isInCooldown(pointerId)) return;

    const touchData = {
      x: coords.x,
      y: coords.y,
      startTime: Date.now(),
      startX: coords.x,
      startY: coords.y,
      moved: false
    };

    this.activeTouches.set(pointerId, touchData);
    this.setCooldown(pointerId);

    // Setup long press detection
    this.longPressTimeout.set(pointerId, setTimeout(() => {
      if (this.activeTouches.has(pointerId) && !touchData.moved) {
        this.dispatchEvent('longpress', { pointerId, x: coords.x, y: coords.y, event });
      }
    }, 500));

    // Dispatch to registered handlers
    this.dispatchEvent('pointerdown', { pointerId, x: coords.x, y: coords.y, event });
  }

  handlePointerUp(event) {
    const pointerId = event.pointerId;
    const coords = this.getEventCoordinates(event);
    const touchData = this.activeTouches.get(pointerId);

    if (touchData) {
      const duration = Date.now() - touchData.startTime;
      const distance = this.getDistance(touchData.startX, touchData.startY, coords.x, coords.y);

      // Clear long press timeout
      if (this.longPressTimeout.has(pointerId)) {
        clearTimeout(this.longPressTimeout.get(pointerId));
        this.longPressTimeout.delete(pointerId);
      }

      // Detect tap vs drag
      if (duration < 300 && distance < 10 && !touchData.moved) {
        this.handleTap(coords, event);
      }

      this.activeTouches.delete(pointerId);
    }

    this.dispatchEvent('pointerup', { pointerId, x: coords.x, y: coords.y, event });
  }

  handlePointerMove(event) {
    const pointerId = event.pointerId;
    const touchData = this.activeTouches.get(pointerId);

    if (touchData) {
      const coords = this.getEventCoordinates(event);
      const distance = this.getDistance(touchData.startX, touchData.startY, coords.x, coords.y);

      // Mark as moved if significant movement
      if (distance > 5) {
        touchData.moved = true;
      }

      touchData.x = coords.x;
      touchData.y = coords.y;

      this.dispatchEvent('pointermove', { pointerId, x: coords.x, y: coords.y, event });
    }
  }

  handlePointerCancel(event) {
    const pointerId = event.pointerId;

    // Clear timeouts
    if (this.longPressTimeout.has(pointerId)) {
      clearTimeout(this.longPressTimeout.get(pointerId));
      this.longPressTimeout.delete(pointerId);
    }

    this.activeTouches.delete(pointerId);
    this.dispatchEvent('pointercancel', { pointerId, event });
  }

  handleTap(coords, event) {
    const now = Date.now();
    const timeDiff = now - this.lastTapTime;

    // Double tap detection
    if (timeDiff < 300) {
      clearTimeout(this.tapTimeout);
      this.dispatchEvent('doubletap', { x: coords.x, y: coords.y, event });
    } else {
      // Single tap with delay to allow for double tap
      this.tapTimeout = setTimeout(() => {
        this.dispatchEvent('tap', { x: coords.x, y: coords.y, event });
      }, 200);
    }

    this.lastTapTime = now;
  }

  getEventCoordinates(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect) {
      console.warn('Could not get canvas bounding rect');
      return { x: 0, y: 0 };
    }
    
    // Use the rendered (CSS) size of the canvas when available; fall back to
    // the intrinsic width/height attributes. This prevents extreme scaling
    // when the author relies solely on CSS for sizing.
    const canvasWidth = this.canvas.offsetWidth || this.canvas.width;
    const canvasHeight = this.canvas.offsetHeight || this.canvas.height;

    // Prevent division by zero
    const scaleX = rect.width > 0 ? canvasWidth / rect.width : 1;
    const scaleY = rect.height > 0 ? canvasHeight / rect.height : 1;
    
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  isInCooldown(pointerId) {
    return this.touchCooldown.has(pointerId) && Date.now() - this.touchCooldown.get(pointerId) < 50;
  }

  setCooldown(pointerId) {
    this.touchCooldown.set(pointerId, Date.now());
  }

  registerHandler(eventType, handler) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(handler);
  }

  dispatchEvent(eventType, data) {
    const handlers = this.eventListeners.get(eventType) || [];
    handlers.forEach(handler => handler(data));
  }

  // Get all active touches for multi-touch support
  getActiveTouches() {
    return Array.from(this.activeTouches.values());
  }

  // Check if device supports touch
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Cleanup method
  destroy() {
    // Clear all timeouts
    this.longPressTimeout.forEach(timeout => clearTimeout(timeout));
    this.longPressTimeout.clear();

    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
    }

    // Clear maps
    this.activeTouches.clear();
    this.touchCooldown.clear();
    this.eventListeners.clear();
  }
}

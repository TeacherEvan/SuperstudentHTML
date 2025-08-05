export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.activeTouches = new Map();
    this.touchCooldown = new Map();
    this.eventListeners = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Unified pointer events for cross-device support
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));

    // Prevent default touch behaviors
    this.canvas.addEventListener('touchstart', e => e.preventDefault());
    this.canvas.addEventListener('touchmove', e => e.preventDefault());
    this.canvas.addEventListener('touchend', e => e.preventDefault());
  }

  handlePointerDown(event) {
    const pointerId = event.pointerId;
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check cooldown
    if (this.isInCooldown(pointerId)) return;

    this.activeTouches.set(pointerId, { x, y, startTime: Date.now() });
    this.setCooldown(pointerId);

    // Dispatch to registered handlers
    this.dispatchEvent('pointerdown', { pointerId, x, y, event });
  }

  handlePointerUp(event) {
    const pointerId = event.pointerId;
    this.activeTouches.delete(pointerId);
    this.dispatchEvent('pointerup', { pointerId, event });
  }

  handlePointerMove(event) {
    const pointerId = event.pointerId;
    if (this.activeTouches.has(pointerId)) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.activeTouches.get(pointerId).x = x;
      this.activeTouches.get(pointerId).y = y;
      this.dispatchEvent('pointermove', { pointerId, x, y, event });
    }
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
}

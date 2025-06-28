export default class MultiTouchManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointers = new Map();
    this.callbacks = {
      pointerdown: [],
      pointermove: [],
      pointerup: []
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Pointer events (supports mouse, touch, pen)
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.handlePointerUp(e));
    
    // Prevent default touch behaviors
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
    this.canvas.addEventListener('touchend', (e) => e.preventDefault());
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const pointer = {
      id: e.pointerId,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      type: e.pointerType,
      pressure: e.pressure || 1,
      startTime: performance.now()
    };
    
    this.pointers.set(e.pointerId, pointer);
    this.triggerCallbacks('pointerdown', pointer, e);
  }

  handlePointerMove(e) {
    if (!this.pointers.has(e.pointerId)) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const pointer = this.pointers.get(e.pointerId);
    
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.pressure = e.pressure || 1;
    
    this.triggerCallbacks('pointermove', pointer, e);
  }

  handlePointerUp(e) {
    if (!this.pointers.has(e.pointerId)) return;
    
    const pointer = this.pointers.get(e.pointerId);
    pointer.endTime = performance.now();
    
    this.triggerCallbacks('pointerup', pointer, e);
    this.pointers.delete(e.pointerId);
  }

  triggerCallbacks(eventType, pointer, originalEvent) {
    this.callbacks[eventType].forEach(callback => {
      try {
        callback(pointer, originalEvent);
      } catch (error) {
        console.error(`Error in ${eventType} callback:`, error);
      }
    });
  }

  addEventListener(eventType, callback) {
    if (this.callbacks[eventType]) {
      this.callbacks[eventType].push(callback);
    }
  }

  removeEventListener(eventType, callback) {
    if (this.callbacks[eventType]) {
      const index = this.callbacks[eventType].indexOf(callback);
      if (index > -1) {
        this.callbacks[eventType].splice(index, 1);
      }
    }
  }

  getActivePointers() {
    return Array.from(this.pointers.values());
  }

  getPointerCount() {
    return this.pointers.size;
  }

  getPointer(id) {
    return this.pointers.get(id);
  }

  isMultiTouch() {
    return this.pointers.size > 1;
  }

  getPinchDistance() {
    const pointers = this.getActivePointers();
    if (pointers.length < 2) return null;
    
    const [p1, p2] = pointers;
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + 
      Math.pow(p2.y - p1.y, 2)
    );
  }

  getPinchCenter() {
    const pointers = this.getActivePointers();
    if (pointers.length < 2) return null;
    
    const [p1, p2] = pointers;
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }

  clear() {
    this.pointers.clear();
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('touchstart', (e) => e.preventDefault());
    this.canvas.removeEventListener('touchmove', (e) => e.preventDefault());
    this.canvas.removeEventListener('touchend', (e) => e.preventDefault());
    this.clear();
  }
}

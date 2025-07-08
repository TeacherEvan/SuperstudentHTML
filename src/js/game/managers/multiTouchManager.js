export default class MultiTouchManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointers = new Map();
    this.callbacks = {
      pointerdown: [],
      pointermove: [],
      pointerup: []
    };
    
    // Bind event handlers once so the same references can be removed later
    this._onPointerDown = this.handlePointerDown.bind(this);
    this._onPointerMove = this.handlePointerMove.bind(this);
    this._onPointerUp = this.handlePointerUp.bind(this);

    // Prevent-default handler reused across attach/remove
    this._preventDefault = (e) => e.preventDefault();

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('pointercancel', this._onPointerUp);

    // Prevent default touch behaviors (stored handler so it can be removed later)
    this.canvas.addEventListener('touchstart', this._preventDefault);
    this.canvas.addEventListener('touchmove', this._preventDefault);
    this.canvas.addEventListener('touchend', this._preventDefault);
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
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
    this.canvas.removeEventListener('pointercancel', this._onPointerUp);
    this.canvas.removeEventListener('touchstart', this._preventDefault);
    this.canvas.removeEventListener('touchmove', this._preventDefault);
    this.canvas.removeEventListener('touchend', this._preventDefault);
    this.clear();
  }
}

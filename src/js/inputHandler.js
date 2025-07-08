// InputHandler: unified pointer and keyboard input management
export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointerDownListeners = [];
    this.pointerUpListeners = [];
    this.pointerMoveListeners = [];
    this.keyDownListeners = [];

    // Bind methods to preserve 'this' context
    this._boundHandlePointerDown = (e) => this._handlePointerDown(e);
    this._boundHandlePointerUp = (e) => this._handlePointerUp(e);
    this._boundHandlePointerMove = (e) => this._handlePointerMove(e);
    this._boundHandleKeyDown = (e) => this._handleKeyDown(e);

    // Bind events
    canvas.addEventListener('pointerdown', this._boundHandlePointerDown);
    canvas.addEventListener('pointerup', this._boundHandlePointerUp);
    canvas.addEventListener('pointermove', this._boundHandlePointerMove);
    window.addEventListener('keydown', this._boundHandleKeyDown);
  }

  _handlePointerDown(event) {
    const pos = this._getPointerPosition(event);
    this.pointerDownListeners.forEach(cb => cb(pos, event));
  }

  _handlePointerUp(event) {
    const pos = this._getPointerPosition(event);
    this.pointerUpListeners.forEach(cb => cb(pos, event));
  }

  _handlePointerMove(event) {
    const pos = this._getPointerPosition(event);
    this.pointerMoveListeners.forEach(cb => cb(pos, event));
  }

  _handleKeyDown(event) {
    this.keyDownListeners.forEach(cb => cb(event.code, event));
  }

  _getPointerPosition(event) {
    if (!this.canvas) {
      console.warn('Canvas not available for pointer position calculation');
      return { x: 0, y: 0 };
    }
    
    const rect = this.canvas.getBoundingClientRect();
    if (!rect) {
      console.warn('Could not get canvas bounding rect');
      return { x: 0, y: 0 };
    }
    
    // Prevent division by zero
    const scaleX = rect.width > 0 ? this.canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? this.canvas.height / rect.height : 1;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  onPointerDown(callback) {
    this.pointerDownListeners.push(callback);
  }

  onPointerUp(callback) {
    this.pointerUpListeners.push(callback);
  }

  onPointerMove(callback) {
    this.pointerMoveListeners.push(callback);
  }

  onKeyDown(callback) {
    this.keyDownListeners.push(callback);
  }

  // Cleanup method to prevent memory leaks
  destroy() {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this._boundHandlePointerDown);
      this.canvas.removeEventListener('pointerup', this._boundHandlePointerUp);
      this.canvas.removeEventListener('pointermove', this._boundHandlePointerMove);
    }
    window.removeEventListener('keydown', this._boundHandleKeyDown);
    
    // Clear all listeners
    this.pointerDownListeners = [];
    this.pointerUpListeners = [];
    this.pointerMoveListeners = [];
    this.keyDownListeners = [];
    
    // Clear references
    this.canvas = null;
  }
}

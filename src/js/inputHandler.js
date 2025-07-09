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
    
    // Use the rendered (CSS) size of the canvas when available; fall back to
    // the intrinsic width/height attributes. This prevents extreme scaling
    // when the author relies solely on CSS for sizing.
    const canvasWidth = this.canvas.offsetWidth || this.canvas.width;
    const canvasHeight = this.canvas.offsetHeight || this.canvas.height;

    // Prevent division by zero
    const scaleX = rect.width > 0 ? canvasWidth / rect.width : 1;
    const scaleY = rect.height > 0 ? canvasHeight / rect.height : 1;
    
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
    // Always attempt to remove event listeners, even if canvas is null
    // Store the original canvas reference before clearing
    const originalCanvas = this.canvas;
    
    if (originalCanvas) {
      originalCanvas.removeEventListener('pointerdown', this._boundHandlePointerDown);
      originalCanvas.removeEventListener('pointerup', this._boundHandlePointerUp);
      originalCanvas.removeEventListener('pointermove', this._boundHandlePointerMove);
    }
    
    // Always remove window event listener
    window.removeEventListener('keydown', this._boundHandleKeyDown);
    
    // Clear all listeners arrays to prevent memory leaks
    this.pointerDownListeners.length = 0;
    this.pointerUpListeners.length = 0;
    this.pointerMoveListeners.length = 0;
    this.keyDownListeners.length = 0;
    
    // Clear bound function references
    this._boundHandlePointerDown = null;
    this._boundHandlePointerUp = null;
    this._boundHandlePointerMove = null;
    this._boundHandleKeyDown = null;
    
    // Clear canvas reference
    this.canvas = null;
  }
}

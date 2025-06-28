// InputHandler: unified pointer and keyboard input management
export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointerDownListeners = [];
    this.pointerUpListeners = [];
    this.pointerMoveListeners = [];
    this.keyDownListeners = [];

    // Bind events
    canvas.addEventListener('pointerdown', (e) => this._handlePointerDown(e));
    canvas.addEventListener('pointerup', (e) => this._handlePointerUp(e));
    canvas.addEventListener('pointermove', (e) => this._handlePointerMove(e));
    window.addEventListener('keydown', (e) => this._handleKeyDown(e));
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
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
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
}

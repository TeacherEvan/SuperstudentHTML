// gameLoop.js: centralize main game loop control and timing
export class GameLoop {
  constructor(updateFn, renderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.lastTime = 0;
    this.running = false;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this._loop();
  }

  stop() {
    this.running = false;
  }

  _loop() {
    if (!this.running) return;
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;
    this.lastDeltaTime = deltaTime; // Store for use by particle system
    try {
      // Execute update and render. Any uncaught error here would previously
      // break the rAF chain without a helpful stack trace, making the game
      // appear to freeze silently. Wrapping in try/catch lets us surface the
      // error while halting the loop gracefully.
      this.updateFn(deltaTime);
      this.renderFn();
    } catch (error) {
      console.error('❌ Unhandled error inside GameLoop:', error);
      // Stop the loop so we don\'t spam errors each frame
      this.stop();
      // Bubble up so global handlers / error trackers can react
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('GameLoopError', { detail: error }));
      }
      return; // Exit early – don\'t queue another frame
    }
    requestAnimationFrame(() => this._loop());
  }
}

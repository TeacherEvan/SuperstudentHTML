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
    this.updateFn(deltaTime);
    this.renderFn();
    requestAnimationFrame(() => this._loop());
  }
}

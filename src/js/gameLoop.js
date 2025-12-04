/**
 * GameLoop - Core game rendering and update cycle
 * Uses requestAnimationFrame for smooth 60fps animations
 * Implements delta-time based updates for frame-rate independent gameplay
 */
export class GameLoop {
  constructor(ctx) {
    this.ctx = ctx;
    this.currentScreen = null;
    this.lastTime = 0;
    this.isRunning = false;
    this.lastDeltaTime = 0;

    // OPTIMIZATION: Pre-bind loop method to avoid creating new function references each frame
    this._boundLoop = this.loop.bind(this);

    // TODO: [OPTIMIZATION] Implement frame rate limiting for battery savings on mobile
    // TODO: [OPTIMIZATION] Add performance metrics tracking (FPS counter, frame time)
    // TODO: [OPTIMIZATION] Implement dirty rectangle rendering to only redraw changed areas
  }

  /**
   * Start the game loop
   * Begins the requestAnimationFrame cycle
   */
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this._boundLoop(this.lastTime);
  }

  /**
   * Stop the game loop
   * Halts all update and render operations
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Set the current screen to update and render
   * @param {Object} screen - Screen object with update(deltaTime) and render(ctx) methods
   */
  setCurrentScreen(screen) {
    this.currentScreen = screen;
  }

  /**
   * Main game loop - called every animation frame
   * @param {number} timestamp - High-resolution timestamp from requestAnimationFrame
   */
  loop(timestamp) {
    if (!this.isRunning) return;

    // Calculate delta time for frame-rate independent updates
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.lastDeltaTime = deltaTime;

    // Update and render current screen
    if (this.currentScreen) {
      this.currentScreen.update(deltaTime);
      this.currentScreen.render(this.ctx);
    }

    // Schedule next frame
    requestAnimationFrame(this._boundLoop);
  }
}

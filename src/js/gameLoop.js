/**
 * GameLoop - Core game rendering and update cycle
 * Uses requestAnimationFrame for smooth 60fps animations
 * Implements delta-time based updates for frame-rate independent gameplay
 *
 * Architecture:
 * - Manages current screen/state rendering
 * - Provides consistent timing across different refresh rates
 * - Pre-binds loop method for optimal performance
 *
 * TODO: [OPTIMIZATION] Implement frame rate limiting for battery savings on mobile
 * TODO: [OPTIMIZATION] Add performance metrics tracking (FPS counter, frame time)
 * TODO: [OPTIMIZATION] Implement dirty rectangle rendering to only redraw changed areas
 */
export class GameLoop {
  constructor(canvasContext) {
    this.canvasContext = canvasContext;
    this.currentActiveScreen = null;
    this.previousFrameTimestamp = 0;
    this.isLoopRunning = false;
    // Stores the most recent delta time for external systems (e.g., particle managers)
    // that need access to frame timing outside the main update cycle
    this.mostRecentDeltaTime = 0;

    // OPTIMIZATION: Pre-bind loop method to avoid creating new function references each frame
    this._boundAnimationLoop = this.executeAnimationFrame.bind(this);
  }

  // Backward-compatible getters for existing tests and code
  get ctx() { return this.canvasContext; }
  get currentScreen() { return this.currentActiveScreen; }
  get lastTime() { return this.previousFrameTimestamp; }
  get isRunning() { return this.isLoopRunning; }
  get lastDeltaTime() { return this.mostRecentDeltaTime; }

  /**
   * Start the game loop
   * Begins the requestAnimationFrame cycle
   */
  start() {
    this.isLoopRunning = true;
    this.previousFrameTimestamp = performance.now();
    this._boundAnimationLoop(this.previousFrameTimestamp);
  }

  /**
   * Stop the game loop
   * Halts all update and render operations
   */
  stop() {
    this.isLoopRunning = false;
  }

  /**
   * Set the current screen to update and render
   * @param {Object} screen - Screen object with update(deltaTime) and render(ctx) methods
   */
  setCurrentScreen(screen) {
    this.currentActiveScreen = screen;
  }

  /**
   * Main game loop - called every animation frame
   * Calculates delta time and delegates to current screen
   * @param {number} currentTimestamp - High-resolution timestamp from requestAnimationFrame
   */
  executeAnimationFrame(currentTimestamp) {
    if (!this.isLoopRunning) return;

    // Calculate delta time for frame-rate independent updates
    const deltaTimeMs = currentTimestamp - this.previousFrameTimestamp;
    this.previousFrameTimestamp = currentTimestamp;
    this.mostRecentDeltaTime = deltaTimeMs;

    // Update and render current screen
    if (this.currentActiveScreen) {
      this.currentActiveScreen.update(deltaTimeMs);
      this.currentActiveScreen.render(this.canvasContext);
    }

    // Schedule next frame
    requestAnimationFrame(this._boundAnimationLoop);
  }
}

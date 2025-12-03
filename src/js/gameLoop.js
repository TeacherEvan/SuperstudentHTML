/**
 * GameLoop - Core game rendering and update cycle
 * Uses requestAnimationFrame for smooth 60fps animations
 */
export class GameLoop {
  constructor(ctx) {
    this.ctx = ctx;
    this.currentScreen = null;
    this.lastTime = 0;
    this.isRunning = false;
    // TODO: [OPTIMIZATION] Implement frame rate limiting for battery savings on mobile
    // TODO: [OPTIMIZATION] Add performance metrics tracking (FPS counter, frame time)
  }

  start() {
    this.isRunning = true;
    this.loop(0);
  }

  stop() {
    this.isRunning = false;
  }

  setCurrentScreen(screen) {
    this.currentScreen = screen;
  }

  loop(timestamp) {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // TODO: [OPTIMIZATION] Implement dirty rectangle rendering to only redraw changed areas
    if (this.currentScreen) {
      this.currentScreen.update(deltaTime);
      this.currentScreen.render(this.ctx);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}

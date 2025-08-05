export class GameLoop {
  constructor(ctx) {
    this.ctx = ctx;
    this.currentScreen = null;
    this.lastTime = 0;
    this.isRunning = false;
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

    if (this.currentScreen) {
      this.currentScreen.update(deltaTime);
      this.currentScreen.render(this.ctx);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}

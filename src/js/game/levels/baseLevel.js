import { eventTracker } from '../../utils/eventTracker.js';

export class BaseLevel {
  // Accept core level parameters
  constructor(canvas, ctx, managers, helpers) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.managers = managers;
    this.helpers = helpers;
    this.running = false;
    this.score = 0;
  }

  async init() {
    throw new Error('init() must be implemented by subclass');
  }

  update(deltaTime) {
    throw new Error('update() must be implemented by subclass');
  }

  render() {
    throw new Error('render() must be implemented by subclass');
  }

  cleanup() {
    throw new Error('cleanup() must be implemented by subclass');
  }

  async start() {
    eventTracker.trackEvent('level', 'start', {
      levelType: this.constructor.name,
    });
    await this.init();
    this.running = true;
  }

  end() {
    this.running = false;
    eventTracker.trackEvent('level', 'end', {
      levelType: this.constructor.name,
      score: this.score,
      duration: Date.now() - (this.startTime || Date.now()),
    });
    this.cleanup();

    // Trigger completion callback if available
    if (this.helpers && this.helpers.onLevelComplete) {
      this.helpers.onLevelComplete(this.score);
    }
  }

  // Pause the level
  pause() {
    this.running = false;
  }

  // Resume the level
  resume() {
    this.running = true;
  }

  // Reset the level state
  reset() {
    // Clean up any existing entities or listeners
    this.cleanup();
    // Reset score and flags. Do NOT call init() here because restartGame()
    // will subsequently invoke start(), which already performs the
    // asynchronous init(). Calling init() twice caused duplicate listeners
    // and state corruption.
    this.score = 0;
  }

  // Update score
  updateScore(points) {
    this.score = Math.max(0, this.score + points);
    if (this.managers && this.managers.hud) {
      this.managers.hud.updateScore(points);
    }
  }

  // Handle canvas resize
  resize(canvas) {
    this.canvas = canvas;
  }
}

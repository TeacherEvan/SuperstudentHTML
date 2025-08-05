export default class CheckpointManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.isActive = false;
    this.currentMessage = '';
    this.fadeAlpha = 0;
    this.fadeDirection = 1;
    this.displayTime = 0;
    this.maxDisplayTime = 3000; // 3 seconds
  }

  showCheckpoint(message) {
    this.isActive = true;
    this.currentMessage = message;
    this.fadeAlpha = 0;
    this.fadeDirection = 1;
    this.displayTime = 0;
  }

  update(deltaTime) {
    if (!this.isActive) return;

    this.displayTime += deltaTime;

    // Fade in/out animation
    if (this.fadeDirection === 1) {
      this.fadeAlpha += deltaTime * 0.003; // Fade in speed
      if (this.fadeAlpha >= 1) {
        this.fadeAlpha = 1;
        this.fadeDirection = 0; // Hold
      }
    } else if (this.fadeDirection === 0) {
      // Hold for a moment
      if (this.displayTime > this.maxDisplayTime * 0.7) {
        this.fadeDirection = -1; // Start fade out
      }
    } else if (this.fadeDirection === -1) {
      this.fadeAlpha -= deltaTime * 0.003; // Fade out speed
      if (this.fadeAlpha <= 0) {
        this.fadeAlpha = 0;
        this.isActive = false;
      }
    }
  }

  draw() {
    if (!this.isActive || this.fadeAlpha === 0) return;

    this.ctx.save();

    // Semi-transparent overlay
    this.ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * this.fadeAlpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Checkpoint message
    const fontSize = Math.min(this.canvas.width, this.canvas.height) * 0.08;
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeAlpha})`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Add glow effect
    this.ctx.shadowColor = '#4ECDC4';
    this.ctx.shadowBlur = 20 * this.fadeAlpha;

    this.ctx.fillText(this.currentMessage, centerX, centerY);

    // Subtitle
    const subtitleFontSize = fontSize * 0.4;
    this.ctx.font = `${subtitleFontSize}px Arial`;
    this.ctx.shadowBlur = 10 * this.fadeAlpha;
    this.ctx.fillText('Checkpoint Reached!', centerX, centerY + fontSize);

    this.ctx.restore();
  }

  isDisplaying() {
    return this.isActive;
  }

  skipCheckpoint() {
    this.isActive = false;
    this.fadeAlpha = 0;
  }
}

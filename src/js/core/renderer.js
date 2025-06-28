export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.setupCanvas();
  }

  setupCanvas() {
    // Adjust canvas size and scale for high-DPI displays
    const { width, height } = this.canvas.getBoundingClientRect();
    this.canvas.width = width * (window.devicePixelRatio || 1);
    this.canvas.height = height * (window.devicePixelRatio || 1);
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Add additional rendering helpers here
}

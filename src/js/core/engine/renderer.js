export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.setupCanvas();
  }

  setupCanvas() {
    // Adjust canvas size and scale for high-DPI displays
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || this.canvas.offsetWidth || 800; // Fallback to 800px
    const height = rect.height || this.canvas.offsetHeight || 600; // Fallback to 600px
    
    // Ensure minimum dimensions to prevent division by zero
    const minWidth = Math.max(width, 1);
    const minHeight = Math.max(height, 1);
    
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set canvas internal dimensions
    this.canvas.width = minWidth * devicePixelRatio;
    this.canvas.height = minHeight * devicePixelRatio;
    
    // Set canvas CSS dimensions
    this.canvas.style.width = minWidth + 'px';
    this.canvas.style.height = minHeight + 'px';
    
    // Scale the context to match device pixel ratio
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Add additional rendering helpers here
}

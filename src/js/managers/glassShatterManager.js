export default class GlassShatterManager {
  constructor(canvas, ctx, particleManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particleManager = particleManager;
    this.isShattered = false;
    this.shatterPattern = [];
    this.fadeAlpha = 0;
    this.shatterTime = 0;
    this.maxShatterTime = 2000; // 2 seconds

    // Off-screen buffer for pre-rendered cracks
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    this.shatterCenter = { x: 0, y: 0 };
  }

  createShatterEffect(impactX, impactY, intensity = 1) {
    this.isShattered = true;
    this.fadeAlpha = 0.8 * intensity;
    this.shatterTime = 0;
    this.generateShatterPattern(impactX, impactY, intensity);
    this.createShatterParticles(impactX, impactY, intensity);

    // Cache center for radial effects
    this.shatterCenter = { x: impactX, y: impactY };

    // (Re)render cracks onto off-screen bitmap for cheap per-frame draw
    this.renderCracksToOffscreen();
  }

  generateShatterPattern(centerX, centerY, intensity) {
    this.shatterPattern = [];
    const numCracks = Math.floor(8 + intensity * 12);
    
    // Radial cracks from impact point
    for (let i = 0; i < numCracks; i++) {
      const angle = (i / numCracks) * Math.PI * 2;
      const length = (50 + Math.random() * 200) * intensity;
      const crack = [];
      
      // Create jagged crack line
      const segments = Math.floor(length / 20);
      for (let j = 0; j <= segments; j++) {
        const progress = j / segments;
        const distance = length * progress;
        
        // Add randomness to crack path
        const deviation = (Math.random() - 0.5) * 30 * progress;
        const x = centerX + Math.cos(angle) * distance + Math.cos(angle + Math.PI/2) * deviation;
        const y = centerY + Math.sin(angle) * distance + Math.sin(angle + Math.PI/2) * deviation;
        
        crack.push({ x, y });
      }
      
      this.shatterPattern.push(crack);
    }
    
    // Add some circular cracks around impact
    const numCircular = Math.floor(3 + intensity * 5);
    for (let i = 0; i < numCircular; i++) {
      const radius = (30 + i * 40) * intensity;
      const segments = Math.floor(radius / 5);
      const circle = [];
      
      for (let j = 0; j < segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const deviation = (Math.random() - 0.5) * 10;
        const x = centerX + Math.cos(angle) * (radius + deviation);
        const y = centerY + Math.sin(angle) * (radius + deviation);
        
        circle.push({ x, y });
      }
      
      this.shatterPattern.push(circle);
    }
  }

  createShatterParticles(centerX, centerY, intensity) {
    const particleCount = Math.floor(50 + intensity * 100);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 100 * intensity;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      const speed = 2 + Math.random() * 4;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed + Math.random() * 2; // Add gravity effect
      
      const size = 1 + Math.random() * 3;
      const duration = 1000 + Math.random() * 2000;
      
      // Glass-like colors
      const colors = ['rgba(255,255,255,0.8)', 'rgba(200,230,255,0.6)', 'rgba(180,220,255,0.7)'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      this.particleManager.createParticle(x, y, color, size, dx, dy, duration);
    }
  }

  update(deltaTime) {
    if (!this.isShattered) return;
    
    this.shatterTime += deltaTime;
    
    // Fade out effect
    const fadeProgress = this.shatterTime / this.maxShatterTime;
    this.fadeAlpha = Math.max(0, 0.8 * (1 - fadeProgress));
    
    if (this.shatterTime >= this.maxShatterTime) {
      this.reset();
    }
  }

  draw() {
    if (!this.isShattered || this.fadeAlpha <= 0 || !this.offscreenCanvas) return;

    this.ctx.save();
    this.ctx.globalAlpha = this.fadeAlpha;
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    this.ctx.restore();
  }

  reset() {
    this.isShattered = false;
    this.shatterPattern = [];
    this.fadeAlpha = 0;
    this.shatterTime = 0;

    // Clear off-screen buffer to free memory
    if (this.offscreenCtx) {
      this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }
  }

  isActive() {
    return this.isShattered;
  }

  triggerShatter(x, y, intensity = 1) {
    this.createShatterEffect(x, y, intensity);
  }

  /**
   * Pre-render all cracks and subtle glass overlay into an off-screen canvas so
   * the main draw() step can simply blit a bitmap each frame – this drastically
   * reduces per-frame CPU usage compared to re-tracing every Path2D.
   */
  renderCracksToOffscreen() {
    // Initialise off-screen canvas once or when main canvas resizes
    if (!this.offscreenCanvas || this.offscreenCanvas.width !== this.canvas.width || this.offscreenCanvas.height !== this.canvas.height) {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    const ctx = this.offscreenCtx;
    ctx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    // Crack stroke style
    ctx.strokeStyle = '#E8F4F8';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 5;

    // Build a single Path2D containing all cracks for optimal stroking
    const path = new Path2D();
    this.shatterPattern.forEach(crack => {
      if (crack.length < 2) return;
      path.moveTo(crack[0].x, crack[0].y);
      for (let i = 1; i < crack.length; i++) {
        path.lineTo(crack[i].x, crack[i].y);
      }
    });

    // We can vary line width per stroke to add realism – here we randomise
    // slightly around 2px but only once during pre-render so cost is minimal.
    ctx.lineWidth = 1.5 + Math.random() * 1; // 1.5-2.5 px
    ctx.stroke(path);

    // Radial highlight overlay – brighter near impact, fading outward
    const { x: cx, y: cy } = this.shatterCenter;
    const maxRadius = Math.hypot(this.canvas.width, this.canvas.height);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
    gradient.addColorStop(0, 'rgba(255,255,255,0.15)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
  }
}

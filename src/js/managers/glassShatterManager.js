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
  }

  createShatterEffect(impactX, impactY, intensity = 1) {
    this.isShattered = true;
    this.fadeAlpha = 0.8 * intensity;
    this.shatterTime = 0;
    this.generateShatterPattern(impactX, impactY, intensity);
    this.createShatterParticles(impactX, impactY, intensity);
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
    if (!this.isShattered || this.fadeAlpha <= 0) return;
    
    this.ctx.save();
    this.ctx.globalAlpha = this.fadeAlpha;
    this.ctx.strokeStyle = '#E8F4F8';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#FFFFFF';
    this.ctx.shadowBlur = 5;
    
    // Draw crack pattern
    this.shatterPattern.forEach(crack => {
      if (crack.length < 2) return;
      
      this.ctx.beginPath();
      this.ctx.moveTo(crack[0].x, crack[0].y);
      
      for (let i = 1; i < crack.length; i++) {
        this.ctx.lineTo(crack[i].x, crack[i].y);
      }
      
      this.ctx.stroke();
    });
    
    // Add overall glass overlay effect
    this.ctx.globalAlpha = this.fadeAlpha * 0.3;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.restore();
  }

  reset() {
    this.isShattered = false;
    this.shatterPattern = [];
    this.fadeAlpha = 0;
    this.shatterTime = 0;
  }

  isActive() {
    return this.isShattered;
  }

  triggerShatter(x, y, intensity = 1) {
    this.createShatterEffect(x, y, intensity);
  }
}

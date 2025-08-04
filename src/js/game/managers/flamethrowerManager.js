export default class FlamethrowerManager {
  constructor(canvas, ctx, particleManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particleManager = particleManager;
    this.activeFlames = [];
    this.maxFlames = 10;
  }

  createFlamethrower(startX, startY, endX, endY, color = '#FF6B6B', duration = 1000) {
    if (this.activeFlames.length >= this.maxFlames) return;

    const flame = {
      startX,
      startY,
      endX,
      endY,
      color,
      duration,
      age: 0,
      intensity: 1,
      particles: []
    };

    this.activeFlames.push(flame);
    this.generateFlameParticles(flame);
  }

  generateFlameParticles(flame) {
    const distance = Math.sqrt(
      Math.pow(flame.endX - flame.startX, 2) +
      Math.pow(flame.endY - flame.startY, 2)
    );

    const particleCount = Math.min(Math.floor(distance / 10), 50);

    for (let i = 0; i < particleCount; i++) {
      const progress = i / particleCount;
      const x = flame.startX + (flame.endX - flame.startX) * progress;
      const y = flame.startY + (flame.endY - flame.startY) * progress;

      // Add some randomness
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;

      // Particle velocity
      const dx = (Math.random() - 0.5) * 2;
      const dy = (Math.random() - 0.5) * 2;

      // Color variations
      const colors = ['#FF6B6B', '#FF8E53', '#FF6B35', '#FFD93D'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particleManager.createParticle(
        x + offsetX,
        y + offsetY,
        color,
        Math.random() * 4 + 2, // size
        dx,
        dy,
        500 + Math.random() * 500 // duration
      );
    }
  }

  update(deltaTime) {
    this.activeFlames = this.activeFlames.filter(flame => {
      flame.age += deltaTime;
      flame.intensity = Math.max(0, 1 - (flame.age / flame.duration));

      // Generate more particles during the flame's lifetime
      if (flame.intensity > 0.3 && Math.random() < 0.1) {
        this.generateFlameParticles(flame);
      }

      return flame.age < flame.duration;
    });
  }

  draw() {
    this.ctx.save();

    this.activeFlames.forEach(flame => {
      if (flame.intensity <= 0) return;

      // Draw laser beam
      this.ctx.globalAlpha = flame.intensity * 0.8;
      this.ctx.strokeStyle = flame.color;
      this.ctx.lineWidth = 4 * flame.intensity;
      this.ctx.shadowColor = flame.color;
      this.ctx.shadowBlur = 10 * flame.intensity;

      this.ctx.beginPath();
      this.ctx.moveTo(flame.startX, flame.startY);
      this.ctx.lineTo(flame.endX, flame.endY);
      this.ctx.stroke();

      // Draw core beam
      this.ctx.globalAlpha = flame.intensity;
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2 * flame.intensity;
      this.ctx.shadowBlur = 5 * flame.intensity;

      this.ctx.beginPath();
      this.ctx.moveTo(flame.startX, flame.startY);
      this.ctx.lineTo(flame.endX, flame.endY);
      this.ctx.stroke();
    });

    this.ctx.restore();
  }

  checkCollision(targetX, targetY, targetRadius) {
    return this.activeFlames.some(flame => {
      if (flame.intensity <= 0) return false;

      // Check if target intersects with flame line
      const A = flame.endY - flame.startY;
      const B = flame.startX - flame.endX;
      const C = flame.endX * flame.startY - flame.startX * flame.endY;

      const distance = Math.abs(A * targetX + B * targetY + C) / Math.sqrt(A * A + B * B);

      return distance <= targetRadius;
    });
  }

  clear() {
    this.activeFlames = [];
  }
}

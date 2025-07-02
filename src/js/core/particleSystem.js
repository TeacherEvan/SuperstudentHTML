export default class ParticleManager {
  constructor(maxParticles = 500) {
    this.maxParticles = maxParticles;
    this.particles = [];
    this.lastUpdateTime = performance.now();
  }

  createParticle(x, y, color, size, dx, dy, duration) {
    if (this.particles.length >= this.maxParticles) return;
    const particle = { x, y, color, size, dx, dy, duration, age: 0 };
    this.particles.push(particle);
  }

  updateAndDraw(ctx, deltaTime) {
    // Use provided deltaTime, or calculate it if not provided (for backwards compatibility)
    const actualDeltaTime = deltaTime !== undefined ? deltaTime : this._calculateDeltaTime();
    
    this.particles = this.particles.filter(p => p.age < p.duration);
    this.particles.forEach(p => {
      p.x += p.dx * (actualDeltaTime / 16); // Normalize to 16ms baseline for consistent speed
      p.y += p.dy * (actualDeltaTime / 16);
      p.age += actualDeltaTime;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  _calculateDeltaTime() {
    const now = performance.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    return deltaTime;
  }
}

export default class ParticleManager {
  constructor(maxParticles = 500) {
    this.maxParticles = maxParticles;
    this.particles = [];
  }

  createParticle(x, y, color, size, dx, dy, duration) {
    if (this.particles.length >= this.maxParticles) return;
    const particle = { x, y, color, size, dx, dy, duration, age: 0 };
    this.particles.push(particle);
  }

  updateAndDraw(ctx) {
    const now = performance.now();
    this.particles = this.particles.filter(p => p.age < p.duration);
    this.particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.age += 16; // approx frame time
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

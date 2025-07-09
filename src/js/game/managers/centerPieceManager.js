export default class CenterPieceManager {
  constructor(canvas, ctx, particleManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particleManager = particleManager;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.radius = Math.max(10, Math.min(canvas.width, canvas.height) * 0.1);
    this.rotation = 0;
    this.pulsePhase = 0;
    this.swirlParticles = [];
    this.lastParticleTime = 0;
  }

  update(deltaTime) {
    this.rotation += deltaTime * 0.002;
    this.pulsePhase += deltaTime * 0.003;
    
    // Generate swirl particles
    this.lastParticleTime += deltaTime;
    if (this.lastParticleTime > 100) { // Every 100ms
      this.generateSwirlParticle();
      this.lastParticleTime = 0;
    }
    
    // Update swirl particles
    this.swirlParticles = this.swirlParticles.filter(particle => {
      particle.angle += particle.speed;
      particle.radius += particle.radiusSpeed;
      particle.life -= deltaTime;
      
      particle.x = this.centerX + Math.cos(particle.angle) * particle.radius;
      particle.y = this.centerY + Math.sin(particle.angle) * particle.radius;
      
      return particle.life > 0 && particle.radius < this.canvas.width;
    });
  }

  generateSwirlParticle() {
    const particle = {
      angle: Math.random() * Math.PI * 2,
      radius: this.radius,
      radiusSpeed: 0.5 + Math.random() * 1,
      speed: 0.02 + Math.random() * 0.03,
      x: this.centerX,
      y: this.centerY,
      color: this.getRandomColor(),
      size: 2 + Math.random() * 3,
      life: 3000 + Math.random() * 2000
    };
    
    this.swirlParticles.push(particle);
  }

  getRandomColor() {
    const colors = ['#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF6B6B'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  draw() {
    this.ctx.save();
    
    // Draw center piece
    let pulseSize = this.radius + Math.sin(this.pulsePhase) * 10;
    if (pulseSize < 2) pulseSize = 2;
    
    // Outer glow
    this.ctx.shadowColor = '#4ECDC4';
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, pulseSize * 1.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Main center piece
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, pulseSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Inner core
    this.ctx.shadowBlur = 5;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, pulseSize * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Rotating spokes
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 8;
    
    for (let i = 0; i < 8; i++) {
      const angle = this.rotation + (i * Math.PI / 4);
      const startRadius = pulseSize * 0.7;
      const endRadius = pulseSize * 1.2;
      
      const startX = this.centerX + Math.cos(angle) * startRadius;
      const startY = this.centerY + Math.sin(angle) * startRadius;
      const endX = this.centerX + Math.cos(angle) * endRadius;
      const endY = this.centerY + Math.sin(angle) * endRadius;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
    
    // Draw swirl particles
    this.swirlParticles.forEach(particle => {
      const alpha = particle.life / 3000;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = particle.color;
      
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.ctx.restore();
  }

  checkCollision(x, y, radius) {
    const distance = Math.sqrt(
      Math.pow(x - this.centerX, 2) + 
      Math.pow(y - this.centerY, 2)
    );
    return distance < (this.radius + radius);
  }

  resize(canvas) {
    this.canvas = canvas;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.radius = Math.max(10, Math.min(canvas.width, canvas.height) * 0.1);
  }

  reset() {
    this.swirlParticles = [];
    this.rotation = 0;
    this.pulsePhase = 0;
  }
}

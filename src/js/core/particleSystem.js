/**
 * Enhanced Particle System with Object Pooling and Performance Optimization
 * Prioritizes smooth 60fps performance while providing rich visual effects
 */
export default class ParticleManager {
  constructor(maxParticles = 500) {
    this.maxParticles = maxParticles;
    this.particles = [];
    this.lastUpdateTime = performance.now();

    this.particlePool = [];
    this.activeParticles = 0;
    
    // Performance optimization
    this.lastCleanupTime = 0;
    this.cleanupInterval = 100; // Cleanup every 100ms
    this.renderBatch = [];
    this.colorCache = new Map();
    
    // Visual effects
    this.globalEffects = {
      wind: { x: 0, y: 0 },
      gravity: 0.1,
      turbulence: 0
    };
    
    // Performance monitoring
    this.performanceMode = 'high'; // high, medium, low
    this.frameTimeHistory = [];
    this.avgFrameTime = 16; // Target 60fps
    
    // Initialize particle pool
    this.initializePool();
  }

  initializePool() {
    // Pre-allocate particles for performance
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(this.createParticleObject());
    }
  }

  createParticleObject() {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1,
      color: '#ffffff',
      opacity: 1,
      life: 1,
      maxLife: 1000,
      age: 0,
      rotation: 0,
      rotationSpeed: 0,
      scale: 1,
      scaleVelocity: 0,
      active: false,
      type: 'circle',
      trail: false,
      trailPositions: [],
      physics: {
        gravity: true,
        bounce: false,
        friction: 0.99
      }
    };
  }

  setPerformanceMode(mode) {
    this.performanceMode = mode;
    
    // Adjust settings based on performance
    switch (mode) {
      case 'low':
        this.maxParticles = Math.min(100, this.maxParticles);
        this.cleanupInterval = 200;
        break;
      case 'medium':
        this.maxParticles = Math.min(250, this.maxParticles);
        this.cleanupInterval = 150;
        break;
      case 'high':
        // Use defaults
        break;
    }
  }

  createParticle(x, y, color, size, dx, dy, duration, options = {}) {
    if (this.activeParticles >= this.maxParticles) {
      // Remove oldest particle to make room
      this.removeOldestParticle();
    }
    
    // Get particle from pool
    let particle = this.particlePool.find(p => !p.active);
    if (!particle) {
      particle = this.createParticleObject();
      this.particlePool.push(particle);
    }
    
    // Configure particle
    particle.x = x;
    particle.y = y;
    particle.vx = dx;
    particle.vy = dy;
    particle.size = size;
    particle.color = color;
    particle.opacity = options.opacity || 1;
    particle.life = 1;
    particle.maxLife = duration;
    particle.age = 0;
    particle.rotation = options.rotation || 0;
    particle.rotationSpeed = options.rotationSpeed || 0;
    particle.scale = options.scale || 1;
    particle.scaleVelocity = options.scaleVelocity || 0;
    particle.active = true;
    particle.type = options.type || 'circle';
    particle.trail = options.trail || false;
    particle.trailPositions = [];
    
    // Physics options
    particle.physics.gravity = options.gravity !== undefined ? options.gravity : true;
    particle.physics.bounce = options.bounce || false;
    particle.physics.friction = options.friction || 0.99;
    
    this.particles.push(particle);
    this.activeParticles++;
    
    return particle;
  }

  // Enhanced particle creation methods
  createExplosion(x, y, color, intensity = 1, count = 20) {
    for (let i = 0; i < count * intensity; i++) {
      const angle = (Math.PI * 2 * i) / (count * intensity);
      const speed = 2 + Math.random() * 4 * intensity;
      const size = 1 + Math.random() * 3 * intensity;
      const duration = 500 + Math.random() * 1000;
      
      this.createParticle(
        x, y, color, size,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        duration,
        {
          scaleVelocity: -0.01,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          gravity: true
        }
      );
    }
  }

  createTrail(x, y, color, size, dx, dy, duration) {
    this.createParticle(x, y, color, size, dx, dy, duration, {
      trail: true,
      gravity: false,
      friction: 0.95,
      scaleVelocity: -0.005
    });
  }

  createSparkle(x, y, color, intensity = 1) {
    const count = 5 + Math.floor(Math.random() * 10 * intensity);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2 * intensity;
      const size = 1 + Math.random() * 2;
      const duration = 800 + Math.random() * 600;
      
      this.createParticle(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        color, size,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        duration,
        {
          type: 'star',
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          scaleVelocity: -0.003,
          gravity: false
        }
      );
    }
  }

  createBubbleParticles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      const size = 2 + Math.random() * 4;
      const duration = 1000 + Math.random() * 2000;
      
      this.createParticle(
        x, y,
        `hsla(${200 + Math.random() * 60}, 70%, 80%, 0.7)`,
        size,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 1, // Float upward
        duration,
        {
          type: 'bubble',
          gravity: false,
          friction: 0.98,
          scaleVelocity: 0.001 // Grow slightly
        }
      );
    }
  }

  removeOldestParticle() {
    let oldestIndex = -1;
    let oldestAge = 0;
    
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].active && this.particles[i].age > oldestAge) {
        oldestAge = this.particles[i].age;
        oldestIndex = i;
      }
    }
    
    if (oldestIndex >= 0) {
      this.deactivateParticle(this.particles[oldestIndex]);
    }
  }

  deactivateParticle(particle) {
    particle.active = false;
    particle.trailPositions = [];
    this.activeParticles--;
  }

  updateAndDraw(ctx, deltaTime) {
    // Use provided deltaTime, or calculate it if not provided (for backwards compatibility)
    const actualDeltaTime = deltaTime !== undefined ? deltaTime : this._calculateDeltaTime();
    
    // Update all particles with proper physics and visual effects
    this.updateParticles(actualDeltaTime);
    
    // Clean up inactive particles to prevent memory leaks
    const currentTime = performance.now();
    if (currentTime - this.lastCleanupTime >= this.cleanupInterval) {
      this.cleanupInactiveParticles();
      this.lastCleanupTime = currentTime;
    }
    
    // Draw all particles with advanced rendering (circles, stars, trails, etc.)
    this.drawParticles(ctx);
    
    // Performance monitoring
    this.monitorPerformance(performance.now());
  }

  updateParticles(deltaTime) {
    const dt = deltaTime / 16; // Normalize to 60fps
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle.active) continue;
      
      // Update age and life
      particle.age += deltaTime;
      particle.life = 1 - (particle.age / particle.maxLife);
      
      // Remove expired particles
      if (particle.life <= 0) {
        this.deactivateParticle(particle);
        continue;
      }
      
      // Update trail positions
      if (particle.trail) {
        particle.trailPositions.push({ x: particle.x, y: particle.y });
        if (particle.trailPositions.length > 10) {
          particle.trailPositions.shift();
        }
      }
      
      // Apply physics
      this.updateParticlePhysics(particle, dt);
      
      // Update visual properties
      this.updateParticleVisuals(particle, dt);
    }
  }

  updateParticlePhysics(particle, dt) {
    // Apply global effects
    particle.vx += this.globalEffects.wind.x * dt;
    particle.vy += this.globalEffects.wind.y * dt;
    
    if (particle.physics.gravity) {
      particle.vy += this.globalEffects.gravity * dt;
    }
    
    // Apply turbulence
    if (this.globalEffects.turbulence > 0) {
      particle.vx += (Math.random() - 0.5) * this.globalEffects.turbulence * dt;
      particle.vy += (Math.random() - 0.5) * this.globalEffects.turbulence * dt;
    }
    
    // Apply friction
    particle.vx *= particle.physics.friction;
    particle.vy *= particle.physics.friction;
    
    // Update position
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    
    // Boundary handling
    if (particle.physics.bounce) {
      // Simple boundary bouncing (can be enhanced)
      if (particle.x < 0 || particle.x > 800) { // Assuming canvas width
        particle.vx *= -0.5;
      }
      if (particle.y > 600) { // Assuming canvas height
        particle.vy *= -0.5;
        particle.y = 600;
      }
    }
  }

  updateParticleVisuals(particle, dt) {
    // Update rotation
    particle.rotation += particle.rotationSpeed * dt;
    
    // Update scale
    particle.scale += particle.scaleVelocity * dt;
    particle.scale = Math.max(0.1, particle.scale);
    
    // Update opacity based on life
    particle.opacity = particle.life;
  }

  drawParticles(ctx) {
    // Group particles by type for batch rendering
    const batches = {
      circle: [],
      star: [],
      bubble: [],
      trail: []
    };
    
    // Sort particles into batches
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle.active) continue;
      
      if (batches[particle.type]) {
        batches[particle.type].push(particle);
      } else {
        batches.circle.push(particle);
      }
    }
    
    // Draw each batch
    ctx.save();
    
    // Draw trails first (behind other particles)
    this.drawTrailParticles(ctx, batches.trail);
    
    // Draw main particles
    this.drawCircleParticles(ctx, batches.circle);
    this.drawStarParticles(ctx, batches.star);
    this.drawBubbleParticles(ctx, batches.bubble);
    
    ctx.restore();
  }

  drawCircleParticles(ctx, particles) {
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.translate(particle.x, particle.y);
      ctx.scale(particle.scale, particle.scale);
      ctx.rotate(particle.rotation);
      
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  _calculateDeltaTime() {
    const now = performance.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    return deltaTime;
  }

  drawStarParticles(ctx, particles) {
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.translate(particle.x, particle.y);
      ctx.scale(particle.scale, particle.scale);
      ctx.rotate(particle.rotation);
      
      // Draw star shape
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const x = Math.cos(angle) * particle.size;
        const y = Math.sin(angle) * particle.size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    });
  }

  drawBubbleParticles(ctx, particles) {
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.translate(particle.x, particle.y);
      ctx.scale(particle.scale, particle.scale);
      
      // Draw bubble with highlight
      const gradient = ctx.createRadialGradient(
        -particle.size * 0.3, -particle.size * 0.3, 0,
        0, 0, particle.size
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.7, particle.color);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add bubble highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(-particle.size * 0.3, -particle.size * 0.3, particle.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  drawTrailParticles(ctx, particles) {
    particles.forEach(particle => {
      if (particle.trailPositions.length < 2) return;
      
      ctx.save();
      ctx.globalAlpha = particle.opacity * 0.5;
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = particle.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(particle.trailPositions[0].x, particle.trailPositions[0].y);
      
      for (let i = 1; i < particle.trailPositions.length; i++) {
        ctx.lineTo(particle.trailPositions[i].x, particle.trailPositions[i].y);
      }
      
      ctx.stroke();
      ctx.restore();
      
      // Draw current particle
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  cleanupInactiveParticles() {
    this.particles = this.particles.filter(particle => particle.active);
  }

  monitorPerformance(now) {
    const frameTime = now - (this.lastFrameTime || now);
    this.frameTimeHistory.push(frameTime);
    
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
      
      // Calculate average frame time
      const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
      this.avgFrameTime = sum / this.frameTimeHistory.length;
      
      // Adjust performance if needed
      if (this.avgFrameTime > 20 && this.performanceMode === 'high') { // Below 50fps
        this.setPerformanceMode('medium');
        console.log('🐌 Reduced to medium performance mode');
      } else if (this.avgFrameTime > 25 && this.performanceMode === 'medium') { // Below 40fps
        this.setPerformanceMode('low');
        console.log('🐌 Reduced to low performance mode');
      } else if (this.avgFrameTime < 17 && this.performanceMode !== 'high') { // Above 58fps
        this.setPerformanceMode('high');
        console.log('🚀 Increased to high performance mode');
      }
    }
    
    this.lastFrameTime = now;
  }

  // Global effects control
  setWind(x, y) {
    this.globalEffects.wind.x = x;
    this.globalEffects.wind.y = y;
  }

  setGravity(gravity) {
    this.globalEffects.gravity = gravity;
  }

  setTurbulence(turbulence) {
    this.globalEffects.turbulence = turbulence;
  }

  // Utility methods
  clear() {
    this.particles.forEach(particle => this.deactivateParticle(particle));
    this.activeParticles = 0;
  }

  getActiveParticleCount() {
    return this.activeParticles;
  }

  getPerformanceInfo() {
    return {
      activeParticles: this.activeParticles,
      maxParticles: this.maxParticles,
      avgFrameTime: this.avgFrameTime,
      performanceMode: this.performanceMode,
      fps: Math.round(1000 / this.avgFrameTime)
    };
  }
}

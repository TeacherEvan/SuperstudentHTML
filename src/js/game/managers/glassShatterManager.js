// OPTIMIZATION: Cache constant to avoid repeated Math.PI calculations
const TWO_PI = Math.PI * 2;

export default class GlassShatterManager {
  constructor(canvas, ctx, particleManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particleManager = particleManager;

    // State management
    this.isShattered = false;
    this.shatterTime = 0;
    this.maxShatterTime = 3000;
    this.fadeAlpha = 0;

    // Advanced crack system
    this.cracks = [];
    this.fragments = [];
    this.stressPoints = [];

    // Physics parameters
    this.physics = {
      gravity: 0.3,
      friction: 0.98,
      elasticity: 0.4,
      fragmentCount: 25,
      crackPropagationSpeed: 300,
      stressFieldRadius: 150
    };

    // Visual effects
    this.effects = {
      refractionIntensity: 0.8,
      reflectionIntensity: 0.6,
      glowIntensity: 0.4,
      shimmerPhase: 0
    };

    // Performance optimization
    this.performanceLevel = this.detectPerformanceLevel();
    this.adjustSettingsForPerformance();
  }

  detectPerformanceLevel() {
    // Simple performance detection based on canvas size and device
    const pixelCount = this.canvas.width * this.canvas.height;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile || pixelCount > 1920 * 1080) {
      return 'low';
    } else if (pixelCount > 1280 * 720) {
      return 'medium';
    }
    return 'high';
  }

  adjustSettingsForPerformance() {
    switch (this.performanceLevel) {
    case 'low':
      this.physics.fragmentCount = 15;
      this.physics.crackPropagationSpeed = 200;
      this.effects.refractionIntensity = 0.4;
      break;
    case 'medium':
      this.physics.fragmentCount = 20;
      this.physics.crackPropagationSpeed = 250;
      this.effects.refractionIntensity = 0.6;
      break;
    case 'high':
      // Use default settings
      break;
    }
  }

  createShatterEffect(impactX, impactY, intensity = 1) {
    this.reset();
    this.isShattered = true;
    this.fadeAlpha = Math.min(1, 0.9 * intensity);
    this.shatterTime = 0;

    // Create impact point
    const impactPoint = {
      x: impactX,
      y: impactY,
      intensity: intensity,
      radius: Math.min(100, 50 * intensity)
    };

    // Generate realistic crack propagation
    this.generateRealisticCracks(impactPoint);

    // Create glass fragments with physics
    this.generateGlassFragments(impactPoint);

    // Add stress field visualization
    this.createStressField(impactPoint);

    // Enhanced particle effects
    this.createAdvancedParticles(impactPoint);
  }

  generateRealisticCracks(impactPoint) {
    const { x, y, intensity } = impactPoint;
    this.cracks = [];

    // Primary radial cracks
    const numPrimary = Math.floor(6 + intensity * 8);
    for (let i = 0; i < numPrimary; i++) {
      const angle = (i / numPrimary) * TWO_PI + (Math.random() - 0.5) * 0.5;
      const crack = this.createCrackLine(x, y, angle, intensity, 'primary');
      this.cracks.push(crack);
    }

    // Secondary branching cracks
    const numSecondary = Math.floor(4 + intensity * 6);
    for (let i = 0; i < numSecondary; i++) {
      const angle = Math.random() * TWO_PI;
      const distance = 50 + Math.random() * 80;
      const startX = x + Math.cos(angle) * distance;
      const startY = y + Math.sin(angle) * distance;
      const crack = this.createCrackLine(startX, startY, angle + Math.PI/2, intensity * 0.7, 'secondary');
      this.cracks.push(crack);
    }

    // Circular stress cracks
    const numCircular = Math.floor(2 + intensity * 3);
    for (let i = 0; i < numCircular; i++) {
      const radius = 30 + i * 25 + Math.random() * 20;
      const crack = this.createCircularCrack(x, y, radius, intensity);
      this.cracks.push(crack);
    }
  }

  createCrackLine(startX, startY, angle, intensity, type) {
    const crack = {
      points: [],
      type: type,
      width: type === 'primary' ? 2 + intensity : 1 + intensity * 0.5,
      opacity: 0.8,
      propagationSpeed: this.physics.crackPropagationSpeed,
      currentLength: 0,
      targetLength: (type === 'primary' ? 150 : 80) + Math.random() * 100 * intensity
    };

    // Generate crack path with realistic imperfections
    const segments = Math.floor(crack.targetLength / 10);
    let currentX = startX;
    let currentY = startY;
    let currentAngle = angle;

    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      const segmentLength = 10 + Math.random() * 5;

      // Add natural deviation
      const deviation = (Math.random() - 0.5) * 0.3 * progress;
      currentAngle += deviation;

      // Add stress-based branching
      if (Math.random() < 0.1 * intensity && i > 2) {
        const branchAngle = currentAngle + (Math.random() - 0.5) * Math.PI/3;
        const branchLength = segmentLength * (0.5 + Math.random() * 0.5);
        const branchX = currentX + Math.cos(branchAngle) * branchLength;
        const branchY = currentY + Math.sin(branchAngle) * branchLength;

        crack.points.push({
          x: branchX,
          y: branchY,
          isBranch: true,
          opacity: 0.6
        });
      }

      currentX += Math.cos(currentAngle) * segmentLength;
      currentY += Math.sin(currentAngle) * segmentLength;

      // Check boundaries
      if (currentX < 0 || currentX > this.canvas.width || currentY < 0 || currentY > this.canvas.height) {
        break;
      }

      crack.points.push({
        x: currentX,
        y: currentY,
        isBranch: false,
        opacity: 0.8 * (1 - progress * 0.3)
      });
    }

    return crack;
  }

  createCircularCrack(centerX, centerY, radius, intensity) {
    const crack = {
      points: [],
      type: 'circular',
      width: 1 + intensity * 0.5,
      opacity: 0.6,
      propagationSpeed: this.physics.crackPropagationSpeed * 0.7,
      currentLength: 0,
      targetLength: radius * TWO_PI
    };

    const segments = Math.floor(radius * 0.3);
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * TWO_PI;
      const deviation = (Math.random() - 0.5) * 15;
      const x = centerX + Math.cos(angle) * (radius + deviation);
      const y = centerY + Math.sin(angle) * (radius + deviation);

      crack.points.push({
        x: x,
        y: y,
        isBranch: false,
        opacity: 0.6
      });
    }

    return crack;
  }

  generateGlassFragments(impactPoint) {
    this.fragments = [];
    const { x, y, intensity } = impactPoint;

    for (let i = 0; i < this.physics.fragmentCount; i++) {
      const angle = Math.random() * TWO_PI;
      const distance = Math.random() * 80 * intensity;
      const size = 3 + Math.random() * 8;

      const fragment = {
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        vx: Math.cos(angle) * (2 + Math.random() * 6) * intensity,
        vy: Math.sin(angle) * (2 + Math.random() * 6) * intensity - Math.random() * 2,
        size: size,
        rotation: Math.random() * TWO_PI,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        opacity: 0.7 + Math.random() * 0.3,
        color: this.getGlassColor(),
        life: 1.0,
        decay: 0.0003 + Math.random() * 0.0002
      };

      this.fragments.push(fragment);
    }
  }

  createStressField(impactPoint) {
    this.stressPoints = [];
    const { x, y, intensity, radius } = impactPoint;

    // Create stress visualization points
    const stressCount = Math.floor(15 + intensity * 10);
    for (let i = 0; i < stressCount; i++) {
      const angle = Math.random() * TWO_PI;
      const distance = Math.random() * radius;

      this.stressPoints.push({
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        intensity: intensity * (1 - distance / radius),
        phase: Math.random() * TWO_PI,
        radius: 2 + Math.random() * 4
      });
    }
  }

  createAdvancedParticles(impactPoint) {
    const { x, y, intensity } = impactPoint;
    const particleCount = Math.floor(40 + intensity * 80);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * TWO_PI;
      const speed = 2 + Math.random() * 5;
      const distance = Math.random() * 60;

      const startX = x + Math.cos(angle) * distance;
      const startY = y + Math.sin(angle) * distance;

      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed + Math.random() * 1;

      const size = 1 + Math.random() * 3;
      const duration = 800 + Math.random() * 1500;

      const color = this.getGlassParticleColor();
      this.particleManager.createParticle(startX, startY, color, size, dx, dy, duration);
    }
  }

  getGlassColor() {
    const colors = [
      'rgba(255, 255, 255, 0.9)',
      'rgba(240, 248, 255, 0.8)',
      'rgba(220, 235, 255, 0.7)',
      'rgba(200, 230, 255, 0.8)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getGlassParticleColor() {
    const colors = [
      'rgba(255, 255, 255, 0.9)',
      'rgba(180, 220, 255, 0.7)',
      'rgba(200, 240, 255, 0.8)',
      'rgba(160, 200, 255, 0.6)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(deltaTime) {
    if (!this.isShattered) return;

    this.shatterTime += deltaTime;
    const dt = deltaTime / 16; // Normalize to 60fps

    // Update fade effect
    const fadeProgress = this.shatterTime / this.maxShatterTime;
    this.fadeAlpha = Math.max(0, 0.9 * (1 - fadeProgress));

    // Update shimmer effect
    this.effects.shimmerPhase += 0.1 * dt;

    // Update crack propagation
    this.updateCrackPropagation(dt);

    // Update glass fragments
    this.updateFragments(dt);

    // Update stress field
    this.updateStressField(dt);

    // Cleanup when done
    if (this.shatterTime >= this.maxShatterTime) {
      this.reset();
    }
  }

  updateCrackPropagation(dt) {
    this.cracks.forEach(crack => {
      if (crack.currentLength < crack.targetLength) {
        crack.currentLength += crack.propagationSpeed * dt;
        crack.currentLength = Math.min(crack.currentLength, crack.targetLength);
      }
    });
  }

  updateFragments(dt) {
    // OPTIMIZATION: Cache physics values to avoid repeated property lookups
    const gravity = this.physics.gravity;
    const friction = this.physics.friction;
    const elasticity = this.physics.elasticity;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // OPTIMIZATION: Use index-based loop and inline dead fragment removal
    // to avoid creating a new array on every frame
    let writeIndex = 0;
    for (let i = 0; i < this.fragments.length; i++) {
      const fragment = this.fragments[i];

      // Apply physics
      fragment.x += fragment.vx * dt;
      fragment.y += fragment.vy * dt;
      fragment.vy += gravity * dt;

      // Apply friction
      fragment.vx *= friction;
      fragment.vy *= friction;

      // Update rotation
      fragment.rotation += fragment.rotationSpeed * dt;

      // Update life
      fragment.life -= fragment.decay * dt;
      fragment.opacity = Math.max(0, fragment.life * 0.8);

      // Boundary collision
      if (fragment.x < 0 || fragment.x > canvasWidth) {
        fragment.vx *= -elasticity;
      }
      if (fragment.y > canvasHeight) {
        fragment.vy *= -elasticity;
        fragment.y = canvasHeight;
      }

      // Only keep fragments that are still alive
      if (fragment.life > 0) {
        this.fragments[writeIndex++] = fragment;
      }
    }
    this.fragments.length = writeIndex;
  }

  updateStressField(dt) {
    this.stressPoints.forEach(point => {
      point.phase += 0.15 * dt;
      point.intensity *= 0.995; // Gradual fade
    });
  }

  draw() {
    if (!this.isShattered || this.fadeAlpha <= 0) return;

    this.ctx.save();

    // Draw stress field (subtle background effect)
    this.drawStressField();

    // Draw crack patterns
    this.drawCracks();

    // Draw glass fragments
    this.drawFragments();

    // Draw refraction effect
    this.drawRefractionEffect();

    this.ctx.restore();
  }

  drawStressField() {
    this.ctx.globalAlpha = this.fadeAlpha * 0.3;
    this.stressPoints.forEach(point => {
      const intensity = point.intensity * (1 + Math.sin(point.phase) * 0.3);
      const radius = point.radius * intensity;

      const gradient = this.ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, radius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.4})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, radius, 0, TWO_PI);
      this.ctx.fill();
    });
  }

  drawCracks() {
    this.ctx.globalAlpha = this.fadeAlpha;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.cracks.forEach(crack => {
      if (crack.points.length < 2) return;

      const drawLength = Math.min(crack.currentLength, crack.targetLength);
      const pointsCount = Math.floor((drawLength / crack.targetLength) * crack.points.length);

      // Main crack line
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${crack.opacity})`;
      this.ctx.lineWidth = crack.width;
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      this.ctx.shadowBlur = crack.width * 2;

      this.ctx.beginPath();
      if (pointsCount > 0) {
        this.ctx.moveTo(crack.points[0].x, crack.points[0].y);
        for (let i = 1; i < pointsCount; i++) {
          const point = crack.points[i];
          this.ctx.globalAlpha = this.fadeAlpha * point.opacity;
          this.ctx.lineTo(point.x, point.y);
        }
      }
      this.ctx.stroke();

      // Add shimmer effect
      this.ctx.globalAlpha = this.fadeAlpha * 0.5 * (1 + Math.sin(this.effects.shimmerPhase) * 0.3);
      this.ctx.strokeStyle = 'rgba(180, 220, 255, 0.6)';
      this.ctx.lineWidth = crack.width * 0.5;
      this.ctx.stroke();
    });
  }

  drawFragments() {
    this.fragments.forEach(fragment => {
      this.ctx.save();
      this.ctx.globalAlpha = fragment.opacity * this.fadeAlpha;
      this.ctx.translate(fragment.x, fragment.y);
      this.ctx.rotate(fragment.rotation);

      // Draw fragment with glass-like appearance
      this.ctx.fillStyle = fragment.color;
      this.ctx.beginPath();
      this.ctx.rect(-fragment.size/2, -fragment.size/2, fragment.size, fragment.size);
      this.ctx.fill();

      // Add highlight
      this.ctx.globalAlpha = fragment.opacity * this.fadeAlpha * 0.8;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.beginPath();
      this.ctx.rect(-fragment.size/2, -fragment.size/2, fragment.size/3, fragment.size/3);
      this.ctx.fill();

      this.ctx.restore();
    });
  }

  drawRefractionEffect() {
    if (this.effects.refractionIntensity <= 0) return;

    this.ctx.globalAlpha = this.fadeAlpha * this.effects.refractionIntensity * 0.3;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  reset() {
    this.isShattered = false;
    this.shatterTime = 0;
    this.fadeAlpha = 0;
    this.cracks = [];
    this.fragments = [];
    this.stressPoints = [];
    this.effects.shimmerPhase = 0;
  }

  isActive() {
    return this.isShattered;
  }

  triggerShatter(x, y, intensity = 1) {
    this.createShatterEffect(x, y, intensity);
  }
}

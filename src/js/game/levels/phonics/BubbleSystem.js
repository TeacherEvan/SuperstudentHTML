import { PhonicsConfig } from './PhonicsConfig.js';

/**
 * BubbleSystem - Optimized bubble physics and management
 */
export class BubbleSystem {
  constructor(canvas, ctx, particleManager, soundManager) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particleManager = particleManager;
    this.soundManager = soundManager;

    // Configuration
    this.config = PhonicsConfig;

    // Bubble management
    this.bubbles = [];
    this.bubblePool = [];
    this.activeBubbles = 0;

    // Performance optimization
    this.lastSpawnTime = 0;
    this.spawnRate = this.config.education.difficulty.easy.spawnRate;
    this.maxBubbles = this.config.performance.maxBubbles;

    // Visual effects
    this.time = 0;
    this.shimmerPhase = 0;

    // Initialize bubble pool
    this.initializeBubblePool();

    // Target letter tracking
    this.targetLetter = null;
    this.targetLetterIndex = 0;
    this.currentDifficulty = 'easy';

    // Game state
    this.streak = 0;
    this.combo = 0;
    this.lastCorrectTime = 0;

    // Bind methods
    this.onPointerDown = this.onPointerDown.bind(this);
    this.setupEventListeners();
  }

  initializeBubblePool() {
    // Pre-create bubbles for performance
    for (let i = 0; i < this.config.performance.bubblePoolSize; i++) {
      this.bubblePool.push(this.createBubbleObject());
    }
  }

  createBubbleObject() {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      letter: '',
      isTarget: false,
      lifetime: 0,
      maxLifetime: 0,
      phase: Math.random() * Math.PI * 2,
      popAnimation: 0,
      isPopping: false,
      glowIntensity: 0,
      shimmerOffset: Math.random() * Math.PI * 2,
      active: false,
      age: 0,
      bounceCount: 0,
      lastSoundTime: 0
    };
  }

  setupEventListeners() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('touchstart', this.onPointerDown);
  }

  removeEventListeners() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('touchstart', this.onPointerDown);
  }

  setDifficulty(difficulty) {
    this.currentDifficulty = difficulty;
    this.spawnRate = this.config.education.difficulty[difficulty].spawnRate;
    this.maxBubbles = Math.floor(this.config.performance.maxBubbles *
      (difficulty === 'easy' ? 0.7 : difficulty === 'medium' ? 0.85 : 1.0));
  }

  setTargetLetter(letter) {
    this.targetLetter = letter;
    this.targetLetterIndex = this.config.education.alphabet.indexOf(letter);
  }

  getNextTargetLetter() {
    const letters = this.config.education.difficulty[this.currentDifficulty].letters;
    this.targetLetterIndex = (this.targetLetterIndex + 1) % letters.length;
    return letters[this.targetLetterIndex];
  }

  spawnBubble(letter = null, isTarget = false) {
    if (this.activeBubbles >= this.maxBubbles) return null;

    // Get bubble from pool
    let bubble = this.bubblePool.find(b => !b.active);
    if (!bubble) {
      bubble = this.createBubbleObject();
      this.bubblePool.push(bubble);
    }

    // Configure bubble
    const spawnZone = this.config.gameplay.spawnZone;
    const size = this.config.visuals.bubbleSize.min +
                Math.random() * (this.config.visuals.bubbleSize.max - this.config.visuals.bubbleSize.min);

    bubble.x = (spawnZone.x + Math.random() * spawnZone.width) * this.canvas.width;
    bubble.y = spawnZone.y * this.canvas.height;
    bubble.vx = (Math.random() - 0.5) * 0.5;
    bubble.vy = -this.config.education.difficulty[this.currentDifficulty].bubbleSpeed;
    bubble.size = size;
    bubble.letter = letter || this.getRandomLetter();
    bubble.isTarget = isTarget;
    bubble.lifetime = 0;
    bubble.maxLifetime = this.config.gameplay.bubbleLifetime;
    bubble.phase = Math.random() * Math.PI * 2;
    bubble.popAnimation = 0;
    bubble.isPopping = false;
    bubble.glowIntensity = isTarget ? 0.5 : 0;
    bubble.shimmerOffset = Math.random() * Math.PI * 2;
    bubble.active = true;
    bubble.age = 0;
    bubble.bounceCount = 0;
    bubble.lastSoundTime = 0;

    this.bubbles.push(bubble);
    this.activeBubbles++;

    // Play phonics sound if enabled
    if (this.config.audio.phonics.playOnSpawn) {
      this.soundManager.playPhonicsSound(bubble.letter, this.config.audio.phonics.volume);
    }

    return bubble;
  }

  getRandomLetter() {
    const letters = this.config.education.difficulty[this.currentDifficulty].letters;
    return letters[Math.floor(Math.random() * letters.length)];
  }

  update(deltaTime) {
    this.time += deltaTime;
    this.shimmerPhase += this.config.visuals.effects.shimmer.speed * deltaTime / 16;

    // Spawn bubbles
    this.updateSpawning(deltaTime);

    // Update existing bubbles
    this.updateBubbles(deltaTime);

    // Check for expired bubbles
    this.cleanupBubbles();

    // Update combo timer
    this.updateCombo(deltaTime);
  }

  updateSpawning(deltaTime) {
    const now = performance.now();
    if (now - this.lastSpawnTime >= this.spawnRate) {
      const shouldSpawnTarget = this.targetLetter &&
                               Math.random() < 0.4 &&
                               !this.bubbles.some(b => b.isTarget);

      if (shouldSpawnTarget) {
        this.spawnBubble(this.targetLetter, true);
      } else {
        this.spawnBubble();
      }

      this.lastSpawnTime = now;
    }
  }

  updateBubbles(deltaTime) {
    const dt = deltaTime / 16; // Normalize to 60fps

    this.bubbles.forEach(bubble => {
      if (!bubble.active) return;

      // Update lifetime
      bubble.lifetime += deltaTime;
      bubble.age += deltaTime;

      if (bubble.isPopping) {
        bubble.popAnimation += deltaTime / 200;
        if (bubble.popAnimation >= 1) {
          this.deactivateBubble(bubble);
        }
        return;
      }

      // Physics update
      this.updateBubblePhysics(bubble, dt);

      // Visual effects update
      this.updateBubbleEffects(bubble, dt);

      // Check boundaries
      this.checkBoundaries(bubble);

      // Check if bubble should be removed
      if (bubble.lifetime >= bubble.maxLifetime) {
        this.popBubble(bubble, false);
      }
    });
  }

  updateBubblePhysics(bubble, dt) {
    // Apply buoyancy (bubbles float up)
    bubble.vy -= this.config.physics.buoyancy * dt;

    // Apply gravity (slight downward force)
    bubble.vy += this.config.physics.gravity * dt;

    // Apply drag
    bubble.vx *= this.config.physics.drag;
    bubble.vy *= this.config.physics.drag;

    // Add floating motion
    if (this.config.visuals.effects.floating.enabled) {
      const floatOffset = Math.sin(this.time * this.config.visuals.effects.floating.frequency + bubble.phase) *
                         this.config.visuals.effects.floating.amplitude;
      bubble.vx += floatOffset * 0.01;
    }

    // Update position
    bubble.x += bubble.vx * dt;
    bubble.y += bubble.vy * dt;
  }

  updateBubbleEffects(bubble, dt) {
    // Update phase for animations
    bubble.phase += 0.02 * dt;

    // Update glow for target letters
    if (bubble.isTarget) {
      bubble.glowIntensity = 0.5 + Math.sin(this.time * 0.005) * 0.3;
    }

    // Update shimmer effect
    bubble.shimmerOffset += this.config.visuals.effects.shimmer.speed * dt;
  }

  checkBoundaries(bubble) {
    const radius = bubble.size / 2;

    // Side boundaries
    if (bubble.x - radius < 0) {
      bubble.x = radius;
      bubble.vx = -bubble.vx * this.config.physics.bounce.elasticity;
      bubble.bounceCount++;
    } else if (bubble.x + radius > this.canvas.width) {
      bubble.x = this.canvas.width - radius;
      bubble.vx = -bubble.vx * this.config.physics.bounce.elasticity;
      bubble.bounceCount++;
    }

    // Top boundary (bubbles escape here)
    if (bubble.y + radius < 0) {
      this.deactivateBubble(bubble);
    }

    // Bottom boundary (bubbles bounce)
    if (bubble.y + radius > this.canvas.height) {
      bubble.y = this.canvas.height - radius;
      bubble.vy = -bubble.vy * this.config.physics.bounce.elasticity;
      bubble.bounceCount++;
    }

    // Apply bounce damping
    if (bubble.bounceCount > 0) {
      bubble.vx *= this.config.physics.bounce.damping;
      bubble.vy *= this.config.physics.bounce.damping;
    }
  }

  cleanupBubbles() {
    this.bubbles = this.bubbles.filter(bubble => bubble.active);
    this.activeBubbles = this.bubbles.length;
  }

  updateCombo(deltaTime) {
    const now = performance.now();
    if (now - this.lastCorrectTime > this.config.gameplay.comboWindow) {
      this.combo = 0;
    }
  }

  onPointerDown(event) {
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);

    // Check for bubble collision
    const clickedBubble = this.findBubbleAtPoint(x, y);
    if (clickedBubble) {
      this.handleBubbleClick(clickedBubble);
    }
  }

  findBubbleAtPoint(x, y) {
    // Check bubbles in reverse order (top to bottom)
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      if (!bubble.active || bubble.isPopping) continue;

      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= bubble.size / 2) {
        return bubble;
      }
    }
    return null;
  }

  handleBubbleClick(bubble) {
    const isCorrect = bubble.letter === this.targetLetter;

    if (isCorrect) {
      this.handleCorrectAnswer(bubble);
    } else {
      this.handleWrongAnswer(bubble);
    }

    this.popBubble(bubble, isCorrect);
  }

  handleCorrectAnswer(bubble) {
    // Update streak and combo
    this.streak++;
    this.combo++;
    this.lastCorrectTime = performance.now();

    // Calculate score with multipliers
    const baseScore = this.config.education.progression.correctScorePoints;
    const streakMultiplier = Math.min(this.streak, this.config.education.progression.maxStreak) *
                            this.config.education.progression.streakMultiplier;
    const comboMultiplier = Math.min(this.combo, 3) * 0.5;

    const score = Math.floor(baseScore * (1 + streakMultiplier + comboMultiplier));

    // Play success sound
    this.soundManager.playSuccess();

    // Play phonics sound
    if (this.config.audio.phonics.playOnPop) {
      this.soundManager.playPhonicsSound(bubble.letter, this.config.audio.phonics.volume);
    }

    // Trigger visual effects
    this.createSuccessEffect(bubble);

    // Notify parent level
    if (this.onCorrectAnswer) {
      this.onCorrectAnswer(bubble.letter, score);
    }
  }

  handleWrongAnswer(bubble) {
    // Reset streak but keep combo for educational value
    this.streak = 0;

    // Play wrong sound
    this.soundManager.playWrong();

    // Trigger visual effects
    this.createWrongEffect(bubble);

    // Notify parent level
    if (this.onWrongAnswer) {
      this.onWrongAnswer(bubble.letter, this.config.education.progression.wrongScorePenalty);
    }
  }

  popBubble(bubble, isCorrect) {
    if (bubble.isPopping) return;

    bubble.isPopping = true;
    bubble.popAnimation = 0;

    // Play pop sound
    this.soundManager.playPop(1.0);

    // Create pop particles
    this.createPopParticles(bubble, isCorrect);

    // Remove from active bubbles immediately
    this.activeBubbles--;
  }

  createSuccessEffect(bubble) {
    // Create green glow particles
    const particleCount = this.config.physics.pop.particleCount;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 3;
      const duration = 800 + Math.random() * 400;

      this.particleManager.createParticle(
        bubble.x, bubble.y,
        this.config.visuals.colors.correctGlow,
        size, dx, dy, duration
      );
    }
  }

  createWrongEffect(bubble) {
    // Create red glow particles
    const particleCount = this.config.physics.pop.particleCount;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      const size = 1 + Math.random() * 2;
      const duration = 600 + Math.random() * 300;

      this.particleManager.createParticle(
        bubble.x, bubble.y,
        this.config.visuals.colors.wrongGlow,
        size, dx, dy, duration
      );
    }
  }

  createPopParticles(bubble, isCorrect) {
    const particleCount = this.config.physics.pop.particleCount;
    const color = isCorrect ? this.config.visuals.colors.correctGlow : this.config.visuals.colors.bubbleBase;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      const size = 1 + Math.random() * 2;
      const duration = 500 + Math.random() * 500;

      this.particleManager.createParticle(
        bubble.x, bubble.y,
        color,
        size, dx, dy, duration
      );
    }
  }

  deactivateBubble(bubble) {
    bubble.active = false;
    bubble.isPopping = false;
    bubble.popAnimation = 0;
    bubble.glowIntensity = 0;
    bubble.lifetime = 0;
    bubble.age = 0;
    bubble.bounceCount = 0;
  }

  draw(ctx) {
    this.bubbles.forEach(bubble => {
      if (!bubble.active) return;

      ctx.save();

      if (bubble.isPopping) {
        this.drawPoppingBubble(ctx, bubble);
      } else {
        this.drawBubble(ctx, bubble);
      }

      ctx.restore();
    });
  }

  drawBubble(ctx, bubble) {
    // Draw glow effect for target letters
    if (bubble.isTarget && this.config.visuals.effects.glow.enabled) {
      ctx.globalAlpha = bubble.glowIntensity * 0.5;
      ctx.fillStyle = this.config.visuals.colors.correctGlow;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size / 2 + 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw bubble shadow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = this.config.visuals.colors.bubbleShadow;
    ctx.beginPath();
    ctx.arc(bubble.x + 2, bubble.y + 2, bubble.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw main bubble
    ctx.globalAlpha = 0.8;
    const gradient = ctx.createRadialGradient(
      bubble.x - bubble.size / 4, bubble.y - bubble.size / 4, 0,
      bubble.x, bubble.y, bubble.size / 2
    );
    gradient.addColorStop(0, this.config.visuals.colors.bubbleHighlight);
    gradient.addColorStop(1, this.config.visuals.colors.bubbleBase);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw bubble highlight
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = this.config.visuals.colors.bubbleHighlight;
    ctx.beginPath();
    ctx.arc(bubble.x - bubble.size / 4, bubble.y - bubble.size / 4, bubble.size / 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw shimmer effect
    if (this.config.visuals.effects.shimmer.enabled) {
      ctx.globalAlpha = 0.4 + Math.sin(this.shimmerPhase + bubble.shimmerOffset) * 0.2;
      ctx.fillStyle = this.config.visuals.colors.bubbleHighlight;
      ctx.beginPath();
      ctx.arc(bubble.x + bubble.size / 6, bubble.y - bubble.size / 6, bubble.size / 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw letter
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = this.config.visuals.colors.letterColor;
    ctx.font = `bold ${bubble.size / 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bubble.letter, bubble.x, bubble.y);
  }

  drawPoppingBubble(ctx, bubble) {
    const progress = bubble.popAnimation;
    const scale = 1 + progress * 0.5;
    const alpha = 1 - progress;

    ctx.globalAlpha = alpha;
    ctx.scale(scale, scale);

    // Draw expanded bubble
    ctx.fillStyle = this.config.visuals.colors.bubbleBase;
    ctx.beginPath();
    ctx.arc(bubble.x / scale, bubble.y / scale, (bubble.size / 2) / scale, 0, Math.PI * 2);
    ctx.fill();

    // Draw letter
    ctx.fillStyle = this.config.visuals.colors.letterColor;
    ctx.font = `bold ${(bubble.size / 2) / scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bubble.letter, bubble.x / scale, bubble.y / scale);
  }

  reset() {
    // Deactivate all bubbles
    this.bubbles.forEach(bubble => this.deactivateBubble(bubble));
    this.bubbles = [];
    this.activeBubbles = 0;

    // Reset state
    this.streak = 0;
    this.combo = 0;
    this.lastCorrectTime = 0;
    this.lastSpawnTime = 0;
    this.time = 0;
    this.shimmerPhase = 0;
  }

  cleanup() {
    this.removeEventListeners();
    this.reset();
  }

  // Event handlers that can be set by parent level
  onCorrectAnswer = null;
  onWrongAnswer = null;
}

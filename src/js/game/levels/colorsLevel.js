import { BaseLevel } from './baseLevel.js';
import { GAME_CONFIG } from '../../config/constants.js';
import { LevelSettings } from '../../config/gameSettings.js';

export default class ColorsLevel extends BaseLevel {
  constructor(canvas, ctx, managers, helpers) {
    super(canvas, ctx, managers, helpers);
    this.memoryTime = GAME_CONFIG.COLORS_LEVEL_CONFIG.MEMORY_DISPLAY_TIME;
    this.dots = [];
    this.state = 'memory';
    this.targetDotsRemaining = 0;
    this.onPointerDown = this.onPointerDown.bind(this);
    this.lastCollisionTime = 0;
    this.correctStreak = 0;
    this.levelStartTime = 0;
    this.activeTimers = [];
  }

  async init() {
    // Choose first color in sequence
    const colorsList = GAME_CONFIG.COLORS.COLORS_LIST;
    this.targetColor = colorsList[0];
    const rgb = this.targetColor.join(',');
    
    // Mother Dot Phase: A large colored dot (radius 90-120px) appears at screen center
    this.mother = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: GAME_CONFIG.MOTHER_RADIUS[GAME_CONFIG.DEFAULT_MODE] || GAME_CONFIG.DOT_RADIUS,
      color: `rgb(${rgb})`,
      shimmer: 0,
      pulsePhase: 0
    };
    
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.levelStartTime = performance.now();
    
    // Memory Phase: Player clicks to remember the target color, shown for ~2 seconds
    setTimeout(() => this.disperse(), this.memoryTime);
  }

  disperse() {
    // Dispersion Phase: Mother dot explodes into 85 total dots
    this.state = 'playing';
    const totalDots = GAME_CONFIG.COLORS_LEVEL_CONFIG.TOTAL_DOTS;
    const targetDots = GAME_CONFIG.COLORS_LEVEL_CONFIG.TARGET_DOTS;
    this.targetDotsRemaining = targetDots;
    const distractorColors = GAME_CONFIG.COLORS.COLORS_LIST.filter(c => c !== this.targetColor);
    
    // 17 target color dots (correct targets)
    for (let i = 0; i < targetDots; i++) {
      this.addDot(this.targetColor, true);
    }
    
    // 68 distractor dots (4 other colors, ~17 each)
    for (let i = 0; i < totalDots - targetDots; i++) {
      const color = distractorColors[Math.floor(Math.random() * distractorColors.length)];
      this.addDot(color, false);
    }
  }

  addDot(colArray, isTarget) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * (GAME_CONFIG.DOT_SPEED_RANGE[1] - GAME_CONFIG.DOT_SPEED_RANGE[0]) + GAME_CONFIG.DOT_SPEED_RANGE[0];
    const dot = {
      x: this.mother.x,
      y: this.mother.y,
      radius: GAME_CONFIG.DOT_RADIUS, // 48px radius
      color: `rgb(${colArray.join(',')})`,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      isTarget: isTarget,
      shimmer: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      trail: []
    };
    this.dots.push(dot);
  }

  update(deltaTime) {
    if (this.state !== 'playing') return;
    
    const dt = deltaTime / 16;
    this.dots.forEach(dot => {
      // Update position
      dot.x += dot.dx * dt;
      dot.y += dot.dy * dt;
      
      // Update visual effects
      dot.shimmer += 0.1 * dt;
      dot.pulsePhase += 0.05 * dt;
      
      // Add trail effect for target dots
      if (dot.isTarget) {
        dot.trail.push({ x: dot.x, y: dot.y, alpha: 1.0 });
        if (dot.trail.length > 10) {
          dot.trail.shift();
        }
        
        // Fade trail
        dot.trail.forEach((point, index) => {
          point.alpha = (index + 1) / dot.trail.length * 0.5;
        });
      }
      
      // Bounce on edges with sound
      if (dot.x - dot.radius < 0 || dot.x + dot.radius > this.canvas.width) {
        dot.dx *= -1;
        if (this.managers.sound && Math.random() < 0.1) {
          this.managers.sound.playPop(0.3);
        }
      }
      if (dot.y - dot.radius < 0 || dot.y + dot.radius > this.canvas.height) {
        dot.dy *= -1;
        if (this.managers.sound && Math.random() < 0.1) {
          this.managers.sound.playPop(0.3);
        }
      }
    });
  }

  render() {
    if (this.state === 'memory') {
      // Draw mother dot with enhanced effects
      this.drawEnhancedDot(this.mother, true, true);
      
      // Draw instruction text
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Remember this color!', this.canvas.width / 2, 50);
      
    } else if (this.state === 'playing') {
      // Draw moving dots with enhanced visuals
      this.dots.forEach(dot => {
        this.drawEnhancedDot(dot, dot.isTarget);
      });
      
      // Draw UI
      this.drawUI();
    }
  }

  drawEnhancedDot(dot, isTarget = false, isMemory = false) {
    this.ctx.save();
    
    // Draw trail for target dots
    if (isTarget && dot.trail) {
      dot.trail.forEach(point => {
        this.ctx.globalAlpha = point.alpha;
        this.ctx.fillStyle = dot.color;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, dot.radius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }
    
    // Draw main dot with effects
    this.ctx.globalAlpha = 1.0;
    
    // Glow effect for target dots
    if (isTarget || isMemory) {
      const glowIntensity = 0.5 + Math.sin(dot.pulsePhase || 0) * 0.3;
      this.ctx.shadowColor = dot.color;
      this.ctx.shadowBlur = 20 * glowIntensity;
    }
    
    // Shimmer effect
    const shimmerOffset = Math.sin(dot.shimmer || 0) * 5;
    
    this.ctx.fillStyle = dot.color;
    this.ctx.beginPath();
    this.ctx.arc(dot.x + shimmerOffset, dot.y, dot.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Highlight for target dots
    if (isTarget || isMemory) {
      this.ctx.globalAlpha = 0.8;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(dot.x + shimmerOffset - dot.radius * 0.3, dot.y - dot.radius * 0.3, dot.radius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  drawUI() {
    // Draw progress
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Target Dots Remaining: ${this.targetDotsRemaining}`, 20, 30);
    
    // Draw streak if active
    if (this.correctStreak > 0) {
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillText(`Streak: ${this.correctStreak}`, 20, 55);
    }
    
    // Draw timer
    const elapsed = performance.now() - this.levelStartTime;
    const seconds = Math.floor(elapsed / 1000);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Time: ${seconds}s`, this.canvas.width - 20, 30);
  }

  onPointerDown(event) {
    if (this.state !== 'playing') return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
    
    // Check for dot collision
    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      const dx = x - dot.x;
      const dy = y - dot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= dot.radius) {
        // Hit a dot
        if (dot.isTarget) {
          // Correct hit
          this.handleCorrectHit(dot, i);
        } else {
          // Wrong hit
          this.handleWrongHit(dot, i);
        }
        break;
      }
    }
  }

  handleCorrectHit(dot, index) {
    this.correctStreak++;
    this.lastCorrectTime = performance.now();
    
    // Enhanced explosion effect
    this.helpers.createExplosion(dot.x, dot.y, dot.color, 1.5);
    
    // Sound feedback
    if (this.managers.sound) {
      this.managers.sound.playSuccess();
      
      // Additional pop sound
      const soundTimer = setTimeout(() => {
        this.managers.sound.playPop(1.2);
      }, 100);
      this.activeTimers.push(soundTimer);
    }
    
    // Score calculation with streak bonus
    const baseScore = 100;
    const streakBonus = Math.min(this.correctStreak, 5) * 20;
    const totalScore = baseScore + streakBonus;
    
    this.updateScore(totalScore);
    this.targetDotsRemaining--;
    this.dots.splice(index, 1);
    
    // Sparkle effect for high streaks
    if (this.correctStreak >= 3) {
      this.managers.particleManager.createSparkle(dot.x, dot.y, '#ffd700', 1.5);
    }
    
    // Check if level complete
    if (this.targetDotsRemaining <= 0) {
      this.completeLevel();
    }
  }

  handleWrongHit(dot, index) {
    this.correctStreak = 0;
    
    // Glass shatter effect
    this.helpers.applyExplosionEffect(dot.x, dot.y, 30, 1);
    
    // Sound feedback
    if (this.managers.sound) {
      this.managers.sound.playWrong();
    }
    
    // Score penalty
    this.updateScore(-50);
    this.dots.splice(index, 1);
    
    // Screen shake effect
    if (this.managers.centerPiece) {
      // Trigger screen shake (if available)
    }
  }

  completeLevel() {
    // Final celebration
    if (this.managers.sound) {
      this.managers.sound.playSequence([
        { type: 'sound', name: 'success', volume: 1.0 },
        { type: 'sound', name: 'pop', volume: 0.8, pitch: 1.2 }
      ], 300);
    }
    
    // Fireworks effect
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    for (let i = 0; i < 3; i++) {
      const fireworkTimer = setTimeout(() => {
        this.managers.particleManager.createExplosion(
          centerX + (Math.random() - 0.5) * 200,
          centerY + (Math.random() - 0.5) * 200,
          this.mother.color,
          2.0,
          30
        );
      }, i * 500);
      this.activeTimers.push(fireworkTimer);
    }
    
    // Calculate bonus score
    const timeBonus = Math.max(0, 10000 - (performance.now() - this.levelStartTime)) / 100;
    const accuracyBonus = this.correctStreak * 50;
    
    this.updateScore(Math.floor(timeBonus + accuracyBonus));
    
    // End level after celebration
    const endTimer = setTimeout(() => {
      this.end();
    }, 3000);
    this.activeTimers.push(endTimer);
  }

  cleanup() {
    // Clear all active timers to prevent memory leaks
    this.activeTimers.forEach(timer => clearTimeout(timer));
    this.activeTimers = [];
    
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.dots = [];
  }
}

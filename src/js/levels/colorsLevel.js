import { BaseLevel } from './baseLevel.js';
import { GAME_CONFIG } from '../config/constants.js';
import { LevelSettings } from '../config/gameSettings.js';

export default class ColorsLevel extends BaseLevel {
  constructor(canvas, ctx, managers, helpers) {
    super(canvas, ctx, managers, helpers);
    this.memoryTime = LevelSettings.colors.memoryTime;
    this.dots = [];
    this.state = 'memory';
    this.targetDotsRemaining = 0;
    this.onPointerDown = this.onPointerDown.bind(this);
  }

  async init() {
    // Choose first color in sequence
    const colorsList = GAME_CONFIG.COLORS.COLORS_LIST;
    this.targetColor = colorsList[0];
    const rgb = this.targetColor.join(',');
    this.mother = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: managers.displaySettings.motherRadius,
      color: `rgb(${rgb})`
    };
    // Show memory dot then disperse
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    setTimeout(() => this.disperse(), this.memoryTime);
  }

  disperse() {
    this.state = 'playing';
    const cfg = LevelSettings.colors;
    const total = cfg.totalDots;
    const targetCount = cfg.targetDots;
    this.targetDotsRemaining = targetCount;
    const others = GAME_CONFIG.COLORS.COLORS_LIST.filter(c => c !== this.targetColor);
    // Generate target dots
    for (let i = 0; i < targetCount; i++) {
      this.addDot(this.targetColor, true);
    }
    // Generate distractor dots
    for (let i = 0; i < total - targetCount; i++) {
      const color = others[Math.floor(Math.random() * others.length)];
      this.addDot(color, false);
    }
  }

  addDot(colArray, isTarget) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * (GAME_CONFIG.DOT_SPEED_RANGE[1] - GAME_CONFIG.DOT_SPEED_RANGE[0]) + GAME_CONFIG.DOT_SPEED_RANGE[0];
    this.dots.push({
      x: this.mother.x,
      y: this.mother.y,
      radius: GAME_CONFIG.DOT_RADIUS,
      color: `rgb(${colArray.join(',')})`,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      isTarget
    });
  }

  update(deltaTime) {
    if (this.state !== 'playing') return;
    const dt = deltaTime / 16;
    this.dots.forEach(dot => {
      dot.x += dot.dx * dt;
      dot.y += dot.dy * dt;
      // Bounce on edges
      if (dot.x - dot.radius < 0 || dot.x + dot.radius > this.canvas.width) dot.dx *= -1;
      if (dot.y - dot.radius < 0 || dot.y + dot.radius > this.canvas.height) dot.dy *= -1;
    });
  }

  render() {
    if (this.state === 'memory') {
      // Draw mother dot
      this.ctx.fillStyle = this.mother.color;
      this.ctx.beginPath();
      this.ctx.arc(this.mother.x, this.mother.y, this.mother.radius, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (this.state === 'playing') {
      // Draw moving dots
      this.dots.forEach(dot => {
        this.ctx.fillStyle = dot.color;
        this.ctx.beginPath();
        this.ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }
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
          this.helpers.createExplosion(dot.x, dot.y, dot.color, 1);
          this.updateScore(100);
          this.targetDotsRemaining--;
          this.dots.splice(i, 1);
          
          // Check if level complete
          if (this.targetDotsRemaining <= 0) {
            this.end();
          }
        } else {
          // Wrong hit
          this.helpers.applyExplosionEffect(dot.x, dot.y, 30, 1);
          this.updateScore(-50);
          this.dots.splice(i, 1);
        }
        break;
      }
    }
  }

  cleanup() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.dots = [];
  }
}

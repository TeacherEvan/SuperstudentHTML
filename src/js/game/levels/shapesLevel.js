import { GAME_CONFIG } from '../../config/constants.js';
import { BaseLevel } from './baseLevel.js';

export default class ShapesLevel extends BaseLevel {
  constructor(canvas, ctx, managers, helpers) {
    super(canvas, ctx, managers, helpers);
    this.sequence = GAME_CONFIG.SEQUENCES.shapes;
    this.objects = [];
    this.currentIndex = 0;
    this.groupCount = 0;
    this.spawnTimer = 0;
    this.spawnInterval = GAME_CONFIG.LETTER_SPAWN_INTERVAL;
    this.onPointerDown = this.onPointerDown.bind(this);
    this.lastSpawnTime = 0;
  }

  async init() {
    this.currentTarget = this.sequence[this.currentIndex];
    this.objects = [];
    this.groupCount = 0;
    this.spawnTimer = 0;
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.running = true;

    // Play level start sound
    if (this.managers.sound) {
      this.managers.sound.playSuccess();
    }
  }

  update(deltaTime) {
    if (!this.running) return;

    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObject();
    }

    const dt = deltaTime / 16;
    this.objects.forEach((obj) => {
      obj.x += obj.dx * dt;
      obj.y += obj.dy * dt;

      // Add visual effects
      if (obj.pulsePhase === undefined) obj.pulsePhase = Math.random() * Math.PI * 2;
      obj.pulsePhase += 0.1 * dt;
    });
    this.objects = this.objects.filter(
      (obj) =>
        obj.x > -50 &&
        obj.x < this.canvas.width + 50 &&
        obj.y > -50 &&
        obj.y < this.canvas.height + 50
    );
  }

  render() {
    // Draw center target shape - Sequential shape targeting through Circle→Square→Triangle→Rectangle→Pentagon
    const size = GAME_CONFIG.TEXT_LEVEL_CONFIG.CENTER_FONT_SIZE;
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.drawShape(this.currentTarget, size);
    this.ctx.restore();

    // Draw falling shapes - Shape rendering with geometric drawing
    this.objects.forEach((obj) => {
      this.ctx.save();
      this.ctx.translate(obj.x, obj.y);
      this.ctx.fillStyle = obj.color;
      this.drawShape(
        obj.shape,
        GAME_CONFIG.TEXT_LEVEL_CONFIG.FALLING_FONT_SIZE
      );
      this.ctx.restore();
    });

    // Draw UI elements
    this.drawUI();
  }

  spawnObject() {
    // Objects spawn from screen edges with random trajectories
    const buffer = GAME_CONFIG.TEXT_LEVEL_CONFIG.SPAWN_EDGE_BUFFER;
    const side = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    const speed = Math.random() * 2 + 1;

    switch (side) {
    case 0: // top
      x = Math.random() * this.canvas.width;
      y = -buffer;
      dx = (Math.random() - 0.5) * 2;
      dy = speed;
      break;
    case 1: // bottom
      x = Math.random() * this.canvas.width;
      y = this.canvas.height + buffer;
      dx = (Math.random() - 0.5) * 2;
      dy = -speed;
      break;
    case 2: // left
      x = -buffer;
      y = Math.random() * this.canvas.height;
      dx = speed;
      dy = (Math.random() - 0.5) * 2;
      break;
    default: // right
      x = this.canvas.width + buffer;
      y = Math.random() * this.canvas.height;
      dx = -speed;
      dy = (Math.random() - 0.5) * 2;
    }

    // Spawn random shapes from sequence
    const shape =
      this.sequence[Math.floor(Math.random() * this.sequence.length)];
    const colorArr =
      GAME_CONFIG.COLORS.COLORS_LIST[
        Math.floor(Math.random() * GAME_CONFIG.COLORS.COLORS_LIST.length)
      ];
    const color = `rgb(${colorArr.join(',')})`;

    this.objects.push({ shape, x, y, dx, dy, color });
  }

  onPointerDown(event) {
    if (!this.running) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);

    // Check for collisions with falling shapes
    this.objects = this.objects.filter((obj) => {
      const size = GAME_CONFIG.TEXT_LEVEL_CONFIG.FALLING_FONT_SIZE;
      const dx = x - obj.x;
      const dy = y - obj.y;

      if (dx * dx + dy * dy <= radius * radius) {
        if (obj.shape === this.currentTarget) {
          // Correct target hit - Enhanced visual effects for shape destruction
          this.helpers.createExplosion(obj.x, obj.y, obj.color, 1);
          this.updateScore(100);
          this.groupCount++;

          // After destroying 5 targets, advance to next shape
          if (this.groupCount >= GAME_CONFIG.GROUP_SIZE) {
            this.advanceToNextTarget();
          }
        } else {
          // Wrong target - screen shake + glass shatter effect
          if (this.managers.glassShatter) {
            this.managers.glassShatter.triggerShatter(obj.x, obj.y, 0.5);
          }
          this.helpers.applyScreenShake(10, 1);
          this.updateScore(-25);
        }
        return false; // Remove the hit object
      }
      return true; // Keep the object
    });
  }

  advanceToNextTarget() {
    this.currentIndex++;

    if (this.currentIndex >= this.sequence.length) {
      this.end();
      return;
    }

    this.currentTarget = this.sequence[this.currentIndex];
    this.groupCount = 0;
  }

  completeLevel() {
    // Play completion sound
    if (this.managers.sound) {
      this.managers.sound.playCompletion();
    }

    // Create celebration effect
    this.helpers.createExplosion(this.canvas.width / 2, this.canvas.height / 2, '#FFD700', 3);

    this.end();
  }

  drawShape(shape, size) {
    const half = size / 2;
    this.ctx.beginPath();

    switch (shape) {
    case 'Circle':
      this.ctx.arc(0, 0, half, 0, Math.PI * 2);
      break;
    case 'Square':
      this.ctx.rect(-half, -half, size, size);
      break;
    case 'Triangle':
      this.ctx.moveTo(0, -half);
      this.ctx.lineTo(half, half);
      this.ctx.lineTo(-half, half);
      this.ctx.closePath();
      break;
    case 'Rectangle':
      this.ctx.rect(-half, -half * 0.6, size, size * 0.6);
      break;
    case 'Pentagon':
      for (let i = 0; i < 5; i++) {
        const angle = ((Math.PI * 2) / 5) * i - Math.PI / 2;
        const px = Math.cos(angle) * half;
        const py = Math.sin(angle) * half;
        if (i === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
      break;
    default:
      this.ctx.arc(0, 0, half, 0, Math.PI * 2);
    }
    this.ctx.fill();
  }

  drawUI() {
    // Draw progress indicator
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Shape: ${this.currentTarget}`, 20, 40);
    this.ctx.fillText(`Progress: ${this.currentIndex + 1}/${this.sequence.length}`, 20, 70);
    this.ctx.fillText(`Targets: ${this.groupCount}/${LevelSettings.text.advanceCount}`, 20, 100);
    this.ctx.restore();
  }

  cleanup() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.objects = [];
  }
}

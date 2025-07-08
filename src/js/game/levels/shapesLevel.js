import { BaseLevel } from './baseLevel.js';
import { GAME_CONFIG } from '../../config/constants.js';
import { LevelSettings } from '../../config/gameSettings.js';

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
  }

  async init() {
    this.currentTarget = this.sequence[this.currentIndex];
    this.objects = [];
    this.groupCount = 0;
    this.spawnTimer = 0;
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.running = true;
  }

  update(deltaTime) {
    if (!this.running) return;
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObject();
    }
    const dt = deltaTime / 16;
    this.objects.forEach(obj => {
      obj.x += obj.dx * dt;
      obj.y += obj.dy * dt;
    });
    this.objects = this.objects.filter(obj => obj.x > -50 && obj.x < this.canvas.width + 50 && obj.y > -50 && obj.y < this.canvas.height + 50);
  }

  render() {
    // Draw center target shape
    const size = LevelSettings.text.centerFontSize;
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.drawShape(this.currentTarget, size);
    this.ctx.restore();
    // Draw falling shapes
    this.objects.forEach(obj => {
      this.ctx.save();
      this.ctx.translate(obj.x, obj.y);
      this.ctx.fillStyle = obj.color;
      this.drawShape(obj.shape, LevelSettings.text.fallingFontSize);
      this.ctx.restore();
    });
  }

  spawnObject() {
    const buffer = LevelSettings.text.spawnEdgeBuffer;
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

    // Randomly choose what shape to spawn
    const shapes = ['Circle', 'Square', 'Triangle', 'Rectangle', 'Pentagon'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const colorArr = GAME_CONFIG.COLORS.COLORS_LIST[Math.floor(Math.random() * GAME_CONFIG.COLORS.COLORS_LIST.length)];
    const color = `rgb(${colorArr.join(',')})`;
    
    this.objects.push({ shape, x, y, dx, dy, color });
  }

  onPointerDown(event) {
    if (!this.running) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
    let hit = false;
    this.objects = this.objects.filter(obj => {
      const size = LevelSettings.text.fallingFontSize;
      const dx = x - obj.x;
      const dy = y - obj.y;
      const radius = size / 2;
      if (dx * dx + dy * dy <= radius * radius) {
        if (obj.shape === this.currentTarget) {
          this.helpers.createExplosion(obj.x, obj.y, obj.color, 1);
          this.managers.hud.updateScore(10);
          this.groupCount++;
          hit = true;
        } else {
          this.helpers.applyExplosionEffect(obj.x, obj.y, radius, 1);
          this.managers.hud.updateScore(-5);
        }
        return false;
      }
      return true;
    });
    if (hit && this.groupCount >= LevelSettings.text.advanceCount) {
      this.currentIndex++;
      if (this.currentIndex >= this.sequence.length) {
        this.end();
      } else {
        this.currentTarget = this.sequence[this.currentIndex];
        this.groupCount = 0;
      }
    }
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

  cleanup() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.objects = [];
  }
}

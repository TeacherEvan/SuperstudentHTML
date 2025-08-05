import { BaseLevel } from './baseLevel.js';
import { GAME_CONFIG } from '../../config/constants.js';
import { LevelSettings } from '../../config/gameSettings.js';

export default class NumbersLevel extends BaseLevel {
  constructor(canvas, ctx, managers, helpers) {
    super(canvas, ctx, managers, helpers);
    this.sequence = GAME_CONFIG.SEQUENCES.numbers;
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
    this.lastSpawnTime = 0;
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
    this.objects.forEach(obj => {
      obj.x += obj.dx * dt;
      obj.y += obj.dy * dt;

      // Add visual effects
      if (obj.pulsePhase === undefined) obj.pulsePhase = Math.random() * Math.PI * 2;
      obj.pulsePhase += 0.1 * dt;
    });

    this.objects = this.objects.filter(obj =>
      obj.x > -100 && obj.x < this.canvas.width + 100 &&
      obj.y > -100 && obj.y < this.canvas.height + 100
    );
  }

  render() {
    // Draw center target with enhanced styling
    this.ctx.save();
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = `bold ${LevelSettings.text.centerFontSize}px Arial`;

    // Add glow effect for center target
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText(this.currentTarget, this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.restore();

    // Draw falling objects with enhanced effects
    this.objects.forEach(obj => {
      this.ctx.save();
      this.ctx.fillStyle = obj.color;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.font = `${LevelSettings.text.fallingFontSize}px Arial`;

      // Add pulse effect for target numbers
      if (obj.char === this.currentTarget) {
        const pulse = 0.8 + Math.sin(obj.pulsePhase || 0) * 0.2;
        this.ctx.globalAlpha = pulse;
        this.ctx.shadowColor = obj.color;
        this.ctx.shadowBlur = 10;
      }

      this.ctx.fillText(obj.char, obj.x, obj.y);
      this.ctx.restore();
    });

    // Draw UI elements
    this.drawUI();
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
    case 3: // right
      x = this.canvas.width + buffer;
      y = Math.random() * this.canvas.height;
      dx = -speed;
      dy = (Math.random() - 0.5) * 2;
      break;
    }

    // Spawn target number more frequently than others
    const isTarget = Math.random() < 0.4;
    const char = isTarget ? this.currentTarget :
      this.sequence[Math.floor(Math.random() * this.sequence.length)];

    const colorArr = GAME_CONFIG.COLORS.COLORS_LIST[Math.floor(Math.random() * GAME_CONFIG.COLORS.COLORS_LIST.length)];
    const color = `rgb(${colorArr.join(',')})`;

    this.objects.push({
      char,
      x,
      y,
      dx,
      dy,
      color,
      pulsePhase: Math.random() * Math.PI * 2
    });
  }

  onPointerDown(event) {
    if (!this.running) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);

    let hit = false;
    this.objects = this.objects.filter(obj => {
      const fontSize = LevelSettings.text.fallingFontSize;
      const width = fontSize * 0.8; // Numbers are wider than letters
      const height = fontSize;

      if (x > obj.x - width / 2 && x < obj.x + width / 2 &&
          y > obj.y - height / 2 && y < obj.y + height / 2) {

        if (obj.char === this.currentTarget) {
          // Correct hit
          this.helpers.createExplosion(obj.x, obj.y, obj.color, 1);
          this.updateScore(100);
          this.groupCount++;
          hit = true;

          // Play success sound
          if (this.managers.sound) {
            this.managers.sound.playSuccess();
          }
        } else {
          // Wrong hit
          this.helpers.applyExplosionEffect(obj.x, obj.y, 20, 1);
          this.updateScore(-25);

          // Play error sound
          if (this.managers.sound) {
            this.managers.sound.playError();
          }
        }
        return false;
      }
      return true;
    });

    // Advance to next number or complete level
    if (hit && this.groupCount >= LevelSettings.text.advanceCount) {
      this.currentIndex++;
      if (this.currentIndex >= this.sequence.length) {
        this.completeLevel();
      } else {
        this.currentTarget = this.sequence[this.currentIndex];
        this.groupCount = 0;

        // Play advancement sound
        if (this.managers.sound) {
          this.managers.sound.playAdvance();
        }
      }
    }
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

  drawUI() {
    // Draw progress indicator
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Number: ${this.currentTarget}`, 20, 40);
    this.ctx.fillText(`Progress: ${this.currentIndex + 1}/${this.sequence.length}`, 20, 70);
    this.ctx.fillText(`Targets: ${this.groupCount}/${LevelSettings.text.advanceCount}`, 20, 100);
    this.ctx.restore();
  }

  cleanup() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.objects = [];
  }
}

import { GAME_CONFIG } from "../../config/constants.js";
import { BaseLevel } from "./baseLevel.js";

export default class ClCaseLevel extends BaseLevel {
  constructor(canvas, ctx, managers, helpers) {
    super(canvas, ctx, managers, helpers);
    this.sequence = GAME_CONFIG.SEQUENCES.clcase;
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
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.running = true;
  }

  update(deltaTime) {
    if (!this.running) return;

    // Spawn objects - spawn interval is 60 frames as per MD spec
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObject();
    }

    // Move objects with physics
    const dt = deltaTime / 16;
    this.objects.forEach((obj) => {
      obj.x += obj.dx * dt;
      obj.y += obj.dy * dt;
    });

    // Remove off-screen objects (basic culling)
    this.objects = this.objects.filter(
      (obj) =>
        obj.x > -50 &&
        obj.x < this.canvas.width + 50 &&
        obj.y > -50 &&
        obj.y < this.canvas.height + 50
    );
  }

  render() {
    // Draw center target - Large text (900px font) shows current target at screen center
    this.ctx.save();
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.font = `${GAME_CONFIG.TEXT_LEVEL_CONFIG.CENTER_FONT_SIZE}px Arial`;
    this.ctx.fillText(
      this.currentTarget,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
    this.ctx.restore();

    // Draw falling objects - 240px font size, random colors, physics movement
    this.objects.forEach((obj) => {
      this.ctx.save();
      this.ctx.fillStyle = obj.color;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.font = `${GAME_CONFIG.TEXT_LEVEL_CONFIG.FALLING_FONT_SIZE}px Arial`;
      this.ctx.fillText(obj.char, obj.x, obj.y);
      this.ctx.restore();
    });
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
      case 3: // right
        x = this.canvas.width + buffer;
        y = Math.random() * this.canvas.height;
        dx = -speed;
        dy = (Math.random() - 0.5) * 2;
        break;
    }

    // Spawn random lowercase letters from sequence
    const char =
      this.sequence[Math.floor(Math.random() * this.sequence.length)];
    const colorArr =
      GAME_CONFIG.COLORS.COLORS_LIST[
        Math.floor(Math.random() * GAME_CONFIG.COLORS.COLORS_LIST.length)
      ];
    const color = `rgb(${colorArr.join(",")})`;

    this.objects.push({ char, x, y, dx, dy, color });
  }

  onPointerDown(event) {
    if (!this.running) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);

    // Check for collisions with falling objects
    this.objects = this.objects.filter((obj) => {
      const width = GAME_CONFIG.TEXT_LEVEL_CONFIG.FALLING_FONT_SIZE;
      const height = GAME_CONFIG.TEXT_LEVEL_CONFIG.FALLING_FONT_SIZE;
      if (
        x > obj.x - width / 2 &&
        x < obj.x + width / 2 &&
        y > obj.y - height / 2 &&
        y < obj.y + height / 2
      ) {
        if (obj.char === this.currentTarget) {
          // Correct target hit
          this.helpers.createExplosion(obj.x, obj.y, obj.color, 1);
          this.updateScore(100);
          this.groupCount++;

          // After destroying 5 targets, advance to next letter
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

  cleanup() {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.objects = [];
  }
}

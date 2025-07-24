import { eventTracker } from "../../utils/eventTracker.js";

export default class HudManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.abilities = {
      flamethrower: { cooldown: 0, maxCooldown: 5000 },
      explosion: { cooldown: 0, maxCooldown: 3000 },
    };
    this.fontSize = Math.min(canvas.width, canvas.height) * 0.03;
  }

  updateScore(points) {
    const previousScore = this.score;
    this.score += points;
    eventTracker.trackState("score", this.score, previousScore);
    eventTracker.trackEvent("game", "score_change", {
      points,
      totalScore: this.score,
    });
  }

  updateLevel(newLevel) {
    const previousLevel = this.level;
    this.level = newLevel;
    eventTracker.trackState("level", newLevel, previousLevel);
  }

  updateLives(newLives) {
    const previousLives = this.lives;
    this.lives = newLives;
    eventTracker.trackState("lives", newLives, previousLives);
    if (newLives < previousLives) {
      eventTracker.trackEvent("game", "life_lost", { remaining: newLives });
    }
  }

  updateAbilityCooldown(abilityName, cooldown) {
    if (this.abilities[abilityName]) {
      this.abilities[abilityName].cooldown = Math.max(0, cooldown);
    }
  }

  isAbilityReady(abilityName) {
    return this.abilities[abilityName]?.cooldown === 0;
  }

  draw() {
    this.ctx.save();
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = `${this.fontSize}px Arial`;
    this.ctx.textAlign = "left";

    // Score
    this.ctx.fillText(`Score: ${this.score}`, 20, 40);

    // Level
    this.ctx.fillText(`Level: ${this.level}`, 20, 80);

    // Lives
    this.ctx.fillText(`Lives: ${this.lives}`, 20, 120);

    // Ability cooldowns
    let yOffset = 160;
    Object.entries(this.abilities).forEach(([name, ability]) => {
      const cooldownPercent = ability.cooldown / ability.maxCooldown;
      const color = cooldownPercent > 0 ? "#FF6B6B" : "#4ECDC4";

      this.ctx.fillStyle = color;
      this.ctx.fillText(
        `${name}: ${
          cooldownPercent > 0
            ? (ability.cooldown / 1000).toFixed(1) + "s"
            : "Ready"
        }`,
        20,
        yOffset
      );
      yOffset += 40;
    });

    this.ctx.restore();
  }

  update(deltaTime) {
    // Update ability cooldowns
    Object.values(this.abilities).forEach((ability) => {
      if (ability.cooldown > 0) {
        ability.cooldown = Math.max(0, ability.cooldown - deltaTime);
      }
    });
  }

  resize(canvas) {
    this.canvas = canvas;
    this.fontSize = Math.min(canvas.width, canvas.height) * 0.03;
  }
}

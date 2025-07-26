// Level selection menu UI
import { ProgressManager } from "../../game/managers/progressManager.js";

export class LevelMenu {
  constructor(containerId, onSelect) {
    this.container = document.getElementById(containerId);
    this.onSelect = onSelect;
    this.progressManager = new ProgressManager();

    // Define available levels with descriptions
    this.levels = [
      {
        name: "colors",
        label: "Colors Level",
        description: "Match the target color from memory",
        difficulty: "★☆☆",
      },
      {
        name: "shapes",
        label: "Shapes Level",
        description: "Target shapes in sequence",
        difficulty: "★★☆",
      },
      {
        name: "alphabet",
        label: "Alphabet Level",
        description: "A through Z in order",
        difficulty: "★★☆",
      },
      {
        name: "numbers",
        label: "Numbers Level",
        description: "1 through 10 in order",
        difficulty: "★★☆",
      },
      {
        name: "clcase",
        label: "Case Level",
        description: "a through z in order",
        difficulty: "★★★",
      },
      {
        name: "phonics",
        label: "Phonics Bubbles",
        description: "Pop bubbles and learn letter sounds! 🫧",
        difficulty: "★☆☆",
      },
    ];
  }

  show() {
    const progress = this.progressManager.getProgress();

    // Build menu markup - all levels always available
    const html = [
      `<div class="level-menu">`,
      `<h2>Select Level</h2>`,
      `<div class="level-grid">`,
      this.levels
        .map((level) => {
          return `
          <div class="level-card unlocked" data-level="${level.name}">
            <div class="level-status">●</div>
            <h3>${level.label}</h3>
            <p class="level-description">${level.description}</p>
            <p class="level-difficulty">Difficulty: ${level.difficulty}</p>
          </div>
        `;
        })
        .join(""),
      `</div>`,
      `<div class="menu-actions">`,
      `<button class="back-button">Back</button>`,
      `</div>`,
      `</div>`,
    ].join("");

    this.container.innerHTML = html;
    this.container.style.display = "flex";

    // Attach event listeners
    this.levels.forEach((level) => {
      const card = this.container.querySelector(`[data-level="${level.name}"]`);
      if (card) {
        card.addEventListener("click", () => this.selectLevel(level.name));
        card.style.cursor = "pointer";
      }
    });

    const backBtn = this.container.querySelector(".back-button");
    if (backBtn) backBtn.addEventListener("click", () => this.back());
  }

  selectLevel(name) {
    if (typeof this.onSelect === "function") {
      this.container.style.display = "none";
      this.onSelect(name);
    }
  }

  back() {
    // Reload page or reset to welcome screen
    window.location.reload();
  }
}

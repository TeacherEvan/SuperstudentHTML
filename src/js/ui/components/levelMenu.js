import { ProgressManager } from '../../game/managers/progressManager.js';

// Level selection menu UI
export class LevelMenu {
  constructor(containerId, onSelect) {
    this.container = document.getElementById(containerId);
    this.onSelect = onSelect;
    this.progressManager = new ProgressManager();

    // Define available levels with descriptions
    this.levels = [
      {
        name: 'colors',
        label: 'Colors Level',
        description: 'Match the target color from memory',
        difficulty: '★☆☆'
      },
      {
        name: 'shapes',
        label: 'Shapes Level',
        description: 'Target shapes in sequence',
        difficulty: '★★☆'
      },
      {
        name: 'alphabet',
        label: 'Alphabet Level',
        description: 'A through Z in order',
        difficulty: '★★☆'
      },
      {
        name: 'numbers',
        label: 'Numbers Level',
        description: '1 through 10 in order',
        difficulty: '★★☆'
      },
      {
        name: 'clcase',
        label: 'Case Level',
        description: 'a through z in order',
        difficulty: '★★★'
      },
      {
        name: 'phonics',
        label: 'Phonics Bubbles',
        description: 'Pop bubbles and learn letter sounds! 🫧',
        difficulty: '★☆☆'
      }
    ];
  }

  show() {
    const progress = this.progressManager.getProgress();

    // Build menu markup with progress indicators
    const html = [
      '<div class="level-menu">',
      '<h2>Select Level</h2>',
      '<div class="progress-summary">',
      `<p>Completion: ${this.progressManager.getCompletionPercentage()}%</p>`,
      `<p>Total Score: ${progress.totalScore}</p>`,
      '</div>',
      '<div class="level-grid">',
      this.levels.map(level => {
        const isUnlocked = this.progressManager.isLevelUnlocked(level.name);
        const isCompleted = this.progressManager.isLevelCompleted(level.name);
        const score = this.progressManager.getLevelScore(level.name);

        const statusClass = isCompleted ? 'completed' : (isUnlocked ? 'unlocked' : 'locked');
        const statusIcon = isCompleted ? '✓' : (isUnlocked ? '●' : '🔒');

        return `
          <div class="level-card ${statusClass}" ${isUnlocked ? `data-level="${level.name}"` : ''}>
            <div class="level-status">${statusIcon}</div>
            <h3>${level.label}</h3>
            <p class="level-description">${level.description}</p>
            <p class="level-difficulty">Difficulty: ${level.difficulty}</p>
            ${isCompleted ? `<p class="level-score">Best: ${score}</p>` : ''}
            ${!isUnlocked ? '<p class="level-locked">Complete previous level to unlock</p>' : ''}
          </div>
        `;
      }).join(''),
      '</div>',
      '<div class="menu-actions">',
      '<button class="back-button">Back</button>',
      '<button class="reset-button">Reset Progress</button>',
      '</div>',
      '</div>'
    ].join('');

    this.container.innerHTML = html;
    this.container.style.display = 'flex';

    // Attach event listeners
    this.levels.forEach(level => {
      const card = this.container.querySelector(`[data-level="${level.name}"]`);
      if (card) {
        card.addEventListener('click', () => this.selectLevel(level.name));
        card.style.cursor = 'pointer';
      }
    });

    const backBtn = this.container.querySelector('.back-button');
    if (backBtn) backBtn.addEventListener('click', () => this.back());

    const resetBtn = this.container.querySelector('.reset-button');
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetProgress());
  }

  selectLevel(name) {
    if (this.progressManager.isLevelUnlocked(name) && typeof this.onSelect === 'function') {
      this.container.style.display = 'none';
      this.onSelect(name);
    }
  }

  resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      this.progressManager.resetProgress();
      this.show(); // Refresh the menu
    }
  }

  back() {
    // Reload page or reset to welcome screen
    window.location.reload();
  }
}

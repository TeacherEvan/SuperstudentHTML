/**
 * Level Completion Screen Component
 * Displays when a level is completed with score and options
 */
export class LevelCompletionScreen {
  constructor() {
    this.isVisible = false;
    this.onRestart = null;
    this.onNextLevel = null;
    this.onBackToMenu = null;
  }

  show(levelName, score, totalPossible) {
    this.isVisible = true;
    this.createCompletionScreen(levelName, score, totalPossible);
  }

  hide() {
    this.isVisible = false;
    const screen = document.getElementById('completion-screen');
    if (screen) {
      screen.remove();
    }
  }

  createCompletionScreen(levelName, score, totalPossible) {
    // Remove existing completion screen
    const existing = document.getElementById('completion-screen');
    if (existing) existing.remove();

    const completionDiv = document.createElement('div');
    completionDiv.id = 'completion-screen';
    completionDiv.className = 'completion-screen-overlay';

    const percentage = Math.round((score / totalPossible) * 100);
    const grade = this.getGrade(percentage);

    completionDiv.innerHTML = `
      <div class="completion-content">
        <h1 class="completion-title">Level Complete!</h1>
        <div class="level-info">
          <h2>${this.formatLevelName(levelName)}</h2>
        </div>
        <div class="score-section">
          <div class="score-display">
            <span class="score-number">${score}</span>
            <span class="score-max">/ ${totalPossible}</span>
          </div>
          <div class="percentage">${percentage}%</div>
          <div class="grade">${grade}</div>
        </div>
        <div class="completion-actions">
          <button class="completion-btn restart" data-action="restart">Play Again</button>
          <button class="completion-btn next" data-action="next">Next Level</button>
          <button class="completion-btn menu" data-action="menu">Main Menu</button>
        </div>
      </div>
    `;

    document.body.appendChild(completionDiv);
    this.addCompletionScreenCSS();
    this.attachEventListeners();

    // Animate in
    setTimeout(() => {
      completionDiv.classList.add('visible');
    }, 100);
  }

  addCompletionScreenCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .completion-screen-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
      }
      .completion-screen-overlay.visible { opacity: 1; }
      .completion-content {
        text-align: center;
        color: white;
        max-width: 90vw;
        background: rgba(255, 255, 255, 0.1);
        padding: 40px;
        border-radius: 20px;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.2);
      }
      .completion-title {
        font-size: 4rem;
        margin: 0 0 20px 0;
        color: #FFD700;
        text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
        font-weight: 900;
      }
      .level-info h2 {
        font-size: 2rem;
        margin: 0 0 30px 0;
        color: #4ECDC4;
        text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
      }
      .score-section {
        margin: 30px 0;
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      .score-display {
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .score-number {
        color: #FFD700;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      }
      .score-max {
        color: #ccc;
        font-size: 2rem;
      }
      .percentage {
        font-size: 1.5rem;
        color: #4ECDC4;
        margin-bottom: 10px;
      }
      .grade {
        font-size: 2rem;
        font-weight: bold;
        color: #FFD700;
        text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.8);
      }
      .completion-actions {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 30px;
      }
      .completion-btn {
        padding: 15px 30px;
        font-size: 1.2rem;
        font-weight: bold;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
        min-width: 150px;
      }
      .completion-btn.restart {
        background: #4ECDC4;
        color: white;
      }
      .completion-btn.restart:hover {
        background: #45B7AF;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(78, 205, 196, 0.3);
      }
      .completion-btn.next {
        background: #FFD700;
        color: #333;
      }
      .completion-btn.next:hover {
        background: #FFC800;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
      }
      .completion-btn.menu {
        background: #FF6B6B;
        color: white;
      }
      .completion-btn.menu:hover {
        background: #FF5252;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
      }
      @media (max-width: 768px) {
        .completion-title { font-size: 2.5rem; }
        .level-info h2 { font-size: 1.5rem; }
        .score-display { font-size: 2rem; }
        .completion-actions { flex-direction: column; align-items: center; }
        .completion-btn { width: 200px; }
      }
    `;
    document.head.appendChild(style);
  }

  attachEventListeners() {
    setTimeout(() => {
      document.querySelectorAll('.completion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          this.handleAction(action);
        });
      });
    }, 100);
  }

  handleAction(action) {
    switch (action) {
    case 'restart':
      if (this.onRestart) this.onRestart();
      break;
    case 'next':
      if (this.onNextLevel) this.onNextLevel();
      break;
    case 'menu':
      if (this.onBackToMenu) this.onBackToMenu();
      break;
    }
    this.hide();
  }

  formatLevelName(levelName) {
    const names = {
      'colors': 'Colors',
      'shapes': 'Shapes',
      'alphabet': 'Alphabet',
      'numbers': 'Numbers',
      'clcase': 'Letter Case',
      'phonics': 'Phonics'
    };
    return names[levelName] || levelName;
  }

  getGrade(percentage) {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'C-';
    if (percentage >= 50) return 'D+';
    if (percentage >= 45) return 'D';
    return 'F';
  }

  setCallbacks(onRestart, onNextLevel, onBackToMenu) {
    this.onRestart = onRestart;
    this.onNextLevel = onNextLevel;
    this.onBackToMenu = onBackToMenu;
  }
}

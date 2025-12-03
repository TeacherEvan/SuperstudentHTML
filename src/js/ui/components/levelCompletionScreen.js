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
    // Remove existing styles to prevent duplicates
    const existingStyle = document.getElementById('completion-screen-styles');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'completion-screen-styles';
    style.textContent = `
      .completion-screen-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.92);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .completion-screen-overlay.visible {
        opacity: 1;
      }

      .completion-content {
        text-align: center;
        color: white;
        max-width: 90vw;
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%);
        padding: 50px 60px;
        border-radius: 24px;
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5),
                    inset 0 0 80px rgba(255, 255, 255, 0.03);
        transform: scale(0.9) translateY(20px);
        transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .completion-screen-overlay.visible .completion-content {
        transform: scale(1) translateY(0);
      }

      /* Title with bounce animation */
      .completion-title {
        font-size: clamp(2.5rem, 8vw, 4rem);
        margin: 0 0 20px 0;
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 900;
        animation: gradientShift 2s ease-in-out infinite, bounceIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        opacity: 0;
      }

      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      @keyframes bounceIn {
        from {
          opacity: 0;
          transform: scale(0.3);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .level-info h2 {
        font-size: clamp(1.5rem, 4vw, 2rem);
        margin: 0 0 30px 0;
        color: #4ECDC4;
        opacity: 0;
        animation: slideUp 0.6s ease-out 0.3s forwards;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Score section with glass effect */
      .score-section {
        margin: 30px 0;
        padding: 25px 40px;
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        opacity: 0;
        animation: fadeInScale 0.6s ease-out 0.4s forwards;
      }

      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .score-display {
        font-size: clamp(2rem, 6vw, 3rem);
        font-weight: bold;
        margin-bottom: 15px;
      }

      .score-number {
        color: #FFD700;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        animation: countUp 1s ease-out 0.5s forwards;
      }

      .score-max {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.6em;
        margin-left: 5px;
      }

      .percentage {
        font-size: 1.4rem;
        color: #4ECDC4;
        margin-bottom: 10px;
        font-weight: 600;
      }

      /* Grade with special effects */
      .grade {
        font-size: 2.5rem;
        font-weight: 900;
        background: linear-gradient(135deg, #FFD700 0%, #FF6B6B 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      /* Button group */
      .completion-actions {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 35px;
      }

      .completion-btn {
        padding: 16px 32px;
        font-size: 1.1rem;
        font-weight: 700;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        min-width: 160px;
        position: relative;
        overflow: hidden;
        opacity: 0;
        transform: translateY(20px);
        animation: buttonSlideUp 0.5s ease-out forwards;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .completion-btn:nth-child(1) { animation-delay: 0.6s; }
      .completion-btn:nth-child(2) { animation-delay: 0.7s; }
      .completion-btn:nth-child(3) { animation-delay: 0.8s; }

      @keyframes buttonSlideUp {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Button ripple effect */
      .completion-btn::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 5px;
        height: 5px;
        background: rgba(255, 255, 255, 0.5);
        opacity: 0;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(1);
        transition: transform 0.5s, opacity 0.5s;
      }

      .completion-btn:active::after {
        transform: translate(-50%, -50%) scale(40);
        opacity: 0;
        transition: 0s;
      }

      /* Restart button - Teal */
      .completion-btn.restart {
        background: linear-gradient(135deg, #4ECDC4 0%, #45B7AF 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
      }

      .completion-btn.restart:hover {
        background: linear-gradient(135deg, #5FE4DB 0%, #4ECDC4 100%);
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(78, 205, 196, 0.4);
      }

      /* Next button - Gold */
      .completion-btn.next {
        background: linear-gradient(135deg, #FFD700 0%, #FFC800 100%);
        color: #1a1a1a;
        box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
      }

      .completion-btn.next:hover {
        background: linear-gradient(135deg, #FFE44D 0%, #FFD700 100%);
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
      }

      /* Menu button - Coral */
      .completion-btn.menu {
        background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
      }

      .completion-btn.menu:hover {
        background: linear-gradient(135deg, #FF8A8A 0%, #FF6B6B 100%);
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
      }

      .completion-btn:active {
        transform: translateY(-1px);
        transition-duration: 0.1s;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .completion-content {
          padding: 35px 25px;
        }

        .completion-title {
          font-size: 2rem;
        }

        .level-info h2 {
          font-size: 1.3rem;
        }

        .score-display {
          font-size: 1.8rem;
        }

        .completion-actions {
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .completion-btn {
          width: 100%;
          max-width: 220px;
        }
      }

      /* Reduced motion for accessibility */
      @media (prefers-reduced-motion: reduce) {
        .completion-title,
        .level-info h2,
        .score-section,
        .completion-btn,
        .grade {
          animation: none;
          opacity: 1;
          transform: none;
        }

        .completion-content {
          transform: none;
        }

        .completion-btn:hover {
          transform: none;
        }
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

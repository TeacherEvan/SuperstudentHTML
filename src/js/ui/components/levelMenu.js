// Level selection menu UI with enhanced visuals
import { ProgressManager } from '../../game/managers/progressManager.js';

export class LevelMenu {
  constructor(containerId, onSelect) {
    this.container = document.getElementById(containerId);
    this.onSelect = onSelect;
    this.progressManager = new ProgressManager();

    // Define available levels with descriptions and colors
    this.levels = [
      {
        name: 'colors',
        label: 'Colors Level',
        description: 'Match the target color from memory',
        difficulty: '★☆☆',
        color: '#FF6B6B',
        icon: '🎨',
      },
      {
        name: 'shapes',
        label: 'Shapes Level',
        description: 'Target shapes in sequence',
        difficulty: '★★☆',
        color: '#4ECDC4',
        icon: '🔷',
      },
      {
        name: 'alphabet',
        label: 'Alphabet Level',
        description: 'A through Z in order',
        difficulty: '★★☆',
        color: '#45B7D1',
        icon: '🔤',
      },
      {
        name: 'numbers',
        label: 'Numbers Level',
        description: '1 through 10 in order',
        difficulty: '★★☆',
        color: '#96CEB4',
        icon: '🔢',
      },
      {
        name: 'clcase',
        label: 'Case Level',
        description: 'a through z in order',
        difficulty: '★★★',
        color: '#DDA0DD',
        icon: '📝',
      },
      {
        name: 'phonics',
        label: 'Phonics Bubbles',
        description: 'Pop bubbles and learn letter sounds!',
        difficulty: '★☆☆',
        color: '#F7DC6F',
        icon: '🫧',
      },
    ];
  }

  show() {
    // Add styles first
    this.addMenuStyles();

    // Build menu markup with enhanced cards
    const html = `
      <div class="level-menu">
        <h2 class="menu-title">Select Level</h2>
        <div class="level-grid">
          ${this.levels.map((level, index) => `
            <div class="level-card unlocked" data-level="${level.name}" style="--card-color: ${level.color}; --card-delay: ${index * 0.1}s">
              <div class="card-icon">${level.icon}</div>
              <h3 class="card-title">${level.label}</h3>
              <p class="level-description">${level.description}</p>
              <div class="card-footer">
                <span class="level-difficulty">${level.difficulty}</span>
                <span class="play-indicator">Play →</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="menu-actions">
          <button class="back-button">← Back</button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.container.style.display = 'flex';

    // Attach event listeners with hover effects
    this.levels.forEach((level) => {
      const card = this.container.querySelector(`[data-level="${level.name}"]`);
      if (card) {
        card.addEventListener('click', () => this.selectLevel(level.name));
        card.addEventListener('mouseenter', () => this.handleCardHover(card, true));
        card.addEventListener('mouseleave', () => this.handleCardHover(card, false));
        card.style.cursor = 'pointer';
      }
    });

    const backBtn = this.container.querySelector('.back-button');
    if (backBtn) backBtn.addEventListener('click', () => this.back());
  }

  handleCardHover(card, isHovering) {
    if (isHovering) {
      card.classList.add('hovered');
    } else {
      card.classList.remove('hovered');
    }
  }

  addMenuStyles() {
    // Remove existing styles to prevent duplicates
    const existingStyle = document.getElementById('level-menu-styles');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'level-menu-styles';
    style.textContent = `
      .level-menu {
        max-width: 900px;
        width: 100%;
        padding: 20px;
      }

      .menu-title {
        text-align: center;
        font-size: clamp(2rem, 5vw, 3rem);
        margin-bottom: 40px;
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 3s ease-in-out infinite;
        font-weight: 800;
      }

      @keyframes shimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .level-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 25px;
        margin-bottom: 40px;
      }

      .level-card {
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%);
        border-radius: 16px;
        padding: 25px;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
        transform: translateY(30px);
        animation: cardAppear 0.6s ease-out forwards;
        animation-delay: var(--card-delay, 0s);
      }

      @keyframes cardAppear {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .level-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--card-color, #FFD700), transparent);
        opacity: 0.8;
      }

      .level-card::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, var(--card-color) 0%, transparent 60%);
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
      }

      .level-card:hover,
      .level-card.hovered {
        transform: translateY(-8px) scale(1.02);
        border-color: var(--card-color);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3),
                    0 0 30px color-mix(in srgb, var(--card-color) 30%, transparent);
      }

      .level-card:hover::after,
      .level-card.hovered::after {
        opacity: 0.1;
      }

      .card-icon {
        font-size: 2.5rem;
        margin-bottom: 15px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        transition: transform 0.3s ease;
      }

      .level-card:hover .card-icon {
        transform: scale(1.2) rotate(-5deg);
      }

      .card-title {
        font-size: 1.3rem;
        font-weight: 700;
        color: white;
        margin: 0 0 10px 0;
      }

      .level-description {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.95rem;
        line-height: 1.4;
        margin: 0 0 20px 0;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .level-difficulty {
        color: var(--card-color);
        font-size: 1.1rem;
        letter-spacing: 2px;
      }

      .play-indicator {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateX(-10px);
      }

      .level-card:hover .play-indicator {
        opacity: 1;
        transform: translateX(0);
        color: var(--card-color);
      }

      .menu-actions {
        text-align: center;
      }

      .back-button {
        padding: 14px 40px;
        font-size: 1.1rem;
        font-weight: 600;
        background: transparent;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        transition: all 0.3s ease;
        letter-spacing: 1px;
      }

      .back-button:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.6);
        color: white;
        transform: translateY(-2px);
      }

      .back-button:active {
        transform: translateY(0);
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .level-grid {
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .level-card {
          padding: 20px;
        }

        .card-icon {
          font-size: 2rem;
        }

        .card-title {
          font-size: 1.2rem;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .level-card,
        .menu-title,
        .card-icon,
        .play-indicator {
          animation: none;
          opacity: 1;
          transform: none;
        }

        .level-card:hover {
          transform: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  selectLevel(name) {
    if (typeof this.onSelect === 'function') {
      // Add exit animation
      const menu = this.container.querySelector('.level-menu');
      if (menu) {
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.95)';
        menu.style.transition = 'all 0.3s ease';
      }

      setTimeout(() => {
        this.container.style.display = 'none';
        this.onSelect(name);
      }, 300);
    }
  }

  back() {
    // Reload page or reset to welcome screen
    window.location.reload();
  }
}

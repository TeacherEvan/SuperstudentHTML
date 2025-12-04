/**
 * Welcome Screen with Animated Background
 * As specified in SuperStudentHTML.md
 */
export class WelcomeScreen {
  constructor(canvas, ctx, resourceManager) {
    this.canvas = canvas;
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.className = 'welcome-bg-canvas';
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.syncCanvasSize();
    this.resourceManager = resourceManager;
    this.particles = [];
    this.animationId = null;
    this.isVisible = false;

    // Animation properties
    this.time = 0;
    this.maxParticles = 150;
    this.particleSpeed = 0.5;

    // Callbacks
    this.onStartGame = null;
    this.onShowOptions = null;

    this.particleColors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];

    this.setupParticles();
    this.setupUI();

    // Keep background canvas in sync on resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupParticles() {
    // Create animated background particles (color confetti style)
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: Math.random() * this.bgCanvas.width,
        y: Math.random() * this.bgCanvas.height,
        size: Math.random() * 6 + 2,
        speed: Math.random() * this.particleSpeed + 0.3,
        opacity: Math.random() * 0.9 + 0.1,
        color: this.particleColors[Math.floor(Math.random() * this.particleColors.length)]
      });
    }
  }

  setupUI() {
    // Create DOM elements for welcome screen UI
    this.createWelcomeScreenHTML();
    this.attachEventListeners();
  }

  createWelcomeScreenHTML() {
    // Remove existing welcome screen if present
    const existing = document.getElementById('welcome-screen');
    if (existing) existing.remove();

    const welcomeDiv = document.createElement('div');
    welcomeDiv.id = 'welcome-screen';
    welcomeDiv.className = 'welcome-screen-overlay';

    // Insert background canvas first
    welcomeDiv.appendChild(this.bgCanvas);

    welcomeDiv.innerHTML += `
      <div class="welcome-content">
        <h1 class="game-title">Super Student</h1>
        <div class="display-size-section">
          <p class="choose-text">Choose Display Size</p>
          <div class="display-btn-group">
            <button class="display-btn default" data-mode="DEFAULT">Default</button>
            <button class="display-btn qboard" data-mode="QBOARD">QBoard</button>
          </div>
          <p class="mode-selected-text" style="display:none;"></p>
        </div>
        <footer class="collaboration-footer">
          <p>In collaboration with <span class="highlight">SANGSOM Kindergarten</span></p>
        </footer>
      </div>`;

    document.body.appendChild(welcomeDiv);
    this.addWelcomeScreenCSS();
  }

  addWelcomeScreenCSS() {
    // Remove existing styles to prevent duplicates
    const existingStyle = document.getElementById('welcome-screen-styles');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'welcome-screen-styles';
    style.textContent = `
      /* Welcome Screen Overlay with smooth fade */
      .welcome-screen-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .welcome-screen-overlay.visible {
        opacity: 1;
      }

      /* Content container with slide-up animation */
      .welcome-content {
        text-align: center;
        color: white;
        max-width: 90vw;
        transform: translateY(30px);
        opacity: 0;
        transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s,
                    opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
      }

      .welcome-screen-overlay.visible .welcome-content {
        transform: translateY(0);
        opacity: 1;
      }

      /* Game title with golden gradient and glow animation */
      .game-title {
        font-size: clamp(3rem, 10vw, 6rem);
        margin: 0 0 40px 0;
        background: linear-gradient(135deg, #ffd700 0%, #ffed4a 25%, #ffd700 50%, #ffb347 75%, #ffd700 100%);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 900;
        text-shadow: none;
        filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3));
        animation: shimmer 3s ease-in-out infinite, float 4s ease-in-out infinite;
        letter-spacing: 2px;
      }

      @keyframes shimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }

      /* Choose text with subtle animation */
      .choose-text {
        font-size: 1.3rem;
        margin-bottom: 24px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.9);
        opacity: 0;
        animation: fadeInUp 0.6s ease-out 0.5s forwards;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Button group with stagger animation */
      .display-btn-group {
        display: flex;
        gap: 40px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 30px;
      }

      /* Premium buttons with glow effect */
      .display-btn {
        width: 220px;
        height: 65px;
        font-size: 1.15rem;
        font-weight: 700;
        background: transparent;
        border: 3px solid currentColor;
        border-radius: 12px;
        color: white;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: 0;
        transform: scale(0.9);
        animation: buttonAppear 0.5s ease-out forwards;
      }

      .display-btn:nth-child(1) { animation-delay: 0.6s; }
      .display-btn:nth-child(2) { animation-delay: 0.75s; }

      @keyframes buttonAppear {
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      /* Button gradient backgrounds on hover */
      .display-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, currentColor 0%, transparent 50%);
        opacity: 0;
        transition: opacity 0.4s ease;
        z-index: -1;
      }

      .display-btn:hover::before {
        opacity: 0.15;
      }

      /* Default button - Blue theme */
      .display-btn.default {
        color: #00bfff;
        border-color: #00bfff;
        box-shadow: 0 0 20px rgba(0, 191, 255, 0.2),
                    inset 0 0 20px rgba(0, 191, 255, 0.05);
      }

      .display-btn.default:hover {
        color: #4dd9ff;
        border-color: #4dd9ff;
        box-shadow: 0 0 30px rgba(0, 191, 255, 0.4),
                    0 8px 25px rgba(0, 191, 255, 0.3),
                    inset 0 0 30px rgba(0, 191, 255, 0.1);
        transform: translateY(-6px) scale(1.02);
      }

      /* QBoard button - Pink theme */
      .display-btn.qboard {
        color: #ff4080;
        border-color: #ff4080;
        box-shadow: 0 0 20px rgba(255, 64, 128, 0.2),
                    inset 0 0 20px rgba(255, 64, 128, 0.05);
      }

      .display-btn.qboard:hover {
        color: #ff6699;
        border-color: #ff6699;
        box-shadow: 0 0 30px rgba(255, 64, 128, 0.4),
                    0 8px 25px rgba(255, 64, 128, 0.3),
                    inset 0 0 30px rgba(255, 64, 128, 0.1);
        transform: translateY(-6px) scale(1.02);
      }

      /* Active/pressed state */
      .display-btn:active {
        transform: translateY(-2px) scale(0.98);
        transition-duration: 0.1s;
      }

      /* Selected state with pulse animation */
      .display-btn.selected {
        opacity: 0.7;
        cursor: default;
        animation: pulse 1.5s ease-in-out infinite;
        pointer-events: none;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 0.5; }
      }

      /* Mode selection text */
      .mode-selected-text {
        color: #ffd700;
        font-size: 1.1rem;
        margin-top: 20px;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Footer with fade-in */
      .collaboration-footer {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        font-size: clamp(0.9rem, 2vw, 1.2rem);
        opacity: 0;
        animation: fadeInUp 0.6s ease-out 1s forwards;
      }

      .collaboration-footer p {
        margin: 0;
        color: rgba(255, 255, 255, 0.7);
      }

      .highlight {
        color: #ffd700;
        font-weight: 600;
      }

      /* Background canvas */
      .welcome-bg-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .game-title {
          font-size: 12vw;
          margin-bottom: 30px;
        }

        .display-btn-group {
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }

        .display-btn {
          width: 180px;
          height: 55px;
          font-size: 1rem;
        }

        .collaboration-footer {
          font-size: 3.5vw;
          bottom: 25px;
        }
      }

      /* Reduced motion for accessibility */
      @media (prefers-reduced-motion: reduce) {
        .game-title,
        .display-btn,
        .choose-text,
        .collaboration-footer {
          animation: none;
          opacity: 1;
          transform: none;
        }

        .welcome-content {
          transform: none;
          opacity: 1;
        }

        .display-btn:hover {
          transform: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  attachEventListeners() {
    const updateSelection = (button) => {
      document.querySelectorAll('.display-btn').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      const mode = button.dataset.mode;
      this.resourceManager.setDisplayMode(mode);
      const textEl = document.querySelector('.mode-selected-text');
      if (textEl) {
        textEl.style.display = 'block';
        textEl.textContent = `Display mode set to ${mode}. Loading...`;
      }
      setTimeout(() => { if (this.onStartGame) { this.hide(); this.onStartGame(); } }, 1200);
    };

    setTimeout(() => {
      document.querySelectorAll('.display-btn').forEach(btn => {
        btn.addEventListener('click', () => updateSelection(btn));
      });
    }, 100);
  }

  show() {
    this.isVisible = true;
    this.startAnimation();

    setTimeout(() => {
      const welcomeScreen = document.getElementById('welcome-screen');
      if (welcomeScreen) {
        welcomeScreen.classList.add('visible');
      }
    }, 100);
  }

  hide() {
    this.isVisible = false;
    this.stopAnimation();

    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.classList.remove('visible');
      setTimeout(() => {
        welcomeScreen.remove();
      }, 500);
    }
  }

  startAnimation() {
    // Prevent multiple animation loops
    if (this.animationId) {
      console.warn('Animation already running');
      return;
    }

    const animate = () => {
      // Check visibility state at the beginning of each frame
      if (!this.isVisible) {
        this.animationId = null;
        return;
      }

      this.updateAnimatedBackground();
      this.renderAnimatedBackground();

      // Only schedule next frame if still visible
      if (this.isVisible) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = null;
      }
    };

    // Start the animation loop
    this.animationId = requestAnimationFrame(animate);
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  updateAnimatedBackground() {
    this.time += 0.01;

    this.particles.forEach(particle => {
      particle.y -= particle.speed;

      if (particle.y < -10) {
        particle.y = this.bgCanvas.height + 10;
        particle.x = Math.random() * this.bgCanvas.width;
      }

      particle.opacity = 0.5 + Math.sin(this.time * 0.1) * 0.3;
    });
  }

  renderAnimatedBackground() {
    const ctx = this.bgCtx;
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

    // OPTIMIZATION: Group particles by color and batch draw operations
    // This reduces context state changes which are expensive
    const particlesByColor = new Map();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!particlesByColor.has(p.color)) {
        particlesByColor.set(p.color, []);
      }
      particlesByColor.get(p.color).push(p);
    }

    // Draw particles grouped by color to minimize fillStyle changes
    const TWO_PI = Math.PI * 2;
    for (const [color, particles] of particlesByColor) {
      ctx.fillStyle = color;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;
  }

  onResize() {
    this.syncCanvasSize();
    // Re-position particles within new bounds
    this.particles.forEach(particle => {
      if (particle.x > this.bgCanvas.width) {
        particle.x = Math.random() * this.bgCanvas.width;
      }
      if (particle.y > this.bgCanvas.height) {
        particle.y = Math.random() * this.bgCanvas.height;
      }
    });
  }

  syncCanvasSize() {
    this.bgCanvas.width = window.innerWidth;
    this.bgCanvas.height = window.innerHeight;
  }

  setCallbacks(startGameCallback, showOptionsCallback) {
    this.onStartGame = startGameCallback;
    this.onShowOptions = showOptionsCallback;
  }

  // GameLoop interface methods (no-op since WelcomeScreen manages its own animation)
  update(_deltaTime) {
    // WelcomeScreen manages its own animation loop via requestAnimationFrame
    // This method is here to satisfy the GameLoop interface
  }

  render(_ctx) {
    // WelcomeScreen renders via DOM elements and its own background canvas
    // This method is here to satisfy the GameLoop interface
  }
}

import { ResourceManager } from './core/resourceManager.js';
import { GameLoop } from './gameLoop.js';
import { InputHandler } from './inputHandler.js';
import { WelcomeScreen } from './ui/components/welcomeScreen.js';

// Import CSS for webpack to process
import '../css/main.css';

class SuperStudentGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resourceManager = new ResourceManager();
    this.inputHandler = new InputHandler(this.canvas);
    this.gameLoop = new GameLoop(this.ctx);
  }

  async init() {
    this.setupCanvas();
    this.setupMobileOptimizations();
    await this.resourceManager.loadAssets();
    this.startWelcomeScreen();
    this.gameLoop.start();
  }

  setupCanvas() {
    this.resizeCanvas();

    // Handle window resize for responsive design
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.resizeCanvas(), 100);
    });

    // Handle orientation change on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.resizeCanvas(), 200);
    });
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);

    // Store viewport dimensions for game logic
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.devicePixelRatio = dpr;
  }

  setupMobileOptimizations() {
    // Prevent zoom on double-tap
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());

    // Prevent context menu on long press
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Hide address bar on mobile by scrolling
    if (this.isMobileDevice()) {
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 100);
    }

    // Add mobile device class for CSS targeting
    if (this.isMobileDevice()) {
      document.body.classList.add('mobile-device');
    }

    if (this.isTouchDevice()) {
      document.body.classList.add('touch-device');
    }
  }

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  startWelcomeScreen() {
    const welcomeScreen = new WelcomeScreen(this.canvas, this.ctx, this.resourceManager);

    // Set callback for when user selects display mode
    welcomeScreen.setCallbacks(
      () => {
        // Start game callback - this is where you'd transition to the actual game
        console.log('Game starting with selected display mode');
        // TODO: Implement game start logic
      },
      () => {
        // Show options callback (if needed)
        console.log('Show options');
      }
    );

    // Show the welcome screen
    welcomeScreen.show();

    // Set it as current screen for the game loop (if needed for rendering)
    this.gameLoop.setCurrentScreen(welcomeScreen);
  }
}

window.addEventListener('load', () => {
  const game = new SuperStudentGame();
  game.init();
});

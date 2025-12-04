/**
 * Super Student HTML5 Game - Main Entry Point
 * An educational game featuring colors, shapes, alphabet, numbers and more.
 *
 * @author Teacher Evan and Teacher Lee
 * @version 1.0.0
 */

import { ResourceManager } from './core/resourceManager.js';
import { GameLoop } from './gameLoop.js';
import { InputHandler } from './inputHandler.js';
import { WelcomeScreen } from './ui/components/welcomeScreen.js';
import { preloadAllLevels } from './utils/lazyLevelLoader.js';

// Import CSS for webpack to process
import '../css/main.css';

// Configuration constants
const CANVAS_RESIZE_DEBOUNCE_MS = 100;
const ORIENTATION_CHANGE_DELAY_MS = 200;
const MOBILE_SCROLL_DELAY_MS = 100;

// Mobile device detection patterns
const MOBILE_DEVICE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/**
 * SuperStudentGame - Main game controller class
 * Manages game initialization, canvas setup, and screen transitions
 */
class SuperStudentGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resourceManager = new ResourceManager();
    this.inputHandler = new InputHandler(this.canvas);
    this.gameLoop = new GameLoop(this.ctx);
    this.resizeTimeout = null;

    // Store viewport dimensions
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.devicePixelRatio = 1;
  }

  /**
   * Initialize the game application
   * Sets up canvas, mobile optimizations, loads assets, and shows welcome screen
   */
  async initializeApplication() {
    this.configureCanvasForHighDPI();
    this.applyMobileDeviceOptimizations();
    await this.resourceManager.loadAssets();
    this.displayWelcomeScreen();
    this.gameLoop.start();

    // TODO: [OPTIMIZATION] Consider prefetching level assets during idle time
    this.scheduleBackgroundLevelPreload();
  }

  /**
   * Schedule background preloading of game levels during idle time
   * Uses requestIdleCallback for non-blocking preload
   */
  scheduleBackgroundLevelPreload() {
    const schedulePreload = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          preloadAllLevels().catch(err =>
            console.warn('Background level preload encountered issues:', err)
          );
        }, { timeout: 5000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          preloadAllLevels().catch(err =>
            console.warn('Background level preload encountered issues:', err)
          );
        }, 3000);
      }
    };

    // Wait for initial load to complete before preloading
    setTimeout(schedulePreload, 2000);
  }

  /**
   * Configure canvas for high-DPI displays
   * Sets up event listeners for responsive resize handling
   */
  configureCanvasForHighDPI() {
    this.updateCanvasDimensions();

    // Handle window resize with debouncing for performance
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(
        () => this.updateCanvasDimensions(),
        CANVAS_RESIZE_DEBOUNCE_MS
      );
    });

    // Handle orientation change on mobile devices
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateCanvasDimensions(), ORIENTATION_CHANGE_DELAY_MS);
    });
  }

  /**
   * Update canvas dimensions based on viewport and device pixel ratio
   * Ensures crisp rendering on high-DPI displays
   */
  updateCanvasDimensions() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Set canvas internal dimensions (scaled for DPI)
    this.canvas.width = viewportWidth * devicePixelRatio;
    this.canvas.height = viewportHeight * devicePixelRatio;

    // Set canvas display dimensions
    this.canvas.style.width = `${viewportWidth}px`;
    this.canvas.style.height = `${viewportHeight}px`;

    // Scale context to match DPI
    this.ctx.scale(devicePixelRatio, devicePixelRatio);

    // Store dimensions for game logic
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.devicePixelRatio = devicePixelRatio;
  }

  /**
   * Apply mobile device optimizations
   * Prevents unwanted gestures and adds device-specific CSS classes
   */
  applyMobileDeviceOptimizations() {
    // Prevent zoom on double-tap (iOS/Safari gesture events)
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());

    // Prevent context menu on long press
    document.addEventListener('contextmenu', e => e.preventDefault());

    const isMobile = this.detectMobileDevice();
    const isTouch = this.detectTouchCapability();

    // Hide address bar on mobile by scrolling
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, MOBILE_SCROLL_DELAY_MS);
      document.body.classList.add('mobile-device');
    }

    if (isTouch) {
      document.body.classList.add('touch-device');
    }
  }

  /**
   * Detect if the current device is a mobile device
   * @returns {boolean} True if mobile device detected
   */
  detectMobileDevice() {
    return MOBILE_DEVICE_REGEX.test(navigator.userAgent);
  }

  /**
   * Detect if the current device has touch capability
   * @returns {boolean} True if touch is supported
   */
  detectTouchCapability() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Display the welcome screen with animated background
   * Sets up callbacks for game start and options
   */
  displayWelcomeScreen() {
    const welcomeScreen = new WelcomeScreen(this.canvas, this.ctx, this.resourceManager);

    // Configure callbacks for user interactions
    welcomeScreen.setCallbacks(
      () => this.handleGameStartRequest(),
      () => this.handleOptionsMenuRequest()
    );

    welcomeScreen.show();
  }

  /**
   * Handle request to start the game
   * Called when user selects a display mode
   */
  handleGameStartRequest() {
    console.log('🎮 Game starting with selected display mode');
    // TODO: [ENHANCEMENT] Implement game start logic with level selection
  }

  /**
   * Handle request to show options menu
   * Called when user requests game options
   */
  handleOptionsMenuRequest() {
    console.log('⚙️ Options menu requested');
    // TODO: [ENHANCEMENT] Implement options menu with sound/display settings
  }
}

/**
 * Application bootstrap
 * Initializes the game when the DOM is fully loaded
 */
window.addEventListener('load', () => {
  const game = new SuperStudentGame();
  game.initializeApplication();
});

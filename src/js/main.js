/**
 * Super Student HTML5 Game - Main Entry Point
 * An educational game featuring colors, shapes, alphabet, numbers and more.
 *
 * @author Teacher Evan and Teacher Lee
 * @version 1.0.0
 *
 * Architecture Overview:
 * - ResourceManager: Handles asset loading with lazy loading and format detection
 * - GameLoop: Manages frame-rate independent updates and rendering
 * - InputHandler: Unified pointer/touch/keyboard input processing
 * - WelcomeScreen: Initial game screen with animated background
 *
 * Performance Optimizations:
 * - Dynamic imports for code splitting (levels loaded on demand)
 * - Object pooling for particles and game entities
 * - High-DPI canvas scaling with cached dimensions
 * - RequestIdleCallback for non-critical background tasks
 */

import { ResourceManager } from './core/resourceManager.js';
import { GameLoop } from './gameLoop.js';
import { InputHandler } from './inputHandler.js';
import { WelcomeScreen } from './ui/components/welcomeScreen.js';
import { preloadAllLevels } from './utils/lazyLevelLoader.js';

// Import CSS for webpack to process
import '../css/main.css';

// Configuration constants for canvas and mobile behavior
const CANVAS_RESIZE_DEBOUNCE_DURATION_MS = 100;
const ORIENTATION_CHANGE_TRANSITION_DELAY_MS = 200;
const MOBILE_ADDRESS_BAR_SCROLL_DELAY_MS = 100;
const LEVEL_PRELOAD_INITIAL_DELAY_MS = 2000;
const IDLE_PRELOAD_TIMEOUT_MS = 5000;
const FALLBACK_PRELOAD_DELAY_MS = 3000;

// Mobile device detection patterns (supports major mobile platforms)
const MOBILE_DEVICE_USER_AGENT_PATTERN = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/**
 * SuperStudentGame - Main game controller class
 * Manages game initialization, canvas setup, and screen transitions
 *
 * TODO: [OPTIMIZATION] Consider implementing a state machine pattern for game states
 * TODO: [ENHANCEMENT] Add service worker registration for offline support
 */
class SuperStudentGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.canvasRenderingContext = this.canvas.getContext('2d');
    this.assetResourceManager = new ResourceManager();
    this.userInputHandler = new InputHandler(this.canvas);
    this.mainGameLoop = new GameLoop(this.canvasRenderingContext);
    this.canvasResizeTimeoutId = null;

    // Store viewport dimensions for responsive calculations
    this.currentViewportWidth = 0;
    this.currentViewportHeight = 0;
    this.currentDevicePixelRatio = 1;
  }

  /**
   * Initialize the game application
   * Sets up canvas, mobile optimizations, loads assets, and shows welcome screen
   */
  async initializeApplication() {
    this.configureCanvasForHighDPIDisplays();
    this.applyMobileDeviceOptimizations();
    await this.assetResourceManager.loadAssets();
    this.displayWelcomeScreen();
    this.mainGameLoop.start();

    // TODO: [OPTIMIZATION] Consider prefetching level assets during idle time
    this.scheduleBackgroundLevelPreload();
  }

  /**
   * Schedule background preloading of game levels during idle time
   * Uses requestIdleCallback for non-blocking preload to avoid impacting initial load performance
   */
  scheduleBackgroundLevelPreload() {
    const schedulePreload = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          preloadAllLevels().catch(preloadError =>
            console.warn('Background level preload encountered issues:', preloadError)
          );
        }, { timeout: IDLE_PRELOAD_TIMEOUT_MS });
      } else {
        // Fallback for browsers without requestIdleCallback (Safari, older browsers)
        setTimeout(() => {
          preloadAllLevels().catch(preloadError =>
            console.warn('Background level preload encountered issues:', preloadError)
          );
        }, FALLBACK_PRELOAD_DELAY_MS);
      }
    };

    // Wait for initial load to complete before preloading to prioritize user experience
    setTimeout(schedulePreload, LEVEL_PRELOAD_INITIAL_DELAY_MS);
  }

  /**
   * Configure canvas for high-DPI displays
   * Sets up event listeners for responsive resize handling
   *
   * TODO: [OPTIMIZATION] Consider using ResizeObserver instead of window resize for better performance
   */
  configureCanvasForHighDPIDisplays() {
    this.updateCanvasDimensionsForCurrentViewport();

    // Handle window resize with debouncing for performance
    window.addEventListener('resize', () => {
      clearTimeout(this.canvasResizeTimeoutId);
      this.canvasResizeTimeoutId = setTimeout(
        () => this.updateCanvasDimensionsForCurrentViewport(),
        CANVAS_RESIZE_DEBOUNCE_DURATION_MS
      );
    });

    // Handle orientation change on mobile devices with delay for layout recalculation
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateCanvasDimensionsForCurrentViewport(), ORIENTATION_CHANGE_TRANSITION_DELAY_MS);
    });
  }

  /**
   * Update canvas dimensions based on viewport and device pixel ratio
   * Ensures crisp rendering on high-DPI displays (Retina, 4K, etc.)
   */
  updateCanvasDimensionsForCurrentViewport() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Set canvas internal dimensions (scaled for DPI)
    this.canvas.width = viewportWidth * devicePixelRatio;
    this.canvas.height = viewportHeight * devicePixelRatio;

    // Set canvas display dimensions (CSS pixels)
    this.canvas.style.width = `${viewportWidth}px`;
    this.canvas.style.height = `${viewportHeight}px`;

    // Scale context to match DPI for automatic coordinate transformation
    this.canvasRenderingContext.scale(devicePixelRatio, devicePixelRatio);

    // Store dimensions for game logic calculations
    this.currentViewportWidth = viewportWidth;
    this.currentViewportHeight = viewportHeight;
    this.currentDevicePixelRatio = devicePixelRatio;
  }

  /**
   * Apply mobile device optimizations
   * Prevents unwanted gestures and adds device-specific CSS classes
   */
  applyMobileDeviceOptimizations() {
    // Prevent zoom on double-tap (iOS/Safari gesture events)
    document.addEventListener('gesturestart', gestureEvent => gestureEvent.preventDefault());
    document.addEventListener('gesturechange', gestureEvent => gestureEvent.preventDefault());

    // Prevent context menu on long press
    document.addEventListener('contextmenu', contextEvent => contextEvent.preventDefault());

    const isMobileDevice = this.detectMobileDevice();
    const hasTouchCapability = this.detectTouchCapability();

    // Hide address bar on mobile by scrolling
    if (isMobileDevice) {
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, MOBILE_ADDRESS_BAR_SCROLL_DELAY_MS);
      document.body.classList.add('mobile-device');
    }

    if (hasTouchCapability) {
      document.body.classList.add('touch-device');
    }
  }

  /**
   * Detect if the current device is a mobile device
   * @returns {boolean} True if mobile device detected
   */
  detectMobileDevice() {
    return MOBILE_DEVICE_USER_AGENT_PATTERN.test(navigator.userAgent);
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
    const welcomeScreen = new WelcomeScreen(this.canvas, this.canvasRenderingContext, this.assetResourceManager);

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

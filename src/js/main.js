/**
 * Super Student HTML5 Game - Main Entry Point
 * Boots the app, applies device/runtime setup, and hands gameplay off to the
 * unified runtime in src/js/core/main.js.
 */

import { ResourceManager } from './core/resourceManager.js';
import { SuperStudentRuntime } from './core/main.js';
import { WelcomeScreen } from './ui/components/welcomeScreen.js';
import { preloadAllLevels } from './utils/lazyLevelLoader.js';
import { eventTracker } from './utils/eventTracker.js';

import '../css/main.css';

const CANVAS_RESIZE_DEBOUNCE_DURATION_MS = 100;
const ORIENTATION_CHANGE_TRANSITION_DELAY_MS = 200;
const MOBILE_ADDRESS_BAR_SCROLL_DELAY_MS = 100;
const LEVEL_PRELOAD_INITIAL_DELAY_MS = 2000;
const IDLE_PRELOAD_TIMEOUT_MS = 5000;
const FALLBACK_PRELOAD_DELAY_MS = 3000;
const MOBILE_DEVICE_USER_AGENT_PATTERN = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

class SuperStudentGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.canvasRenderingContext = this.canvas.getContext('2d');
    this.assetResourceManager = new ResourceManager();
    this.runtime = null;
    this.welcomeScreen = null;
    this.canvasResizeTimeoutId = null;
    this.currentViewportWidth = 0;
    this.currentViewportHeight = 0;
    this.currentDevicePixelRatio = 1;
  }

  setupObservability() {
    eventTracker.initialize();
    eventTracker.trackEvent('system', 'bootstrap', {
      entry: 'src/js/main.js',
      userAgent: navigator.userAgent
    });
    window.__superStudentEventTracker = eventTracker;
  }

  async initializeDebugMonitoring() {
    const queryDebugMode = new URLSearchParams(window.location.search).get('debug') === '1';
    const storedDebugMode = localStorage.getItem('superstudent_debug') === '1';
    const debugEnabled = queryDebugMode || storedDebugMode;

    if (!debugEnabled) {
      return;
    }

    await import('./utils/performanceDashboard.js');
    eventTracker.trackEvent('debug', 'monitoring_enabled', {
      source: queryDebugMode ? 'query' : 'storage'
    });
  }

  async initializeApplication() {
    this.setupObservability();
    await this.initializeDebugMonitoring();
    this.configureCanvasForHighDPIDisplays();
    this.applyMobileDeviceOptimizations();

    try {
      await this.assetResourceManager.loadAssets();
    } catch (loadError) {
      eventTracker.trackError(loadError, { context: 'asset_load' });
      throw loadError;
    }

    this.runtime = new SuperStudentRuntime({
      canvas: this.canvas,
      resourceManager: this.assetResourceManager
    });
    await this.runtime.initialize();

    this.displayWelcomeScreen();
    this.scheduleBackgroundLevelPreload();
    eventTracker.trackEvent('system', 'runtime_ready');
  }

  scheduleBackgroundLevelPreload() {
    const schedulePreload = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          preloadAllLevels().catch((preloadError) => {
            console.warn('Background level preload encountered issues:', preloadError);
          });
        }, { timeout: IDLE_PRELOAD_TIMEOUT_MS });
        return;
      }

      setTimeout(() => {
        preloadAllLevels().catch((preloadError) => {
          console.warn('Background level preload encountered issues:', preloadError);
        });
      }, FALLBACK_PRELOAD_DELAY_MS);
    };

    setTimeout(schedulePreload, LEVEL_PRELOAD_INITIAL_DELAY_MS);
  }

  configureCanvasForHighDPIDisplays() {
    this.updateCanvasDimensionsForCurrentViewport();

    window.addEventListener('resize', () => {
      clearTimeout(this.canvasResizeTimeoutId);
      this.canvasResizeTimeoutId = setTimeout(() => {
        this.updateCanvasDimensionsForCurrentViewport();
      }, CANVAS_RESIZE_DEBOUNCE_DURATION_MS);
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateCanvasDimensionsForCurrentViewport();
      }, ORIENTATION_CHANGE_TRANSITION_DELAY_MS);
    });
  }

  updateCanvasDimensionsForCurrentViewport() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    this.canvas.width = viewportWidth * devicePixelRatio;
    this.canvas.height = viewportHeight * devicePixelRatio;
    this.canvas.style.width = `${viewportWidth}px`;
    this.canvas.style.height = `${viewportHeight}px`;

    this.canvasRenderingContext.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasRenderingContext.scale(devicePixelRatio, devicePixelRatio);

    this.currentViewportWidth = viewportWidth;
    this.currentViewportHeight = viewportHeight;
    this.currentDevicePixelRatio = devicePixelRatio;

    if (this.runtime) {
      this.runtime.handleViewportResize();
    }
  }

  applyMobileDeviceOptimizations() {
    document.addEventListener('gesturestart', gestureEvent => gestureEvent.preventDefault());
    document.addEventListener('gesturechange', gestureEvent => gestureEvent.preventDefault());
    document.addEventListener('contextmenu', contextEvent => contextEvent.preventDefault());

    const isMobileDevice = this.detectMobileDevice();
    const hasTouchCapability = this.detectTouchCapability();

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

  detectMobileDevice() {
    return MOBILE_DEVICE_USER_AGENT_PATTERN.test(navigator.userAgent);
  }

  detectTouchCapability() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  displayWelcomeScreen() {
    this.welcomeScreen = new WelcomeScreen(
      this.canvas,
      this.canvasRenderingContext,
      this.assetResourceManager
    );
    eventTracker.trackEvent('ui', 'welcome_screen_shown');

    this.welcomeScreen.setCallbacks(
      () => this.handleGameStartRequest(),
      () => this.handleOptionsMenuRequest()
    );

    this.welcomeScreen.show();
  }

  handleGameStartRequest() {
    eventTracker.trackEvent('game', 'start_requested');
    if (!this.runtime) {
      throw new Error('Runtime is not initialized');
    }
    this.runtime.showLevelMenu();
  }

  handleOptionsMenuRequest() {
    eventTracker.trackEvent('ui', 'options_requested');
    if (!this.runtime) {
      throw new Error('Runtime is not initialized');
    }
    this.runtime.showOptions();
  }
}

window.addEventListener('load', () => {
  const game = new SuperStudentGame();
  game.initializeApplication();
});

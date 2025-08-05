import { getAudioConfig } from '../config/audioConfig.js';
import { getDisplaySettings } from '../config/displayModes.js';
import AlphabetLevel from '../game/levels/alphabetLevel.js';
import ClCaseLevel from '../game/levels/clCaseLevel.js';
import ColorsLevel from '../game/levels/colorsLevel.js';
import NumbersLevel from '../game/levels/numbersLevel.js';
import { PhonicsLevel } from '../game/levels/phonics/PhonicsLevel.js';
import ShapesLevel from '../game/levels/shapesLevel.js';
import CenterPieceManager from '../game/managers/centerPieceManager.js';
import CheckpointManager from '../game/managers/checkpointManager.js';
import FlamethrowerManager from '../game/managers/flamethrowerManager.js';
import GlassShatterManager from '../game/managers/glassShatterManager.js';
import HudManager from '../game/managers/hudManager.js';
import MultiTouchManager from '../game/managers/multiTouchManager.js';
import { ProgressManager } from '../game/managers/progressManager.js';
import { InputHandler } from '../inputHandler.js';
import { LevelMenu } from '../ui/levelMenu.js';
import { eventTracker } from '../utils/eventTracker.js';
import { performanceMonitor } from '../utils/performanceMonitor.js';
import SoundManager from './audio/soundManager.js';
import { GameLoop } from './engine/gameLoop.js';
import { Renderer } from './engine/renderer.js';
import ParticleManager from './graphics/particleSystem.js';
import ResourceManager from './resources/resourceManager.js';
import { LevelCompletionScreen } from '../ui/components/levelCompletionScreen.js';
import { GAME_CONFIG } from '../config/constants.js';
import { WelcomeScreen } from '../ui/components/welcomeScreen.js';
import { initializeErrorTracker } from '../utils/errorTracker.js';

let canvas = document.getElementById('game-canvas');
let renderer = new Renderer(canvas);
let ctx = renderer.ctx;

// Current display-specific settings
let displaySettings;
let resourceManager;
let particleManager;
let soundManager;
let progressManager;
const managers = {};
let currentLevel = null;
let currentLevelName = '';
let gameState = 'menu'; // menu, playing, paused, gameOver
let lastTime = 0;
let gameLoop;
let welcomeScreen;
let levelCompletionScreen;
let levelCompletionTimer = null; // Track level completion timer
const isInitialized = false;


/* --- Retry guard to prevent infinite error loops between functions --- */
const MAX_RETRY_ATTEMPTS = 3;
const retryAttempts = { showLevelMenu: 0, startLevel: 0, initializeWelcomeScreen: 0 };

/**
 * Display a critical error screen and halt further automatic retries.
 * @param {string} userMessage - Human-readable explanation of the failure.
 * @param {Error} [err] - Optional original error object for logging.
 */
function showFatalErrorScreen(userMessage, err) {
  if (err) {
    console.error('🛑 Fatal error encountered:', err);
  }
  try {
    document.body.innerHTML = `
      <div style="color: white; background: #222; padding: 20px; font-family: Arial; text-align: center;">
        <h1>Critical Error</h1>
        <p>${userMessage}</p>
        <p>Please refresh the page to try again.</p>
        <button onclick="location.reload()">Refresh Page</button>
      </div>
    `;
  } catch (uiErr) {
    console.error('❌ Failed to display fatal error screen:', uiErr);
  }
}

function resizeCanvas() {
  renderer.setupCanvas();
  // Update managers and level with new canvas size
  if (managers.hud) managers.hud.resize(renderer.canvas);
  if (managers.centerPiece) managers.centerPiece.resize(renderer.canvas);
  if (currentLevel && typeof currentLevel.resize === 'function') {
    currentLevel.resize(renderer.canvas);
  }
}

// Initialize and show welcome screen with animated background
function initializeWelcomeScreen() {

  try {
    console.log('🏠 Initializing WelcomeScreen class with animated background...');

    // Create WelcomeScreen instance as specified in SuperStudentHTML.md
    welcomeScreen = new WelcomeScreen(canvas, ctx, resourceManager);
    welcomeScreen.setCallbacks(showLevelMenu, showOptions);
    welcomeScreen.show();

    // Reset retry counter on success
    retryAttempts.initializeWelcomeScreen = 0;
    console.log('✅ WelcomeScreen initialized with animated background!');
  } catch (error) {
    console.error('❌ Error initializing welcome screen:', error);
    retryAttempts.initializeWelcomeScreen++;

    if (retryAttempts.initializeWelcomeScreen < MAX_RETRY_ATTEMPTS) {
      console.log(`🔄 Retrying welcome screen initialization (attempt ${retryAttempts.initializeWelcomeScreen}/${MAX_RETRY_ATTEMPTS})`);
      setTimeout(() => initializeWelcomeScreen(), 1000);
    } else {
      console.error('💥 Max retry attempts reached for welcome screen. Falling back to level menu.');
      // Only call showLevelMenu if we haven't exceeded its retry attempts
      if (retryAttempts.showLevelMenu < MAX_RETRY_ATTEMPTS) {
        showLevelMenu();
      } else {
        handleCriticalFailure('Unable to initialize welcome screen or level menu');
      }
    }
  }
}

// Show level selection menu
function showLevelMenu() {
  try {
    console.log('🎮 Showing level menu...');

    // Clear any pending level completion timer
    if (levelCompletionTimer) {
      clearTimeout(levelCompletionTimer);
      levelCompletionTimer = null;
    }

    // Remove level menu container
    const menuContainer = document.getElementById('level-menu-container');
    if (menuContainer) {
      menuContainer.remove();
    }

    gameState = 'menu';

    // Create level menu UI
    const levelMenuContainer = document.createElement('div');
    levelMenuContainer.id = 'level-menu-container';
    levelMenuContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
    `;

    levelMenuContainer.innerHTML = `
      <h1>Select Level</h1>
      <div class="level-buttons">
        <button onclick="startLevel('colors')">Colors</button>
        <button onclick="startLevel('shapes')">Shapes</button>
        <button onclick="startLevel('alphabet')">Alphabet</button>
        <button onclick="startLevel('numbers')">Numbers</button>
        <button onclick="startLevel('clcase')">Letter Case</button>
        <button onclick="startLevel('phonics')">Phonics</button>
      </div>
    `;

    document.body.appendChild(levelMenuContainer);

    retryAttempts.showLevelMenu = 0; // Reset retry counter on success
    console.log('✅ Level menu displayed');
  } catch (error) {
    console.error('❌ Error showing level menu:', error);
    retryAttempts.showLevelMenu++;

    if (retryAttempts.showLevelMenu >= MAX_RETRY_ATTEMPTS) {
      handleCriticalFailure('Unable to display level menu after multiple attempts');
      return;
    }

    // Retry showing the level menu
    console.log(`🔄 Retrying level menu display (attempt ${retryAttempts.showLevelMenu}/${MAX_RETRY_ATTEMPTS})`);
    setTimeout(() => showLevelMenu(), 1000);
  }
}

// Start a specific level
function startLevel(levelName) {
  eventTracker.trackEvent('level', 'start_attempt', { levelName });
  if (!progressManager.isLevelUnlocked(levelName)) {
    eventTracker.trackEvent('level', 'start_blocked', {
      levelName,
      reason: 'locked',
    });
    alert('This level is locked. Complete previous levels to unlock it.');
    return;
  }

  try {
    console.log(`🎮 Starting level: ${levelName}`);

    // Clear any pending level completion timer
    if (levelCompletionTimer) {
      clearTimeout(levelCompletionTimer);
      levelCompletionTimer = null;
    }

    // Remove the menu UI
    const menuContainer = document.getElementById('level-menu-container');
    if (menuContainer) {
      menuContainer.remove();
    }

    const previousState = gameState;
    gameState = 'playing';
    eventTracker.trackState('gameState', gameState, previousState);
    currentLevelName = levelName;
    eventTracker.trackState('currentLevel', levelName);
    initializeManagers();

    const helpers = {
      createExplosion: (x, y, color, intensity) => {
        const count = Math.floor(20 * intensity);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          const dx = Math.cos(angle) * speed;
          const dy = Math.sin(angle) * speed;
          const size = 2 + Math.random() * 3;
          const duration = 500 + Math.random() * 1000;
          particleManager.createParticle(x, y, color, size, dx, dy, duration);
        }
      },
      applyExplosionEffect: (x, y, radius, force) => {
        managers.glassShatter.triggerShatter(x, y, force * 0.5);
      },
      onLevelComplete: (score) => {
        handleLevelComplete(levelName, score);
      }
    };

    lastTime = performance.now();

    // Instantiate the chosen level
    switch (levelName) {
    case 'colors':
      currentLevel = new ColorsLevel(canvas, ctx, managers, helpers);
      break;
    case 'shapes':
      currentLevel = new ShapesLevel(canvas, ctx, managers, helpers);
      break;
    case 'alphabet':
      currentLevel = new AlphabetLevel(canvas, ctx, managers, helpers);
      break;
    case 'numbers':
      currentLevel = new NumbersLevel(canvas, ctx, managers, helpers);
      break;
    case 'clcase':
      currentLevel = new ClCaseLevel(canvas, ctx, managers, helpers);
      break;
    case 'phonics':
      currentLevel = new PhonicsLevel(canvas, ctx, managers, helpers);
      break;
    default:
      currentLevel = new ColorsLevel(canvas, ctx, managers, helpers);
    }

    currentLevel.start();

    console.log('✅ Level started successfully');
    retryAttempts.startLevel = 0; // Reset retry counter on success
    // GameLoop is already running, no need to call loop()
  } catch (error) {
    console.error('❌ Error starting level:', error);
    retryAttempts.startLevel++;

    if (retryAttempts.startLevel >= MAX_RETRY_ATTEMPTS) {
      showFatalErrorScreen('Unable to start the level after multiple attempts.', error);
      return;
    }
    gameState = 'menu';

    // Check if showLevelMenu can still retry before calling it
    if (retryAttempts.showLevelMenu < MAX_RETRY_ATTEMPTS) {
      showLevelMenu();
    } else {
      handleCriticalFailure('Unable to start level or show level menu after multiple attempts');
    }
  }
}

// Show options menu
function showOptions() {
  const modal = document.getElementById('settings-modal');
  modal.innerHTML = `
    <div class="modal-background"></div>
    <div class="modal-content">
      <h2>Options</h2>
      <label>Display Mode:</label>
      <select id="display-mode-select">
        <option value="DEFAULT">Default</option>
        <option value="QBOARD">QBoard</option>
      </select>
      <label>Volume:</label>
      <input type="range" id="volume-range" min="0" max="1" step="0.01">
      <button id="save-options">Save</button>
      <button id="close-options">Close</button>
    </div>
  `;
  modal.style.display = 'block';

  const select = document.getElementById('display-mode-select');
  select.value = resourceManager.getDisplayMode();
  document.getElementById('volume-range').value = soundManager.volume;

  document.getElementById('save-options').addEventListener('click', () => {
    resourceManager.setDisplayMode(select.value);
    soundManager.setGlobalVolume(
      parseFloat(document.getElementById('volume-range').value)
    );
    modal.style.display = 'none';
  });
  document.getElementById('close-options').addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

function initializeManagers() {
  managers.hud = new HudManager(canvas, ctx);
  managers.checkpoint = new CheckpointManager(canvas, ctx);
  managers.flamethrower = new FlamethrowerManager(canvas, ctx, particleManager);
  managers.centerPiece = new CenterPieceManager(canvas, ctx, particleManager);
  managers.multiTouch = new MultiTouchManager(canvas);
  managers.glassShatter = new GlassShatterManager(canvas, ctx, particleManager);
  managers.particleManager = particleManager;
  managers.sound = soundManager;
}

function setupGlobalEventListeners() {
  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    switch (e.code) {
    case 'Space':
      e.preventDefault();
      if (gameState === 'playing') {
        togglePause();
      }
      break;
    case 'KeyR':
      if (gameState === 'gameOver' || gameState === 'paused') {
        restartGame();
      }
      break;
    case 'Escape':
      if (gameState === 'playing') {
        pauseGame();
      } else if (gameState === 'paused') {
        resumeGame();
      }
      break;
    }
  });

  // Prevent right-click context menu
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function togglePause() {
  if (gameState === 'playing') {
    pauseGame();
  } else if (gameState === 'paused') {
    resumeGame();
  }
}

function pauseGame() {
  if (gameState === 'playing') {
    gameState = 'paused';
    if (currentLevel) {
      currentLevel.pause();
    }
    managers.checkpoint.showCheckpoint('Game Paused');
  }
}

function resumeGame() {
  if (gameState === 'paused') {
    gameState = 'playing';
    if (currentLevel) {
      currentLevel.resume();
    }
  }
}

function restartGame() {
  gameState = 'playing';
  if (currentLevel) {
    currentLevel.reset();
    currentLevel.start();
  }
}

function cleanupGame() {
  // Cleanup current level
  if (currentLevel && typeof currentLevel.destroy === 'function') {
    currentLevel.destroy();
  }

  // Cleanup managers
  if (managers.input && typeof managers.input.destroy === 'function') {
    managers.input.destroy();
  }
  if (
    managers.multiTouch &&
    typeof managers.multiTouch.destroy === 'function'
  ) {
    managers.multiTouch.destroy();
  }
}

// Reset all retry counters (useful for manual resets or successful state transitions)
function resetRetryCounters() {
  retryAttempts.showLevelMenu = 0;
  retryAttempts.startLevel = 0;
  retryAttempts.initializeWelcomeScreen = 0;
  console.log('🔄 All retry counters reset');
}

// Handle critical failures when all retry attempts are exhausted
function handleCriticalFailure(message) {
  console.error('💥 CRITICAL FAILURE:', message);

  // Reset all retry counters
  resetRetryCounters();

  // Set game to a safe error state
  gameState = 'error';

  // Clean up any existing UI elements
  const menuContainer = document.getElementById('level-menu-container');
  if (menuContainer) {
    menuContainer.remove();
  }

  // Display error message to user
  const errorContainer = document.createElement('div');
  errorContainer.id = 'error-container';
  errorContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(139, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    color: white;
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 20px;
  `;

  errorContainer.innerHTML = `
    <h1>⚠️ Game Error</h1>
    <p style="font-size: 18px; margin: 20px 0;">${message}</p>
    <p style="font-size: 14px; margin: 20px 0;">Please refresh the page to restart the game.</p>
    <button onclick="window.location.reload()" style="
      padding: 15px 30px;
      font-size: 16px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 20px;
    ">Reload Game</button>
  `;

  document.body.appendChild(errorContainer);

  // Stop the game loop to prevent further issues
  if (gameLoop) {
    gameLoop.stop();
  }
}

function handleLevelComplete(levelName, score) {
  try {
    progressManager.completeLevel(levelName, score);
    gameState = 'completed';
    eventTracker.trackEvent('level', 'completed', { levelName, score });
    // Reset retry counters on successful level completion
    resetRetryCounters();

    // Clear any existing completion timer
    if (levelCompletionTimer) {
      clearTimeout(levelCompletionTimer);
      levelCompletionTimer = null;
    }

    // Calculate total possible score for this level
    let totalPossible = 1000; // Default
    if (levelName === 'colors') {
      totalPossible = 1700; // 17 targets * 100 points each
    } else if (['alphabet', 'numbers', 'clcase', 'shapes'].includes(levelName)) {
      totalPossible = 2600; // 26 letters/numbers * 100 points each
    }

    // Show completion screen
    if (!levelCompletionScreen) {
      levelCompletionScreen = new LevelCompletionScreen();
      levelCompletionScreen.setCallbacks(
        () => startLevel(levelName), // Restart current level
        () => showLevelMenu(), // Go to level menu
        () => showLevelMenu() // Back to menu
      );
    }

    levelCompletionScreen.show(levelName, score, totalPossible);

  } catch (error) {
    console.error('❌ Error handling level completion:', error);
    eventTracker.trackError(error, {
      context: 'handleLevelComplete',
      levelName,
      score,
    });
    showLevelMenu();
  }
}

window.addEventListener('resize', resizeCanvas);

// Game loop functions
function update(deltaTime) {
  try {
    if (gameState === 'playing' && currentLevel) {
      currentLevel.update(deltaTime);
    }

    // Update managers
    if (managers.centerPiece) managers.centerPiece.update(deltaTime);
    if (managers.flamethrower) managers.flamethrower.update(deltaTime);
    if (managers.glassShatter) managers.glassShatter.update(deltaTime);
    if (managers.hud) managers.hud.update(deltaTime);
    if (managers.checkpoint) managers.checkpoint.update(deltaTime);

    // Update particle count for performance monitoring
    if (managers.particleManager) {
      performanceMonitor.updateParticleCount(
        managers.particleManager.activeParticles || 0
      );
    }
  } catch (error) {
    eventTracker.trackError(error, {
      context: 'update_loop',
      gameState,
      currentLevel: currentLevelName,
      deltaTime,
    });
  }
}

function render() {
  const frameStartTime = performanceMonitor.frameStart();

  try {
    renderer.clear();

    if (gameState === 'playing' && currentLevel) {
      currentLevel.render();
    }

    // Render managers
    if (managers.centerPiece) managers.centerPiece.draw(ctx);
    if (managers.particleManager)
      managers.particleManager.updateAndDraw(
        ctx,
        gameLoop ? gameLoop.lastDeltaTime : 16
      );
    if (managers.flamethrower) managers.flamethrower.draw(ctx);
    if (managers.glassShatter) managers.glassShatter.draw(ctx);
    if (managers.hud) managers.hud.draw(ctx);
    if (managers.checkpoint) managers.checkpoint.draw(ctx);
  } catch (error) {
    eventTracker.trackError(error, {
      context: 'render_loop',
      gameState,
      currentLevel: currentLevelName,
    });
  }

  // Complete performance monitoring for this frame
  performanceMonitor.frameEnd(frameStartTime);
}

// Enhanced canvas setup with better error handling
function setupCanvas() {
  console.log('🔧 Setting up canvas...');

  // Get canvas element
  canvas = document.getElementById('game-canvas');
  if (!canvas) {
    throw new Error('Canvas element with id "game-canvas" not found!');
  }

  // Ensure canvas has proper dimensions
  if (!canvas.style.width && !canvas.style.height) {
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
  }

  // Initialize renderer
  renderer = new Renderer(canvas);
  ctx = renderer.ctx;

  if (!ctx) {
    throw new Error('Could not get 2D rendering context from canvas!');
  }

  console.log('✅ Canvas setup complete:', canvas.width, 'x', canvas.height);
  return true;
}

window.onload = async () => {
  console.log('🎮 Super Student: Starting initialization...');

  // Initialize event tracker first for comprehensive monitoring
  eventTracker.initialize();
  eventTracker.trackEvent('system', 'game_initialization_start');

  try {
    resizeCanvas();
    console.log('✓ Canvas resized');

    // Determine display settings
    displaySettings = getDisplaySettings();
    console.log('✓ Display settings loaded');

    // Initialize core managers
    resourceManager = new ResourceManager();
    particleManager = new ParticleManager(displaySettings.maxParticles);
    soundManager = new SoundManager();
    progressManager = new ProgressManager();
    console.log('✅ Core managers initialized');

    // Link particle manager to performance monitor for pool verification
    performanceMonitor.setParticleManager(particleManager);
    console.log('✅ Particle pool verification linked');

    // Setup input handler
    managers.input = new InputHandler(canvas);
    console.log('✅ Input handler setup');

    // Setup performance monitoring integration
    window.addEventListener('PerformanceLevelChanged', (event) => {
      const { level, settings } = event.detail;
      eventTracker.trackEvent('performance', 'adaptive_adjustment', {
        level,
        settings,
      });

      // Adjust particle system
      if (
        particleManager &&
        typeof particleManager.setPerformanceMode === 'function'
      ) {
        particleManager.setPerformanceMode(level);
      }

      // Adjust other systems as needed
      if (
        managers.particleManager &&
        typeof managers.particleManager.setPerformanceMode === 'function'
      ) {
        managers.particleManager.setPerformanceMode(level);
      }
    });
    console.log('✅ Performance monitoring integrated');

    let resources = {};
    try {
      resources = await resourceManager.initializeGameResources();
      console.log('✅ Resources loaded successfully');
      // Register preloaded audio with SoundManager
      if (resources.audio) {
        soundManager.sounds = resources.audio;
        // Set initial global volume
        soundManager.setGlobalVolume(soundManager.volume);
      }
    } catch (error) {
      console.error('⚠️ Failed to load resources:', error);
    }

    // Configure audio settings
    const audioConf = getAudioConfig();
    soundManager.setGlobalVolume(audioConf.masterVolume);
    console.log('✅ Audio configured');

    // Add display settings to managers
    managers.displaySettings = displaySettings;

    // Initialize and start game loop
    gameLoop = new GameLoop(update, render);
    gameLoop.start();
    console.log('✅ Game loop started');

    console.log('🎯 Showing welcome screen...');
    initializeWelcomeScreen();
    setupGlobalEventListeners();
    console.log('✅ Welcome screen should be visible now!');
  } catch (error) {
    console.error('❌ CRITICAL ERROR during initialization:', error);
    console.error('Stack trace:', error.stack);
  }
};

// Export initialization status for debugging
window.gameInitialized = () => isInitialized;

// Export startLevel function for global access
window.startLevel = startLevel;

import { getDisplaySettings } from "../config/displayModes.js";
import AlphabetLevel from "../game/levels/alphabetLevel.js";
import ClCaseLevel from "../game/levels/clCaseLevel.js";
import ColorsLevel from "../game/levels/colorsLevel.js";
import NumbersLevel from "../game/levels/numbersLevel.js";
import { PhonicsLevel } from "../game/levels/phonics/PhonicsLevel.js";
import ShapesLevel from "../game/levels/shapesLevel.js";
import CenterPieceManager from "../game/managers/centerPieceManager.js";
import CheckpointManager from "../game/managers/checkpointManager.js";
import FlamethrowerManager from "../game/managers/flamethrowerManager.js";
import GlassShatterManager from "../game/managers/glassShatterManager.js";
import HudManager from "../game/managers/hudManager.js";
import MultiTouchManager from "../game/managers/multiTouchManager.js";
import { InputHandler } from "../inputHandler.js";
import { LevelMenu } from "../ui/levelMenu.js";
import { WelcomeScreen } from "../ui/components/welcomeScreen.js";
import { eventTracker } from "../utils/eventTracker.js";
import { performanceMonitor } from "../utils/performanceMonitor.js";
import { getAudioConfig } from "./audio/audioConfig.js";
import SoundManager from "./audio/soundManager.js";
import { GameLoop } from "./engine/gameLoop.js";
import { Renderer } from "./engine/renderer.js";
import ParticleManager from "./graphics/particleSystem.js";
import ResourceManager from "./resources/resourceManager.js";

// Core rendering components
let canvas;
let renderer;
let ctx;

// System managers
let displaySettings;
let resourceManager;
let particleManager;
let soundManager;
let managers = {};

// Game state
let currentLevel = null;
let currentLevelName = "";
let gameState = "menu"; // menu, playing, paused, gameOver
let gameLoop;

// UI components
let welcomeScreen;

// Timing and lifecycle
let lastTime = 0;
let levelCompletionTimer = null;
let isInitialized = false;

// Circuit breaker to prevent infinite loops
let retryAttempts = {
  showLevelMenu: 0,
  startLevel: 0,
  initializeWelcomeScreen: 0,
};
const MAX_RETRY_ATTEMPTS = 3;

function resizeCanvas() {
  if (!renderer) {
    console.warn("Renderer not available for resize");
    return;
  }

  try {
    renderer.setupCanvas();
    eventTracker.trackEvent("system", "canvas_resized", { 
      width: canvas.width, 
      height: canvas.height 
    });

    // Update managers and level with new canvas size
    if (managers.hud) managers.hud.resize(renderer.canvas);
    if (managers.centerPiece) managers.centerPiece.resize(renderer.canvas);
    if (currentLevel && typeof currentLevel.resize === "function") {
      currentLevel.resize(renderer.canvas);
    }
  } catch (error) {
    eventTracker.trackError(error, { context: "canvas_resize" });
  }
}

// Initialize and show welcome screen with animated background
function initializeWelcomeScreen() {
  try {
    eventTracker.trackEvent("ui", "welcome_screen_init_start");

    // Create welcome screen instance
    welcomeScreen = new WelcomeScreen(canvas, ctx, resourceManager);

    // Set up callbacks
    welcomeScreen.onStartGame = () => {
      eventTracker.trackEvent("ui", "start_game_clicked");
      showLevelMenu();
    };

    welcomeScreen.onShowOptions = () => {
      eventTracker.trackEvent("ui", "options_clicked");
      // TODO: Implement options screen
      showLevelMenu(); // For now, just go to level menu
    };

    // Show the welcome screen
    welcomeScreen.show();
    gameState = "menu";

    // Reset retry counter on success
    retryAttempts.initializeWelcomeScreen = 0;
    eventTracker.trackEvent("ui", "welcome_screen_init_success");
  } catch (error) {
    eventTracker.trackError(error, { context: "welcome_screen_init" });
    retryAttempts.initializeWelcomeScreen++;

    if (retryAttempts.initializeWelcomeScreen < MAX_RETRY_ATTEMPTS) {
      console.log(
        `🔄 Retrying welcome screen initialization (attempt ${retryAttempts.initializeWelcomeScreen}/${MAX_RETRY_ATTEMPTS})`
      );
      setTimeout(() => initializeWelcomeScreen(), 1000);
    } else {
      console.error(
        "💥 Max retry attempts reached for welcome screen. Falling back to level menu."
      );
      // Only call showLevelMenu if we haven't exceeded its retry attempts
      if (retryAttempts.showLevelMenu < MAX_RETRY_ATTEMPTS) {
        showLevelMenu();
      } else {
        handleCriticalFailure(
          "Unable to initialize welcome screen or level menu"
        );
      }
    }
  }
}

// Show level selection menu
function showLevelMenu() {
  try {
    console.log("🎮 Showing level menu...");

    // Hide welcome screen if it is visible
    if (welcomeScreen) {
      welcomeScreen.hide();
    }

    // Remove any existing level-menu container to avoid duplicates
    let menuContainer = document.getElementById("level-menu-container");
    if (menuContainer) {
      menuContainer.remove();
    }

    // Build the level-menu container
    menuContainer = document.createElement("div");
    menuContainer.id = "level-menu-container";
    menuContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      color: white;
    `;
    document.body.appendChild(menuContainer);

    // Instantiate the actual menu component
    const menu = new LevelMenu("level-menu-container", startLevel);
    menu.show();
    gameState = "menu";

    // Success – reset retry counter
    retryAttempts.showLevelMenu = 0;
  } catch (error) {
    console.error("❌ Error showing level menu:", error);
    retryAttempts.showLevelMenu++;
    if (retryAttempts.showLevelMenu < MAX_RETRY_ATTEMPTS) {
      console.log(
        `🔄 Retrying level menu display (attempt ${retryAttempts.showLevelMenu}/${MAX_RETRY_ATTEMPTS})`
      );
      setTimeout(showLevelMenu, 1000);
    } else {
      console.error(
        "💥 Max retry attempts reached for level menu. Attempting fallback to colors level."
      );
      if (retryAttempts.startLevel < MAX_RETRY_ATTEMPTS) {
        startLevel("colors");
      } else {
        handleCriticalFailure(
          "Unable to show level menu or start fallback level"
        );
      }
    }
  }
}

// Start the selected level
function startLevel(levelName) {
  try {
    console.log(`🎯 Starting level: ${levelName}`);

    // Cancel any pending completion timers
    if (levelCompletionTimer) {
      clearTimeout(levelCompletionTimer);
      levelCompletionTimer = null;
    }

    // Remove the menu container if it is present
    const menuContainer = document.getElementById("level-menu-container");
    if (menuContainer) {
      menuContainer.remove();
    }

    gameState = "playing";
    currentLevelName = levelName;
    initializeManagers();

    const helpers = {
      createExplosion: (x, y, color, intensity) => {
        const count = Math.floor(20 * intensity);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          particleManager.createParticle(
            x,
            y,
            color,
            2 + Math.random() * 3,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            500 + Math.random() * 1000
          );
        }
      },
      applyExplosionEffect: (x, y, radius, force) => {
        managers.glassShatter.triggerShatter(x, y, force * 0.5);
      },
      onLevelComplete: (score) => {
        handleLevelComplete(levelName, score);
      },
    };

    lastTime = performance.now();

    switch (levelName) {
      case "colors":
        currentLevel = new ColorsLevel(canvas, ctx, managers, helpers);
        break;
      case "shapes":
        currentLevel = new ShapesLevel(canvas, ctx, managers, helpers);
        break;
      case "alphabet":
        currentLevel = new AlphabetLevel(canvas, ctx, managers, helpers);
        break;
      case "numbers":
        currentLevel = new NumbersLevel(canvas, ctx, managers, helpers);
        break;
      case "clcase":
        currentLevel = new ClCaseLevel(canvas, ctx, managers, helpers);
        break;
      case "phonics":
        currentLevel = new PhonicsLevel(canvas, ctx, managers, helpers);
        break;
      default:
        currentLevel = new ColorsLevel(canvas, ctx, managers, helpers);
        break;
    }

    currentLevel.start();
    retryAttempts.startLevel = 0;
    console.log(`✅ Level ${levelName} started successfully`);
  } catch (error) {
    console.error(`❌ Error starting level ${levelName}:`, error);
    retryAttempts.startLevel++;
    if (retryAttempts.startLevel < MAX_RETRY_ATTEMPTS) {
      setTimeout(() => startLevel(levelName), 1000);
    } else {
      console.error(
        "💥 Max retry attempts reached for starting level. Reverting to menu."
      );
      gameState = "menu";
      if (retryAttempts.showLevelMenu < MAX_RETRY_ATTEMPTS) {
        showLevelMenu();
      } else {
        handleCriticalFailure(
          `Unable to start level ${levelName} or return to menu`
        );
      }
    }
  }
}

// Show options menu
function showOptions() {
  try {
    let modal = document.getElementById("settings-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "settings-modal";
      document.body.appendChild(modal);
    }

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
    modal.style.display = "block";

    const select = document.getElementById("display-mode-select");
    select.value = resourceManager.getDisplayMode();
    document.getElementById("volume-range").value = soundManager.volume;

    document.getElementById("save-options").addEventListener("click", () => {
      resourceManager.setDisplayMode(select.value);
      soundManager.setGlobalVolume(
        parseFloat(document.getElementById("volume-range").value)
      );
      modal.style.display = "none";
    });
    document.getElementById("close-options").addEventListener("click", () => {
      modal.style.display = "none";
    });
  } catch (error) {
    console.error("❌ Error showing options:", error);
  }
}

function initializeManagers() {
  try {
    console.log("🔧 Initializing managers...");
    managers.hud = new HudManager(canvas, ctx);
    managers.checkpoint = new CheckpointManager(canvas, ctx);
    managers.flamethrower = new FlamethrowerManager(
      canvas,
      ctx,
      particleManager
    );
    managers.centerPiece = new CenterPieceManager(canvas, ctx, particleManager);
    managers.multiTouch = new MultiTouchManager(canvas);
    managers.glassShatter = new GlassShatterManager(
      canvas,
      ctx,
      particleManager
    );
    managers.particleManager = particleManager;
    managers.sound = soundManager;
    console.log("✅ Managers initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing managers:", error);
  }
}

function setupGlobalEventListeners() {
  // Keyboard controls
  window.addEventListener("keydown", (e) => {
    try {
      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (gameState === "playing") {
            togglePause();
          }
          break;
        case "KeyR":
          if (gameState === "gameOver" || gameState === "paused") {
            restartGame();
          }
          break;
        case "Escape":
          if (gameState === "playing") {
            pauseGame();
          } else if (gameState === "paused") {
            resumeGame();
          }
          break;
      }
    } catch (error) {
      console.error("❌ Error handling keyboard event:", error);
    }
  });

  // Prevent right-click context menu
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
}

function togglePause() {
  if (gameState === "playing") {
    pauseGame();
  } else if (gameState === "paused") {
    resumeGame();
  }
}

function pauseGame() {
  if (gameState === "playing") {
    gameState = "paused";
    if (currentLevel) {
      currentLevel.pause();
    }
    managers.checkpoint.showCheckpoint("Game Paused");
  }
}

function resumeGame() {
  if (gameState === "paused") {
    gameState = "playing";
    if (currentLevel) {
      currentLevel.resume();
    }
  }
}

function restartGame() {
  gameState = "playing";
  if (currentLevel) {
    currentLevel.reset();
    currentLevel.start();
  }
}

function cleanupGame() {
  // Cleanup current level
  if (currentLevel && typeof currentLevel.destroy === "function") {
    currentLevel.destroy();
  }

  // Cleanup managers
  if (managers.input && typeof managers.input.destroy === "function") {
    managers.input.destroy();
  }
  if (
    managers.multiTouch &&
    typeof managers.multiTouch.destroy === "function"
  ) {
    managers.multiTouch.destroy();
  }
}

// Reset all retry counters (useful for manual resets or successful state transitions)
function resetRetryCounters() {
  retryAttempts.showLevelMenu = 0;
  retryAttempts.startLevel = 0;
  retryAttempts.initializeWelcomeScreen = 0;
  eventTracker.trackEvent("system", "retry_counters_reset");
}

// Handle critical failures when all retry attempts are exhausted
function handleCriticalFailure(message) {
  console.error("💥 CRITICAL FAILURE:", message);

  // Reset all retry counters
  resetRetryCounters();

  // Set game to a safe error state
  gameState = "error";

  // Clean up any existing UI elements
  const menuContainer = document.getElementById("level-menu-container");
  if (menuContainer) {
    menuContainer.remove();
  }

  // Display error message to user
  const errorContainer = document.createElement("div");
  errorContainer.id = "error-container";
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
    console.log(`Level ${levelName} completed with score: ${score}`);
    gameState = "completed";

    resetRetryCounters();

    if (levelCompletionTimer) {
      clearTimeout(levelCompletionTimer);
      levelCompletionTimer = null;
    }

    managers.checkpoint.showCheckpoint(
      `Level Complete!<br>Score: ${score}<br>Next level unlocked!`
    );

    levelCompletionTimer = setTimeout(() => {
      if (gameState === "completed") {
        showLevelMenu();
      }
      levelCompletionTimer = null;
    }, 3000);
  } catch (error) {
    eventTracker.trackError(error, { context: "level_completion" });
    showLevelMenu();
  }
}

// Game loop functions
function update(deltaTime) {
  try {
    if (gameState === "playing" && currentLevel) {
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
      context: "update_loop",
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

    if (gameState === "playing" && currentLevel) {
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
      context: "render_loop",
      gameState,
      currentLevel: currentLevelName,
    });
  }

  // Complete performance monitoring for this frame
  performanceMonitor.frameEnd(frameStartTime);
}

// Enhanced canvas setup with better error handling
function setupCanvas() {
  console.log("� Setting up canvas...");

  // Get canvas element
  canvas = document.getElementById("game-canvas");
  if (!canvas) {
    throw new Error('Canvas element with id "game-canvas" not found!');
  }

  // Ensure canvas has proper dimensions
  if (!canvas.style.width && !canvas.style.height) {
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
  }

  // Initialize renderer
  renderer = new Renderer(canvas);
  ctx = renderer.ctx;

  if (!ctx) {
    throw new Error("Could not get 2D rendering context from canvas!");
  }

  console.log("✅ Canvas setup complete:", canvas.width, "x", canvas.height);
  return true;
}

window.addEventListener("resize", resizeCanvas);

window.onload = async () => {
  console.log("🎮 Super Student: Starting initialization...");

  try {
    // Initialize event tracker first for comprehensive monitoring
    eventTracker.initialize();
    eventTracker.trackEvent("system", "game_initialization_start");

    // Setup canvas and renderer first
    setupCanvas();

    resizeCanvas();
    console.log("✅ Canvas resized");

    // Determine display settings
    displaySettings = getDisplaySettings();
    console.log("✅ Display settings loaded:", displaySettings);

    // Initialize core managers
    console.log("⚙️ Initializing core managers...");
    resourceManager = new ResourceManager();
    particleManager = new ParticleManager(displaySettings.maxParticles);
    soundManager = new SoundManager();
    console.log("✅ Core managers initialized");

    // Link particle manager to performance monitor for pool verification
    performanceMonitor.setParticleManager(particleManager);
    console.log("✅ Particle pool verification linked");

    // Setup input handler
    managers.input = new InputHandler(canvas);
    console.log("✅ Input handler setup");

    // Load resources with enhanced error handling
    let resources = {};
    try {
      console.log("📦 Loading game resources...");
      resources = await resourceManager.initializeGameResources();
      console.log("✅ Resources loaded successfully");

      // Register preloaded audio with SoundManager
      if (resources.audio && Object.keys(resources.audio).length > 0) {
        soundManager.sounds = resources.audio;
        console.log("🔊 Audio resources registered with SoundManager");
      }
    } catch (error) {
      console.warn(
        "⚠️ Some resources failed to load, continuing with defaults:",
        error
      );
    }

    // Configure audio settings
    try {
      const audioConf = getAudioConfig();
      soundManager.setGlobalVolume(audioConf.masterVolume);
      console.log("✅ Audio configured");
    } catch (error) {
      console.warn("⚠️ Audio configuration failed:", error);
    }

    // Add display settings to managers
    managers.displaySettings = displaySettings;

    // Setup performance monitoring integration
    window.addEventListener("PerformanceLevelChanged", (event) => {
      const { level, settings } = event.detail;
      eventTracker.trackEvent("performance", "adaptive_adjustment", {
        level,
        settings,
      });

      // Adjust particle system
      if (
        particleManager &&
        typeof particleManager.setPerformanceMode === "function"
      ) {
        particleManager.setPerformanceMode(level);
      }

      // Adjust other systems as needed
      if (
        managers.particleManager &&
        typeof managers.particleManager.setPerformanceMode === "function"
      ) {
        managers.particleManager.setPerformanceMode(level);
      }
    });
    console.log("✅ Performance monitoring integrated");

    // Initialize and start game loop
    console.log("🔄 Starting game loop...");
    gameLoop = new GameLoop(update, render);
    gameLoop.start();
    console.log("✅ Game loop started");

    // Setup event listeners
    setupGlobalEventListeners();
    console.log("✅ Event listeners setup");

    // Show welcome screen
    console.log("🎯 Initializing welcome screen...");
    initializeWelcomeScreen();

    // Mark as initialized
    isInitialized = true;
    console.log("🎉 Game initialization complete!");
  } catch (error) {
    console.error("❌ CRITICAL ERROR during initialization:", error);
    console.error("Stack trace:", error.stack);

    // Try to show a fallback interface
    try {
      document.body.innerHTML = `
        <div style="color: white; background: #222; padding: 20px; font-family: Arial;">
          <h1>Game Initialization Error</h1>
          <p>There was an error starting the game: ${error.message}</p>
          <p>Please refresh the page to try again.</p>
          <button onclick="location.reload()">Refresh Page</button>
        </div>
      `;
    } catch (fallbackError) {
      console.error("❌ Even fallback interface failed:", fallbackError);
    }
  }
};

// Export initialization status for debugging
window.gameInitialized = () => isInitialized;

import { getAudioConfig } from "../config/audioConfig.js";
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
import { ProgressManager } from "../game/managers/progressManager.js";
import { InputHandler } from "../inputHandler.js";
import { LevelMenu } from "../ui/levelMenu.js";
import { eventTracker } from "../utils/eventTracker.js";
import { performanceMonitor } from "../utils/performanceMonitor.js";
import SoundManager from "./audio/soundManager.js";
import { GameLoop } from "./engine/gameLoop.js";
import { Renderer } from "./engine/renderer.js";
import ParticleManager from "./graphics/particleSystem.js";
import ResourceManager from "./resources/resourceManager.js";

const canvas = document.getElementById("game-canvas");
const renderer = new Renderer(canvas);
const ctx = renderer.ctx;

// Current display-specific settings
let displaySettings;
let resourceManager;
let particleManager;
let soundManager;
let progressManager;
let managers = {};
let currentLevel = null;
let currentLevelName = "";
let gameState = "menu"; // menu, playing, paused, gameOver
let lastTime = 0;
let gameLoop;

function resizeCanvas() {
  renderer.setupCanvas();
  // Update managers and level with new canvas size
  if (managers.hud) managers.hud.resize(renderer.canvas);
  if (managers.centerPiece) managers.centerPiece.resize(renderer.canvas);
  if (currentLevel && typeof currentLevel.resize === "function") {
    currentLevel.resize(renderer.canvas);
  }
}

// Show welcome screen with start and options
function showWelcomeScreen() {
  console.log("🏠 showWelcomeScreen() called");
  const welcome = document.getElementById("welcome-screen");
  console.log("🏠 Welcome element found:", welcome);

  if (!welcome) {
    console.error("❌ CRITICAL: welcome-screen element not found in DOM!");
    return;
  }

  console.log("🏠 Setting welcome screen HTML...");
  welcome.innerHTML = `
    <h1>Super Student</h1>
    <p>Train your brain with fun puzzles</p>
    <p>Click 'Start Game' to begin</p>
    <button class="welcome-button" id="start-button">Start Game</button>
    <button class="welcome-button" id="options-button">Options</button>
    <footer>v1.0 — Developed by YourName</footer>
  `;

  // Make sure it's visible
  welcome.style.display = "flex";
  console.log("🏠 Welcome screen display set to flex");

  const startBtn = document.getElementById("start-button");
  const optionsBtn = document.getElementById("options-button");

  console.log("🏠 Start button found:", startBtn);
  console.log("🏠 Options button found:", optionsBtn);

  if (startBtn) {
    startBtn.addEventListener("click", showLevelMenu);
    console.log("🏠 Start button event listener added");
  }

  if (optionsBtn) {
    optionsBtn.addEventListener("click", showOptions);
    console.log("🏠 Options button event listener added");
  }

  console.log("🏠 Welcome screen setup complete!");
}

// Show level selection menu
function showLevelMenu() {
  const welcome = document.getElementById("welcome-screen");
  welcome.innerHTML = "";
  welcome.style.display = "flex";
  const menu = new LevelMenu("welcome-screen", startLevel);
  menu.show();
}

// Start the selected level
function startLevel(levelName) {
  eventTracker.trackEvent("level", "start_attempt", { levelName });

  if (!progressManager.isLevelUnlocked(levelName)) {
    eventTracker.trackEvent("level", "start_blocked", {
      levelName,
      reason: "locked",
    });
    alert("This level is locked. Complete previous levels to unlock it.");
    return;
  }

  document.getElementById("welcome-screen").style.display = "none";
  const previousState = gameState;
  gameState = "playing";
  eventTracker.trackState("gameState", gameState, previousState);

  currentLevelName = levelName;
  eventTracker.trackState("currentLevel", levelName);

  initializeManagers();

  // Define common helpers for levels
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
    },
  };

  lastTime = performance.now();

  // Choose level class based on name
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
  }

  currentLevel.start();
  // GameLoop is already running, no need to call loop()
}

// Show options menu
function showOptions() {
  const modal = document.getElementById("settings-modal");
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
  window.addEventListener("keydown", (e) => {
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

function handleLevelComplete(levelName, score) {
  progressManager.completeLevel(levelName, score);
  gameState = "completed";

  // Show completion celebration
  managers.checkpoint.showCheckpoint(
    `Level Complete!<br>Score: ${score}<br>Next level unlocked!`
  );

  setTimeout(() => {
    showLevelMenu();
  }, 3000);
}

window.addEventListener("resize", resizeCanvas);

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

window.onload = async () => {
  console.log("🎮 Super Student: Starting initialization...");

  // Initialize event tracker first for comprehensive monitoring
  eventTracker.initialize();
  eventTracker.trackEvent("system", "game_initialization_start");

  try {
    resizeCanvas();
    console.log("✓ Canvas resized");

    // Determine display settings
    displaySettings = getDisplaySettings();
    console.log("✓ Display settings loaded");

    // Initialize core managers
    resourceManager = new ResourceManager();
    particleManager = new ParticleManager(displaySettings.maxParticles);
    soundManager = new SoundManager();
    progressManager = new ProgressManager();
    console.log("✅ Core managers initialized");

    // Link particle manager to performance monitor for pool verification
    performanceMonitor.setParticleManager(particleManager);
    console.log("✅ Particle pool verification linked");

    // Setup input handler
    managers.input = new InputHandler(canvas);
    console.log("✅ Input handler setup");

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

    let resources = {};
    try {
      resources = await resourceManager.initializeGameResources();
      console.log("✅ Resources loaded successfully");
      // Register preloaded audio with SoundManager
      if (resources.audio) {
        soundManager.sounds = resources.audio;
        // Set initial global volume
        soundManager.setGlobalVolume(soundManager.volume);
      }
    } catch (error) {
      console.error("⚠️ Failed to load resources:", error);
    }

    // Configure audio settings
    const audioConf = getAudioConfig();
    soundManager.setGlobalVolume(audioConf.masterVolume);
    console.log("✅ Audio configured");

    // Add display settings to managers
    managers.displaySettings = displaySettings;

    // Initialize and start game loop
    gameLoop = new GameLoop(update, render);
    gameLoop.start();
    console.log("✅ Game loop started");

    console.log("🎯 Showing welcome screen...");
    showWelcomeScreen();
    setupGlobalEventListeners();
    console.log("✅ Welcome screen should be visible now!");
  } catch (error) {
    console.error("❌ CRITICAL ERROR during initialization:", error);
    console.error("Stack trace:", error.stack);
  }
};

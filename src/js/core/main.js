import { GAME_CONFIG } from '../config/constants.js';
import CenterPieceManager from '../game/managers/centerPieceManager.js';
import CheckpointManager from '../game/managers/checkpointManager.js';
import FlamethrowerManager from '../game/managers/flamethrowerManager.js';
import GlassShatterManager from '../game/managers/glassShatterManager.js';
import HudManager from '../game/managers/hudManager.js';
import MultiTouchManager from '../game/managers/multiTouchManager.js';
import { ProgressManager } from '../game/managers/progressManager.js';
import { LevelMenu } from '../ui/components/levelMenu.js';
import { LevelCompletionScreen } from '../ui/components/levelCompletionScreen.js';
import { eventTracker } from '../utils/eventTracker.js';
import { loadLevelModule } from '../utils/lazyLevelLoader.js';
import { performanceMonitor } from '../utils/performanceMonitor.js';
import { getAudioConfig } from './audio/audioConfig.js';
import SoundManager from './audio/soundManager.js';
import { GameLoop } from './engine/gameLoop.js';
import { Renderer } from './engine/renderer.js';
import ParticleManager from './graphics/particleSystem.js';

const LEVEL_COMPLETION_DELAY_MS = 3000;
const MAX_RETRY_ATTEMPTS = 3;
const LEVEL_SEQUENCE = ['colors', 'shapes', 'alphabet', 'numbers', 'clcase', 'phonics'];

function getE2EConfig() {
  const query = new URLSearchParams(window.location.search);
  const queryEnabled = query.get('e2e') === '1';
  const storedEnabled = localStorage.getItem('superstudent_e2e') === '1';
  const enabled = queryEnabled || storedEnabled;

  return {
    enabled,
    speedMultiplier: enabled ? 0.25 : 1,
    deterministicSeed: query.get('seed') || 'superstudent-e2e'
  };
}

function resolveDisplaySettings(resourceManager) {
  const displayMode = resourceManager?.getDisplayMode?.() || GAME_CONFIG.DEFAULT_MODE;

  return {
    mode: displayMode,
    maxParticles: GAME_CONFIG.MAX_PARTICLES[displayMode] || GAME_CONFIG.MAX_PARTICLES[GAME_CONFIG.DEFAULT_MODE]
  };
}

function applyDisplaySettings(runtime) {
  runtime.displaySettings = resolveDisplaySettings(runtime.resourceManager);
  runtime.managers.displaySettings = runtime.displaySettings;

  if (runtime.particleManager) {
    runtime.particleManager.maxParticles = runtime.displaySettings.maxParticles;
  }
}

export class SuperStudentRuntime {
  constructor({ canvas, resourceManager } = {}) {
    this.canvas = canvas || document.getElementById('game-canvas');
    this.ctx = this.canvas?.getContext('2d') || null;
    this.resourceManager = resourceManager;
    this.renderer = null;
    this.displaySettings = null;
    this.particleManager = null;
    this.soundManager = null;
    this.gameLoop = null;
    this.currentLevel = null;
    this.currentLevelName = '';
    this.gameState = 'menu';
    this.levelCompletionScreen = null;
    this.levelCompletionTimer = null;
    this.progressManager = new ProgressManager();
    this.isInitialized = false;
    this.retryAttempts = {
      showLevelMenu: 0,
      startLevel: 0
    };
    this.e2eConfig = getE2EConfig();
    this.performanceListener = null;
    this.boundKeydownHandler = this.handleGlobalKeydown.bind(this);
    this.boundGameLoopErrorHandler = this.handleGameLoopError.bind(this);
    this.boundViewportResizeHandler = this.handleViewportResize.bind(this);

    this.managers = {};
  }

  async initialize() {
    if (this.isInitialized) {
      return this;
    }

    if (!this.canvas) {
      throw new Error('Canvas element with id "game-canvas" not found');
    }

    this.renderer = new Renderer(this.canvas);
    this.ctx = this.renderer.ctx;
    applyDisplaySettings(this);
    this.particleManager = new ParticleManager(this.displaySettings.maxParticles);
    this.soundManager = new SoundManager();
    performanceMonitor.setParticleManager(this.particleManager);

    const audioConfig = getAudioConfig();
    this.soundManager.setGlobalVolume(audioConfig.masterVolume);

    this.managers.displaySettings = this.displaySettings;
    this.managers.particleManager = this.particleManager;
    this.managers.sound = this.soundManager;
    this.managers.runtime = this;

    this.attachRuntimeListeners();

    this.gameLoop = new GameLoop(
      (deltaTime) => this.update(deltaTime),
      () => this.render()
    );
    this.gameLoop.start();

    this.isInitialized = true;
    this.syncPublicApi();
    this.handleViewportResize();
    eventTracker.trackEvent('system', 'runtime_initialized', {
      entry: 'src/js/core/main.js',
      e2eMode: this.e2eConfig.enabled
    });

    return this;
  }

  attachRuntimeListeners() {
    if (!this.performanceListener) {
      this.performanceListener = (event) => {
        const { level, settings } = event.detail;
        eventTracker.trackEvent('performance', 'adaptive_adjustment', {
          level,
          settings
        });

        if (this.particleManager && typeof this.particleManager.setPerformanceMode === 'function') {
          this.particleManager.setPerformanceMode(level);
        }
      };
      window.addEventListener('PerformanceLevelChanged', this.performanceListener);
    }

    window.addEventListener('keydown', this.boundKeydownHandler);
    window.addEventListener('GameLoopError', this.boundGameLoopErrorHandler);
  }

  syncPublicApi() {
    const api = this.getPublicApi();
    window.__superStudentRuntime = api;
    window.__superStudentTestMode = this.e2eConfig;
    window.gameInitialized = () => this.isInitialized;
    window.startLevel = (levelName) => this.startLevel(levelName);
  }

  getPublicApi() {
    return {
      showLevelMenu: () => this.showLevelMenu(),
      showOptions: () => this.showOptions(),
      startLevel: (levelName) => this.startLevel(levelName),
      forceCompleteCurrentLevel: () => this.forceCompleteCurrentLevel(),
      getStateSnapshot: () => this.getStateSnapshot(),
      getLevelSnapshot: () => this.currentLevel?.getTestSnapshot?.() || null,
      isE2EMode: () => this.e2eConfig.enabled,
      speedMultiplier: this.e2eConfig.speedMultiplier,
      seed: this.e2eConfig.deterministicSeed
    };
  }

  getStateSnapshot() {
    return {
      isInitialized: this.isInitialized,
      gameState: this.gameState,
      currentLevelName: this.currentLevelName,
      menuVisible: Boolean(document.getElementById('level-menu-container')),
      completionVisible: Boolean(document.getElementById('completion-screen')),
      loadingVisible: Boolean(document.getElementById('level-loading-overlay')),
      errorVisible: Boolean(document.getElementById('error-container')),
      e2eMode: this.e2eConfig.enabled
    };
  }

  handleViewportResize() {
    if (!this.renderer) {
      return;
    }

    try {
      this.renderer.setupCanvas();

      if (this.managers.hud) {
        this.managers.hud.resize(this.renderer.canvas);
      }
      if (this.managers.centerPiece) {
        this.managers.centerPiece.resize(this.renderer.canvas);
      }
      if (this.currentLevel && typeof this.currentLevel.resize === 'function') {
        this.currentLevel.resize(this.renderer.canvas);
      }
    } catch (error) {
      eventTracker.trackError(error, { context: 'canvas_resize' });
    }
  }

  handleGlobalKeydown(event) {
    try {
      switch (event.code) {
      case 'Space':
        event.preventDefault();
        if (this.gameState === 'playing') {
          this.togglePause();
        }
        break;
      case 'KeyR':
        if (this.gameState === 'gameOver' || this.gameState === 'paused') {
          this.restartGame();
        }
        break;
      case 'Escape':
        if (this.gameState === 'playing') {
          this.pauseGame();
        } else if (this.gameState === 'paused') {
          this.resumeGame();
        }
        break;
      }
    } catch (error) {
      eventTracker.trackError(error, { context: 'keyboard_input' });
    }
  }

  handleGameLoopError(event) {
    const detail = event?.detail instanceof Error ? event.detail : new Error('Unknown game loop error');
    this.handleCriticalFailure(detail.message, detail);
  }

  resetRetryCounters() {
    this.retryAttempts.showLevelMenu = 0;
    this.retryAttempts.startLevel = 0;
  }

  clearLevelCompletionTimer() {
    if (this.levelCompletionTimer) {
      clearTimeout(this.levelCompletionTimer);
      this.levelCompletionTimer = null;
    }
  }

  clearLevelMenu() {
    const menuContainer = document.getElementById('level-menu-container');
    if (menuContainer) {
      menuContainer.remove();
    }
  }

  ensureMenuContainer() {
    this.clearLevelMenu();

    const menuContainer = document.createElement('div');
    menuContainer.id = 'level-menu-container';
    menuContainer.dataset.testid = 'level-menu-container';
    menuContainer.style.cssText = `
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

    document.body.appendChild(menuContainer);
    return menuContainer;
  }

  initializeManagers() {
    this.managers.hud = new HudManager(this.canvas, this.ctx);
    this.managers.checkpoint = new CheckpointManager(this.canvas, this.ctx);
    this.managers.flamethrower = new FlamethrowerManager(this.canvas, this.ctx, this.particleManager);
    this.managers.centerPiece = new CenterPieceManager(this.canvas, this.ctx, this.particleManager);
    this.managers.multiTouch = new MultiTouchManager(this.canvas);
    this.managers.glassShatter = new GlassShatterManager(this.canvas, this.ctx, this.particleManager);
    this.managers.particleManager = this.particleManager;
    this.managers.sound = this.soundManager;
  }

  showLevelMenu() {
    try {
      applyDisplaySettings(this);
      this.clearLevelCompletionTimer();
      if (this.levelCompletionScreen) {
        this.levelCompletionScreen.hide();
      }

      const container = this.ensureMenuContainer();
      const menu = new LevelMenu('level-menu-container', (levelName) => this.startLevel(levelName));
      menu.show();
      this.gameState = 'menu';
      this.resetRetryCounters();
      this.syncPublicApi();
      eventTracker.trackEvent('ui', 'level_menu_shown');
      return container;
    } catch (error) {
      eventTracker.trackError(error, { context: 'show_level_menu' });
      this.retryAttempts.showLevelMenu += 1;

      if (this.retryAttempts.showLevelMenu < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => this.showLevelMenu(), 500);
        return null;
      }

      this.handleCriticalFailure('Unable to show the level menu.', error);
      return null;
    }
  }

  async startLevel(levelName) {
    try {
      applyDisplaySettings(this);
      this.clearLevelCompletionTimer();
      this.clearLevelMenu();
      if (this.levelCompletionScreen) {
        this.levelCompletionScreen.hide();
      }

      if (this.currentLevel && typeof this.currentLevel.cleanup === 'function') {
        this.currentLevel.cleanup();
      }

      this.gameState = 'loading';
      this.currentLevelName = levelName;
      eventTracker.trackState('currentLevel', levelName);

      const LevelClass = await loadLevelModule(levelName);
      this.initializeManagers();

      const helpers = {
        createExplosion: (x, y, color, intensity) => {
          const count = Math.floor(20 * intensity);
          for (let index = 0; index < count; index += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particleManager.createParticle(
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
        applyExplosionEffect: (x, y, _radius, force) => {
          if (this.managers.glassShatter) {
            this.managers.glassShatter.triggerShatter(x, y, force * 0.5);
          }
        },
        applyScreenShake: () => {},
        onLevelComplete: (score) => {
          this.handleLevelComplete(levelName, score);
        }
      };

      this.currentLevel = new LevelClass(this.canvas, this.ctx, this.managers, helpers);
      this.gameState = 'playing';
      this.syncPublicApi();
      await this.currentLevel.start();
      this.retryAttempts.startLevel = 0;
      eventTracker.trackEvent('level', 'start_success', { levelName });
      return this.currentLevel;
    } catch (error) {
      eventTracker.trackError(error, { context: 'start_level', levelName });
      this.retryAttempts.startLevel += 1;

      if (this.retryAttempts.startLevel < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => this.startLevel(levelName), 500);
        return null;
      }

      this.handleCriticalFailure(`Unable to start the ${levelName} level.`, error);
      return null;
    }
  }

  showOptions() {
    try {
      let modal = document.getElementById('settings-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'settings-modal';
        document.body.appendChild(modal);
      }

      modal.dataset.testid = 'settings-modal';
      modal.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-content">
          <h2>Options</h2>
          <label for="display-mode-select">Display Mode:</label>
          <select id="display-mode-select">
            <option value="DEFAULT">Default</option>
            <option value="QBOARD">QBoard</option>
          </select>
          <label for="volume-range">Volume:</label>
          <input type="range" id="volume-range" min="0" max="1" step="0.01">
          <button id="save-options">Save</button>
          <button id="close-options">Close</button>
        </div>
      `;
      modal.style.display = 'block';

      const displayModeSelect = modal.querySelector('#display-mode-select');
      const volumeRange = modal.querySelector('#volume-range');
      displayModeSelect.value = this.resourceManager?.getDisplayMode?.() || 'DEFAULT';
      volumeRange.value = this.soundManager?.volume ?? 1;

      modal.querySelector('#save-options').addEventListener('click', () => {
        this.resourceManager?.setDisplayMode?.(displayModeSelect.value);
        applyDisplaySettings(this);
        this.soundManager?.setGlobalVolume(Number.parseFloat(volumeRange.value));
        modal.style.display = 'none';
      });
      modal.querySelector('#close-options').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      eventTracker.trackEvent('ui', 'options_shown');
    } catch (error) {
      eventTracker.trackError(error, { context: 'show_options' });
    }
  }

  getLevelTotalPossible(levelName) {
    if (levelName === 'colors') {
      return 1700;
    }

    if (['alphabet', 'numbers', 'clcase', 'shapes'].includes(levelName)) {
      return 2600;
    }

    if (levelName === 'phonics') {
      return 1500;
    }

    return 1000;
  }

  getNextLevelName(levelName) {
    const currentIndex = LEVEL_SEQUENCE.indexOf(levelName);

    if (currentIndex === -1 || currentIndex === LEVEL_SEQUENCE.length - 1) {
      return null;
    }

    return LEVEL_SEQUENCE[currentIndex + 1];
  }

  handleLevelComplete(levelName, score) {
    try {
      this.gameState = 'completed';
      this.resetRetryCounters();
      this.clearLevelCompletionTimer();

      if (this.managers.checkpoint) {
        this.managers.checkpoint.showCheckpoint(
          `Level Complete!<br>Score: ${score}<br>Next adventure unlocked!`
        );
      }

      this.progressManager.completeLevel(levelName, score);

      if (!this.e2eConfig.enabled) {
        this.levelCompletionTimer = setTimeout(() => {
          if (this.gameState === 'completed') {
            this.showLevelMenu();
          }
          this.levelCompletionTimer = null;
        }, LEVEL_COMPLETION_DELAY_MS * this.e2eConfig.speedMultiplier);
      }

      if (!this.levelCompletionScreen) {
        this.levelCompletionScreen = new LevelCompletionScreen();
      }

      const nextLevelName = this.getNextLevelName(levelName);
      this.levelCompletionScreen.setCallbacks(
        () => this.startLevel(levelName),
        () => (nextLevelName ? this.startLevel(nextLevelName) : this.showLevelMenu()),
        () => this.showLevelMenu()
      );
      this.levelCompletionScreen.show(levelName, score, this.getLevelTotalPossible(levelName));
      this.syncPublicApi();
      eventTracker.trackEvent('level', 'completed', { levelName, score });
    } catch (error) {
      eventTracker.trackError(error, { context: 'level_completion', levelName });
      this.showLevelMenu();
    }
  }

  forceCompleteCurrentLevel() {
    if (!this.currentLevel) {
      return false;
    }

    if (typeof this.currentLevel.completeLevel === 'function') {
      this.currentLevel.completeLevel();
      return true;
    }

    if (typeof this.currentLevel.end === 'function') {
      this.currentLevel.end();
      return true;
    }

    return false;
  }

  update(deltaTime) {
    try {
      if (this.gameState === 'playing' && this.currentLevel) {
        this.currentLevel.update(deltaTime);
      }

      if (this.managers.centerPiece) this.managers.centerPiece.update(deltaTime);
      if (this.managers.flamethrower) this.managers.flamethrower.update(deltaTime);
      if (this.managers.glassShatter) this.managers.glassShatter.update(deltaTime);
      if (this.managers.hud) this.managers.hud.update(deltaTime);
      if (this.managers.checkpoint) this.managers.checkpoint.update(deltaTime);

      if (this.managers.particleManager) {
        performanceMonitor.updateParticleCount(this.managers.particleManager.activeParticles || 0);
      }
    } catch (error) {
      eventTracker.trackError(error, {
        context: 'update_loop',
        gameState: this.gameState,
        currentLevel: this.currentLevelName,
        deltaTime
      });
    }
  }

  render() {
    const frameStartTime = performanceMonitor.frameStart();

    try {
      this.renderer.clear();

      if (this.gameState === 'playing' && this.currentLevel) {
        this.currentLevel.render();
      }

      if (this.managers.centerPiece) this.managers.centerPiece.draw(this.ctx);
      if (this.managers.particleManager) {
        this.managers.particleManager.updateAndDraw(
          this.ctx,
          this.gameLoop ? this.gameLoop.lastDeltaTime : 16
        );
      }
      if (this.managers.flamethrower) this.managers.flamethrower.draw(this.ctx);
      if (this.managers.glassShatter) this.managers.glassShatter.draw(this.ctx);
      if (this.managers.hud) this.managers.hud.draw(this.ctx);
      if (this.managers.checkpoint) this.managers.checkpoint.draw(this.ctx);
    } catch (error) {
      eventTracker.trackError(error, {
        context: 'render_loop',
        gameState: this.gameState,
        currentLevel: this.currentLevelName
      });
    }

    performanceMonitor.frameEnd(frameStartTime);
  }

  togglePause() {
    if (this.gameState === 'playing') {
      this.pauseGame();
    } else if (this.gameState === 'paused') {
      this.resumeGame();
    }
  }

  pauseGame() {
    if (this.gameState !== 'playing') {
      return;
    }

    this.gameState = 'paused';
    if (this.currentLevel) {
      this.currentLevel.pause();
    }
    if (this.managers.checkpoint) {
      this.managers.checkpoint.showCheckpoint('Game Paused');
    }
  }

  resumeGame() {
    if (this.gameState !== 'paused') {
      return;
    }

    this.gameState = 'playing';
    if (this.currentLevel) {
      this.currentLevel.resume();
    }
  }

  restartGame() {
    if (!this.currentLevel) {
      return;
    }

    this.gameState = 'playing';
    this.currentLevel.reset();
    this.currentLevel.start();
  }

  handleCriticalFailure(userMessage, error) {
    if (error) {
      eventTracker.trackError(error, { context: 'critical_failure', userMessage });
    }

    this.resetRetryCounters();
    this.gameState = 'error';
    this.clearLevelCompletionTimer();
    this.clearLevelMenu();

    const existing = document.getElementById('error-container');
    if (existing) {
      existing.remove();
    }

    const errorContainer = document.createElement('div');
    errorContainer.id = 'error-container';
    errorContainer.dataset.testid = 'error-container';
    errorContainer.style.cssText = `
      position: fixed;
      inset: 0;
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
      <h1>Something went wrong</h1>
      <p style="font-size: 18px; margin: 20px 0;">${userMessage}</p>
      <p style="font-size: 14px; margin: 20px 0;">Please reload the page to try again.</p>
      <button type="button" id="reload-game-button">Reload Game</button>
    `;

    errorContainer.querySelector('#reload-game-button').addEventListener('click', () => {
      window.location.reload();
    });

    document.body.appendChild(errorContainer);
    if (this.gameLoop) {
      this.gameLoop.stop();
    }
  }

  destroy() {
    this.clearLevelCompletionTimer();
    window.removeEventListener('keydown', this.boundKeydownHandler);
    window.removeEventListener('GameLoopError', this.boundGameLoopErrorHandler);

    if (this.performanceListener) {
      window.removeEventListener('PerformanceLevelChanged', this.performanceListener);
      this.performanceListener = null;
    }

    if (this.currentLevel && typeof this.currentLevel.cleanup === 'function') {
      this.currentLevel.cleanup();
    }

    if (this.managers.multiTouch && typeof this.managers.multiTouch.destroy === 'function') {
      this.managers.multiTouch.destroy();
    }

    if (this.gameLoop) {
      this.gameLoop.stop();
    }
  }
}

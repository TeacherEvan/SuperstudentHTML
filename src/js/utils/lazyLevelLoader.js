/**
 * Lazy Level Loader
 * Dynamically imports game levels on-demand for optimal code splitting
 * This improves initial load time by only loading levels when needed
 */

// Cache for loaded level modules to avoid re-fetching
const levelModuleCache = new Map();

// Level loading status for UI feedback
const loadingState = {
  isLoading: false,
  currentLevel: null,
  progress: 0
};

// Level completion screen transition delay (ms)
const LEVEL_LOAD_ANIMATION_DELAY = 200;

/**
 * Core level import function - shared by loadLevelModule and preloadLevel
 * Uses webpack magic comments for chunk naming
 * @param {string} levelName - Name of the level to import
 * @returns {Promise<Function>} The level class constructor
 */
async function importLevelByName(levelName) {
  switch (levelName) {
  case 'colors':
    return (await import(
      /* webpackChunkName: "level-colors" */
      '../game/levels/colorsLevel.js'
    )).default;

  case 'shapes':
    return (await import(
      /* webpackChunkName: "level-shapes" */
      '../game/levels/shapesLevel.js'
    )).default;

  case 'alphabet':
    return (await import(
      /* webpackChunkName: "level-alphabet" */
      '../game/levels/alphabetLevel.js'
    )).default;

  case 'numbers':
    return (await import(
      /* webpackChunkName: "level-numbers" */
      '../game/levels/numbersLevel.js'
    )).default;

  case 'clcase':
    return (await import(
      /* webpackChunkName: "level-clcase" */
      '../game/levels/clCaseLevel.js'
    )).default;

  case 'phonics':
    return (await import(
      /* webpackChunkName: "level-phonics" */
      '../game/levels/phonics/PhonicsLevel.js'
    )).PhonicsLevel;

  default:
    throw new Error(`Unknown level: ${levelName}`);
  }
}

/**
 * Creates a loading indicator overlay with skeleton preview
 * @returns {HTMLElement} The loading overlay element
 */
function createLoadingOverlay() {
  const existing = document.getElementById('level-loading-overlay');
  if (existing) return existing;

  const overlay = document.createElement('div');
  overlay.id = 'level-loading-overlay';
  overlay.className = 'level-loading-overlay';
  overlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-icon-container">
        <div class="loading-spinner"></div>
        <div class="loading-glow"></div>
      </div>
      <p class="loading-text">Loading Level...</p>
      <div class="loading-progress">
        <div class="loading-progress-bar"></div>
      </div>
      <p class="loading-hint">Preparing educational content...</p>
    </div>
  `;

  // Add styles for the loading overlay
  addLoadingStyles();

  document.body.appendChild(overlay);
  return overlay;
}

/**
 * Add CSS styles for the loading overlay with enhanced visuals
 */
function addLoadingStyles() {
  if (document.getElementById('lazy-loader-styles')) return;

  const style = document.createElement('style');
  style.id = 'lazy-loader-styles';
  style.textContent = `
    .level-loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 40, 0.95) 100%);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      opacity: 0;
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .level-loading-overlay.visible {
      opacity: 1;
    }

    .loading-content {
      text-align: center;
      color: white;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
    }

    .level-loading-overlay.visible .loading-content {
      transform: translateY(0);
      opacity: 1;
    }

    .loading-icon-container {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 25px;
    }

    .loading-spinner {
      width: 80px;
      height: 80px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: #ffd700;
      border-right-color: #ff8c00;
      border-radius: 50%;
      animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      position: relative;
      z-index: 1;
    }

    .loading-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100px;
      height: 100px;
      margin: -50px 0 0 -50px;
      background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
      animation: glow-pulse 2s ease-in-out infinite;
      z-index: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes glow-pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }

    .loading-text {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 15px;
      background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 1px;
    }

    .loading-progress {
      width: 240px;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      margin: 0 auto 20px;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .loading-progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #ffd700 0%, #ff8c00 50%, #ffd700 100%);
      background-size: 200% 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
      animation: shimmer 2s linear infinite;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .loading-hint {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.5);
      margin: 0;
      animation: fade-in-out 3s ease-in-out infinite;
    }

    @keyframes fade-in-out {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 0.8; }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .loading-spinner,
      .loading-glow,
      .loading-progress-bar,
      .loading-hint {
        animation: none;
      }

      .loading-content {
        transform: none;
        opacity: 1;
        transition: none;
      }

      .loading-progress-bar {
        background: #ffd700;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Shows the loading overlay with animation
 * @param {string} levelName - Name of the level being loaded
 */
function showLoadingOverlay(levelName) {
  loadingState.isLoading = true;
  loadingState.currentLevel = levelName;
  loadingState.progress = 0;

  const overlay = createLoadingOverlay();
  const text = overlay.querySelector('.loading-text');
  if (text) {
    text.textContent = `Loading ${formatLevelName(levelName)}...`;
  }

  // Show with animation
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    updateLoadingProgress(30); // Initial progress
  });
}

/**
 * Updates the loading progress bar
 * @param {number} progress - Progress percentage (0-100)
 */
function updateLoadingProgress(progress) {
  loadingState.progress = progress;
  const progressBar = document.querySelector('.loading-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
}

/**
 * Hides the loading overlay with animation
 */
function hideLoadingOverlay() {
  loadingState.isLoading = false;
  loadingState.currentLevel = null;

  const overlay = document.getElementById('level-loading-overlay');
  if (overlay) {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
}

/**
 * Formats level name for display
 * @param {string} levelName - Raw level name
 * @returns {string} Formatted display name
 */
function formatLevelName(levelName) {
  const nameMap = {
    colors: 'Colors Level',
    shapes: 'Shapes Level',
    alphabet: 'Alphabet Level',
    numbers: 'Numbers Level',
    clcase: 'Letter Case Level',
    phonics: 'Phonics Level'
  };
  return nameMap[levelName] || `${levelName} Level`;
}

/**
 * Dynamically imports a level module
 * @param {string} levelName - Name of the level to load
 * @returns {Promise<Function>} The level class constructor
 */
async function loadLevelModule(levelName) {
  // Check cache first for instant loading
  if (levelModuleCache.has(levelName)) {
    console.log(`⚡ Level ${levelName} loaded from cache`);
    return levelModuleCache.get(levelName);
  }

  console.log(`📦 Dynamically loading level: ${levelName}`);
  showLoadingOverlay(levelName);

  try {
    updateLoadingProgress(30);

    // Use shared import function
    const LevelClass = await importLevelByName(levelName);

    updateLoadingProgress(80);

    // Cache the loaded module
    levelModuleCache.set(levelName, LevelClass);

    updateLoadingProgress(100);

    // Brief delay to show completion before hiding
    await new Promise(resolve => setTimeout(resolve, LEVEL_LOAD_ANIMATION_DELAY));

    console.log(`✅ Level ${levelName} loaded successfully`);
    return LevelClass;

  } catch (error) {
    console.error(`❌ Failed to load level ${levelName}:`, error);
    throw error;
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Preloads a level in the background
 * @param {string} levelName - Name of the level to preload
 */
async function preloadLevel(levelName) {
  if (levelModuleCache.has(levelName)) return;

  try {
    console.log(`🔄 Preloading level: ${levelName}`);

    // Use shared import function for background loading
    const LevelClass = await importLevelByName(levelName);

    if (LevelClass) {
      levelModuleCache.set(levelName, LevelClass);
      console.log(`✅ Preloaded level: ${levelName}`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to preload level ${levelName}:`, error);
  }
}

/**
 * Preloads all levels in the background
 * Useful for when on a fast connection or during idle time
 */
async function preloadAllLevels() {
  const levels = ['colors', 'shapes', 'alphabet', 'numbers', 'clcase', 'phonics'];

  // Use requestIdleCallback if available, otherwise use setTimeout
  const schedulePreload = (callback) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 5000 });
    } else {
      setTimeout(callback, 100);
    }
  };

  for (const level of levels) {
    if (!levelModuleCache.has(level)) {
      await new Promise(resolve => {
        schedulePreload(async () => {
          await preloadLevel(level);
          resolve();
        });
      });
    }
  }
}

/**
 * Clears the level module cache
 * Useful for memory management on low-memory devices
 */
function clearLevelCache() {
  levelModuleCache.clear();
  console.log('🧹 Level cache cleared');
}

/**
 * Gets the current loading state
 * @returns {object} Current loading state
 */
function getLoadingState() {
  return { ...loadingState };
}

export {
  loadLevelModule,
  preloadLevel,
  preloadAllLevels,
  clearLevelCache,
  getLoadingState,
  showLoadingOverlay,
  hideLoadingOverlay
};

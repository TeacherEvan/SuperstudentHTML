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

/**
 * Creates a loading indicator overlay
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
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Level...</p>
      <div class="loading-progress">
        <div class="loading-progress-bar"></div>
      </div>
    </div>
  `;

  // Add styles for the loading overlay
  addLoadingStyles();

  document.body.appendChild(overlay);
  return overlay;
}

/**
 * Add CSS styles for the loading overlay
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
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    }
    
    .level-loading-overlay.visible {
      opacity: 1;
    }
    
    .loading-content {
      text-align: center;
      color: white;
    }
    
    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top-color: #ffd700;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-text {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: #ffd700;
    }
    
    .loading-progress {
      width: 200px;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
      margin: 0 auto;
    }
    
    .loading-progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #ffd700, #ff8c00);
      border-radius: 3px;
      transition: width 0.3s ease;
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
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
    let LevelClass;

    // Dynamic imports with webpack magic comments for chunk naming
    switch (levelName) {
    case 'colors':
      updateLoadingProgress(50);
      // eslint-disable-next-line no-case-declarations
      const colorsModule = await import(
        /* webpackChunkName: "level-colors" */
        '../game/levels/colorsLevel.js'
      );
      LevelClass = colorsModule.default;
      break;

    case 'shapes':
      updateLoadingProgress(50);
      // eslint-disable-next-line no-case-declarations
      const shapesModule = await import(
        /* webpackChunkName: "level-shapes" */
        '../game/levels/shapesLevel.js'
      );
      LevelClass = shapesModule.default;
      break;

    case 'alphabet':
      updateLoadingProgress(50);
      // eslint-disable-next-line no-case-declarations
      const alphabetModule = await import(
        /* webpackChunkName: "level-alphabet" */
        '../game/levels/alphabetLevel.js'
      );
      LevelClass = alphabetModule.default;
      break;

    case 'numbers':
      updateLoadingProgress(50);
      // eslint-disable-next-line no-case-declarations
      const numbersModule = await import(
        /* webpackChunkName: "level-numbers" */
        '../game/levels/numbersLevel.js'
      );
      LevelClass = numbersModule.default;
      break;

    case 'clcase':
      updateLoadingProgress(50);
      // eslint-disable-next-line no-case-declarations
      const clCaseModule = await import(
        /* webpackChunkName: "level-clcase" */
        '../game/levels/clCaseLevel.js'
      );
      LevelClass = clCaseModule.default;
      break;

    case 'phonics':
      updateLoadingProgress(50);
      // eslint-disable-next-line no-case-declarations
      const phonicsModule = await import(
        /* webpackChunkName: "level-phonics" */
        '../game/levels/phonics/PhonicsLevel.js'
      );
      LevelClass = phonicsModule.PhonicsLevel;
      break;

    default:
      throw new Error(`Unknown level: ${levelName}`);
    }

    updateLoadingProgress(80);

    // Cache the loaded module
    levelModuleCache.set(levelName, LevelClass);

    updateLoadingProgress(100);

    // Brief delay to show completion before hiding
    await new Promise(resolve => setTimeout(resolve, 200));

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

    // Load in background without showing overlay
    const silentLoad = async () => {
      let LevelClass;
      switch (levelName) {
      case 'colors':
        LevelClass = (await import('../game/levels/colorsLevel.js')).default;
        break;
      case 'shapes':
        LevelClass = (await import('../game/levels/shapesLevel.js')).default;
        break;
      case 'alphabet':
        LevelClass = (await import('../game/levels/alphabetLevel.js')).default;
        break;
      case 'numbers':
        LevelClass = (await import('../game/levels/numbersLevel.js')).default;
        break;
      case 'clcase':
        LevelClass = (await import('../game/levels/clCaseLevel.js')).default;
        break;
      case 'phonics':
        LevelClass = (await import('../game/levels/phonics/PhonicsLevel.js')).PhonicsLevel;
        break;
      }
      return LevelClass;
    };

    const LevelClass = await silentLoad();
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

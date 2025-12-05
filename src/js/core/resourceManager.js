/**
 * ResourceManager - Asset loading and management with lazy loading support
 * Handles loading of images, audio, and fonts with progress tracking
 * Implements progressive loading patterns for optimal Core Web Vitals
 *
 * Key Features:
 * - Automatic format detection (WebP, AVIF) for optimal image delivery
 * - Lazy loading via IntersectionObserver for deferred image loading
 * - Preload/Prefetch hints for critical resource optimization
 * - Progress tracking for loading screens
 *
 * TODO: [OPTIMIZATION] Consider using IndexedDB for asset caching across sessions
 * TODO: [OPTIMIZATION] Implement service worker for offline asset caching
 * TODO: [OPTIMIZATION] Add CDN failover support for asset URLs
 */

// Format detection test images (1x1 pixel encoded in each format)
// These minimal images are used to detect browser support for modern formats
const IMAGE_FORMAT_DETECTION_DATA = {
  // 1x1 WebP image (26 bytes base64 encoded)
  webp: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
  // 1x1 AVIF image (standard test pattern)
  avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgADlAgIGkyCR/wAABAAAAfAAEAAAAV'
};

// Lazy load observer configuration
const LAZY_LOAD_ROOT_MARGIN = '50px 0px'; // Start loading 50px before element enters viewport
const LAZY_LOAD_THRESHOLD = 0.01; // Trigger when 1% of element is visible

export class ResourceManager {
  constructor() {
    this.loadedAssets = new Map();
    this.currentLoadingProgress = 0;
    this.totalAssetCount = 0;
    this.loadedAssetCount = 0;
    this.currentDisplayMode = 'DEFAULT';
    this.assetLoadingQueue = [];
    this.isProcessingLoadingQueue = false;

    // Image format detection for optimal loading
    this.browserSupportedFormats = {
      webp: false,
      avif: false
    };

    this.detectOptimalImageFormats();
    this.initializeLazyLoadObserver();
  }

  // Backward-compatible getters for existing tests and code
  get assets() { return this.loadedAssets; }
  get loadingProgress() { return this.currentLoadingProgress; }
  get totalAssets() { return this.totalAssetCount; }

  /**
   * Detect browser support for modern image formats (WebP, AVIF)
   * Enables automatic format selection for optimal performance
   */
  async detectOptimalImageFormats() {
    // WebP detection using minimal test image
    const webpSupportPromise = new Promise(resolve => {
      const testImage = new Image();
      testImage.onload = () => resolve(testImage.width > 0 && testImage.height > 0);
      testImage.onerror = () => resolve(false);
      testImage.src = IMAGE_FORMAT_DETECTION_DATA.webp;
    });

    // AVIF detection using minimal test image
    const avifSupportPromise = new Promise(resolve => {
      const testImage = new Image();
      testImage.onload = () => resolve(testImage.width > 0 && testImage.height > 0);
      testImage.onerror = () => resolve(false);
      testImage.src = IMAGE_FORMAT_DETECTION_DATA.avif;
    });

    const [isWebpSupported, isAvifSupported] = await Promise.all([webpSupportPromise, avifSupportPromise]);
    this.browserSupportedFormats.webp = isWebpSupported;
    this.browserSupportedFormats.avif = isAvifSupported;
  }

  /**
   * Initialize Intersection Observer for lazy loading images
   * Only loads images when they enter the viewport
   */
  initializeLazyLoadObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver not supported, falling back to eager loading');
      return;
    }

    this.lazyLoadObserver = new IntersectionObserver(
      (intersectionEntries) => {
        intersectionEntries.forEach(entry => {
          if (entry.isIntersecting) {
            const targetElement = entry.target;
            this.loadLazyImage(targetElement);
            this.lazyLoadObserver.unobserve(targetElement);
          }
        });
      },
      {
        rootMargin: LAZY_LOAD_ROOT_MARGIN,
        threshold: LAZY_LOAD_THRESHOLD
      }
    );
  }

  /**
   * Load a lazy image when it enters the viewport
   * @param {HTMLElement} imageElement - The image element to load
   */
  loadLazyImage(imageElement) {
    const imageSrc = imageElement.dataset.src;
    if (!imageSrc) return;

    // Add loading class for skeleton animation
    imageElement.classList.add('loading');

    const preloadImage = new Image();
    preloadImage.onload = () => {
      imageElement.src = imageSrc;
      imageElement.classList.remove('loading');
      imageElement.classList.add('loaded');
    };
    preloadImage.onerror = () => {
      console.error(`Failed to lazy load image: ${imageSrc}`);
      imageElement.classList.remove('loading');
      imageElement.classList.add('load-error');
    };
    preloadImage.src = imageSrc;
  }

  /**
   * Register an element for lazy loading
   * @param {HTMLElement} element - The element to observe for lazy loading
   */
  registerForLazyLoad(element) {
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.observe(element);
    } else {
      // Fallback: load immediately if observer not available
      this.loadLazyImage(element);
    }
  }

  /**
   * Load all game assets with progress tracking
   * @returns {Promise<void>}
   */
  async loadAssets() {
    // TODO: [ENHANCEMENT] Load from manifest file for better asset management
    // TODO: [OPTIMIZATION] Implement priority-based loading queue
    return Promise.resolve();
  }

  /**
   * Load a single asset based on its type
   * @param {Object} assetInfo - Asset information including type, id, and path
   */
  async loadAsset(assetInfo) {
    try {
      let loadedAsset;
      switch (assetInfo.type) {
      case 'font':
        loadedAsset = await this.loadFont(assetInfo);
        break;
      case 'audio':
        loadedAsset = await this.loadAudio(assetInfo);
        break;
      case 'image':
        loadedAsset = await this.loadImageWithOptimalFormat(assetInfo);
        break;
      }

      this.loadedAssets.set(assetInfo.id, loadedAsset);
      this.updateLoadingProgress();

    } catch (loadError) {
      console.error(`Failed to load asset: ${assetInfo.id}`, loadError);
    }
  }

  /**
   * Load an image with automatic format optimization
   * Tries AVIF > WebP > original format based on browser support
   * @param {Object} assetInfo - Image asset information
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImageWithOptimalFormat(assetInfo) {
    const imageElement = new Image();

    return new Promise((resolve, reject) => {
      imageElement.onload = () => resolve(imageElement);
      imageElement.onerror = () => reject(new Error(`Failed to load image: ${assetInfo.path}`));

      // Try to use optimal format if available
      let optimizedImagePath = assetInfo.path;
      if (this.browserSupportedFormats.avif && assetInfo.avifPath) {
        optimizedImagePath = assetInfo.avifPath;
      } else if (this.browserSupportedFormats.webp && assetInfo.webpPath) {
        optimizedImagePath = assetInfo.webpPath;
      }

      imageElement.src = optimizedImagePath;
    });
  }

  /**
   * Update loading progress and notify listeners
   */
  updateLoadingProgress() {
    this.loadedAssetCount++;
    this.currentLoadingProgress = this.loadedAssetCount / this.totalAssetCount;
    this.onProgressUpdate?.(this.currentLoadingProgress);
  }

  /**
   * Add a preload hint for critical resources
   * @param {string} resourceUrl - Resource URL
   * @param {string} resourceType - Resource type (image, font, script, style)
   */
  addPreloadHint(resourceUrl, resourceType) {
    const linkElement = document.createElement('link');
    linkElement.rel = 'preload';
    linkElement.href = resourceUrl;
    linkElement.as = resourceType;

    if (resourceType === 'font') {
      linkElement.crossOrigin = 'anonymous';
    }

    document.head.appendChild(linkElement);
  }

  /**
   * Add a prefetch hint for non-critical resources
   * @param {string} resourceUrl - Resource URL
   */
  addPrefetchHint(resourceUrl) {
    const linkElement = document.createElement('link');
    linkElement.rel = 'prefetch';
    linkElement.href = resourceUrl;
    document.head.appendChild(linkElement);
  }

  /**
   * Get a loaded asset by ID
   * @param {string} assetId - Asset identifier
   * @returns {*} The loaded asset or undefined
   */
  getAsset(assetId) {
    return this.loadedAssets.get(assetId);
  }

  /**
   * Set the display mode for responsive asset loading
   * @param {string} mode - Display mode (DEFAULT or QBOARD)
   */
  setDisplayMode(mode) {
    this.currentDisplayMode = mode;
    console.log(`Display mode set to: ${mode}`);
  }

  /**
   * Get the current display mode
   * @returns {string} Current display mode
   */
  getDisplayMode() {
    return this.currentDisplayMode;
  }

  /**
   * Get optimal image format support status
   * @returns {Object} Object with webp and avif support flags
   */
  getOptimalFormatSupport() {
    return { ...this.browserSupportedFormats };
  }

  /**
   * Cleanup resources and observers
   */
  destroy() {
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect();
      this.lazyLoadObserver = null;
    }
    this.loadedAssets.clear();
  }
}

/**
 * ResourceManager - Asset loading and management with lazy loading support
 * Handles loading of images, audio, and fonts with progress tracking
 * Implements progressive loading patterns for optimal Core Web Vitals
 */
export class ResourceManager {
  constructor() {
    this.assets = new Map();
    this.loadingProgress = 0;
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.displayMode = 'DEFAULT';
    this.loadingQueue = [];
    this.isProcessingQueue = false;

    // Image format detection for optimal loading
    this.supportedFormats = {
      webp: false,
      avif: false
    };

    // TODO: [OPTIMIZATION] Consider using IndexedDB for asset caching across sessions
    // TODO: [OPTIMIZATION] Implement service worker for offline asset caching

    this.detectOptimalImageFormats();
    this.initializeLazyLoadObserver();
  }

  /**
   * Detect browser support for modern image formats (WebP, AVIF)
   * Enables automatic format selection for optimal performance
   */
  async detectOptimalImageFormats() {
    // WebP detection
    const webpPromise = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0 && img.height > 0);
      img.onerror = () => resolve(false);
      img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    });

    // AVIF detection
    const avifPromise = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0 && img.height > 0);
      img.onerror = () => resolve(false);
      img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgADlAgIGkyCR/wAABAAAAfAAEAAAAV';
    });

    const [webpSupported, avifSupported] = await Promise.all([webpPromise, avifPromise]);
    this.supportedFormats.webp = webpSupported;
    this.supportedFormats.avif = avifSupported;
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
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            this.loadLazyImage(element);
            this.lazyLoadObserver.unobserve(element);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before element enters viewport
        threshold: 0.01
      }
    );
  }

  /**
   * Load a lazy image when it enters the viewport
   * @param {HTMLElement} element - The image element to load
   */
  loadLazyImage(element) {
    const src = element.dataset.src;
    if (!src) return;

    // Add loading class for skeleton animation
    element.classList.add('loading');

    const img = new Image();
    img.onload = () => {
      element.src = src;
      element.classList.remove('loading');
      element.classList.add('loaded');
    };
    img.onerror = () => {
      console.error(`Failed to lazy load image: ${src}`);
      element.classList.remove('loading');
      element.classList.add('load-error');
    };
    img.src = src;
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
      let asset;
      switch (assetInfo.type) {
      case 'font':
        asset = await this.loadFont(assetInfo);
        break;
      case 'audio':
        asset = await this.loadAudio(assetInfo);
        break;
      case 'image':
        asset = await this.loadImageWithOptimalFormat(assetInfo);
        break;
      }

      this.assets.set(assetInfo.id, asset);
      this.updateLoadingProgress();

    } catch (error) {
      console.error(`Failed to load asset: ${assetInfo.id}`, error);
    }
  }

  /**
   * Load an image with automatic format optimization
   * Tries AVIF > WebP > original format based on browser support
   * @param {Object} assetInfo - Image asset information
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImageWithOptimalFormat(assetInfo) {
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${assetInfo.path}`));

      // Try to use optimal format if available
      let imagePath = assetInfo.path;
      if (this.supportedFormats.avif && assetInfo.avifPath) {
        imagePath = assetInfo.avifPath;
      } else if (this.supportedFormats.webp && assetInfo.webpPath) {
        imagePath = assetInfo.webpPath;
      }

      img.src = imagePath;
    });
  }

  /**
   * Update loading progress and notify listeners
   */
  updateLoadingProgress() {
    this.loadedAssets++;
    this.loadingProgress = this.loadedAssets / this.totalAssets;
    this.onProgressUpdate?.(this.loadingProgress);
  }

  /**
   * Add a preload hint for critical resources
   * @param {string} href - Resource URL
   * @param {string} type - Resource type (image, font, script, style)
   */
  addPreloadHint(href, type) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = type;

    if (type === 'font') {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
  }

  /**
   * Add a prefetch hint for non-critical resources
   * @param {string} href - Resource URL
   */
  addPrefetchHint(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  /**
   * Get a loaded asset by ID
   * @param {string} id - Asset identifier
   * @returns {*} The loaded asset or undefined
   */
  getAsset(id) {
    return this.assets.get(id);
  }

  /**
   * Set the display mode for responsive asset loading
   * @param {string} mode - Display mode (DEFAULT or QBOARD)
   */
  setDisplayMode(mode) {
    this.displayMode = mode;
    console.log(`Display mode set to: ${mode}`);
  }

  /**
   * Get the current display mode
   * @returns {string} Current display mode
   */
  getDisplayMode() {
    return this.displayMode;
  }

  /**
   * Get optimal image format support status
   * @returns {Object} Object with webp and avif support flags
   */
  getOptimalFormatSupport() {
    return { ...this.supportedFormats };
  }

  /**
   * Cleanup resources and observers
   */
  destroy() {
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect();
      this.lazyLoadObserver = null;
    }
    this.assets.clear();
  }
}

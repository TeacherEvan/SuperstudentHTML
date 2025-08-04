/**
 * Resource Optimizer - Phase 2 Asset & Memory Management
 * Handles lazy loading, asset compression detection, and memory cleanup
 */
import { eventTracker } from './eventTracker.js';

export class ResourceOptimizer {
  constructor() {
    this.loadedAssets = new Map();
    this.assetCache = new Map();
    this.memoryThreshold = 50 * 1024 * 1024; // 50MB threshold
    this.lastCleanup = Date.now();
    this.cleanupInterval = 30000; // 30 seconds

    // Asset priorities for memory management
    this.assetPriorities = {
      image: 3,
      audio: 2,
      json: 1,
      font: 2,
    };

    this.setupMemoryMonitoring();
  }

  setupMemoryMonitoring() {
    // Check memory usage periodically
    setInterval(() => {
      this.checkMemoryUsage();
    }, this.cleanupInterval);

    // Listen for performance level changes
    window.addEventListener('PerformanceLevelChanged', (event) => {
      const { level } = event.detail;
      this.adjustCacheSettings(level);
    });
  }

  // Lazy load assets only when needed
  async loadAssetLazy(url, type, priority = 'normal') {
    const cacheKey = `${type}:${url}`;

    // Return cached asset if available
    if (this.assetCache.has(cacheKey)) {
      eventTracker.trackEvent('resource', 'cache_hit', { url, type });
      return this.assetCache.get(cacheKey);
    }

    eventTracker.trackEvent('resource', 'lazy_load_start', {
      url,
      type,
      priority,
    });

    try {
      const asset = await this.loadAsset(url, type);

      // Cache the asset with priority metadata
      this.assetCache.set(cacheKey, {
        asset,
        priority: this.assetPriorities[type] || 1,
        lastUsed: Date.now(),
        size: this.estimateAssetSize(asset, type),
      });

      eventTracker.trackEvent('resource', 'lazy_load_success', {
        url,
        type,
        cacheSize: this.assetCache.size,
      });

      return asset;
    } catch (error) {
      eventTracker.trackError(error, {
        context: 'lazy_loading',
        url,
        type,
      });
      throw error;
    }
  }

  async loadAsset(url, type) {
    switch (type) {
    case 'image':
      return this.loadImage(url);
    case 'audio':
      return this.loadAudio(url);
    case 'json':
      return this.loadJSON(url);
    default:
      throw new Error(`Unsupported asset type: ${type}`);
    }
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  loadAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
      audio.src = url;
    });
  }

  async loadJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${url}`);
    }
    return response.json();
  }

  estimateAssetSize(asset, type) {
    switch (type) {
    case 'image':
      // Rough estimate: width * height * 4 bytes per pixel
      return asset.width * asset.height * 4;
    case 'audio':
      // Rough estimate: duration * bitrate / 8
      return ((asset.duration || 10) * 128000) / 8; // Assume 128kbps
    case 'json':
      return JSON.stringify(asset).length * 2; // UTF-16 encoding
    default:
      return 1024; // Default 1KB estimate
    }
  }

  checkMemoryUsage() {
    if (!('memory' in performance)) return;

    const memoryUsage = performance.memory.usedJSHeapSize;
    const totalCacheSize = this.calculateTotalCacheSize();

    eventTracker.trackPerformance(
      'cache_size',
      totalCacheSize / 1024 / 1024,
      'MB'
    );

    if (
      memoryUsage > this.memoryThreshold ||
      totalCacheSize > this.memoryThreshold / 2
    ) {
      this.performCleanup();
    }
  }

  calculateTotalCacheSize() {
    let totalSize = 0;
    for (const cached of this.assetCache.values()) {
      totalSize += cached.size || 0;
    }
    return totalSize;
  }

  performCleanup() {
    const now = Date.now();
    const cleanupThreshold = 60000; // 1 minute
    let removedCount = 0;
    let removedSize = 0;

    eventTracker.trackEvent('resource', 'cleanup_start', {
      cacheSize: this.assetCache.size,
    });

    // Sort by priority and last used time
    const sortedEntries = Array.from(this.assetCache.entries()).sort((a, b) => {
      const [, aCached] = a;
      const [, bCached] = b;

      // Lower priority and older assets first
      if (aCached.priority !== bCached.priority) {
        return aCached.priority - bCached.priority;
      }
      return aCached.lastUsed - bCached.lastUsed;
    });

    // Remove old, low-priority assets
    for (const [key, cached] of sortedEntries) {
      if (now - cached.lastUsed > cleanupThreshold && cached.priority <= 2) {
        removedSize += cached.size || 0;
        this.assetCache.delete(key);
        removedCount++;

        // Stop if we've freed enough memory
        if (removedCount >= 10 || removedSize > this.memoryThreshold / 4) {
          break;
        }
      }
    }

    eventTracker.trackEvent('resource', 'cleanup_complete', {
      removedCount,
      removedSize: removedSize / 1024 / 1024, // MB
      remainingSize: this.assetCache.size,
    });

    this.lastCleanup = now;
  }

  adjustCacheSettings(performanceLevel) {
    switch (performanceLevel) {
    case 'low':
      this.memoryThreshold = 25 * 1024 * 1024; // 25MB
      this.cleanupInterval = 15000; // 15 seconds
      break;
    case 'medium':
      this.memoryThreshold = 40 * 1024 * 1024; // 40MB
      this.cleanupInterval = 20000; // 20 seconds
      break;
    case 'high':
      this.memoryThreshold = 75 * 1024 * 1024; // 75MB
      this.cleanupInterval = 30000; // 30 seconds
      break;
    }

    eventTracker.trackEvent('resource', 'cache_settings_adjusted', {
      level: performanceLevel,
      memoryThreshold: this.memoryThreshold / 1024 / 1024, // MB
      cleanupInterval: this.cleanupInterval,
    });
  }

  // Preload critical assets
  async preloadCriticalAssets(assetList) {
    eventTracker.trackEvent('resource', 'preload_start', {
      count: assetList.length,
    });

    const promises = assetList.map(({ url, type }) =>
      this.loadAssetLazy(url, type, 'high').catch((error) => {
        eventTracker.trackError(error, { context: 'preload', url, type });
        return null; // Don't fail the entire preload for one asset
      })
    );

    const results = await Promise.all(promises);
    const successCount = results.filter((r) => r !== null).length;

    eventTracker.trackEvent('resource', 'preload_complete', {
      total: assetList.length,
      success: successCount,
      failed: assetList.length - successCount,
    });

    return results;
  }

  // Get asset from cache or load it
  async getAsset(url, type) {
    return this.loadAssetLazy(url, type);
  }

  // Mark asset as recently used
  touchAsset(url, type) {
    const cacheKey = `${type}:${url}`;
    const cached = this.assetCache.get(cacheKey);
    if (cached) {
      cached.lastUsed = Date.now();
    }
  }

  // Get cache statistics
  getCacheStats() {
    const totalSize = this.calculateTotalCacheSize();
    const stats = {
      totalAssets: this.assetCache.size,
      totalSize: totalSize / 1024 / 1024, // MB
      memoryThreshold: this.memoryThreshold / 1024 / 1024, // MB
      lastCleanup: new Date(this.lastCleanup).toISOString(),
    };

    // Count by type
    const typeStats = {};
    for (const [key, cached] of this.assetCache.entries()) {
      const type = key.split(':')[0];
      if (!typeStats[type]) {
        typeStats[type] = { count: 0, size: 0 };
      }
      typeStats[type].count++;
      typeStats[type].size += cached.size || 0;
    }

    stats.byType = typeStats;
    return stats;
  }

  // Force cleanup
  clearCache() {
    const clearedCount = this.assetCache.size;
    this.assetCache.clear();

    eventTracker.trackEvent('resource', 'cache_cleared', { clearedCount });
    return clearedCount;
  }
}

// Create singleton instance
export const resourceOptimizer = new ResourceOptimizer();

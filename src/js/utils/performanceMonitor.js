/**
 * Performance Monitor - Phase 2 Optimization Tool
 * Monitors frame rate, memory usage, and rendering performance
 * Integrates with the event tracking system for comprehensive debugging
 */
import { eventTracker } from '../utils/eventTracker.js';

export class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      trackFrameRate: true,
      trackMemory: true,
      trackRenderTime: true,
      adaptiveQuality: true,
      sampleInterval: 1000, // ms
      frameTimeThreshold: 20, // ms (50fps threshold)
      ...options,
    };

    this.metrics = {
      frameRate: 60,
      averageFrameTime: 16.67,
      renderTime: 0,
      memoryUsage: 0,
      particleCount: 0,
      drawCalls: 0,
    };

    this.frameTimes = [];
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.lastSampleTime = performance.now();

    // Performance states
    this.performanceLevel = 'high'; // high, medium, low
    this.adaptiveSettings = {
      high: { maxParticles: 500, particleQuality: 'high', enableEffects: true },
      medium: {
        maxParticles: 300,
        particleQuality: 'medium',
        enableEffects: true,
      },
      low: { maxParticles: 150, particleQuality: 'low', enableEffects: false },
    };

    this.initialize();
  }

  initialize() {
    if (this.options.trackMemory && 'memory' in performance) {
      this.memorySupported = true;
    }

    eventTracker.trackEvent('performance', 'monitor_initialized', {
      features: {
        frameTracking: this.options.trackFrameRate,
        memoryTracking: this.memorySupported,
        adaptiveQuality: this.options.adaptiveQuality,
      },
    });
  }

  // Call this at the start of each frame
  frameStart() {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    if (this.options.trackFrameRate) {
      this.recordFrameTime(frameTime);
    }

    return now;
  }

  // Call this at the end of each frame
  frameEnd(startTime) {
    if (this.options.trackRenderTime) {
      const renderTime = performance.now() - startTime;
      this.metrics.renderTime = renderTime;
    }

    this.frameCount++;
    this.checkPerformanceLevel();
  }

  recordFrameTime(frameTime) {
    this.frameTimes.push(frameTime);

    // Keep only last 60 frames for averaging
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    // Calculate metrics every sample interval
    const now = performance.now();
    if (now - this.lastSampleTime >= this.options.sampleInterval) {
      this.updateMetrics();
      this.lastSampleTime = now;
    }
  }

  updateMetrics() {
    if (this.frameTimes.length > 0) {
      const avgFrameTime =
        this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.metrics.averageFrameTime = avgFrameTime;
      this.metrics.frameRate = 1000 / avgFrameTime;
    }

    if (this.memorySupported) {
      this.metrics.memoryUsage =
        performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // Track performance metrics
    eventTracker.trackPerformance(
      'frame_rate',
      this.metrics.frameRate.toFixed(1),
      'fps'
    );
    eventTracker.trackPerformance(
      'frame_time',
      this.metrics.averageFrameTime.toFixed(2),
      'ms'
    );

    if (this.memorySupported) {
      eventTracker.trackPerformance(
        'memory_usage',
        this.metrics.memoryUsage.toFixed(2),
        'MB'
      );
    }
  }

  checkPerformanceLevel() {
    if (!this.options.adaptiveQuality) return;

    const { averageFrameTime, frameRate } = this.metrics;
    let newLevel = this.performanceLevel;

    // Performance degradation detection
    if (averageFrameTime > this.options.frameTimeThreshold) {
      if (this.performanceLevel === 'high') {
        newLevel = 'medium';
      } else if (this.performanceLevel === 'medium') {
        newLevel = 'low';
      }
    }
    // Performance improvement detection (be conservative)
    else if (averageFrameTime < 14 && frameRate > 65) {
      if (this.performanceLevel === 'low') {
        newLevel = 'medium';
      } else if (this.performanceLevel === 'medium' && averageFrameTime < 12) {
        newLevel = 'high';
      }
    }

    if (newLevel !== this.performanceLevel) {
      this.setPerformanceLevel(newLevel);
    }
  }

  setPerformanceLevel(level) {
    const previousLevel = this.performanceLevel;
    this.performanceLevel = level;

    eventTracker.trackEvent('performance', 'level_changed', {
      from: previousLevel,
      to: level,
      metrics: this.metrics,
      reason: 'adaptive_quality',
    });

    // Dispatch event for systems to adjust their settings
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('PerformanceLevelChanged', {
          detail: {
            level,
            previousLevel,
            settings: this.adaptiveSettings[level],
            metrics: this.metrics,
          },
        })
      );
    }
  }

  // Update particle count for monitoring
  updateParticleCount(count) {
    this.metrics.particleCount = count;
  }

  // Update draw call count for monitoring
  updateDrawCalls(count) {
    this.metrics.drawCalls = count;
  }

  // Get current performance settings
  getCurrentSettings() {
    return this.adaptiveSettings[this.performanceLevel];
  }

  // Get performance summary
  getSummary() {
    return {
      level: this.performanceLevel,
      metrics: { ...this.metrics },
      settings: this.adaptiveSettings[this.performanceLevel],
      isMemorySupported: this.memorySupported,
    };
  }

  // Manual performance level override
  forcePerformanceLevel(level) {
    if (level in this.adaptiveSettings) {
      this.setPerformanceLevel(level);
      eventTracker.trackEvent('performance', 'level_forced', { level });
    }
  }

  // Reset performance tracking
  reset() {
    this.frameTimes = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.lastSampleTime = performance.now();
    this.performanceLevel = 'high';

    eventTracker.trackEvent('performance', 'monitor_reset');
  }

  /**
   * Phase 2 Optimization - Particle Pool Integration
   */

  /**
   * Set particle manager reference for pool verification
   * @param {ParticleManager} particleManager - The particle manager instance
   */
  setParticleManager(particleManager) {
    this.particleManager = particleManager;
    eventTracker.trackEvent('performance', 'particle_manager_linked');
  }

  /**
   * Verify particle pool health and log results
   * @returns {Object} Pool verification results
   */
  verifyParticlePool() {
    if (!this.particleManager) {
      console.warn('⚠️ No particle manager linked for pool verification');
      return null;
    }

    const verification = this.particleManager.verifyPool();

    // Log critical issues to event tracker
    if (!verification.isHealthy) {
      eventTracker.trackEvent('performance', 'particle_pool_issues', {
        issues: verification.issues,
        warnings: verification.warnings,
        stats: verification.stats,
      });
    }

    return verification;
  }

  /**
   * Get comprehensive performance summary including particle pool stats
   * @returns {Object} Enhanced performance summary
   */
  getEnhancedSummary() {
    const baseSummary = this.getSummary();

    if (this.particleManager) {
      const poolStats = this.particleManager.getPoolStats();
      const poolVerification = this.particleManager.verifyPool();

      baseSummary.particlePool = {
        stats: poolStats,
        health: {
          isHealthy: poolVerification.isHealthy,
          issueCount: poolVerification.issues.length,
          warningCount: poolVerification.warnings.length,
        },
      };
    }

    return baseSummary;
  }

  /**
   * Run comprehensive performance analysis including pool verification
   */
  runDiagnostics() {
    console.group('🔬 Performance Diagnostics');

    // Base performance metrics
    console.table(this.metrics);

    // Particle pool verification
    if (this.particleManager) {
      console.log('\n🎯 Particle Pool Analysis:');
      this.particleManager.logPoolVerification();
    } else {
      console.warn(
        '⚠️ Particle manager not linked - skipping pool verification'
      );
    }

    // Memory analysis
    if (this.memorySupported) {
      console.log('\n🧠 Memory Analysis:');
      console.table({
        'Used Heap': `${this.metrics.memoryUsage.toFixed(2)} MB`,
        'Total Heap': `${(
          performance.memory.totalJSHeapSize /
          1024 /
          1024
        ).toFixed(2)} MB`,
        'Heap Limit': `${(
          performance.memory.jsHeapSizeLimit /
          1024 /
          1024
        ).toFixed(2)} MB`,
      });
    }

    console.groupEnd();

    // Track diagnostic run
    eventTracker.trackEvent('performance', 'diagnostics_run', {
      timestamp: Date.now(),
      performanceLevel: this.performanceLevel,
      hasParticleManager: !!this.particleManager,
    });
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

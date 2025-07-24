/**
 * Performance Dashboard - Development Tool
 * Visual dashboard for monitoring performance metrics, event tracking, and resource usage
 */
import { eventTracker } from "./eventTracker.js";
import { performanceMonitor } from "./performanceMonitor.js";
import { resourceOptimizer } from "./resourceOptimizer.js";

export class PerformanceDashboard {
  constructor() {
    this.isVisible = false;
    this.dashboardElement = null;
    this.updateInterval = null;
    this.autoRefresh = true;
    this.refreshRate = 2000; // 2 seconds

    this.createDashboard();
    this.setupKeyboardShortcuts();
  }

  createDashboard() {
    this.dashboardElement = document.createElement("div");
    this.dashboardElement.id = "performance-dashboard";
    this.dashboardElement.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      width: 400px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.9);
      color: #ffffff;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 11px;
      line-height: 1.4;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #333;
      z-index: 100000;
      overflow-y: auto;
      display: none;
      backdrop-filter: blur(5px);
    `;

    document.body.appendChild(this.dashboardElement);
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Press 'P' to toggle performance dashboard
      if (e.code === "KeyP" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        this.toggle();
      }

      // Press 'C' to clear event log
      if (e.code === "KeyC" && e.ctrlKey && e.shiftKey && this.isVisible) {
        e.preventDefault();
        eventTracker.clear();
        this.updateDashboard();
      }

      // Press 'R' to force cleanup resources
      if (e.code === "KeyR" && e.ctrlKey && e.shiftKey && this.isVisible) {
        e.preventDefault();
        resourceOptimizer.clearCache();
        this.updateDashboard();
      }

      // Press 'D' to run full diagnostics including particle pool verification
      if (e.code === "KeyD" && e.ctrlKey && e.shiftKey && this.isVisible) {
        e.preventDefault();
        performanceMonitor.runDiagnostics();
        this.updateDashboard();
      }
    });
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.dashboardElement.style.display = this.isVisible ? "block" : "none";

    if (this.isVisible) {
      this.startAutoRefresh();
      this.updateDashboard();
      eventTracker.trackEvent("debug", "dashboard_opened");
    } else {
      this.stopAutoRefresh();
      eventTracker.trackEvent("debug", "dashboard_closed");
    }
  }

  startAutoRefresh() {
    if (this.autoRefresh && !this.updateInterval) {
      this.updateInterval = setInterval(() => {
        this.updateDashboard();
      }, this.refreshRate);
    }
  }

  stopAutoRefresh() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  updateDashboard() {
    if (!this.isVisible) return;

    const perfSummary = performanceMonitor.getEnhancedSummary();
    const eventSummary = eventTracker.getSummary();
    const resourceStats = resourceOptimizer.getCacheStats();

    const html = `
      <div style="border-bottom: 1px solid #444; margin-bottom: 10px; padding-bottom: 5px;">
        <h3 style="margin: 0; color: #4CAF50;">🚀 Performance Dashboard</h3>
        <p style="margin: 5px 0 0 0; font-size: 9px; color: #888;">
          Ctrl+Shift+P: Toggle | Ctrl+Shift+C: Clear Events | Ctrl+Shift+R: Clear Cache | Ctrl+Shift+D: Diagnostics
        </p>
      </div>

      <div style="margin-bottom: 15px;">
        <h4 style="margin: 0 0 8px 0; color: #2196F3;">⚡ Performance Metrics</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 10px;">
          <div>
            <strong>Frame Rate:</strong> ${perfSummary.metrics.frameRate.toFixed(
              1
            )} fps<br>
            <strong>Frame Time:</strong> ${perfSummary.metrics.averageFrameTime.toFixed(
              2
            )} ms<br>
            <strong>Render Time:</strong> ${perfSummary.metrics.renderTime.toFixed(
              2
            )} ms
          </div>
          <div>
            <strong>Performance Level:</strong> 
            <span style="color: ${this.getPerformanceColor(
              perfSummary.level
            )}">${perfSummary.level.toUpperCase()}</span><br>
            <strong>Particles:</strong> ${perfSummary.metrics.particleCount}<br>
            ${
              perfSummary.isMemorySupported
                ? `<strong>Memory:</strong> ${perfSummary.metrics.memoryUsage.toFixed(
                    1
                  )} MB`
                : '<span style="color: #888;">Memory: Not Available</span>'
            }
          </div>
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <h4 style="margin: 0 0 8px 0; color: #FF9800;">📦 Resource Cache</h4>
        <div style="font-size: 10px;">
          <strong>Total Assets:</strong> ${resourceStats.totalAssets} 
          (${resourceStats.totalSize.toFixed(2)} MB)<br>
          <strong>Threshold:</strong> ${resourceStats.memoryThreshold.toFixed(
            1
          )} MB<br>
          <strong>Last Cleanup:</strong> ${new Date(
            resourceStats.lastCleanup
          ).toLocaleTimeString()}<br>
          ${this.formatResourceTypes(resourceStats.byType)}
        </div>
      </div>

      ${this.formatParticlePoolSection(perfSummary)}

      <div style="margin-bottom: 15px;">
        <h4 style="margin: 0 0 8px 0; color: #9C27B0;">📊 Event Summary</h4>
        <div style="font-size: 10px;">
          <strong>Total Events:</strong> ${eventSummary.total}<br>
          ${
            eventSummary.timeRange
              ? `<strong>Duration:</strong> ${(
                  eventSummary.timeRange.duration / 1000
                ).toFixed(1)}s<br>`
              : ""
          }
          <div style="margin-top: 5px;">
            ${this.formatEventTypes(eventSummary.byType)}
          </div>
        </div>
      </div>

      <div style="margin-bottom: 10px;">
        <h4 style="margin: 0 0 8px 0; color: #F44336;">🔥 Recent Events</h4>
        <div style="max-height: 200px; overflow-y: auto; font-size: 9px; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 4px;">
          ${this.formatRecentEvents()}
        </div>
      </div>

      <div style="text-align: center; margin-top: 10px;">
        <button onclick="window.performanceDashboard.exportData()" 
                style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 10px; margin-right: 5px;">
          Export Data
        </button>
        <button onclick="window.performanceDashboard.clearAll()" 
                style="background: #F44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 10px;">
          Clear All
        </button>
      </div>
    `;

    this.dashboardElement.innerHTML = html;

    // Make methods available globally for button clicks
    window.performanceDashboard = this;
  }

  getPerformanceColor(level) {
    switch (level) {
      case "high":
        return "#4CAF50";
      case "medium":
        return "#FF9800";
      case "low":
        return "#F44336";
      default:
        return "#888";
    }
  }

  formatResourceTypes(byType) {
    if (!byType || Object.keys(byType).length === 0) {
      return '<span style="color: #888;">No cached resources</span>';
    }

    return Object.entries(byType)
      .map(
        ([type, stats]) =>
          `<strong>${type}:</strong> ${stats.count} (${(
            stats.size /
            1024 /
            1024
          ).toFixed(2)} MB)`
      )
      .join("<br>");
  }

  formatEventTypes(byType) {
    if (!byType || Object.keys(byType).length === 0) {
      return '<span style="color: #888;">No events recorded</span>';
    }

    return Object.entries(byType)
      .map(([type, count]) => `<strong>${type}:</strong> ${count}`)
      .join(" | ");
  }

  formatRecentEvents() {
    const recentEvents = eventTracker.getEvents().slice(-20);
    if (recentEvents.length === 0) {
      return '<span style="color: #888;">No recent events</span>';
    }

    return recentEvents
      .reverse()
      .map((event) => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        const icon = this.getEventIcon(event.type);
        const color = this.getEventColor(event.level);

        let description = "";
        if (event.type === "event") {
          description = `${event.category}:${event.action}`;
        } else if (event.type === "error") {
          description = event.message;
        } else if (event.type === "state") {
          description = `${event.stateName} = ${event.value}`;
        } else if (event.type === "performance") {
          description = `${event.metric}: ${event.value}${event.unit}`;
        }

        return `<div style="color: ${color}; margin-bottom: 2px;">
          ${icon} [${time}] ${description}
        </div>`;
      })
      .join("");
  }

  formatParticlePoolSection(perfSummary) {
    if (!perfSummary.particlePool) {
      return `
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 8px 0; color: #FF5722;">🎯 Particle Pool</h4>
          <div style="font-size: 10px; color: #888;">
            Not Available - Particle manager not linked
          </div>
        </div>
      `;
    }

    const { stats, health } = perfSummary.particlePool;
    const healthColor = health.isHealthy ? "#4CAF50" : "#F44336";
    const healthIcon = health.isHealthy ? "✅" : "❌";

    return `
      <div style="margin-bottom: 15px;">
        <h4 style="margin: 0 0 8px 0; color: #FF5722;">🎯 Particle Pool</h4>
        <div style="font-size: 10px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <strong>Pool Health:</strong> 
              <span style="color: ${healthColor}">${healthIcon} ${
      health.isHealthy ? "Healthy" : "Issues"
    }</span><br>
              <strong>Active:</strong> ${stats.activeParticles} / ${
      stats.totalPoolSize
    }<br>
              <strong>Utilization:</strong> ${stats.poolUtilization}%
            </div>
            <div>
              <strong>Memory:</strong> ${stats.memoryFootprint.megabytes} MB<br>
              <strong>Efficiency:</strong> ${stats.poolEfficiency}%<br>
              ${
                health.issueCount > 0
                  ? `<span style="color: #F44336;">Issues: ${health.issueCount}</span><br>`
                  : ""
              }
              ${
                health.warningCount > 0
                  ? `<span style="color: #FF9800;">Warnings: ${health.warningCount}</span>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getEventIcon(type) {
    switch (type) {
      case "event":
        return "🎯";
      case "error":
        return "❌";
      case "state":
        return "🔄";
      case "performance":
        return "⏱️";
      default:
        return "📝";
    }
  }

  getEventColor(level) {
    switch (level) {
      case "error":
        return "#F44336";
      case "warning":
        return "#FF9800";
      case "info":
        return "#2196F3";
      default:
        return "#ffffff";
    }
  }

  exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      performance: performanceMonitor.getSummary(),
      events: eventTracker.getEvents(),
      resources: resourceOptimizer.getCacheStats(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    eventTracker.trackEvent("debug", "data_exported", {
      eventCount: eventTracker.getEvents().length,
    });
  }

  clearAll() {
    if (confirm("Clear all performance data? This cannot be undone.")) {
      eventTracker.clear();
      resourceOptimizer.clearCache();
      performanceMonitor.reset();
      this.updateDashboard();

      eventTracker.trackEvent("debug", "all_data_cleared");
    }
  }
}

// Create singleton instance
export const performanceDashboard = new PerformanceDashboard();

export class ProgressManager {
  constructor() {
    this.storageKey = 'superstudent_progress';
    this.levels = ['colors', 'shapes', 'alphabet', 'numbers', 'clcase'];
    this.progress = this.loadProgress();
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load progress:', error);
    }

    // Default progress - ALL levels unlocked from start
    return {
      unlockedLevels: ['colors', 'shapes', 'alphabet', 'numbers', 'clcase'],
      completedLevels: [],
      scores: {},
      totalScore: 0
    };
  }

  saveProgress() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (error) {
      console.warn('Failed to save progress:', error);
    }
  }

  isLevelUnlocked(levelName) {
    return this.progress.unlockedLevels.includes(levelName);
  }

  isLevelCompleted(levelName) {
    return this.progress.completedLevels.includes(levelName);
  }

  completeLevel(levelName, score = 0) {
    // Mark as completed
    if (!this.progress.completedLevels.includes(levelName)) {
      this.progress.completedLevels.push(levelName);
    }

    // Update score
    this.progress.scores[levelName] = Math.max(this.progress.scores[levelName] || 0, score);
    this.progress.totalScore = Object.values(this.progress.scores).reduce((sum, s) => sum + s, 0);

    // Unlock next level
    const currentIndex = this.levels.indexOf(levelName);
    if (currentIndex >= 0 && currentIndex < this.levels.length - 1) {
      const nextLevel = this.levels[currentIndex + 1];
      if (!this.progress.unlockedLevels.includes(nextLevel)) {
        this.progress.unlockedLevels.push(nextLevel);
      }
    }

    this.saveProgress();
  }

  getLevelScore(levelName) {
    return this.progress.scores[levelName] || 0;
  }

  getProgress() {
    return { ...this.progress };
  }

  resetProgress() {
    this.progress = {
      unlockedLevels: ['colors', 'shapes', 'alphabet', 'numbers', 'clcase'],
      completedLevels: [],
      scores: {},
      totalScore: 0
    };
    this.saveProgress();
  }

  getCompletionPercentage() {
    return Math.round((this.progress.completedLevels.length / this.levels.length) * 100);
  }
}

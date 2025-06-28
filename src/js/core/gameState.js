export class GameState {
  constructor() {
    this.score = 0;
    this.currentLevel = null;
    this.progress = {};
  }

  setLevel(level) {
    this.currentLevel = level;
  }

  addScore(points) {
    this.score += points;
  }

  saveProgress(levelKey) {
    this.progress[levelKey] = { score: this.score };
    localStorage.setItem('superStudentProgress', JSON.stringify(this.progress));
  }

  loadProgress() {
    const saved = localStorage.getItem('superStudentProgress');
    if (saved) this.progress = JSON.parse(saved);
    return this.progress;
  }
}

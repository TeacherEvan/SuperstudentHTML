import { BaseLevel } from '../baseLevel.js';
import { BubbleSystem } from './BubbleSystem.js';
import { PhonicsConfig } from './PhonicsConfig.js';

/**
 * PhonicsLevel - Educational bubble-popping game focused on letter sounds
 * Simple, robust, and appealing design with optimized performance
 */
export class PhonicsLevel extends BaseLevel {
  constructor(canvas, ctx, managers, helpers) {
    super(canvas, ctx, managers, helpers);
    
    this.config = PhonicsConfig;
    this.bubbleSystem = null;
    
    // Game state
    this.currentDifficulty = 'easy';
    this.targetLetter = 'A';
    this.correctCount = 0;
    this.totalAttempts = 0;
    this.streak = 0;
    this.timeRemaining = this.config.education.progression.levelDuration;
    this.gameStartTime = 0;
    
    // UI state
    this.showingInstructions = true;
    this.celebrationTime = 0;
    this.instructionAlpha = 1.0;
    this.backgroundGradient = null;
    
    // Performance tracking
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.avgFPS = 60;
    
    // Visual effects
    this.backgroundPhase = 0;
    this.targetLetterPulse = 0;
    
    // Bind methods
    this.onCorrectAnswer = this.onCorrectAnswer.bind(this);
    this.onWrongAnswer = this.onWrongAnswer.bind(this);
  }

  async init() {
    console.log('🫧 Initializing Phonics Level...');
    
    // Initialize bubble system
    this.bubbleSystem = new BubbleSystem(
      this.canvas, 
      this.ctx, 
      this.managers.particleManager,
      this.managers.sound
    );
    
    // Set up event handlers
    this.bubbleSystem.onCorrectAnswer = this.onCorrectAnswer;
    this.bubbleSystem.onWrongAnswer = this.onWrongAnswer;
    
    // Set initial difficulty and target
    this.setDifficulty(this.currentDifficulty);
    this.setNewTarget();
    
    // Create background gradient
    this.createBackgroundGradient();
    
    // Resume audio context for user interaction
    await this.managers.sound.resumeContext();
    
    // Show instructions
    this.showInstructions();
    
    console.log('✅ Phonics Level initialized successfully!');
  }

  createBackgroundGradient() {
    this.backgroundGradient = this.ctx.createLinearGradient(
      0, 0, 0, this.canvas.height
    );
    this.backgroundGradient.addColorStop(0, '#e3f2fd');
    this.backgroundGradient.addColorStop(0.5, '#f8f9fa');
    this.backgroundGradient.addColorStop(1, '#fff3e0');
  }

  setDifficulty(difficulty) {
    this.currentDifficulty = difficulty;
    if (this.bubbleSystem) {
      this.bubbleSystem.setDifficulty(difficulty);
    }
    console.log(`📊 Difficulty set to: ${difficulty}`);
  }

  setNewTarget() {
    const letters = this.config.education.difficulty[this.currentDifficulty].letters;
    this.targetLetter = letters[Math.floor(Math.random() * letters.length)];
    
    if (this.bubbleSystem) {
      this.bubbleSystem.setTargetLetter(this.targetLetter);
    }
    
    // Play target letter sound
    this.managers.sound.playPhonicsSound(this.targetLetter, 0.8);
    
    console.log(`🎯 New target letter: ${this.targetLetter}`);
  }

  showInstructions() {
    this.showingInstructions = true;
    this.instructionAlpha = 1.0;
    
    // Auto-hide instructions after 3 seconds
    setTimeout(() => {
      this.hideInstructions();
    }, 3000);
  }

  hideInstructions() {
    this.showingInstructions = false;
    this.gameStartTime = performance.now();
    
    // Start the game timer
    this.timeRemaining = this.config.education.progression.levelDuration;
  }

  onCorrectAnswer(letter, score) {
    this.correctCount++;
    this.totalAttempts++;
    this.streak++;
    
    // Update score
    this.updateScore(score);
    
    // Check if we need to advance difficulty
    const targetCount = this.config.education.difficulty[this.currentDifficulty].targetCount;
    if (this.correctCount >= targetCount) {
      this.advanceDifficulty();
    } else {
      // Set new target letter
      this.setNewTarget();
    }
    
    // Show celebration effect
    this.showCelebration();
    
    // Update HUD
    if (this.managers.hud) {
      this.managers.hud.updateStats(`Target: ${this.targetLetter} | Streak: ${this.streak} | ${this.correctCount}/${targetCount}`);
    }
    
    console.log(`✅ Correct! ${letter} - Score: ${score}, Streak: ${this.streak}`);
  }

  onWrongAnswer(letter, penalty) {
    this.totalAttempts++;
    this.streak = 0;
    
    // Update score
    this.updateScore(penalty);
    
    // Brief pause for feedback
    setTimeout(() => {
      // Repeat target letter sound
      this.managers.sound.playPhonicsSound(this.targetLetter, 0.8);
    }, this.config.gameplay.pauseOnWrong);
    
    // Update HUD
    if (this.managers.hud) {
      this.managers.hud.updateStats(`Target: ${this.targetLetter} | Streak: ${this.streak} | ${this.correctCount}/${this.config.education.difficulty[this.currentDifficulty].targetCount}`);
    }
    
    console.log(`❌ Wrong! ${letter} - Penalty: ${penalty}, Target was: ${this.targetLetter}`);
  }

  advanceDifficulty() {
    const difficulties = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(this.currentDifficulty);
    
    if (currentIndex < difficulties.length - 1) {
      this.currentDifficulty = difficulties[currentIndex + 1];
      this.setDifficulty(this.currentDifficulty);
      this.correctCount = 0; // Reset progress for new difficulty
      this.setNewTarget();
      
      // Show advancement message
      this.showAdvancementMessage();
      
      console.log(`🎉 Advanced to ${this.currentDifficulty} difficulty!`);
    } else {
      // Completed all difficulties
      this.completeLevel();
    }
  }

  showCelebration() {
    this.celebrationTime = this.config.gameplay.celebrationDuration;
    
    // Create celebration particles
    this.createCelebrationParticles();
  }

  showAdvancementMessage() {
    if (this.managers.checkpoint) {
      this.managers.checkpoint.showCheckpoint(`Level Up!<br>Now playing: ${this.currentDifficulty.toUpperCase()} mode`);
    }
  }

  createCelebrationParticles() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 4;
      const duration = 1000 + Math.random() * 1000;
      
      this.managers.particleManager.createParticle(
        centerX, centerY,
        this.config.visuals.colors.correctGlow,
        size, dx, dy, duration
      );
    }
  }

  completeLevel() {
    console.log('🎉 Level completed!');
    
    // Calculate final score bonus
    const accuracy = this.correctCount / Math.max(1, this.totalAttempts);
    const timeBonus = Math.floor(this.timeRemaining / 1000) * 10;
    const accuracyBonus = Math.floor(accuracy * 500);
    
    this.updateScore(timeBonus + accuracyBonus);
    
    // Show completion message
    if (this.managers.checkpoint) {
      this.managers.checkpoint.showCheckpoint(
        `Phonics Master!<br>Accuracy: ${Math.floor(accuracy * 100)}%<br>Time Bonus: ${timeBonus}<br>Accuracy Bonus: ${accuracyBonus}`
      );
    }
    
    // End the level after celebration
    setTimeout(() => {
      this.end();
    }, 3000);
  }

  update(deltaTime) {
    if (!this.running) return;
    
    // Update performance tracking
    this.updatePerformanceStats(deltaTime);
    
    // Update visual effects
    this.updateVisualEffects(deltaTime);
    
    // Update game timer
    this.updateGameTimer(deltaTime);
    
    // Update bubble system
    if (this.bubbleSystem) {
      this.bubbleSystem.update(deltaTime);
    }
    
    // Update instruction fade
    if (this.showingInstructions) {
      this.updateInstructions(deltaTime);
    }
    
    // Update celebration
    if (this.celebrationTime > 0) {
      this.celebrationTime -= deltaTime;
    }
    
    // Check for level completion conditions
    this.checkLevelCompletion();
  }

  updatePerformanceStats(deltaTime) {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFrameTime >= 1000) {
      this.avgFPS = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
      
      // Adjust quality based on performance
      if (this.avgFPS < 45) {
        this.reducedQuality = true;
      } else if (this.avgFPS > 55) {
        this.reducedQuality = false;
      }
    }
  }

  updateVisualEffects(deltaTime) {
    this.backgroundPhase += deltaTime * 0.001;
    this.targetLetterPulse += deltaTime * 0.005;
  }

  updateGameTimer(deltaTime) {
    if (!this.showingInstructions && this.timeRemaining > 0) {
      this.timeRemaining -= deltaTime;
      
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.completeLevel();
      }
    }
  }

  updateInstructions(deltaTime) {
    // Fade out instructions over time
    if (this.instructionAlpha > 0) {
      this.instructionAlpha -= deltaTime / 1000;
      this.instructionAlpha = Math.max(0, this.instructionAlpha);
    }
  }

  checkLevelCompletion() {
    // Check if all difficulties completed
    if (this.currentDifficulty === 'hard' && 
        this.correctCount >= this.config.education.difficulty.hard.targetCount) {
      this.completeLevel();
    }
  }

  render() {
    if (!this.running) return;
    
    // Clear and draw background
    this.drawBackground();
    
    // Draw bubble system
    if (this.bubbleSystem) {
      this.bubbleSystem.draw(this.ctx);
    }
    
    // Draw UI elements
    this.drawUI();
    
    // Draw instructions if showing
    if (this.showingInstructions) {
      this.drawInstructions();
    }
    
    // Draw celebration effects
    if (this.celebrationTime > 0) {
      this.drawCelebration();
    }
    
    // Draw debug info if needed
    if (this.showDebugInfo) {
      this.drawDebugInfo();
    }
  }

  drawBackground() {
    // Animated gradient background
    this.ctx.fillStyle = this.backgroundGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Subtle animated patterns
    this.ctx.save();
    this.ctx.globalAlpha = 0.1;
    
    // Draw floating circles
    for (let i = 0; i < 5; i++) {
      const x = (i * 0.2 + 0.1) * this.canvas.width;
      const y = this.canvas.height * 0.5 + Math.sin(this.backgroundPhase + i) * 50;
      const radius = 20 + Math.sin(this.backgroundPhase * 0.5 + i) * 10;
      
      this.ctx.fillStyle = this.config.visuals.colors.bubbleBase;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  drawUI() {
    this.ctx.save();
    
    // Draw target letter display
    this.drawTargetLetter();
    
    // Draw progress bar
    this.drawProgress();
    
    // Draw timer
    this.drawTimer();
    
    // Draw score and streak
    this.drawScoreInfo();
    
    this.ctx.restore();
  }

  drawTargetLetter() {
    const centerX = this.canvas.width / 2;
    const y = 80;
    
    // Draw background for target letter
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fillRect(centerX - 60, y - 40, 120, 80);
    
    // Draw border
    this.ctx.strokeStyle = this.config.visuals.colors.correctGlow;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(centerX - 60, y - 40, 120, 80);
    
    // Draw "Find:" label
    this.ctx.fillStyle = this.config.visuals.colors.letterColor;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Find:', centerX, y - 20);
    
    // Draw target letter with pulsing effect
    const pulseScale = 1 + Math.sin(this.targetLetterPulse) * 0.1;
    this.ctx.save();
    this.ctx.scale(pulseScale, pulseScale);
    
    this.ctx.fillStyle = this.config.visuals.colors.letterColor;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.targetLetter, centerX / pulseScale, (y + 15) / pulseScale);
    
    this.ctx.restore();
  }

  drawProgress() {
    const targetCount = this.config.education.difficulty[this.currentDifficulty].targetCount;
    const progress = this.correctCount / targetCount;
    
    const barWidth = 200;
    const barHeight = 20;
    const x = this.canvas.width / 2 - barWidth / 2;
    const y = 150;
    
    // Draw background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw progress
    this.ctx.fillStyle = this.config.visuals.colors.correctGlow;
    this.ctx.fillRect(x, y, barWidth * progress, barHeight);
    
    // Draw text
    this.ctx.fillStyle = this.config.visuals.colors.letterColor;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.correctCount}/${targetCount} - ${this.currentDifficulty.toUpperCase()}`, 
                      this.canvas.width / 2, y + 35);
  }

  drawTimer() {
    const minutes = Math.floor(this.timeRemaining / 60000);
    const seconds = Math.floor((this.timeRemaining % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    this.ctx.fillStyle = this.config.visuals.colors.letterColor;
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(timeString, this.canvas.width - 20, 30);
  }

  drawScoreInfo() {
    this.ctx.fillStyle = this.config.visuals.colors.letterColor;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 20, 30);
    
    if (this.streak > 0) {
      this.ctx.fillStyle = this.config.visuals.colors.correctGlow;
      this.ctx.fillText(`Streak: ${this.streak}`, 20, 55);
    }
  }

  drawInstructions() {
    if (this.instructionAlpha <= 0) return;
    
    this.ctx.save();
    this.ctx.globalAlpha = this.instructionAlpha;
    
    // Draw semi-transparent background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw instructions
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Phonics Bubbles', this.canvas.width / 2, this.canvas.height / 2 - 80);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Pop the bubbles with the target letter!', this.canvas.width / 2, this.canvas.height / 2 - 40);
    this.ctx.fillText('Listen to the letter sounds and learn!', this.canvas.width / 2, this.canvas.height / 2 - 10);
    this.ctx.fillText('Click or tap to start...', this.canvas.width / 2, this.canvas.height / 2 + 40);
    
    this.ctx.restore();
  }

  drawCelebration() {
    const intensity = this.celebrationTime / this.config.gameplay.celebrationDuration;
    
    this.ctx.save();
    this.ctx.globalAlpha = intensity * 0.5;
    
    // Draw celebration glow
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, 200
    );
    gradient.addColorStop(0, this.config.visuals.colors.correctGlow);
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.restore();
  }

  drawDebugInfo() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, this.canvas.height - 100, 200, 90);
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${this.avgFPS}`, 15, this.canvas.height - 80);
    this.ctx.fillText(`Bubbles: ${this.bubbleSystem ? this.bubbleSystem.activeBubbles : 0}`, 15, this.canvas.height - 65);
    this.ctx.fillText(`Target: ${this.targetLetter}`, 15, this.canvas.height - 50);
    this.ctx.fillText(`Difficulty: ${this.currentDifficulty}`, 15, this.canvas.height - 35);
    this.ctx.fillText(`Progress: ${this.correctCount}`, 15, this.canvas.height - 20);
  }

  // Handle user input to start game
  handleInput() {
    if (this.showingInstructions) {
      this.hideInstructions();
    }
  }

  pause() {
    super.pause();
    if (this.bubbleSystem) {
      this.bubbleSystem.removeEventListeners();
    }
  }

  resume() {
    super.resume();
    if (this.bubbleSystem) {
      this.bubbleSystem.setupEventListeners();
    }
  }

  reset() {
    super.reset();
    
    // Reset game state
    this.currentDifficulty = 'easy';
    this.correctCount = 0;
    this.totalAttempts = 0;
    this.streak = 0;
    this.timeRemaining = this.config.education.progression.levelDuration;
    this.celebrationTime = 0;
    
    // Reset bubble system
    if (this.bubbleSystem) {
      this.bubbleSystem.reset();
      this.bubbleSystem.setDifficulty(this.currentDifficulty);
    }
    
    // Reset UI
    this.showingInstructions = true;
    this.instructionAlpha = 1.0;
    
    // Set new target
    this.setNewTarget();
  }

  cleanup() {
    super.cleanup();
    
    if (this.bubbleSystem) {
      this.bubbleSystem.cleanup();
    }
  }

  // Getters for level status
  get accuracy() {
    return this.correctCount / Math.max(1, this.totalAttempts);
  }

  get progress() {
    const targetCount = this.config.education.difficulty[this.currentDifficulty].targetCount;
    return this.correctCount / targetCount;
  }

  get levelInfo() {
    return {
      name: 'Phonics Bubbles',
      difficulty: this.currentDifficulty,
      progress: this.progress,
      accuracy: this.accuracy,
      score: this.score,
      streak: this.streak
    };
  }
}
import { GameLoop } from './gameLoop.js';
import { ResourceManager } from './core/resourceManager.js';
import { InputHandler } from './inputHandler.js';
import { WelcomeScreen } from './ui/welcomeScreen.js';

class SuperStudentGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resourceManager = new ResourceManager();
    this.inputHandler = new InputHandler(this.canvas);
    this.gameLoop = new GameLoop(this.ctx);
  }

  async init() {
    await this.resourceManager.loadAssets();
    this.setupCanvas();
    this.startWelcomeScreen();
    this.gameLoop.start();
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.scale(dpr, dpr);
  }

  startWelcomeScreen() {
    const welcomeScreen = new WelcomeScreen();
    this.gameLoop.setCurrentScreen(welcomeScreen);
  }
}

window.addEventListener('load', () => {
  const game = new SuperStudentGame();
  game.init();
});
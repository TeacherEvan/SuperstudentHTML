/**
 * Basic tests for the SuperStudent HTML5 game core functionality
 */

import { ResourceManager } from '../../src/js/core/resourceManager.js';
import { GameLoop } from '../../src/js/gameLoop.js';
import { WelcomeScreen } from '../../src/js/ui/welcomeScreen.js';

describe('SuperStudent Game Core', () => {
  beforeEach(() => {
    // Setup DOM elements for testing
    document.body.innerHTML = '<canvas id="game-canvas"></canvas>';
  });

  describe('ResourceManager', () => {
    test('should create ResourceManager instance', () => {
      const resourceManager = new ResourceManager();
      expect(resourceManager).toBeDefined();
      expect(resourceManager.assets).toBeInstanceOf(Map);
      expect(resourceManager.loadingProgress).toBe(0);
      expect(resourceManager.totalAssets).toBe(0);
      // loadedAssets is now a Map (via getter), use loadedAssetCount for the count
      expect(resourceManager.loadedAssetCount).toBe(0);
    });

    test('should have loadAssets method', async () => {
      const resourceManager = new ResourceManager();
      expect(typeof resourceManager.loadAssets).toBe('function');
      
      // Test that loadAssets returns a Promise
      const result = resourceManager.loadAssets();
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('GameLoop', () => {
    let canvas, ctx;

    beforeEach(() => {
      canvas = document.getElementById('game-canvas');
      ctx = canvas.getContext('2d');
    });

    test('should create GameLoop instance with canvas context', () => {
      const gameLoop = new GameLoop(ctx);
      expect(gameLoop).toBeDefined();
      expect(gameLoop.ctx).toBe(ctx);
      expect(gameLoop.currentScreen).toBe(null);
      expect(gameLoop.lastTime).toBe(0);
      expect(gameLoop.isRunning).toBe(false);
    });

    test('should have start method', () => {
      const gameLoop = new GameLoop(ctx);
      expect(typeof gameLoop.start).toBe('function');
    });

    test('should have stop method', () => {
      const gameLoop = new GameLoop(ctx);
      expect(typeof gameLoop.stop).toBe('function');
    });

    test('should have setCurrentScreen method', () => {
      const gameLoop = new GameLoop(ctx);
      expect(typeof gameLoop.setCurrentScreen).toBe('function');
      
      const mockScreen = { update: jest.fn(), render: jest.fn() };
      gameLoop.setCurrentScreen(mockScreen);
      expect(gameLoop.currentScreen).toBe(mockScreen);
    });

    test('should start and stop correctly', () => {
      const gameLoop = new GameLoop(ctx);
      
      expect(gameLoop.isRunning).toBe(false);
      gameLoop.start();
      expect(gameLoop.isRunning).toBe(true);
      
      gameLoop.stop();
      expect(gameLoop.isRunning).toBe(false);
    });
  });

  describe('WelcomeScreen', () => {
    test('should create WelcomeScreen instance', () => {
      const welcomeScreen = new WelcomeScreen();
      expect(welcomeScreen).toBeDefined();
    });

    test('should have update method', () => {
      const welcomeScreen = new WelcomeScreen();
      expect(typeof welcomeScreen.update).toBe('function');
      
      // Should not throw when called
      expect(() => welcomeScreen.update(16)).not.toThrow();
    });

    test('should have render method', () => {
      const welcomeScreen = new WelcomeScreen();
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      
      expect(typeof welcomeScreen.render).toBe('function');
      
      // Should not throw when called
      expect(() => welcomeScreen.render(ctx)).not.toThrow();
    });
  });

  describe('Canvas Setup', () => {
    test('should find game canvas element', () => {
      const canvas = document.getElementById('game-canvas');
      expect(canvas).toBeTruthy();
      expect(canvas.tagName).toBe('CANVAS');
    });

    test('should get 2d rendering context', () => {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      expect(ctx).toBeTruthy();
    });
  });
});
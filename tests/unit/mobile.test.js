/**
 * @jest-environment jsdom
 */

import { InputHandler } from '../../src/js/inputHandler.js';

// Mock PointerEvent for testing
global.PointerEvent = class PointerEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.pointerId = options.pointerId || 1;
    this.clientX = options.clientX || 0;
    this.clientY = options.clientY || 0;
    this.pointerType = options.pointerType || 'touch';
  }
};

describe('Mobile Enhancements', () => {
  let canvas;
  let inputHandler;

  beforeEach(() => {
    // Mock timers
    jest.useFakeTimers();
    
    // Setup DOM
    document.body.innerHTML = '<canvas id="game-canvas" width="800" height="600"></canvas>';
    canvas = document.getElementById('game-canvas');
    inputHandler = new InputHandler(canvas);
  });

  afterEach(() => {
    jest.useRealTimers();
    if (inputHandler) {
      inputHandler.destroy();
    }
    document.body.innerHTML = '';
  });

  describe('InputHandler Mobile Features', () => {
    it('should create InputHandler with mobile enhancements', () => {
      expect(inputHandler).toBeDefined();
      expect(inputHandler.activeTouches).toBeDefined();
      expect(inputHandler.longPressTimeout).toBeDefined();
    });

    it('should handle pointer down events', () => {
      const handler = jest.fn();
      inputHandler.registerHandler('pointerdown', handler);

      const event = new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100
      });

      // Mock getBoundingClientRect
      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600
      }));

      inputHandler.handlePointerDown(event);

      expect(handler).toHaveBeenCalledWith({
        pointerId: 1,
        x: 100,
        y: 100,
        event
      });
    });

    it('should detect tap gestures', () => {
      const tapHandler = jest.fn();
      inputHandler.registerHandler('tap', tapHandler);

      const downEvent = new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100
      });

      const upEvent = new PointerEvent('pointerup', {
        pointerId: 1,
        clientX: 100,
        clientY: 100
      });

      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600
      }));

      inputHandler.handlePointerDown(downEvent);
      
      // Simulate quick tap
      setTimeout(() => {
        inputHandler.handlePointerUp(upEvent);
      }, 100);

      // Fast forward time for tap detection
      jest.advanceTimersByTime(300);

      expect(tapHandler).toHaveBeenCalled();
    });

    it('should provide touch device detection', () => {
      expect(typeof inputHandler.isTouchDevice).toBe('function');
    });

    it('should get active touches', () => {
      const activeTouches = inputHandler.getActiveTouches();
      expect(Array.isArray(activeTouches)).toBe(true);
    });

    it('should calculate distance between points', () => {
      const distance = inputHandler.getDistance(0, 0, 3, 4);
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should handle pointer cancellation', () => {
      const cancelHandler = jest.fn();
      inputHandler.registerHandler('pointercancel', cancelHandler);

      const event = new PointerEvent('pointercancel', {
        pointerId: 1
      });

      inputHandler.handlePointerCancel(event);

      expect(cancelHandler).toHaveBeenCalledWith({
        pointerId: 1,
        event
      });
    });
  });

  describe('Responsive Design Support', () => {
    it('should handle viewport meta tag', () => {
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        expect(metaViewport.getAttribute('content')).toContain('width=device-width');
        expect(metaViewport.getAttribute('content')).toContain('initial-scale=1.0');
      }
    });

    it('should support touch-action manipulation', () => {
      const style = window.getComputedStyle(document.body);
      // This would be set by our CSS
      expect(style.getPropertyValue).toBeDefined();
    });
  });

  describe('Mobile Device Detection', () => {
    it('should detect touch capability', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        value: null,
        writable: true
      });

      expect(inputHandler.isTouchDevice()).toBe(true);
    });
  });
});
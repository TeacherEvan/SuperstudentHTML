import { GAME_CONFIG } from '../../src/js/config/constants.js';
import { EventTracker } from '../../src/js/utils/eventTracker.js';
import ResourceManager from '../../src/js/core/resources/resourceManager.js';

describe('Game Integration Tests', () => {
  let eventTracker;
  let resourceManager;

  beforeEach(() => {
    eventTracker = new EventTracker({
      overlay: false,
      consoleLogging: false
    });
    
    resourceManager = new ResourceManager();
    
    // Mock DOM elements and APIs
    global.FontFace = jest.fn().mockImplementation(() => ({
      load: jest.fn().mockResolvedValue()
    }));
    
    global.document.fonts = {
      add: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration and Resource Loading Integration', () => {
    test('should use configuration to validate resource loading', () => {
      // Verify configuration is accessible
      expect(GAME_CONFIG.DISPLAY_MODES).toContain('DEFAULT');
      expect(GAME_CONFIG.DISPLAY_MODES).toContain('QBOARD');
      
      // Verify resource manager respects configuration-like constraints
      const fontUrl = './assets/fonts/game-font.ttf';
      const isValid = resourceManager.validateUrl(fontUrl, 'fonts');
      expect(isValid).toBe(true);
      
      // Test that invalid resources are rejected
      const invalidUrl = './assets/scripts/malicious.js';
      const isInvalid = resourceManager.validateUrl(invalidUrl, 'fonts');
      expect(isInvalid).toBe(false);
    });

    test('should track resource loading events', async () => {
      // Mock event tracking
      const trackEventSpy = jest.spyOn(eventTracker, 'trackEvent');
      
      // ResourceManager would typically use eventTracker for logging
      // Simulate this integration
      eventTracker.trackEvent('resource', 'load_start', {
        type: 'font',
        name: 'TestFont',
        url: './fonts/test.ttf'
      });
      
      expect(trackEventSpy).toHaveBeenCalledWith('resource', 'load_start', {
        type: 'font',
        name: 'TestFont', 
        url: './fonts/test.ttf'
      });
      
      // Verify the event was logged
      const events = eventTracker.getEvents({ category: 'resource' });
      expect(events).toHaveLength(1);
      expect(events[0].action).toBe('load_start');
    });

    test('should handle different display modes consistently', () => {
      // Test that both display modes are properly configured
      GAME_CONFIG.DISPLAY_MODES.forEach(mode => {
        expect(GAME_CONFIG.FONT_SIZES[mode]).toBeDefined();
        expect(GAME_CONFIG.FONT_SIZES[mode].regular).toBeGreaterThan(0);
        expect(GAME_CONFIG.FONT_SIZES[mode].large).toBeGreaterThan(0);
      });
      
      // Resource manager should accept fonts for any display mode
      const fontTypes = ['.ttf', '.woff', '.woff2'];
      fontTypes.forEach(ext => {
        const url = `./fonts/font-${GAME_CONFIG.DEFAULT_MODE.toLowerCase()}${ext}`;
        expect(resourceManager.validateUrl(url, 'fonts')).toBe(true);
      });
    });

    test('should track errors and maintain system integrity', () => {
      const trackErrorSpy = jest.spyOn(eventTracker, 'trackError');
      
      // Simulate an error scenario
      const error = new Error('Failed to load critical resource');
      eventTracker.trackError(error, {
        type: 'resource',
        critical: true,
        gameState: 'loading'
      });
      
      expect(trackErrorSpy).toHaveBeenCalledWith(error, {
        type: 'resource',
        critical: true,
        gameState: 'loading'
      });
      
      // Verify system can still function after error
      expect(GAME_CONFIG.DEFAULT_MODE).toBe('DEFAULT');
      expect(resourceManager.validateUrl('./valid/font.ttf', 'fonts')).toBe(true);
    });
  });

  describe('Game State Management', () => {
    test('should handle state transitions with proper logging', () => {
      const states = ['menu', 'loading', 'playing', 'paused', 'gameOver'];
      
      states.forEach((state, index) => {
        eventTracker.trackState('gameState', state, states[index - 1] || null);
      });
      
      const stateEvents = eventTracker.getEvents({ type: 'state' });
      expect(stateEvents).toHaveLength(states.length);
      
      // Verify final state
      expect(stateEvents[stateEvents.length - 1].stateName).toBe('gameState');
      expect(stateEvents[stateEvents.length - 1].value).toBe('gameOver');
    });

    test('should maintain performance metrics during gameplay', () => {
      // Simulate performance tracking during game execution
      const metrics = [
        { name: 'frameRate', value: 60, unit: 'fps' },
        { name: 'renderTime', value: 16.7, unit: 'ms' },
        { name: 'memoryUsage', value: 45, unit: 'MB' }
      ];
      
      metrics.forEach(metric => {
        eventTracker.trackPerformance(metric.name, metric.value, metric.unit);
      });
      
      const perfEvents = eventTracker.getEvents({ type: 'performance' });
      expect(perfEvents).toHaveLength(metrics.length);
      
      // Verify all metrics were tracked with correct values
      metrics.forEach((metric, index) => {
        expect(perfEvents[index].metric).toBe(metric.name);
        expect(perfEvents[index].value).toBe(metric.value);
        expect(perfEvents[index].unit).toBe(metric.unit);
      });
    });
  });
});
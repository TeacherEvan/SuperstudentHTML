import { EventTracker } from '../../src/js/utils/eventTracker.js';

describe('EventTracker', () => {
  let eventTracker;
  let consoleLogSpy;

  beforeEach(() => {
    eventTracker = new EventTracker({
      overlay: false,
      consoleLogging: false, // Disable console logging for tests
      maxLogEntries: 5
    });
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    test('should create instance with default options', () => {
      const tracker = new EventTracker();
      expect(tracker.options.overlay).toBe(true);
      expect(tracker.options.consoleLogging).toBe(true);
      expect(tracker.options.logLevel).toBe('all');
      expect(tracker.options.maxLogEntries).toBe(1000);
    });

    test('should merge custom options', () => {
      const customOptions = {
        overlay: false,
        maxLogEntries: 100,
        logLevel: 'errors'
      };
      const tracker = new EventTracker(customOptions);
      expect(tracker.options.overlay).toBe(false);
      expect(tracker.options.maxLogEntries).toBe(100);
      expect(tracker.options.logLevel).toBe('errors');
      expect(tracker.options.consoleLogging).toBe(true); // default preserved
    });

    test('should initialize empty event log', () => {
      expect(eventTracker.eventLog).toEqual([]);
      expect(eventTracker.isInitialized).toBe(false);
    });
  });

  describe('trackEvent', () => {
    test('should add event to log', () => {
      eventTracker.trackEvent('test', 'action1', { data: 'value' });
      
      expect(eventTracker.eventLog).toHaveLength(1);
      expect(eventTracker.eventLog[0]).toMatchObject({
        type: 'event',
        category: 'test',
        action: 'action1',
        data: { data: 'value' },
        level: 'info'
      });
      expect(eventTracker.eventLog[0].timestamp).toBeCloseTo(Date.now(), -2);
    });

    test('should track event without data', () => {
      eventTracker.trackEvent('test', 'action2');
      
      expect(eventTracker.eventLog).toHaveLength(1);
      expect(eventTracker.eventLog[0]).toMatchObject({
        type: 'event',
        category: 'test',
        action: 'action2',
        data: {}
      });
    });

    test('should console log when enabled', () => {
      const tracker = new EventTracker({ consoleLogging: true });
      tracker.trackEvent('test', 'action', { value: 123 });
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🎯 \[.*\] test:action/),
        { value: 123 }
      );
    });
  });

  describe('trackPerformance', () => {
    test('should track performance metrics with default unit', () => {
      eventTracker.trackPerformance('render_time', 16.5);
      
      expect(eventTracker.eventLog).toHaveLength(1);
      expect(eventTracker.eventLog[0]).toMatchObject({
        type: 'performance',
        metric: 'render_time',
        value: 16.5,
        unit: 'ms',
        level: 'info'
      });
    });

    test('should track performance metrics with custom unit', () => {
      eventTracker.trackPerformance('memory_usage', 1024, 'KB');
      
      expect(eventTracker.eventLog[0]).toMatchObject({
        metric: 'memory_usage',
        value: 1024,
        unit: 'KB'
      });
    });
  });

  describe('log size management', () => {
    test('should limit log entries to maxLogEntries', () => {
      // Add more entries than the limit (5)
      for (let i = 0; i < 7; i++) {
        eventTracker.trackEvent('test', `action${i}`);
      }
      
      expect(eventTracker.eventLog).toHaveLength(5);
      // Should keep the latest entries
      expect(eventTracker.eventLog[0].action).toBe('action2');
      expect(eventTracker.eventLog[4].action).toBe('action6');
    });
  });

  describe('getEvents', () => {
    test('should return event log', () => {
      eventTracker.trackEvent('test', 'action1');
      eventTracker.trackEvent('test', 'action2');
      
      const log = eventTracker.getEvents();
      expect(log).toHaveLength(2);
    });

    test('should filter events when filter is provided', () => {
      eventTracker.trackEvent('category1', 'action1');
      eventTracker.trackEvent('category2', 'action2');
      eventTracker.trackEvent('category1', 'action3');
      
      const filteredLog = eventTracker.getEvents({ category: 'category1' });
      expect(filteredLog).toHaveLength(2);
      expect(filteredLog.every(entry => entry.category === 'category1')).toBe(true);
    });
  });
});
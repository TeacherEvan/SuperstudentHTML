import { GAME_CONFIG, validateConfig } from '../../src/js/config/constants.js';

describe('Game Configuration', () => {
  describe('GAME_CONFIG', () => {
    test('should have all required properties', () => {
      expect(GAME_CONFIG).toHaveProperty('DISPLAY_MODES');
      expect(GAME_CONFIG).toHaveProperty('DEFAULT_MODE');
      expect(GAME_CONFIG).toHaveProperty('FONT_SIZES');
      expect(GAME_CONFIG).toHaveProperty('COLORS');
    });

    test('should have correct display modes', () => {
      expect(GAME_CONFIG.DISPLAY_MODES).toContain('DEFAULT');
      expect(GAME_CONFIG.DISPLAY_MODES).toContain('QBOARD');
      expect(GAME_CONFIG.DEFAULT_MODE).toBe('DEFAULT');
    });

    test('should have font sizes for both display modes', () => {
      expect(GAME_CONFIG.FONT_SIZES.DEFAULT).toHaveProperty('regular');
      expect(GAME_CONFIG.FONT_SIZES.DEFAULT).toHaveProperty('large');
      expect(GAME_CONFIG.FONT_SIZES.QBOARD).toHaveProperty('regular');
      expect(GAME_CONFIG.FONT_SIZES.QBOARD).toHaveProperty('large');
    });

    test('should have color definitions', () => {
      expect(GAME_CONFIG.COLORS.WHITE).toEqual([255, 255, 255]);
      expect(GAME_CONFIG.COLORS.BLACK).toEqual([0, 0, 0]);
      expect(Array.isArray(GAME_CONFIG.COLORS.FLAME_COLORS)).toBe(true);
      expect(GAME_CONFIG.COLORS.FLAME_COLORS.length).toBeGreaterThan(0);
    });

    test('should be immutable (frozen)', () => {
      expect(Object.isFrozen(GAME_CONFIG)).toBe(true);
      expect(Object.isFrozen(GAME_CONFIG.DISPLAY_MODES)).toBe(true);
      expect(Object.isFrozen(GAME_CONFIG.FONT_SIZES)).toBe(true);
      expect(Object.isFrozen(GAME_CONFIG.COLORS)).toBe(true);
    });
  });

  describe('validateConfig', () => {
    test('should validate correct config', () => {
      expect(() => validateConfig(GAME_CONFIG)).not.toThrow();
    });

    test('should throw error for missing DISPLAY_MODES', () => {
      const invalidConfig = { DEFAULT_MODE: 'DEFAULT' };
      expect(() => validateConfig(invalidConfig)).toThrow('Invalid DISPLAY_MODES configuration');
    });

    test('should throw error for non-array DISPLAY_MODES', () => {
      const invalidConfig = { DISPLAY_MODES: 'invalid' };
      expect(() => validateConfig(invalidConfig)).toThrow('Invalid DISPLAY_MODES configuration');
    });
  });
});
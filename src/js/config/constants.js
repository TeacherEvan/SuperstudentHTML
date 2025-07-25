export const GAME_CONFIG = Object.freeze({
  DISPLAY_MODES: Object.freeze(['DEFAULT', 'QBOARD']),
  DEFAULT_MODE: 'DEFAULT',
  
  FONT_SIZES: Object.freeze({
    DEFAULT: Object.freeze({ regular: 24, large: 48 }),
    QBOARD: Object.freeze({ regular: 30, large: 60 })
  }),
  
  // Prevent accidental mutation of config
  COLORS: Object.freeze({
    WHITE: Object.freeze([255, 255, 255]),
    BLACK: Object.freeze([0, 0, 0]),
    FLAME_COLORS: Object.freeze([
      Object.freeze([255, 69, 0]),
      Object.freeze([255, 215, 0]),
      Object.freeze([0, 191, 255])
    ])
  })
});

// Validation helper
export function validateConfig(config) {
  if (!config.DISPLAY_MODES || !Array.isArray(config.DISPLAY_MODES)) {
    throw new Error('Invalid DISPLAY_MODES configuration');
  }
  // Additional validation...
}
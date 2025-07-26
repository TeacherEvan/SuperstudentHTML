export const GAME_CONFIG = Object.freeze({
  // Display modes
  DISPLAY_MODES: Object.freeze(["DEFAULT", "QBOARD"]),
  DEFAULT_MODE: "DEFAULT",

  // Font sizes by display mode
  FONT_SIZES: Object.freeze({
    DEFAULT: Object.freeze({ regular: 24, large: 48 }),
    QBOARD: Object.freeze({ regular: 30, large: 60 }),
  }),

  // Performance settings by display mode
  MAX_PARTICLES: Object.freeze({ DEFAULT: 100, QBOARD: 150 }),
  MAX_EXPLOSIONS: Object.freeze({ DEFAULT: 5, QBOARD: 8 }),
  MAX_SWIRL_PARTICLES: Object.freeze({ DEFAULT: 30, QBOARD: 15 }),
  MOTHER_RADIUS: Object.freeze({ DEFAULT: 90, QBOARD: 120 }),

  // Colors
  COLORS: Object.freeze({
    WHITE: Object.freeze([255, 255, 255]),
    BLACK: Object.freeze([0, 0, 0]),
    FLAME_COLORS: Object.freeze([
      Object.freeze([255, 69, 0]), // Red-orange
      Object.freeze([255, 215, 0]), // Gold
      Object.freeze([0, 191, 255]), // Bright blue
    ]),
    COLORS_LIST: Object.freeze([
      Object.freeze([0, 0, 255]), // Blue
      Object.freeze([255, 0, 0]), // Red
      Object.freeze([0, 200, 0]), // Green
      Object.freeze([255, 255, 0]), // Yellow
      Object.freeze([128, 0, 255]), // Purple
    ]),
  }),

  // Game sequences
  SEQUENCES: Object.freeze({
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
    numbers: Object.freeze(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]),
    clcase: "abcdefghijklmnopqrstuvwxyz".split(""),
    shapes: Object.freeze([
      "Circle",
      "Square",
      "Triangle",
      "Rectangle",
      "Pentagon",
    ]),
    colors: Object.freeze(["Blue", "Red", "Green", "Yellow", "Purple"]),
  }),

  // Timing and gameplay
  LETTER_SPAWN_INTERVAL: 60, // frames
  GROUP_SIZE: 5,
  COLORS_COLLISION_DELAY: 250, // milliseconds
  TOUCH_COOLDOWN: 50, // milliseconds

  // Physics and movement
  DOT_RADIUS: 48,
  DOT_SPEED_RANGE: Object.freeze([3, 6]),
  EXPLOSION_EXPANSION_RATE: 0.1,
  SCREEN_SHAKE_DURATION: 10,

  // Performance optimizations
  SPATIAL_GRID_SIZE: 120,
  COLLISION_CHECK_FREQUENCY: Object.freeze({ DEFAULT: 1, QBOARD: 2 }),
  CULLING_DISTANCE_MULTIPLIER: 1.0,

  // Level-specific configurations for colors and text levels
  COLORS_LEVEL_CONFIG: Object.freeze({
    TOTAL_DOTS: 85,
    TARGET_DOTS: 17,
    DISTRACTOR_DOTS: 68,
    DISPERSION_FRAMES: 30,
    DOT_BOUNCE_DAMPENING: 0.98,
    SHIMMER_FREQUENCY: 0.05,
    GLOW_FREQUENCY: 0.1,
    MEMORY_DISPLAY_TIME: 2000,
    COLLISION_ENABLED_DELAY: 250,
    GRID_OPTIMIZATION: true,
  }),

  TEXT_LEVEL_CONFIG: Object.freeze({
    CENTER_FONT_SIZE: 900,
    FALLING_FONT_SIZE: 240,
    SPAWN_EDGE_BUFFER: 50,
    TARGET_ADVANCE_COUNT: 5,
    CHECKPOINT_INTERVAL: 5,
    ABILITIES: Object.freeze(["laser", "aoe", "charge_up"]),
    AOE_RADIUS: 200,
    CHARGE_UP_DURATION: 60,
    LASER_WIDTH: Object.freeze([3, 5]),
    SWIRL_PARTICLE_COUNT: 30,
    CENTER_PIECE_ORBIT_RADIUS: 100,
  }),

  // Audio configuration
  AUDIO_CONFIG: Object.freeze({
    MASTER_VOLUME: 0.7,
    SFX_VOLUME: 0.8,
    MUSIC_VOLUME: 0.3,
    SOUNDS: Object.freeze({
      laser: Object.freeze({ file: "laser.mp3", volume: 0.6 }),
      completion: Object.freeze({ file: "completion.mp3", volume: 1.0 }),
    }),
    AMBIENT: Object.freeze({
      space: Object.freeze({
        file: "ambient_space.mp3",
        volume: 0.2,
        loop: true,
      }),
    }),
    WEB_AUDIO_CONTEXT: true,
    BUFFER_PRELOAD: true,
  }),
});

import { GAME_CONFIG } from './constants.js';

/**
 * Detects whether to use DEFAULT or QBOARD mode based on screen resolution.
 * @returns {'DEFAULT'|'QBOARD'}
 */
export function detectDisplayMode() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return (width > 2560 && height > 1440) ? 'QBOARD' : 'DEFAULT';
}

/**
 * Returns display-specific settings from GAME_CONFIG.
 */
export function getDisplaySettings() {
  const mode = detectDisplayMode();
  return {
    fontSizes: GAME_CONFIG.FONT_SIZES[mode],
    maxParticles: GAME_CONFIG.MAX_PARTICLES[mode],
    maxExplosions: GAME_CONFIG.MAX_EXPLOSIONS[mode],
    motherRadius: GAME_CONFIG.MOTHER_RADIUS[mode],
    collisionFrequency: GAME_CONFIG.COLLISION_CHECK_FREQUENCY[mode]
  };
}

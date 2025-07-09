import { GAME_CONFIG } from '../../config/constants.js';

/**
 * Returns audio configuration settings.
 */
export function getAudioConfig() {
  return {
    masterVolume: GAME_CONFIG.AUDIO_CONFIG?.MASTER_VOLUME ?? 0.7,
    sfxVolume: GAME_CONFIG.AUDIO_CONFIG?.SFX_VOLUME ?? 0.8,
    musicVolume: GAME_CONFIG.AUDIO_CONFIG?.MUSIC_VOLUME ?? 0.3,
    sounds: GAME_CONFIG.AUDIO_CONFIG?.SOUNDS ?? {},
    ambient: GAME_CONFIG.AUDIO_CONFIG?.AMBIENT ?? {},
    webAudioContext: GAME_CONFIG.AUDIO_CONFIG?.WEB_AUDIO_CONTEXT ?? true,
    bufferPreload: GAME_CONFIG.AUDIO_CONFIG?.BUFFER_PRELOAD ?? true
  };
}

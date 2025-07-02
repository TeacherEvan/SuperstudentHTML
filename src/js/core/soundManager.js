import { getAudioConfig } from '../config/audioConfig.js';

export default class SoundManager {
  constructor() {
    const audioConfig = getAudioConfig();
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Store current volume for reference
    this.volume = audioConfig.masterVolume;
    // Master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.audioContext.destination);
    // Category gains
    this.gains = {
      sfx: this.audioContext.createGain(),
      music: this.audioContext.createGain(),
      ambient: this.audioContext.createGain()
    };
    this.gains.sfx.gain.value = audioConfig.sfxVolume;
    this.gains.music.gain.value = audioConfig.musicVolume;
    this.gains.ambient.gain.value = audioConfig.musicVolume;
    this.gains.sfx.connect(this.masterGain);
    this.gains.music.connect(this.masterGain);
    this.gains.ambient.connect(this.masterGain);
    // Buffers storage
    this.buffers = {}; // { name: { buffer, type } }
    this.activeSources = {};
    this.sounds = {}; // For preloaded audio compatibility
  }

  async loadSound(name, url, type = 'sfx') {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.buffers[name] = { buffer, type };
  }

  playSound(name) {
    const entry = this.buffers[name];
    if (!entry) return;
    const source = this.audioContext.createBufferSource();
    source.buffer = entry.buffer;
    source.connect(this.gains[entry.type] || this.gains.sfx);
    source.start(0);
    return source;
  }

  playMusic(name, loop = true) {
    const entry = this.buffers[name];
    if (!entry) return;
    if (this.activeSources[name]) {
      this.activeSources[name].stop();
    }
    const source = this.audioContext.createBufferSource();
    source.buffer = entry.buffer;
    source.loop = loop;
    source.connect(this.gains.music);
    source.start(0);
    this.activeSources[name] = source;
  }

  playAmbient(name, loop = true) {
    const entry = this.buffers[name];
    if (!entry) return;
    if (this.activeSources[name]) {
      this.activeSources[name].stop();
    }
    const source = this.audioContext.createBufferSource();
    source.buffer = entry.buffer;
    source.loop = loop;
    source.connect(this.gains.ambient);
    source.start(0);
    this.activeSources[name] = source;
  }

  stop(name) {
    const source = this.activeSources[name];
    if (source) {
      source.stop();
      delete this.activeSources[name];
    }
  }

  setMasterVolume(value) {
    this.volume = value; // Keep volume property in sync
    this.masterGain.gain.value = value;
  }

  // Add missing setGlobalVolume method that's called in main.js
  setGlobalVolume(value) {
    this.setMasterVolume(value);
  }

  setCategoryVolume(category, value) {
    if (this.gains[category]) {
      this.gains[category].gain.value = value;
    }
  }

  // Ensure AudioContext is running after user interaction
  async resumeContext() {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Fade a category gain to a target volume over a duration (ms)
   * @param {string} category - 'sfx'|'music'|'ambient'
   * @param {number} target - target gain value
   * @param {number} duration - fade duration in milliseconds
   */
  fadeCategoryVolume(category, target, duration = 500) {
    const gainNode = this.gains[category] || this.masterGain;
    const now = this.audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(target, now + duration / 1000);
  }

  /**
   * Mute all sounds (instant)
   */
  mute() {
    this.setMasterVolume(0);
  }

  /**
   * Unmute all sounds (restore to config master volume)
   */
  unmute() {
    const { masterVolume } = getAudioConfig();
    this.setMasterVolume(masterVolume);
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    if (this.masterGain.gain.value > 0) {
      this.mute();
    } else {
      this.unmute();
    }
  }
}

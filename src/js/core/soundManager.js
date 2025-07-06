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
      ambient: this.audioContext.createGain(),
      phonics: this.audioContext.createGain() // Added for phonics sounds
    };
    
    this.gains.sfx.gain.value = audioConfig.sfxVolume;
    this.gains.music.gain.value = audioConfig.musicVolume;
    this.gains.ambient.gain.value = audioConfig.musicVolume;
    this.gains.phonics.gain.value = audioConfig.sfxVolume;
    
    // Connect all gains to master
    Object.values(this.gains).forEach(gain => gain.connect(this.masterGain));
    
    // Buffers storage
    this.buffers = {}; // { name: { buffer, type } }
    this.activeSources = {};
    this.sounds = {}; // For preloaded audio compatibility

    
    // Enhanced features
    this.volume = audioConfig.masterVolume;
    this.sounds = {}; // Direct sound access for ResourceManager
    this.phonicsCache = new Map(); // Cache for phonics sounds
    this.soundQueue = []; // Queue for sequenced sounds
    this.isProcessingQueue = false;
    
    // Performance optimization
    this.maxConcurrentSounds = 8;
    this.activeSoundsCount = 0;
    
    // Initialize default sounds
    this.initializeDefaultSounds();
  }

  initializeDefaultSounds() {
    // Create synthetic sounds for immediate gameplay
    this.createSyntheticSounds();
  }

  createSyntheticSounds() {
    // Create basic synthetic sounds for immediate use
    const sampleRate = this.audioContext.sampleRate;
    
    // Pop sound for bubbles
    const popBuffer = this.audioContext.createBuffer(1, sampleRate * 0.1, sampleRate);
    const popData = popBuffer.getChannelData(0);
    for (let i = 0; i < popData.length; i++) {
      const t = i / sampleRate;
      popData[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 20) * 0.3;
    }
    this.buffers['pop'] = { buffer: popBuffer, type: 'sfx' };
    
    // Success sound
    const successBuffer = this.audioContext.createBuffer(1, sampleRate * 0.3, sampleRate);
    const successData = successBuffer.getChannelData(0);
    for (let i = 0; i < successData.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3);
      successData[i] = (
        Math.sin(2 * Math.PI * 440 * t) * 0.3 +
        Math.sin(2 * Math.PI * 554 * t) * 0.2 +
        Math.sin(2 * Math.PI * 659 * t) * 0.1
      ) * envelope;
    }
    this.buffers['success'] = { buffer: successBuffer, type: 'sfx' };
    
    // Wrong sound
    const wrongBuffer = this.audioContext.createBuffer(1, sampleRate * 0.2, sampleRate);
    const wrongData = wrongBuffer.getChannelData(0);
    for (let i = 0; i < wrongData.length; i++) {
      const t = i / sampleRate;
      wrongData[i] = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 10) * 0.4;
    }
    this.buffers['wrong'] = { buffer: wrongBuffer, type: 'sfx' };
    
    // Explosion sound
    const explosionBuffer = this.audioContext.createBuffer(1, sampleRate * 0.4, sampleRate);
    const explosionData = explosionBuffer.getChannelData(0);
    for (let i = 0; i < explosionData.length; i++) {
      const t = i / sampleRate;
      const noise = (Math.random() - 0.5) * 2;
      const envelope = Math.exp(-t * 5);
      explosionData[i] = noise * envelope * 0.3;
    }
    this.buffers['explosion'] = { buffer: explosionBuffer, type: 'sfx' };
  }

  async loadSound(name, url, type = 'sfx') {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers[name] = { buffer, type };
      this.sounds[name] = buffer; // For ResourceManager compatibility
      return buffer;
    } catch (error) {
      console.warn(`Failed to load sound ${name}:`, error);
      return null;
    }
  }

  playSound(name, volume = 1.0, pitch = 1.0) {
    if (this.activeSoundsCount >= this.maxConcurrentSounds) {
      return null; // Skip if too many sounds playing
    }
    
    const entry = this.buffers[name];
    if (!entry) {
      console.warn(`Sound ${name} not found`);
      return null;
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = entry.buffer;
    
    // Add volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(this.gains[entry.type] || this.gains.sfx);
    
    // Add pitch control
    source.playbackRate.value = pitch;
    
    source.start(0);
    this.activeSoundsCount++;
    
    source.onended = () => {
      this.activeSoundsCount--;
    };
    
    return source;
  }

  playPhonicsSound(letter, volume = 1.0) {
    // Play phonetic sound for a letter
    const soundName = `phonics_${letter.toLowerCase()}`;
    
    // Check cache first
    if (this.phonicsCache.has(soundName)) {
      return this.playSound(soundName, volume);
    }
    
    // Generate synthetic phonics sound if not available
    return this.generateSyntheticPhonicsSound(letter, volume);
  }

  generateSyntheticPhonicsSound(letter, volume = 1.0) {
    // Create a simple synthetic phonics sound
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Basic phonics mapping to frequencies
    const phonicsMap = {
      'a': [800, 1200], 'b': [100, 200], 'c': [200, 300], 'd': [150, 250],
      'e': [500, 700], 'f': [300, 400], 'g': [120, 220], 'h': [100, 150],
      'i': [300, 500], 'j': [200, 400], 'k': [250, 350], 'l': [400, 600],
      'm': [150, 300], 'n': [200, 400], 'o': [400, 600], 'p': [100, 200],
      'q': [250, 450], 'r': [300, 500], 's': [500, 800], 't': [400, 600],
      'u': [300, 500], 'v': [200, 400], 'w': [250, 450], 'x': [300, 600],
      'y': [400, 700], 'z': [400, 800]
    };
    
    const freqs = phonicsMap[letter.toLowerCase()] || [400, 600];
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 10));
      data[i] = (
        Math.sin(2 * Math.PI * freqs[0] * t) * 0.3 +
        Math.sin(2 * Math.PI * freqs[1] * t) * 0.2
      ) * envelope * volume;
    }
    
    // Cache the generated sound
    const soundName = `phonics_${letter.toLowerCase()}`;
    this.buffers[soundName] = { buffer, type: 'phonics' };
    this.phonicsCache.set(soundName, buffer);
    
    return this.playSound(soundName, volume);
  }

  playMusic(name, loop = true, volume = 1.0) {
    const entry = this.buffers[name];
    if (!entry) return null;
    
    if (this.activeSources[name]) {
      this.activeSources[name].stop();
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = entry.buffer;
    source.loop = loop;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(this.gains.music);
    
    source.start(0);
    this.activeSources[name] = source;
    
    return source;
  }

  playAmbient(name, loop = true, volume = 1.0) {
    const entry = this.buffers[name];
    if (!entry) return null;
    
    if (this.activeSources[name]) {
      this.activeSources[name].stop();
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = entry.buffer;
    source.loop = loop;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(this.gains.ambient);
    
    source.start(0);
    this.activeSources[name] = source;
    
    return source;
  }

  // Enhanced sound effects for game interactions
  playExplosion(intensity = 1.0) {
    return this.playSound('explosion', intensity, 0.8 + Math.random() * 0.4);
  }

  playPop(intensity = 1.0) {
    return this.playSound('pop', intensity, 0.9 + Math.random() * 0.2);
  }

  playSuccess() {
    return this.playSound('success', 1.0);
  }

  playWrong() {
    return this.playSound('wrong', 1.0);
  }

  // Sound sequencing for educational feedback
  playSequence(sounds, delay = 200) {
    this.soundQueue.push({ sounds, delay });
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.isProcessingQueue = true;
    
    while (this.soundQueue.length > 0) {
      const { sounds, delay } = this.soundQueue.shift();
      
      for (let i = 0; i < sounds.length; i++) {
        const sound = sounds[i];
        if (typeof sound === 'string') {
          this.playSound(sound);
        } else if (sound.type === 'phonics') {
          this.playPhonicsSound(sound.letter, sound.volume);
        } else if (sound.type === 'sound') {
          this.playSound(sound.name, sound.volume, sound.pitch);
        }
        
        if (i < sounds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  stop(name) {
    const source = this.activeSources[name];
    if (source) {
      source.stop();
      delete this.activeSources[name];
    }
  }

  stopAll() {
    Object.values(this.activeSources).forEach(source => {
      if (source && typeof source.stop === 'function') {
        source.stop();
      }
    });
    this.activeSources = {};
    this.activeSoundsCount = 0;
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
   * @param {string} category - 'sfx'|'music'|'ambient'|'phonics'
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

  /**
   * Create dynamic sound effect
   */
  createDynamicSound(frequency, duration, type = 'sine', volume = 0.3) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.value = volume;
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gains.sfx);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
    
    return oscillator;
  }

  /**
   * Get audio context for advanced audio processing
   */
  getAudioContext() {
    return this.audioContext;
  }

  /**
   * Check if sound is available
   */
  hasSounds() {
    return Object.keys(this.buffers).length > 0;
  }

  /**
   * Get available sounds list
   */
  getAvailableSounds() {
    return Object.keys(this.buffers);
  }
}

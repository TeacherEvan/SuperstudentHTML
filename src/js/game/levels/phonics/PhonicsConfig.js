/**
 * Phonics Level Configuration
 * Optimized for educational value and smooth performance
 */

export const PhonicsConfig = {
  // Performance settings
  performance: {
    maxBubbles: 12,
    maxParticles: 100,
    targetFPS: 60,
    bubblePoolSize: 20,
    particlePoolSize: 50
  },
  
  // Bubble physics
  physics: {
    gravity: 0.1,
    buoyancy: 0.15,
    drag: 0.98,
    pop: {
      minForce: 0.5,
      maxForce: 2.0,
      particleCount: 8
    },
    bounce: {
      damping: 0.7,
      elasticity: 0.3
    }
  },
  
  // Visual settings
  visuals: {
    bubbleSize: {
      min: 40,
      max: 80
    },
    colors: {
      bubbleBase: 'rgba(173, 216, 230, 0.8)',
      bubbleHighlight: 'rgba(255, 255, 255, 0.9)',
      bubbleShadow: 'rgba(0, 0, 0, 0.1)',
      letterColor: '#2c3e50',
      correctGlow: '#2ecc71',
      wrongGlow: '#e74c3c',
      background: '#f8f9fa'
    },
    effects: {
      shimmer: {
        enabled: true,
        intensity: 0.3,
        speed: 0.1
      },
      floating: {
        enabled: true,
        amplitude: 2,
        frequency: 0.05
      },
      glow: {
        enabled: true,
        radius: 20,
        intensity: 0.5
      }
    }
  },
  
  // Educational settings
  education: {
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    phonicsMap: {
      'A': { sound: 'ay', frequency: [800, 1200] },
      'B': { sound: 'buh', frequency: [100, 200] },
      'C': { sound: 'kuh', frequency: [200, 300] },
      'D': { sound: 'duh', frequency: [150, 250] },
      'E': { sound: 'ee', frequency: [500, 700] },
      'F': { sound: 'fuh', frequency: [300, 400] },
      'G': { sound: 'guh', frequency: [120, 220] },
      'H': { sound: 'huh', frequency: [100, 150] },
      'I': { sound: 'eye', frequency: [300, 500] },
      'J': { sound: 'juh', frequency: [200, 400] },
      'K': { sound: 'kuh', frequency: [250, 350] },
      'L': { sound: 'luh', frequency: [400, 600] },
      'M': { sound: 'muh', frequency: [150, 300] },
      'N': { sound: 'nuh', frequency: [200, 400] },
      'O': { sound: 'oh', frequency: [400, 600] },
      'P': { sound: 'puh', frequency: [100, 200] },
      'Q': { sound: 'kwuh', frequency: [250, 450] },
      'R': { sound: 'ruh', frequency: [300, 500] },
      'S': { sound: 'sss', frequency: [500, 800] },
      'T': { sound: 'tuh', frequency: [400, 600] },
      'U': { sound: 'ooo', frequency: [300, 500] },
      'V': { sound: 'vuh', frequency: [200, 400] },
      'W': { sound: 'wuh', frequency: [250, 450] },
      'X': { sound: 'ks', frequency: [300, 600] },
      'Y': { sound: 'yuh', frequency: [400, 700] },
      'Z': { sound: 'zuh', frequency: [400, 800] }
    },
    difficulty: {
      easy: {
        letters: ['A', 'B', 'C', 'D', 'E'],
        spawnRate: 2000,
        bubbleSpeed: 0.5,
        targetCount: 3
      },
      medium: {
        letters: ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'],
        spawnRate: 1500,
        bubbleSpeed: 0.7,
        targetCount: 5
      },
      hard: {
        letters: ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
        spawnRate: 1200,
        bubbleSpeed: 0.9,
        targetCount: 7
      }
    },
    progression: {
      levelDuration: 60000, // 1 minute
      correctScorePoints: 100,
      wrongScorePenalty: -25,
      streakMultiplier: 1.5,
      maxStreak: 5
    }
  },
  
  // Game mechanics
  gameplay: {
    spawnZone: {
      x: 0.1, // 10% from left
      y: 0.9, // 90% from top (bottom)
      width: 0.8, // 80% of screen width
      height: 0.1 // 10% of screen height
    },
    targetZone: {
      x: 0.2, // 20% from left
      y: 0.1, // 10% from top
      width: 0.6, // 60% of screen width
      height: 0.3 // 30% of screen height
    },
    bubbleLifetime: 15000, // 15 seconds
    comboWindow: 3000, // 3 seconds for combo
    pauseOnWrong: 500, // 0.5 second pause on wrong answer
    celebrationDuration: 2000 // 2 seconds celebration
  },
  
  // Audio settings
  audio: {
    phonics: {
      volume: 0.8,
      pitch: 1.0,
      playOnSpawn: true,
      playOnPop: true,
      repeatDelay: 1000
    },
    effects: {
      bubblePop: { volume: 0.6, pitch: 1.0 },
      correct: { volume: 0.7, pitch: 1.0 },
      wrong: { volume: 0.5, pitch: 0.8 },
      levelComplete: { volume: 0.8, pitch: 1.0 },
      combo: { volume: 0.6, pitch: 1.2 }
    }
  }
};
import { BaseLevel } from '../baseLevel.js';
import Bubble from './bubble.js';

export default class BubblePopLevel extends BaseLevel {
  constructor(canvas, ctx, managers, helpers) {
    super(canvas, ctx, managers, helpers);

    this.bubbles = [];
    this.spawnInterval = 1200; // ms initial
    this.spawnTimer = 0;
    this.maxBubbles = 40;
    this.elapsed = 0;
    this.timeLimit = 90000; // 90s
    this.letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    this.onPointerDown = this.onPointerDown.bind(this);
    this.soundsLoaded = false;
  }

  async init() {
    await this.preloadSounds();
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
  }

  async preloadSounds() {
    if (this.soundsLoaded) return;
    const soundPromises = [];
    const basePath = 'assets/bubblePop/sounds';
    const SAMPLE_DATA_URI = 'data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YQAAAC7AAAAEQAAAAUAAAAEAAAABcADwAAAAAAAEAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABACAEQAAQAEQABQAEQAAQAEQAAAAA=';

    this.letters.forEach(letter => {
      const name = `letter_${letter}`;
      const url = `${basePath}/letters/${letter}.mp3`;
      if (this.managers.sound.buffers[name]) return;
      soundPromises.push(
        this.managers.sound.loadSound(name, url, 'sfx').catch(() =>
          this.managers.sound.loadSound(name, SAMPLE_DATA_URI, 'sfx')
        )
      );
    });

    // Pop sound
    if (!this.managers.sound.buffers['bubble_pop']) {
      soundPromises.push(
        this.managers.sound.loadSound('bubble_pop', `${basePath}/pop.mp3`, 'sfx').catch(() =>
          this.managers.sound.loadSound('bubble_pop', SAMPLE_DATA_URI, 'sfx')
        )
      );
    }
    await Promise.all(soundPromises);
    this.soundsLoaded = true;
  }

  spawnBubble() {
    if (this.bubbles.length >= this.maxBubbles) return;
    const radius = 28 + Math.random() * 12; // 28-40px
    const x = radius + Math.random() * (this.canvas.width - radius * 2);
    const y = this.canvas.height + radius; // start below bottom
    const speed = 50 + Math.random() * 70; // px per second
    const letter = this.letters[Math.floor(Math.random() * this.letters.length)];
    this.bubbles.push(new Bubble(x, y, radius, letter, speed));
  }

  update(deltaTime) {
    if (!this.running) return;
    this.elapsed += deltaTime;
    this.spawnTimer += deltaTime;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnBubble();

      // Gradually increase difficulty by decreasing spawn interval down to 500ms
      if (this.spawnInterval > 500) {
        this.spawnInterval -= 10; // Remove 10ms per spawn
      }
    }

    // Update bubbles
    this.bubbles.forEach(b => b.update(deltaTime));
    // Remove popped or off-screen bubbles
    this.bubbles = this.bubbles.filter(b => !b.markedForRemoval);

    // End conditions
    if (this.elapsed >= this.timeLimit || this.score >= 260) {
      this.end();
    }
  }

  render() {
    // Draw bubbles
    this.bubbles.forEach(b => b.draw(this.ctx));
  }

  onPointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    // Iterate reverse so topmost bubble gets hit first
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (b.containsPoint(x, y)) {
        // Pop
        b.markedForRemoval = true;
        this.helpers.createExplosion(b.x, b.y, 'rgba(135,206,250,0.8)', 1);
        this.updateScore(10);

        const letterSoundName = `letter_${b.letter}`;
        this.managers.sound.playSound(letterSoundName);
        this.managers.sound.playSound('bubble_pop');
        break;
      }
    }
  }

  cleanup() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.bubbles = [];
  }
}
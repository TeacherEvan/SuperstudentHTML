export default class ResourceManager {
  constructor() {
    this.fonts = {};
    this.images = {};
    this.audio = {};
  }

  async loadFont(name, url) {
    const font = new FontFace(name, `url(${url})`);
    await font.load();
    document.fonts.add(font);
    this.fonts[name] = font;
  }

  async loadImage(name, url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { this.images[name] = img; resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }

  async loadAudio(name, url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => { this.audio[name] = audio; resolve(audio); };
      audio.onerror = reject;
      audio.src = url;
    });
  }

  async initializeGameResources() {
    // Try to load resources, but don't fail if they're not available
    try {
      await this.loadFont('TitleFont', 'assets/fonts/title.ttf');
    } catch (e) {
      console.warn('Could not load title font, using fallback');
    }
    
    try {
      await this.loadFont('SubtitleFont', 'assets/fonts/subtitle.ttf');
    } catch (e) {
      console.warn('Could not load subtitle font, using fallback');
    }
    
    try {
      await this.loadFont('BodyFont', 'assets/fonts/body.ttf');
    } catch (e) {
      console.warn('Could not load body font, using fallback');
    }
    
    try {
      await this.loadImage('placeholder', 'assets/images/placeholder.svg');
    } catch (e) {
      console.warn('Could not load placeholder image');
    }
    
    try {
      await this.loadAudio('laser', 'assets/sounds/laser.mp3');
    } catch (e) {
      console.warn('Could not load laser sound');
    }
    try {
      await this.loadAudio('completion', 'assets/sounds/completion.mp3');
    } catch (e) {
      console.warn('Could not load completion sound');
    }
    try {
      await this.loadAudio('ambient_space', 'assets/sounds/ambient_space.mp3');
    } catch (e) {
      console.warn('Could not load ambient space sound');
    }
    
    return { fonts: this.fonts, images: this.images, audio: this.audio };
  }

  setDisplayMode(mode) {
    localStorage.setItem('displayMode', mode);
  }

  getDisplayMode() {
    return localStorage.getItem('displayMode') || 'DEFAULT';
  }

  // Test method to verify resource loading functionality
  testResourceLoading() {
    console.log('Testing resource loading...');
    console.log('Loaded fonts:', Object.keys(this.fonts));
    console.log('Loaded images:', Object.keys(this.images));
    console.log('Loaded audio:', Object.keys(this.audio));
    
    // Test if placeholder image is loaded and accessible
    if (this.images.placeholder) {
      console.log('✓ Placeholder image loaded successfully');
      console.log('  - Width:', this.images.placeholder.width || 'Not loaded yet');
      console.log('  - Height:', this.images.placeholder.height || 'Not loaded yet');
    } else {
      console.log('✗ Placeholder image not loaded');
    }
    
    return {
      fontsCount: Object.keys(this.fonts).length,
      imagesCount: Object.keys(this.images).length,
      audioCount: Object.keys(this.audio).length
    };
  }
}

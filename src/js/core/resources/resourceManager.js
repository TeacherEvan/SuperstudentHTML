export default class ResourceManager {
  constructor() {
    this.fonts = {};
    this.images = {};
    this.audio = {};
    this.allowedDomains = ['localhost', '127.0.0.1', window.location.hostname];
    this.allowedExtensions = {
      fonts: ['.ttf', '.otf', '.woff', '.woff2'],
      images: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
      audio: ['.mp3', '.wav', '.ogg', '.m4a']
    };
  }

  /**
   * Validates and sanitizes URLs to prevent loading malicious content
   * @param {string} url - The URL to validate
   * @param {string} type - The resource type (fonts, images, audio)
   * @returns {boolean} - True if URL is valid and safe
   */
  validateUrl(url, type) {
    try {
      // Check if URL is relative (safe)
      if (url.startsWith('./') || url.startsWith('../') || url.startsWith('/')) {
        return this.validateFileExtension(url, type);
      }

      // Parse absolute URLs
      const urlObj = new URL(url);

      // Check protocol (only allow http/https)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        console.warn(`Invalid protocol in URL: ${url}`);
        return false;
      }

      // Check domain whitelist
      if (!this.allowedDomains.includes(urlObj.hostname)) {
        console.warn(`Domain not allowed: ${urlObj.hostname}`);
        return false;
      }

      // Check file extension
      return this.validateFileExtension(url, type);
    } catch (error) {
      console.error(`Invalid URL: ${url}`, error);
      return false;
    }
  }

  /**
   * Validates file extension for a given resource type
   * @param {string} url - The URL to check
   * @param {string} type - The resource type
   * @returns {boolean} - True if extension is allowed
   */
  validateFileExtension(url, type) {
    const allowedExts = this.allowedExtensions[type];
    if (!allowedExts) return false;

    const lowerUrl = url.toLowerCase();
    return allowedExts.some(ext => lowerUrl.endsWith(ext));
  }

  async loadFont(name, url) {
    if (!this.validateUrl(url, 'fonts')) {
      throw new Error(`Invalid or unsafe font URL: ${url}`);
    }

    try {
      const font = new FontFace(name, `url(${url})`);
      await font.load();
      document.fonts.add(font);
      this.fonts[name] = font;
      return font;
    } catch (error) {
      console.error(`Failed to load font ${name} from ${url}:`, error);
      throw error;
    }
  }

  async loadImage(name, url) {
    if (!this.validateUrl(url, 'images')) {
      throw new Error(`Invalid or unsafe image URL: ${url}`);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images[name] = img;
        resolve(img);
      };
      img.onerror = (error) => {
        console.error(`Failed to load image ${name} from ${url}:`, error);
        reject(error);
      };
      img.src = url;
    });
  }

  async loadAudio(name, url) {
    if (!this.validateUrl(url, 'audio')) {
      throw new Error(`Invalid or unsafe audio URL: ${url}`);
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.audio[name] = audio;
        resolve(audio);
      };
      audio.onerror = (error) => {
        console.error(`Failed to load audio ${name} from ${url}:`, error);
        reject(error);
      };
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
    // Deactivate external audio asset loading to avoid missing file errors
    // try {
    //   await this.loadAudio('laser', 'assets/sounds/laser.mp3');
    // } catch (e) {
    //   console.warn('Could not load laser sound');
    // }
    // try {
    //   await this.loadAudio('completion', 'assets/sounds/completion.mp3');
    // } catch (e) {
    //   console.warn('Could not load completion sound');
    // }
    // try {
    //   await this.loadAudio('ambient_space', 'assets/sounds/ambient_space.mp3');
    // } catch (e) {
    //   console.warn('Could not load ambient space sound');
    // }

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

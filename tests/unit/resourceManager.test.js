import ResourceManager from '../../src/js/core/resources/resourceManager.js';

// Mock eventTracker
jest.mock('../../src/js/utils/eventTracker.js', () => ({
  eventTracker: {
    trackEvent: jest.fn(),
    trackError: jest.fn()
  }
}));

describe('ResourceManager', () => {
  let resourceManager;

  beforeEach(() => {
    resourceManager = new ResourceManager();
    
    // Mock FontFace for tests
    global.FontFace = jest.fn().mockImplementation((name, source) => ({
      load: jest.fn().mockResolvedValue(),
      family: name,
      source: source
    }));
    
    // Mock document.fonts
    global.document.fonts = {
      add: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with empty resource collections', () => {
      expect(resourceManager.fonts).toEqual({});
      expect(resourceManager.images).toEqual({});
      expect(resourceManager.audio).toEqual({});
    });

    test('should set default allowed domains', () => {
      expect(resourceManager.allowedDomains).toContain('localhost');
      expect(resourceManager.allowedDomains).toContain('127.0.0.1');
      expect(resourceManager.allowedDomains).toContain(window.location.hostname);
    });

    test('should define allowed file extensions', () => {
      expect(resourceManager.allowedExtensions.fonts).toContain('.ttf');
      expect(resourceManager.allowedExtensions.fonts).toContain('.woff2');
      expect(resourceManager.allowedExtensions.images).toContain('.png');
      expect(resourceManager.allowedExtensions.images).toContain('.jpg');
      expect(resourceManager.allowedExtensions.audio).toContain('.mp3');
      expect(resourceManager.allowedExtensions.audio).toContain('.wav');
    });
  });

  describe('validateFileExtension', () => {
    test('should validate correct font extensions', () => {
      expect(resourceManager.validateFileExtension('font.ttf', 'fonts')).toBe(true);
      expect(resourceManager.validateFileExtension('font.woff2', 'fonts')).toBe(true);
      expect(resourceManager.validateFileExtension('FONT.TTF', 'fonts')).toBe(true);
    });

    test('should validate correct image extensions', () => {
      expect(resourceManager.validateFileExtension('image.png', 'images')).toBe(true);
      expect(resourceManager.validateFileExtension('photo.jpg', 'images')).toBe(true);
      expect(resourceManager.validateFileExtension('icon.svg', 'images')).toBe(true);
    });

    test('should validate correct audio extensions', () => {
      expect(resourceManager.validateFileExtension('sound.mp3', 'audio')).toBe(true);
      expect(resourceManager.validateFileExtension('music.wav', 'audio')).toBe(true);
      expect(resourceManager.validateFileExtension('effect.ogg', 'audio')).toBe(true);
    });

    test('should reject invalid extensions', () => {
      expect(resourceManager.validateFileExtension('file.txt', 'fonts')).toBe(false);
      expect(resourceManager.validateFileExtension('script.js', 'images')).toBe(false);
      expect(resourceManager.validateFileExtension('video.mp4', 'audio')).toBe(false);
    });

    test('should reject unknown resource types', () => {
      expect(resourceManager.validateFileExtension('file.txt', 'unknown')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    test('should allow relative URLs with valid extensions', () => {
      expect(resourceManager.validateUrl('./fonts/font.ttf', 'fonts')).toBe(true);
      expect(resourceManager.validateUrl('../images/image.png', 'images')).toBe(true);
      expect(resourceManager.validateUrl('/audio/sound.mp3', 'audio')).toBe(true);
    });

    test('should reject relative URLs with invalid extensions', () => {
      expect(resourceManager.validateUrl('./files/file.txt', 'fonts')).toBe(false);
      expect(resourceManager.validateUrl('../scripts/script.js', 'images')).toBe(false);
    });

    test('should allow HTTPS URLs from allowed domains', () => {
      expect(resourceManager.validateUrl('https://localhost/font.ttf', 'fonts')).toBe(true);
      expect(resourceManager.validateUrl('http://127.0.0.1/image.png', 'images')).toBe(true);
    });

    test('should reject URLs with invalid protocols', () => {
      expect(resourceManager.validateUrl('ftp://localhost/font.ttf', 'fonts')).toBe(false);
      expect(resourceManager.validateUrl('file:///local/image.png', 'images')).toBe(false);
      expect(resourceManager.validateUrl('javascript:alert(1)', 'audio')).toBe(false);
    });

    test('should reject URLs from disallowed domains', () => {
      expect(resourceManager.validateUrl('https://evil.com/font.ttf', 'fonts')).toBe(false);
      expect(resourceManager.validateUrl('http://malicious.org/image.png', 'images')).toBe(false);
    });

    test('should handle malformed URLs gracefully', () => {
      expect(resourceManager.validateUrl('not-a-url', 'fonts')).toBe(false);
      expect(resourceManager.validateUrl('', 'images')).toBe(false);
      expect(resourceManager.validateUrl(null, 'audio')).toBe(false);
    });
  });

  describe('loadFont', () => {
    test('should load valid font successfully', async () => {
      const mockFont = { load: jest.fn().mockResolvedValue() };
      global.FontFace.mockReturnValue(mockFont);

      const result = await resourceManager.loadFont('TestFont', './fonts/test.ttf');

      expect(global.FontFace).toHaveBeenCalledWith('TestFont', 'url(./fonts/test.ttf)');
      expect(mockFont.load).toHaveBeenCalled();
      expect(document.fonts.add).toHaveBeenCalledWith(mockFont);
      expect(resourceManager.fonts.TestFont).toBe(mockFont);
      expect(result).toBe(mockFont);
    });

    test('should reject invalid font URL', async () => {
      await expect(
        resourceManager.loadFont('BadFont', './fonts/bad.txt')
      ).rejects.toThrow('Invalid or unsafe font URL: ./fonts/bad.txt');

      expect(resourceManager.fonts.BadFont).toBeUndefined();
      expect(global.FontFace).not.toHaveBeenCalled();
    });

    test('should handle font loading errors', async () => {
      const mockFont = { 
        load: jest.fn().mockRejectedValue(new Error('Font load failed')) 
      };
      global.FontFace.mockReturnValue(mockFont);

      await expect(
        resourceManager.loadFont('FailFont', './fonts/fail.ttf')
      ).rejects.toThrow('Font load failed');

      expect(resourceManager.fonts.FailFont).toBeUndefined();
    });
  });
});
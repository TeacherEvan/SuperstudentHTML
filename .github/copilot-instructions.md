# GitHub Copilot Instructions for SuperstudentHTML

## Project Overview
SuperstudentHTML is an educational HTML5 game that teaches children colors, shapes, alphabet, numbers, and case matching through interactive gameplay. The project is built with modern web technologies and follows a modular architecture pattern.

## Architecture Patterns

### Module System
- Use ES6 modules with explicit imports/exports
- Each class should be in its own file with a descriptive name
- Import paths should be relative and include the `.js` extension
- Follow the pattern: `import { ClassName } from './path/to/file.js'`

### Class Structure
- Use ES6 classes with proper encapsulation
- Constructor should initialize all properties
- Use private fields (prefixed with `#`) for internal state when appropriate
- Follow camelCase naming for methods and properties
- Use PascalCase for class names

### Manager Pattern
The project uses a Manager pattern for organizing game systems:
- **Manager classes** handle specific aspects of the game (HUD, checkpoints, flamethrower, etc.)
- Each manager should be stateful and self-contained
- Managers should expose clear public APIs for interaction
- Place managers in `src/js/managers/` directory

Example manager structure:
```javascript
export class ExampleManager {
  constructor(gameContext) {
    this.gameContext = gameContext;
    this.isActive = false;
    // Initialize other properties
  }

  update(deltaTime) {
    // Update logic
  }

  render(ctx) {
    // Rendering logic
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }
}
```

### Level System
Educational content is organized into levels:
- All levels should extend `BaseLevel` class
- Each level implements specific educational content (colors, shapes, etc.)
- Levels should handle their own game logic, scoring, and progression
- Place levels in `src/js/levels/` directory

### Resource Management
- Use `ResourceManager` for loading and managing assets
- Assets include fonts, images, and audio files
- All asset loading should be asynchronous
- Cache assets in a Map for efficient retrieval

## File Organization

```
src/
├── js/
│   ├── main.js              # Entry point, game initialization
│   ├── gameLoop.js          # Main game loop and timing
│   ├── inputHandler.js      # Input processing
│   ├── core/                # Core engine systems
│   │   ├── resourceManager.js
│   │   ├── soundManager.js
│   │   ├── particleSystem.js
│   │   └── gameState.js
│   ├── managers/            # Game system managers
│   ├── levels/             # Educational game levels
│   ├── ui/                 # User interface components
│   ├── effects/            # Visual and audio effects
│   └── utils/              # Utility functions
└── css/                    # Stylesheets
```

## Coding Conventions

### Naming Conventions
- **Files**: camelCase with descriptive names (e.g., `hudManager.js`, `colorsLevel.js`)
- **Classes**: PascalCase (e.g., `ResourceManager`, `AlphabetLevel`)
- **Methods/Properties**: camelCase (e.g., `updateScore`, `isGameActive`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_SCORE`, `DEFAULT_VOLUME`)

### Code Style
- Use 2 spaces for indentation
- Use single quotes for strings
- Use template literals for string interpolation
- Prefer const/let over var
- Use arrow functions for callbacks and short functions
- Add JSDoc comments for complex methods

### Error Handling
- Use try-catch blocks for async operations
- Log errors with descriptive messages
- Gracefully handle missing assets or failed operations
- Provide fallbacks for non-critical failures

## Game-Specific Guidelines

### Educational Content
- Each level should focus on one learning objective
- Provide clear visual and audio feedback for correct/incorrect answers
- Use age-appropriate colors, fonts, and animations
- Implement progressive difficulty within each level

### Performance Considerations
- Use object pooling for frequently created/destroyed objects (particles, UI elements)
- Implement efficient canvas rendering with minimal state changes
- Use requestAnimationFrame for smooth animations
- Optimize asset loading with appropriate formats and sizes

### Audio System
- Support both sound effects and background music
- Use Web Audio API through the SoundManager
- Provide volume controls and mute functionality
- Preload critical audio files

### Visual Effects
- Use the ParticleSystem for explosion and feedback effects
- Implement smooth transitions between game states
- Support responsive design for different screen sizes
- Use CSS animations for UI elements when appropriate

## Testing Guidelines

### Unit Tests (Jest)
- Test core game logic and managers
- Mock external dependencies (canvas, audio)
- Focus on business logic rather than DOM manipulation
- Place tests in `tests/unit/` directory

### E2E Tests (Playwright)
- Test complete user workflows
- Verify game progression and scoring
- Test cross-browser compatibility
- Place tests in `tests/e2e/` directory

### Performance Tests
- Monitor frame rate during gameplay
- Test asset loading performance
- Verify memory usage with long play sessions
- Place tests in `tests/performance/` directory

## Build and Development

### Development Workflow
- Use `npm run dev` for development with hot reload
- Use `npm run build` for production builds
- Run `npm run lint` before committing code
- Use `npm test` to run all tests

### Asset Guidelines
- **Images**: Use PNG for sprites, JPG for backgrounds, SVG for icons
- **Audio**: Use MP3 for compatibility, keep files under 1MB for SFX
- **Fonts**: Use WOFF2/WOFF formats for web optimization
- Organize assets by type in the `assets/` directory

## Common Patterns to Follow

### Canvas Rendering
```javascript
render(ctx) {
  ctx.save();
  // Set up transforms and styles
  ctx.translate(this.x, this.y);
  ctx.rotate(this.rotation);
  
  // Draw content
  ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
  
  ctx.restore();
}
```

### Event Handling
```javascript
constructor() {
  this.handleClick = this.handleClick.bind(this);
  this.canvas.addEventListener('click', this.handleClick);
}

handleClick(event) {
  const rect = this.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  // Handle click at (x, y)
}
```

### Async Asset Loading
```javascript
async loadAssets() {
  try {
    const assets = await Promise.all([
      this.loadImage('sprite.png'),
      this.loadSound('effect.mp3'),
      this.loadFont('game-font.woff2')
    ]);
    return assets;
  } catch (error) {
    console.error('Failed to load assets:', error);
    throw error;
  }
}
```

## Accessibility Considerations
- Provide keyboard navigation alternatives
- Use semantic HTML structure
- Include ARIA labels for screen readers
- Support high contrast mode
- Provide text alternatives for audio content

## Browser Support
- Target modern browsers with ES2020+ support
- Use feature detection for newer APIs
- Provide fallbacks for unsupported features
- Test on mobile devices and tablets

When generating code for this project, prioritize educational value, clean architecture, and maintainable code that follows these established patterns.
# Copilot Instructions for SuperstudentHTML

## Project Overview

SuperstudentHTML is an educational HTML5 game that reimplements the Super Student game using modern web technologies. It features multiple educational game modes including colors, shapes, alphabet, numbers, and case matching exercises designed for interactive learning.

## Technology Stack

- **Frontend**: HTML5 Canvas API for rendering, vanilla JavaScript ES6+ modules
- **Build System**: Webpack 5 with development server and hot reload
- **Styling**: CSS3 with modern features, processed through Webpack
- **Testing**: Jest for unit tests, Playwright for end-to-end testing
- **Code Quality**: ESLint for linting, Prettier for formatting
- **Audio**: Web Audio API for sound management
- **Assets**: Images (PNG, JPG, SVG, WebP), fonts (WOFF2, WOFF, TTF), audio (MP3, WAV, OGG)

## Architecture

The game follows a modular architecture with clear separation of concerns:

### Core Components
- **Game Loop** (`src/js/gameLoop.js`): Main game rendering and update cycle
- **Resource Manager** (`src/js/core/resourceManager.js`): Asset loading and management
- **Input Handler** (`src/js/inputHandler.js`): Mouse/touch/keyboard input processing
- **Screen System** (`src/js/ui/`): Welcome screen, game screens, UI management

### Game Systems
- **Managers** (`src/js/managers/`): HUD, checkpoint, effects, multi-touch handling
- **Effects** (`src/js/effects/`): Particle system, glass shatter, visual feedback
- **Levels** (`src/js/levels/`): Educational game mode implementations
- **Utils** (`src/js/utils/`): Helper functions and utilities

## File Organization

```
/
├── src/js/           # Main source code (ES6 modules)
│   ├── main.js       # Application entry point
│   ├── gameLoop.js   # Core game loop
│   ├── core/         # Core engine components
│   ├── managers/     # Game system managers
│   ├── effects/      # Visual effects and particles
│   ├── levels/       # Educational game modes
│   ├── ui/           # User interface components
│   └── utils/        # Helper utilities
├── src/css/          # Stylesheets (imported by JS)
├── js/main.js        # Webpack entry point (re-exports src/js/main.js)
├── css/              # Legacy CSS files
├── assets/           # Game assets
│   ├── images/       # Sprites, backgrounds, UI graphics
│   ├── sounds/       # Audio files and music
│   └── fonts/        # Typography assets
├── tests/            # Test files organized by type
│   ├── unit/         # Jest unit tests
│   ├── integration/  # Integration tests
│   ├── e2e/          # Playwright end-to-end tests
│   └── performance/  # Performance benchmarks
└── dist/             # Webpack build output (auto-generated)
```

## Coding Standards

### JavaScript
- **ES Version**: ES2021+ (modern syntax preferred)
- **Module System**: ES6 modules (`import`/`export`)
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Always required
- **Variables**: Use `const` by default, `let` when reassignment needed, avoid `var`
- **Functions**: Arrow functions for callbacks, regular functions for methods
- **Classes**: Use ES6 class syntax with proper constructor patterns

### Code Quality Rules
- No unused variables (warn, except underscore-prefixed)
- Console logs allowed for debugging
- No debugger statements in production
- Prefer template literals for string interpolation
- Use destructuring for object/array extraction
- Follow camelCase naming convention

### Global Variables
The following globals are available in the game context:
- `game`: Main game instance
- `canvas`: HTML5 canvas element
- `ctx`: Canvas 2D rendering context

## Development Workflow

### Commands
- `npm run dev`: Start development server with hot reload on port 3000
- `npm run build`: Create production build in `dist/`
- `npm run test`: Run Jest unit tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:e2e`: Run Playwright end-to-end tests
- `npm run lint`: Check code with ESLint
- `npm run lint:fix`: Auto-fix linting issues
- `npm run format`: Format code with Prettier

### Development Server
- Hot reload enabled for JS, CSS, and HTML changes
- Source maps enabled for debugging
- Asset processing for images, fonts, and audio
- Development server runs on `http://localhost:3000`

### Build Process
- Webpack bundles all modules into optimized chunks
- Assets are processed and copied with content hashing
- CSS is extracted and minified
- JavaScript is transpiled with Babel for browser compatibility

## Asset Management

### Images
- **Preferred Formats**: PNG for sprites/UI, JPG for backgrounds, SVG for icons, WebP for optimization
- **Naming Convention**: Descriptive kebab-case (`player-idle.png`, `letter-a.svg`)
- **Organization**: Group by type in subdirectories within `assets/images/`
- **Size Considerations**: Keep reasonable file sizes for web delivery

### Audio
- **Formats**: MP3 (primary), WAV (high quality), OGG (fallback)
- **Categories**: Sound effects (SFX) and background music
- **Size Limits**: <1MB for SFX, <5MB for music
- **Sample Rate**: 44.1kHz recommended

### Fonts
- **Formats**: WOFF2 (primary), WOFF (fallback), TTF (legacy support)
- **Required Variants**: `regular`, `target`, `title` font styles
- **Loading**: Managed automatically via ResourceManager

## Game-Specific Patterns

### Canvas Rendering
- Use device pixel ratio for crisp rendering on high-DPI displays
- Implement efficient rendering with minimal state changes
- Cache rendered elements when possible
- Clear canvas areas only when necessary

### Game Loop
- Delta time-based animations for consistent timing
- Separate update and render phases
- Handle pause/resume functionality
- Proper cleanup on game state transitions

### Resource Loading
- Preload all assets before game start
- Handle loading failures gracefully
- Display loading progress to users
- Cache loaded resources for reuse

### Particle Systems
- Use object pooling to reduce garbage collection pressure
- Implement efficient particle lifecycle management
- Provide configurable particle properties
- Clean up expired particles automatically

## Performance Considerations

- **Canvas Optimization**: Minimize drawing operations and state changes
- **Memory Management**: Use object pooling for frequently created/destroyed objects
- **Asset Loading**: Lazy load non-critical assets when possible
- **Animation**: Use requestAnimationFrame for smooth animations
- **Delta Time**: Ensure consistent performance across different frame rates

## Testing Guidelines

### Unit Tests (Jest)
- Test individual classes and functions in isolation
- Mock external dependencies (canvas, audio, etc.)
- Focus on business logic and game mechanics
- Use descriptive test names and arrange/act/assert pattern

### Integration Tests
- Test component interactions and data flow
- Verify game state transitions
- Test resource loading and management
- Validate input handling integration

### E2E Tests (Playwright)
- Test complete user workflows
- Verify game functionality in real browsers
- Test responsive behavior and touch interactions
- Validate audio/visual feedback

## Common Patterns

### Error Handling
- Use try/catch blocks for async operations
- Provide fallbacks for missing assets
- Log errors appropriately for debugging
- Display user-friendly error messages

### State Management
- Centralize game state in clear objects
- Use immutable updates when possible
- Implement proper state transitions
- Validate state consistency

### Event Handling
- Use event delegation for performance
- Clean up event listeners properly
- Handle both mouse and touch events
- Provide keyboard accessibility

## Browser Support

- **Primary Target**: Modern browsers with ES2021+ support
- **Required APIs**: Canvas 2D, Web Audio API, ES6 modules
- **Performance Target**: 60 FPS on mid-range devices
- **Responsive**: Supports various screen sizes and orientations

## Contributing Guidelines

1. Follow the established code structure and naming conventions
2. Test changes in development mode before building
3. Ensure all assets are properly organized in the `assets/` directory
4. Run linting and tests before submitting changes
5. Update documentation when adding new features or changing APIs
6. Consider performance implications of new code
7. Maintain backward compatibility when possible
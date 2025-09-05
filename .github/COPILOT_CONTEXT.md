# Copilot Context for SuperstudentHTML

## Quick Reference

### Key Entry Points
- `src/js/main.js` - Main game entry point and initialization
- `src/js/gameLoop.js` - Core game loop and timing
- `src/js/core/resourceManager.js` - Asset loading and management
- `src/js/inputHandler.js` - Input processing for mouse/touch/keyboard

### Manager Components
- `src/js/managers/hudManager.js` - Heads-up display and UI elements
- `src/js/managers/checkpointManager.js` - Game save/checkpoint system
- `src/js/managers/flamethrowerManager.js` - Special effects system
- `src/js/managers/glassShatterManager.js` - Glass breaking effects
- `src/js/managers/multiTouchManager.js` - Multi-touch input handling

### Educational Levels
- `src/js/levels/baseLevel.js` - Base class for all game levels
- `src/js/levels/colorsLevel.js` - Color learning game
- `src/js/levels/shapesLevel.js` - Shape recognition game
- `src/js/levels/alphabetLevel.js` - Letter learning game
- `src/js/levels/numbersLevel.js` - Number learning game
- `src/js/levels/clCaseLevel.js` - Upper/lowercase letter matching

### Core Systems
- `src/js/core/particleSystem.js` - Particle effects engine
- `src/js/core/soundManager.js` - Audio playback and management
- `src/js/core/gameState.js` - Global game state management

## Development Patterns

### Adding New Educational Content
1. Extend `BaseLevel` class
2. Implement required methods: `init()`, `update()`, `render()`, `cleanup()`
3. Add level-specific scoring and progression logic
4. Register level in the game's level management system

### Adding New Managers
1. Create manager class in `src/js/managers/`
2. Implement standard manager interface: constructor, `update()`, `render()`, `activate()`, `deactivate()`
3. Register manager with the game context
4. Add any necessary cleanup in `deactivate()`

### Adding New Effects
1. Use existing `ParticleSystem` for simple effects
2. Create custom effect classes for complex animations
3. Place effect classes in `src/js/effects/`
4. Integrate with managers or levels as needed

## Testing Strategy

### Unit Tests
- Focus on core game logic and calculations
- Test manager state transitions
- Verify educational content accuracy
- Mock browser APIs (Canvas, Audio, etc.)

### Integration Tests
- Test level transitions and progression
- Verify asset loading and management
- Test input handling across different devices

### E2E Tests
- Complete gameplay workflows
- Educational objective completion
- Cross-browser compatibility
- Performance benchmarks

## Asset Integration

### Adding Images
1. Place in appropriate `assets/images/` subdirectory
2. Reference in asset manifest or resource manager
3. Use appropriate formats: PNG for sprites, JPG for backgrounds, SVG for icons

### Adding Audio
1. Place in `assets/sounds/` directory
2. Use MP3 format for compatibility
3. Keep file sizes reasonable (< 1MB for SFX, < 5MB for music)
4. Register with SoundManager for playback

### Adding Fonts
1. Place in `assets/fonts/` directory
2. Use WOFF2/WOFF formats for web optimization
3. Update CSS font declarations
4. Ensure fallback fonts are specified

## Common Debugging Areas

### Performance Issues
- Check particle system object pooling
- Monitor canvas rendering efficiency
- Verify asset loading optimization
- Profile memory usage during gameplay

### Audio Problems
- Verify Web Audio API compatibility
- Check audio file formats and sizes
- Ensure proper audio context initialization
- Test volume controls and mute functionality

### Input Handling
- Test touch input on mobile devices
- Verify mouse click coordinates
- Check keyboard event handling
- Test multi-touch gestures

### Asset Loading
- Check file paths and naming conventions
- Verify asset manifest completeness
- Test network loading scenarios
- Handle loading failures gracefully

This context helps GitHub Copilot understand the project structure and provide better code suggestions specific to SuperstudentHTML's educational game architecture.
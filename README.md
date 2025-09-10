# Super Student HTML Port

This project reimplements the Super Student game using HTML, CSS, and JavaScript with modern build tooling via Webpack. The code is modularized into separate files for maintainability and performance.

## Features

- **Educational Game Modes**: Colors, Shapes, Alphabet, Numbers, and Case matching
- **Multiple Managers**: HUD, checkpoint, flamethrower, center piece, multi-touch, glass shatter effects
- **Particle System**: Dynamic particle effects for explosions and visual feedback
- **Sound System**: Audio playback with Web Audio API
- **Responsive Design**: Full-screen canvas that adapts to window size
- **Modern Build Pipeline**: Webpack for development and production builds

## Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- npm (comes with Node.js)
- Docker (optional): to build and run in a container

### Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

   This will start a local development server with hot reload at `http://localhost:3000`

3. **Open your browser** and navigate to the local server URL

### Docker Setup (optional)

1. **Build Docker image:**

   ```bash
   docker build -t superstudenthtml .
   ```

2. **Run container:**

   ```bash
   docker run -p 8080:80 superstudenthtml
   ```

3. **Visit** `http://localhost:8080`

### Production Build

```bash
# Build for production
npm run build

# Preview production build is not available in the current configuration.
```

The production build will be generated in the `dist/` directory with optimized and minified assets.

## Development Workflow

- ### Development Server

  - **Hot Reload**: Changes to JS, CSS, and HTML files trigger automatic page refresh
- **Asset Processing**: Images, fonts, and audio files are automatically processed
- **Source Maps**: Enabled for easier debugging
- **ES6 Modules**: Full support for modern JavaScript modules

### Project Structure

```bash
/
├── index.html                # Main HTML page
├── package.json              # Project metadata and scripts
├── webpack.config.js         # Build pipeline configuration
├── config/                   # Build and tooling configs
│   ├── babel.config.js
│   ├── eslint.config.js
│   ├── pwa.config.js
│   └── webpack.config.js
├── css/
│   └── styles.css            # Global and utility styles
├── js/
│   └── main.js               # Entry point for standalone JS
├── src/                      # Source modules organized by feature
│   ├── css/
│   │   ├── components.css
│   │   ├── game.css
│   │   ├── main.css
│   │   ├── responsive.css
│   │   └── themes.css
│   ├── js/
│   │   ├── gameLoop.js
│   │   ├── inputHandler.js
│   │   ├── main.js
│   │   └── ...              # Other modules (config/, core/, effects/, game/, ui/, utils/)
│   └── ...                  # Additional feature directories
├── assets/
│   ├── fonts/                # Font files (.woff2, .woff, .ttf)
│   ├── images/               # Sprites, icons, backgrounds
│   └── sounds/               # Audio effects and music
└── tests/                    # Automated tests
   ├── unit/
   ├── integration/
   ├── e2e/
   └── performance/
```

## Asset Guidelines

### Images

- **Formats**: PNG (sprites), JPG (backgrounds), SVG (icons), WebP (optimized)
- **Naming**: Descriptive names like `player-idle.png`, `letter-a.svg`
- **Organization**: Group by category in subdirectories
- **Size**: Keep reasonable file sizes for web delivery

### Fonts

- **Formats**: WOFF2 (preferred), WOFF (fallback), TTF (fallback)
- **Required**: `regular`, `target`, `title` font variants
- **Loading**: Automatically loaded via ResourceManager

### Audio

- **Formats**: MP3 (preferred), WAV (high quality), OGG (alternative)
- **Categories**: Sound effects (SFX) and background music
- **Size Limits**: < 1MB for SFX, < 5MB for music
- **Sample Rate**: 44.1kHz recommended

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run serve` - Serve production build on port 3000

## Browser Support

- **Primary Target**: Google Chrome (latest)
- **Requirements**: ES2020+ support, Canvas API, Web Audio API
- **Features Used**: ES6 modules, async/await, Canvas 2D, Web Audio

## Controls

- **Mouse/Touch**: Click on color items to destroy them
- **Space**: Pause/Resume game
- **R**: Restart game (when paused/game over)
- **Escape**: Pause game or return to menu

## Performance Optimization

- **Particle Pooling**: Reuse particle objects to reduce GC pressure
- **Asset Bundling**: Vite optimizes and bundles assets for production
- **Delta Time**: Consistent animation timing across different framerates
- **Canvas Optimization**: Efficient rendering with minimal state changes

## Troubleshooting

### Development Issues

- **Port conflicts**: Change port in `webpack.config.js` if 3000 is in use
- **Module errors**: Ensure all imports use correct file paths
- **Asset loading**: Check console for failed resource loads

### Build Issues

- **Missing assets**: Verify asset paths are relative to project root
- **Bundle size**: Use `npm run build` to check output file sizes
- **Browser compatibility**: Test in target browsers after building

## Contributing

1. Follow the existing code structure and naming conventions
2. Test changes in development mode before building
3. Ensure all assets are properly organized in the `assets/` directory
4. Update documentation when adding new features

## License

MIT License

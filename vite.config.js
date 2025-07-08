import { defineConfig } from 'vite';

export default defineConfig({
  // Base URL for assets in production
  base: './',
  
  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Minify the output
    minify: 'terser',
    
    // Asset handling
    assetsDir: 'assets',
    
    // Rollup options for advanced bundling
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        // Chunk file names
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep assets organized by type
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash][extname]';
          }
          if (assetInfo.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
            return 'images/[name]-[hash][extname]';
          }
          if (assetInfo.name.match(/\.(mp3|wav|ogg)$/)) {
            return 'sounds/[name]-[hash][extname]';
          }
          if (assetInfo.name.match(/\.(woff|woff2|ttf|otf)$/)) {
            return 'fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    
    // Target modern browsers
    target: 'es2020',
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  
  // Development server configuration
  server: {
    port: 3005,
    open: true,
    host: 'localhost',
    
    // Enable CORS for local development
    cors: true,
    
    // Hot Module Replacement
    hmr: {
      overlay: true
    }
  },
  
  // Preview server configuration (for production build testing)
  preview: {
    port: 3001,
    open: true,
    host: 'localhost'
  },
  
  // Asset handling
  assetsInclude: [
    '**/*.mp3',
    '**/*.wav',
    '**/*.ogg',
    '**/*.ttf',
    '**/*.woff',
    '**/*.woff2'
  ],
  
  // Optimize dependencies
  optimizeDeps: {
    include: []
  },
  
  // Define environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
  }
});

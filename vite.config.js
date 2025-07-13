import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    open: '/public/test.html'
  },
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'SidepanelFallback',
      fileName: (format) => `sidepanel-fallback.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        globals: {
          // External dependencies would go here if any
        }
      }
    }
  }
});

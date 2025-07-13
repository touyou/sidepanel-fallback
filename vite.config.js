export default {
  root: '.',
  server: {
    open: '/public/test.html'
  },
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'SidepanelFallback',
      fileName: 'sidepanel-fallback'
    }
  }
};

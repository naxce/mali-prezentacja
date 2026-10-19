import { defineConfig } from 'vite';

const targets = ['chrome80', 'firefox78', 'safari13.1'];

export default defineConfig({
  base: '/wos/mali/',
  build: {
    target: targets,
    cssTarget: targets,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        deck: 'index.html',
        quiz: 'quiz/index.html',
        nettest: 'quiz/test/index.html'
      }
    }
  },
  server: {
    host: true,
    proxy: {
      '/wos/mali/ws': { target: 'ws://127.0.0.1:3210', ws: true },
      '/wos/mali/api': 'http://127.0.0.1:3210'
    }
  },
  preview: {
    proxy: {
      '/wos/mali/ws': { target: 'ws://127.0.0.1:3210', ws: true },
      '/wos/mali/api': 'http://127.0.0.1:3210'
    }
  }
});

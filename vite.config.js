import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
    vue(),
  ],
  resolve: {
    alias: {
    }
  },
  server: {
    proxy: {
      '/roles': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false
      },
      '/query': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'axios', 'lodash']
        }
      }
    }
  }
})

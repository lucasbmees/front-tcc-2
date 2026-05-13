// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        //target: 'https://tcc-backend-sharktank-fbdjfmg5a4e9bjfe.eastus-01.azurewebsites.net',
        target: 'http://127.0.0.1:5153', // Mudamos de localhost para o IP 127.0.0.1
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
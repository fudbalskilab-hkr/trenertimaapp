import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // relativne putanje — radi i lokalno i na GitHub Pages (pod /repo/ putanjom)
  base: './',
  plugins: [react()],
  server: { port: 5180, open: true }
})

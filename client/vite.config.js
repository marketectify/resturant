import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:5000' },
    fs: { allow: ['..'] }, // the menu seed lives in ../shared/menu.json
  },
});

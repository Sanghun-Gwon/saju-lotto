import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base는 배포 라운드에서 조정 (GitHub Pages 등)
export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});

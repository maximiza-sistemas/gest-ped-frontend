import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Porta 3000 por padrão (PORT sobrepõe; o Vite escolhe a próxima livre se ocupada).
// /api é proxy para o backend Fastify (3334).
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 3000,
    open: false,
    proxy: {
      '/api': 'http://localhost:3334',
    },
  },
});

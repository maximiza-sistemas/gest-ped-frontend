# Plataforma de Gestão Pedagógica — Frontend

Interface web (React + Vite) da Plataforma de Gestão Pedagógica (maXXimiza).
A API fica em um repositório separado: **gestao-pedago-backend**.

## Requisitos
- Node.js 18+

## Configuração
```bash
npm install
cp .env.example .env   # opcional em dev (ver abaixo)
```

## Desenvolvimento
```bash
npm run dev
```
Sobe o Vite em **http://localhost:3000**. Por padrão, as chamadas a `/api` são
encaminhadas por proxy para o backend em `http://localhost:3334`
(ver `vite.config.js`). Portanto, suba também o **backend** localmente.

## Conexão com a API
- **Dev:** deixe `VITE_API_URL` vazio — o proxy do Vite cuida de `/api`.
- **Produção:** defina `VITE_API_URL` apontando para a API publicada, incluindo
  o prefixo `/api`, ex.: `VITE_API_URL=https://api.seu-dominio.com/api`.

## Build de produção
```bash
npm run build      # gera dist/
npm run preview    # serve o build localmente
```

## Estrutura
- `src/` — componentes e lógica (React, sem framework de rotas; navegação por estado em `App.jsx`).
- `src/api.js` — cliente HTTP (token JWT em localStorage).
- `public/assets/` — imagens estáticas (logos).
- `vite.config.js` — porta 3000 e proxy `/api` → backend (dev).

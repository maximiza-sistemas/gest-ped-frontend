# ---- build: compila o SPA (Vite) ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
# A URL da API é embutida NO BUILD (Vite é build-time). Sobrescreva com
#   --build-arg VITE_API_URL=https://.../api   (ou via build arg do EasyPanel).
ARG VITE_API_URL=https://dev-gest-edu-back.mbfxnj.easypanel.host/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- serve: nginx servindo dist/ estático ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

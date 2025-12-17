FROM node:18-alpine

# Directorio base
WORKDIR /app

# Instalar dependencias usando los manifests del servidor
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Volver a /app y copiar el código
WORKDIR /app
COPY server/ ./server/
COPY public/ ./public/

# Exponer puerto de la app
EXPOSE 3000

# Iniciar el servidor
CMD ["node", "server/server.js"]
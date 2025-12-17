FROM node:18-alpine

WORKDIR /app

# Copiar todo el contenido
COPY . .

# Instalar dependencias desde el directorio server
RUN cd server && npm ci --omit=dev

# Exponer puerto
EXPOSE 3000

# Iniciar servidor
CMD ["node", "server/server.js"]
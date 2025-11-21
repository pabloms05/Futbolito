FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package.json package-lock.json ./
RUN npm install

# Copiar archivos
COPY server/ ./server/
COPY gameLogic.js ./
COPY public/ ./public/

# Exponer puerto
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
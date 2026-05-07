FROM node:18-alpine

WORKDIR /app

# Copiar todo el contenido
COPY . .

# Instalar dependencias
RUN cd server && npm install

# Exponer puerto
EXPOSE 3000

# Iniciar servidor
CMD ["sh", "-c", "cd server && npm run dev"]
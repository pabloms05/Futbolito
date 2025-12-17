FROM node:18-alpine

WORKDIR /app

# Copiar todo el contenido
COPY . .

# Instalar dependencias (funciona si package.json está en server/ o en raíz)
RUN if [ -f server/package.json ]; then \
      cd server && npm ci --omit=dev; \
    elif [ -f package.json ]; then \
      npm ci --omit=dev; \
    else \
      echo "ERROR: No se encontró package.json"; exit 1; \
    fi

# Exponer puerto
EXPOSE 3000

# Iniciar servidor
CMD ["node", "server/server.js"]
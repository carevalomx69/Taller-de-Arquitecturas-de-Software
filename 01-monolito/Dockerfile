# Usar una imagen base de Node.js
FROM node:18-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar primero el package.json para aprovechar el cache de Docker
COPY package*.json ./

# Instalar las dependencias del proyecto
RUN npm install --omit=dev

# Copiar el resto de los archivos de la aplicación
COPY . .

# Exponer el puerto en el que correrá la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación cuando el contenedor arranque
CMD ["node", "server.js"]

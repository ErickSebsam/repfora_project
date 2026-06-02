# Usamos la versión Slim (basada en Debian) en lugar de Alpine
FROM node:20-slim

# Instalamos OpenSSL y MongoDB Database Tools (mongodump, mongorestore)
# y limpiamos la caché de apt para mantener la imagen pequeña.
RUN apt-get update && \
    apt-get install -y openssl wget gnupg python3 python3-pip python3-venv && \
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add - && \
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y mongodb-database-tools && \
    rm -rf /var/lib/apt/lists/*

# Instalamos las librerías de Python requeridas
RUN pip3 install --no-cache-dir --break-system-packages pdfplumber requests

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos los archivos de paquetes
COPY package*.json ./

# Instalamos las dependencias de Node
# NOTA: Tu script "postinstall" ejecutará "npx playwright install chromium --with-deps"
# Esto funcionará perfectamente en esta imagen Debian e instalará el navegador y librerías.
RUN npm install --omit=dev

# Copiamos el resto de la aplicación
COPY . .

# --- LÍNEA DE DEPURACIÓN (LUEGO BÓRRALA) ---
RUN echo "Listando contenido de la carpeta actual:" && ls -la && echo "Listando contenido de clients:" && ls -la clients
# -------------------------------------------


# Creamos los directorios necesarios
RUN mkdir -p public downloads tmp clients

# Exponemos el puerto
EXPOSE 3000

# Iniciamos la aplicación
CMD ["npm", "start"]
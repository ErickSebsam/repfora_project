# Docker - Sistema de Horarios SENA

Este documento describe cómo usar Docker para ejecutar el Sistema de Horarios SENA.

## Requisitos Previos

- Docker instalado en tu sistema
- Docker Compose instalado
- Al menos 4GB de RAM disponibles para Docker

## Configuración Inicial

1. **Copia el archivo de entorno de ejemplo:**

```bash
cp .env.example .env
```

2. **Edita el archivo `.env` con tus configuraciones:**

   - Configura las credenciales de base de datos
   - Configura las credenciales de email
   - Configura las credenciales de SOFIA Plus
   - Ajusta otras variables según sea necesario

## Construir y Ejecutar

### Primera vez (construir imágenes):

```bash
docker-compose up --build
```

### Ejecuciones posteriores:

```bash
docker-compose up -d
```

### Ver logs:

```bash
docker-compose logs -f app
docker-compose logs -f mongo
```

## Comandos Útiles

### Detener todos los servicios:

```bash
docker-compose down
```

### Detener y eliminar volúmenes (cuidado: borra datos):

```bash
docker-compose down -v
```

### Reiniciar servicios:

```bash
docker-compose restart app
docker-compose restart mongo
```

### Ejecutar comandos dentro del contenedor:

```bash
# Acceder a la terminal del contenedor
docker-compose exec app sh

# Ejecutar tests
docker-compose exec app npm test

# Instalar nuevas dependencias
docker-compose exec app npm install <paquete>
```

## Volúmenes y Datos

La aplicación utiliza los siguientes volúmenes para persistencia de datos:

- `mongo_data`: Base de datos MongoDB
- `mongo_config`: Configuración de MongoDB
- `./public`: Archivos públicos y uploads
- `./downloads`: Archivos descargados por SOFIA Plus
- `./tmp`: Archivos temporales
- `./clients`: Archivos de clientes

## Acceder a la Aplicación

Una vez que los servicios estén ejecutándose:

- **API REST**: http://localhost:4500/api
- **Documentación Swagger**: http://localhost:4500/api-docs
- **Health Check**: http://localhost:4500/life
- **MongoDB**: mongodb://localhost:27017

## Respaldo de Base de Datos

Para hacer un respaldo de la base de datos:

```bash
docker-compose exec mongo mongodump --db Horarios_SENA --out /data/backup
docker cp horarios_sena_mongo:/data/backup ./backup_$(date +%Y%m%d)
```

Para restaurar un respaldo:

```bash
docker cp ./backup_20240101 horarios_sena_mongo:/data/restore
docker-compose exec mongo mongorestore --db Horarios_SENA /data/restore
```

## Troubleshooting

### El contenedor no se inicia:

```bash
# Ver logs detallados
docker-compose logs app
docker-compose ps
```

### Error de conexión a MongoDB:

Verifica que el contenedor de MongoDB esté ejecutándose:

```bash
docker-compose ps mongo
docker-compose logs mongo
```

### Necesitas reinstalar dependencias:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Limpiar todo y empezar de nuevo:

```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

## Producción

Para desplegar en producción:

1. Asegúrate de cambiar las contraseñas en `.env`
2. Configura `HEADLESS=true` para Playwright
3. Usa `NODE_ENV=production`
4. Considera usar secrets de Docker para variables sensibles
5. Configura backups automáticos
6. Usa imágenes etiquetadas específicamente (ej: node:20-alpine@sha256:...)

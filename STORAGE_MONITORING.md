# Sistema de Monitoreo de Almacenamiento - Google Drive

Sistema de monitoreo de almacenamiento de Google Drive para las sedes de SENA (Florida, San Gil, Bucaramanga, Cúcuta).

## ⚠️ CONFIGURACIÓN IMPORTANTE

### Para endpoints individuales (/:sede y /:sede/files):

Los endpoints **individuales** usan la variable de entorno `GOOGLE_DRIVE_API_KEY` del archivo `.env`:

```env
# Archivo .env
GOOGLE_DRIVE_API_KEY=repfora-411414-2b1a696cee9c.json
```

**Archivos disponibles:**
- `repfora-411414-2b1a696cee9c.json` → Florida (CIDM)
- `repfora-c966104279a7.json` → San Gil (CAT)
- `repforacset-5a173bf4e06e.json` → Bucaramanga (CSET)
- `repforacedrum-1efe398f8ff7.json` → Cúcuta (CEDRUM)

**Para cambiar de sede:**
1. Editar el archivo `.env`
2. Cambiar `GOOGLE_DRIVE_API_KEY` al archivo JSON deseado
3. Reiniciar el servidor
4. El endpoint usará automáticamente la nueva configuración

### Para endpoints de todas las sedes (/api-storage y /api-storage/summary):

Estos endpoints consultan **todas las sedes automáticamente** usando un mapeo interno. No requieren configuración adicional.

---

## 🔐 Requisitos de Autenticación

**Todos los endpoints requieren:**
- Token JWT válido (Bearer token)
- Usuario con `super=1` (Super Admin)

Sin estos requisitos, los endpoints retornan `403 Forbidden`.

---

## 📡 Endpoints Disponibles

### 1. Obtener Información de Todas las Sedes

```
GET /api-storage
```

**Descripción:** Obtiene información completa de almacenamiento de todas las sedes (Florida, San Gil, Bucaramanga, Cúcuta) automáticamente.

**Requiere:** Super Admin (super=1)

**Ejemplo de Response:**
```json
{
  "msg": "Información de almacenamiento obtenida correctamente",
  "summary": {
    "totalProjects": 4,
    "totalUsage": 5368709120,
    "totalLimit": 64424509440,
    "totalUsageFormatted": "5.00 GB",
    "totalLimitFormatted": "60.00 GB",
    "overallPercentage": "8.33"
  },
  "details": {
    "florida": { "sede": "Florida (CIDM)", ... },
    "sangel": { "sede": "San Gil (CAT)", ... },
    "bucaramanga": { "sede": "Bucaramanga (CSET)", ... },
    "cucuta": { "sede": "Cúcuta (CEDRUM)", ... }
  },
  "timestamp": "2024-03-19T12:00:00.000Z"
}
```

---

### 2. Obtener Resumen Ejecutivo

```
GET /api-storage/summary
```

**Descripción:** Retorna un resumen ejecutivo con recomendaciones automáticas cuando el almacenamiento supera el 75%.

**Requiere:** Super Admin (super=1)

**Ejemplo de Response:**
```json
{
  "msg": "Resumen de almacenamiento",
  "totalSedes": 4,
  "projects": [
    {
      "sede": "florida",
      "name": "Florida (CIDM)",
      "percentage": 85.5,
      "status": "warning",
      "usageFormatted": "12.5 GB",
      "limitFormatted": "15 GB"
    }
  ],
  "recommendations": [
    {
      "sede": "Florida (CIDM)",
      "priority": "medium",
      "message": "Almacenamiento en nivel de alerta (85.5%). Considere limpiar archivos.",
      "action": "monitor"
    }
  ]
}
```

---

### 3. Obtener Información de Sede Específica

```
GET /api-storage/:sede
```

**Descripción:** Obtiene información detallada de una sede específica usando `GOOGLE_DRIVE_API_KEY` del `.env`.

**⚠️ IMPORTANTE:** El parámetro `:sede` es **IGNORADO**. Siempre usa la variable de entorno `GOOGLE_DRIVE_API_KEY`.

**Requiere:** Super Admin (super=1)

**Parámetros:**
- `sede` (path): Código de la sede (florida, sangel, bucaramanga, cucuta) - **Ignorado, uso informativo**

**Configuración previa:**
```env
# En .env
GOOGLE_DRIVE_API_KEY=repfora-411414-2b1a696cee9c.json
```

**Ejemplo de Request:**
```bash
GET /api-storage/florida
# Usará GOOGLE_DRIVE_API_KEY del .env
```

**Ejemplo de Response:**
```json
{
  "msg": "Información de almacenamiento (usando repfora-411414-2b1a696cee9c.json)",
  "credentialFile": "repfora-411414-2b1a696cee9c.json",
  "requestedSede": "florida",
  "note": "Usando GOOGLE_DRIVE_API_KEY del .env",
  "projectId": "repfora-411414",
  "serviceAccount": "repforacidm@repfora-411414.iam.gserviceaccount.com",
  "quota": {
    "limit": 16106127360,
    "usage": 5368709120,
    "limitFormatted": "15 GB",
    "usageFormatted": "5.00 GB",
    "percentage": "33.33"
  },
  "files": {
    "total": 150,
    "totalSize": 5368709120,
    "totalSizeFormatted": "5.00 GB",
    "largest": [
      {
        "id": "1AbC123...",
        "name": "backup_large.zip",
        "size": 524288000,
        "sizeFormatted": "500 MB",
        "mimeType": "application/zip",
        "created": "2024-03-15T10:30:00.000Z",
        "viewUrl": "https://drive.google.com/file/d/1AbC123.../view",
        "isFolder": false
      }
    ]
  }
}
```

---

### 4. Obtener Archivos Más Grandes de Sede

```
GET /api-storage/:sede/files?limit=20
```

**Descripción:** Retorna los archivos más grandes de una sede, usando `GOOGLE_DRIVE_API_KEY` del `.env`.

**⚠️ IMPORTANTE:** El parámetro `:sede` es **IGNORADO**. Siempre usa la variable de entorno `GOOGLE_DRIVE_API_KEY`.

**Requiere:** Super Admin (super=1)

**Parámetros:**
- `sede` (path): Código de la sede - **Ignorado, uso informativo**
- `limit` (query): Número máximo de archivos (default: 20)

**Ejemplo de Request:**
```bash
GET /api-storage/florida/files?limit=50
# Usará GOOGLE_DRIVE_API_KEY del .env
```

**Ejemplo de Response:**
```json
{
  "msg": "Archivos más grandes (usando repfora-411414-2b1a696cee9c.json)",
  "credentialFile": "repfora-411414-2b1a696cee9c.json",
  "requestedSede": "florida",
  "note": "Usando GOOGLE_DRIVE_API_KEY del .env",
  "projectId": "repfora-411414",
  "serviceAccount": "repforacidm@repfora-411414.iam.gserviceaccount.com",
  "total": 50,
  "files": [
    {
      "id": "1AbC123...",
      "name": "backup_2024.zip",
      "size": 524288000,
      "sizeFormatted": "500 MB",
      "mimeType": "application/zip",
      "created": "2024-03-15T10:30:00.000Z",
      "viewUrl": "https://drive.google.com/file/d/1AbC123.../view",
      "isFolder": false
    }
  ]
}
```

---

## 📊 Estados de Almacenamiento

| Estado | Porcentaje | Color | Acción |
|--------|-----------|-------|--------|
| **healthy** | < 50% | 🟢 Verde | Normal |
| **moderate** | 50% - 74% | 🟡 Amarillo | Monitorear |
| **warning** | 75% - 89% | 🟠 Naranja | Limpiar archivos |
| **critical** | ≥ 90% | 🔴 Rojo | Acción inmediata |

---

## 🔄 Cómo Cambiar de Sede (Endpoints Individuales)

### Paso 1: Editar `.env`
```env
# Para monitorear Florida
GOOGLE_DRIVE_API_KEY=repfora-411414-2b1a696cee9c.json

# Para monitorear San Gil
GOOGLE_DRIVE_API_KEY=repfora-c966104279a7.json

# Para monitorear Bucaramanga
GOOGLE_DRIVE_API_KEY=repforacset-5a173bf4e06e.json

# Para monitorear Cúcuta
GOOGLE_DRIVE_API_KEY=repforacedrum-1efe398f8ff7.json
```

### Paso 2: Reiniciar el servidor
```bash
npm start
```

### Paso 3: Usar el endpoint
```bash
GET /api-storage/florida
# Usará automáticamente GOOGLE_DRIVE_API_KEY del .env
```

---

## 🧪 Probar los Endpoints

### Con cURL:
```bash
# 1. Login para obtener token
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sena.edu.co","password":"admin123"}'

# 2. Usar el token (reemplazar YOUR_TOKEN)
curl -X GET http://localhost:3000/api-storage/florida \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Con el script de prueba:
```bash
node scripts/test-storage-endpoint.js
```

---

## 🛠️ Solución de Problemas

### Error: "GOOGLE_DRIVE_API_KEY no está configurado"
**Solución:** Agrega la variable al archivo `.env`:
```env
GOOGLE_DRIVE_API_KEY=repfora-411414-2b1a696cee9c.json
```

### Error: "Archivo de credenciales no encontrado"
**Solución:** Verifica que el archivo JSON exista en `utils/uploadFiles/`:
```bash
ls -la utils/uploadFiles/repfora-*.json
```

### Error: "Invalid Value" de Google Drive API
**Solución:** Verifica que:
1. El archivo JSON es válido y no está corrupto
2. La Drive API está habilitada en Google Cloud Console
3. La service account tiene los permisos correctos

### Endpoint retorna 403 Forbidden
**Solución:** Verifica que:
1. El token es válido
2. El usuario tiene `super=1`

---

## 📁 Archivos del Sistema

- **Controller:** `controller/storage.controller.js`
- **Routes:** `routes/storage.routes.js`
- **Validations:** `validations/storage.validation.js`
- **Credentials:** `utils/uploadFiles/*.json`
- **Test script:** `scripts/test-storage-endpoint.js`
- **Docs:** `STORAGE_MONITORING.md` (este archivo)

---

## 🔒 Seguridad

- Los endpoints están protegidos con autenticación JWT
- Solo usuarios con `super=1` pueden acceder
- Los archivos de credenciales están en `.gitignore`
- Nunca hacer commit de los archivos JSON con credenciales

---

## 📝 Notas Técnicas

1. **Endpoints individuales vs todos los endpoints:**
   - Individuales (/:sede, /:sede/files): Usan `GOOGLE_DRIVE_API_KEY`
   - Todos (/api-storage, /api-storage/summary): Usan mapeo interno

2. **Por qué ignorar el parámetro :sede:**
   - Permite cambiar de sede sin modificar el código
   - Más flexible para deployment con Coolify
   - Un solo set de credenciales activo a la vez

3. **Almacenamiento de service accounts:**
   - Las service accounts comparten el almacenamiento del proyecto (15GB por proyecto)
   - NO tienen 15GB separados cada una
   - 4 proyectos = 60GB totales

---

## 🚀 Deployment con Coolify

```yaml
# En Coolify - Service Settings - Environment Variables
GOOGLE_DRIVE_API_KEY=repfora-411414-2b1a696cee9c.json

# O usar file secret si Coolify lo soporta
# Archivo: /app/utils/uploadFiles/repfora-411414-2b1a696cee9c.json
```

---

## 📞 Soporte

Para problemas o preguntas:
1. Verificar el log del servidor
2. Revisar que `GOOGLE_DRIVE_API_KEY` esté configurado
3. Validar que el archivo JSON exista y sea correcto
4. Consultar `scripts/test-storage-endpoint.js` para diagnóstico

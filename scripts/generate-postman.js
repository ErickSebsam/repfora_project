/**
 * Generador automático de colección de Postman
 * Escanea las rutas del proyecto y actualiza la colección
 *
 * Uso: node scripts/generate-postman.js
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const ROUTES_DIR = join(PROJECT_ROOT, 'routes');
const OUTPUT_FILE = join(PROJECT_ROOT, 'postman-collection', 'SENA_Horarios_API.postman_collection.json');

// Configuración base de la colección
const BASE_URL = process.env.API_URL || 'http://localhost:4500';

// Mapeo de métodos HTTP a funciones de controlador (regex patterns)
const METHOD_PATTERNS = {
  'get': /router\.(get|use)/,
  'post': /router\.post/,
  'put': /router\.put/,
  'delete': /router\.delete/,
  'patch': /router\.patch/
};

// Descripciones generadas automáticamente basadas en nombres
const DESCRIPTION_TEMPLATES = {
  'register': 'Registra un nuevo recurso',
  'update': 'Actualiza un recurso existente',
  'active': 'Activa un recurso',
  'inactive': 'Inactiva un recurso',
  'login': 'Inicia sesión',
  'get': 'Obtiene',
  'delete': 'Elimina un recurso',
  'reset': 'Restablece',
  'validate': 'Valida'
};

// Ejemplos de body por patrón de ruta
const BODY_EXAMPLES = {
  'users': {
    'register': {
      'name': 'Juan Pérez',
      'email': 'usuario@sena.edu.co',
      'password': 'password123',
      'role': 'COORDINADOR'
    },
    'login': {
      'role': 'ADMIN',
      'email': 'usuario@sena.edu.co',
      'password': 'password123'
    }
  },
  'instructors': {
    'register': {
      'name': 'Carlos Instructor',
      'tpdocument': 'CC',
      'numdocument': '12345678',
      'email': 'instructor@sena.edu.co',
      'phone': '3001234567'
    }
  },
  'fiches': {
    'register': {
      'number': '2281001',
      'program': 'program_id',
      'owner': 'instructor_id',
      'coordination': 'coordination_id',
      'fstart': '2024-01-15T00:00:00.000Z',
      'fend': '2024-12-15T00:00:00.000Z'
    }
  },
  'schedules': {
    'register': {
      'fiche': 'fiche_id',
      'program': 'program_id',
      'competence': 'competence_id',
      'instructor': 'instructor_id',
      'environment': 'environment_id',
      'days': [1, 3, 5],
      'tstart': '07:00',
      'tend': '10:00'
    }
  }
};

/**
 * Extrae información de endpoints de un archivo de ruta
 */
function extractEndpointsFromFile(filePath, resourceName) {
  const content = readFileSync(filePath, 'utf-8');
  const endpoints = [];

  // Buscar definiciones de rutas
  // Ejemplo: router.get("/path", middleware, controller)
  const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;

  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const [, method, path] = match;

    // Limpiar parámetros de ruta para el nombre
    const cleanPath = path.replace(/:id/g, ':id').replace(/:([^/]+)/g, ':$1');

    // Generar nombre descriptivo
    const name = generateEndpointName(method, path, resourceName);

    // Generar descripción
    const description = generateDescription(method, path, resourceName);

    // Generar ejemplo de body si es POST o PUT
    const body = generateBodyExample(method, path, resourceName);

    endpoints.push({
      name,
      request: {
        method: method.toUpperCase(),
        header: [],
        body: body ? {
          mode: 'raw',
          raw: JSON.stringify(body, null, 2),
          options: { raw: { language: 'json' } }
        } : undefined,
        url: {
          raw: `\{\{baseUrl\}\}/api/${resourceName}${cleanPath}`,
          host: ['{{baseUrl}}'],
          path: ['api', resourceName, ...cleanPath.split('/').filter(Boolean)]
        },
        description
      },
      response: []
    });
  }

  return endpoints;
}

/**
 * Genera un nombre descriptivo para el endpoint
 */
function generateEndpointName(method, path, resourceName) {
  const pathParts = path.split('/').filter(p => p && !p.startsWith(':'));
  const action = pathParts[0] || 'all';

  const methodAction = {
    'GET': action === 'all' ? `Obtener Todos` : `Obtener ${capitalize(action)}`,
    'POST': action === 'register' ? 'Registrar' : capitalize(action),
    'PUT': action.includes('active') ? 'Activar' : action.includes('inactive') ? 'Inactivar' : `Actualizar ${capitalize(action)}`,
    'DELETE': `Eliminar ${capitalize(action)}`
  };

  return methodAction[method] || `${capitalize(action)} ${resourceName}`;
}

/**
 * Genera una descripción para el endpoint
 */
function generateDescription(method, path, resourceName) {
  const action = path.split('/').filter(p => p && !p.startsWith(':'))[0] || '';

  if (DESCRIPTION_TEMPLATES[action]) {
    return `${DESCRIPTION_TEMPLATES[action]} de ${resourceName}`;
  }

  return `Endpoint ${method} para ${resourceName}`;
}

/**
 * Genera un ejemplo de body para POST/PUT
 */
function generateBodyExample(method, path, resourceName) {
  if (method !== 'post' && method !== 'put') return null;

  const action = path.split('/').filter(p => p && !p.startsWith(':'))[0] || '';

  if (BODY_EXAMPLES[resourceName] && BODY_EXAMPLES[resourceName][action]) {
    return BODY_EXAMPLES[resourceName][action];
  }

  if (action === 'register') {
    return { name: 'Nombre ejemplo', status: 0 };
  }

  return null;
}

/**
 * Capitaliza primera letra
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Escanea todos los archivos de rutas
 */
function scanRoutesDirectory() {
  const routes = [];
  const files = readdirSync(ROUTES_DIR).filter(f => f.endsWith('.routes.js'));

  for (const file of files) {
    const filePath = join(ROUTES_DIR, file);
    const resourceName = file.replace('.routes.js', '');

    const endpoints = extractEndpointsFromFile(filePath, resourceName);

    if (endpoints.length > 0) {
      routes.push({
        name: capitalize(resourceName),
        item: endpoints
      });
    }
  }

  return routes;
}

/**
 * Genera la colección completa de Postman
 */
function generateCollection() {
  console.log('🔍 Escaneando rutas...');

  const routes = scanRoutesDirectory();

  console.log(`✅ Encontrados ${routes.length} recursos con ${routes.reduce((acc, r) => acc + r.item.length, 0)} endpoints`);

  const collection = {
    info: {
      name: 'SENA Horarios API (Auto-generated)',
      description: 'Documentación generada automáticamente desde el código fuente. Última actualización: ' + new Date().toISOString(),
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _postman_id: 'sena-horarios-auto',
      version: { major: 2, minor: 0, patch: 0 }
    },
    variable: [
      {
        key: 'baseUrl',
        value: BASE_URL,
        type: 'string'
      },
      {
        key: 'token',
        value: '',
        type: 'string'
      }
    ],
    item: routes
  };

  return collection;
}

/**
 * Guarda la colección en disco
 */
function saveCollection(collection) {
  writeFileSync(OUTPUT_FILE, JSON.stringify(collection, null, 2));
  console.log(`💾 Colección guardada en: ${OUTPUT_FILE}`);
}

/**
 * Función principal
 */
function main() {
  console.log('🚀 Generando colección de Postman...\n');

  try {
    const collection = generateCollection();
    saveCollection(collection);
    console.log('\n✨ ¡Colección generada con éxito!');
    console.log('📝 Importa el archivo en Postman para ver los cambios.');
  } catch (error) {
    console.error('❌ Error generando la colección:', error.message);
    process.exit(1);
  }
}

main();

import fs from "fs";
import { google } from "googleapis";
import path from "path";

const storageCtrl = {};

// Configuración de las sedes y sus credenciales
// SOLO se usa para el endpoint /api/storage (todas las sedes)
// Para endpoints individuales, se usa GOOGLE_DRIVE_API_KEY del .env
const SEDES_CONFIG = {
  florida: {
    name: "Florida (CIDM)",
    credentialFile: "repfora-411414-2b1a696cee9c.json",
    projectId: "repfora-411414"
  },
  sangel: {
    name: "San Gil (CAT)",
    credentialFile: "repfora-c966104279a7.json",
    projectId: "repfora"
  },
  bucaramanga: {
    name: "Bucaramanga (CSET)",
    credentialFile: "repforacset-5a173bf4e06e.json",
    projectId: "repforacset"
  },
  cucuta: {
    name: "Cúcuta (CEDRUM)",
    credentialFile: "repforacedrum-1efe398f8ff7.json",
    projectId: "maximal-shadow-475115-q9"
  }
};

/**
 * Autoriza con Google Drive usando una cuenta de servicio específica
 */
async function authorizeDrive(credentialFile) {
  const credentialsPath = path.join(process.cwd(), 'utils', 'uploadFiles', credentialFile);

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Archivo de credenciales no encontrado: ${credentialFile}`);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  await auth.authorize();
  return auth;
}

/**
 * Obtiene el archivo de credenciales desde la variable de entorno
 */
function getCredentialsFromEnv() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_DRIVE_API_KEY no está configurado en las variables de entorno');
  }

  return apiKey;
}

/**
 * Obtiene información de almacenamiento de una service account
 */
async function getStorageInfo(credentialFile) {
  try {
    console.log(`[Storage] Obteniendo info para: ${credentialFile}`);
    const auth = await authorizeDrive(credentialFile);
    const drive = google.drive({ version: 'v3', auth });

    // Obtener información de cuota
    const about = await drive.about.get({
      fields: 'storageQuota(limit,usage,usageInDrive)'
    });

    const quota = about.data.storageQuota || {};
    console.log(`[Storage] Cuota obtenida:`, JSON.stringify(quota, null, 2));

    // Obtener lista de archivos
    const files = await drive.files.list({
      pageSize: 100,
      fields: 'nextPageToken, files(id, name, size, mimeType, createdTime, webViewLink)',
      q: "trashed = false"
    });

    const allFiles = files.data.files || [];
    console.log(`[Storage] Archivos encontrados: ${allFiles.length}`);

    // Filtrar archivos que tienen tamaño y ordenarlos localmente
    const filesWithSize = allFiles
      .filter(file => file.size && parseInt(file.size) > 0)
      .map(file => {
        const size = parseInt(file.size) || 0;
        return {
          id: file.id,
          name: file.name,
          size: size,
          sizeFormatted: formatBytes(size),
          mimeType: file.mimeType,
          created: file.createdTime,
          viewUrl: file.webViewLink,
          isFolder: file.mimeType === 'application/vnd.google-apps.folder'
        };
      })
      .sort((a, b) => b.size - a.size);

    // Calcular tamaño total
    const totalSize = filesWithSize.reduce((sum, file) => sum + file.size, 0);

    console.log(`[Storage] Archivos con tamaño: ${filesWithSize.length}`);
    console.log(`[Storage] Tamaño total: ${formatBytes(totalSize)}`);

    // Obtener credenciales para info del proyecto
    const credentialsPath = path.join(process.cwd(), 'utils', 'uploadFiles', credentialFile);
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    return {
      projectId: credentials.project_id,
      serviceAccount: credentials.client_email,
      credentialFile: credentialFile,
      quota: {
        limit: quota.limit ? parseInt(quota.limit) : null,
        usage: quota.usage ? parseInt(quota.usage) : 0,
        usageInDrive: quota.usageInDrive ? parseInt(quota.usageInDrive) : 0,
        limitFormatted: quota.limit ? formatBytes(parseInt(quota.limit)) : 'No disponible',
        usageFormatted: quota.usage ? formatBytes(parseInt(quota.usage)) : '0 B',
        usageInDriveFormatted: quota.usageInDrive ? formatBytes(parseInt(quota.usageInDrive)) : '0 B',
        percentage: quota.limit && quota.usage ? ((parseInt(quota.usage) / parseInt(quota.limit)) * 100).toFixed(2) : 'N/A'
      },
      files: {
        total: filesWithSize.length,
        totalSize: totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        largest: filesWithSize.slice(0, 10)
      }
    };
  } catch (error) {
    console.error(`[Storage] Error obteniendo info de ${credentialFile}:`, error.message);
    console.error(`[Storage] Detalles del error:`, {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    return {
      error: `${error.name}: ${error.message}`,
      details: {
        code: error.code,
        status: error.status
      },
      credentialFile
    };
  }
}

/**
 * Formatea bytes a formato legible
 */
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Obtiene información de almacenamiento de todas las sedes
 */
storageCtrl.getAllStorage = async (req, res) => {
  try {
    const results = {};
    const summary = {
      totalProjects: 0,
      totalUsage: 0,
      totalLimit: 0,
      projects: []
    };

    // Consultar cada sede en paralelo
    const promises = Object.entries(SEDES_CONFIG).map(async ([key, config]) => {
      const info = await getStorageInfo(config.credentialFile);

      if (!info.error) {
        results[key] = {
          sede: config.name,
          ...info
        };

        summary.totalProjects++;
        summary.totalUsage += info.quota.usage || 0;
        summary.totalLimit += info.quota.limit || 0;

        summary.projects.push({
          sede: config.name,
          projectId: info.projectId,
          usage: info.quota.usage,
          usageFormatted: info.quota.usageFormatted,
          limit: info.quota.limit,
          percentage: parseFloat(info.quota.percentage),
          status: getStorageStatus(parseFloat(info.quota.percentage))
        });
      } else {
        results[key] = {
          sede: config.name,
          error: info.error
        };
      }
    });

    await Promise.all(promises);

    // Calcular porcentaje total
    summary.totalUsageFormatted = formatBytes(summary.totalUsage);
    summary.totalLimitFormatted = formatBytes(summary.totalLimit);
    summary.overallPercentage = summary.totalLimit > 0
      ? ((summary.totalUsage / summary.totalLimit) * 100).toFixed(2)
      : 'N/A';

    res.json({
      msg: "Información de almacenamiento obtenida correctamente",
      summary,
      details: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en getAllStorage:', error);
    res.status(500).json({
      msg: "Error al obtener información de almacenamiento",
      error: error.message
    });
  }
};

/**
 * Obtiene información de almacenamiento usando GOOGLE_DRIVE_API_KEY del .env
 * El parámetro :sede es ignorado, se usa la variable de entorno
 */
storageCtrl.getSedeStorage = async (req, res) => {
  try {
    const { sede } = req.params;

    // Obtener el archivo de credenciales desde la variable de entorno
    let credentialFile;
    try {
      credentialFile = getCredentialsFromEnv();
    } catch (error) {
      return res.status(500).json({
        msg: "Error de configuración",
        error: error.message,
        hint: "Configure GOOGLE_DRIVE_API_KEY en el archivo .env"
      });
    }

    const info = await getStorageInfo(credentialFile);

    if (info.error) {
      return res.status(500).json({
        msg: "Error al obtener información de almacenamiento",
        error: info.error
      });
    }

    res.json({
      msg: `Información de almacenamiento (usando ${credentialFile})`,
      credentialFile: credentialFile,
      requestedSede: sede,
      note: "Usando GOOGLE_DRIVE_API_KEY del .env",
      ...info,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en getSedeStorage:', error);
    res.status(500).json({
      msg: "Error al obtener información de almacenamiento",
      error: error.message
    });
  }
};

/**
 * Obtiene los archivos más grandes usando GOOGLE_DRIVE_API_KEY del .env
 */
storageCtrl.getLargestFiles = async (req, res) => {
  try {
    const { sede } = req.params;
    const { limit = 20 } = req.query;

    // Obtener el archivo de credenciales desde la variable de entorno
    let credentialFile;
    try {
      credentialFile = getCredentialsFromEnv();
    } catch (error) {
      return res.status(500).json({
        msg: "Error de configuración",
        error: error.message,
        hint: "Configure GOOGLE_DRIVE_API_KEY en el archivo .env"
      });
    }

    const auth = await authorizeDrive(credentialFile);
    const drive = google.drive({ version: 'v3', auth });

    const files = await drive.files.list({
      pageSize: parseInt(limit),
      fields: 'files(id,name,size,kind,mimeType,createdTime,owners,webViewLink)',
      orderBy: 'name', // Ordenar por nombre para evitar errores, filtrar por tamaño localmente
      q: "trashed=false"
    });

    // Filtrar y ordenar localmente por tamaño
    const fileList = (files.data.files || [])
      .filter(file => file.size && parseInt(file.size) > 0)
      .map(file => ({
        id: file.id,
        name: file.name,
        size: parseInt(file.size) || 0,
        sizeFormatted: formatBytes(parseInt(file.size) || 0),
        mimeType: file.mimeType,
        created: file.createdTime,
        viewUrl: file.webViewLink,
        isFolder: file.mimeType === 'application/vnd.google-apps.folder'
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, parseInt(limit));

    // Obtener info del proyecto
    const credentialsPath = path.join(process.cwd(), 'utils', 'uploadFiles', credentialFile);
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    res.json({
      msg: `Archivos más grandes (usando ${credentialFile})`,
      credentialFile: credentialFile,
      requestedSede: sede,
      projectId: credentials.project_id,
      serviceAccount: credentials.client_email,
      note: "Usando GOOGLE_DRIVE_API_KEY del .env",
      total: fileList.length,
      files: fileList,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en getLargestFiles:', error);
    res.status(500).json({
      msg: "Error al obtener archivos",
      error: error.message
    });
  }
};

/**
 * Obtiene resumen ejecutivo del almacenamiento
 */
storageCtrl.getSummary = async (req, res) => {
  try {
    const results = [];

    const promises = Object.entries(SEDES_CONFIG).map(async ([key, config]) => {
      const info = await getStorageInfo(config.credentialFile);

      if (!info.error) {
        results.push({
          sede: key,
          name: config.name,
          projectId: info.projectId,
          serviceAccount: info.serviceAccount,
          usage: info.quota.usage,
          usageFormatted: info.quota.usageFormatted,
          limit: info.quota.limit,
          limitFormatted: info.quota.limitFormatted,
          percentage: parseFloat(info.quota.percentage),
          status: getStorageStatus(parseFloat(info.quota.percentage)),
          filesCount: info.files.total,
          largestFiles: info.files.largest.slice(0, 3)
        });
      }
    });

    await Promise.all(promises);

    // Ordenar por porcentaje de uso
    results.sort((a, b) => b.percentage - a.percentage);

    res.json({
      msg: "Resumen de almacenamiento",
      totalSedes: results.length,
      projects: results,
      recommendations: generateRecommendations(results),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en getSummary:', error);
    res.status(500).json({
      msg: "Error al obtener resumen",
      error: error.message
    });
  }
};

/**
 * Determina el estado del almacenamiento según el porcentaje
 */
function getStorageStatus(percentage) {
  if (isNaN(percentage)) return 'unknown';
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'warning';
  if (percentage >= 50) return 'moderate';
  return 'healthy';
}

/**
 * Genera recomendaciones basadas en el uso
 */
function generateRecommendations(results) {
  const recommendations = [];

  results.forEach(result => {
    if (result.status === 'critical') {
      recommendations.push({
        sede: result.name,
        priority: 'high',
        message: `Almacenamiento crítico (${result.percentage}% usado). Elimine archivos antiguos o solicite más espacio.`,
        action: 'cleanup'
      });
    } else if (result.status === 'warning') {
      recommendations.push({
        sede: result.name,
        priority: 'medium',
        message: `Almacenamiento en nivel de alerta (${result.percentage}% usado). Considere limpiar archivos.`,
        action: 'monitor'
      });
    }
  });

  // Recomendación general
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      message: 'Todos los proyectos tienen niveles saludables de almacenamiento.',
      action: 'none'
    });
  }

  return recommendations;
}

/**
 * Verifica una credencial específica y devuelve advertencias de almacenamiento
 */
storageCtrl.checkCredentialStorage = async (req, res) => {
  try {
    const { credentialFile } = req.body;

    // Validar que se proporcionó el archivo
    if (!credentialFile) {
      return res.status(400).json({
        msg: "Se requiere el nombre del archivo de credenciales",
        error: "credentialFile is required",
        hint: "Envía { 'credentialFile': 'repfora-xxx.json' } en el body"
      });
    }

    // Validar que el archivo tenga extensión .json
    if (!credentialFile.endsWith('.json')) {
      return res.status(400).json({
        msg: "El archivo debe tener extensión .json",
        error: "Invalid file format",
        hint: "Usa formato: repfora-xxx.json"
      });
    }

    console.log(`[Storage] Verificando credencial: ${credentialFile}`);

    // Obtener información de almacenamiento
    const info = await getStorageInfo(credentialFile);

    if (info.error) {
      return res.status(500).json({
        msg: "Error al verificar la credencial",
        credentialFile,
        error: info.error
      });
    }

    // Calcular porcentaje y estado
    const percentage = parseFloat(info.quota.percentage);
    const status = getStorageStatus(percentage);

    // Generar advertencias según el estado
    const warnings = [];
    const alerts = [];

    if (status === 'critical') {
      alerts.push({
        level: 'critical',
        type: 'storage_full',
        message: `⚠️ ALMACENAMIENTO CRÍTICO: ${percentage}% usado`,
        description: `El proyecto ${info.projectId} está al ${percentage}% de su capacidad (${info.quota.usageFormatted} de ${info.quota.limitFormatted}).`,
        recommendation: 'Acción INMEDIATA requerida: Elimine archivos antiguos o solicite más espacio.',
        color: 'red'
      });
    } else if (status === 'warning') {
      alerts.push({
        level: 'warning',
        type: 'storage_high',
        message: `⚠️ ALMACENAMIENTO ALERTA: ${percentage}% usado`,
        description: `El proyecto ${info.projectId} está al ${percentage}% de su capacidad (${info.quota.usageFormatted} de ${info.quota.limitFormatted}).`,
        recommendation: 'Considere limpiar archivos pronto para evitar problemas.',
        color: 'orange'
      });
    } else if (status === 'moderate') {
      warnings.push({
        level: 'moderate',
        type: 'storage_moderate',
        message: `ℹ️ Almacenamiento moderado: ${percentage}% usado`,
        description: `El proyecto ${info.projectId} está al ${percentage}% de su capacidad (${info.quota.usageFormatted} de ${info.quota.limitFormatted}).`,
        recommendation: 'Monitoree periódicamente el uso de almacenamiento.',
        color: 'yellow'
      });
    }

    // Información de archivos grandes
    const largeFiles = info.files.largest.slice(0, 5);
    const totalLargeFilesSize = largeFiles.reduce((sum, file) => sum + file.size, 0);

    res.json({
      msg: alerts.length > 0 ? "⚠️ ADVERTENCIAS DE ALMACENAMIENTO" : "✅ Almacenamiento saludable",
      credentialFile,
      projectId: info.projectId,
      serviceAccount: info.serviceAccount,
      storage: {
        usage: info.quota.usage,
        usageFormatted: info.quota.usageFormatted,
        limit: info.quota.limit,
        limitFormatted: info.quota.limitFormatted,
        percentage: percentage,
        status: status,
        availableSpace: info.quota.limit - info.quota.usage,
        availableSpaceFormatted: formatBytes(info.quota.limit - info.quota.usage)
      },
      alerts,
      warnings,
      recommendations: alerts.length > 0 ? alerts : warnings,
      topLargeFiles: {
        count: largeFiles.length,
        totalSize: totalLargeFilesSize,
        totalSizeFormatted: formatBytes(totalLargeFilesSize),
        files: largeFiles
      },
      needsAttention: status !== 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en checkCredentialStorage:', error);
    res.status(500).json({
      msg: "Error al verificar la credencial",
      error: error.message
    });
  }
};

export { storageCtrl };

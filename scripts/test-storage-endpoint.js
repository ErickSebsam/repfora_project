#!/usr/bin/env node
/**
 * Script de prueba para el endpoint de monitoreo de almacenamiento
 *
 * Uso:
 *   node scripts/test-storage-endpoint.js [sede]
 *
 * Ejemplos:
 *   node scripts/test-storage-endpoint.js           # Todas las sedes
 *   node scripts/test-storage-endpoint.js florida   # Sede específica
 *   node scripts/test-storage-endpoint.js summary   # Resumen ejecutivo
 */

import http from 'http';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TOKEN = process.env.ADMIN_TOKEN || '';

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorize(percentage) {
  if (percentage >= 90) return colors.red;
  if (percentage >= 75) return colors.yellow;
  if (percentage >= 50) return colors.yellow;
  return colors.green;
}

function getStatusIcon(status) {
  switch(status) {
    case 'healthy': return '🟢';
    case 'moderate': return '🟡';
    case 'warning': return '🟠';
    case 'critical': return '🔴';
    default: return '⚪';
  }
}

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(json.msg || json.error || 'Error desconocido'));
          } else {
            resolve(json);
          }
        } catch (error) {
          reject(new Error(`Error parsing JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

async function showAllStorage() {
  console.log(`\n${colors.cyan}📊 Monitoreo de Almacenamiento - Todas las Sedes${colors.reset}\n`);

  try {
    const data = await makeRequest('/api/storage');

    // Resumen general
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.cyan}RESUMEN GENERAL${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`Total Proyectos:        ${data.summary.totalProjects}`);
    console.log(`Uso Total:              ${colors.cyan}${data.summary.totalUsageFormatted}${colors.reset}`);
    console.log(`Límite Total:            ${data.summary.totalLimitFormatted}`);
    console.log(`Porcentaje Global:       ${colorize(parseFloat(data.summary.overallPercentage))}${data.summary.overallPercentage}%${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Detalles por sede
    Object.entries(data.details).forEach(([key, sede]) => {
      if (sede.error) {
        console.log(`${colors.red}❌ ${sede.sede}: ERROR${colors.reset}`);
        console.log(`   ${colors.gray}${sede.error}${colors.reset}\n`);
        return;
      }

      const percentage = parseFloat(sede.quota.percentage);
      const status = getStatusIcon(
        percentage >= 90 ? 'critical' :
        percentage >= 75 ? 'warning' :
        percentage >= 50 ? 'moderate' : 'healthy'
      );

      console.log(`${status} ${colors.cyan}${sede.sede}${colors.reset}`);
      console.log(`   Proyecto:         ${colors.gray}${sede.projectId}${colors.reset}`);
      console.log(`   Service Account:  ${colors.gray}${sede.serviceAccount}@...${colors.reset}`);
      console.log(`   Uso:              ${colors.cyan}${sede.quota.usageFormatted}${colors.reset} / ${sede.quota.limitFormatted}`);
      console.log(`   Porcentaje:       ${colorize(percentage)}${sede.quota.percentage}%${colors.reset}`);
      console.log(`   Archivos:         ${sede.files.total} (${sede.files.totalSizeFormatted})`);

      if (sede.files.largest.length > 0) {
        console.log(`   Archivos más grandes:`);
        sede.files.largest.slice(0, 3).forEach((file, idx) => {
          console.log(`      ${idx + 1}. ${colors.gray}${file.name}${colors.reset} (${file.sizeFormatted})`);
        });
      }
      console.log();
    });

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

async function showSedeStorage(sedeCode) {
  console.log(`\n${colors.cyan}📊 Monitoreo de Almacenamiento - ${sedeCode.toUpperCase()}${colors.reset}\n`);

  try {
    const data = await makeRequest(`/api/storage/${sedeCode}`);

    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.cyan}${data.sede}${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`Proyecto:              ${colors.gray}${data.projectId}${colors.reset}`);
    console.log(`Service Account:       ${colors.gray}${data.serviceAccount}${colors.reset}`);
    console.log(`\n${colors.cyan}CUOTA DE ALMACENAMIENTO${colors.reset}`);
    console.log(`Límite:                ${colors.cyan}${data.quota.limitFormatted}${colors.reset}`);
    console.log(`Uso:                   ${colors.cyan}${data.quota.usageFormatted}${colors.reset}`);
    console.log(`En Drive:              ${data.quota.usageInDriveFormatted}`);
    console.log(`Porcentaje:            ${colorize(parseFloat(data.quota.percentage))}${data.quota.percentage}%${colors.reset}`);

    if (data.files && data.files.largest) {
      console.log(`\n${colors.cyan}ARCHIVOS MÁS GRANDES${colors.reset}`);
      console.log(`Total:                 ${data.files.total} archivos`);
      console.log(`Tamaño Total:          ${data.files.totalSizeFormatted}\n`);

      data.files.largest.forEach((file, idx) => {
        console.log(`   ${colors.gray}${idx + 1}.${colors.reset} ${file.name}`);
        console.log(`      ${colors.gray}${file.sizeFormatted}${colors.reset} | ${file.mimeType}`);
        console.log(`      Creado: ${new Date(file.created).toLocaleString('es-CO')}\n`);
      });
    }

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

async function showSummary() {
  console.log(`\n${colors.cyan}📊 Resumen Ejecutivo de Almacenamiento${colors.reset}\n`);

  try {
    const data = await makeRequest('/api/storage/summary');

    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    data.projects.forEach(project => {
      const status = getStatusIcon(project.status);
      const color = colorize(project.percentage);

      console.log(`${status} ${colors.cyan}${project.name}${colors.reset}`);
      console.log(`   Uso: ${color}${project.usageFormatted}${colors.reset} / ${project.limitFormatted}`);
      console.log(`   Porcentaje: ${color}${project.percentage}%${colors.reset}`);
      console.log(`   Estado: ${color}${project.status.toUpperCase()}${colors.reset}\n`);
    });

    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.cyan}RECOMENDACIONES${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    if (data.recommendations.length === 0) {
      console.log(`${colors.green}✅ Todos los proyectos están dentro de los límites normales${colors.reset}\n`);
    } else {
      data.recommendations.forEach(rec => {
        const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`${icon} ${colors.cyan}${rec.sede}${colors.reset}`);
        console.log(`   Prioridad: ${rec.priority.toUpperCase()}`);
        console.log(`   Mensaje:   ${rec.message}\n`);
      });
    }

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Main
async function main() {
  const arg = process.argv[2];

  if (!TOKEN) {
    console.error(`${colors.red}Error:${colors.reset} ADMIN_TOKEN no está configurado`);
    console.log(`\n${colors.gray}Usa:${colors.reset} ADMIN_TOKEN=your_token node scripts/test-storage-endpoint.js`);
    process.exit(1);
  }

  if (!arg || arg === 'all') {
    await showAllStorage();
  } else if (arg === 'summary') {
    await showSummary();
  } else {
    await showSedeStorage(arg);
  }

  console.log(`${colors.gray}Timestamp: ${new Date().toLocaleString('es-CO')}${colors.reset}\n`);
}

main();

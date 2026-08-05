#!/usr/bin/env node
/**
 * Script para probar el endpoint /api/storage después de las correcciones
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TOKEN = process.env.ADMIN_TOKEN || '';

async function testStorageEndpoint() {
  console.log('🧪 Probando endpoint /api/storage...\n');

  const options = {
    hostname: new URL(API_URL).hostname,
    port: new URL(API_URL).port || 3000,
    path: '/api/storage',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`${res.statusCode}: ${JSON.stringify(json)}`));
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

async function main() {
  if (!TOKEN) {
    console.error('❌ Error: ADMIN_TOKEN no está configurado');
    console.log('\nUsa: ADMIN_TOKEN="your_token" node scripts/test-storage-endpoint-v2.js');
    process.exit(1);
  }

  try {
    console.log('⏳ Haciendo petición a', API_URL, '...\n');
    const result = await testStorageEndpoint();

    console.log('✅ Respuesta recibida!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN GENERAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Proyectos:     ${result.summary.totalProjects}`);
    console.log(`Uso Total:            ${result.summary.totalUsageFormatted}`);
    console.log(`Límite Total:         ${result.summary.totalLimitFormatted}`);
    console.log(`Porcentaje Global:    ${result.summary.overallPercentage}%`);

    if (result.summary.projects && result.summary.projects.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📍 ESTADO POR SEDE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      result.summary.projects.forEach(p => {
        const status = p.status === 'critical' ? '🔴' :
                       p.status === 'warning' ? '🟠' :
                       p.status === 'moderate' ? '🟡' : '🟢';
        console.log(`${status} ${p.sede}`);
        console.log(`   Uso: ${p.usageFormatted} (${p.percentage}%)`);
        console.log(`   Estado: ${p.status}\n`);
      });
    }

    if (result.details) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📁 DETALLES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      Object.entries(result.details).forEach(([key, sede]) => {
        if (sede.error) {
          console.log(`❌ ${sede.sede}: ${sede.error}\n`);
        } else if (sede.quota) {
          console.log(`✅ ${sede.sede}`);
          console.log(`   Service Account: ${sede.serviceAccount}`);
          console.log(`   Uso: ${sede.quota.usageFormatted} / ${sede.quota.limitFormatted}`);
          console.log(`   Archivos con tamaño: ${sede.files.total}`);
          console.log(`   Tamaño total: ${sede.files.totalSizeFormatted}\n`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

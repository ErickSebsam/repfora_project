#!/usr/bin/env node
/**
 * Script de prueba para diagnosticar problemas con Google Drive API
 */

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const CREDENTIAL_FILE = 'repfora-c966104279a7.json'; // San Gil - cambia si necesitas probar otro

async function testDriveAPI() {
  console.log('🔍 Diagnosticando Google Drive API...\n');

  const credentialsPath = path.join(process.cwd(), 'utils', 'uploadFiles', CREDENTIAL_FILE);

  if (!fs.existsSync(credentialsPath)) {
    console.error(`❌ Archivo no encontrado: ${credentialsPath}`);
    process.exit(1);
  }

  console.log(`✅ Archivo de credenciales encontrado: ${CREDENTIAL_FILE}`);

  // Leer y parsear credenciales
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  console.log(`✅ Credenciales parseadas`);
  console.log(`   Project ID: ${credentials.project_id}`);
  console.log(`   Client Email: ${credentials.client_email}`);
  console.log(`   Universe Domain: ${credentials.universe_domain}\n`);

  // Crear autenticación
  console.log('🔐 Creando autenticación JWT...');
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  try {
    console.log('⏳ Autorizando...');
    await auth.authorize();
    console.log('✅ Autorización exitosa!\n');

    // Crear cliente de Drive
    const drive = google.drive({ version: 'v3', auth });

    // Test 1: About API
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test 1: Obteniendo información de cuota...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const about = await drive.about.get({
        fields: 'storageQuota(limit,usage,usageInDrive)'
      });

      console.log('✅ About API funcionó!');
      console.log('Response:', JSON.stringify(about.data, null, 2));

      if (about.data.storageQuota) {
        const quota = about.data.storageQuota;
        console.log('\n📦 Información de Almacenamiento:');
        console.log(`   Límite: ${quota.limit ? (parseInt(quota.limit) / 1024 / 1024 / 1024).toFixed(2) + ' GB' : 'N/A'}`);
        console.log(`   Uso: ${quota.usage ? (parseInt(quota.usage) / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '0 GB'}`);
        console.log(`   En Drive: ${quota.usageInDrive ? (parseInt(quota.usageInDrive) / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '0 GB'}`);
      }
    } catch (error) {
      console.error('❌ Error en About API:');
      console.error('   Name:', error.name);
      console.error('   Message:', error.message);
      console.error('   Status:', error.status);
      console.error('   Code:', error.code);
      if (error.errors) {
        console.error('   Errors:', JSON.stringify(error.errors, null, 2));
      }
    }

    console.log('\n');

    // Test 2: Files List API
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📁 Test 2: Listando archivos...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const files = await drive.files.list({
        pageSize: 5,
        fields: 'nextPageToken, files(id, name, size, mimeType)',
        orderBy: 'size desc',
        q: 'trashed = false'
      });

      console.log('✅ Files List API funcionó!');
      console.log(`   Total archivos encontrados: ${files.data.files?.length || 0}`);

      if (files.data.files && files.data.files.length > 0) {
        console.log('\n   Archivos más grandes:');
        files.data.files.slice(0, 5).forEach((file, idx) => {
          const size = file.size ? (parseInt(file.size) / 1024 / 1024).toFixed(2) + ' MB' : 'N/A';
          console.log(`   ${idx + 1}. ${file.name} (${size})`);
        });
      }
    } catch (error) {
      console.error('❌ Error en Files List API:');
      console.error('   Name:', error.name);
      console.error('   Message:', error.message);
      console.error('   Status:', error.status);
      console.error('   Code:', error.code);
      if (error.errors) {
        console.error('   Errors:', JSON.stringify(error.errors, null, 2));
      }
    }

    console.log('\n✅ Tests completados');

  } catch (error) {
    console.error('\n❌ Error en autorización:');
    console.error('   Name:', error.name);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar tests
testDriveAPI().catch(error => {
  console.error('❌ Error no manejado:', error);
  process.exit(1);
});

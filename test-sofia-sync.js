/**
 * test-sofia-sync.js
 *
 * Script suelto para probar cron/sofia-sync.js a mano, sin esperar al cron de
 * cada 5 minutos. Sigue el mismo patrón que los demás test-*.js/check-*.js del
 * proyecto: conecta a Mongo, corre una cosa puntual, y termina.
 *
 * Uso: node test-sofia-sync.js
 */
import dotenv from 'dotenv';
dotenv.config();

import dbConnection from './database.js';
import { runSofiaSync } from './cron/sofia-sync.js';

async function main() {
  await dbConnection();
  const resultado = await runSofiaSync({ source: 'endpoint' });
  console.log('[TEST_SOFIA_SYNC] Resultado:', resultado);
  process.exit(0);
}

main().catch((error) => {
  console.error('[TEST_SOFIA_SYNC] Error:', error);
  process.exit(1);
});

/**
 * Script de un solo uso para obtener el refresh token de Google OAuth2.
 * Usa el cliente OAuth "Aplicación web" con callback en localhost:3000.
 *
 * Uso:
 *   $env:GOOGLE_OAUTH_CLIENT_ID="tu_client_id"
 *   $env:GOOGLE_OAUTH_CLIENT_SECRET="tu_client_secret"
 *   node scripts/get-drive-token.js
 *
 * Resultado: imprime GOOGLE_OAUTH_REFRESH_TOKEN — copiarlo a .env y Coolify.
 * Este token sirve para TODOS los centros (se configura una sola vez).
 */

import http from "http";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/api/drive/auth/callback";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const PORT = 3000;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\nFaltan variables de entorno. Ejecutá:\n" +
    '  $env:GOOGLE_OAUTH_CLIENT_ID="tu_client_id"\n' +
    '  $env:GOOGLE_OAUTH_CLIENT_SECRET="tu_client_secret"\n'
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

// Servidor local que recibe el callback de Google
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/api/drive/auth/callback") {
    res.end("Esperando callback...");
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.end(`<h2>Error: ${error}</h2><p>Cerrá esta pestaña.</p>`);
    server.close();
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    res.end(`
      <h2>¡Listo! Copiá el refresh token de la terminal.</h2>
      <p>Ya podés cerrar esta pestaña.</p>
    `);

    console.log("\n=== REFRESH TOKEN OBTENIDO ===");
    console.log("\nAgregá estas variables a .env y Coolify de TODOS los centros:\n");
    console.log(`GOOGLE_OAUTH_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken}`);
    console.log("\nEste token no vence. Un solo token para todos los centros.\n");
  } catch (err) {
    res.end(`<h2>Error al obtener token: ${err.message}</h2>`);
    console.error("Error:", err.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`\nServidor escuchando en puerto ${PORT}...`);
  console.log("\nAbrí esta URL en el navegador con la cuenta Gmail dueña del Drive:\n");
  console.log(authUrl + "\n");
});

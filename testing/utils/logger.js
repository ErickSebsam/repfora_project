export const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toLocaleTimeString()} - ${msg}`),
  success: (msg) => console.log(`[OK]   ${new Date().toLocaleTimeString()} - ${msg}`),
  warn: (msg) => console.log(`[WARN] ${new Date().toLocaleTimeString()} - ${msg}`),
  error: (msg, err) => console.error(`[ERR]  ${new Date().toLocaleTimeString()} - ${msg}`, err || '')
};
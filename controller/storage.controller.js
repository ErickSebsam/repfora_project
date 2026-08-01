import { google } from "googleapis";

const storageCtrl = {};

async function authorizeOAuth2() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Faltan variables de entorno: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET o GOOGLE_OAUTH_REFRESH_TOKEN"
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  await auth.getAccessToken();
  return auth;
}

async function getStorageInfo() {
  const auth = await authorizeOAuth2();
  const drive = google.drive({ version: "v3", auth });

  const about = await drive.about.get({
    fields: "storageQuota(limit,usage,usageInDrive,usageInDriveTrash)",
  });

  const quota = about.data.storageQuota || {};
  const limit = parseInt(quota.limit) || 0;
  const usage = parseInt(quota.usage) || 0;
  const usageInDrive = parseInt(quota.usageInDrive) || 0;
  const usageInTrash = parseInt(quota.usageInDriveTrash) || 0;
  const percentage =
    limit > 0 ? ((usage / limit) * 100).toFixed(2) : "N/A";

  return {
    quota: {
      limit,
      usage,
      usageInDrive,
      usageInTrash,
      limitFormatted: formatBytes(limit),
      usageFormatted: formatBytes(usage),
      usageInDriveFormatted: formatBytes(usageInDrive),
      usageInTrashFormatted: formatBytes(usageInTrash),
      percentage,
      status: getStorageStatus(parseFloat(percentage)),
    },
  };
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// GET /api-storage
storageCtrl.getAllStorage = async (req, res) => {
  try {
    const info = await getStorageInfo();
    res.json({
      msg: "Información de almacenamiento del Drive compartido",
      ...info,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Storage] getAllStorage error:", error.message);
    res.status(500).json({ msg: "Error al obtener almacenamiento", error: error.message });
  }
};

// GET /api-storage/summary
storageCtrl.getSummary = async (req, res) => {
  try {
    const info = await getStorageInfo();
    const { quota } = info;
    const percentage = parseFloat(quota.percentage);
    const status = quota.status;

    let recommendation = "Almacenamiento en nivel saludable.";
    if (status === "critical")
      recommendation = `Almacenamiento crítico (${percentage}%). Eliminá archivos antiguos inmediatamente.`;
    else if (status === "warning")
      recommendation = `Almacenamiento en alerta (${percentage}%). Considerá limpiar archivos pronto.`;
    else if (status === "moderate")
      recommendation = `Almacenamiento moderado (${percentage}%). Monitoreá periódicamente.`;

    res.json({
      msg: "Resumen de almacenamiento del Drive compartido",
      status,
      percentage: quota.percentage,
      usage: quota.usageFormatted,
      limit: quota.limitFormatted,
      usageInDrive: quota.usageInDriveFormatted,
      usageInTrash: quota.usageInTrashFormatted,
      recommendation,
      needsAttention: status !== "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Storage] getSummary error:", error.message);
    res.status(500).json({ msg: "Error al obtener resumen", error: error.message });
  }
};

// GET /api-storage/:sede  (parámetro :sede ignorado — Drive es compartido)
storageCtrl.getSedeStorage = async (req, res) => {
  try {
    const info = await getStorageInfo();
    res.json({
      msg: "Información de almacenamiento del Drive compartido",
      note: "Todos los centros comparten un solo Drive OAuth2",
      ...info,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Storage] getSedeStorage error:", error.message);
    res.status(500).json({ msg: "Error al obtener almacenamiento", error: error.message });
  }
};

// GET /api-storage/:sede/files
storageCtrl.getLargestFiles = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const auth = await authorizeOAuth2();
    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.list({
      pageSize: 100,
      fields: "files(id,name,size,mimeType,createdTime,webViewLink)",
      q: "trashed=false",
    });

    const files = (response.data.files || [])
      .filter((f) => f.size && parseInt(f.size) > 0)
      .map((f) => ({
        id: f.id,
        name: f.name,
        size: parseInt(f.size),
        sizeFormatted: formatBytes(parseInt(f.size)),
        mimeType: f.mimeType,
        created: f.createdTime,
        viewUrl: f.webViewLink,
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, parseInt(limit));

    res.json({
      msg: "Archivos más grandes del Drive compartido",
      total: files.length,
      files,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Storage] getLargestFiles error:", error.message);
    res.status(500).json({ msg: "Error al obtener archivos", error: error.message });
  }
};

// POST /api-storage/check
storageCtrl.checkCredentialStorage = async (req, res) => {
  try {
    const info = await getStorageInfo();
    const { quota } = info;
    const percentage = parseFloat(quota.percentage);
    const status = quota.status;

    res.json({
      msg:
        status !== "healthy"
          ? "Advertencia de almacenamiento"
          : "Almacenamiento saludable",
      status,
      percentage: quota.percentage,
      usage: quota.usageFormatted,
      limit: quota.limitFormatted,
      needsAttention: status !== "healthy",
      note: "El sistema ahora usa OAuth2 con un Drive compartido entre todos los centros",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Storage] checkCredentialStorage error:", error.message);
    res.status(500).json({ msg: "Error al verificar almacenamiento", error: error.message });
  }
};

function getStorageStatus(percentage) {
  if (isNaN(percentage)) return "unknown";
  if (percentage >= 90) return "critical";
  if (percentage >= 75) return "warning";
  if (percentage >= 50) return "moderate";
  return "healthy";
}

export { storageCtrl };

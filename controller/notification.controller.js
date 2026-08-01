import Notification from "../models/Notification.js";
import jwt from "jsonwebtoken"

const notificationCtrl = {};

// Obtener notificaciones
notificationCtrl.getNotifications = async (req, res) => {
  try {
    const token = req.headers.token || req.headers.authorization;
    let recipientEmail = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithm: 'HS256' });
        recipientEmail = decoded.email || null;
      } catch (e) {
        // token inválido o expirado
      }
    }

    if (!recipientEmail) return res.json([]);

    const notifications = await Notification.find({ recipient: recipientEmail })
      .sort({ date: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(400).json({ msg: "Error al obtener notificaciones", error: error.message });
  }
};

// Marcar como leída
notificationCtrl.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ msg: "Notificación marcada como leída" });
  } catch (error) {
    res.status(400).json({ msg: "Error al actualizar notificación", error: error.message });
  }
};

// Crear notificación (para pruebas o uso interno del sistema)
notificationCtrl.createNotification = async (req, res) => {
  const { sender, subject, fiche, recipient } = req.body;
  try {
    const newNotification = new Notification({
      sender,
      subject,
      fiche,
      recipient
    });
    await newNotification.save();
    res.json({ msg: "Notificación creada", data: newNotification });
  } catch (error) {
    res.status(400).json({ msg: "Error al crear notificación", error: error.message });
  }
};

export { notificationCtrl };

import { Router } from "express";
import { notificationCtrl } from "../controller/notification.controller.js";

const { getNotifications, markAsRead, createNotification } = notificationCtrl;

const routerNotifications = Router();

routerNotifications.get("/", getNotifications);
routerNotifications.put("/:id/read", markAsRead);
routerNotifications.post("/", createNotification); // Opcional, para pruebas

export { routerNotifications };

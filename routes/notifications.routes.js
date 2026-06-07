import { Router } from "express";
import { getAllNotificationsController, deleteNotificationController, readNotificationController, readAllNotificationsController, getHasReadController } from "../controllers/notifications.controller.js";

const router = Router();

router.get("/all", getAllNotificationsController);
router.get("/has-read", getHasReadController);
router.delete("/:id", deleteNotificationController);
router.patch("/:id/read", readNotificationController);
router.patch("/read/all", readAllNotificationsController);

export default router;
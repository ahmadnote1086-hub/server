import {
  getAllNotificationsModel,
  deleteNotificationModel,
  readNotificationModel,
  readAllNotificationsModel,
  getHasReadModel,
} from "../models/notifications.model.js";

const getAllNotificationsService = async (userId) => {
  const notifications = await getAllNotificationsModel(userId);

  return { notifications, message: "All notifications fetched successfully!" };
};

const getHasReadService = async (userId) => {
  const hasUnread = await getHasReadModel(userId);

  return { hasUnread };
};

const deleteNotificationService = async (n_id) => {
  await deleteNotificationModel(n_id);

  return { message: "Notification deleted successfully!" };
};

const readNotificationService = async (un_id) => {
  const success = await readNotificationModel(un_id);

  return { success, message: "Notification read!" };
};

const readAllNotificationsService = async (user_id) => {
  const success = await readAllNotificationsModel(user_id);

  return { success, message: "All notifications are marked read!" };
};

export {
  getAllNotificationsService,
  deleteNotificationService,
  readNotificationService,
  readAllNotificationsService,
  getHasReadService,
};

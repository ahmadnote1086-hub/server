import db from "../db/mysqlConfig.js";

const getAllNotificationsModel = async (userId) => {
    const [notifications] = await db.query(`
        SELECT n.*, un.is_read, un.un_id
        FROM notification n
        JOIN user_notification un
        ON n.n_id = un.n_id
        WHERE un.user_id = ?
        ORDER BY created_at DESC
    `, [userId]);

    return notifications;
}

const getHasReadModel = async (userId) => {
    const [notifications] = await db.query(`
        SELECT COUNT(*) AS count
        FROM user_notification
        WHERE user_id = ?
        AND is_read = 0
    `, [userId]);

    let hasUnread = false;
    if (notifications[0].count > 0) hasUnread = true;

    return hasUnread;
}

const createNotification = async (userId, title, message, type, referenceType, referenceId) => {
    const [nResult] = await db.query(
      `INSERT INTO notification
      (title, message, type, reference_type, reference_id) 
      VALUES (?, ?, ?, ?, ?)`,
      [title, message, type, referenceType, referenceId],
    );

    await db.query(
      `
      INSERT INTO user_notification
      (user_id, n_id) 
            VALUES (?, ?)
        `,
      [userId, nResult.insertId],
    );

    return true;
}

const deleteNotificationModel = async (un_id) => {
    const [notifications] = await db.query(`
        DELETE 
        FROM user_notification
        WHERE un_id = ?
    `, [un_id]);

    return notifications;
}

const readNotificationModel = async (un_id) => {
  const [result] = await db.query(`
    UPDATE user_notification
    SET is_read = 1
    WHERE un_id = ?
  `, [un_id]);

  return true;
};

const readAllNotificationsModel = async (user_id) => {
  await db.query(`
        UPDATE user_notification
        SET is_read = 1
        WHERE user_id = ?
    `, [user_id]);

  return true;
};

export {
    getAllNotificationsModel,
    deleteNotificationModel,
    readNotificationModel,
    readAllNotificationsModel,
    getHasReadModel,
    createNotification,
}
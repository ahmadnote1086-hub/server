import db from "../../db/mysqlConfig.js";

const getRecentNotificationsModel = async () => {
  const [notifications] = await db.query(`
        SELECT *
        FROM notification
        ORDER BY created_at DESC
        LIMIT 50
    `);

  return notifications;
};

const sendNotificationModel = async (payload) => {
  const { recipient, userId, type, title, message, link, referenceType, referenceId } = payload;
  let users = [];
  
  if (recipient === "active") {
    return true;
  } else if (recipient === "specific" && userId) {
    users = [{ user_id: userId }];
  } else {
    const [rows] = await db.query(`SELECT u.user_id FROM users u JOIN stats s ON u.user_id = s.user_id WHERE hp > 0`);

    users = rows;
  } 
  
  const values = users.map((u) => [ title, message, u.user_id, type, referenceType, referenceId])
  
  if (values.length > 0) {
    const [nResult] = await db.query(
      `INSERT INTO
      notification
      (title, message, type, link, reference_type, reference_id) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [title, message, type, link, referenceType, referenceId],
    );
    
    const n_id = nResult.insertId;
    
    const userNotiValues = users.map((u) => [
      u.user_id,
      n_id
    ]);
    
    await db.query(
      `
      INSERT INTO user_notification
      (user_id, n_id) 
            VALUES ?
        `,
      [userNotiValues],
    );
  }
  
  return true;
};

const deleteOldNotificationsModel = async (un_id) => {
    const [notifications] = await db.query(`
        DELETE 
        FROM notification
        WHERE created_at < NOW() - INTERVAL 15 DAY
    `, [un_id]);

    return notifications;
}

export { getRecentNotificationsModel, sendNotificationModel, deleteOldNotificationsModel };

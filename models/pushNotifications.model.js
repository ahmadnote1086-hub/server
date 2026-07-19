import moment from "moment-timezone";
import db from "../db/mysqlConfig.js";
import { getNextTrainingReminder } from "../utils/trainingSchedule.js";

export const createSubscription = async (
  userId,
  endpoint,
  p256dh,
  auth,
  timezone,
) => {
  await db.query(
    `
      INSERT IGNORE INTO push_subscriptions
      (user_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?)
    `,
    [userId, endpoint, p256dh, auth],
  );

  await db.query(
    `
      INSERT IGNORE INTO notification_settings
      (user_id, timezone, notification_enabled)
      VALUES (?, ?, ?)
    `,
    [userId, timezone, true],
  );

  await db.query(
    `
    UPDATE notification_settings 
    SET notification_enabled = true
    WHERE user_id = ?
  `,
    [userId],
  );

  return true;
};

export const getSubscriptions = async (userId) => {
  const [rows] = await db.query(
    `
      SELECT 
        ps.endpoint,
        ps.p256dh,
        ps.auth 
      FROM push_subscriptions ps
      JOIN notification_settings ns
        ON ps.user_id = ns.user_id
      WHERE 
        ps.user_id = ?
        AND ns.notification_enabled = 1
  `,
    [userId],
  );

  const subscriptions = rows.map((sub) => ({
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  }));

  return subscriptions;
};

export const getReminderTime = async (userId) => {
  const [rows] = await db.query(
    `
      SELECT reminder_time FROM notification_settings
      WHERE user_id = ?
  `,
    [userId],
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0].reminder_time;
};

export const deletePushSubscription = async (endpoint, userId) => {
  if (!userId) {
    const [rows] = await db.query(
      `
      SELECT user_id
      FROM push_subscriptions 
      WHERE endpoint = ?
    `,
      [endpoint],
    );

    if (rows.length === 0) {
      return false;
    }

    userId = rows[0].user_id;
  }

  const [result] = await db.query(
    `
    DELETE FROM push_subscriptions
    WHERE endpoint = ?
  `,
    [endpoint],
  );

  await db.query(
    `
      UPDATE notification_settings
      SET notification_enabled = false 
      WHERE user_id = ?
    `,
    [userId],
  );

  return result.affectedRows > 0;
};

export const fetchDueReminderUsers = async () => {
  const [users] = await db.query(`
    SELECT 
      ns.user_id,
      ns.timezone,
      ns.reminder_time,
      u.training_days,
      ps.endpoint,
      ps.p256dh,
      ps.auth
    FROM notification_settings ns
    JOIN users u
      ON u.user_id = ns.user_id
    JOIN push_subscriptions ps
      ON ns.user_id = ps.user_id
    WHERE 
      ns.notification_enabled = 1
      AND ns.next_reminder_at <= UTC_TIMESTAMP()
  `);

  return users;
};

// Fetch users push subscriptions and Id who have completed all there main quests of today
export const fetchUsersWithRiskyStreaks = async () => {
  const [users] = await db.query(`
    SELECT 
      ps.user_id,
      ps.endpoint,
      ps.p256dh,
      ps.auth
    FROM push_subscriptions ps
    JOIN stats s
      ON s.user_id = ps.user_id
    JOIN user_quests uq
      ON uq.user_id = ps.user_id
    JOIN quests q
      ON q.quest_id = uq.quest_id
    JOIN notification_settings ns
      ON ns.user_id = ps.user_id
    WHERE s.streak > 0
      AND q.type = 'main'
      AND ns.notification_enabled = 1
      AND DATE(uq.created_at) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), 'UTC', ns.timezone))
      AND HOUR(CONVERT_TZ(UTC_TIMESTAMP(), 'UTC', ns.timezone)) = 19
    GROUP BY 
      ps.user_id,
      ps.endpoint,
      ps.p256dh,
      ps.auth
    HAVING COUNT(*) > SUM(is_completed)
  `);

  return users;
};

export const updateReminderTimeModel = async (
  reminderTime,
  userId,
  timezone,
) => {
  const [rows] = await db.query(
    `
    SELECT training_days
    FROM users u
    WHERE user_id = ?
  `,
    [userId],
  );

  if (rows.length === 0) {
    throwErr("No user found", 404);
  }

  const trainingDays = rows[0].training_days;

  const now = moment.tz(timezone);

  const nextReminder = getNextTrainingReminder(now, reminderTime, trainingDays);

  const [result] = await db.query(
    `UPDATE notification_settings
    SET reminder_time = ?,
      next_reminder_at = ?
    WHERE user_id = ?`,
    [reminderTime, nextReminder.utc().format("YYYY-MM-DD HH:mm:ss"), userId],
  );

  if (result.affectedRows === 0) return throwErr("No user found", 404);

  return result.affectedRows > 0;
};

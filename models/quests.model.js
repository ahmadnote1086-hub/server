import db from "../db/mysqlConfig.js";
import { throwErr } from "../utils/error.utils.js";
import moment from "moment-timezone";
import { createNotification } from "./notifications.model.js";
import { getMaxReps } from "../utils/getMaxReps.js";
import { unlockTitle } from "../services/title.service.js";
import { getGlobalRankForUserModel } from "./user.model.js";
import { sendPushToSubscription } from "../services/pushNotifications.service.js";

/**
 * Fetch main, side and custom quests based on id of user
 *
 * @param {int} userId - id to fetch quests
 * @param {string} timezone - timezone of the user
 * @retur-ns {Promise<{ mainQuests: object[], sideQuests: object[] }>} - An object containing arrays of main and side quests.
 */
export const getQuestsModel = async (userId, timezone) => {
  const today = moment.tz(timezone).format("YYYY-MM-DD");
  
  const [rows] = await db.query(
    `SELECT q.*, uq.user_quest_id, uq.created_at, uq.is_completed, uq.total_reps, q.created_at AS coolDown
      FROM quests AS q  
      JOIN user_quests AS uq
      ON q.quest_id = uq.quest_id
      WHERE uq.user_id = ? 
        AND DATE(uq.created_at) = ?
        AND (
          q.type IN ('main', 'side')
          OR (q.type = 'custom' AND q.owner_user_id = ?)
        )`,
    [userId, today, userId],
  );

  const mainQuests = rows.filter((quest) => quest.type === "main");
  const sideQuests = rows.filter((quest) => quest.type === "side");
  const customQuests = rows.filter(
    (quest) => quest.type === "custom" && quest.owner_user_id === userId,
  );

  return { mainQuests, sideQuests, customQuests };
};

/**
 * Fetch event quests based
 *
 * @param {int} userId - id to fetch quests
 * @returns {Promise<{ eventQuests: Object[] }>} - An object containing arrays of main and side quests.
 */
export const getEventQuestsModel = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT *, ge.ends_at AS ends_at
    FROM user_event_progress uep
    JOIN global_events ge
      ON uep.ge_id = ge.ge_id
    JOIN quests q
      ON ge.quest_id = q.quest_id
    WHERE 
      uep.user_id = ?
      AND
      q.type = 'event'
      AND NOW() < ge.ends_at`,
    [userId],
  );

  return { eventQuests: rows };
};

/**
 * Fetch main and side quests based on id of user
 *
 * @param {int} userId - id to fetch quests
 * @param {string} timezone - timezone of the user
 * @param {string} date - date for the quests
 * @returns {Promise<{ mainQuests: object[], sideQuests: object[] }>} - An object containing arrays of main and side quests.
 */
export const getQuestsModelByDate = async (userId, timezone, date) => {
  const [rows] = await db.query(
    `SELECT *
        FROM quests AS q
        JOIN user_quests AS uq
        ON q.quest_id = uq.quest_id
        WHERE uq.user_id = ? 
            AND DATE(uq.created_at) = ?`,
    [userId, date],
  );

  const mainQuests = rows.filter((quest) => quest.type === "main");
  const sideQuests = rows.filter((quest) => quest.type === "side");

  return { mainQuests, sideQuests };
};

/**
 * Fetch's quests for every user
 *
 * @returns {Promise<{ mainQuests: object[], sideQuests: object[], custom: object[] }>} - An object containing arrays of main and side quests.
 */
export const getAllQuestsModel = async () => {
  const [rows] = await db.query(
    `SELECT *
      FROM users as u
      LEFT JOIN user_quests as uq
      ON u.user_id = uq.user_id
      WHERE DATE(uq.created_at) = CURDATE()`,
  );

  const mainQuests = rows.filter((quest) => quest.type === "main");
  const sideQuests = rows.filter((quest) => quest.type === "side");
  const customQuests = rows.filter((quest) => quest.type === "custom");

  return { main: mainQuests, side: sideQuests, custom: customQuests };
};

/**
 * Fetche's quest history for a user
 * @param {int} userId - id of the user
 * @param {string} timezone - timezone of the user
 *
 * @returns {Promise<{ questHistory: object }>} - An object containing list of quests history.
 */
export const getQuestsHistoryModel = async (userId, timezone) => {
  const today = moment.tz(timezone).startOf("day");
  const thirtyDaysAgo = today.clone().subtract(30, "days");

  const [rows] = await db.query(
    `SELECT *, DATE_FORMAT(uq.created_at, '%Y-%m-%d') AS created_date
      FROM quests as q
      JOIN user_quests as uq
      ON q.quest_id = uq.quest_id
      WHERE uq.user_id = ?
        AND Date(uq.created_at) >= ?
        AND Date(uq.created_at) < ?
      ORDER BY created_date DESC`,
    [userId, thirtyDaysAgo.format("YYYY-MM-DD"), today.format("YYYY-MM-DD")],
  );

  const questHistory = rows.reduce((acc, row) => {
    const date = row.created_date;

    if (!acc[date]) {
      acc[date] = [];
    }

    acc[date].push({
      id: row.user_quest_id,
      name: row.name,
      type: row.type,
      reps: row.total_reps,
      base_amount: row.base_amount,
      unit: row.unit,
      is_completed: row.is_completed,
      xp_gain: row.xp_gain,
      created_date: row.created_date,
    });
    return acc;
  }, {});

  return questHistory;
};

/**
 * Marks completed quest
 *
 * @param {int} userId - id of a specific user
 * @param {int} userQuestId - id of a specific quest for a user
 * @returns {Promise<boolean>} true/false
 */
export const completeQuestModel = async (userId, userQuestId, timezone) => {
  const [quest] = await db.query(
    `SELECT q.xp_gain, q.type, q.xp_gain, q.coins
     FROM user_quests AS uq
     JOIN quests AS q ON uq.quest_id = q.quest_id
     WHERE user_quest_id = ?
        AND user_id = ?
        AND is_completed = 0`,
    [userQuestId, userId],
  );
  if (quest.length === 0) {
    throwErr("No quests were found!", 404);
  }

  await db.query(
    `UPDATE user_quests
          SET is_completed = 1  
          WHERE user_quest_id = ?
            AND user_id = ?`,
    [userQuestId, userId],
  );

  const [quests] = await db.query(
    `SELECT q.type, uq.is_completed
     FROM user_quests AS uq
     JOIN quests AS q ON uq.quest_id = q.quest_id
     WHERE user_id = ?
      AND type = 'main'
      AND DATE(uq.created_at) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), 'UTC', ?))`,
    [userId, timezone],
  );

  const isMainQuestsCompleted = quests.every((q) => q.is_completed);

  return {
    xpReward: quest[0].xp_gain,
    coinReward: quest[0].coins,
    areMainQuestsCompleted: quest[0].type === "main" && isMainQuestsCompleted,
  };
};

/**
 * Marks all today's mian/side quests as completed for a user
 *
 * @param {int} userId - id of a user
 * @param {string} type - Type of the quests
 * @param {string} timezone - timezone of the user
 * @returns {Promise<number>} number of quests completed
 */
export const completeAllQuestsForTodayModal = async (
  userId,
  type,
  timezone,
) => {
  const [incompleteQuests] = await db.query(
    `SELECT uq.user_quest_id, q.xp_gain, q.coins
     FROM user_quests uq
     JOIN quests q ON uq.quest_id = q.quest_id
     WHERE uq.user_id = ?
       AND q.type = ?
       AND uq.is_completed = 0
       AND DATE(uq.created_at) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), 'UTC', ?))`,
    [userId, type, timezone],
  );

  if (incompleteQuests.length === 0) {
    throwErr("No new quests to complete", 404);
  }

  await db.query(
    `UPDATE user_quests
      SET is_completed = 1
      WHERE user_quest_id IN (?)`,
    [incompleteQuests.map((q) => q.user_quest_id)],
  );

  const totalXpReward = incompleteQuests.reduce((sum, q) => sum + q.xp_gain, 0);
  const totalCoinReward = incompleteQuests.reduce((sum, q) => sum + q.coins, 0);

  return { xpReward: totalXpReward, coinReward: totalCoinReward };
};

/**
 * Update Stats of a user
 *
 * @param {int} userId - id of a user
 * @param {string} timezone - timezone of the user
 * @param {int} xpReward - xp to be increased
 * @param {int} coinReward - coins to be increased
 * @returns {Promise<boolean>} true/false
 */
export const updateStatsModel = async (
  userId,
  timezone,
  xpReward,
  coinReward,
) => {
  const [statsRows] = await db.query(
    `SELECT * FROM stats WHERE stats.user_id = ?`,
    [userId],
  );

  if (statsRows.length === 0) throwErr("No stats found for user", 404);

  let { xp: currentXp, coins, level, player_rank: rank } = statsRows[0];
  let newXp = currentXp + xpReward + (level - 1) * 2;
  let totalCoins = coins + coinReward + (level - 1) * (xpReward > 0 ? 5 : 3);
  let requiredXP = level * 100 + (level - 1) * 50;

  while (newXp >= requiredXP) {
    const prevLevel = level;
    level++;
    newXp -= requiredXP;
    requiredXP = level * 100 + (level - 1) * 50;

    await unlockTitle("level", userId, level);

    if (level >= 6 && level <= 10) rank = "D";
    else if (level >= 11 && level <= 20) rank = "C";
    else if (level >= 21 && level <= 35) rank = "B";
    else if (level >= 36 && level <= 50) rank = "A";
    else if (level >= 51) rank = "S";
  }

  const userLocalTime = moment()
    .tz(timezone || "UTC")
    .format("YYYY-MM-DD HH:mm:ss");

  await db.query(
    `UPDATE stats
        SET xp = ?,
          level = ?,
          total_xp = total_xp + ?,
          coins = ?,
          player_rank = ?,
          last_completed = ?
          WHERE user_id = ?`,
    [newXp, level, xpReward, totalCoins, rank, userLocalTime, userId],
  );

  // Check if leaderboard title is achievable
  const globalRank = await getGlobalRankForUserModel(userId);

  await unlockTitle("leaderboard", userId, globalRank);

  if (statsRows[0].player_rank !== rank) {
    await createNotification(
      userId,
      "Rank Up!",
      `Your power has grown. You are now a ${rank}-Rank Hunter.`,
      "system",
      null,
      null,
    );
  }

  return true;
};

/**
 * Assigns quests of type main or side quests
 *
 * @param {int} userId - id of a specific user
 * @param {string} timezone - timezone of the user
 * @returns {Promise<boolean>} true/false
 */
export const assignQuestsByType = async (userId, timezone, type) => {
  if (!["main", "side"].includes(type)) {
    return false;
  }

  const [quests] = await db.query(
    `SELECT quest_id, increment, base_amount
     FROM quests WHERE type = ?`,
    [type],
  );

  if (!quests || quests.length === 0) {
    return false;
  }

  const assignedAt = moment
    .tz(timezone)
    .startOf("day")
    .format("YYYY-MM-DD HH:mm:ss");

  for (const quest of quests) {
    const [lastQuestRows] = await db.query(
      `SELECT 
        uq.total_reps,
        q.max_reps
      FROM user_quests uq
      JOIN quests q
        ON uq.quest_id = q.quest_id
      WHERE 
        uq.user_id = ? 
        AND uq.quest_id = ? 
      ORDER 
        BY uq.created_at DESC LIMIT 1`,
      [userId, quest.quest_id],
    );

    let totalReps;

    if (lastQuestRows.length > 0) {
      const lastQuest = lastQuestRows[0];
      if (lastQuest.total_reps >= lastQuest.max_reps) {
        totalReps = lastQuest.max_reps;
      } else {
        totalReps = lastQuest.total_reps + quest.increment;
      }
    } else {
      totalReps = quest.base_amount;
    }

    await db.query(
      `INSERT IGNORE INTO user_quests (user_id, quest_id, total_reps, created_at)
      VALUES (?, ?, ?, ?)`,
      [userId, quest.quest_id, totalReps, assignedAt],
    );
  }

  return quests.length > 0;
};

/**
 * Assigns main quests
 *
 * @param {int} userId - id of a specific user
 * @param {string} timezone - timezone of the user
 * @returns {Promise<boolean>} true/false
 */
export const assignMainQuestsModel = (userId, timezone = "UTC") => {
  return assignQuestsByType(userId, timezone, "main");
};

/**
 * Assigns side quests
 *
 * @param {int} userId - id of a specific user
 * @param {string} timezone - timezone of the user
 * @returns {Promise<boolean>} true/false
 */
export const assignSideQuestsModel = (userId, timezone = "UTC") => {
  return assignQuestsByType(userId, timezone, "side");
};

/**
 * Assigns custom quests
 *
 * @param {int} userId - id of a specific user
 * @param {string} timezone - timezone of the user
 * @returns {Promise<boolean>} true/false
 */
export const assignCustomQuestsModel = async (
  userId,
  timezone = "UTC",
) => {
  const [quests] = await db.query(
    `SELECT quest_id, reps 
    FROM quests 
    WHERE type = 'custom'
    AND owner_user_id = ?`,
    [userId],
  );

  if (!quests || quests.length === 0) {
    return true;
  }

  const assignedAt = moment
    .tz(timezone)
    .startOf("day")
    .format("YYYY-MM-DD HH:mm:ss");

  for (const quest of quests) {
    await db.query(
      `INSERT IGNORE INTO user_quests (user_id, quest_id, total_reps, created_at)
      VALUES (?, ?, ?, ?)`,
      [userId, quest.quest_id, quest.reps, assignedAt],
    );
  }

  return quests.length > 0;
};

/**
 * Checks if quests are assigned for today
 *
 * @param {int} userId - id of a specific user
 * @param {string} timezone - timezone of the user
 * @returns {Promise<boolean>} true/false
 */
export const checkQuestsAssignedToday = async (userId, timezone) => {
  const [rows] = await db.query(
    `
      SELECT q.type
      FROM user_quests uq
      JOIN quests q
      ON uq.quest_id = q.quest_id
      WHERE uq.user_id = ?
      AND q.type IN ('main', 'side', 'custom')
      AND DATE(CONVERT_TZ(uq.created_at, 'UTC', ?)) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), 'UTC', ?))
    `,
    [userId, timezone, timezone],
  );

  return {
    mainQuestAssigned: rows.some((q) => q.type === "main"),
    sideQuestAssigned: rows.some((q) => q.type === "side"),
    customQuestAssigned: rows.some((q) => q.type === "custom"),
  };
};

/**
 * Checks if custom quests are assigned for today
 *
 * @param {int} userId - id of a specific user
 * @param {string} timezone - timezone of the user
 * @returns {Promise<boolean>} true/false
 */
export const checkCustomQuestsAssignedToday = async (userId, timezone) => {
  const [rows] = await db.query(
    `
      SELECT 1
      FROM user_quests uq
      JOIN quests q
      ON uq.quest_id = q.quest_id
      WHERE uq.user_id = ?
      AND q.type = 'custom'
      AND DATE(CONVERT_TZ(uq.created_at, 'UTC', ?)) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), 'UTC', ?))
      LIMIT 1
    `,
    [userId, timezone, timezone],
  );

  return rows.length > 0;
};

/**
 * Creates a custom quest and assigns it to all users
 *
 * @param {object} questInfo - The info about the quest (name, base_amount, increment, xp_gain, unit)
 * @returns {Promise<{ id: number }>} - The ID of the newly inserted quest
 */
export const newCustomQuestModel = async (questInfo) => {
  await db.beginTransaction();
  try {
    const [result] = await db.query(
      `
    INSERT INTO 
    quests (name, base_amount, increment, xp_gain, unit)
    VALUES (?, ?, ?, ?, ?)`,
      [
        questInfo.name,
        questInfo.base_amount,
        questInfo.increment,
        questInfo.xp_gain,
        questInfo.unit,
      ],
    );

    if (result.affectedRows === 0) throwErr("Failed to insert quest", 500);

    const [users] = await db.query(`SELECT user_id FROM users`);
    for (let user of users) {
      await db.query(
        `INSERT INTO user_quests (user_id, quest_id) VALUES (?, ?)`,
        [user.user_id, result.insertId],
      );
    }

    await db.commit();
    return { id: result.insertId };
  } catch (error) {
    await db.rollback();
    throw error;
  }
};

/**
 * Update quest according to given quest info
 *
 * @param {int} questId - Id of the user
 * @param {object} questInfo - The info about the quest (name, base_amount, increment, xp_gain, unit)
 * @returns {Promise<boolean>} updated - true/false
 */
export const updateQuestModel = async (questId, questInfo) => {
  const fields = [];
  const values = [];

  for (const key in questInfo) {
    fields.push(`${key} = ?`);
    values.push(`${questInfo[key]}`);
  }

  const sqlQuery = `UPDATE quests SET ${fields.join(", ")}`;
  values.push(questId);

  const [result] = await db.query(sqlQuery, values);

  if (result.affectedRows === 0) throwErr("Quest not found or not updated");

  return { updated: true };
};

/**
 * Delete a quest from quests
 *
 * @param {int} questId - Id of the user
 * @returns {Promise<boolean>} deleted - true/false
 */
export const deleteQuestModel = async (questId) => {
  const [result] = await db.query(`DELETE FROM quests WHERE quest_id = ?`, [
    questId,
  ]);

  return { deleted: result.affectedRows > 0 };
};

/**
 * Delete a user_quests
 *
 * @param {int} userId - Id of the user
 * @param {int} questId - Id of the quest
 * @returns {Promise<boolean>} deleted - true/false
 */
export const unassignUserQuestModel = async (userId, questId) => {
  const [result] = await db.query(
    `DELETE FROM user_quests WHERE user_id = ? AND quest_id = ?`,
    [userId, questId],
  );

  return { deleted: result.affectedRows > 0 };
};

/**
 * Delete all user_quests for matching userId
 *
 * @param {int} userId - Id of the user
 * @returns {Promise<boolean>} deleted - true/false
 */
export const resetUserQuestModel = async (userId) => {
  const [result] = await db.query(`DELETE FROM user_quests WHERE user_id = ?`, [
    userId,
  ]);

  return { deleted: result.affectedRows > 0 };
};

/**
 * Create a Custom Quest for a user
 *
 * @param {int} userId - id of a user
 * @param {string} name - Name of the user
 * @param {int} unit - Quest's unit e.g. secs, km etc
 * @param {int} reps - Number of reps
 * @param {string} category - Quest's category
 * @param {string} timezone - timezone
 * @returns {Promise<object>} array of quests
 */
export const addCustomQuestModel = async (
  userId,
  name,
  unit,
  reps,
  category,
  timezone,
) => {
  const [[user]] = await db.query(
    `SELECT s.level FROM users u JOIN stats s ON s.user_id = u.user_id WHERE u.user_id = ?`,
    [userId],
  );
  if (!user || user.length === 0) return throwErr("User not found", 404);

  const MAXIMUM_QUESTS_ALLOWED = getMaxReps(user.level);

  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) as count FROM quests WHERE type = 'custom' AND owner_user_id = ?`,
    [userId],
  );
  if (count >= MAXIMUM_QUESTS_ALLOWED)
    return throwErr("Maximum quests already created", 403);

  const createdAt = moment.tz(timezone).format("YYYY-MM-DD HH:mm:ss");

  if (unit === "min" && reps <= 5) {
    unit = "sec";
    reps = reps * 60;
  }

  const [result] = await db.query(
    `
    INSERT INTO quests (name, type, base_amount, increment, xp_gain, unit, coins, reps, max_reps, owner_user_id, category, created_at)
    VALUES (?, 'custom', ?, NULL, 15, ?, 25, ?, NULL, ?, ?, ?)
  `,
    [name, reps, unit, reps, userId, category, createdAt],
  );

  return result.insertId;
};

/**
 * Assign Custom Quests to a user
 *
 * @param {int} userId - id of a user
 * @param {string} timezone - Timezone of the user
 * @param {int} questId - Quest's id
 * @returns {Promise<object>} array of quests
 */
export const assignCustomQuestModel = async (
  userId,
  timezone = "UTC",
  questId,
) => {
  const [quests] = await db.query(
    `SELECT * FROM quests WHERE type = 'custom' AND owner_user_id = ? AND quest_id = ?`,
    [userId, questId],
  );

  if (!quests || quests.length === 0) {
    return throwErr("Custom quests for this user not found", 404);
  }

  const assignedAt = moment
    .tz(timezone)
    .startOf("day")
    .format("YYYY-MM-DD HH:mm:ss");

  await db.query(
    `INSERT INTO user_quests (user_id, quest_id, total_reps, created_at)
    VALUES (?, ?, ?, ?)`,
    [userId, questId, quests[0].reps, assignedAt],
  );

  return quests.length > 0;
};

/**
 * Remove Custom Quest from quests model
 *
 * @param {int} userId - id of a user
 * @param {int} questId - Quest's id
 * @param {string} timezone - Timezone of the user
 * @returns {Promise<object>} array of quests
 */
export const removeCustomQuestModel = async (userId, questId, timezone) => {
  const [result] = await db.query(
    `DELETE FROM quests 
     WHERE type = 'custom' 
      AND owner_user_id = ? 
      AND quest_id = ?
      AND DATE(created_at) != DATE(CONVERT_TZ(UTC_TIMESTAMP(), 'UTC', ?))`,
    [userId, questId, timezone],
  );

  if (result.affectedRows === 0) {
    throwErr("No quests were removed", 400);
  }

  return true;
};

/**
 * UnAssigns Custom Quest from user_quests
 *
 * @param {int} userId - id of a user
 * @param {int} questId - Quest's id
 * @returns {Promise<object>} array of quests
 */
export const unAssignCustomQuestModel = async (userId, questId) => {
  const [result] = await db.query(
    `DELETE FROM user_quests
     WHERE user_id = ? 
     AND quest_id = ? `,
    [userId, questId],
  );

  if (result.affectedRows === 0) {
    throwErr("No quests were unassaigned!", 400);
  }

  return true;
};

/**
 * Remove all custom quests from user
 *
 * @param {int} userId - id of a user
 * @returns {Promise<object>} array of quests
 */
export const deleteUserCustomQuestModel = async (userId) => {
  await db.query(
    `DELETE FROM user_quests
     WHERE user_id = ?`,
    [userId],
  );

  await db.query(
    `DELETE FROM quests
     WHERE owner_user_id = ?`,
    [userId],
  );

  return true;
};

export const getTotalEventsCompleted = async (user_id) => {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM user_event_progress
    WHERE user_id = ?
      AND is_completed = 1 
  `,
    [user_id],
  );

  return rows[0].total;
};

export const updateEventProgressModel = async (uep_id, progress, user_id) => {
  await db.query(
    `
    UPDATE user_event_progress
    SET 
      current_reps = LEAST(current_reps + ?, total_reps), 
      is_completed = IF(current_reps >= total_reps, 1, 0)
    WHERE 
      is_completed = 0
      AND uep_id = ?
      AND user_id = ?
  `,
    [progress, uep_id, user_id],
  );

  const [rows] = await db.query(
    `
    SELECT uep.is_completed, uep.current_reps, uep.total_reps, q.xp_gain, q.coins
    FROM user_event_progress uep
    JOIN global_events ge
      ON uep.ge_id = ge.ge_id
    JOIN quests q
      ON ge.quest_id = q.quest_id
    WHERE uep.uep_id = ?
  `,
    [uep_id],
  );

  const totalEventsComplete = await getTotalEventsCompleted(user_id);

  await unlockTitle("event", user_id, totalEventsComplete);

  return rows[0] || null;
};

export const spawnEventQuests = async (quest_id, progress, user_id) => {
  const random = Math.random();

  // 1/4 chance of assigning daily event quests
  if (random > 0.25) return null;

  const [activeEventQuests] = await db.query(`
    SELECT quest_id
    FROM global_events 
    WHERE ends_at > NOW()
  `);

  // If event quests are assigned at the moment then don't activate anymore
  if (activeEventQuests.length >= 2) return null;

  const [allEventQuests] = await db.query(`
    SELECT 
      quest_id,
      xp_gain,
      base_amount,
      reps
    FROM quests 
    WHERE type = 'event'
  `);

  // filter quests that are not active
  const availableQuests = allEventQuests.filter(
    (quest) => !activeEventQuests.some((q) => q.quest_id === quest.quest_id),
  );

  if (availableQuests.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * availableQuests.length);
  const selectedQuest = availableQuests[randomIndex];

  // Longer duration = Higher difficult
  const difficulty =
    selectedQuest.xp_gain * 0.6 + Math.sqrt(selectedQuest.base_amount) * 10;

  let duration = 24;
  if (difficulty > 180 && difficulty <= 240) duration = 48;
  if (difficulty > 240) duration = 7 * 24;

  const spawnedAt = new Date();
  const endsAt = new Date(spawnedAt.getTime() + duration * 60 * 60 * 1000);

  const [result] = await db.query(
    `
    INSERT INTO 
    global_events (quest_id, spawned_at, ends_at)
    VALUES (?, ?, ?)
  `,
    [selectedQuest.quest_id, spawnedAt, endsAt],
  );

  const [users] = await db.query(`
    SELECT u.user_id 
    FROM users u
    JOIN stats s
    ON u.user_id = s.user_id
    WHERE s.hp > 0
  `);

  const values = users.map((user) => [
    user.user_id,
    result.insertId,
    selectedQuest.reps,
  ]);

  await db.query(
    `
    INSERT INTO 
    user_event_progress (user_id, ge_id, total_reps)
    VALUES ?
  `,
    [values],
  );

  const [notifResult] = await db.query(
    `INSERT INTO
    notification
    (title, message, type, reference_type, reference_id) 
    VALUES (?, ?, ?, ?, ?)`,
    [
      "New event quest added",
      "New limited time quest added to events. Complete it before it expires.",
      "quests",
      "quests",
      selectedQuest.quest_id,
    ],
  );

  const noti_id = notifResult.insertId;

  const userNotiValues = users.map((u) => [u.user_id, noti_id]);

  await db.query(
    `INSERT INTO
    user_notification
    (user_id, n_id) 
    VALUES ?`,
    [userNotiValues],
  );

  const [subscriptions] = await db.query(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions`,
  );

  const formattedSubscriptions = subscriptions.map((sub) => ({
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  }));

  await sendPushToSubscription(formattedSubscriptions, {
    title: "⚔️ New Event Quest Detected",
    body: "A limited-time quest has appeared. Complete it before the system closes it.",
    tag: "event-quest"
  });

  return {
    ge_id: result.insertId,
    quest: selectedQuest,
    endsAt,
  };
};

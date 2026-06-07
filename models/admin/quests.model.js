import db from "../../db/mysqlConfig.js";

const getAllQuestsModel = async () => {
  const quests = await db.query(`
        SELECT *
        FROM quests
    `);

  return quests[0];
};

const insertEventQuests = async (quest_id, total_reps, target_type, target_value) => {
  let users = [];

  if (target_type === "user") {
    const [rows] = await db.query(
      `SELECT u.user_id 
       FROM users u
       JOIN stats s ON u.user_id = s.user_id
       WHERE s.hp > 0
       AND u.username = ?`,
      [target_value]
    );
    users = rows;

  } else if (target_type === "level") {
    const [rows] = await db.query(
      `SELECT u.user_id 
       FROM users u
       JOIN stats s ON u.user_id = s.user_id
       WHERE s.hp > 0 
       AND s.level >= ?`,
      [target_value]
    );
    users = rows;

  } else {
    const [rows] = await db.query(
      `SELECT u.user_id 
       FROM users u
       JOIN stats s ON u.user_id = s.user_id
       WHERE s.hp > 0`
    );
    users = rows;
  }
  
  const questValues = users.map((u) => [u.user_id, quest_id, total_reps]);
  

  if (questValues.length > 0) {
    await db.query(
      `INSERT INTO user_quests (user_id, quest_id, total_reps) VALUES ?`,
      [questValues],
    );

    const [result] = await db.query(
      `INSERT INTO
      notification
      (title, message, type, reference_type, reference_id) 
      VALUES (?, ?, ?, ?, ?)`,
      [
        'New event quest added',
        "New limited time quest added to events. Complete it before it expires.", 
        'quests', 
        'quests', 
        quest_id
      ],
    );

    const noti_id = result.insertId;

    const userNotiValues = users.map((u) => [
      u.user_id,
      noti_id
    ]);
    
    await db.query(
      `INSERT INTO
      user_notification
      (user_id, n_id) 
      VALUES ?`,
      [userNotiValues],
    );
  }

  return true;
};

const addQuestsModel = async (
  name, type, category, base_amount, unit, increment, max_reps, xp_gain, coins, target_type, target_value, endsAt
) => {
  const createdAT = new Date();

  const [result] = await db.query(
    `
      INSERT INTO quests (
          name, type, category, base_amount, unit,
          increment, max_reps,
          xp_gain, coins,
          target_type, target_value,
          ends_at, reps,
          created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [name, type, category, base_amount, unit, increment || null, max_reps || null, xp_gain, coins, target_type, target_value || null, endsAt, base_amount, createdAT],
  );

  if (type === 'event') {
    await insertEventQuests(result.insertId, base_amount, target_type, target_value);
  }

  return result.insertId;
};

const removeQuestsModel = async (questId) => {
  const [quest] = await db.query(`SELECT type FROM quests WHERE quest_id = ?`, [
    questId,
  ]);

  if (!quest.length) throw new Error("Quest not found!");
  if (quest[0].type === "main")
    throw new Error("Main quests cannot be deleted!");

  const result = await db.query(
    `DELETE FROM quests WHERE quest_id = ? AND type != 'main'`,
    [questId],
  );

  if (result.affectedRows === 0) throw new Error("Quest not found!");

  return result.affectedRows;
};

export { getAllQuestsModel, addQuestsModel, removeQuestsModel };

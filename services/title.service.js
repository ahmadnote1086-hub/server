import { TITLES } from "../config/titles.js";
import db from "../db/mysqlConfig.js";
import { createNotification } from "../models/notifications.model.js";

export const unlockTitle = async (type, userId, requirement) => {
  for (const title of TITLES) {
    if (title.type !== type) continue;

    let shouldUnlock = false;

    if (type === "leaderboard") {
      shouldUnlock = requirement <= title.requirement;
    } else {
      shouldUnlock = requirement >= title.requirement;
    }

    if (shouldUnlock) {
      const [result] = await db.query(
        `
            INSERT IGNORE INTO user_titles (user_id, title_id) 
            VALUES (?, ?)
          `,
        [userId, title.id],
      );

      if (result.affectedRows > 0) {
        await createNotification(
          userId,
          "New Title Unlocked!",
          `You've unlocked the title "${title.name}". You can equip it from the Settings page.`,
          "system",
          null,
          null,
        );
      }
    }
  }
};

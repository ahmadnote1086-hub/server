import moment from "moment-timezone";
import db from "../db/mysqlConfig.js";
import { throwErr } from "../utils/error.utils.js";

/**
 * Fetch items from shop table
 *
 * @returns {Promise<{shopItems: Object}>} - All items for the shop
 */
export const fetchShopItems = async () => {
  const [shopItems] = await db.query(`SELECT * FROM items ORDER BY currency ASC`);

  return shopItems;
};

/**
 * Buy an item
 *
 * @param {int} item_id - Id of the item
 * @param {object} stats - stats of the user
 *
 * @returns {Promise<Boolean>} - True for successful purchase
 */
export const purchaseItemModel = async (item_id, stats, timezone) => {
  const [items] = await db.query(`SELECT * FROM items WHERE item_id = ?`,
    [item_id]
  );

  if (items.length === 0) throwErr("Item Not Found", 404);

  const item = items[0];
  let { xp: currentXp, total_xp, coins, level, player_rank: rank, hp,recovery_last_used } = stats;
  let newXp = currentXp;

  if (coins < item.price) throwErr("You don't have enough coins", 400);

  if (item.type === "hp") {
    if (hp === 5) throwErr("Your health is full!", 400);
    hp += item.increment;
    hp > 5 ? (hp = 5) : hp;
    coins -= item.price;
  } else if (item.type === "xp") {
    newXp = currentXp + item.increment;
    let requiredXP = level * 100 + (level - 1) * 50;
    total_xp += item.increment;
    coins -= item.price;

    while (newXp >= requiredXP) {
      level++;
      newXp -= requiredXP;
      requiredXP = level * 100 + (level - 1) * 50;

      if (level >= 6 && level <= 10) rank = "D";
      else if (level >= 11 && level <= 20) rank = "C";
      else if (level >= 21 && level <= 35) rank = "B";
      else if (level >= 36 && level <= 50) rank = "A";
      else if (level >= 51) rank = "S";
    }
  } else if (item.type === 'recovery') {
    const today = moment
    .tz(timezone)
    .startOf("day")
    .format("YYYY-MM-DD");

    const lastUsed = stats.recovery_last_used
      ? moment(stats.recovery_last_used).tz(timezone).format("YYYY-MM-DD")
      : null;
    const isRecoveryActive = today === lastUsed; 

    if (isRecoveryActive) {
      throw throwErr("Recovery token already active", 400);
    }

    recovery_last_used = today;
    coins -= item.price;
  }

  const [result] = await db.query(
        `
          UPDATE stats
          SET hp = ?, coins = ?, total_xp = ?, xp = ?, level = ?, player_rank = ?, recovery_last_used = ?
          WHERE stats_id = ?
        `,
    [hp, coins, total_xp, newXp, level, rank, recovery_last_used, stats.stats_id]
  );

  if ((result.affectedRows === 0)) throwErr("Not changed", 500);

  return stats;
};

import db from "../../db/mysqlConfig.js";

const getAllHuntersModel = async (limit, offset, username, filter = "total_xp") => {
    const allowedFilters = ["total_xp", "level", "streak"];

    if (!allowedFilters.includes(filter)) {
        throw new Error("Invalid filter");
    }
    
    const hunters = await db.query(`
        SELECT 
            u.user_id AS user_id,
            u.fullname AS fullname,
            u.username AS username,
            u.avatar AS avatar,
            u.created_at AS created_at,
            s.level AS level,
            s.player_rank AS player_rank,
            s.total_xp AS total_xp,
            s.streak AS streak,
            s.highest_streak AS highest_streak,
            s.hp AS hp,
            s.coins AS coins
        FROM users AS u
        JOIN stats AS s
        ON u.user_id = s.user_id 
        WHERE u.username LIKE ?
        ORDER BY ${filter} DESC
        LIMIT ? OFFSET ?
    `, [`%${username}%`, +limit, +offset]);

    return hunters[0];
}

const getTotalHuntersModel = async () => {
    const totalHunters = await db.query(`SELECT COUNT(1) AS count FROM users`);

    return totalHunters[0];
}

export {
    getAllHuntersModel,
    getTotalHuntersModel
}
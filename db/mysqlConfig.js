import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";
import fs from "fs";

const isProduction = process.env === "production";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(isProduction && {
    ssl: {
      ca: fs.readFileSync(process.env.DB_SSL_CA_PATH),
    },
  }),
});

const connection = await pool.getConnection();

async function setupTables() {
  try {
    // Users
    await connection.query(`CREATE TABLE IF NOT EXISTS users (
          user_id INT PRIMARY KEY AUTO_INCREMENT,
          email VARCHAR(254) NOT NULL UNIQUE,
          username VARCHAR(255) NOT NULL UNIQUE,
          fullname VARCHAR(150) NOT NULL,
          password VARCHAR(255) NOT NULL,
          timezone VARCHAR(60),
          role ENUM('user', 'admin') DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
   `);

    // Stats
    await connection.query(`
        CREATE TABLE IF NOT EXISTS stats (
          stats_id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          xp INT DEFAULT 0 NOT NULL,
          total_xp INT DEFAULT 0 NOT NULL,
          level INT DEFAULT 1,
          player_rank VARCHAR(1) DEFAULT 'E',
          title VARCHAR(50) DEFAULT 'player',
          hp INT DEFAULT 5,
          streak INT DEFAULT 0,
          highest_streak INT DEFAULT 0,
          coins INT DEFAULT 0,
          last_completed DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id),
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
      `);

    // Reviews
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id INT PRIMARY KEY auto_increment,
        user_id INT NOT NULL,
        message TEXT,
        is_replied BOOL DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        foreign key(user_id) REFERENCES users(user_id)
      );
    `);

    // Quests
    await connection.query(`
        CREATE TABLE IF NOT EXISTS quests (
          quest_id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          type ENUM('main', 'side', 'custom') NOT NULL DEFAULT 'main',
          base_amount FLOAT NOT NULL DEFAULT 10,
          increment FLOAT NOT NULL DEFAULT 2,
          xp_gain INT NOT NULL DEFAULT 30,
          unit VARCHAR(10),
          reps INT,
          coins INT DEFAULT 0
        );
      `);

    // User_Quests
    await connection.query(`
        CREATE TABLE IF NOT EXISTS user_quests (
          user_quest_id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          quest_id INT NOT NULL,
          is_completed BOOLEAN DEFAULT FALSE,
          total_reps FLOAT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id),
          FOREIGN KEY (quest_id) REFERENCES quests(quest_id)
        );

      `);

    // Items Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS items (
      item_id INT PRIMARY KEY AUTO_INCREMENT,
      item_name VARCHAR(54) NOT NULL,
      item_description VARCHAR(150),
      price INT NOT NULL,
      increment INT NOT NULL,
      currency ENUM('G', 'USD') DEFAULT 'G',
      type ENUM('hp','xp', 'rank', 'coins'),
      imgUrl VARCHAR(154)
    )
    `);

  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    connection.release();
  }
}

// setupTables();

export default pool;
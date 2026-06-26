export const TITLES = [
  // =========================
  // LEVEL TITLES
  // =========================
  {
    id: "player",
    name: "Player",
    type: "default",
    requirement: 1,
    rarity: "normal",
  },
  {
    id: "hunter",
    name: "Hunter",
    type: "level",
    requirement: 5,
    rarity: "normal",
  },
  {
    id: "awakened",
    name: "Awakened",
    type: "level",
    requirement: 10,
    rarity: "normal",
  },
  {
    id: "beast_slayer",
    name: "Beast Slayer",
    type: "level",
    requirement: 18,
    rarity: "rare",
  },
  {
    id: "hollow",
    name: "Hollow",
    type: "level",
    requirement: 25,
    rarity: "rare",
  },
  {
    id: "elite_hunter",
    name: "Elite Hunter",
    type: "level",
    requirement: 35,
    rarity: "epic",
  },
  {
    id: "necromancer",
    name: "Necromancer",
    type: "level",
    requirement: 45,
    rarity: "epic",
  },
  {
    id: "the_ghost",
    name: "The Ghost",
    type: "level",
    requirement: 60,
    rarity: "legendary",
  },

  // =========================
  // ACHIEVEMENT TITLES
  // =========================
  {
    id: "wolf_slayer",
    name: "Wolf Slayer",
    type: "event",
    requirement: 30,
    rarity: "rare",
  },
  {
    id: "rising_slayer",
    name: "Rising Slayer",
    type: "streak",
    requirement: 30,
    rarity: "rare",
  },
  {
    id: "knight",
    name: "Knight",
    type: "leaderboard",
    requirement: 15,
    rarity: "rare",
  },
  {
    id: "elite_knight",
    name: "Elite Knight",
    type: "leaderboard",
    requirement: 10,
    rarity: "epic",
  },
  {
    id: "assassin",
    name: "Assassin",
    type: "leaderboard",
    requirement: 3,
    rarity: "legendary",
  },

  // =========================
  // SPECIAL TITLES
  // =========================
  {
    id: "hunter_x",
    name: "Hunter X",
    type: "special",
    description: "First 2 hunters to reach S-rank",
    rarity: "mythic",
  },
];


// | Level | Title |
// |-------|-------|
// | 1     | Player |
// | 5     | Hunter |
// | 10    | Dark Hunter |
// | 18    | Beast Slayer |
// | 25    | Shadow Reaper |
// | 35    | Elite Hunter |
// | 45    | Phantom Blade |
// | 60    | The Ghost |

// | Title                  | Condition |
// |-------                 |-----------|
// | Wolf Slayer            | 30 event quests
// | Rising Slayer          | Maintain a 30-day streak |
// | Knight                 | Top 15 |
// | General Knight         | Top 10 |
// | Assassin               | Top 3 |
// | Knight Commander       | Special Get S Rank + maintain top 10 for 10 days |
// | Hunter X               | First 2 hunters to reach S-rank |
// | Silent Knight          | Some |
// | shadow_monarch: {
    //     id: "shadow_monarch",
    //     name: "Shadow Monarch",
    //     type: "level",
    //     requirement: {
    //         level: 80
    //     },
    //     rarity: "mythic"
    // },          | Some |


// {
//     id: "knight_commander",
//     name: "Knight Commander",
//     type: "special",
//     requirement: {
//         rank: "S",
//         maintainTopRank: 10,
//         maintainDays: 10
//     },
//     rarity: "mythic"
// },

// Other possible Mythic abilities
// Shadow Monarch

// Authority: Resurrection

// Once every 30 days, restore a dead streak (HP = 0) for one hunter.
// Requires admin approval.
// Absolute Being

// Authority: Blessing

// Grant a temporary +10% XP bonus to a hunter for 24 hours.
// Demon King

// Authority: Challenge

// Create a special Gate with increased rewards for all users.
// Architect

// Authority: Creation

// Design a custom title, event, or quest theme which you can review and publish.
// System Overseer

// Authority: Recommendation

// Suggest balance changes, rewards, or events that appear in an admin review panel.
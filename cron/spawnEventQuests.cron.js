import cron from 'node-cron';
import { spawnEventQuests } from '../models/quests.model.js';

// Runs at mid night
cron.schedule("0 0 * * *", async () => {
  try {
    await spawnEventQuests();
  } catch (error) {
    console.log(error);
  }
});

// Runs at noon
cron.schedule("0 12 * * *", async () => {
  try {
    await spawnEventQuests();
  } catch (error) {
    console.log(error);
  }
});
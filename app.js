import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// Routes
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import questsRoutes from './routes/quest.routes.js';
import shopRoutes from './routes/shop.routes.js';
import hunterRoutes from './routes/admin/hunters.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import adminQuestsRoutes from './routes/admin/quests.routes.js';
import adminReviewRoutes from './routes/admin/review.routes.js';
import adminNotificationsRoutes from './routes/admin/notifications.routes.js';
// Middlewares
import { authMiddleware } from "./middlewares/auth.middleware.js";
import { adminMiddleware } from './middlewares/admin.middle.js';
// Cron
import './cron/assignDailyQuests.cron.js'
import './cron/spawnEventQuests.cron.js'
import './cron/cleanup.cron.js'

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://sololevelx.vercel.app",
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/images', express.static('images'))

app.get('/', (req, res) => res.send('API is running'));

app.use('/auth', authRoutes);
app.use('/profile', authMiddleware, profileRoutes);
app.use('/quests', authMiddleware, questsRoutes);
app.use('/shop', authMiddleware, shopRoutes);
app.use('/notifications', authMiddleware, notificationsRoutes);
app.use('/settings', authMiddleware, settingsRoutes);

app.use('/admin/hunters', authMiddleware, adminMiddleware, hunterRoutes);
app.use('/admin/quests', authMiddleware, adminMiddleware, adminQuestsRoutes);
app.use('/admin/reviews', authMiddleware, adminMiddleware, adminReviewRoutes);
app.use('/admin/notifications', authMiddleware, adminMiddleware, adminNotificationsRoutes);

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
})
import { Router } from "express";
import { getUserProfileController, updateUserProfileController, getGlobalRankingController, resetUserProfileController, addReviewController, changeAvatarController, changeTitleController, fetchUnlockedTitlesController    } from "../controllers/profile.controller.js";

const router = Router();

router.get('/', getUserProfileController);
router.get('/ranking', getGlobalRankingController);
router.get('/unlocked-titles', fetchUnlockedTitlesController);
router.put('/update', updateUserProfileController);
router.put('/reset', resetUserProfileController);
router.post('/add-review', addReviewController);
router.post('/change-avatar/:id', changeAvatarController);
router.post('/change-title/:id', changeTitleController);

export default router;
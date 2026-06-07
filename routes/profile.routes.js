import { Router } from "express";
import { getUserProfileController, updateUserProfileController, getGlobalRankingController, resetUserProfileController, addReviewController, changeAvatarController } from "../controllers/profile.controller.js";

const router = Router();

router.get('/', getUserProfileController);
router.get('/ranking', getGlobalRankingController);
router.put('/update', updateUserProfileController);
router.put('/reset', resetUserProfileController);
router.post('/add-review', addReviewController);
router.post('/change-avatar/:id', changeAvatarController);

export default router;
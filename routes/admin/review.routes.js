import express from 'express';
import { fetchReviewsController, deleteReviewController, replyReviewController } from '../../controllers/admin/reviews.controller.js';

const router = express.Router();

router.get("/", fetchReviewsController);
router.delete("/:id", deleteReviewController);
router.post("/reply/", replyReviewController);

export default router;
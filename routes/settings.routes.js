import { Router } from "express";
import { updateNameController, updateUsernameController } from '../controllers/settings.controller.js';

const router = Router();

router.patch('/name', updateNameController);
router.patch('/username', updateUsernameController);

export default router;
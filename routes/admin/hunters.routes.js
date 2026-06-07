import { Router } from "express";
import { getAllHuntersController, getTotalHuntersController } from "../../controllers/admin/hunters.controller.js";

const router = Router();

router.get("/count", getTotalHuntersController);
router.get("/:filter", getAllHuntersController);

export default router;
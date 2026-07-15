import { Router } from "express";
import { listAllowances, saveAllowances } from "../controllers/allowanceController.js";

const router = Router();

router.get("/:employeeId", listAllowances);
router.post("/:employeeId", saveAllowances);

export default router;

import { Router } from "express";
import {
  closeAdvance,
  createAdvance,
  deleteAdvance,
  findEmployeeAdvance,
  listEmployeeAdvances,
  nextAdvanceNo,
  updateAdvance
} from "../controllers/employeeAdvanceController.js";

const router = Router();

router.get("/next-no", nextAdvanceNo);
router.get("/", listEmployeeAdvances);
router.get("/:id", findEmployeeAdvance);
router.post("/", createAdvance);
router.put("/:id", updateAdvance);
router.patch("/:id/close", closeAdvance);
router.delete("/:id", deleteAdvance);

export default router;

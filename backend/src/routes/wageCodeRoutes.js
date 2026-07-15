import { Router } from "express";
import {
  createWageCode,
  deleteWageCode,
  findWageCode,
  listWageCodes,
  updateWageCode
} from "../controllers/wageCodeController.js";

const router = Router();

router.get("/", listWageCodes);
router.get("/:code", findWageCode);
router.post("/", createWageCode);
router.put("/:code", updateWageCode);
router.delete("/:code", deleteWageCode);

export default router;

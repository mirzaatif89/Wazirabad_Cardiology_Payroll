import { Router } from "express";
import {
  activateFiscalYear,
  activeFiscalYear,
  createFiscalYear,
  deleteFiscalYear,
  findFiscalYear,
  listFiscalYears,
  updateFiscalYear
} from "../controllers/fiscalYearController.js";

const router = Router();

router.get("/", listFiscalYears);
router.get("/active", activeFiscalYear);
router.get("/:id", findFiscalYear);
router.post("/", createFiscalYear);
router.put("/:id", updateFiscalYear);
router.delete("/:id", deleteFiscalYear);
router.patch("/:id/active", activateFiscalYear);

export default router;

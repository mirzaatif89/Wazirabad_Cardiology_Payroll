import { Router } from "express";
import {
  applyAnnualIncrementOperation,
  applyFixedAllowanceOperation,
  applyPercentAllowanceOperation,
  previewAnnualIncrementOperation,
  previewFixedAllowanceOperation,
  previewPercentAllowanceOperation
} from "../controllers/mprocessController.js";

const router = Router();

router.post("/percent-allowance/preview", previewPercentAllowanceOperation);
router.post("/percent-allowance/apply", applyPercentAllowanceOperation);
router.post("/fixed-allowance/preview", previewFixedAllowanceOperation);
router.post("/fixed-allowance/apply", applyFixedAllowanceOperation);
router.post("/annual-increment/preview", previewAnnualIncrementOperation);
router.post("/annual-increment/apply", applyAnnualIncrementOperation);

export default router;

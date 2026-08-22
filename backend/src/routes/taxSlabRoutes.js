import { Router } from "express";
import {
  activateTaxPolicy,
  activeTaxPolicy,
  createTaxPolicy,
  createTaxSlab,
  deleteTaxPolicy,
  deleteTaxSlab,
  findTaxPolicy,
  generateStoredTaxDeductions,
  listTaxGenerationHistory,
  listTaxPolicies,
  listTaxSlabs,
  taxGenerationBatchDetails,
  updateTaxPolicy,
  updateTaxSlab
} from "../controllers/taxSlabController.js";

const router = Router();

router.get("/", listTaxPolicies);
router.get("/active", activeTaxPolicy);
router.post("/generate-deductions", generateStoredTaxDeductions);
router.get("/generation-history", listTaxGenerationHistory);
router.get("/generation-history/:batchId", taxGenerationBatchDetails);
router.get("/:id", findTaxPolicy);
router.post("/", createTaxPolicy);
router.put("/:id", updateTaxPolicy);
router.delete("/:id", deleteTaxPolicy);
router.patch("/:id/active", activateTaxPolicy);
router.get("/:policyId/slabs", listTaxSlabs);
router.post("/:policyId/slabs", createTaxSlab);
router.put("/:policyId/slabs/:slabId", updateTaxSlab);
router.delete("/:policyId/slabs/:slabId", deleteTaxSlab);

export default router;

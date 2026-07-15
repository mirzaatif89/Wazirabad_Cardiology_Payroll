import { Router } from "express";
import {
  allowanceProofList,
  inactiveProofList,
  salaryProofList,
  salaryProofList2,
  scaleAuditRegister
} from "../controllers/proofReportController.js";
import {
  activeInactiveComplete,
  activeInactiveMonthwise,
  annualIncomeTaxSchedule,
  designationWiseList,
  exportToExcel,
  payDedSchedule,
  payslipsForMonths,
  postAudit,
  scheduleDefaults
} from "../controllers/reportModuleController.js";

const router = Router();

router.get("/salary-proof-list", salaryProofList);
router.get("/salary-proof-list-2", salaryProofList2);
router.get("/allowance-proof-list", allowanceProofList);
router.get("/inactive-proof-list", inactiveProofList);
router.get("/scale-audit-register", scaleAuditRegister);
router.get("/schedule-defaults", scheduleDefaults);
router.get("/income-tax-schedule", payDedSchedule);
router.get("/payslips-for-months", payslipsForMonths);
router.get("/designation-wise-list", designationWiseList);
router.get("/annual-income-tax-schedule", annualIncomeTaxSchedule);
router.get("/post-audit", postAudit);
router.get("/active-inactive-complete", activeInactiveComplete);
router.get("/active-inactive-monthwise", activeInactiveMonthwise);
router.get("/export-to-excel", exportToExcel);

export default router;

import { Router } from "express";
import {
  bankSummary,
  budgetRequirement,
  currentPayrollPeriod,
  employeeCount,
  getRun,
  grandBankSummary,
  listOfPayment,
  listPayrollRuns,
  nonBankSalary,
  paymentList,
  payslips,
  processPayrollRun,
  reopenRun,
  scaleAuditRegister,
  singlePayslip
} from "../controllers/payrollController.js";

const router = Router();

router.get("/current-period", currentPayrollPeriod);
router.get("/employee-count", employeeCount);
router.post("/process", processPayrollRun);
router.get("/runs", listPayrollRuns);
router.get("/runs/:id", getRun);
router.post("/runs/:id/reopen", reopenRun);
router.get("/bank-summary", bankSummary);
router.get("/non-bank-salary", nonBankSalary);
router.get("/grand-bank-summary", grandBankSummary);
router.get("/payment-list", paymentList);
router.get("/list-of-payment", listOfPayment);
router.get("/scale-audit-register", scaleAuditRegister);
router.get("/budget-requirement", budgetRequirement);
router.get("/payslips", payslips);
router.get("/payslip/:employee_code", singlePayslip);

export default router;

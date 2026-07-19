import {
  countPayrollEmployees,
  getCurrentPayrollPeriod,
  getBankSummary,
  getBudgetRequirement,
  getGrandBankSummary,
  getListOfPayment,
  getPayrollRunById,
  getNonBankSalary,
  getPaymentList,
  getPayrollRuns,
  getPayrollScaleAudit,
  getPayslips,
  getSinglePayslip,
  processPayroll,
  reopenPayrollRun
} from "../models/payrollModel.js";

function filters(req) {
  return {
    deptCode: req.query.dept_code || req.body?.dept_code || "999",
    gazNg: req.query.gaz_ng || req.body?.gaz_ng || "A",
    reportFor: req.query.report_for || req.body?.report_for || "All",
    month: Number(req.query.month || req.body?.payment_month || req.body?.month || 0),
    year: Number(req.query.year || req.body?.payment_year || req.body?.year || 0)
  };
}

function requirePeriod(res, filter) {
  if (!filter.month || !filter.year) {
    res.status(400).json({ success: false, data: null, message: "Month and year are required." });
    return false;
  }
  return true;
}

export async function processPayrollRun(req, res) {
  const filter = filters(req);
  if (!requirePeriod(res, filter)) return;

  try {
    const result = await processPayroll({
      paymentMonth: filter.month,
      paymentYear: filter.year,
      deptCode: filter.deptCode,
      gazNg: filter.gazNg,
      reportFor: filter.reportFor,
      processedBy: req.body?.processed_by || "Hospital Admin"
    });
    if (result.status === "already_processed") {
      return res.status(409).json({ success: false, data: result, message: "Already processed for this period" });
    }
    return res.json({ success: true, data: result, message: "Payroll processed successfully." });
  } catch (error) {
    console.error("Payroll processing failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Payroll processing failed." });
  }
}

export async function currentPayrollPeriod(_req, res) {
  try {
    return res.json({ success: true, data: await getCurrentPayrollPeriod(), message: "Current payroll period loaded." });
  } catch (error) {
    console.error("Current payroll period failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Current payroll period failed." });
  }
}

export async function employeeCount(req, res) {
  try {
    const filter = filters(req);
    const count = await countPayrollEmployees(filter);
    return res.json({ success: true, data: { count }, message: "Employee count loaded." });
  } catch (error) {
    console.error("Payroll employee count failed:", error);
    return res.status(500).json({ success: false, data: { count: 0 }, message: "Payroll employee count failed." });
  }
}

export async function listPayrollRuns(req, res) {
  try {
    const rows = await getPayrollRuns({ month: req.query.month || "", year: req.query.year || "", deptCode: req.query.dept_code || "" });
    return res.json({ success: true, data: rows, message: "Payroll runs loaded." });
  } catch (error) {
    console.error("Payroll runs failed:", error);
    return res.status(500).json({ success: false, data: [], message: "Payroll runs failed." });
  }
}

export async function getRun(req, res) {
  try {
    const run = await getPayrollRunById(req.params.id);
    if (!run) return res.status(404).json({ success: false, data: null, message: "Payroll run not found." });
    return res.json({ success: true, data: run, message: "Payroll run loaded." });
  } catch (error) {
    console.error("Payroll run load failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Payroll run load failed." });
  }
}

export async function reopenRun(req, res) {
  try {
    const result = await reopenPayrollRun(req.params.id);
    if (result === "not_found") return res.status(404).json({ success: false, data: null, message: "Payroll run not found." });
    return res.json({ success: true, data: null, message: "Payroll run reopened." });
  } catch (error) {
    console.error("Payroll reopen failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Payroll reopen failed." });
  }
}

async function sendPeriodReport(req, res, loader, message) {
  const filter = filters(req);
  if (!requirePeriod(res, filter)) return;
  try {
    return res.json({ success: true, data: await loader(filter), message });
  } catch (error) {
    console.error(message, error);
    return res.status(500).json({ success: false, data: null, message });
  }
}

export const bankSummary = (req, res) => sendPeriodReport(req, res, getBankSummary, "Bank summary loaded.");
export const nonBankSalary = (req, res) => sendPeriodReport(req, res, getNonBankSalary, "Non bank salary loaded.");
export const grandBankSummary = (req, res) => sendPeriodReport(req, res, getGrandBankSummary, "Grand bank summary loaded.");
export const paymentList = (req, res) => sendPeriodReport(req, res, getPaymentList, "Payment list loaded.");
export const listOfPayment = (req, res) => sendPeriodReport(req, res, getListOfPayment, "List of payment loaded.");
export const scaleAuditRegister = (req, res) => sendPeriodReport(req, res, getPayrollScaleAudit, "Scale audit register loaded.");
export const payslips = (req, res) => sendPeriodReport(req, res, getPayslips, "Pay slips loaded.");

export async function budgetRequirement(req, res) {
  if (!req.query.ending_date) return res.status(400).json({ success: false, data: null, message: "Ending date is required." });
  try {
    return res.json({ success: true, data: await getBudgetRequirement({ endingDate: req.query.ending_date }), message: "Budget requirement loaded." });
  } catch (error) {
    console.error("Budget requirement failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Budget requirement failed." });
  }
}

export async function singlePayslip(req, res) {
  const month = Number(req.query.month || 0);
  const year = Number(req.query.year || 0);
  if (!month || !year) return res.status(400).json({ success: false, data: null, message: "Month and year are required." });
  try {
    const slip = await getSinglePayslip({ employeeCode: req.params.employee_code, month, year });
    if (!slip) return res.status(404).json({ success: false, data: null, message: "Payroll not processed for this employee/month." });
    return res.json({ success: true, data: slip, message: "Pay slip loaded." });
  } catch (error) {
    console.error("Single payslip failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Single payslip failed." });
  }
}

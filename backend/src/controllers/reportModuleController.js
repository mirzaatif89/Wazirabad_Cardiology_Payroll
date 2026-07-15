import {
  getActiveInactiveComplete,
  getActiveInactiveMonthwise,
  getAnnualIncomeTaxSchedule,
  getDesignationWiseList,
  getExportToExcel,
  getPayDedSchedule,
  getPayslipsForMonths,
  getPostAudit
} from "../models/reportModuleModel.js";
import { env } from "../config/env.js";

function filters(req) {
  return {
    deptCode: req.query.dept_code || "999",
    gazNg: req.query.gaz_ng || "A",
    reportFor: req.query.report_for || "All",
    month: Number(req.query.month || 0),
    year: Number(req.query.year || 0),
    code: req.query.code || "",
    employeeCode: req.query.employee_code || "",
    fromMonth: Number(req.query.from_month || 0),
    toMonth: Number(req.query.to_month || 0),
    fromYear: Number(req.query.from_year || 0),
    toYear: Number(req.query.to_year || 0),
    designationCode: req.query.designation_code || ""
  };
}

async function send(res, loader, args, message) {
  try {
    return res.json({ success: true, data: await loader(args), message });
  } catch (error) {
    console.error(message, error);
    return res.status(500).json({ success: false, data: null, message });
  }
}

export const payDedSchedule = (req, res) => send(res, getPayDedSchedule, filters(req), "Schedule loaded.");
export const payslipsForMonths = (req, res) => send(res, getPayslipsForMonths, filters(req), "Pay slips loaded.");
export const designationWiseList = (req, res) => send(res, getDesignationWiseList, filters(req), "Designation wise list loaded.");
export const annualIncomeTaxSchedule = (req, res) => send(res, getAnnualIncomeTaxSchedule, filters(req), "Annual income tax schedule loaded.");
export const postAudit = (req, res) => send(res, getPostAudit, filters(req), "Post audit loaded.");
export const activeInactiveComplete = (req, res) => send(res, getActiveInactiveComplete, filters(req), "Active inactive complete loaded.");
export const activeInactiveMonthwise = (req, res) => send(res, getActiveInactiveMonthwise, filters(req), "Active inactive monthwise loaded.");
export const exportToExcel = (req, res) => send(res, getExportToExcel, filters(req), "Export data loaded.");
export const scheduleDefaults = (_req, res) => res.json({
  success: true,
  data: env.reportScheduleDefaults,
  message: "Report schedule defaults loaded."
});

import {
  getAllowanceProofList,
  getInactiveProofList,
  getSalaryProofList,
  getSalaryProofListDetailed,
  getScaleAuditRegister
} from "../models/proofReportModel.js";

function reportFilters(req) {
  return {
    deptCode: req.query.dept_code || "999",
    gazNg: req.query.gaz_ng || "A",
    reportFor: req.query.report_for || "All",
    bps: req.query.bps || "",
    month: req.query.month || "",
    year: req.query.year || ""
  };
}

async function sendReport(res, loader, filters, message) {
  try {
    return res.json({ success: true, data: await loader(filters), message });
  } catch (error) {
    console.error(message, error);
    return res.status(500).json({ success: false, data: null, message });
  }
}

export async function salaryProofList(req, res) {
  return sendReport(res, getSalaryProofList, reportFilters(req), "Salary proof list loaded.");
}

export async function salaryProofList2(req, res) {
  return sendReport(res, getSalaryProofListDetailed, reportFilters(req), "Salary proof list 2 loaded.");
}

export async function allowanceProofList(req, res) {
  return sendReport(res, getAllowanceProofList, reportFilters(req), "Allowance proof list loaded.");
}

export async function inactiveProofList(req, res) {
  return sendReport(res, getInactiveProofList, reportFilters(req), "Inactive proof list loaded.");
}

export async function scaleAuditRegister(req, res) {
  return sendReport(res, getScaleAuditRegister, reportFilters(req), "Scale audit register loaded.");
}

import {
  createArrearBill,
  deleteArrearBillById,
  employeeExists,
  finalizeArrearBillById,
  getArrearBillById,
  getArrearBillReport,
  getArrearBills,
  getNextDocumentNo,
  reopenArrearBillById,
  getWageCodeMap,
  normalizeArrearItems,
  updateArrearBillById,
  updateArrearBillStatusById,
  validateArrearPayload
} from "../models/arrearBillModel.js";
import { logAuditAction } from "../models/auditLogModel.js";

async function validateBusinessRules(payload) {
  const items = normalizeArrearItems(payload.items);
  const basicValidation = validateArrearPayload(payload, items);

  if (basicValidation) {
    return basicValidation;
  }

  const employee = await employeeExists(payload.employeeCode);

  if (!employee) {
    return "Employee code not found.";
  }

  const uniqueWageCodes = Array.from(new Set(items.map((item) => item.accountCode)));
  const wageCodeMap = await getWageCodeMap(uniqueWageCodes);
  const missingWageCode = uniqueWageCodes.find((code) => !wageCodeMap.has(code));

  if (missingWageCode) {
    return `Wage code ${missingWageCode} does not exist.`;
  }

  return "";
}

export async function nextDocumentNo(_req, res) {
  try {
    return res.json({
      success: true,
      data: { documentNo: await getNextDocumentNo() },
      message: "Next document number loaded."
    });
  } catch (error) {
    console.error("Next arrear document number failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Next document number failed." });
  }
}

export async function listArrearBills(req, res) {
  try {
    const bills = await getArrearBills({
      employeeCode: req.query.employee_code || "",
      documentNo: req.query.document_no || "",
      dateFrom: req.query.date_from || "",
      dateTo: req.query.date_to || "",
      status: req.query.status || ""
    });

    return res.json({ success: true, data: bills, message: "Arrear bills loaded." });
  } catch (error) {
    console.error("Arrear bill list failed:", error);
    return res.status(500).json({ success: false, data: [], message: "Arrear bill list failed." });
  }
}

export async function findArrearBill(req, res) {
  try {
    const bill = await getArrearBillById(req.params.id);

    if (!bill) {
      return res.status(404).json({ success: false, data: null, message: "Arrear bill not found." });
    }

    return res.json({ success: true, data: bill, message: "Arrear bill loaded." });
  } catch (error) {
    console.error("Arrear bill lookup failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Arrear bill lookup failed." });
  }
}

export async function arrearBillReport(req, res) {
  const fromDate = req.query.from_date || "";
  const toDate = req.query.to_date || "";
  const sortBy = req.query.sort_by || "doc_no";

  if (!fromDate || !toDate) {
    return res.status(400).json({
      success: false,
      data: [],
      grand_total: 0,
      message: "From date and to date are required."
    });
  }

  if (!["doc_no", "employee_code"].includes(sortBy)) {
    return res.status(400).json({
      success: false,
      data: [],
      grand_total: 0,
      message: "Invalid sort option."
    });
  }

  try {
    const report = await getArrearBillReport({
      employeeCode: req.query.employee_code || "",
      fromDate,
      toDate,
      sortBy,
      status: req.query.status || ""
    });

    return res.json({
      success: true,
      data: report.bills,
      grand_total: report.grandTotal,
      message: "Arrear bill report loaded."
    });
  } catch (error) {
    console.error("Arrear bill report failed:", error);
    return res.status(500).json({
      success: false,
      data: [],
      grand_total: 0,
      message: "Arrear bill report failed."
    });
  }
}

export async function createBill(req, res) {
  const validationMessage = await validateBusinessRules(req.body);

  if (validationMessage) {
    return res.status(400).json({ success: false, data: null, message: validationMessage });
  }

  try {
    const bill = await createArrearBill(req.body);
    return res.status(201).json({ success: true, data: bill, message: "Arrear bill saved successfully." });
  } catch (error) {
    console.error("Arrear bill save failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Arrear bill save failed." });
  }
}

export async function updateBill(req, res) {
  const validationMessage = await validateBusinessRules(req.body);

  if (validationMessage) {
    return res.status(400).json({ success: false, data: null, message: validationMessage });
  }

  try {
    const result = await updateArrearBillById(req.params.id, req.body);

    if (result.status === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Arrear bill not found." });
    }

    if (result.status === "locked") {
      return res.status(409).json({ success: false, data: null, message: "Only draft arrear bills can be edited." });
    }

    return res.json({ success: true, data: result.bill, message: "Arrear bill updated successfully." });
  } catch (error) {
    console.error("Arrear bill update failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Arrear bill update failed." });
  }
}

export async function deleteBill(req, res) {
  try {
    const result = await deleteArrearBillById(req.params.id);

    if (result === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Arrear bill not found." });
    }

    if (result === "finalized") {
      return res.status(409).json({
        success: false,
        data: null,
        message: "Finalized arrear bills cannot be deleted. Cancel the bill instead."
      });
    }

    return res.json({ success: true, data: null, message: "Arrear bill deleted successfully." });
  } catch (error) {
    console.error("Arrear bill delete failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Arrear bill delete failed." });
  }
}

export async function finalizeBill(req, res) {
  try {
    const result = await finalizeArrearBillById(req.params.id);

    if (result === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Arrear bill not found." });
    }

    if (result === "locked") {
      return res.status(409).json({ success: false, data: null, message: "Only draft arrear bills can be finalized." });
    }

    return res.json({
      success: true,
      data: await getArrearBillById(req.params.id),
      message: "Arrear bill finalized successfully."
    });
  } catch (error) {
    console.error("Arrear bill finalize failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Arrear bill finalize failed." });
  }
}

export async function reopenBill(req, res) {
  try {
    const result = await reopenArrearBillById(req.params.id);

    if (result.status === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Arrear bill not found." });
    }

    if (result.status === "not_finalized") {
      return res.status(409).json({ success: false, data: null, message: "Only finalized arrear bills can be reopened." });
    }

    await logAuditAction({
      action: "reopen",
      documentType: "arrear",
      documentNo: result.documentNo,
      performedBy: req.body?.performedBy || "Hospital Admin",
      notes: "Reopened finalized arrear bill for correction."
    });

    return res.json({ success: true, data: result.bill, message: "Arrear bill reopened for correction." });
  } catch (error) {
    console.error("Arrear bill reopen failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Arrear bill reopen failed." });
  }
}

export async function updateBillStatus(req, res) {
  try {
    const result = await updateArrearBillStatusById(req.params.id, req.body?.status);

    if (result.status === "invalid") {
      return res.status(400).json({ success: false, data: null, message: "Status must be draft, finalized, or cancelled." });
    }

    if (result.status === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Arrear bill not found." });
    }

    await logAuditAction({
      action: "status_update",
      documentType: "arrear",
      documentNo: result.documentNo,
      performedBy: req.body?.performedBy || "Hospital Admin",
      notes: `Arrear bill status changed from ${result.previousStatus} to ${req.body.status}.`
    });

    return res.json({ success: true, data: result.bill, message: "Arrear bill status updated successfully." });
  } catch (error) {
    console.error("Arrear bill status update failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Arrear bill status update failed." });
  }
}

import {
  closeEmployeeAdvanceById,
  createEmployeeAdvance,
  deleteEmployeeAdvanceById,
  getEmployeeAdvanceById,
  getEmployeeAdvances,
  getNextEmployeeAdvanceNo,
  updateEmployeeAdvanceById
} from "../models/employeeAdvanceModel.js";

function normalizePayload(body) {
  return {
    employeeCode: body?.employeeCode || body?.employee_code || "",
    issueDate: body?.issueDate || body?.issue_date || "",
    advanceAmount: body?.advanceAmount || body?.advance_amount || 0,
    monthlyInstallment: body?.monthlyInstallment || body?.monthly_installment || 0,
    deductionMode: body?.deductionMode || body?.deduction_mode || "full",
    deductionValue: body?.deductionValue || body?.deduction_value || "",
    balanceAmount: body?.balanceAmount || body?.balance_amount || "",
    status: body?.status || "active",
    notes: body?.notes || "",
    createdBy: body?.createdBy || body?.created_by || "Hospital Admin",
    updatedBy: body?.updatedBy || body?.updated_by || "Hospital Admin"
  };
}

export async function nextAdvanceNo(_req, res) {
  try {
    return res.json({ success: true, data: { advanceNo: await getNextEmployeeAdvanceNo() }, message: "Next advance number loaded." });
  } catch (error) {
    console.error("Next advance number failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Next advance number failed." });
  }
}

export async function listEmployeeAdvances(req, res) {
  try {
    const rows = await getEmployeeAdvances({
      employeeCode: req.query.employee_code || req.query.employeeCode || "",
      status: req.query.status || ""
    });
    return res.json({ success: true, data: rows, message: "Employee advances loaded." });
  } catch (error) {
    console.error("Employee advances load failed:", error);
    return res.status(500).json({ success: false, data: [], message: "Employee advances load failed." });
  }
}

export async function findEmployeeAdvance(req, res) {
  try {
    const row = await getEmployeeAdvanceById(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, data: null, message: "Employee advance not found." });
    }
    return res.json({ success: true, data: row, message: "Employee advance loaded." });
  } catch (error) {
    console.error("Employee advance load failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Employee advance load failed." });
  }
}

export async function createAdvance(req, res) {
  const payload = normalizePayload(req.body);
  if (!payload.employeeCode) {
    return res.status(400).json({ success: false, data: null, message: "Employee is required." });
  }

  if (!payload.issueDate) {
    return res.status(400).json({ success: false, data: null, message: "Issue date is required." });
  }

  if (Number(payload.advanceAmount) <= 0) {
    return res.status(400).json({ success: false, data: null, message: "Advance amount must be greater than 0." });
  }

  try {
    const id = await createEmployeeAdvance(payload);
    return res.status(201).json({ success: true, data: await getEmployeeAdvanceById(id), message: "Employee advance saved successfully." });
  } catch (error) {
    console.error("Employee advance save failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Employee advance save failed." });
  }
}

export async function updateAdvance(req, res) {
  const payload = normalizePayload(req.body);
  if (!payload.employeeCode) {
    return res.status(400).json({ success: false, data: null, message: "Employee is required." });
  }

  if (!payload.issueDate) {
    return res.status(400).json({ success: false, data: null, message: "Issue date is required." });
  }

  try {
    const affected = await updateEmployeeAdvanceById(req.params.id, payload);
    if (!affected) {
      return res.status(404).json({ success: false, data: null, message: "Employee advance not found." });
    }
    return res.json({ success: true, data: await getEmployeeAdvanceById(req.params.id), message: "Employee advance updated successfully." });
  } catch (error) {
    console.error("Employee advance update failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Employee advance update failed." });
  }
}

export async function closeAdvance(req, res) {
  try {
    const affected = await closeEmployeeAdvanceById(req.params.id, req.body?.closed_by || req.body?.closedBy || "Hospital Admin");
    if (!affected) {
      return res.status(404).json({ success: false, data: null, message: "Employee advance not found." });
    }
    return res.json({ success: true, data: await getEmployeeAdvanceById(req.params.id), message: "Employee advance closed successfully." });
  } catch (error) {
    console.error("Employee advance close failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Employee advance close failed." });
  }
}

export async function deleteAdvance(req, res) {
  try {
    const affected = await deleteEmployeeAdvanceById(req.params.id);
    if (!affected) {
      return res.status(404).json({ success: false, data: null, message: "Employee advance not found." });
    }
    return res.json({ success: true, data: null, message: "Employee advance deleted successfully." });
  } catch (error) {
    console.error("Employee advance delete failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Employee advance delete failed." });
  }
}

import {
  getActiveAllowanceTotal,
  getEmployeeAllowances,
  replaceEmployeeAllowances
} from "../models/allowanceModel.js";

export async function listAllowances(req, res) {
  try {
    const allowances = await getEmployeeAllowances(req.params.employeeId);
    const activeAllowanceTotal = await getActiveAllowanceTotal(req.params.employeeId);
    return res.json({ allowances, activeAllowanceTotal });
  } catch (error) {
    console.error("Allowance list failed:", error);
    return res.status(500).json({ message: "Allowance list failed." });
  }
}

export async function saveAllowances(req, res) {
  const allowances = Array.isArray(req.body.allowances) ? req.body.allowances : [];
  const employeeId = Number(req.params.employeeId || 0);

  if (!employeeId) {
    return res.status(400).json({ message: "Select an employee before saving allowances." });
  }

  try {
    const savedRows = await replaceEmployeeAllowances(employeeId, allowances);
    return res.json({
      message: "Allowances saved successfully.",
      savedRows
    });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "Selected employee was not found." });
    }
    console.error("Allowance save failed:", error);
    return res.status(500).json({ message: "Allowance save failed." });
  }
}

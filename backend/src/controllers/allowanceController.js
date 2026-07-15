import { getEmployeeAllowances, replaceEmployeeAllowances } from "../models/allowanceModel.js";

export async function listAllowances(req, res) {
  try {
    const allowances = await getEmployeeAllowances(req.params.employeeId);
    return res.json({ allowances });
  } catch (error) {
    console.error("Allowance list failed:", error);
    return res.status(500).json({ message: "Allowance list failed." });
  }
}

export async function saveAllowances(req, res) {
  const allowances = Array.isArray(req.body.allowances) ? req.body.allowances : [];

  try {
    const savedRows = await replaceEmployeeAllowances(req.params.employeeId, allowances);
    return res.json({
      message: "Allowances saved successfully.",
      savedRows
    });
  } catch (error) {
    console.error("Allowance save failed:", error);
    return res.status(500).json({ message: "Allowance save failed." });
  }
}

import { pool } from "../config/database.js";
import { verifyAdminPassword } from "../models/authModel.js";

const RESET_TABLES = [
  "payroll_run_item_details",
  "payroll_run_items",
  "payroll_runs",
  "budget_transaction_items",
  "budget_transactions",
  "arrear_bill_items",
  "arrear_bills",
  "special_pay_entries",
  "cheque_prints",
  "employee_allowances",
  "employee_scale_history",
  "employee_status_history",
  "employees",
  "audit_log"
];

async function tableExists(tableName) {
  const [rows] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
  return rows.length > 0;
}

export async function resetData(req, res) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Admin password is required." });
  }

  const admin = await verifyAdminPassword("admin", password);

  if (!admin) {
    return res.status(401).json({ message: "Invalid admin password." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const tableName of RESET_TABLES) {
      if (await tableExists(tableName)) {
        await connection.query(`DELETE FROM ${tableName}`);
      }
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    await connection.commit();

    return res.json({ message: "Software data reset successfully." });
  } catch (error) {
    await connection.rollback();
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.error("Reset data failed:", error);
    return res.status(500).json({ message: "Reset data failed." });
  } finally {
    connection.release();
  }
}

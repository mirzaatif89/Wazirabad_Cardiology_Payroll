import { pool } from "../config/database.js";

export async function ensureAllowancesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_allowances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      sr_no INT NOT NULL,
      allowance_code VARCHAR(50) NOT NULL,
      description VARCHAR(255),
      amount DECIMAL(12, 2) DEFAULT 0,
      upto DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_employee_allowances_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id)
        ON DELETE CASCADE
    )
  `);
}

export async function replaceEmployeeAllowances(employeeId, allowances) {
  const toNull = (value) => (value === "" || value === undefined ? null : value);

  await pool.query("DELETE FROM employee_allowances WHERE employee_id = ?", [employeeId]);

  const cleanRows = allowances.filter((row) => row.allowanceCode || row.description || row.amount);

  if (!cleanRows.length) {
    return 0;
  }

  const values = cleanRows.map((row, index) => [
    employeeId,
    row.srNo || index + 1,
    row.allowanceCode || "0000",
    toNull(row.description),
    Number(row.amount || 0),
    toNull(row.upto)
  ]);

  const [result] = await pool.query(
    `
      INSERT INTO employee_allowances (
        employee_id,
        sr_no,
        allowance_code,
        description,
        amount,
        upto
      ) VALUES ?
    `,
    [values]
  );

  return result.affectedRows;
}

export async function getEmployeeAllowances(employeeId) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        sr_no AS srNo,
        allowance_code AS allowanceCode,
        description,
        amount,
        DATE_FORMAT(upto, '%Y-%m-%d') AS upto
      FROM employee_allowances
      WHERE employee_id = ?
      ORDER BY sr_no ASC
    `,
    [employeeId]
  );

  return rows;
}

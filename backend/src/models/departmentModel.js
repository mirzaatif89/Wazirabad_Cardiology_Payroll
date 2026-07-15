import { pool } from "../config/database.js";

const toNull = (value) => (value === "" || value === undefined ? null : value);

export async function ensureDepartmentsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS department_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      department VARCHAR(150) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

export async function getDepartments() {
  const [rows] = await pool.query(`
    SELECT
      id,
      code,
      department,
      created_at AS createdAt
    FROM department_codes
    ORDER BY department ASC, code ASC
  `);

  return rows;
}

export async function getDepartmentByCode(code) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        code,
        department,
        created_at AS createdAt
      FROM department_codes
      WHERE code = ?
      LIMIT 1
    `,
    [code]
  );

  return rows[0] || null;
}

export async function insertDepartment(department) {
  const [result] = await pool.query(
    `
      INSERT INTO department_codes (code, department)
      VALUES (?, ?)
    `,
    [department.code, department.department]
  );

  return result.insertId;
}

export async function updateDepartmentById(id, department) {
  const [result] = await pool.query(
    `
      UPDATE department_codes
      SET code = ?, department = ?
      WHERE id = ?
    `,
    [department.code, department.department, id]
  );

  return result.affectedRows;
}

export async function deleteDepartmentById(id) {
  const [result] = await pool.query("DELETE FROM department_codes WHERE id = ?", [id]);
  return result.affectedRows;
}

export function normalizeDepartmentPayload(payload) {
  return {
    code: String(toNull(payload.code) || "").trim(),
    department: String(toNull(payload.department) || "").trim()
  };
}

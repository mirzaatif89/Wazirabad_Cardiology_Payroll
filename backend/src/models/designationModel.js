import { pool } from "../config/database.js";

const toNull = (value) => (value === "" || value === undefined ? null : value);

export async function ensureDesignationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS designation_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      designation VARCHAR(150) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

export async function getDesignations() {
  const [rows] = await pool.query(`
    SELECT
      id,
      code,
      designation,
      created_at AS createdAt
    FROM designation_codes
    ORDER BY designation ASC, code ASC
  `);

  return rows;
}

export async function getDesignationByCode(code) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        code,
        designation,
        created_at AS createdAt
      FROM designation_codes
      WHERE code = ?
      LIMIT 1
    `,
    [code]
  );

  return rows[0] || null;
}

export async function insertDesignation(designation) {
  const [result] = await pool.query(
    `
      INSERT INTO designation_codes (code, designation)
      VALUES (?, ?)
    `,
    [designation.code, designation.designation]
  );

  return result.insertId;
}

export async function updateDesignationById(id, designation) {
  const [result] = await pool.query(
    `
      UPDATE designation_codes
      SET code = ?, designation = ?
      WHERE id = ?
    `,
    [designation.code, designation.designation, id]
  );

  return result.affectedRows;
}

export async function deleteDesignationById(id) {
  const [result] = await pool.query("DELETE FROM designation_codes WHERE id = ?", [id]);
  return result.affectedRows;
}

export function normalizeDesignationPayload(payload) {
  return {
    code: String(toNull(payload.code) || "").trim(),
    designation: String(toNull(payload.designation) || "").trim()
  };
}

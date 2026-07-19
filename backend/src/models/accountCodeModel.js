import { pool } from "../config/database.js";
import { DEFAULT_ACCOUNT_CODES } from "./defaultAccountCodes.js";

const toNull = (value) => (value === "" || value === undefined ? null : value);

export async function ensureAccountCodesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS account_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      designation VARCHAR(150) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  if (DEFAULT_ACCOUNT_CODES.length) {
    await pool.query(
      `
        INSERT INTO account_codes (code, designation)
        VALUES ${DEFAULT_ACCOUNT_CODES.map(() => "(?, ?)").join(", ")}
        ON DUPLICATE KEY UPDATE designation = VALUES(designation)
      `,
      DEFAULT_ACCOUNT_CODES.flatMap((account) => [account.code, account.name])
    );
  }
}

export async function getAccountCodes() {
  const [rows] = await pool.query(`
    SELECT id, code, designation, created_at AS createdAt
    FROM account_codes
    ORDER BY designation ASC, code ASC
  `);

  return rows;
}

export async function insertAccountCode(accountCode) {
  const [result] = await pool.query(
    "INSERT INTO account_codes (code, designation) VALUES (?, ?)",
    [accountCode.code, accountCode.designation]
  );

  return result.insertId;
}

export async function updateAccountCodeById(id, accountCode) {
  const [result] = await pool.query(
    "UPDATE account_codes SET code = ?, designation = ? WHERE id = ?",
    [accountCode.code, accountCode.designation, id]
  );

  return result.affectedRows;
}

export async function deleteAccountCodeById(id) {
  const [result] = await pool.query("DELETE FROM account_codes WHERE id = ?", [id]);
  return result.affectedRows;
}

export function normalizeAccountCodePayload(payload) {
  return {
    code: String(toNull(payload.code) || "").trim(),
    designation: String(toNull(payload.designation) || "").trim()
  };
}

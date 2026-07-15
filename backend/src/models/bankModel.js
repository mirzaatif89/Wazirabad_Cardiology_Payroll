import { pool } from "../config/database.js";

const toNull = (value) => (value === "" || value === undefined ? null : value);

export async function ensureBankTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      bank VARCHAR(150) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_branch_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      branch VARCHAR(150) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

export async function getBanks() {
  const [rows] = await pool.query(`
    SELECT id, code, bank, created_at AS createdAt
    FROM bank_codes
    ORDER BY bank ASC, code ASC
  `);
  return rows;
}

export async function insertBank(bank) {
  const [result] = await pool.query(
    "INSERT INTO bank_codes (code, bank) VALUES (?, ?)",
    [bank.code, bank.bank]
  );
  return result.insertId;
}

export async function updateBankById(id, bank) {
  const [result] = await pool.query(
    "UPDATE bank_codes SET code = ?, bank = ? WHERE id = ?",
    [bank.code, bank.bank, id]
  );
  return result.affectedRows;
}

export async function deleteBankById(id) {
  const [result] = await pool.query("DELETE FROM bank_codes WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function getBankBranches() {
  const [rows] = await pool.query(`
    SELECT id, code, branch, created_at AS createdAt
    FROM bank_branch_codes
    ORDER BY branch ASC, code ASC
  `);
  return rows;
}

export async function insertBankBranch(branch) {
  const [result] = await pool.query(
    "INSERT INTO bank_branch_codes (code, branch) VALUES (?, ?)",
    [branch.code, branch.branch]
  );
  return result.insertId;
}

export async function updateBankBranchById(id, branch) {
  const [result] = await pool.query(
    "UPDATE bank_branch_codes SET code = ?, branch = ? WHERE id = ?",
    [branch.code, branch.branch, id]
  );
  return result.affectedRows;
}

export async function deleteBankBranchById(id) {
  const [result] = await pool.query("DELETE FROM bank_branch_codes WHERE id = ?", [id]);
  return result.affectedRows;
}

export function normalizeBankPayload(payload) {
  return {
    code: String(toNull(payload.code) || "").trim(),
    bank: String(toNull(payload.bank) || "").trim()
  };
}

export function normalizeBankBranchPayload(payload) {
  return {
    code: String(toNull(payload.code) || "").trim(),
    branch: String(toNull(payload.branch) || "").trim()
  };
}

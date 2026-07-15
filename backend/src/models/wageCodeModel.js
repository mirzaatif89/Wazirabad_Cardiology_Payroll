import { pool } from "../config/database.js";

export const WAGE_CODE_RANGES = [
  { min: 1, max: 999, category: "Pay Codes" },
  { min: 1001, max: 1999, category: "Allowance Codes" },
  { min: 2001, max: 2999, category: "Pay & Allowance Adjustment Codes" },
  { min: 4001, max: 4999, category: "Deduction Codes (Public Fund)" },
  { min: 5001, max: 5999, category: "Deduction Codes (Other)" },
  { min: 6001, max: 6999, category: "Deduction Adjustment Codes" }
];

const toNull = (value) => (value === "" || value === undefined ? null : value);

export function deriveWageCategory(code) {
  if (!/^\d{4}$/.test(code)) {
    return "";
  }

  const numericCode = Number(code);
  const range = WAGE_CODE_RANGES.find((item) => numericCode >= item.min && numericCode <= item.max);
  return range?.category || "";
}

export function normalizeWageCodePayload(payload) {
  const rawCode = String(payload.code || "").trim();
  const numericCode = /^\d+$/.test(rawCode) ? Number(rawCode) : NaN;
  const code = Number.isFinite(numericCode) ? String(numericCode).padStart(4, "0") : rawCode;

  return {
    code,
    description: String(payload.description || "").trim(),
    attachedAccountCode: toNull(payload.attachedAccountCode)
  };
}

export function validateWageCode(payload, { requireCode = true } = {}) {
  if (requireCode && !/^\d{4}$/.test(payload.code)) {
    return "Wage code must be 4 digits.";
  }

  if (requireCode && !deriveWageCategory(payload.code)) {
    return "Wage code is outside the allowed payroll ranges.";
  }

  if (!payload.description) {
    return "Description is required.";
  }

  return "";
}

export async function ensureWageCodesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wage_codes (
      code VARCHAR(4) PRIMARY KEY,
      description VARCHAR(100) NOT NULL,
      category VARCHAR(30) NOT NULL,
      attached_account_code VARCHAR(20) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_wage_codes_chart_account
        FOREIGN KEY (attached_account_code) REFERENCES chart_of_accounts(code)
        ON UPDATE CASCADE
        ON DELETE SET NULL
    )
  `);
}

export async function getWageCodes({ search = "", category = "" } = {}) {
  const query = `%${search.trim()}%`;
  const categoryFilter = category.trim();
  const [rows] = await pool.query(
    `
      SELECT
        wc.code,
        wc.description,
        wc.category,
        wc.attached_account_code AS attachedAccountCode,
        coa.name AS attachedAccountName,
        wc.created_at AS createdAt,
        wc.updated_at AS updatedAt
      FROM wage_codes wc
      LEFT JOIN chart_of_accounts coa ON coa.code = wc.attached_account_code
      WHERE (? = '%%' OR wc.code LIKE ? OR wc.description LIKE ?)
        AND (? = '' OR wc.category = ?)
      ORDER BY wc.code ASC
    `,
    [query, query, query, categoryFilter, categoryFilter]
  );

  return rows;
}

export async function getWageCodeByCode(code) {
  const [rows] = await pool.query(
    `
      SELECT
        wc.code,
        wc.description,
        wc.category,
        wc.attached_account_code AS attachedAccountCode,
        coa.name AS attachedAccountName,
        wc.created_at AS createdAt,
        wc.updated_at AS updatedAt
      FROM wage_codes wc
      LEFT JOIN chart_of_accounts coa ON coa.code = wc.attached_account_code
      WHERE wc.code = ?
      LIMIT 1
    `,
    [code]
  );

  return rows[0] || null;
}

export async function insertWageCode(wageCode) {
  const category = deriveWageCategory(wageCode.code);
  await pool.query(
    `
      INSERT INTO wage_codes (
        code,
        description,
        category,
        attached_account_code
      ) VALUES (?, ?, ?, ?)
    `,
    [wageCode.code, wageCode.description, category, toNull(wageCode.attachedAccountCode)]
  );

  return getWageCodeByCode(wageCode.code);
}

export async function updateWageCodeByCode(code, wageCode) {
  const [result] = await pool.query(
    `
      UPDATE wage_codes
      SET description = ?,
          attached_account_code = ?
      WHERE code = ?
    `,
    [wageCode.description, toNull(wageCode.attachedAccountCode), code]
  );

  return result.affectedRows;
}

export async function deleteWageCodeByCode(code) {
  const [result] = await pool.query("DELETE FROM wage_codes WHERE code = ?", [code]);
  return result.affectedRows;
}

export async function getWageCodeReferenceCounts(code) {
  const [[allowanceReference]] = await pool.query(
    "SELECT COUNT(*) AS count FROM employee_allowances WHERE allowance_code = ?",
    [code]
  );
  let salaryTransactionCount = 0;
  const [salaryTables] = await pool.query("SHOW TABLES LIKE 'salary_transactions'");

  if (salaryTables.length) {
    const [wageCodeColumns] = await pool.query("SHOW COLUMNS FROM salary_transactions LIKE 'wage_code'");

    if (wageCodeColumns.length) {
      const [[salaryReference]] = await pool.query(
        "SELECT COUNT(*) AS count FROM salary_transactions WHERE wage_code = ?",
        [code]
      );
      salaryTransactionCount = Number(salaryReference.count || 0);
    }
  }

  return {
    employeeAllowances: Number(allowanceReference.count || 0),
    salaryTransactions: salaryTransactionCount
  };
}

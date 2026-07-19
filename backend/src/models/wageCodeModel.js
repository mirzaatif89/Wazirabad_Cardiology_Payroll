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

const DEFAULT_WAGE_CODES = [
  { code: "0001", description: "PAY OF OFFICERS", attachedAccountCode: "A01101", attachedAccountName: "PAY OF OFFICERS" },
  { code: "0002", description: "PAY OF STAFF", attachedAccountCode: "A01151", attachedAccountName: "PAY OF STAFF" },
  { code: "0004", description: "QUALIFICATION PAY", attachedAccountCode: "A01105", attachedAccountName: "QUALIFICATION PAY" },
  { code: "0008", description: "PERSONAL PAY", attachedAccountCode: "A01101", attachedAccountName: "PAY OF OFFICERS" },
  { code: "0038", description: "LEAVE SALARY", attachedAccountCode: "A01278", attachedAccountName: "LEAVE SALARY" },
  { code: "1001", description: "SENIOR POST ALLOWANCE", attachedAccountCode: "A01101", attachedAccountName: "PAY OF OFFICERS" },
  { code: "1002", description: "HOUSE RENT ALLOWANCE", attachedAccountCode: "A01202", attachedAccountName: "HOUSE RENT ALLOWANCE" },
  { code: "1003", description: "CONVEYANCE ALLOWANCE", attachedAccountCode: "A01203", attachedAccountName: "CONVEYANCE ALLOWANCE" },
  { code: "1004", description: "SUMPTUARY ALLOWANCE", attachedAccountCode: "A01204", attachedAccountName: "SUMPTUARY ALLOWANCE" },
  { code: "1005", description: "WASHING ALLOWANCE", attachedAccountCode: "A01207", attachedAccountName: "WASHING ALLOWANCE" },
  { code: "1006", description: "DRESS ALLOWANCE", attachedAccountCode: "A01208", attachedAccountName: "DRESS ALLOWANCE" },
  { code: "1007", description: "SPECIAL HEALTH CARE ALLOWANCE", attachedAccountCode: "A0120X", attachedAccountName: "ADHOC RELIEF ALLOWANCE 2010" },
  { code: "1010", description: "INTEGRATED ALLOWANCE", attachedAccountCode: "A0120D", attachedAccountName: "INTEGRATED ALLOWANCE" },
  { code: "1015", description: "ADHOC RELIEF ALLOWANCE 2010", attachedAccountCode: "A0120X", attachedAccountName: "ADHOC RELIEF ALLOWANCE 2010" },
  { code: "1020", description: "QUALIFICATION ALLOWANCE", attachedAccountCode: "A01216", attachedAccountName: "QUALIFICATION ALLOWANCE" },
  { code: "1025", description: "MEDICAL ALLOWANCE", attachedAccountCode: "A01217", attachedAccountName: "MEDICAL ALLOWANCE" },
  { code: "1026", description: "ADHOC RELIEF ALLOWANCE 2011", attachedAccountCode: "A0121A", attachedAccountName: "ADHOC RELIEF ALLOWANCE 2011" },
  { code: "1031", description: "HEALTH PROFESSIONAL ALLOWANCE", attachedAccountCode: "A0121B", attachedAccountName: "HEALTH PROFESSIONAL ALLOWANCE" },
  { code: "1032", description: "HEALTH RISK ALLOWANCE", attachedAccountCode: "A0121N", attachedAccountName: "HEALTH RISK ALLOWANCE" },
  { code: "1033", description: "ADHOC RELIEF ALLOWANCE 2012", attachedAccountCode: "A0121M", attachedAccountName: "ADHOC RELIEF ALLOWANCE 2012" },
  { code: "1034", description: "ADHOC RELIEF ALLOWANCE 2013", attachedAccountCode: "A0121T", attachedAccountName: "ADHOC RELIEF ALLOWANCE 2013" },
  { code: "1035", description: "ENTERTAINMENT ALLOWANCE", attachedAccountCode: "A01224", attachedAccountName: "ENTERTAINMENT ALLOWANCE" },
  { code: "1036", description: "COMPUTER ALLOWANCE", attachedAccountCode: "A01226", attachedAccountName: "COMPUTER ALLOWANCE" },
  { code: "1037", description: "PROJECT ALLOWANCE", attachedAccountCode: "A01227", attachedAccountName: "PROJECT ALLOWANCE" },
  { code: "1040", description: "PERSONAL ALLOWANCE", attachedAccountCode: "A01101", attachedAccountName: "PAY OF OFFICERS" },
  { code: "1041", description: "DEPUTATION ALLOWANCE", attachedAccountCode: "A01101", attachedAccountName: "PAY OF OFFICERS" },
  { code: "1042", description: "SPECIAL ALLOWANCE", attachedAccountCode: "A01239", attachedAccountName: "SPECIAL ALLOWANCE" },
  { code: "1044", description: "INCENTIVE ALLOWANCE", attachedAccountCode: "A01250", attachedAccountName: "INCENTIVE ALLOWANCE" },
  { code: "1045", description: "MESS ALLOWANCE", attachedAccountCode: "A01251", attachedAccountName: "MESS ALLOWANCE" },
  { code: "1046", description: "NON PRACTICING ALLOWANCE", attachedAccountCode: "A01252", attachedAccountName: "NON PRACTICING ALLOWANCE" },
  { code: "1047", description: "SCIENCE TEACHING ALLOWANCE", attachedAccountCode: "A01253", attachedAccountName: "SCIENCE TEACHING ALLOWANCE" },
  { code: "1048", description: "ANESTHESIA ALLOWANCE", attachedAccountCode: "A01254", attachedAccountName: "ANESTHESIA ALLOWANCE" },
  { code: "1049", description: "WARDEN/BOARDING ALLOWANCE", attachedAccountCode: "A01267", attachedAccountName: "WARDEN/BOARDING ALLOWANCE" },
  { code: "1050", description: "SOCIAL SECURITY BENEFIT", attachedAccountCode: "A01270.037", attachedAccountName: "SOCIAL SECURITY BENEFIT" },
  { code: "1051", description: "HEALTH SECTOR REFORM ALLOWANCE", attachedAccountCode: "A01270.058", attachedAccountName: "HEALTH SECTOR REFORM ALLOWANCE" },
  { code: "1052", description: "TEACHING ALLOWANCE", attachedAccountCode: "A01289", attachedAccountName: "TEACHING ALLOWANCE" },
  { code: "1060", description: "AR 14", attachedAccountCode: "C02701", attachedAccountName: "5% H/R OF M&R CHARGES" },
  { code: "1121", description: "ADHOC RELIEF ALLOWANCE 2014", attachedAccountCode: "A0121Z", attachedAccountName: "ADHOC RELIEF ALLOWANCE 2014" },
  { code: "1122", description: "ADHOC RELIEF 7.5% 2015", attachedAccountCode: "A0122C", attachedAccountName: "ADHOC RELIEF 7.5% 2015" },
  { code: "1123", description: "ADHOC RELIEF ALLOWANCE 2016", attachedAccountCode: "A0121M", attachedAccountName: "ADHOC RELIEF 2016 @10%" },
  { code: "1260", description: "RATION ALLOWANCE", attachedAccountCode: "A01260", attachedAccountName: "RATION ALLOWANCE" },
  { code: "2001", description: "ADJ PAY OF STAFF OFFICERS", attachedAccountCode: "A01101", attachedAccountName: "PAY OF OFFICERS" },
  { code: "2002", description: "ADJ HOUSE RENT ALLOWANCE", attachedAccountCode: "A01202.01", attachedAccountName: "ADJ HOUSE RENT ALLOWANCE" },
  { code: "2003", description: "ADJ CONVEYANCE ALLOWANCE", attachedAccountCode: "A01203.01", attachedAccountName: "ADJ CONVEYANCE ALLOWANCE" },
  { code: "2004", description: "ADJUST PAY OF STAFF", attachedAccountCode: "A01151", attachedAccountName: "PAY OF STAFF" },
  { code: "2005", description: "ADJ WASHING ALLOWANCE", attachedAccountCode: "A01207", attachedAccountName: "WASHING ALLOWANCE" },
  { code: "2006", description: "ADJ INTEGRATED ALLOWANCE", attachedAccountCode: "A0120D", attachedAccountName: "INTEGRATED ALLOWANCE" },
  { code: "2007", description: "ADJ QUALIFICATION ALLOWANCE", attachedAccountCode: "A01216", attachedAccountName: "QUALIFICATION ALLOWANCE" },
  { code: "2008", description: "ADJ ADHOC RELIEF 2016", attachedAccountCode: "A0121M", attachedAccountName: "ADHOC RELIEF 2016 @10%" },
  { code: "2009", description: "ADJ SOCIAL SECURITY BENEFIT", attachedAccountCode: "A01270.037", attachedAccountName: "SOCIAL SECURITY BENEFIT" },
  { code: "2010", description: "ADJ SPECIAL HEALTH CARE ALLOWANCE", attachedAccountCode: "A0120X", attachedAccountName: "ADHOC RELIEF ALLOWANCE 2010" },
  { code: "2011", description: "ADJ HEALTH PROFESSIONAL ALLOWANCE", attachedAccountCode: "A0121B", attachedAccountName: "HEALTH PROFESSIONAL ALLOWANCE" },
  { code: "2015", description: "ADJ ARA 2010", attachedAccountCode: "A0120X.01", attachedAccountName: "ADJ ARA 2010" },
  { code: "2031", description: "ADJ HPA", attachedAccountCode: "A0121B.01", attachedAccountName: "ADJ HPA" },
  { code: "2032", description: "ADJ HEALTH RISK ALLOWANCE", attachedAccountCode: "A0121N.01", attachedAccountName: "ADJ HEALTH RISK ALLOWANCE" },
  { code: "2033", description: "ADJ ADHOC RELIEF 2012", attachedAccountCode: "A0121M.01", attachedAccountName: "ADJ ADHOC RELIEF 2012" },
  { code: "2042", description: "ADJ SPECIAL ALLOWANCE", attachedAccountCode: "A01239.01", attachedAccountName: "ADJ SPECIAL ALLOWANCE" },
  { code: "2212", description: "ADJ ADHOC 7.5% 2015", attachedAccountCode: "A0121A", attachedAccountName: "ADHOC RELIEF ALLOWANCE 2011" },
  { code: "4001", description: "5% H/R OF M&R CHARGES", attachedAccountCode: "C02701", attachedAccountName: "5% H/R OF M&R CHARGES" },
  { code: "4002", description: "RECOVERY", attachedAccountCode: "C02866", attachedAccountName: "RECOVER OVER PAYMENT" },
  { code: "5001", description: "10% HOUSE RENT RECOVERY", attachedAccountCode: "G0111", attachedAccountName: "10% HOUSE RENT RECOVERY" },
  { code: "5002", description: "HOSTEL RENT", attachedAccountCode: "G0112", attachedAccountName: "HOSTEL RENT" },
  { code: "5003", description: "GP FUND ADVANCE", attachedAccountCode: "G0113", attachedAccountName: "GP FUND ADVANCE" },
  { code: "5004", description: "BENEVOLENT FUND", attachedAccountCode: "G06214", attachedAccountName: "BENEVOLENT FUND" },
  { code: "5005", description: "GROUP INSURANCE", attachedAccountCode: "G06411", attachedAccountName: "GROUP INSURANCE" },
  { code: "5006", description: "PGHSF", attachedAccountCode: "G11278", attachedAccountName: "PGHSF" },
  { code: "5007", description: "INCOME TAX", attachedAccountCode: "G12713", attachedAccountName: "INCOME TAX" },
  { code: "5008", description: "G.P FUND", attachedAccountCode: "G06103", attachedAccountName: "G.P FUND" },
  { code: "6001", description: "DEDUCT PAY OF OFFICERS", attachedAccountCode: "C02866", attachedAccountName: "RECOVER OVER PAYMENT" },
  { code: "6002", description: "DEDUCT INCOME TAX", attachedAccountCode: "G12713", attachedAccountName: "INCOME TAX" },
  { code: "6003", description: "DEDUCT GROUP INSURANCE", attachedAccountCode: "G06411", attachedAccountName: "GROUP INSURANCE" },
  { code: "6004", description: "DEDUCT PAY OF STAFF", attachedAccountCode: "C02866", attachedAccountName: "RECOVER OVER PAYMENT" },
  { code: "6005", description: "DEDUCT BENEVOLENT FUND", attachedAccountCode: "G06214", attachedAccountName: "BENEVOLENT FUND" },
  { code: "6006", description: "DEDUCT GP FUND", attachedAccountCode: "G06103", attachedAccountName: "G.P FUND" },
  { code: "6007", description: "DEDUCT WASHING ALLOWANCE", attachedAccountCode: "C02866", attachedAccountName: "RECOVER OVER PAYMENT" },
  { code: "6008", description: "DEDUCT CONVEYANCE ALLOWANCE", attachedAccountCode: "C02866", attachedAccountName: "RECOVER OVER PAYMENT" },
  { code: "6009", description: "DEDUCT PGHSF", attachedAccountCode: "G11278", attachedAccountName: "PGHSF" }
];

const DEFAULT_CHART_OF_ACCOUNTS = Array.from(
  DEFAULT_WAGE_CODES.reduce((accounts, wageCode) => {
    if (wageCode.attachedAccountCode && !accounts.has(wageCode.attachedAccountCode)) {
      accounts.set(wageCode.attachedAccountCode, {
        code: wageCode.attachedAccountCode,
        name: wageCode.attachedAccountName || wageCode.description
      });
    }

    return accounts;
  }, new Map()).values()
);

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
      category VARCHAR(60) NOT NULL,
      attached_account_code VARCHAR(20) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_wage_codes_chart_account
        FOREIGN KEY (attached_account_code) REFERENCES chart_of_accounts(code)
        ON UPDATE CASCADE
        ON DELETE SET NULL
    )
  `);

  const [categoryColumns] = await pool.query("SHOW COLUMNS FROM wage_codes LIKE 'category'");
  const categoryColumnType = categoryColumns[0]?.Type || "";

  if (!categoryColumnType.toLowerCase().includes("varchar(60)")) {
    await pool.query("ALTER TABLE wage_codes MODIFY COLUMN category VARCHAR(60) NOT NULL");
  }

  if (DEFAULT_CHART_OF_ACCOUNTS.length) {
    await pool.query(
      `
        INSERT INTO chart_of_accounts (code, name)
        VALUES ${DEFAULT_CHART_OF_ACCOUNTS.map(() => "(?, ?)").join(", ")}
        ON DUPLICATE KEY UPDATE name = VALUES(name)
      `,
      DEFAULT_CHART_OF_ACCOUNTS.flatMap((account) => [account.code, account.name])
    );
  }

  if (DEFAULT_WAGE_CODES.length) {
    await pool.query(
      `
      INSERT INTO wage_codes (
        code,
        description,
        category,
        attached_account_code
      ) VALUES ${DEFAULT_WAGE_CODES.map(() => "(?, ?, ?, ?)").join(", ")}
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        category = VALUES(category),
        attached_account_code = VALUES(attached_account_code)
    `,
      DEFAULT_WAGE_CODES.flatMap((wageCode) => [
        wageCode.code,
        wageCode.description,
        deriveWageCategory(wageCode.code),
        toNull(wageCode.attachedAccountCode)
      ])
    );
  }
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

import { pool } from "../config/database.js";

const toNull = (value) => (value === "" || value === undefined ? null : value);

function toActiveFlag(value) {
  return value === false || value === 0 || value === "0" ? 0 : 1;
}

async function tableExists(tableName) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [tableName]
  );
  return Number(row.count) > 0;
}

async function columnExists(tableName, columnName) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );
  return Number(row.count) > 0;
}

async function indexExists(tableName, indexName) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [tableName, indexName]
  );
  return Number(row.count) > 0;
}

async function foreignKeyExists(tableName, constraintName) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.referential_constraints
     WHERE constraint_schema = DATABASE() AND table_name = ? AND constraint_name = ?`,
    [tableName, constraintName]
  );
  return Number(row.count) > 0;
}

async function dropLegacyBranchCodeUniqueIndex() {
  const [indexes] = await pool.query(`
    SELECT INDEX_NAME AS indexName,
      GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columnsList
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'bank_branch_codes'
      AND non_unique = 0
      AND index_name <> 'PRIMARY'
    GROUP BY index_name
  `);

  for (const index of indexes) {
    if (index.columnsList === "code") {
      const safeIndexName = String(index.indexName).replace(/`/g, "``");
      await pool.query(`ALTER TABLE bank_branch_codes DROP INDEX \`${safeIndexName}\``);
    }
  }
}

async function backfillExistingBranchBankLinks() {
  if (!(await tableExists("employees"))) return;

  // Assign legacy data only when employee history identifies exactly one bank.
  await pool.query(`
    UPDATE bank_branch_codes branch
    JOIN (
      SELECT employee.bank_branch_code AS branch_code,
        MIN(bank.id) AS bank_id,
        COUNT(DISTINCT bank.id) AS bank_count
      FROM employees employee
      JOIN bank_codes bank ON bank.code = employee.bank_code
      WHERE employee.bank_branch_code IS NOT NULL
        AND employee.bank_branch_code <> ''
      GROUP BY employee.bank_branch_code
      HAVING COUNT(DISTINCT bank.id) = 1
    ) matched ON matched.branch_code = branch.code
    SET branch.bank_id = matched.bank_id
    WHERE branch.bank_id IS NULL
  `);
}

export async function ensureBankTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      bank VARCHAR(150) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_branch_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bank_id INT NULL,
      code VARCHAR(50) NOT NULL,
      branch VARCHAR(150) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_bank_branch_bank_code (bank_id, code),
      CONSTRAINT fk_bank_branch_bank FOREIGN KEY (bank_id) REFERENCES bank_codes(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
    )
  `);

  if (!(await columnExists("bank_codes", "is_active"))) {
    await pool.query("ALTER TABLE bank_codes ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER bank");
  }
  if (!(await columnExists("bank_branch_codes", "bank_id"))) {
    await pool.query("ALTER TABLE bank_branch_codes ADD COLUMN bank_id INT NULL AFTER id");
  }
  if (!(await columnExists("bank_branch_codes", "is_active"))) {
    await pool.query("ALTER TABLE bank_branch_codes ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER branch");
  }

  await backfillExistingBranchBankLinks();
  await dropLegacyBranchCodeUniqueIndex();

  if (!(await indexExists("bank_branch_codes", "uq_bank_branch_bank_code"))) {
    await pool.query("ALTER TABLE bank_branch_codes ADD UNIQUE KEY uq_bank_branch_bank_code (bank_id, code)");
  }
  if (!(await foreignKeyExists("bank_branch_codes", "fk_bank_branch_bank"))) {
    await pool.query(`ALTER TABLE bank_branch_codes
      ADD CONSTRAINT fk_bank_branch_bank FOREIGN KEY (bank_id) REFERENCES bank_codes(id)
      ON UPDATE CASCADE ON DELETE RESTRICT`);
  }
}

export async function getBanks() {
  const [rows] = await pool.query(`
    SELECT bank.id, bank.code, bank.bank, bank.is_active AS isActive,
      bank.created_at AS createdAt,
      COUNT(DISTINCT branch.id) AS branchCount,
      COUNT(DISTINCT employee.id) AS employeeCount
    FROM bank_codes bank
    LEFT JOIN bank_branch_codes branch ON branch.bank_id = bank.id
    LEFT JOIN employees employee ON employee.bank_code = bank.code
    GROUP BY bank.id, bank.code, bank.bank, bank.is_active, bank.created_at
    ORDER BY bank.bank ASC, bank.code ASC
  `);
  return rows;
}

export async function insertBank(bank) {
  const [result] = await pool.query(
    "INSERT INTO bank_codes (code, bank, is_active) VALUES (?, ?, ?)",
    [bank.code, bank.bank, bank.isActive]
  );
  return result.insertId;
}

export async function updateBankById(id, bank) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[existing]] = await connection.query("SELECT code FROM bank_codes WHERE id = ? FOR UPDATE", [id]);
    if (!existing) {
      await connection.rollback();
      return 0;
    }
    const [result] = await connection.query(
      "UPDATE bank_codes SET code = ?, bank = ?, is_active = ? WHERE id = ?",
      [bank.code, bank.bank, bank.isActive, id]
    );
    if (await tableExists("employees")) {
      await connection.query(
        "UPDATE employees SET bank_code = ?, bank = ? WHERE bank_code = ?",
        [bank.code, bank.bank, existing.code]
      );
    }
    await connection.commit();
    return result.affectedRows || 1;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteBankById(id) {
  const [[bank]] = await pool.query("SELECT code FROM bank_codes WHERE id = ?", [id]);
  if (!bank) return 0;

  const [[branchUsage]] = await pool.query("SELECT COUNT(*) AS count FROM bank_branch_codes WHERE bank_id = ?", [id]);
  if (Number(branchUsage.count) > 0) {
    const error = new Error("Bank has linked branches.");
    error.code = "BANK_HAS_BRANCHES";
    throw error;
  }

  if (await tableExists("employees")) {
    const [[employeeUsage]] = await pool.query("SELECT COUNT(*) AS count FROM employees WHERE bank_code = ?", [bank.code]);
    if (Number(employeeUsage.count) > 0) {
      const error = new Error("Bank is used by employees.");
      error.code = "BANK_IN_USE";
      throw error;
    }
  }

  const [result] = await pool.query("DELETE FROM bank_codes WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function getBankBranches({ bankId = null, bankCode = null, includeInactive = true } = {}) {
  const conditions = [];
  const values = [];
  if (bankId) {
    conditions.push("branch.bank_id = ?");
    values.push(bankId);
  }
  if (bankCode) {
    conditions.push("bank.code = ?");
    values.push(bankCode);
  }
  if (!includeInactive) conditions.push("branch.is_active = 1 AND bank.is_active = 1");
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT branch.id, branch.bank_id AS bankId, branch.code, branch.branch,
      branch.is_active AS isActive, branch.created_at AS createdAt,
      bank.code AS bankCode, bank.bank AS bankName, bank.is_active AS bankIsActive,
      COUNT(DISTINCT employee.id) AS employeeCount
    FROM bank_branch_codes branch
    LEFT JOIN bank_codes bank ON bank.id = branch.bank_id
    LEFT JOIN employees employee
      ON employee.bank_code = bank.code AND employee.bank_branch_code = branch.code
    ${where}
    GROUP BY branch.id, branch.bank_id, branch.code, branch.branch, branch.is_active,
      branch.created_at, bank.code, bank.bank, bank.is_active
    ORDER BY COALESCE(bank.bank, 'Unassigned') ASC, branch.branch ASC, branch.code ASC`,
    values
  );
  return rows;
}

export async function insertBankBranch(branch) {
  const [result] = await pool.query(
    "INSERT INTO bank_branch_codes (bank_id, code, branch, is_active) VALUES (?, ?, ?, ?)",
    [branch.bankId, branch.code, branch.branch, branch.isActive]
  );
  return result.insertId;
}

export async function updateBankBranchById(id, branch) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[existing]] = await connection.query(
      `SELECT branch.code, bank.code AS bankCode
       FROM bank_branch_codes branch
       LEFT JOIN bank_codes bank ON bank.id = branch.bank_id
       WHERE branch.id = ? FOR UPDATE`,
      [id]
    );
    if (!existing) {
      await connection.rollback();
      return 0;
    }
    const [[newBank]] = await connection.query("SELECT code, bank FROM bank_codes WHERE id = ?", [branch.bankId]);
    const [result] = await connection.query(
      "UPDATE bank_branch_codes SET bank_id = ?, code = ?, branch = ?, is_active = ? WHERE id = ?",
      [branch.bankId, branch.code, branch.branch, branch.isActive, id]
    );
    if (newBank && await tableExists("employees")) {
      if (existing.bankCode) {
        await connection.query(
          `UPDATE employees SET bank_code = ?, bank = ?, bank_branch_code = ?, bank_branch = ?
           WHERE bank_code = ? AND bank_branch_code = ?`,
          [newBank.code, newBank.bank, branch.code, branch.branch, existing.bankCode, existing.code]
        );
      } else {
        await connection.query(
          `UPDATE employees SET bank = ?, bank_branch_code = ?, bank_branch = ?
           WHERE bank_code = ? AND bank_branch_code = ?`,
          [newBank.bank, branch.code, branch.branch, newBank.code, existing.code]
        );
      }
    }
    await connection.commit();
    return result.affectedRows || 1;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteBankBranchById(id) {
  const [[branch]] = await pool.query(
    `SELECT branch.code, bank.code AS bankCode
     FROM bank_branch_codes branch
     LEFT JOIN bank_codes bank ON bank.id = branch.bank_id
     WHERE branch.id = ?`,
    [id]
  );
  if (!branch) return 0;

  if (await tableExists("employees")) {
    const query = branch.bankCode
      ? "SELECT COUNT(*) AS count FROM employees WHERE bank_code = ? AND bank_branch_code = ?"
      : "SELECT COUNT(*) AS count FROM employees WHERE bank_branch_code = ?";
    const values = branch.bankCode ? [branch.bankCode, branch.code] : [branch.code];
    const [[usage]] = await pool.query(query, values);
    if (Number(usage.count) > 0) {
      const error = new Error("Branch is used by employees.");
      error.code = "BRANCH_IN_USE";
      throw error;
    }
  }

  const [result] = await pool.query("DELETE FROM bank_branch_codes WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function resolveEmployeeBankSelection(employee) {
  const bankCode = String(employee.bankCode || "").trim();
  const branchCode = String(employee.bankBranchCode || "").trim();
  const accountNo = String(employee.accountNo || "").trim();
  const hasBankDetails = Boolean(bankCode || branchCode || accountNo);

  if (!hasBankDetails) return { message: "", bank: null, branch: null };
  if (!bankCode || !branchCode || !accountNo) {
    return { message: "Bank, branch, and account number are required together.", bank: null, branch: null };
  }

  const [[selection]] = await pool.query(
    `SELECT bank.id AS bankId, bank.code AS bankCode, bank.bank AS bankName,
      bank.is_active AS bankIsActive, branch.id AS branchId,
      branch.code AS branchCode, branch.branch AS branchName,
      branch.is_active AS branchIsActive
    FROM bank_codes bank
    JOIN bank_branch_codes branch ON branch.bank_id = bank.id
    WHERE bank.code = ? AND branch.code = ? LIMIT 1`,
    [bankCode, branchCode]
  );

  if (!selection) {
    return { message: "Selected branch does not belong to the selected bank.", bank: null, branch: null };
  }
  if (!Number(selection.bankIsActive) || !Number(selection.branchIsActive)) {
    return { message: "Selected bank or branch is inactive.", bank: null, branch: null };
  }

  return {
    message: "",
    bank: { id: selection.bankId, code: selection.bankCode, name: selection.bankName },
    branch: { id: selection.branchId, code: selection.branchCode, name: selection.branchName }
  };
}

export function normalizeBankPayload(payload) {
  return {
    code: String(toNull(payload.code) || "").trim(),
    bank: String(toNull(payload.bank) || "").trim(),
    isActive: toActiveFlag(payload.isActive)
  };
}

export function normalizeBankBranchPayload(payload) {
  return {
    bankId: Number(payload.bankId) || null,
    code: String(toNull(payload.code) || "").trim(),
    branch: String(toNull(payload.branch) || "").trim(),
    isActive: toActiveFlag(payload.isActive)
  };
}

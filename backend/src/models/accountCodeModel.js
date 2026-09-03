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

  await pool.query(`
    INSERT INTO chart_of_accounts (code, name)
    SELECT code, designation
    FROM account_codes
    WHERE CHAR_LENGTH(code) <= 20
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `);
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
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      "INSERT INTO account_codes (code, designation) VALUES (?, ?)",
      [accountCode.code, accountCode.designation]
    );
    await connection.query(
      `
        INSERT INTO chart_of_accounts (code, name)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name)
      `,
      [accountCode.code, accountCode.designation]
    );
    await connection.commit();

    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAccountCodeById(id, accountCode) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [[existing]] = await connection.query(
      "SELECT code, designation FROM account_codes WHERE id = ? FOR UPDATE",
      [id]
    );

    if (!existing) {
      await connection.rollback();
      return 0;
    }

    await connection.query(
      `
        INSERT INTO chart_of_accounts (code, name)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name)
      `,
      [existing.code, existing.designation]
    );

    const [result] = await connection.query(
      "UPDATE account_codes SET code = ?, designation = ? WHERE id = ?",
      [accountCode.code, accountCode.designation, id]
    );
    await connection.query(
      "UPDATE chart_of_accounts SET code = ?, name = ? WHERE code = ?",
      [accountCode.code, accountCode.designation, existing.code]
    );
    await connection.commit();

    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteAccountCodeById(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [[existing]] = await connection.query(
      "SELECT code FROM account_codes WHERE id = ? FOR UPDATE",
      [id]
    );

    if (!existing) {
      await connection.rollback();
      return 0;
    }

    const [[wageUsage]] = await connection.query(
      "SELECT COUNT(*) AS count FROM wage_codes WHERE attached_account_code = ?",
      [existing.code]
    );

    if (Number(wageUsage?.count || 0) > 0) {
      const error = new Error("Account code is linked to one or more wage codes.");
      error.code = "ACCOUNT_CODE_IN_USE";
      throw error;
    }

    const [result] = await connection.query("DELETE FROM account_codes WHERE id = ?", [id]);
    await connection.query("DELETE FROM chart_of_accounts WHERE code = ?", [existing.code]);
    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function normalizeAccountCodePayload(payload) {
  return {
    code: String(toNull(payload.code) || "").trim(),
    designation: String(toNull(payload.designation) || "").trim()
  };
}

import { pool } from "../config/database.js";

export async function ensureBudgetTransactionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS budget_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      document_no INT UNIQUE NOT NULL,
      transaction_date DATE NOT NULL,
      budget_type ENUM('original','supplementary') NOT NULL,
      details VARCHAR(200),
      total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
      status ENUM('draft','finalized','cancelled') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS budget_transaction_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      budget_transaction_id INT NOT NULL,
      sr_no INT NOT NULL,
      account_code VARCHAR(20) NOT NULL,
      description VARCHAR(150),
      amount DECIMAL(12, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_budget_items_transaction
        FOREIGN KEY (budget_transaction_id) REFERENCES budget_transactions(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_budget_items_chart_account
        FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code)
        ON UPDATE CASCADE
    )
  `);

  await pool.query("ALTER TABLE budget_transactions MODIFY budget_type VARCHAR(30) NOT NULL");
  await pool.query(`
    UPDATE budget_transactions
    SET budget_type = CASE
      WHEN budget_type = 'receive' THEN 'original'
      WHEN budget_type = 'spend' THEN 'supplementary'
      ELSE budget_type
    END
  `);
  await pool.query("ALTER TABLE budget_transactions MODIFY budget_type ENUM('original','supplementary') NOT NULL");
}

export async function getNextBudgetDocumentNo(connection = pool) {
  const [[row]] = await connection.query("SELECT COALESCE(MAX(document_no), 0) + 1 AS documentNo FROM budget_transactions");
  return Number(row.documentNo || 1);
}

export function normalizeBudgetItems(items = []) {
  return items.map((item, index) => ({
    srNo: Number(item.srNo || index + 1),
    accountCode: String(item.accountCode || "").trim(),
    description: String(item.description || "").trim(),
    amount: Number(item.amount || 0)
  }));
}

export function validateBudgetPayload(payload, items) {
  if (!payload.transactionDate) return "Transaction date is required.";
  if (!["original", "supplementary"].includes(payload.budgetType)) return "Budget type is required.";
  if (!items.length) return "At least one line item is required.";

  const invalidItem = items.find((item) => !item.accountCode || item.amount <= 0);
  if (invalidItem) return "Each line item needs account code and amount greater than 0.";

  return "";
}

export async function getAccountCodeMap(codes, connection = pool) {
  if (!codes.length) return new Map();

  const [rows] = await connection.query(
    `SELECT code, name FROM chart_of_accounts WHERE code IN (${codes.map(() => "?").join(",")})`,
    codes
  );
  return new Map(rows.map((row) => [row.code, row]));
}

export async function getBudgetTransactions({ budgetType = "", dateFrom = "", dateTo = "", status = "", documentNo = "" } = {}) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        document_no AS documentNo,
        DATE_FORMAT(transaction_date, '%Y-%m-%d') AS transactionDate,
        budget_type AS budgetType,
        details,
        total_amount AS totalAmount,
        status,
        created_at AS createdAt
      FROM budget_transactions
      WHERE (? = '' OR budget_type = ?)
        AND (? = '' OR transaction_date >= ?)
        AND (? = '' OR transaction_date <= ?)
        AND (? = '' OR status = ?)
        AND (? = '' OR document_no = ?)
      ORDER BY document_no DESC
    `,
    [budgetType, budgetType, dateFrom, dateFrom, dateTo, dateTo, status, status, documentNo, documentNo]
  );
  return rows;
}

export async function getBudgetTransactionById(id) {
  const [[transaction]] = await pool.query(
    `
      SELECT
        id,
        document_no AS documentNo,
        DATE_FORMAT(transaction_date, '%Y-%m-%d') AS transactionDate,
        budget_type AS budgetType,
        details,
        total_amount AS totalAmount,
        status,
        created_at AS createdAt
      FROM budget_transactions
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  if (!transaction) return null;

  const [items] = await pool.query(
    `
      SELECT
        bti.id,
        bti.sr_no AS srNo,
        bti.account_code AS accountCode,
        bti.description,
        coa.name AS accountName,
        bti.amount
      FROM budget_transaction_items bti
      INNER JOIN chart_of_accounts coa ON coa.code = bti.account_code
      WHERE bti.budget_transaction_id = ?
      ORDER BY bti.sr_no ASC
    `,
    [id]
  );

  return { ...transaction, items };
}

async function insertBudgetItems(connection, transactionId, items) {
  const values = items.map((item, index) => [
    transactionId,
    item.srNo || index + 1,
    item.accountCode,
    item.description || null,
    item.amount
  ]);

  await connection.query(
    `
      INSERT INTO budget_transaction_items (
        budget_transaction_id,
        sr_no,
        account_code,
        description,
        amount
      ) VALUES ?
    `,
    [values]
  );
}

export async function createBudgetTransaction(payload) {
  const connection = await pool.getConnection();
  const items = normalizeBudgetItems(payload.items);
  const totalAmount = items.reduce((total, item) => total + item.amount, 0);

  try {
    await connection.beginTransaction();
    const documentNo = await getNextBudgetDocumentNo(connection);
    const [result] = await connection.query(
      `
        INSERT INTO budget_transactions (
          document_no,
          transaction_date,
          budget_type,
          details,
          total_amount
        ) VALUES (?, ?, ?, ?, ?)
      `,
      [documentNo, payload.transactionDate, payload.budgetType, payload.details || null, totalAmount]
    );

    await insertBudgetItems(connection, result.insertId, items);
    await connection.commit();
    return getBudgetTransactionById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateBudgetTransactionById(id, payload) {
  const connection = await pool.getConnection();
  const items = normalizeBudgetItems(payload.items);
  const totalAmount = items.reduce((total, item) => total + item.amount, 0);

  try {
    await connection.beginTransaction();
    const [[existing]] = await connection.query("SELECT status FROM budget_transactions WHERE id = ? LIMIT 1", [id]);
    if (!existing) {
      await connection.rollback();
      return { status: "not_found" };
    }
    if (existing.status !== "draft") {
      await connection.rollback();
      return { status: "locked" };
    }

    await connection.query(
      `
        UPDATE budget_transactions
        SET transaction_date = ?,
            budget_type = ?,
            details = ?,
            total_amount = ?
        WHERE id = ?
      `,
      [payload.transactionDate, payload.budgetType, payload.details || null, totalAmount, id]
    );
    await connection.query("DELETE FROM budget_transaction_items WHERE budget_transaction_id = ?", [id]);
    await insertBudgetItems(connection, id, items);
    await connection.commit();
    return { status: "updated", transaction: await getBudgetTransactionById(id) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteBudgetTransactionById(id) {
  const [[existing]] = await pool.query("SELECT status FROM budget_transactions WHERE id = ? LIMIT 1", [id]);
  if (!existing) return "not_found";
  if (existing.status === "finalized") return "finalized";
  await pool.query("DELETE FROM budget_transactions WHERE id = ?", [id]);
  return "deleted";
}

export async function finalizeBudgetTransactionById(id) {
  const [result] = await pool.query(
    "UPDATE budget_transactions SET status = 'finalized' WHERE id = ? AND status = 'draft'",
    [id]
  );
  if (!result.affectedRows) {
    const [[existing]] = await pool.query("SELECT id, status FROM budget_transactions WHERE id = ? LIMIT 1", [id]);
    return existing ? "locked" : "not_found";
  }
  return "finalized";
}

export async function reopenBudgetTransactionById(id) {
  const [[existing]] = await pool.query(
    "SELECT id, document_no AS documentNo, status FROM budget_transactions WHERE id = ? LIMIT 1",
    [id]
  );

  if (!existing) return { status: "not_found" };
  if (existing.status !== "finalized") return { status: "not_finalized", documentNo: existing.documentNo };

  await pool.query("UPDATE budget_transactions SET status = 'draft' WHERE id = ?", [id]);
  return { status: "reopened", documentNo: existing.documentNo, transaction: await getBudgetTransactionById(id) };
}

export async function getBudgetSummary() {
  const [[totals]] = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN budget_type = 'original' THEN total_amount ELSE 0 END), 0) AS totalOriginal,
      COALESCE(SUM(CASE WHEN budget_type = 'supplementary' THEN total_amount ELSE 0 END), 0) AS totalSupplementary
    FROM budget_transactions
    WHERE status = 'finalized'
  `);
  const [byAccount] = await pool.query(`
    SELECT
      bti.account_code AS accountCode,
      coa.name AS accountName,
      COALESCE(SUM(CASE WHEN bt.budget_type = 'original' THEN bti.amount ELSE 0 END), 0) AS original,
      COALESCE(SUM(CASE WHEN bt.budget_type = 'supplementary' THEN bti.amount ELSE 0 END), 0) AS supplementary
    FROM budget_transaction_items bti
    INNER JOIN budget_transactions bt ON bt.id = bti.budget_transaction_id
    INNER JOIN chart_of_accounts coa ON coa.code = bti.account_code
    WHERE bt.status = 'finalized'
    GROUP BY bti.account_code, coa.name
    ORDER BY bti.account_code ASC
  `);

  const totalOriginal = Number(totals.totalOriginal || 0);
  const totalSupplementary = Number(totals.totalSupplementary || 0);
  return { totalOriginal, totalSupplementary, totalBudget: totalOriginal + totalSupplementary, byAccount };
}

export async function getBudgetPosition(endingDate) {
  const [[totals]] = await pool.query(
    `
      SELECT
        COALESCE(SUM(CASE WHEN budget_type = 'original' THEN total_amount ELSE 0 END), 0) AS totalOriginal,
        COALESCE(SUM(CASE WHEN budget_type = 'supplementary' THEN total_amount ELSE 0 END), 0) AS totalSupplementary
      FROM budget_transactions
      WHERE status = 'finalized'
        AND transaction_date <= ?
    `,
    [endingDate]
  );

  const [breakdown] = await pool.query(
    `
      SELECT
        bti.account_code AS code,
        coa.name AS description,
        COALESCE(SUM(CASE WHEN bt.budget_type = 'original' THEN bti.amount ELSE 0 END), 0) AS original_amount,
        COALESCE(SUM(CASE WHEN bt.budget_type = 'supplementary' THEN bti.amount ELSE 0 END), 0) AS supplementary_amount
      FROM budget_transaction_items bti
      INNER JOIN budget_transactions bt ON bt.id = bti.budget_transaction_id
      INNER JOIN chart_of_accounts coa ON coa.code = bti.account_code
      WHERE bt.status = 'finalized'
        AND bt.transaction_date <= ?
      GROUP BY bti.account_code, coa.name
      ORDER BY bti.account_code ASC
    `,
    [endingDate]
  );

  const rows = breakdown.map((row) => {
    const originalAmount = Number(row.original_amount || 0);
    const supplementaryAmount = Number(row.supplementary_amount || 0);
    const total = originalAmount + supplementaryAmount;
    return {
      code: row.code,
      description: row.description,
      original_amount: originalAmount,
      supplementary_amount: supplementaryAmount,
      total,
      spent: 0,
      remaining: total
    };
  });
  const totalOriginal = Number(totals.totalOriginal || 0);
  const totalSupplementary = Number(totals.totalSupplementary || 0);
  const totalBudget = totalOriginal + totalSupplementary;

  return {
    endingDate,
    totalOriginal,
    totalSupplementary,
    totalBudget,
    totalSpent: 0,
    remainingBudget: totalBudget,
    breakdown: rows
  };
}

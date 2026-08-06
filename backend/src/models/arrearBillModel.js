import { pool } from "../config/database.js";
import { getActiveFiscalYear, getFiscalYearForDate } from "./fiscalYearModel.js";
import { createArrearJournalEntry, reverseArrearJournalEntryByBillId } from "./journalModel.js";

const editableStatuses = new Set(["draft"]);

export async function ensureArrearBillTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS arrear_bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      document_no INT UNIQUE NOT NULL,
      bill_date DATE NOT NULL,
      fiscal_year_id INT NULL,
      place_of_posting VARCHAR(100) DEFAULT 'Hospital',
      employee_code VARCHAR(50) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      status ENUM('draft','finalized','cancelled') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_arrear_bills_employee
        FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
        ON UPDATE CASCADE,
      CONSTRAINT fk_arrear_bills_fiscal_year
        FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
        ON DELETE SET NULL
    )
  `);

  await pool.query("ALTER TABLE arrear_bills MODIFY status ENUM('draft','finalized','partially_paid','paid','cancelled') DEFAULT 'draft'");

  const [fiscalYearColumns] = await pool.query("SHOW COLUMNS FROM arrear_bills LIKE 'fiscal_year_id'");
  if (!fiscalYearColumns.length) {
    await pool.query("ALTER TABLE arrear_bills ADD COLUMN fiscal_year_id INT NULL AFTER bill_date");
  }

  const [fiscalYearConstraint] = await pool.query(
    `
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'arrear_bills'
        AND CONSTRAINT_NAME = 'fk_arrear_bills_fiscal_year'
      LIMIT 1
    `
  );

  if (!fiscalYearConstraint.length) {
    await pool.query(`
      ALTER TABLE arrear_bills
      ADD CONSTRAINT fk_arrear_bills_fiscal_year
      FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
      ON DELETE SET NULL
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS arrear_bill_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      arrear_bill_id INT NOT NULL,
      sr_no INT NOT NULL,
      period_no INT NOT NULL,
      period_label VARCHAR(20) NOT NULL,
      account_code VARCHAR(4) NOT NULL,
      description VARCHAR(150),
      amount DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_arrear_bill_items_bill
        FOREIGN KEY (arrear_bill_id) REFERENCES arrear_bills(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_arrear_bill_items_wage_code
        FOREIGN KEY (account_code) REFERENCES wage_codes(code)
        ON UPDATE CASCADE
    )
  `);
}

async function resolveFiscalYearIdForDate(targetDate, connection = pool) {
  const fiscalYear = await getFiscalYearForDate(targetDate, connection);
  if (fiscalYear?.id) {
    return fiscalYear.id;
  }

  const activeFiscalYear = await getActiveFiscalYear(connection);
  return activeFiscalYear?.id || null;
}

export async function getNextDocumentNo(connection = pool) {
  const [[row]] = await connection.query("SELECT COALESCE(MAX(document_no), 0) + 1 AS documentNo FROM arrear_bills");
  return Number(row.documentNo || 1);
}

export async function getArrearBills({ employeeCode = "", dateFrom = "", dateTo = "", status = "", documentNo = "" } = {}) {
  const whereClauses = [];
  const params = [];

  if (employeeCode) {
    whereClauses.push("ab.employee_code = ?");
    params.push(employeeCode);
  }

  if (dateFrom) {
    whereClauses.push("ab.bill_date >= ?");
    params.push(dateFrom);
  }

  if (dateTo) {
    whereClauses.push("ab.bill_date <= ?");
    params.push(dateTo);
  }

  if (status) {
    whereClauses.push("ab.status = ?");
    params.push(status);
  }

  if (documentNo) {
    whereClauses.push("ab.document_no = ?");
    params.push(Number(documentNo));
  }

  const [rows] = await pool.query(
    `
      SELECT
        ab.id,
        ab.document_no AS documentNo,
        DATE_FORMAT(ab.bill_date, '%Y-%m-%d') AS billDate,
        ab.fiscal_year_id AS fiscalYearId,
        fy.name AS fiscalYearName,
        ab.place_of_posting AS placeOfPosting,
        ab.employee_code AS employeeCode,
        e.name AS employeeName,
        ab.total_amount AS totalAmount,
        ab.status,
        ab.created_at AS createdAt
      FROM arrear_bills ab
      INNER JOIN employees e ON e.employee_no = ab.employee_code
      LEFT JOIN fiscal_years fy ON fy.id = ab.fiscal_year_id
      ${whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : ""}
      ORDER BY ab.document_no DESC
    `,
    params
  );

  return rows;
}

export async function getArrearBillById(id) {
  const [[bill]] = await pool.query(
    `
      SELECT
        ab.id,
        ab.document_no AS documentNo,
        DATE_FORMAT(ab.bill_date, '%Y-%m-%d') AS billDate,
        ab.fiscal_year_id AS fiscalYearId,
        fy.name AS fiscalYearName,
        ab.place_of_posting AS placeOfPosting,
        ab.employee_code AS employeeCode,
        e.name AS employeeName,
        ab.total_amount AS totalAmount,
        ab.status,
        ab.created_at AS createdAt
      FROM arrear_bills ab
      INNER JOIN employees e ON e.employee_no = ab.employee_code
      LEFT JOIN fiscal_years fy ON fy.id = ab.fiscal_year_id
      WHERE ab.id = ?
      LIMIT 1
    `,
    [id]
  );

  if (!bill) {
    return null;
  }

  const [items] = await pool.query(
    `
      SELECT
        abi.id,
        abi.sr_no AS srNo,
        abi.period_no AS periodNo,
        abi.period_label AS periodLabel,
        abi.account_code AS accountCode,
        abi.description,
        wc.description AS wageDescription,
        abi.amount
      FROM arrear_bill_items abi
      INNER JOIN wage_codes wc ON wc.code = abi.account_code
      WHERE abi.arrear_bill_id = ?
      ORDER BY abi.sr_no ASC
    `,
    [id]
  );

  return { ...bill, items };
}

export async function getArrearBillReport({ employeeCode = "", fromDate, toDate, sortBy = "doc_no", status = "" }) {
  const normalizedEmployeeCode = String(employeeCode || "").trim();
  const normalizedStatus = String(status || "").trim();
  const shouldFilterEmployee = normalizedEmployeeCode !== "" && normalizedEmployeeCode !== "0";
  const shouldFilterStatus = ["draft", "finalized", "cancelled"].includes(normalizedStatus);
  const orderBy = sortBy === "employee_code"
    ? "ab.employee_code ASC, ab.document_no ASC"
    : "ab.document_no ASC";
  const params = [fromDate, toDate];

  if (shouldFilterEmployee) {
    params.push(normalizedEmployeeCode);
  }

  if (shouldFilterStatus) {
    params.push(normalizedStatus);
  }

  const [bills] = await pool.query(
    `
      SELECT
        ab.id,
        ab.document_no AS document_no,
        DATE_FORMAT(ab.bill_date, '%Y-%m-%d') AS bill_date,
        ab.employee_code AS employee_code,
        e.name AS employee_name,
        ab.total_amount AS total_amount
      FROM arrear_bills ab
      INNER JOIN employees e ON e.employee_no = ab.employee_code
      WHERE ab.bill_date BETWEEN ? AND ?
        ${shouldFilterEmployee ? "AND ab.employee_code = ?" : ""}
        ${shouldFilterStatus ? "AND ab.status = ?" : "AND ab.status <> 'cancelled'"}
      ORDER BY ${orderBy}
    `,
    params
  );

  if (!bills.length) {
    return { bills: [], grandTotal: 0 };
  }

  const billIds = bills.map((bill) => bill.id);
  const [items] = await pool.query(
    `
      SELECT
        abi.arrear_bill_id AS arrearBillId,
        abi.sr_no AS sr_no,
        abi.period_no AS period_no,
        abi.period_label AS period_label,
        abi.account_code AS account_code,
        COALESCE(NULLIF(abi.description, ''), wc.description) AS description,
        abi.amount AS amount
      FROM arrear_bill_items abi
      INNER JOIN wage_codes wc ON wc.code = abi.account_code
      WHERE abi.arrear_bill_id IN (${billIds.map(() => "?").join(",")})
      ORDER BY abi.arrear_bill_id ASC, abi.sr_no ASC
    `,
    billIds
  );

  const itemsByBillId = items.reduce((result, item) => {
    if (!result.has(item.arrearBillId)) {
      result.set(item.arrearBillId, []);
    }

    result.get(item.arrearBillId).push({
      sr_no: item.sr_no,
      period_no: item.period_no,
      period_label: item.period_label,
      account_code: item.account_code,
      description: item.description,
      amount: item.amount
    });
    return result;
  }, new Map());

  const data = bills.map((bill) => ({
    document_no: bill.document_no,
    bill_date: bill.bill_date,
    employee_code: bill.employee_code,
    employee_name: bill.employee_name,
    items: itemsByBillId.get(bill.id) || [],
    total_amount: bill.total_amount
  }));
  const grandTotal = data.reduce((total, bill) => total + Number(bill.total_amount || 0), 0);

  return { bills: data, grandTotal };
}

export async function employeeExists(employeeCode, connection = pool) {
  const [[row]] = await connection.query(
    "SELECT employee_no AS employeeCode, name FROM employees WHERE employee_no = ? LIMIT 1",
    [employeeCode]
  );
  return row || null;
}

export async function getWageCodeMap(codes, connection = pool) {
  if (!codes.length) {
    return new Map();
  }

  const [rows] = await connection.query(
    `SELECT code, description FROM wage_codes WHERE code IN (${codes.map(() => "?").join(",")})`,
    codes
  );

  return new Map(rows.map((row) => [row.code, row]));
}

export function normalizeArrearItems(items = []) {
  return items.map((item, index) => ({
    srNo: Number(item.srNo || index + 1),
    periodNo: Number(item.periodNo || index + 1),
    periodLabel: String(item.periodLabel || "").trim(),
    accountCode: String(item.accountCode || "").trim().padStart(4, "0"),
    description: String(item.description || "").trim(),
    amount: Number(item.amount || 0)
  }));
}

export function validateArrearPayload(payload, items) {
  if (!payload.billDate) {
    return "Bill date is required.";
  }

  if (!payload.employeeCode) {
    return "Employee code is required.";
  }

  if (!items.length) {
    return "At least one arrear line item is required.";
  }

  const invalidItem = items.find(
    (item) => !item.periodNo || !item.periodLabel || !/^\d{4}$/.test(item.accountCode) || item.amount <= 0
  );

  if (invalidItem) {
    return "Each line item needs period no, period label, valid wage code, and amount greater than 0.";
  }

  return "";
}

export async function createArrearBill(payload) {
  const connection = await pool.getConnection();
  const items = normalizeArrearItems(payload.items);
  const totalAmount = items.reduce((total, item) => total + item.amount, 0);
  const fiscalYearId = await resolveFiscalYearIdForDate(payload.billDate, connection);

  try {
    await connection.beginTransaction();

    const documentNo = await getNextDocumentNo(connection);
    const [result] = await connection.query(
      `
        INSERT INTO arrear_bills (
          document_no,
          bill_date,
          fiscal_year_id,
          place_of_posting,
          employee_code,
          total_amount
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        documentNo,
        payload.billDate,
        fiscalYearId,
        payload.placeOfPosting || "Hospital",
        payload.employeeCode,
        totalAmount
      ]
    );

    await insertArrearItems(connection, result.insertId, items);
    await connection.commit();
    return getArrearBillById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function insertArrearItems(connection, arrearBillId, items) {
  const values = items.map((item, index) => [
    arrearBillId,
    item.srNo || index + 1,
    item.periodNo || index + 1,
    item.periodLabel,
    item.accountCode,
    item.description || null,
    item.amount
  ]);

  await connection.query(
    `
      INSERT INTO arrear_bill_items (
        arrear_bill_id,
        sr_no,
        period_no,
        period_label,
        account_code,
        description,
        amount
      ) VALUES ?
    `,
    [values]
  );
}

export async function updateArrearBillById(id, payload) {
  const connection = await pool.getConnection();
  const items = normalizeArrearItems(payload.items);
  const totalAmount = items.reduce((total, item) => total + item.amount, 0);
  const fiscalYearId = await resolveFiscalYearIdForDate(payload.billDate, connection);

  try {
    await connection.beginTransaction();

    const [[existingBill]] = await connection.query("SELECT status FROM arrear_bills WHERE id = ? LIMIT 1", [id]);

    if (!existingBill) {
      await connection.rollback();
      return { status: "not_found" };
    }

    if (!editableStatuses.has(existingBill.status)) {
      await connection.rollback();
      return { status: "locked" };
    }

    await connection.query(
      `
        UPDATE arrear_bills
        SET bill_date = ?,
            fiscal_year_id = ?,
            place_of_posting = ?,
            employee_code = ?,
            total_amount = ?
        WHERE id = ?
      `,
      [
        payload.billDate,
        fiscalYearId,
        payload.placeOfPosting || "Hospital",
        payload.employeeCode,
        totalAmount,
        id
      ]
    );
    await connection.query("DELETE FROM arrear_bill_items WHERE arrear_bill_id = ?", [id]);
    await insertArrearItems(connection, id, items);
    await connection.commit();
    return { status: "updated", bill: await getArrearBillById(id) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteArrearBillById(id) {
  const [[existingBill]] = await pool.query("SELECT status FROM arrear_bills WHERE id = ? LIMIT 1", [id]);

  if (!existingBill) {
    return "not_found";
  }

  if (existingBill.status === "finalized") {
    return "finalized";
  }

  await pool.query("DELETE FROM arrear_bills WHERE id = ?", [id]);
  return "deleted";
}

export async function finalizeArrearBillById(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existingBill]] = await connection.query(
      `
        SELECT
          ab.id,
          ab.document_no AS documentNo,
          ab.bill_date AS billDate,
          ab.fiscal_year_id AS fiscalYearId,
          ab.employee_code AS employeeCode,
          ab.total_amount AS totalAmount,
          ab.status
        FROM arrear_bills ab
        WHERE ab.id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!existingBill) {
      await connection.rollback();
      return "not_found";
    }

    if (existingBill.status !== "draft") {
      await connection.rollback();
      return "locked";
    }

    const journal = await createArrearJournalEntry({
      connection,
      arrearBillId: existingBill.id,
      fiscalYearId: existingBill.fiscalYearId,
      billDate: existingBill.billDate,
      employeeCode: existingBill.employeeCode,
      documentNo: existingBill.documentNo,
      totalAmount: existingBill.totalAmount,
      postedBy: "Hospital Admin"
    });

    if (!journal) {
      await connection.rollback();
      return "locked";
    }

    const [result] = await connection.query(
      "UPDATE arrear_bills SET status = 'finalized' WHERE id = ? AND status = 'draft'",
      [id]
    );

    if (!result.affectedRows) {
      await connection.rollback();
      return "locked";
    }

    await connection.commit();
    return "finalized";
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function reopenArrearBillById(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existingBill]] = await connection.query(
      "SELECT id, document_no AS documentNo, status FROM arrear_bills WHERE id = ? LIMIT 1",
      [id]
    );

    if (!existingBill) {
      await connection.rollback();
      return { status: "not_found" };
    }

    if (existingBill.status !== "finalized") {
      await connection.rollback();
      return { status: "not_finalized", documentNo: existingBill.documentNo };
    }

    const [[paymentUsage]] = await connection.query(
      `
        SELECT COALESCE(SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END), 0) AS count
        FROM arrear_payments
        WHERE arrear_bill_id = ?
      `,
      [id]
    );

    if (Number(paymentUsage?.count || 0) > 0) {
      await connection.rollback();
      return { status: "has_payments", documentNo: existingBill.documentNo };
    }

    await reverseArrearJournalEntryByBillId(id, connection, "Hospital Admin");
    await connection.query("UPDATE arrear_bills SET status = 'draft' WHERE id = ?", [id]);
    await connection.commit();

    return { status: "reopened", documentNo: existingBill.documentNo, bill: await getArrearBillById(id) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateArrearBillStatusById(id, nextStatus) {
  if (!["draft", "finalized", "partially_paid", "paid", "cancelled"].includes(nextStatus)) {
    return { status: "invalid" };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existingBill]] = await connection.query(
      `
        SELECT
          ab.id,
          ab.document_no AS documentNo,
          ab.bill_date AS billDate,
          ab.fiscal_year_id AS fiscalYearId,
          ab.employee_code AS employeeCode,
          ab.total_amount AS totalAmount,
          ab.status
        FROM arrear_bills ab
        WHERE ab.id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!existingBill) {
      await connection.rollback();
      return { status: "not_found" };
    }

    if (existingBill.status === nextStatus) {
      await connection.rollback();
      return {
        status: "updated",
        previousStatus: existingBill.status,
        documentNo: existingBill.documentNo,
        bill: await getArrearBillById(id)
      };
    }

    if (existingBill.status === "draft" && nextStatus === "finalized") {
      const journal = await createArrearJournalEntry({
        connection,
        arrearBillId: id,
        fiscalYearId: existingBill.fiscalYearId,
        billDate: existingBill.billDate,
        employeeCode: existingBill.employeeCode,
        documentNo: existingBill.documentNo,
        totalAmount: existingBill.totalAmount,
        postedBy: "Hospital Admin"
      });

      if (!journal) {
        await connection.rollback();
        return { status: "locked" };
      }
    }

    if (existingBill.status === "finalized" && nextStatus !== "finalized") {
      await reverseArrearJournalEntryByBillId(id, connection, "Hospital Admin");
    }

    await connection.query("UPDATE arrear_bills SET status = ? WHERE id = ?", [nextStatus, id]);
    await connection.commit();

    return {
      status: "updated",
      previousStatus: existingBill.status,
      documentNo: existingBill.documentNo,
      bill: await getArrearBillById(id)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

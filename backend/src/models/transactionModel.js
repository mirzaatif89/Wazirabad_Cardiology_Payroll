import { env } from "../config/env.js";
import { pool } from "../config/database.js";

export async function ensureTransactionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS special_pay_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_code VARCHAR(50) NOT NULL,
      pay_month INT NOT NULL,
      pay_year INT NOT NULL,
      wage_code VARCHAR(4) NOT NULL,
      description VARCHAR(150),
      amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_special_pay (employee_code, pay_month, pay_year, wage_code),
      CONSTRAINT fk_special_pay_employee
        FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
      CONSTRAINT fk_special_pay_wage
        FOREIGN KEY (wage_code) REFERENCES wage_codes(code)
        ON UPDATE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cheque_prints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cheque_date DATE NOT NULL,
      payee_name VARCHAR(150) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      bank_type ENUM('BOP','SDA') NOT NULL,
      cheque_no VARCHAR(30),
      printed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      printed_by VARCHAR(100)
    )
  `);
}

export async function getSpecialPay(employeeCode, month, year) {
  const [[employee]] = await pool.query(
    `
      SELECT
        employee_no AS employeeCode,
        name,
        place_of_posting AS placeOfPosting,
        service_type AS serviceType,
        designation,
        bps,
        department,
        gaz_ng AS gazNg
      FROM employees
      WHERE employee_no = ?
      LIMIT 1
    `,
    [String(employeeCode)]
  );

  if (!employee) return null;

  const [rows] = await pool.query(
    `
      SELECT
        spe.id,
        spe.wage_code AS wageCode,
        COALESCE(NULLIF(spe.description, ''), wc.description) AS description,
        spe.amount
      FROM special_pay_entries spe
      LEFT JOIN wage_codes wc ON wc.code = spe.wage_code
      WHERE spe.employee_code = ?
        AND spe.pay_month = ?
        AND spe.pay_year = ?
      ORDER BY CAST(spe.wage_code AS UNSIGNED), spe.id
    `,
    [String(employeeCode), Number(month), Number(year)]
  );

  return { employee, entries: rows };
}

export async function upsertSpecialPay({ employeeCode, month, year, entries = [] }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[employee]] = await connection.query(
      "SELECT employee_no FROM employees WHERE employee_no = ? LIMIT 1",
      [String(employeeCode)]
    );

    if (!employee) {
      await connection.rollback();
      return { status: "missing_employee" };
    }

    const cleanEntries = entries
      .filter((entry) => entry.wageCode || entry.wage_code)
      .map((entry) => ({
        wageCode: String(entry.wageCode || entry.wage_code).padStart(4, "0"),
        amount: Number(entry.amount || 0)
      }));

    if (cleanEntries.length) {
      const [wageRows] = await connection.query(
        `SELECT code, description FROM wage_codes WHERE code IN (${cleanEntries.map(() => "?").join(",")})`,
        cleanEntries.map((entry) => entry.wageCode)
      );
      const wageMap = new Map(wageRows.map((row) => [row.code, row.description]));
      const missingCode = cleanEntries.find((entry) => !wageMap.has(entry.wageCode));

      if (missingCode) {
        await connection.rollback();
        return { status: "missing_wage_code", code: missingCode.wageCode };
      }

      for (const entry of cleanEntries) {
        await connection.query(
          `
            INSERT INTO special_pay_entries (
              employee_code,
              pay_month,
              pay_year,
              wage_code,
              description,
              amount
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              description = VALUES(description),
              amount = VALUES(amount),
              updated_at = CURRENT_TIMESTAMP
          `,
          [
            String(employeeCode),
            Number(month),
            Number(year),
            entry.wageCode,
            wageMap.get(entry.wageCode),
            entry.amount
          ]
        );
      }
    }

    await connection.commit();
    return { status: "saved", data: await getSpecialPay(employeeCode, month, year) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteSpecialPayEntry(id) {
  const [result] = await pool.query("DELETE FROM special_pay_entries WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function createChequePrint({ chequeDate, payeeName, amount, bankType, printedBy = "Hospital Admin" }) {
  const [result] = await pool.query(
    `
      INSERT INTO cheque_prints (
        cheque_date,
        payee_name,
        amount,
        bank_type,
        cheque_no,
        printed_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      chequeDate,
      payeeName,
      Number(amount),
      bankType,
      `${bankType}-${Date.now()}`,
      printedBy
    ]
  );

  const [[row]] = await pool.query(
    `
      SELECT
        id,
        cheque_no AS chequeNo,
        DATE_FORMAT(cheque_date, '%Y-%m-%d') AS chequeDate,
        payee_name AS payeeName,
        amount,
        bank_type AS bankType,
        DATE_FORMAT(printed_at, '%Y-%m-%d %H:%i:%s') AS printedAt
      FROM cheque_prints
      WHERE id = ?
    `,
    [result.insertId]
  );

  return row;
}

function monthSerial(month, year) {
  return Number(year) * 12 + Number(month);
}

export async function getAllowancesExport({ fromMonth, fromYear, toMonth, toYear }) {
  const fromSerial = monthSerial(fromMonth, fromYear);
  const toSerial = monthSerial(toMonth, toYear);
  const [regularRows] = await pool.query(
    `
      SELECT
        e.employee_no AS employeeCode,
        e.name,
        LPAD(ea.allowance_code, 4, '0') AS wageCode,
        COALESCE(NULLIF(ea.description, ''), wc.description) AS description,
        ea.amount,
        DATE_FORMAT(ea.created_at, '%Y-%m-%d') AS effectiveDate
      FROM employee_allowances ea
      INNER JOIN employees e ON e.id = ea.employee_id
      LEFT JOIN wage_codes wc ON wc.code = LPAD(ea.allowance_code, 4, '0')
      WHERE (YEAR(ea.created_at) * 12 + MONTH(ea.created_at)) BETWEEN ? AND ?
      ORDER BY CAST(e.employee_no AS UNSIGNED), e.employee_no, CAST(ea.allowance_code AS UNSIGNED)
    `,
    [fromSerial, toSerial]
  );

  const [specialRows] = await pool.query(
    `
      SELECT
        e.employee_no AS employeeCode,
        e.name,
        spe.wage_code AS wageCode,
        COALESCE(NULLIF(spe.description, ''), wc.description) AS description,
        spe.amount,
        CONCAT(spe.pay_year, '-', LPAD(spe.pay_month, 2, '0'), '-01') AS effectiveDate
      FROM special_pay_entries spe
      INNER JOIN employees e ON e.employee_no = spe.employee_code
      LEFT JOIN wage_codes wc ON wc.code = spe.wage_code
      WHERE (spe.pay_year * 12 + spe.pay_month) BETWEEN ? AND ?
      ORDER BY CAST(e.employee_no AS UNSIGNED), e.employee_no, CAST(spe.wage_code AS UNSIGNED)
    `,
    [fromSerial, toSerial]
  );

  const rows = [...regularRows, ...specialRows];
  return { rows, grandTotal: rows.reduce((total, row) => total + Number(row.amount || 0), 0) };
}

export async function getTaxScheduleExport({ fromMonth, fromYear, toMonth, toYear }) {
  const fromSerial = monthSerial(fromMonth, fromYear);
  const toSerial = monthSerial(toMonth, toYear);
  const [rows] = await pool.query(
    `
      SELECT
        pri.employee_code AS employeeCode,
        e.name,
        prid.amount AS taxAmount,
        pr.payment_month AS month,
        pr.payment_year AS year
      FROM payroll_run_item_details prid
      INNER JOIN payroll_run_items pri ON pri.id = prid.payroll_run_item_id
      INNER JOIN payroll_runs pr ON pr.id = pri.payroll_run_id
      INNER JOIN employees e ON e.employee_no = pri.employee_code
      WHERE prid.wage_code = ?
        AND (pr.payment_year * 12 + pr.payment_month) BETWEEN ? AND ?
      ORDER BY pr.payment_year, pr.payment_month, CAST(pri.employee_code AS UNSIGNED), pri.employee_code
    `,
    [env.reportScheduleDefaults.incomeTax, fromSerial, toSerial]
  );

  return { rows, grandTotal: rows.reduce((total, row) => total + Number(row.taxAmount || 0), 0) };
}

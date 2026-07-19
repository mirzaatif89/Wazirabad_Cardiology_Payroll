import { pool } from "../config/database.js";
import { logAuditAction } from "./auditLogModel.js";

export async function ensurePayrollTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payroll_runs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payment_month INT NOT NULL,
      payment_year INT NOT NULL,
      dept_code VARCHAR(50) NOT NULL DEFAULT '999',
      status ENUM('draft','processed','locked') DEFAULT 'draft',
      processed_at TIMESTAMP NULL,
      processed_by VARCHAR(100),
      UNIQUE KEY uniq_run (payment_month, payment_year, dept_code)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payroll_run_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payroll_run_id INT NOT NULL,
      employee_code VARCHAR(50) NOT NULL,
      gross_pay DECIMAL(12, 2) NOT NULL,
      total_deductions DECIMAL(12, 2) NOT NULL,
      net_pay DECIMAL(12, 2) NOT NULL,
      bank_code VARCHAR(50) NULL,
      bank_branch_code VARCHAR(50) NULL,
      account_no VARCHAR(30) NULL,
      is_bank_salary BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_payroll_items_run
        FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_payroll_items_employee
        FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
        ON UPDATE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payroll_run_item_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payroll_run_item_id INT NOT NULL,
      wage_code VARCHAR(4) NOT NULL,
      description VARCHAR(150),
      amount DECIMAL(10, 2) NOT NULL,
      CONSTRAINT fk_payroll_details_item
        FOREIGN KEY (payroll_run_item_id) REFERENCES payroll_run_items(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_payroll_details_wage
        FOREIGN KEY (wage_code) REFERENCES wage_codes(code)
        ON UPDATE CASCADE
    )
  `);
}

function monthEndDate(month, year) {
  return `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
}

function employeeWhere({ deptCode = "999", gazNg = "A", reportFor = "All" } = {}, alias = "e") {
  const clauses = ["1 = 1"];
  const params = [];

  if (deptCode && String(deptCode) !== "999") {
    clauses.push(`${alias}.department_code = ?`);
    params.push(String(deptCode));
  }

  if (gazNg === "G") clauses.push(`(${alias}.gaz_ng LIKE 'Gaz%' OR ${alias}.gaz_ng = 'G')`);
  if (gazNg === "N") clauses.push(`(${alias}.gaz_ng LIKE 'Non%' OR ${alias}.gaz_ng = 'N')`);

  if (reportFor && reportFor !== "All") {
    clauses.push(`${alias}.service_type = ?`);
    params.push(reportFor);
  }

  return { where: clauses.join(" AND "), params };
}

async function getEmployeesForPayroll(connection, filters = {}) {
  const { where, params } = employeeWhere(filters);
  const [rows] = await connection.query(
    `
      SELECT
        e.id,
        e.employee_no AS employeeCode,
        e.name,
        e.department,
        e.department_code AS departmentCode,
        e.designation,
        e.bps,
        e.gaz_ng AS gazNg,
        e.bank_code AS bankCode,
        e.bank_branch_code AS bankBranchCode,
        e.account_no AS accountNo
      FROM employees e
      WHERE ${where}
        AND COALESCE(e.status, 'active') = 'active'
      ORDER BY CAST(e.employee_no AS UNSIGNED), e.employee_no
    `,
    params
  );
  return rows;
}

async function findEmployeeForPayroll(employeeCode, connection = pool) {
  const [[employee]] = await connection.query(
    `
      SELECT
        e.id,
        e.employee_no AS employeeCode,
        e.name,
        e.department,
        e.department_code AS departmentCode,
        e.designation,
        e.bps,
        e.gaz_ng AS gazNg,
        e.bank_code AS bankCode,
        e.bank_branch_code AS bankBranchCode,
        e.account_no AS accountNo
      FROM employees e
      WHERE e.employee_no = ?
        AND COALESCE(e.status, 'active') = 'active'
      LIMIT 1
    `,
    [String(employeeCode)]
  );
  return employee || null;
}

async function tableExists(tableName, connection = pool) {
  const [rows] = await connection.query("SHOW TABLES LIKE ?", [tableName]);
  return rows.length > 0;
}

export async function calculateEmployeePayroll(employeeOrCode, paymentMonth, paymentYear, connection = pool) {
  const employee = typeof employeeOrCode === "object"
    ? employeeOrCode
    : await findEmployeeForPayroll(employeeOrCode, connection);

  if (!employee) {
    return { grossPay: 0, totalDeductions: 0, netPay: 0, lineItems: [], details: [] };
  }

  const validDate = monthEndDate(paymentMonth, paymentYear);
  const [details] = await connection.query(
    `
      SELECT
        LPAD(ea.allowance_code, 4, '0') AS wageCode,
        COALESCE(NULLIF(ea.description, ''), wc.description) AS description,
        ea.amount,
        CAST(ea.allowance_code AS UNSIGNED) AS numericCode
      FROM employee_allowances ea
      LEFT JOIN wage_codes wc ON wc.code = LPAD(ea.allowance_code, 4, '0')
      WHERE ea.employee_id = ?
        AND (ea.upto IS NULL OR ea.upto >= ?)
      ORDER BY CAST(ea.allowance_code AS UNSIGNED), ea.sr_no
    `,
    [employee.id, validDate]
  );
  let specialDetails = [];

  if (await tableExists("special_pay_entries", connection)) {
    [specialDetails] = await connection.query(
      `
        SELECT
          spe.wage_code AS wageCode,
          COALESCE(NULLIF(spe.description, ''), wc.description) AS description,
          spe.amount,
          CAST(spe.wage_code AS UNSIGNED) AS numericCode
        FROM special_pay_entries spe
        LEFT JOIN wage_codes wc ON wc.code = spe.wage_code
        WHERE spe.employee_code = ?
          AND spe.pay_month = ?
          AND spe.pay_year = ?
        ORDER BY CAST(spe.wage_code AS UNSIGNED), spe.id
      `,
      [employee.employeeCode, Number(paymentMonth), Number(paymentYear)]
    );
  }

  const lines = [...details, ...specialDetails].map((detail) => ({
    wageCode: detail.wageCode,
    description: detail.description || "",
    amount: Number(detail.amount || 0),
    numericCode: Number(detail.numericCode || 0)
  }));
  const grossPay = lines
    .filter((line) => line.numericCode >= 1 && line.numericCode <= 3999)
    .reduce((total, line) => total + line.amount, 0);
  const totalDeductions = lines
    .filter((line) => line.numericCode >= 4001)
    .reduce((total, line) => total + line.amount, 0);
  const netPay = grossPay - totalDeductions;
  const isBankSalary = Boolean(String(employee.bankCode || "").trim() && String(employee.accountNo || "").trim());

  return { grossPay, totalDeductions, netPay, isBankSalary, lineItems: lines, details: lines };
}

export async function processPayroll({ paymentMonth, paymentYear, deptCode = "999", gazNg = "A", reportFor = "All", processedBy = "Hospital Admin" }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existingRun]] = await connection.query(
      "SELECT id, status FROM payroll_runs WHERE payment_month = ? AND payment_year = ? AND dept_code = ? LIMIT 1",
      [paymentMonth, paymentYear, String(deptCode)]
    );

    if (existingRun && ["processed", "locked"].includes(existingRun.status)) {
      await connection.rollback();
      return { status: "already_processed", runId: existingRun.id };
    }

    let runId = existingRun?.id;

    if (!runId) {
      const [result] = await connection.query(
        "INSERT INTO payroll_runs (payment_month, payment_year, dept_code, status, processed_by) VALUES (?, ?, ?, 'draft', ?)",
        [paymentMonth, paymentYear, String(deptCode), processedBy]
      );
      runId = result.insertId;
    } else {
      await connection.query("DELETE FROM payroll_run_items WHERE payroll_run_id = ?", [runId]);
    }

    const employees = await getEmployeesForPayroll(connection, { deptCode, gazNg, reportFor });
    const results = [];

    for (const employee of employees) {
      const calculated = await calculateEmployeePayroll(employee, paymentMonth, paymentYear, connection);
      const [itemResult] = await connection.query(
        `
          INSERT INTO payroll_run_items (
            payroll_run_id,
            employee_code,
            gross_pay,
            total_deductions,
            net_pay,
            bank_code,
            bank_branch_code,
            account_no,
            is_bank_salary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          runId,
          employee.employeeCode,
          calculated.grossPay,
          calculated.totalDeductions,
          calculated.netPay,
          employee.bankCode || null,
          employee.bankBranchCode || null,
          employee.accountNo || null,
          calculated.isBankSalary ? 1 : 0
        ]
      );

      const cleanDetails = calculated.details.filter((detail) => detail.amount !== 0);
      if (cleanDetails.length) {
        await connection.query(
          `
            INSERT INTO payroll_run_item_details (
              payroll_run_item_id,
              wage_code,
              description,
              amount
            ) VALUES ?
          `,
          [cleanDetails.map((detail) => [itemResult.insertId, detail.wageCode, detail.description, detail.amount])]
        );
      }

      results.push({
        employeeCode: employee.employeeCode,
        name: employee.name,
        department: employee.department,
        departmentCode: employee.departmentCode,
        designation: employee.designation,
        grossPay: calculated.grossPay,
        totalDeductions: calculated.totalDeductions,
        netPay: calculated.netPay
      });
    }

    await connection.query(
      "UPDATE payroll_runs SET status = 'processed', processed_at = CURRENT_TIMESTAMP, processed_by = ? WHERE id = ?",
      [processedBy, runId]
    );
    await connection.commit();

    return {
      status: "processed",
      runId,
      run_id: runId,
      employeesProcessed: results.length,
      employees_processed: results.length,
      totalGross: results.reduce((total, item) => total + item.grossPay, 0),
      total_gross: results.reduce((total, item) => total + item.grossPay, 0),
      totalDeductions: results.reduce((total, item) => total + item.totalDeductions, 0),
      total_deductions: results.reduce((total, item) => total + item.totalDeductions, 0),
      totalNet: results.reduce((total, item) => total + item.netPay, 0),
      total_net: results.reduce((total, item) => total + item.netPay, 0),
      employees: results,
      items: results,
      totals: results.reduce((sum, item) => ({
        grossPay: sum.grossPay + item.grossPay,
        totalDeductions: sum.totalDeductions + item.totalDeductions,
        netPay: sum.netPay + item.netPay
      }), { grossPay: 0, totalDeductions: 0, netPay: 0 })
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getCurrentPayrollPeriod() {
  const [[run]] = await pool.query(
    `
      SELECT
        id,
        payment_month AS paymentMonth,
        payment_year AS paymentYear,
        dept_code AS deptCode,
        status,
        processed_at AS processedAt,
        processed_by AS processedBy
      FROM payroll_runs
      WHERE status = 'draft'
      ORDER BY payment_year DESC, payment_month DESC, id DESC
      LIMIT 1
    `
  );
  return run || null;
}

export async function countPayrollEmployees({ deptCode = "999", gazNg = "A", reportFor = "All" } = {}) {
  const { where, params } = employeeWhere({ deptCode, gazNg, reportFor });
  const [[row]] = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM employees e
      WHERE ${where}
        AND COALESCE(e.status, 'active') = 'active'
    `,
    params
  );
  return Number(row?.count || 0);
}

export async function getPayrollRuns({ month = "", year = "", deptCode = "" } = {}) {
  const [rows] = await pool.query(
    `
      SELECT
        pr.id,
        pr.payment_month AS paymentMonth,
        pr.payment_year AS paymentYear,
        pr.dept_code AS deptCode,
        pr.status,
        pr.processed_at AS processedAt,
        COUNT(pri.id) AS employeeCount,
        COALESCE(SUM(pri.gross_pay), 0) AS totalGross,
        COALESCE(SUM(pri.total_deductions), 0) AS totalDeductions,
        COALESCE(SUM(pri.net_pay), 0) AS totalNet
      FROM payroll_runs pr
      LEFT JOIN payroll_run_items pri ON pri.payroll_run_id = pr.id
      WHERE (? = '' OR pr.payment_month = ?)
        AND (? = '' OR pr.payment_year = ?)
        AND (? = '' OR pr.dept_code = ?)
      GROUP BY pr.id
      ORDER BY pr.payment_year DESC, pr.payment_month DESC, pr.dept_code ASC
    `,
    [month, month, year, year, deptCode, deptCode]
  );
  return rows;
}

export async function getPayrollRunById(id) {
  const [[run]] = await pool.query(
    `
      SELECT
        pr.id,
        pr.payment_month AS paymentMonth,
        pr.payment_year AS paymentYear,
        pr.dept_code AS deptCode,
        pr.status,
        pr.processed_at AS processedAt,
        pr.processed_by AS processedBy
      FROM payroll_runs pr
      WHERE pr.id = ?
      LIMIT 1
    `,
    [id]
  );

  if (!run) return null;

  const [employees] = await pool.query(
    `
      SELECT
        pri.id AS itemId,
        pri.employee_code AS employeeCode,
        e.name,
        e.department,
        e.department_code AS departmentCode,
        e.designation,
        pri.gross_pay AS grossPay,
        pri.total_deductions AS totalDeductions,
        pri.net_pay AS netPay
      FROM payroll_run_items pri
      LEFT JOIN employees e ON e.employee_no = pri.employee_code
      WHERE pri.payroll_run_id = ?
      ORDER BY CAST(pri.employee_code AS UNSIGNED), pri.employee_code
    `,
    [id]
  );
  const totals = employees.reduce((sum, employee) => ({
    grossPay: sum.grossPay + Number(employee.grossPay || 0),
    totalDeductions: sum.totalDeductions + Number(employee.totalDeductions || 0),
    netPay: sum.netPay + Number(employee.netPay || 0)
  }), { grossPay: 0, totalDeductions: 0, netPay: 0 });

  return {
    ...run,
    employees,
    items: employees,
    employeesProcessed: employees.length,
    employees_processed: employees.length,
    totalGross: totals.grossPay,
    total_gross: totals.grossPay,
    totalDeductions: totals.totalDeductions,
    total_deductions: totals.totalDeductions,
    totalNet: totals.netPay,
    total_net: totals.netPay,
    totals
  };
}

export async function reopenPayrollRun(id) {
  const [[run]] = await pool.query("SELECT id, payment_month AS month, payment_year AS year, dept_code AS deptCode, status FROM payroll_runs WHERE id = ? LIMIT 1", [id]);
  if (!run) return "not_found";
  await pool.query("UPDATE payroll_runs SET status = 'draft' WHERE id = ?", [id]);
  await logAuditAction({
    action: "reopen",
    documentType: "payroll",
    documentNo: id,
    performedBy: "Hospital Admin",
    notes: `Reopened payroll run ${run.month}/${run.year} dept ${run.deptCode}.`
  });
  return "reopened";
}

async function getRun(filters = {}) {
  const [[run]] = await pool.query(
    "SELECT id FROM payroll_runs WHERE payment_month = ? AND payment_year = ? AND dept_code = ? AND status IN ('processed','locked') LIMIT 1",
    [filters.month, filters.year, String(filters.deptCode || "999")]
  );
  return run || null;
}

async function getRunRows(filters = {}, extraWhere = "") {
  const run = await getRun(filters);
  if (!run) return [];
  const { where, params } = employeeWhere(filters);
  const [rows] = await pool.query(
    `
      SELECT
        pri.id,
        pri.employee_code AS employeeCode,
        e.name,
        e.department,
        e.department_code AS departmentCode,
        e.designation,
        e.bps,
        e.gaz_ng AS gazNg,
        pri.gross_pay AS grossPay,
        pri.total_deductions AS totalDeductions,
        pri.net_pay AS netPay,
        pri.bank_code AS bankCode,
        bc.bank AS bankName,
        pri.bank_branch_code AS bankBranchCode,
        bbc.branch AS branchName,
        pri.account_no AS accountNo,
        pri.is_bank_salary AS isBankSalary
      FROM payroll_run_items pri
      INNER JOIN employees e ON e.employee_no = pri.employee_code
      LEFT JOIN bank_codes bc ON bc.code = pri.bank_code
      LEFT JOIN bank_branch_codes bbc ON bbc.code = pri.bank_branch_code
      WHERE pri.payroll_run_id = ?
        AND ${where}
        ${extraWhere}
      ORDER BY e.department, CAST(pri.employee_code AS UNSIGNED), pri.employee_code
    `,
    [run.id, ...params]
  );
  return rows;
}

export async function getBankSummary(filters) {
  const rows = await getRunRows(filters, "AND pri.is_bank_salary = 1");
  const banks = [];
  rows.forEach((row) => {
    const bankName = row.bankName || row.bankCode || "Unknown Bank";
    let bank = banks.find((item) => item.bankName === bankName);
    if (!bank) {
      bank = { bankName, branches: [], total: 0 };
      banks.push(bank);
    }
    const branchName = row.branchName || row.bankBranchCode || "Unknown Branch";
    let branch = bank.branches.find((item) => item.branchName === branchName);
    if (!branch) {
      branch = { branchName, employees: [], subtotal: 0 };
      bank.branches.push(branch);
    }
    const employee = { employeeCode: row.employeeCode, name: row.name, accountNo: row.accountNo, netPay: Number(row.netPay || 0) };
    branch.employees.push(employee);
    branch.subtotal += employee.netPay;
    bank.total += employee.netPay;
  });
  return { banks, grandTotal: rows.reduce((total, row) => total + Number(row.netPay || 0), 0) };
}

export async function getNonBankSalary(filters) {
  const rows = await getRunRows(filters, "AND pri.is_bank_salary = 0");
  return { rows, grandTotal: rows.reduce((total, row) => total + Number(row.netPay || 0), 0) };
}

export async function getGrandBankSummary(filters) {
  const rows = await getRunRows(filters, "AND pri.is_bank_salary = 1");
  const banks = Object.values(rows.reduce((result, row) => {
    const key = row.bankName || row.bankCode || "Unknown Bank";
    if (!result[key]) result[key] = { bankName: key, employeeCount: 0, totalAmount: 0 };
    result[key].employeeCount += 1;
    result[key].totalAmount += Number(row.netPay || 0);
    return result;
  }, {}));
  return { banks, grandTotal: banks.reduce((total, bank) => total + bank.totalAmount, 0) };
}

export async function getPaymentList(filters) {
  const rows = await getRunRows(filters);
  return { rows, totals: rows.reduce((sum, row) => ({
    grossPay: sum.grossPay + Number(row.grossPay || 0),
    totalDeductions: sum.totalDeductions + Number(row.totalDeductions || 0),
    netPay: sum.netPay + Number(row.netPay || 0)
  }), { grossPay: 0, totalDeductions: 0, netPay: 0 }) };
}

export async function getListOfPayment(filters) {
  const report = await getPaymentList(filters);
  const departments = Object.values(report.rows.reduce((result, row) => {
    const key = row.department || "No Department";
    if (!result[key]) result[key] = { department: key, rows: [], subtotal: 0 };
    result[key].rows.push(row);
    result[key].subtotal += Number(row.netPay || 0);
    return result;
  }, {}));
  return { departments, totals: report.totals };
}

export async function getPayrollScaleAudit({ reportFor = "All", month, year }) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = monthEndDate(month, year);
  const { where, params } = employeeWhere({ reportFor });
  const [rows] = await pool.query(
    `
      SELECT
        esh.employee_code AS employeeCode,
        e.name,
        e.department,
        e.designation,
        esh.old_bps AS oldBps,
        esh.new_bps AS newBps,
        DATE_FORMAT(esh.effective_date, '%Y-%m-%d') AS effectiveDate
      FROM employee_scale_history esh
      INNER JOIN employees e ON e.employee_no = esh.employee_code
      WHERE esh.effective_date BETWEEN ? AND ?
        AND ${where}
      ORDER BY CAST(esh.employee_code AS UNSIGNED), esh.effective_date
    `,
    [start, end, ...params]
  );
  return { rows };
}

export async function getBudgetRequirement({ endingDate }) {
  const [rows] = await pool.query(
    `
      SELECT
        LPAD(ea.allowance_code, 4, '0') AS wageCode,
        COALESCE(NULLIF(ea.description, ''), wc.description) AS description,
        COALESCE(SUM(ea.amount), 0) AS totalAmount
      FROM employee_allowances ea
      INNER JOIN employees e ON e.id = ea.employee_id
      LEFT JOIN wage_codes wc ON wc.code = LPAD(ea.allowance_code, 4, '0')
      WHERE COALESCE(e.status, 'active') = 'active'
        AND (ea.upto IS NULL OR ea.upto >= ?)
      GROUP BY LPAD(ea.allowance_code, 4, '0'), COALESCE(NULLIF(ea.description, ''), wc.description)
      ORDER BY CAST(wageCode AS UNSIGNED)
    `,
    [endingDate]
  );
  const lines = rows.map((row) => ({ wageCode: row.wageCode, description: row.description, totalAmount: Number(row.totalAmount || 0) }));
  return { rows: lines, grandTotal: lines.reduce((total, row) => total + row.totalAmount, 0), endingDate };
}

export async function getPayslips(filters) {
  const rows = await getRunRows(filters);
  if (!rows.length) return { slips: [] };
  const [details] = await pool.query(
    `
      SELECT
        prid.payroll_run_item_id AS itemId,
        prid.wage_code AS wageCode,
        prid.description,
        prid.amount,
        CAST(prid.wage_code AS UNSIGNED) AS numericCode
      FROM payroll_run_item_details prid
      WHERE prid.payroll_run_item_id IN (${rows.map(() => "?").join(",")})
      ORDER BY CAST(prid.wage_code AS UNSIGNED)
    `,
    rows.map((row) => row.id)
  );
  const detailMap = details.reduce((map, detail) => {
    if (!map.has(detail.itemId)) map.set(detail.itemId, []);
    map.get(detail.itemId).push(detail);
    return map;
  }, new Map());
  return { slips: rows.map((row) => ({ ...row, details: detailMap.get(row.id) || [] })) };
}

export async function getSinglePayslip({ employeeCode, month, year }) {
  const [runs] = await pool.query("SELECT id FROM payroll_runs WHERE payment_month = ? AND payment_year = ? AND status IN ('processed','locked')", [month, year]);
  if (!runs.length) return null;
  const runIds = runs.map((run) => run.id);
  const [rows] = await pool.query(
    `
      SELECT
        pri.id,
        pri.employee_code AS employeeCode,
        e.name,
        e.department,
        e.designation,
        e.bps,
        e.gaz_ng AS gazNg,
        pri.gross_pay AS grossPay,
        pri.total_deductions AS totalDeductions,
        pri.net_pay AS netPay
      FROM payroll_run_items pri
      INNER JOIN employees e ON e.employee_no = pri.employee_code
      WHERE pri.employee_code = ?
        AND pri.payroll_run_id IN (${runIds.map(() => "?").join(",")})
      LIMIT 1
    `,
    [employeeCode, ...runIds]
  );
  if (!rows.length) return null;
  const [details] = await pool.query(
    "SELECT wage_code AS wageCode, description, amount, CAST(wage_code AS UNSIGNED) AS numericCode FROM payroll_run_item_details WHERE payroll_run_item_id = ? ORDER BY CAST(wage_code AS UNSIGNED)",
    [rows[0].id]
  );
  return { ...rows[0], details };
}

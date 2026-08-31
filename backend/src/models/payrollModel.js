import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { logAuditAction } from "./auditLogModel.js";
import { createPayrollJournalEntry, getJournalEntryByPayrollRun, reversePayrollJournalEntryByRun } from "./journalModel.js";
import { getEmployeeAdvanceRecoveryPlan, recordEmployeeAdvanceRecoveries, reverseEmployeeAdvanceRecoveriesByRun } from "./employeeAdvanceModel.js";
import { getActiveFiscalYear, getFiscalYearById, getFiscalYearForDate } from "./fiscalYearModel.js";
import { calculatePayrollTaxDeduction, getActiveTaxPolicy } from "./taxSlabModel.js";
import { getWageCodeByCode } from "./wageCodeModel.js";

const INCOME_TAX_WAGE_CODE = String(env.reportScheduleDefaults.incomeTax || "6002").trim();

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function isTaxWageCode(wageCode) {
  return String(wageCode || "").trim().toUpperCase() === INCOME_TAX_WAGE_CODE.toUpperCase();
}

export async function ensurePayrollTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payroll_runs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fiscal_year_id INT NULL,
      payment_month INT NOT NULL,
      payment_year INT NOT NULL,
      dept_code VARCHAR(50) NOT NULL DEFAULT '999',
      status ENUM('draft','processed','locked','void') DEFAULT 'draft',
      processed_at TIMESTAMP NULL,
      processed_by VARCHAR(100),
      CONSTRAINT fk_payroll_runs_fiscal_year
        FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
        ON DELETE SET NULL,
      UNIQUE KEY uniq_run (payment_month, payment_year, dept_code)
    )
  `);

  const [fiscalYearColumns] = await pool.query("SHOW COLUMNS FROM payroll_runs LIKE 'fiscal_year_id'");
  if (!fiscalYearColumns.length) {
    await pool.query("ALTER TABLE payroll_runs ADD COLUMN fiscal_year_id INT NULL AFTER id");
  }

  const [statusColumns] = await pool.query("SHOW COLUMNS FROM payroll_runs LIKE 'status'");
  if (statusColumns.length) {
    await pool.query("ALTER TABLE payroll_runs MODIFY status ENUM('draft','processed','locked','void') DEFAULT 'draft'");
  }

  const [fiscalYearConstraint] = await pool.query(
    `
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'payroll_runs'
        AND CONSTRAINT_NAME = 'fk_payroll_runs_fiscal_year'
      LIMIT 1
    `
  );

  if (!fiscalYearConstraint.length) {
    await pool.query(`
      ALTER TABLE payroll_runs
      ADD CONSTRAINT fk_payroll_runs_fiscal_year
      FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
      ON DELETE SET NULL
    `);
  }

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

export async function ensurePayrollTaxSnapshotTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tax_generation_batches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fiscal_year_id INT NOT NULL,
      payment_month INT NOT NULL,
      payment_year INT NOT NULL,
      dept_code VARCHAR(50) NOT NULL DEFAULT '999',
      gaz_ng VARCHAR(30) NOT NULL DEFAULT 'A',
      report_for VARCHAR(50) NOT NULL DEFAULT 'All',
      generated_count INT NOT NULL DEFAULT 0,
      total_tax DECIMAL(14, 2) NOT NULL DEFAULT 0,
      generated_by VARCHAR(100) NULL,
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_tax_generation_batches_fiscal_year
        FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_tax_snapshots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_code VARCHAR(50) NOT NULL,
      generation_batch_id INT NULL,
      fiscal_year_id INT NOT NULL,
      effective_from_month INT NOT NULL,
      effective_from_year INT NOT NULL,
      tax_policy_id INT NULL,
      tax_policy_name VARCHAR(120) NULL,
      tax_basis ENUM('annual','monthly') NULL,
      gross_pay DECIMAL(14, 2) NOT NULL DEFAULT 0,
      taxable_income DECIMAL(14, 2) NOT NULL DEFAULT 0,
      annualized_income DECIMAL(14, 2) NOT NULL DEFAULT 0,
      effective_taxable_income DECIMAL(14, 2) NOT NULL DEFAULT 0,
      prior_employer_tax_credit DECIMAL(14, 2) NOT NULL DEFAULT 0,
      company_tax_paid_ytd DECIMAL(14, 2) NOT NULL DEFAULT 0,
      credit_balance DECIMAL(14, 2) NOT NULL DEFAULT 0,
      remaining_annual_tax DECIMAL(14, 2) NOT NULL DEFAULT 0,
      months_remaining INT NULL,
      tax_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
      annual_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
      slab_sr_no INT NULL,
      slab_from_income DECIMAL(14, 2) NULL,
      slab_to_income DECIMAL(14, 2) NULL,
      slab_rate DECIMAL(6, 2) NULL,
      slab_fixed_tax DECIMAL(14, 2) NULL,
      status ENUM('active','superseded') NOT NULL DEFAULT 'active',
      generated_by VARCHAR(100) NULL,
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      superseded_at TIMESTAMP NULL,
      CONSTRAINT fk_tax_snapshots_employee
        FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
      CONSTRAINT fk_tax_snapshots_batch
        FOREIGN KEY (generation_batch_id) REFERENCES tax_generation_batches(id)
        ON DELETE SET NULL,
      CONSTRAINT fk_tax_snapshots_fiscal_year
        FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_tax_snapshots_policy
        FOREIGN KEY (tax_policy_id) REFERENCES tax_policies(id)
        ON DELETE SET NULL
    )
  `);

  const [batchColumns] = await pool.query("SHOW COLUMNS FROM employee_tax_snapshots LIKE 'generation_batch_id'");
  if (!batchColumns.length) {
    await pool.query("ALTER TABLE employee_tax_snapshots ADD COLUMN generation_batch_id INT NULL AFTER employee_code");
  }

  const [batchConstraint] = await pool.query(
    `
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'employee_tax_snapshots'
        AND CONSTRAINT_NAME = 'fk_tax_snapshots_batch'
      LIMIT 1
    `
  );

  if (!batchConstraint.length) {
    await pool.query(`
      ALTER TABLE employee_tax_snapshots
      ADD CONSTRAINT fk_tax_snapshots_batch
      FOREIGN KEY (generation_batch_id) REFERENCES tax_generation_batches(id)
      ON DELETE SET NULL
    `);
  }
}

function monthEndDate(month, year) {
  return `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
}

function toPeriodIndex(month, year) {
  return Number(year) * 12 + Number(month);
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
  const activeOnDate = filters.activeOnDate || new Date().toISOString().slice(0, 10);
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
        e.prior_employer_tax_credit AS priorEmployerTaxCredit,
        e.bank_code AS bankCode,
        e.bank_branch_code AS bankBranchCode,
        e.account_no AS accountNo
      FROM employees e
      WHERE ${where}
        AND COALESCE(e.status, 'active') = 'active'
        AND (e.stop_date IS NULL OR e.stop_date > ?)
      ORDER BY CAST(e.employee_no AS UNSIGNED), e.employee_no
    `,
    [...params, activeOnDate]
  );
  return rows;
}

async function findEmployeeForPayroll(employeeCode, connection = pool, activeOnDate = new Date().toISOString().slice(0, 10)) {
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
        e.prior_employer_tax_credit AS priorEmployerTaxCredit,
        e.bank_code AS bankCode,
        e.bank_branch_code AS bankBranchCode,
        e.account_no AS accountNo
      FROM employees e
      WHERE e.employee_no = ?
        AND COALESCE(e.status, 'active') = 'active'
        AND (e.stop_date IS NULL OR e.stop_date > ?)
      LIMIT 1
    `,
    [String(employeeCode), activeOnDate]
  );
  return employee || null;
}

async function tableExists(tableName, connection = pool) {
  const [rows] = await connection.query("SHOW TABLES LIKE ?", [tableName]);
  return rows.length > 0;
}

async function getStoredEmployeeTaxSnapshot(employeeCode, fiscalYearId, paymentMonth, paymentYear, connection = pool) {
  if (!employeeCode || !fiscalYearId) {
    return null;
  }

  const [rows] = await connection.query(
    `
      SELECT
        ets.id,
        ets.employee_code AS employeeCode,
        ets.fiscal_year_id AS fiscalYearId,
        ets.effective_from_month AS effectiveFromMonth,
        ets.effective_from_year AS effectiveFromYear,
        ets.tax_policy_id AS taxPolicyId,
        ets.tax_policy_name AS taxPolicyName,
        ets.tax_basis AS taxBasis,
        ets.gross_pay AS grossPay,
        ets.taxable_income AS taxableIncome,
        ets.annualized_income AS annualizedIncome,
        ets.effective_taxable_income AS effectiveTaxableIncome,
        ets.prior_employer_tax_credit AS priorEmployerTaxCredit,
        ets.company_tax_paid_ytd AS companyTaxPaidYTD,
        ets.credit_balance AS creditBalance,
        ets.remaining_annual_tax AS remainingAnnualTax,
        ets.months_remaining AS monthsRemaining,
        ets.tax_amount AS taxAmount,
        ets.annual_amount AS annualAmount,
        ets.slab_sr_no AS slabSrNo,
        ets.slab_from_income AS slabFromIncome,
        ets.slab_to_income AS slabToIncome,
        ets.slab_rate AS slabRate,
        ets.slab_fixed_tax AS slabFixedTax,
        ets.status,
        ets.generated_by AS generatedBy,
        ets.generated_at AS generatedAt
      FROM employee_tax_snapshots ets
      WHERE ets.employee_code = ?
        AND ets.fiscal_year_id = ?
        AND ets.status = 'active'
        AND (
          ets.effective_from_year < ?
          OR (ets.effective_from_year = ? AND ets.effective_from_month <= ?)
        )
      ORDER BY ets.effective_from_year DESC, ets.effective_from_month DESC, ets.id DESC
      LIMIT 1
    `,
    [String(employeeCode), fiscalYearId, Number(paymentYear), Number(paymentYear), Number(paymentMonth)]
  );

  const snapshot = rows[0];
  if (!snapshot) {
    return null;
  }

  const slab = snapshot.slabSrNo === null || snapshot.slabSrNo === undefined
    ? null
    : {
        srNo: Number(snapshot.slabSrNo || 0),
        fromIncome: Number(snapshot.slabFromIncome || 0),
        toIncome: snapshot.slabToIncome === null || snapshot.slabToIncome === undefined ? null : Number(snapshot.slabToIncome),
        rate: Number(snapshot.slabRate || 0),
        fixedTax: Number(snapshot.slabFixedTax || 0)
      };

  return {
    source: "stored",
    snapshotId: snapshot.id,
    amount: Number(snapshot.taxAmount || 0),
    annualAmount: Number(snapshot.annualAmount || 0),
    annualizedIncome: Number(snapshot.annualizedIncome || 0),
    effectiveTaxableIncome: Number(snapshot.effectiveTaxableIncome || 0),
    creditBalance: Number(snapshot.creditBalance || 0),
    remainingAnnualTax: Number(snapshot.remainingAnnualTax || 0),
    monthsRemaining: snapshot.monthsRemaining === null || snapshot.monthsRemaining === undefined ? null : Number(snapshot.monthsRemaining),
    basis: snapshot.taxBasis || null,
    taxableIncome: Number(snapshot.taxableIncome || 0),
    policy: snapshot.taxPolicyId ? {
      id: Number(snapshot.taxPolicyId),
      name: snapshot.taxPolicyName || null,
      basis: snapshot.taxBasis || null
    } : null,
    slab,
    priorTaxCredit: Number(snapshot.priorEmployerTaxCredit || 0),
    companyTaxPaidYTD: Number(snapshot.companyTaxPaidYTD || 0),
    grossPay: Number(snapshot.grossPay || 0)
  };
}

async function saveEmployeeTaxSnapshot({
  connection = pool,
  generationBatchId = null,
  employeeCode,
  fiscalYearId,
  paymentMonth,
  paymentYear,
  taxResult,
  grossPay,
  priorEmployerTaxCredit,
  companyTaxPaidYTD,
  generatedBy = "Hospital Admin"
}) {
  if (!employeeCode || !fiscalYearId) {
    return null;
  }

  await connection.query(
    `
      UPDATE employee_tax_snapshots
      SET status = 'superseded',
          superseded_at = CURRENT_TIMESTAMP
      WHERE employee_code = ?
        AND fiscal_year_id = ?
        AND status = 'active'
    `,
    [String(employeeCode), fiscalYearId]
  );

  const [result] = await connection.query(
    `
      INSERT INTO employee_tax_snapshots (
        employee_code,
        generation_batch_id,
        fiscal_year_id,
        effective_from_month,
        effective_from_year,
        tax_policy_id,
        tax_policy_name,
        tax_basis,
        gross_pay,
        taxable_income,
        annualized_income,
        effective_taxable_income,
        prior_employer_tax_credit,
        company_tax_paid_ytd,
        credit_balance,
        remaining_annual_tax,
        months_remaining,
        tax_amount,
        annual_amount,
        slab_sr_no,
        slab_from_income,
        slab_to_income,
        slab_rate,
        slab_fixed_tax,
        status,
        generated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `,
    [
      String(employeeCode),
      generationBatchId,
      fiscalYearId,
      Number(paymentMonth),
      Number(paymentYear),
      taxResult.policy?.id || null,
      taxResult.policy?.name || null,
      taxResult.basis || taxResult.policy?.basis || null,
      roundCurrency(grossPay),
      roundCurrency(taxResult.taxableIncome ?? grossPay),
      roundCurrency(taxResult.annualizedIncome || 0),
      roundCurrency(taxResult.effectiveTaxableIncome || 0),
      roundCurrency(priorEmployerTaxCredit || 0),
      roundCurrency(companyTaxPaidYTD || 0),
      roundCurrency(taxResult.creditBalance || 0),
      roundCurrency(taxResult.remainingAnnualTax || 0),
      taxResult.monthsRemaining || null,
      roundCurrency(taxResult.amount || 0),
      roundCurrency(taxResult.annualAmount || 0),
      taxResult.slab?.srNo || null,
      taxResult.slab?.fromIncome ?? null,
      taxResult.slab?.toIncome ?? null,
      taxResult.slab?.rate ?? null,
      taxResult.slab?.fixedTax ?? null,
      generatedBy
    ]
  );

  return result.insertId;
}

async function getEmployeeTaxPaidToDate(employeeCode, fiscalYearId, paymentMonth, paymentYear, connection = pool) {
  if (!fiscalYearId) {
    return 0;
  }

  const [[row]] = await connection.query(
    `
      SELECT COALESCE(SUM(prid.amount), 0) AS taxPaid
      FROM payroll_runs pr
      INNER JOIN payroll_run_items pri ON pri.payroll_run_id = pr.id
      INNER JOIN payroll_run_item_details prid ON prid.payroll_run_item_id = pri.id
      WHERE pr.fiscal_year_id = ?
        AND pri.employee_code = ?
        AND pr.status IN ('processed', 'locked')
        AND prid.wage_code = ?
        AND (
          pr.payment_year < ?
          OR (pr.payment_year = ? AND pr.payment_month < ?)
        )
    `,
    [fiscalYearId, String(employeeCode), INCOME_TAX_WAGE_CODE, Number(paymentYear), Number(paymentYear), Number(paymentMonth)]
  );

  return Number(row?.taxPaid || 0);
}

function isGrossWageCode(code) {
  return code >= 1 && code <= 3999;
}

function isDeductionWageCode(code) {
  return code >= 4001 && code <= 6999;
}

export async function calculateEmployeePayroll(
  employeeOrCode,
  paymentMonth,
  paymentYear,
  connection = pool,
  fiscalYearId = null,
  options = {}
) {
  const {
    useStoredTax = true,
    saveTaxSnapshot = false,
    generatedBy = "Hospital Admin",
    generationBatchId = null
  } = options || {};
  const validDate = monthEndDate(paymentMonth, paymentYear);
  const employee = typeof employeeOrCode === "object"
    ? employeeOrCode
    : await findEmployeeForPayroll(employeeOrCode, connection, validDate);

  if (!employee) {
    return {
      grossPay: 0,
      totalDeductions: 0,
      netPay: 0,
      lineItems: [],
      details: [],
      taxAmount: 0,
      taxPolicyName: null,
      taxPreview: null
    };
  }

  const [details] = await connection.query(
    `
      SELECT
        LPAD(ea.allowance_code, 4, '0') AS wageCode,
        COALESCE(NULLIF(ea.description, ''), wc.description) AS description,
        ea.amount,
        CAST(ea.allowance_code AS UNSIGNED) AS numericCode,
        wc.attached_account_code AS attachedAccountCode
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
          CAST(spe.wage_code AS UNSIGNED) AS numericCode,
          wc.attached_account_code AS attachedAccountCode
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

  const lines = [...details, ...specialDetails]
    .map((detail) => ({
    wageCode: detail.wageCode,
    description: detail.description || "",
    amount: Number(detail.amount || 0),
    numericCode: Number(detail.numericCode || 0),
    attachedAccountCode: detail.attachedAccountCode || null
  }))
    .filter((detail) => !isTaxWageCode(detail.wageCode));

  const grossPay = lines
    .filter((line) => isGrossWageCode(line.numericCode))
    .reduce((total, line) => total + line.amount, 0);
  const taxWageCode = await getWageCodeByCode(INCOME_TAX_WAGE_CODE);
  const priorEmployerTaxCredit = Math.max(0, Number(employee.priorEmployerTaxCredit || 0));
  const companyTaxPaidYTD = await getEmployeeTaxPaidToDate(employee.employeeCode, fiscalYearId, paymentMonth, paymentYear, connection);
  const advanceRecoveryPlan = await getEmployeeAdvanceRecoveryPlan({
    employeeCode: employee.employeeCode,
    paymentMonth,
    paymentYear,
    connection
  });
  const advanceRecoveryLines = advanceRecoveryPlan.recoveries.map((recovery) => ({
    wageCode: recovery.wageCode,
    description: recovery.description,
    amount: recovery.amount,
    numericCode: recovery.numericCode,
    attachedAccountCode: "C02836",
    advanceId: recovery.advanceId
  }));
  const advanceRecoveryTotal = advanceRecoveryPlan.totalRecovery;
  let taxResult = null;

  if (useStoredTax) {
    taxResult = await getStoredEmployeeTaxSnapshot(employee.employeeCode, fiscalYearId, paymentMonth, paymentYear, connection);
  }

  if (!taxResult) {
    taxResult = await calculatePayrollTaxDeduction({
      fiscalYearId,
      taxableIncome: grossPay,
      paymentMonth,
      paymentYear,
      priorTaxCredit: priorEmployerTaxCredit,
      companyTaxPaidYTD,
      connection
    });
  }

  if (saveTaxSnapshot && taxResult?.source !== "stored") {
    await saveEmployeeTaxSnapshot({
      connection,
      generationBatchId,
      employeeCode: employee.employeeCode,
      fiscalYearId,
      paymentMonth,
      paymentYear,
      taxResult,
      grossPay,
      priorEmployerTaxCredit,
      companyTaxPaidYTD,
      generatedBy
    });
  }

  const taxAmount = Number(taxResult.amount || 0);
  const taxLine = taxAmount > 0 ? {
    wageCode: INCOME_TAX_WAGE_CODE,
    description: "INCOME TAX",
    amount: taxAmount,
    numericCode: Number(INCOME_TAX_WAGE_CODE) || 0,
    attachedAccountCode: taxWageCode?.attachedAccountCode || null
  } : null;
  const allDetails = taxLine ? [...lines, ...advanceRecoveryLines, taxLine] : [...lines, ...advanceRecoveryLines];
  const otherDeductions = allDetails
    .filter((line) => isDeductionWageCode(line.numericCode))
    .reduce((total, line) => total + Math.abs(line.amount), 0);
  const totalDeductions = otherDeductions + taxAmount;
  const netPay = grossPay - totalDeductions;
  const isBankSalary = Boolean(String(employee.bankCode || "").trim() && String(employee.accountNo || "").trim());

  return {
    grossPay,
    totalDeductions,
    netPay,
    isBankSalary,
    lineItems: allDetails,
    details: allDetails,
    taxAmount,
    taxPolicyName: taxResult.policy?.name || null,
    taxPreview: {
      policyName: taxResult.policy?.name || null,
      fiscalYearId,
      taxBasis: taxResult.basis || taxResult.policy?.basis || null,
      taxableIncome: Number(grossPay || 0),
      annualizedIncome: Number(taxResult.annualizedIncome || 0),
      effectiveTaxableIncome: Number(taxResult.effectiveTaxableIncome || 0),
      priorEmployerTaxCredit,
      companyTaxPaidYTD,
      creditBalance: Number(taxResult.creditBalance || 0),
      remainingAnnualTax: Number(taxResult.remainingAnnualTax || 0),
      monthsRemaining: taxResult.monthsRemaining || null,
      amount: taxAmount,
      annualAmount: Number(taxResult.annualAmount || 0),
      source: taxResult.source || "calculated",
      snapshotId: taxResult.snapshotId || null,
      slab: taxResult.slab
        ? {
            srNo: Number(taxResult.slab.srNo || 0),
            fromIncome: Number(taxResult.slab.fromIncome || 0),
            toIncome: taxResult.slab.toIncome === null || taxResult.slab.toIncome === undefined ? null : Number(taxResult.slab.toIncome),
            rate: Number(taxResult.slab.rate || 0),
            fixedTax: Number(taxResult.slab.fixedTax || 0)
          }
        : null
    },
    advanceRecoveries: advanceRecoveryPlan.recoveries,
    advanceRecoveryTotal
  };
}

function formatCurrencyValue(value) {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function summarizeTaxSlab(slab) {
  if (!slab) {
    return null;
  }

  const toIncome = slab.toIncome === null || slab.toIncome === undefined ? null : Number(slab.toIncome);
  const range = toIncome === null
    ? `PKR ${formatCurrencyValue(slab.fromIncome || 0)} and above`
    : `PKR ${formatCurrencyValue(slab.fromIncome || 0)} to PKR ${formatCurrencyValue(toIncome)}`;

  return {
    ...slab,
    range
  };
}

export async function previewPayroll({ paymentMonth, paymentYear, deptCode = "999", gazNg = "A", reportFor = "All" }) {
  const connection = pool;
  const validDate = monthEndDate(paymentMonth, paymentYear);
  const matchedFiscalYear = await getFiscalYearForDate(validDate, connection);
  const activeFiscalYear = matchedFiscalYear || await getActiveFiscalYear(connection);
  const fiscalYearId = activeFiscalYear?.id || null;
  const [[existingRun]] = await connection.query(
    `
      SELECT id, status
      FROM payroll_runs
      WHERE payment_month = ? AND payment_year = ? AND dept_code = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [paymentMonth, paymentYear, String(deptCode)]
  );
  const employees = await getEmployeesForPayroll(connection, { deptCode, gazNg, reportFor, activeOnDate: validDate });
  const results = [];

  for (const employee of employees) {
    const calculated = await calculateEmployeePayroll(employee, paymentMonth, paymentYear, connection, fiscalYearId);
    results.push({
      employeeCode: employee.employeeCode,
      name: employee.name,
      department: employee.department,
      departmentCode: employee.departmentCode,
      designation: employee.designation,
      grossPay: calculated.grossPay,
      totalDeductions: calculated.totalDeductions,
      netPay: calculated.netPay,
      taxAmount: calculated.taxAmount || 0,
      taxPolicyName: calculated.taxPolicyName || null,
      taxPreview: calculated.taxPreview ? {
        ...calculated.taxPreview,
        slab: summarizeTaxSlab(calculated.taxPreview.slab)
      } : null
    });
  }

  const totals = results.reduce((sum, item) => ({
    grossPay: sum.grossPay + Number(item.grossPay || 0),
    totalDeductions: sum.totalDeductions + Number(item.totalDeductions || 0),
    netPay: sum.netPay + Number(item.netPay || 0),
    taxAmount: sum.taxAmount + Number(item.taxAmount || 0)
  }), { grossPay: 0, totalDeductions: 0, netPay: 0, taxAmount: 0 });
  const previewTaxSource = results.find((item) => item.taxPolicyName || item.taxPreview);

  return {
    status: "preview",
    fiscalYearId,
    fiscalYear: activeFiscalYear,
    fiscalYearName: activeFiscalYear?.name || null,
    existingRunId: existingRun?.id || null,
    existingRunStatus: existingRun?.status || null,
    warningMessage: existingRun
      ? existingRun.status === "draft"
        ? "A draft payroll run already exists for this period. Posting again will replace its payroll journal."
        : "Payroll has already been posted for this period. Review the existing run before posting again."
      : null,
    paymentMonth,
    paymentYear,
    deptCode: String(deptCode),
    gazNg,
    reportFor,
    employeesProcessed: results.length,
    employees: results,
    items: results,
    totals,
    totalGross: totals.grossPay,
    totalDeductions: totals.totalDeductions,
    totalNet: totals.netPay,
    taxTotal: totals.taxAmount,
    taxPolicyName: previewTaxSource?.taxPolicyName || null,
    taxBasis: previewTaxSource?.taxPreview?.taxBasis || null
  };
}

export async function generateStoredPayrollTax({
  paymentMonth,
  paymentYear,
  fiscalYearId = null,
  deptCode = "999",
  gazNg = "A",
  reportFor = "All",
  generatedBy = "Hospital Admin"
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const validDate = monthEndDate(paymentMonth, paymentYear);
    const matchedFiscalYear = fiscalYearId ? await getFiscalYearById(fiscalYearId) : await getFiscalYearForDate(validDate, connection);
    const activeFiscalYear = matchedFiscalYear || await getActiveFiscalYear(connection);
    const resolvedFiscalYearId = activeFiscalYear?.id || null;

    if (!resolvedFiscalYearId) {
      await connection.rollback();
      return {
        status: "error",
        generatedCount: 0,
        totalTax: 0,
        message: "No fiscal year is available for tax generation."
      };
    }

    const policy = await getActiveTaxPolicy(resolvedFiscalYearId, connection);

    if (!policy) {
      await connection.rollback();
      return {
        status: "error",
        generatedCount: 0,
        totalTax: 0,
        fiscalYearId: resolvedFiscalYearId,
        fiscalYearName: activeFiscalYear?.name || null,
        message: "Active tax policy not found for the selected fiscal year."
      };
    }

    const employees = await getEmployeesForPayroll(connection, { deptCode, gazNg, reportFor, activeOnDate: validDate });
    const [batchResult] = await connection.query(
      `
        INSERT INTO tax_generation_batches (
          fiscal_year_id,
          payment_month,
          payment_year,
          dept_code,
          gaz_ng,
          report_for,
          generated_count,
          total_tax,
          generated_by
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)
      `,
      [
        resolvedFiscalYearId,
        Number(paymentMonth),
        Number(paymentYear),
        String(deptCode),
        String(gazNg),
        String(reportFor),
        generatedBy
      ]
    );
    const generationBatchId = batchResult.insertId;
    let generatedCount = 0;
    let totalTax = 0;
    const sample = [];

    for (const employee of employees) {
      const calculated = await calculateEmployeePayroll(
        employee,
        paymentMonth,
        paymentYear,
        connection,
        resolvedFiscalYearId,
        { useStoredTax: false, saveTaxSnapshot: true, generatedBy, generationBatchId }
      );

      generatedCount += 1;
      totalTax += Number(calculated.taxAmount || 0);

      if (sample.length < 5) {
        sample.push({
          employeeCode: employee.employeeCode,
          name: employee.name,
          taxAmount: Number(calculated.taxAmount || 0),
          annualizedIncome: Number(calculated.taxPreview?.annualizedIncome || 0),
          taxPolicyName: calculated.taxPolicyName || null,
          slab: calculated.taxPreview?.slab || null
        });
      }
    }

    await connection.query(
      "UPDATE tax_generation_batches SET generated_count = ?, total_tax = ? WHERE id = ?",
      [generatedCount, roundCurrency(totalTax), generationBatchId]
    );

    await connection.commit();

    return {
      status: "generated",
      generationBatchId,
      fiscalYearId: resolvedFiscalYearId,
      fiscalYearName: activeFiscalYear?.name || null,
      paymentMonth: Number(paymentMonth),
      paymentYear: Number(paymentYear),
      deptCode: String(deptCode),
      generatedCount,
      totalTax: roundCurrency(totalTax),
      generatedBy,
      sample
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getTaxGenerationHistory({ fiscalYearId = "", limit = 50 } = {}, connection = pool) {
  const params = [];
  const where = [];

  if (fiscalYearId) {
    where.push("tgb.fiscal_year_id = ?");
    params.push(fiscalYearId);
  }

  params.push(Number(limit) || 50);

  const [rows] = await connection.query(
    `
      SELECT
        tgb.id,
        tgb.fiscal_year_id AS fiscalYearId,
        fy.name AS fiscalYearName,
        tgb.payment_month AS paymentMonth,
        tgb.payment_year AS paymentYear,
        tgb.dept_code AS deptCode,
        tgb.gaz_ng AS gazNg,
        tgb.report_for AS reportFor,
        tgb.generated_count AS generatedCount,
        tgb.total_tax AS totalTax,
        tgb.generated_by AS generatedBy,
        tgb.generated_at AS generatedAt
      FROM tax_generation_batches tgb
      INNER JOIN fiscal_years fy ON fy.id = tgb.fiscal_year_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY tgb.generated_at DESC, tgb.id DESC
      LIMIT ?
    `,
    params
  );

  return rows;
}

export async function getTaxGenerationBatchDetails(batchId, connection = pool) {
  if (!batchId) {
    return null;
  }

  const [[batch]] = await connection.query(
    `
      SELECT
        tgb.id,
        tgb.fiscal_year_id AS fiscalYearId,
        fy.name AS fiscalYearName,
        tgb.payment_month AS paymentMonth,
        tgb.payment_year AS paymentYear,
        tgb.dept_code AS deptCode,
        tgb.gaz_ng AS gazNg,
        tgb.report_for AS reportFor,
        tgb.generated_count AS generatedCount,
        tgb.total_tax AS totalTax,
        tgb.generated_by AS generatedBy,
        tgb.generated_at AS generatedAt
      FROM tax_generation_batches tgb
      INNER JOIN fiscal_years fy ON fy.id = tgb.fiscal_year_id
      WHERE tgb.id = ?
      LIMIT 1
    `,
    [batchId]
  );

  if (!batch) {
    return null;
  }

  const [rows] = await connection.query(
    `
      SELECT
        ets.id,
        ets.employee_code AS employeeCode,
        e.name AS employeeName,
        e.department AS employeeDepartment,
        e.designation AS employeeDesignation,
        ets.gross_pay AS grossPay,
        ets.taxable_income AS taxableIncome,
        ets.annualized_income AS annualizedIncome,
        ets.effective_taxable_income AS effectiveTaxableIncome,
        ets.prior_employer_tax_credit AS priorEmployerTaxCredit,
        ets.company_tax_paid_ytd AS companyTaxPaidYTD,
        ets.credit_balance AS creditBalance,
        ets.remaining_annual_tax AS remainingAnnualTax,
        ets.months_remaining AS monthsRemaining,
        ets.tax_amount AS taxAmount,
        ets.annual_amount AS annualAmount,
        ets.tax_policy_name AS taxPolicyName,
        ets.tax_basis AS taxBasis,
        ets.slab_sr_no AS slabSrNo,
        ets.slab_from_income AS slabFromIncome,
        ets.slab_to_income AS slabToIncome,
        ets.slab_rate AS slabRate,
        ets.slab_fixed_tax AS slabFixedTax,
        ets.generated_by AS generatedBy,
        ets.generated_at AS generatedAt
      FROM employee_tax_snapshots ets
      LEFT JOIN employees e ON e.employee_no = ets.employee_code
      WHERE ets.generation_batch_id = ?
      ORDER BY CAST(ets.employee_code AS UNSIGNED), ets.employee_code
    `,
    [batchId]
  );

  const snapshots = rows.map((row) => ({
    ...row,
    grossPay: Number(row.grossPay || 0),
    taxableIncome: Number(row.taxableIncome || 0),
    annualizedIncome: Number(row.annualizedIncome || 0),
    effectiveTaxableIncome: Number(row.effectiveTaxableIncome || 0),
    priorEmployerTaxCredit: Number(row.priorEmployerTaxCredit || 0),
    companyTaxPaidYTD: Number(row.companyTaxPaidYTD || 0),
    creditBalance: Number(row.creditBalance || 0),
    remainingAnnualTax: Number(row.remainingAnnualTax || 0),
    monthsRemaining: row.monthsRemaining === null || row.monthsRemaining === undefined ? null : Number(row.monthsRemaining),
    taxAmount: Number(row.taxAmount || 0),
    annualAmount: Number(row.annualAmount || 0),
    slab: row.slabSrNo === null || row.slabSrNo === undefined
      ? null
      : {
          srNo: Number(row.slabSrNo || 0),
          fromIncome: Number(row.slabFromIncome || 0),
          toIncome: row.slabToIncome === null || row.slabToIncome === undefined ? null : Number(row.slabToIncome),
          rate: Number(row.slabRate || 0),
          fixedTax: Number(row.slabFixedTax || 0)
        }
  }));

  return {
    batch: {
      ...batch,
      generatedCount: Number(batch.generatedCount || 0),
      totalTax: Number(batch.totalTax || 0)
    },
    snapshots
  };
}

export async function processPayroll({ paymentMonth, paymentYear, deptCode = "999", gazNg = "A", reportFor = "All", processedBy = "Hospital Admin" }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const validDate = monthEndDate(paymentMonth, paymentYear);
    const matchedFiscalYear = await getFiscalYearForDate(validDate, connection);
    const activeFiscalYear = matchedFiscalYear || await getActiveFiscalYear(connection);
    const fiscalYearId = activeFiscalYear?.id || null;

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
        "INSERT INTO payroll_runs (fiscal_year_id, payment_month, payment_year, dept_code, status, processed_by) VALUES (?, ?, ?, ?, 'draft', ?)",
        [fiscalYearId, paymentMonth, paymentYear, String(deptCode), processedBy]
      );
      runId = result.insertId;
    } else {
      await connection.query(
        "UPDATE payroll_runs SET fiscal_year_id = ?, processed_by = ? WHERE id = ?",
        [fiscalYearId, processedBy, runId]
      );
      await connection.query("DELETE FROM payroll_run_items WHERE payroll_run_id = ?", [runId]);
    }

    const employees = await getEmployeesForPayroll(connection, { deptCode, gazNg, reportFor, activeOnDate: validDate });
    const results = [];

    for (const employee of employees) {
      const calculated = await calculateEmployeePayroll(employee, paymentMonth, paymentYear, connection, fiscalYearId);
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

      if (Array.isArray(calculated.advanceRecoveries) && calculated.advanceRecoveries.length) {
        await recordEmployeeAdvanceRecoveries({
          connection,
          payrollRunId: runId,
          payrollRunItemId: itemResult.insertId,
          employeeCode: employee.employeeCode,
          paymentMonth,
          paymentYear,
          recoveries: calculated.advanceRecoveries,
          createdBy: processedBy
        });
      }

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
        netPay: calculated.netPay,
        taxAmount: calculated.taxAmount || 0,
        taxPolicyName: calculated.taxPolicyName || null,
        taxPreview: calculated.taxPreview || null,
        details: calculated.details || []
      });
    }

    const journalEntry = await createPayrollJournalEntry({
      connection,
      payrollRunId: runId,
      fiscalYearId,
      paymentMonth,
      paymentYear,
      deptCode,
      processedBy,
      employees: results
    });

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
      journalEntry,
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
        fiscal_year_id AS fiscalYearId,
        payment_month AS paymentMonth,
        payment_year AS paymentYear,
        dept_code AS deptCode,
        status,
        processed_at AS processedAt,
        processed_by AS processedBy,
        fy.name AS fiscalYearName,
        fy.start_date AS fiscalYearStartDate,
        fy.end_date AS fiscalYearEndDate
      FROM payroll_runs
      LEFT JOIN fiscal_years fy ON fy.id = payroll_runs.fiscal_year_id
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
        AND (e.stop_date IS NULL OR e.stop_date > CURDATE())
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
        pr.fiscal_year_id AS fiscalYearId,
        pr.payment_month AS paymentMonth,
        pr.payment_year AS paymentYear,
        pr.dept_code AS deptCode,
        pr.status,
        pr.processed_at AS processedAt,
        fy.name AS fiscalYearName,
        fy.start_date AS fiscalYearStartDate,
        fy.end_date AS fiscalYearEndDate,
        jorig.id AS journalId,
        jorig.reference_no AS journalReferenceNo,
        jorig.status AS journalStatus,
        jorig.posted_by AS journalPostedBy,
        jrev.id AS reversalJournalId,
        jrev.reference_no AS reversalJournalReferenceNo,
        jrev.status AS reversalJournalStatus,
        jrev.posted_by AS reversalJournalPostedBy,
        COUNT(pri.id) AS employeeCount,
        COALESCE(SUM(pri.gross_pay), 0) AS totalGross,
        COALESCE(SUM(pri.total_deductions), 0) AS totalDeductions,
        COALESCE(SUM(pri.net_pay), 0) AS totalNet
      FROM payroll_runs pr
      LEFT JOIN payroll_run_items pri ON pri.payroll_run_id = pr.id
      LEFT JOIN fiscal_years fy ON fy.id = pr.fiscal_year_id
      LEFT JOIN journal_entries jorig
        ON jorig.source_type = 'payroll_run'
       AND jorig.source_id = pr.id
      LEFT JOIN journal_entries jrev
        ON jrev.source_type = 'payroll_run_reversal'
       AND jrev.source_id = jorig.id
      WHERE (? = '' OR pr.payment_month = ?)
        AND (? = '' OR pr.payment_year = ?)
        AND (? = '' OR pr.dept_code = ?)
      GROUP BY pr.id, pr.fiscal_year_id, fy.name, fy.start_date, fy.end_date, jorig.id, jorig.reference_no, jorig.status, jorig.posted_by, jrev.id, jrev.reference_no, jrev.status, jrev.posted_by
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
        pr.fiscal_year_id AS fiscalYearId,
        pr.payment_month AS paymentMonth,
        pr.payment_year AS paymentYear,
        pr.dept_code AS deptCode,
        pr.status,
        pr.processed_at AS processedAt,
        pr.processed_by AS processedBy,
        fy.name AS fiscalYearName,
        fy.start_date AS fiscalYearStartDate,
        fy.end_date AS fiscalYearEndDate
      FROM payroll_runs pr
      LEFT JOIN fiscal_years fy ON fy.id = pr.fiscal_year_id
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
  const journalEntry = await getJournalEntryByPayrollRun(id);

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
    totals,
    journalEntry
  };
}

export async function reopenPayrollRun(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [[run]] = await connection.query(
      "SELECT id, payment_month AS month, payment_year AS year, dept_code AS deptCode, status FROM payroll_runs WHERE id = ? LIMIT 1",
      [id]
    );

    if (!run) {
      await connection.rollback();
      return "not_found";
    }

    const runStatus = String(run.status || "").toLowerCase();
    if (runStatus === "processed" || runStatus === "locked") {
      await reversePayrollJournalEntryByRun(id, connection, "Hospital Admin");
      await reverseEmployeeAdvanceRecoveriesByRun(id, "Hospital Admin", connection);
    }
    await connection.query("UPDATE payroll_runs SET status = 'draft', processed_at = NULL WHERE id = ?", [id]);
    await logAuditAction({
      action: "reopen",
      documentType: "payroll",
      documentNo: id,
      performedBy: "Hospital Admin",
      notes: `Reopened payroll run ${run.month}/${run.year} dept ${run.deptCode}.`
    });
    await connection.commit();
    return "reopened";
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function voidPayrollRun(id, voidedBy = "Hospital Admin") {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [[run]] = await connection.query(
      "SELECT id, payment_month AS month, payment_year AS year, dept_code AS deptCode, status FROM payroll_runs WHERE id = ? LIMIT 1",
      [id]
    );

    if (!run) {
      await connection.rollback();
      return "not_found";
    }

    const journal = await reversePayrollJournalEntryByRun(id, connection, voidedBy);
    await reverseEmployeeAdvanceRecoveriesByRun(id, voidedBy, connection);

    await connection.query("UPDATE payroll_runs SET status = 'void', processed_at = NULL WHERE id = ?", [id]);
    await logAuditAction({
      action: "void",
      documentType: "payroll",
      documentNo: id,
      performedBy: voidedBy,
      notes: `Voided payroll run ${run.month}/${run.year} dept ${run.deptCode}.`
    });

    await connection.commit();
    return { status: "voided", journal };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
        AND (e.stop_date IS NULL OR e.stop_date > ?)
        AND (ea.upto IS NULL OR ea.upto >= ?)
      GROUP BY LPAD(ea.allowance_code, 4, '0'), COALESCE(NULLIF(ea.description, ''), wc.description)
      ORDER BY CAST(wageCode AS UNSIGNED)
    `,
    [endingDate, endingDate]
  );
  const lines = rows.map((row) => {
    const numericCode = Number(row.wageCode || 0);
    const totalAmount = Number(row.totalAmount || 0);

    return {
      wageCode: row.wageCode,
      description: row.description,
      totalAmount: isDeductionWageCode(numericCode) ? -Math.abs(totalAmount) : totalAmount
    };
  });
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
